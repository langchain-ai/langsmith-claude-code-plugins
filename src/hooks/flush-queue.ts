/**
 * Detached queue flusher.
 *
 * Started by a hook and outliving it, this uploads every queued run in order
 * and removes each entry only once LangSmith has confirmed it.
 */

import { Client } from "langsmith";
import { createSecretAnonymizer } from "langsmith/anonymizer";
import { join } from "node:path";
import { initHook } from "../utils/hook-init.js";
import { debug, warn } from "../logger.js";
import {
  discardEmptyQueue,
  listQueues,
  nextQueued,
  foreignQueueLooksAbandoned,
  queueDir,
  queueOrigin,
  removeQueued,
  recordFailure,
  runIsTooOldToUpload,
} from "../queue.js";
import { safeName } from "../utils/session-store.js";
import { releaseLock, tryAcquireLock } from "../utils/file-lock.js";
import { createRunTree } from "../privacy.js";
import type { Config } from "../config.js";

function flusherClient(config: Config): Client {
  const anonymizer = config.redact
    ? createSecretAnonymizer(
        config.redactExtraRules ? { extraRules: config.redactExtraRules } : undefined,
      )
    : undefined;
  return new Client({
    apiKey: config.apiKey || undefined,
    apiUrl: config.apiBaseUrl,
    anonymizer,
    autoBatchTracing: false,
  });
}

// postRun reports success either way, so the upload it makes underneath is the only place a failure shows.
function watchUploadFailures(client: Client): () => unknown {
  let failure: unknown;
  const createRun = client.createRun.bind(client);
  client.createRun = async (...args: Parameters<Client["createRun"]>) => {
    try {
      return await createRun(...args);
    } catch (err) {
      failure = err;
      throw err;
    }
  };
  return () => {
    const seen = failure;
    failure = undefined;
    return seen;
  };
}

async function flushQueue(dir: string, config: Config, origin: string): Promise<void> {
  const flushTarget = `${dir}.flush`;
  if (!tryAcquireLock(flushTarget)) {
    debug(`Another flusher already owns ${dir}`);
    return;
  }
  const client = flusherClient(config);
  const lastUploadError = watchUploadFailures(client);
  try {
    for (;;) {
      const entry = nextQueued(dir);
      if (!entry) break;
      if (runIsTooOldToUpload(entry)) {
        warn(`Dropping a queued run LangSmith will no longer accept: ${entry.queue_id}`);
        removeQueued(dir, entry.queue_id);
        continue;
      }
      if (entry.origin !== origin) {
        warn(`Leaving ${dir} alone: its next run was queued for a different LangSmith account`);
        break;
      }
      const runTree = createRunTree(
        { ...entry.run, client, replicas: config.replicas } as never,
        entry.tracing,
      );
      await runTree.postRun();
      const failure = lastUploadError();
      if (failure) {
        warn(`Queued run upload failed: ${failure}`);
        recordFailure(dir, entry.queue_id);
        return;
      }
      removeQueued(dir, entry.queue_id);
    }
    discardEmptyQueue(dir);
  } finally {
    releaseLock(flushTarget);
  }
}

export async function main(cwd: string, sessionId?: string): Promise<void> {
  const config = initHook(cwd);
  if (!config) return;
  const own = sessionId ? safeName(sessionId) : undefined;
  const origin = queueOrigin(config);
  for (const session of listQueues(config.stateFilePath)) {
    const dir = join(queueDir(config.stateFilePath), session);
    if (session !== own && !foreignQueueLooksAbandoned(dir)) {
      debug(`Not flushing ${dir}, which another session may still be writing to`);
      discardEmptyQueue(dir);
      continue;
    }
    try {
      await flushQueue(dir, config, origin);
    } catch (err) {
      warn(`Could not flush ${dir}: ${err}`);
    }
  }
}

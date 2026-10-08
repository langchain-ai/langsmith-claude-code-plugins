/**
 * Detached queue flusher.
 *
 * Started by a hook and outliving it, this uploads every queued run in order
 * and removes each entry only once LangSmith has confirmed it.
 */

import { Client } from "langsmith";
import { createSecretAnonymizer } from "langsmith/anonymizer";
import { initHook } from "../utils/hook-init.js";
import { debug, warn } from "../logger.js";
import {
  discardEmptyQueue,
  listQueues,
  nextQueued,
  foreignQueueIsFlushable,
  queueSessionDir,
  removeQueued,
  recordFailure,
  runIsTooOldToUpload,
} from "../queue.js";
import { releaseLock, tryAcquireLock } from "../state.js";
import { createRunTree } from "../privacy.js";
import type { Config } from "../config.js";

function flusherClient(config: Config): { client: Client; lastError: () => unknown } {
  const anonymizer = config.redact
    ? createSecretAnonymizer(
        config.redactExtraRules ? { extraRules: config.redactExtraRules } : undefined,
      )
    : undefined;
  const client = new Client({
    apiKey: config.apiKey || undefined,
    apiUrl: config.apiBaseUrl,
    anonymizer,
    autoBatchTracing: false,
  });
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
  return {
    client,
    lastError: () => {
      const seen = failure;
      failure = undefined;
      return seen;
    },
  };
}

async function flushQueue(dir: string, config: Config): Promise<void> {
  const lock = `${dir}.flush`;
  if (!tryAcquireLock(lock)) {
    debug(`Another flusher already owns ${dir}`);
    return;
  }
  const { client, lastError } = flusherClient(config);
  try {
    for (;;) {
      const entry = nextQueued(dir);
      if (!entry) break;
      if (runIsTooOldToUpload(entry)) {
        warn(`Dropping a queued run LangSmith will no longer accept: ${entry.queue_id}`);
        removeQueued(dir, entry.queue_id);
        continue;
      }
      const runTree = createRunTree(
        { ...entry.run, client, replicas: config.replicas } as never,
        entry.tracing,
      );
      await runTree.postRun();
      const failure = lastError();
      if (failure) {
        warn(`Queued run upload failed, leaving it for a later retry: ${failure}`);
        recordFailure(dir, entry.queue_id);
        return;
      }
      removeQueued(dir, entry.queue_id);
    }
    discardEmptyQueue(dir);
  } finally {
    releaseLock(lock);
  }
}

export async function main(cwd: string, sessionId?: string): Promise<void> {
  const config = initHook(cwd);
  if (!config) return;
  const own = sessionId ? queueSessionDir(config.stateFilePath, sessionId) : undefined;
  for (const dir of listQueues(config.stateFilePath)) {
    const mine = dir === own;
    if (!mine && !foreignQueueIsFlushable(dir)) {
      debug(`Leaving ${dir} to the session that still owns it`);
      continue;
    }
    try {
      await flushQueue(dir, config);
    } catch (err) {
      warn(`Could not flush ${dir}: ${err}`);
    }
  }
}

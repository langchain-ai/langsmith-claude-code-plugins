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
import { listQueueFiles, readQueue, removeQueued, recordFailure } from "../queue.js";
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

async function flushFile(path: string, config: Config): Promise<void> {
  const lock = `${path}.flush`;
  if (!tryAcquireLock(lock)) {
    debug(`Another flusher already owns ${path}`);
    return;
  }
  const { client, lastError } = flusherClient(config);
  try {
    for (;;) {
      const entry = readQueue(path)[0];
      if (!entry) break;
      const runTree = createRunTree(
        { ...entry.run, client, replicas: config.replicas } as never,
        entry.tracing,
      );
      await runTree.postRun();
      const failure = lastError();
      if (failure) {
        warn(`Queued run upload failed, leaving it for a later retry: ${failure}`);
        await recordFailure(path, entry.queue_id);
        return;
      }
      await removeQueued(path, entry.queue_id);
    }
  } finally {
    releaseLock(lock);
  }
}

export async function main(cwd: string): Promise<void> {
  const config = initHook(cwd);
  if (!config) return;
  for (const path of listQueueFiles(config.stateFilePath)) {
    try {
      await flushFile(path, config);
    } catch (err) {
      warn(`Could not flush ${path}: ${err}`);
    }
  }
}

/**
 * Detached queue flusher.
 *
 * Started by a hook and outliving it, this uploads every queued run in order,
 * removes each entry only once LangSmith has confirmed it, and notes that
 * delivery in the plugin's own record of the turn.
 */

import { Client } from "langsmith";
import { createSecretAnonymizer } from "langsmith/anonymizer";
import { join } from "node:path";
import { initHook } from "../utils/hook-init.js";
import { debug, warn } from "../logger.js";
import { FOREIGN_QUEUE_MIN_RECORD_AGE_MS } from "../constants.js";
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
import {
  discardTurnRecord,
  listRecordedSessions,
  listTurnRecords,
  readTurnRecord,
  recordDelivered,
  recordsIdleMs,
  turnRecordRoot,
} from "../turn-record.js";
import { discardDirIfEmpty, safeName } from "../utils/session-store.js";
import { watchUploads, type UploadWatch } from "../upload-confirm.js";
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

async function uploadQueued(
  dir: string,
  config: Config,
  origin: string,
  client: Client,
  watch: UploadWatch,
): Promise<boolean> {
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
      return false;
    }
    const runTree = createRunTree(
      { ...entry.run, client, replicas: config.replicas } as never,
      entry.tracing,
    );
    await runTree.postRun();
    const failure = watch.failure();
    if (failure) {
      warn(`Queued run upload failed: ${failure}`);
      recordFailure(dir, entry.queue_id);
      return false;
    }
    if (entry.record && typeof entry.run.id === "string") {
      recordDelivered(entry.record, entry.run.id);
    }
    removeQueued(dir, entry.queue_id);
  }
  discardEmptyQueue(dir);
  return true;
}

function clearFinishedTurns(recordDir: string, origin: string): void {
  for (const path of listTurnRecords(recordDir)) {
    const record = readTurnRecord(path);
    if (!record || record.origin !== origin) continue;
    const everyChildLanded = record.children.every((child) => record.delivered.has(child.run_id));
    if (record.closed && everyChildLanded) discardTurnRecord(path);
  }
  discardDirIfEmpty(recordDir);
}

async function drainSession(session: string, config: Config, origin: string): Promise<void> {
  const dir = join(queueDir(config.stateFilePath), session);
  const flushTarget = `${dir}.flush`;
  if (!tryAcquireLock(flushTarget)) {
    debug(`Another flusher already owns ${dir}`);
    return;
  }
  const client = flusherClient(config);
  const watch = watchUploads(client);
  const records = join(turnRecordRoot(config.stateFilePath), session);
  try {
    await uploadQueued(dir, config, origin, client, watch);
    clearFinishedTurns(records, origin);
  } finally {
    releaseLock(flushTarget);
  }
}

function looksAbandoned(session: string, stateFilePath: string): boolean {
  const queued = join(queueDir(stateFilePath), session);
  if (foreignQueueLooksAbandoned(queued)) return true;
  return (
    recordsIdleMs(join(turnRecordRoot(stateFilePath), session)) >= FOREIGN_QUEUE_MIN_RECORD_AGE_MS
  );
}

export async function main(cwd: string, sessionId?: string): Promise<void> {
  const config = initHook(cwd);
  if (!config) return;
  const own = sessionId ? safeName(sessionId) : undefined;
  const origin = queueOrigin(config);
  const sessions = new Set([
    ...listQueues(config.stateFilePath),
    ...listRecordedSessions(config.stateFilePath),
  ]);
  if (own) sessions.add(own);
  for (const session of [...sessions].sort()) {
    if (session !== own && !looksAbandoned(session, config.stateFilePath)) {
      debug(`Not flushing ${session}, which another session may still be writing to`);
      discardEmptyQueue(join(queueDir(config.stateFilePath), session));
      continue;
    }
    try {
      await drainSession(session, config, origin);
    } catch (err) {
      warn(`Could not flush ${session}: ${err}`);
    }
  }
}

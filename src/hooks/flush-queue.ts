/**
 * Detached queue flusher.
 *
 * Started by a hook and outliving it, this uploads every queued run in order,
 * removes each entry only once LangSmith has confirmed it, and then settles the
 * repository and author on the turns those runs belong to.
 */

import { Client } from "langsmith";
import { createSecretAnonymizer } from "langsmith/anonymizer";
import { join } from "node:path";
import { initHook } from "../utils/hook-init.js";
import { debug, warn } from "../logger.js";
import { FOREIGN_QUEUE_MIN_RECORD_AGE_MS } from "../constants.js";
import {
  abandonQueued,
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
  listRecordedSessions,
  listTurnRecords,
  readTurnRecord,
  recordDelivered,
  recordRun,
  recordsIdleMs,
  turnRecordRoot,
} from "../turn-record.js";
import { reconcileAndClear } from "../reconcile.js";
import { settledRunConfig } from "../repo-attribution.js";
import { discardDirIfEmpty, safeName } from "../utils/session-store.js";
import { watchUploads, type UploadWatch } from "../upload-confirm.js";
import { releaseLock, tryAcquireLock } from "../utils/file-lock.js";
import { createRunTree } from "../privacy.js";
import type { Config } from "../config.js";
import type { QueuedRun } from "../types.js";

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

function writeBack(
  entry: QueuedRun,
  settled: { run: Record<string, unknown>; open: boolean },
): boolean {
  if (!entry.record || typeof entry.run.id !== "string") return true;
  const wrote = entry.where
    ? recordRun({
        path: entry.record,
        run: settled.run,
        tracing: entry.tracing,
        origin: entry.origin,
        closesAt: settled.open ? (entry.run.end_time as string | undefined) : undefined,
      })
    : true;
  return wrote && recordDelivered(entry.record, entry.run.id);
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
      abandonQueued(entry);
      removeQueued(dir, entry.queue_id);
      continue;
    }
    if (entry.origin !== origin) {
      warn(`Leaving ${dir} alone: its next run was queued for a different LangSmith account`);
      return false;
    }
    const settled = entry.where
      ? settledRunConfig(entry.run, entry.where)
      : { run: entry.run, open: false };
    const runTree = createRunTree(
      { ...settled.run, client, replicas: config.replicas } as never,
      entry.tracing,
    );
    await runTree.postRun();
    const failure = watch.failure();
    if (failure) {
      warn(`Queued run upload failed: ${failure}`);
      recordFailure(dir, entry.queue_id);
      return false;
    }
    if (!writeBack(entry, settled)) {
      warn(`Could not write ${String(entry.run.id)} back to its turn record`);
      recordFailure(dir, entry.queue_id);
      return false;
    }
    removeQueued(dir, entry.queue_id);
  }
  discardEmptyQueue(dir);
  return true;
}

async function settleTurns(
  recordDir: string,
  config: Config,
  origin: string,
  client: Client,
  watch: UploadWatch,
): Promise<void> {
  for (const path of listTurnRecords(recordDir)) {
    const record = readTurnRecord(path);
    if (!record) continue;
    if (record.origin !== origin) {
      debug(`Leaving ${path} alone: it was traced for a different LangSmith account`);
      continue;
    }
    try {
      await reconcileAndClear({ record, client, replicas: config.replicas, watch });
    } catch (err) {
      warn(`Could not settle the repository on ${path}: ${err}`);
    }
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
    await settleTurns(records, config, origin, client, watch);
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

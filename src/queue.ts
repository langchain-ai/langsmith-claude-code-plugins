/**
 * Durable upload queue, an ordered list of finished runs on disk.
 *
 * A hook appends to it and exits without touching the network; a detached
 * flusher uploads the entries in order and removes each one only once its
 * upload has been confirmed.
 *
 * Each run is its own file, published by rename, so parallel hooks never
 * read-modify-write the same file and no lock guards the append.
 */

import { mkdirSync, readFileSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { createHmac, randomUUID } from "node:crypto";
import {
  EMPTY_QUEUE_MIN_IDLE_MS,
  FOREIGN_QUEUE_MIN_RECORD_AGE_MS,
  PRIVATE_DIR_MODE,
  PRIVATE_FILE_MODE,
  QUEUE_DIR_NAME,
  QUEUE_FILE_SUFFIX,
  QUEUE_ID_TIME_WIDTH,
  QUEUE_MAX_ATTEMPTS,
  QUEUE_MAX_ENTRIES,
  QUEUE_ORIGIN_LENGTH,
  QUEUE_RUN_MAX_AGE_MS,
  QUEUE_TEMP_SUFFIX,
} from "./constants.js";
import { publishByRename } from "./utils/atomic-file.js";
import {
  discardDirIfEmpty,
  listStoredSessions,
  storeDir,
  storeRoot,
} from "./utils/session-store.js";
import { runConfigForMode } from "./privacy.js";
import { recordDelivered } from "./turn-record.js";
import { debug, warn } from "./logger.js";
import type { QueueDestination, QueuedRun, ToolOrigin, TracingMode } from "./types.js";

/** Identifies the account a run was queued for, from the key and everywhere the upload would go. */
export function queueOrigin(destination: QueueDestination): string {
  const identity = JSON.stringify([
    destination.apiBaseUrl,
    destination.replicas ?? null,
    destination.redact ?? false,
    destination.redactExtraRules ?? null,
  ]);
  return createHmac("sha256", destination.apiKey)
    .update(identity)
    .digest("hex")
    .slice(0, QUEUE_ORIGIN_LENGTH);
}

export const queueDir = (stateFilePath: string): string => storeRoot(stateFilePath, QUEUE_DIR_NAME);

export const queueSessionDir = (stateFilePath: string, sessionId: string): string =>
  storeDir(stateFilePath, QUEUE_DIR_NAME, sessionId);

export const listQueues = (stateFilePath: string): string[] =>
  listStoredSessions(stateFilePath, QUEUE_DIR_NAME);

function names(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function entryIds(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((name) => name.endsWith(QUEUE_FILE_SUFFIX))
      .sort()
      .map((name) => name.slice(0, -QUEUE_FILE_SUFFIX.length));
  } catch {
    return [];
  }
}

function entryPath(dir: string, queueId: string): string {
  return join(dir, `${queueId}${QUEUE_FILE_SUFFIX}`);
}

function readEntry(dir: string, queueId: string): QueuedRun | undefined {
  try {
    const parsed = JSON.parse(readFileSync(entryPath(dir, queueId), "utf-8")) as QueuedRun;
    return parsed && parsed.run ? { ...parsed, queue_id: queueId } : undefined;
  } catch {
    return undefined;
  }
}

export function readQueue(dir: string): QueuedRun[] {
  return entryIds(dir)
    .map((queueId) => readEntry(dir, queueId))
    .filter((entry): entry is QueuedRun => entry !== undefined);
}

export function nextQueued(dir: string): QueuedRun | undefined {
  for (const queueId of entryIds(dir)) {
    const entry = readEntry(dir, queueId);
    if (entry) return entry;
    removeQueued(dir, queueId);
  }
  return undefined;
}

function publish(dir: string, queueId: string, entry: Omit<QueuedRun, "queue_id">): void {
  publishByRename(
    entryPath(dir, queueId),
    JSON.stringify(entry),
    QUEUE_TEMP_SUFFIX,
    PRIVATE_FILE_MODE,
  );
}

function trim(dir: string): void {
  const ids = entryIds(dir);
  for (const queueId of ids.slice(0, Math.max(0, ids.length - QUEUE_MAX_ENTRIES))) {
    removeQueued(dir, queueId);
  }
}

export async function enqueueRun(
  stateFilePath: string,
  sessionId: string,
  run: Record<string, unknown>,
  tracing: TracingMode,
  origin: string,
  record?: string,
  where?: ToolOrigin,
): Promise<void> {
  const dir = queueSessionDir(stateFilePath, sessionId);
  const queueId = `${String(Date.now()).padStart(QUEUE_ID_TIME_WIDTH, "0")}-${randomUUID()}`;
  try {
    mkdirSync(dir, { recursive: true, mode: PRIVATE_DIR_MODE });
    // Filter before the write, so a muted thread's content never lands on disk.
    publish(dir, queueId, {
      tracing,
      attempts: 0,
      origin,
      record,
      where,
      run: runConfigForMode(run, tracing),
    });
    trim(dir);
    debug(`Queued run for upload in ${entryPath(dir, queueId)}`);
  } catch (err) {
    warn(`Could not queue run for upload: ${err}`);
  }
}

/** A run nobody will upload still has to report in, or its turn waits for it forever. */
export function abandonQueued(entry: QueuedRun): void {
  if (entry.record && typeof entry.run.id === "string") recordDelivered(entry.record, entry.run.id);
}

export function removeQueued(dir: string, queueId: string): void {
  try {
    unlinkSync(entryPath(dir, queueId));
  } catch {
    /* ignore */
  }
}

export function recordFailure(dir: string, queueId: string): void {
  const entry = readEntry(dir, queueId);
  if (!entry) return;
  const attempts = (entry.attempts ?? 0) + 1;
  if (attempts >= QUEUE_MAX_ATTEMPTS) {
    warn(`Dropping a queued run after ${attempts} failed uploads: ${queueId}`);
    abandonQueued(entry);
    removeQueued(dir, queueId);
    return;
  }
  try {
    publish(dir, queueId, {
      tracing: entry.tracing,
      attempts,
      origin: entry.origin,
      record: entry.record,
      where: entry.where,
      run: entry.run,
    });
  } catch (err) {
    warn(`Could not record a failed upload: ${err}`);
  }
}

export function discardEmptyQueue(dir: string, now: number = Date.now()): void {
  if (entryIds(dir).length > 0) return;
  // A folder created a moment ago has not had its first record written yet.
  if (queueIdleMs(dir, now) < EMPTY_QUEUE_MIN_IDLE_MS) return;
  // A hook killed mid-publish leaves a staged file the queue ignores but rmdir does not.
  for (const name of names(dir).filter((entry) => entry.endsWith(QUEUE_TEMP_SUFFIX))) {
    try {
      unlinkSync(join(dir, name));
    } catch {
      /* ignore */
    }
  }
  discardDirIfEmpty(dir);
}

export function queueIdleMs(dir: string, now: number = Date.now()): number {
  try {
    return now - statSync(dir).mtimeMs;
  } catch {
    return 0;
  }
}

/** When a record was queued, read from the entry name the queue sorts by. */
function queuedAtMs(queueId: string): number | undefined {
  const queuedAt = Number(queueId.slice(0, QUEUE_ID_TIME_WIDTH));
  return Number.isFinite(queuedAt) && queuedAt > 0 ? queuedAt : undefined;
}

export function oldestQueuedAtMs(dir: string): number | undefined {
  const [oldest] = entryIds(dir);
  return oldest === undefined ? undefined : queuedAtMs(oldest);
}

export function foreignQueueLooksAbandoned(dir: string, now: number = Date.now()): boolean {
  const queuedAt = oldestQueuedAtMs(dir);
  if (queuedAt === undefined) return false;
  return now - queuedAt >= FOREIGN_QUEUE_MIN_RECORD_AGE_MS;
}

export function runIsTooOldToUpload(entry: QueuedRun, now: number = Date.now()): boolean {
  const started = new Date(entry.run.start_time as string | number).getTime();
  if (Number.isFinite(started)) return now - started >= QUEUE_RUN_MAX_AGE_MS;
  // Nothing readable says when the run began, so age it by when it was written down instead.
  const queuedAt = queuedAtMs(entry.queue_id);
  return queuedAt === undefined || now - queuedAt >= QUEUE_RUN_MAX_AGE_MS;
}

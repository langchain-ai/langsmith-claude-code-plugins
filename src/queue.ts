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

import { mkdirSync, readFileSync, readdirSync, rmdirSync, statSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  QUEUE_DIR_NAME,
  QUEUE_FILE_SUFFIX,
  QUEUE_ID_TIME_WIDTH,
  QUEUE_MAX_ATTEMPTS,
  QUEUE_MAX_ENTRIES,
  QUEUE_RUN_MAX_AGE_MS,
  QUEUE_SESSION_UNSAFE_CHARS,
  FOREIGN_QUEUE_MIN_RECORD_AGE_MS,
  EMPTY_QUEUE_MIN_IDLE_MS,
  QUEUE_TEMP_SUFFIX,
} from "./constants.js";
import { publishByRename } from "./utils/atomic-file.js";
import { runConfigForMode } from "./privacy.js";
import { debug, warn } from "./logger.js";
import type { QueuedRun, TracingMode } from "./types.js";

export function queueDir(stateFilePath: string): string {
  return join(dirname(stateFilePath), QUEUE_DIR_NAME);
}

export function queueSessionDir(stateFilePath: string, sessionId: string): string {
  return join(queueDir(stateFilePath), sessionId.replace(QUEUE_SESSION_UNSAFE_CHARS, "_"));
}

export function listQueues(stateFilePath: string): string[] {
  const root = queueDir(stateFilePath);
  try {
    return readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(root, entry.name))
      .sort();
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
  publishByRename(entryPath(dir, queueId), JSON.stringify(entry), QUEUE_TEMP_SUFFIX);
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
): Promise<void> {
  const dir = queueSessionDir(stateFilePath, sessionId);
  const queueId = `${String(Date.now()).padStart(QUEUE_ID_TIME_WIDTH, "0")}-${randomUUID()}`;
  try {
    mkdirSync(dir, { recursive: true });
    // Filter before the write, so a muted thread's content never lands on disk.
    publish(dir, queueId, {
      tracing,
      attempts: 0,
      run: runConfigForMode(run, tracing),
    });
    trim(dir);
    debug(`Queued run for upload in ${entryPath(dir, queueId)}`);
  } catch (err) {
    warn(`Could not queue run for upload: ${err}`);
  }
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
    removeQueued(dir, queueId);
    return;
  }
  try {
    publish(dir, queueId, { tracing: entry.tracing, attempts, run: entry.run });
  } catch (err) {
    warn(`Could not record a failed upload: ${err}`);
  }
}

export function discardEmptyQueue(dir: string, now: number = Date.now()): void {
  if (entryIds(dir).length > 0) return;
  // A folder created a moment ago has not had its first record written yet.
  if (queueIdleMs(dir, now) < EMPTY_QUEUE_MIN_IDLE_MS) return;
  try {
    rmdirSync(dir);
  } catch {
    /* ignore */
  }
}

export function queueIdleMs(dir: string, now: number = Date.now()): number {
  try {
    return now - statSync(dir).mtimeMs;
  } catch {
    return 0;
  }
}

/** When the oldest record was queued, read from the entry name the queue sorts by. */
export function oldestQueuedAtMs(dir: string): number | undefined {
  const [oldest] = entryIds(dir);
  if (oldest === undefined) return undefined;
  const queuedAt = Number(oldest.slice(0, QUEUE_ID_TIME_WIDTH));
  return Number.isFinite(queuedAt) && queuedAt > 0 ? queuedAt : undefined;
}

export function foreignQueueIsFlushable(dir: string, now: number = Date.now()): boolean {
  const queuedAt = oldestQueuedAtMs(dir);
  if (queuedAt === undefined) return false;
  return now - queuedAt >= FOREIGN_QUEUE_MIN_RECORD_AGE_MS;
}

export function runIsTooOldToUpload(entry: QueuedRun, now: number = Date.now()): boolean {
  const started = new Date(entry.run.start_time as string | number).getTime();
  return Number.isFinite(started) && now - started >= QUEUE_RUN_MAX_AGE_MS;
}

/**
 * Durable upload queue, an ordered list of finished runs on disk.
 *
 * A hook appends to it and exits without touching the network; a detached
 * flusher uploads the entries in order and removes each one only once its
 * upload has been confirmed.
 */

import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  QUEUE_DIR_NAME,
  QUEUE_FILE_SUFFIX,
  QUEUE_MAX_ATTEMPTS,
  QUEUE_MAX_ENTRIES,
} from "./constants.js";
import { withFileLock } from "./state.js";
import { runConfigForMode } from "./privacy.js";
import { debug, warn } from "./logger.js";
import type { QueuedRun, TracingMode } from "./types.js";

export function queueDir(stateFilePath: string): string {
  return join(dirname(stateFilePath), QUEUE_DIR_NAME);
}

export function queueFilePath(stateFilePath: string, sessionId: string): string {
  return join(queueDir(stateFilePath), `${sessionId.replace(/[^\w.-]/g, "_")}${QUEUE_FILE_SUFFIX}`);
}

export function listQueueFiles(stateFilePath: string): string[] {
  try {
    return readdirSync(queueDir(stateFilePath))
      .filter((name) => name.endsWith(QUEUE_FILE_SUFFIX))
      .sort()
      .map((name) => join(queueDir(stateFilePath), name));
  } catch {
    return [];
  }
}

export function readQueue(path: string): QueuedRun[] {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    return Array.isArray(parsed) ? (parsed.filter(isQueuedRun) as QueuedRun[]) : [];
  } catch {
    return [];
  }
}

function isQueuedRun(value: unknown): boolean {
  const entry = value as QueuedRun | null;
  return Boolean(entry && typeof entry.queue_id === "string" && entry.run);
}

function writeQueue(path: string, entries: QueuedRun[]): void {
  if (entries.length === 0) {
    try {
      unlinkSync(path);
    } catch {
    }
    return;
  }
  writeFileSync(path, JSON.stringify(entries));
}

export async function enqueueRun(
  stateFilePath: string,
  sessionId: string,
  run: Record<string, unknown>,
  tracing: TracingMode,
): Promise<void> {
  const path = queueFilePath(stateFilePath, sessionId);
  try {
    mkdirSync(queueDir(stateFilePath), { recursive: true });
    await withFileLock(path, () => {
      const entries = readQueue(path);
      // Filter before the write, so a muted thread's content never lands on disk.
      entries.push({
        queue_id: randomUUID(),
        tracing,
        attempts: 0,
        run: runConfigForMode(run, tracing),
      });
      writeQueue(path, entries.slice(-QUEUE_MAX_ENTRIES));
    });
    debug(`Queued run for upload in ${path}`);
  } catch (err) {
    warn(`Could not queue run for upload: ${err}`);
  }
}

export async function removeQueued(path: string, queueId: string): Promise<void> {
  await withFileLock(path, () => {
    writeQueue(
      path,
      readQueue(path).filter((entry) => entry.queue_id !== queueId),
    );
  });
}

export async function recordFailure(path: string, queueId: string): Promise<void> {
  await withFileLock(path, () => {
    const entries = readQueue(path)
      .map((entry) =>
        entry.queue_id === queueId ? { ...entry, attempts: (entry.attempts ?? 0) + 1 } : entry,
      )
      .filter((entry) => entry.attempts < QUEUE_MAX_ATTEMPTS);
    writeQueue(path, entries);
  });
}

/**
 * Cross-process file locking, used to serialise writers that share a file.
 */

import {
  readFileSync,
  writeFileSync,
  linkSync,
  mkdirSync,
  openSync,
  closeSync,
  unlinkSync,
} from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { LOCK_STAGING_SUFFIX, PRIVATE_FILE_MODE } from "../constants.js";

const LOCK_TIMEOUT_MS = 5_000;
const LOCK_RETRY_MS = 20;

function lockPath(stateFilePath: string): string {
  return `${stateFilePath}.lock`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireLock(stateFilePath: string): Promise<void> {
  const lock = lockPath(stateFilePath);
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  mkdirSync(dirname(stateFilePath), { recursive: true });
  while (Date.now() < deadline) {
    try {
      // O_EXCL | O_CREAT: fails atomically if the file already exists.
      const fd = openSync(lock, "wx", PRIVATE_FILE_MODE);
      closeSync(fd);
      return;
    } catch {
      await sleep(LOCK_RETRY_MS);
    }
  }
  // Stale lock — remove it and proceed rather than deadlocking.
  try {
    unlinkSync(lock);
  } catch {
    /* ignore */
  }
}

export function releaseLock(stateFilePath: string): void {
  try {
    unlinkSync(lockPath(stateFilePath));
  } catch {
    /* ignore */
  }
}

function claimLock(lock: string): boolean {
  // Linked into place rather than created then written, since a peer that reads a
  // lock in that gap sees no pid and takes it for abandoned.
  const staging = `${lock}.${randomUUID()}${LOCK_STAGING_SUFFIX}`;
  try {
    writeFileSync(staging, String(process.pid), { mode: PRIVATE_FILE_MODE });
  } catch {
    return false;
  }
  try {
    linkSync(staging, lock);
    return true;
  } catch {
    return false;
  } finally {
    try {
      unlinkSync(staging);
    } catch {
      /* ignore */
    }
  }
}

function holderIsGone(lock: string): boolean {
  let pid: number;
  try {
    pid = Number(readFileSync(lock, "utf-8"));
  } catch {
    return false;
  }
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return false;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code !== "EPERM";
  }
}

/** Single attempt, for a worker that should stand aside rather than queue behind a peer. */
export function tryAcquireLock(filePath: string): boolean {
  const lock = lockPath(filePath);
  try {
    mkdirSync(dirname(filePath), { recursive: true });
  } catch {
    return false;
  }
  if (claimLock(lock)) return true;
  // A worker that died holding this would otherwise own it forever.
  if (!holderIsGone(lock)) return false;
  try {
    unlinkSync(lock);
  } catch {
    return false;
  }
  return claimLock(lock);
}

/** Run `fn` while holding the cross-process lock that guards `filePath`. */
export async function withFileLock<T>(filePath: string, fn: () => T | Promise<T>): Promise<T> {
  await acquireLock(filePath);
  try {
    return await fn();
  } finally {
    releaseLock(filePath);
  }
}

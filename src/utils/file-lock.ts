/**
 * Cross-process file locking, used to serialise writers that share a file.
 */

import { readFileSync, writeFileSync, linkSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { LOCK_STAGING_SUFFIX, PRIVATE_FILE_MODE } from "../constants.js";

function lockPath(stateFilePath: string): string {
  return `${stateFilePath}.lock`;
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

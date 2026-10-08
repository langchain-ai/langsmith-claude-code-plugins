/**
 * Persistent state management — tracks how far we've read in each session's
 * transcript so the Stop hook only processes new messages.
 */

import {
  readFileSync,
  writeFileSync,
  writeSync,
  linkSync,
  mkdirSync,
  openSync,
  closeSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { LOCK_STAGING_SUFFIX, STATE_TEMP_SUFFIX } from "./constants.js";
import type { TracingState, SessionState } from "./types.js";

// ─── Atomic read-modify-write ────────────────────────────────────────────────

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
      const fd = openSync(lock, "wx");
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
    writeFileSync(staging, String(process.pid));
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

/** Published by rename, since readers load state without the lock and must never see a half-written file. */
function publishState(stateFilePath: string, state: TracingState): void {
  const temp = `${stateFilePath}.${randomUUID()}${STATE_TEMP_SUFFIX}`;
  // "wx" refuses an existing path, so a planted symlink cannot redirect this write.
  const fd = openSync(temp, "wx");
  try {
    writeSync(fd, JSON.stringify(state, null, 2));
  } finally {
    closeSync(fd);
  }
  renameSync(temp, stateFilePath);
}

/**
 * Atomically read state, apply `fn`, and write the result back.
 * A file lock prevents concurrent PostToolUse hooks from clobbering each other.
 */
export async function atomicUpdateState(
  stateFilePath: string,
  fn: (state: TracingState) => TracingState,
): Promise<void> {
  await withFileLock(stateFilePath, () => {
    const state = loadState(stateFilePath);
    publishState(stateFilePath, fn(state));
  });
}

// ─── State helpers ──────────────────────────────────────────────────────────

export function loadState(stateFilePath: string): TracingState {
  try {
    const raw = readFileSync(stateFilePath, "utf-8");
    return JSON.parse(raw) as TracingState;
  } catch {
    return {};
  }
}

export function saveState(stateFilePath: string, state: TracingState): void {
  mkdirSync(dirname(stateFilePath), { recursive: true });
  publishState(stateFilePath, state);
}

export function getSessionState(state: TracingState, sessionId: string): SessionState {
  return (
    state[sessionId] ?? {
      last_line: -1,
      turn_count: 0,
      updated: "",
      task_run_map: {},
    }
  );
}

/** Join PostToolUse's committed write with cursor consumption of tool results.
 *  Call inside the state lock, after tracing has used the original modes. Keeping
 *  the first side lets a delayed Post reclaim immediately, without transcript
 *  rereads or retaining a history of completed IDs. Unfinished tools keep their
 *  snapshots across turn resets; SessionEnd is the definitive cleanup boundary.
 */
export function advanceToolTracingProgress(
  session: SessionState,
  ids: Iterable<string>,
  phase: "post" | "transcript",
): Pick<SessionState, "tool_tracing_modes" | "tool_tracing_progress"> {
  const modes = { ...session.tool_tracing_modes };
  const progress = { ...session.tool_tracing_progress };
  for (const id of ids) {
    // Transcript-only tools need no lifecycle bookkeeping.
    if (!Object.hasOwn(modes, id)) continue;
    if (progress[id] && progress[id] !== phase) {
      delete modes[id];
      delete progress[id];
    } else {
      progress[id] = phase;
    }
  }
  return { tool_tracing_modes: modes, tool_tracing_progress: progress };
}

// ─── Session pruning ───────────────────────────────────────────────────────

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Remove sessions whose `updated` timestamp is older than 24 hours.
 * Pruned sessions that are later resumed will skip to the end of their
 * transcript (handled by UserPromptSubmit's fresh-state logic), so there's
 * no risk of replaying old messages.
 */
export function pruneOldSessions(state: TracingState, now: number = Date.now()): TracingState {
  const cutoff = now - SESSION_MAX_AGE_MS;
  const pruned: TracingState = {};
  for (const [sessionId, session] of Object.entries(state)) {
    const updatedMs = session.updated ? new Date(session.updated).getTime() : 0;
    if (updatedMs >= cutoff) {
      pruned[sessionId] = session;
    }
  }
  return pruned;
}

export function updateSessionState(
  state: TracingState,
  sessionId: string,
  lastLine: number,
  turnCount: number,
  taskRunMap?: Record<string, { run_id: string; dotted_order: string }>,
  currentTurnRunId?: string,
): TracingState {
  const existingSession = state[sessionId] ?? {
    last_line: -1,
    turn_count: 0,
    updated: "",
    task_run_map: {},
  };

  return {
    ...state,
    [sessionId]: {
      ...existingSession,
      last_line: lastLine,
      turn_count: turnCount,
      updated: new Date().toISOString(),
      task_run_map: taskRunMap ?? existingSession.task_run_map,
      current_turn_run_id:
        currentTurnRunId !== undefined ? currentTurnRunId : existingSession.current_turn_run_id,
    },
  };
}

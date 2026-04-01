/**
 * Persistent state management — tracks how far we've read in each session's
 * transcript so the Stop hook only processes new messages.
 */

import { readFileSync, writeFileSync, mkdirSync, openSync, closeSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
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

function releaseLock(stateFilePath: string): void {
  try {
    unlinkSync(lockPath(stateFilePath));
  } catch {
    /* ignore */
  }
}

/**
 * Atomically read state, apply `fn`, and write the result back.
 * A file lock prevents concurrent PostToolUse hooks from clobbering each other.
 */
export async function atomicUpdateState(
  stateFilePath: string,
  fn: (state: TracingState) => TracingState,
): Promise<void> {
  await acquireLock(stateFilePath);
  try {
    const state = loadState(stateFilePath);
    writeFileSync(stateFilePath, JSON.stringify(fn(state), null, 2));
  } finally {
    releaseLock(stateFilePath);
  }
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
  writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
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

// ─── Session pruning ───────────────────────────────────────────────────────

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Remove sessions whose `updated` timestamp is older than SESSION_MAX_AGE_MS.
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
      task_run_map: taskRunMap
        ? { ...existingSession.task_run_map, ...taskRunMap }
        : existingSession.task_run_map,
      current_turn_run_id:
        currentTurnRunId !== undefined ? currentTurnRunId : existingSession.current_turn_run_id,
    },
  };
}

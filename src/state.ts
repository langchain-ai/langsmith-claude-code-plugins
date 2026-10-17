/**
 * Persistent state management — tracks how far we've read in each session's
 * transcript so the Stop hook only processes new messages.
 */

import { createStateStore, pruneStateEntries } from "@langchain/plugins-base/storage";
import { SESSION_MAX_AGE_MS } from "./constants.js";
import { warn } from "./logger.js";
import type { TracingState, SessionState } from "./types.js";

type SessionStore = ReturnType<typeof createStateStore<SessionState>>;

const stores = new Map<string, SessionStore>();

function storeFor(stateFilePath: string): SessionStore {
  let store = stores.get(stateFilePath);
  if (!store) {
    store = createStateStore<SessionState>({ path: stateFilePath, warn });
    stores.set(stateFilePath, store);
  }
  return store;
}

/**
 * Atomically read state, apply `fn`, and write the result back.
 * A file lock prevents concurrent PostToolUse hooks from clobbering each other.
 * When another process keeps the lock past a short wait, the change is saved as
 * a pending patch that readers overlay and the next lock holder merges.
 */
export async function atomicUpdateState(
  stateFilePath: string,
  fn: (state: TracingState) => TracingState,
): Promise<void> {
  await storeFor(stateFilePath).update(fn);
}

// ─── State helpers ──────────────────────────────────────────────────────────

export function loadState(stateFilePath: string): TracingState {
  return storeFor(stateFilePath).read();
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

/**
 * Remove sessions whose `updated` timestamp is older than 24 hours.
 * Pruned sessions that are later resumed will skip to the end of their
 * transcript (handled by UserPromptSubmit's fresh-state logic), so there's
 * no risk of replaying old messages.
 */
export function pruneOldSessions(state: TracingState, now: number = Date.now()): TracingState {
  return pruneStateEntries(state, SESSION_MAX_AGE_MS, now);
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

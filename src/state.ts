/**
 * Persistent state management — tracks how far we've read in each session's
 * transcript so the Stop hook only processes new messages.
 */

import { readFileSync } from "node:fs";
import {
  PRIVATE_FILE_MODE,
  SESSION_MAX_AGE_MS,
  STATE_LOCK_PROBE_MS,
  STATE_LOCK_WAIT_MS,
  STATE_TEMP_SUFFIX,
} from "./constants.js";
import { publishByRename } from "./utils/atomic-file.js";
import { withStateFileLock } from "./state-lock.js";
import {
  applyPatches,
  diffState,
  hasRecentPending,
  readPending,
  removePending,
  writePending,
} from "./state-pending.js";
import type { TracingState, SessionState } from "./types.js";

/** Published by rename, since readers load state without the lock and must never see a half-written file. */
function publishState(stateFilePath: string, state: TracingState): void {
  publishByRename(
    stateFilePath,
    JSON.stringify(state, null, 2),
    STATE_TEMP_SUFFIX,
    PRIVATE_FILE_MODE,
  );
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
  const waitMs = hasRecentPending(stateFilePath) ? STATE_LOCK_PROBE_MS : STATE_LOCK_WAIT_MS;
  const ran = await withStateFileLock(
    stateFilePath,
    () => {
      const { files, patches } = readPending(stateFilePath);
      publishState(stateFilePath, fn(applyPatches(readStateFile(stateFilePath), patches)));
      removePending(stateFilePath, files);
    },
    waitMs,
  );
  if (ran) return;
  const before = loadState(stateFilePath);
  writePending(stateFilePath, diffState(before, fn(before)));
}

// ─── State helpers ──────────────────────────────────────────────────────────

function readStateFile(stateFilePath: string): TracingState {
  try {
    const raw = readFileSync(stateFilePath, "utf-8");
    return JSON.parse(raw) as TracingState;
  } catch {
    return {};
  }
}

export function loadState(stateFilePath: string): TracingState {
  const { patches } = readPending(stateFilePath);
  return applyPatches(readStateFile(stateFilePath), patches);
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

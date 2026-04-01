/**
 * Persistent state management — tracks how far we've read in each session's
 * transcript so the Stop hook only processes new messages.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { TracingState, SessionState } from "./types.js";

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

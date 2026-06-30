#!/usr/bin/env node
/**
 * SessionEnd hook entry point.
 *
 * Fires when a Claude Code session ends (user exits, /clear, /resume, etc.).
 * If the session was interrupted (Stop never fired for the last turn), closes
 * the open turn run so traces aren't left hanging in LangSmith.
 *
 * Note: default timeout is 1.5s. Set CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS
 * to a higher value if needed.
 */

import { debug, error } from "../logger.js";
import { initTracing, closeInterruptedTurn } from "../langsmith.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import { readRuntimeVersion } from "../transcript.js";

interface SessionEndHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: "SessionEnd";
  reason: string;
}

async function main(): Promise<void> {
  const input: SessionEndHookInput = await readStdin();

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`SessionEnd hook: session=${input.session_id}, reason=${input.reason}`);

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  const openTurns = sessionState.open_turns ?? {};
  const hasOpenTurns = Object.keys(openTurns).length > 0;

  if (!sessionState.current_turn_run_id && !hasOpenTurns) {
    debug("No open turn run — nothing to close");
    return;
  }

  initTracing(config.apiKey, config.apiBaseUrl, config.replicas);

  const expandedTranscript = expandHome(input.transcript_path);
  const runtimeVersion =
    sessionState.runtime_version ??
    (expandedTranscript ? readRuntimeVersion(expandedTranscript) : undefined);

  let lastLine = sessionState.last_line;
  let turnsTraced = 0;

  // Close the active turn if it was interrupted (Stop never fired for it).
  if (sessionState.current_turn_run_id) {
    debug(`Closing interrupted turn run ${sessionState.current_turn_run_id} on session end`);
    try {
      const res = await closeInterruptedTurn({
        sessionId: input.session_id,
        sessionState,
        transcriptPath: expandedTranscript,
        project: config.project,
        stateFilePath: config.stateFilePath,
        customMetadata: config.customMetadata,
        runtimeVersion,
        approvalPolicy: sessionState.approval_policy,
      });
      lastLine = res.lastLine;
      turnsTraced = res.turnsTraced;
    } catch (err) {
      error(`Failed to close interrupted turn on session end: ${err}`);
    }
  }

  // Close any deferred turns whose background subagents never finished before the
  // session ended, so their root runs aren't left hanging in LangSmith. Same code
  // path as the interrupted turn above (closeInterruptedTurn) — just a different
  // status message, since these turns finished their main response but had
  // subagents still running at session end.
  for (const [turnRunId, entry] of Object.entries(openTurns)) {
    if (turnRunId === sessionState.current_turn_run_id) continue; // closed above
    try {
      await closeInterruptedTurn({
        sessionId: input.session_id,
        sessionState,
        transcriptPath: expandedTranscript,
        project: config.project,
        stateFilePath: config.stateFilePath,
        customMetadata: config.customMetadata,
        runtimeVersion,
        turn: entry,
        error: "Session ended before subagents finished",
      });
      debug(`Closed deferred turn ${turnRunId} on session end`);
    } catch (err) {
      error(`Failed to close deferred turn ${turnRunId} on session end: ${err}`);
    }
  }

  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        last_line: lastLine,
        turn_count: ss.turn_count + turnsTraced,
        current_turn_run_id: undefined,
        current_trace_id: undefined,
        current_dotted_order: undefined,
        current_parent_run_id: undefined,
        task_run_map: {},
        traced_tool_use_ids: [],
        tool_start_times: {},
        pending_subagent_traces: [],
        open_turns: {},
      },
    };
  });

  debug(`Session end cleanup complete (reason=${input.reason})`);
}

main().catch((err) => {
  try {
    error(`SessionEnd hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0);
});

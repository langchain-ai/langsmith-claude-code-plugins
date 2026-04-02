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
import { initClient, closeInterruptedTurn } from "../langsmith.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";

interface SessionEndHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: "SessionEnd";
  reason: string;
}

async function main(): Promise<void> {
  const input: SessionEndHookInput = await readStdin();

  const config = initHook();
  if (!config) return;

  debug(`SessionEnd hook: session=${input.session_id}, reason=${input.reason}`);

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  if (!sessionState.current_turn_run_id) {
    debug("No open turn run — nothing to close");
    return;
  }

  initClient(config.apiKey, config.apiBaseUrl);

  debug(`Closing interrupted turn run ${sessionState.current_turn_run_id} on session end`);

  try {
    const { lastLine, turnsTraced } = await closeInterruptedTurn({
      sessionId: input.session_id,
      sessionState,
      transcriptPath: expandHome(input.transcript_path),
      project: config.project,
      stateFilePath: config.stateFilePath,
    });

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
          pending_subagent_traces: [],
        },
      };
    });

    debug(`Closed interrupted turn run on session end (reason=${input.reason})`);
  } catch (err) {
    error(`Failed to close interrupted turn on session end: ${err}`);
  }
}

main().catch((err) => {
  try {
    error(`SessionEnd hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0);
});

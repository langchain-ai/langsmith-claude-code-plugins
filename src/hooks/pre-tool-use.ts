#!/usr/bin/env node
/**
 * PreToolUse hook entry point.
 *
 * Runs synchronously before a tool executes. Persists immutable launching-turn
 * ownership and privacy mode alongside the wall-clock start time, so async
 * PostToolUse never borrows context from a newer prompt.
 */

import { debug, error } from "../logger.js";
import { atomicUpdateState, getSessionState } from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";

interface PreToolUseHookInput {
  session_id: string;
  hook_event_name: "PreToolUse";
  tool_use_id: string;
  tool_name: string;
  cwd?: string;
  agent_id?: string;
  agent_type?: string;
}

async function main(): Promise<void> {
  const input: PreToolUseHookInput = await readStdin();

  const config = initHook(input.cwd);
  if (!config) return;

  // Subagent tools belong to their own transcript, not the session's root turn.
  if (input.agent_id || input.agent_type) return;

  const startTime = Date.now();

  debug(`PreToolUse hook: tool=${input.tool_name}, id=${input.tool_use_id}`);

  await atomicUpdateState(config.stateFilePath, (state) => {
    const ss = getSessionState(state, input.session_id);
    // A duplicate/late PreToolUse must never reassign an existing tool to a
    // newer turn, including one that has since opted into full tracing.
    if (ss.tool_launch_contexts?.[input.tool_use_id]) return state;
    const turn =
      ss.current_turn_run_id && ss.current_trace_id && ss.current_dotted_order
        ? {
            run_id: ss.current_turn_run_id,
            trace_id: ss.current_trace_id,
            dotted_order: ss.current_dotted_order,
            parent_run_id: ss.current_parent_run_id,
            start_time: ss.current_turn_start,
            turn_number: ss.current_turn_number,
            runtime_version: ss.runtime_version,
            approval_policy: ss.approval_policy,
          }
        : undefined;
    return {
      ...state,
      [input.session_id]: {
        ...ss,
        tool_launch_contexts: {
          ...ss.tool_launch_contexts,
          [input.tool_use_id]: {
            start_time: startTime,
            tracing: turn && ss.current_turn_tracing === "full" ? "full" : "metadata",
            turn,
          },
        },
        // This legacy map is only for the current turn's transcript tracing.
        ...(turn
          ? {
              tool_start_times: {
                ...ss.tool_start_times,
                [input.tool_use_id]: startTime,
              },
            }
          : {}),
      },
    };
  });
}

main().catch((err) => {
  try {
    error(`PreToolUse hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0);
});

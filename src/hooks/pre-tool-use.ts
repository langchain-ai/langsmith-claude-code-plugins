/**
 * PreToolUse hook handler.
 *
 * Fires before a tool executes. Records the wall-clock start time so
 * PostToolUse can use an accurate start_time instead of Date.now()
 * (which fires after the tool completes).
 */

import { resolveTurnTracingMode } from "../tracing-mode.js";
import { debug } from "../logger.js";
import { atomicUpdateState, getSessionState } from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";

interface PreToolUseHookInput {
  session_id: string;
  cwd: string;
  hook_event_name: "PreToolUse";
  tool_use_id: string;
  tool_name: string;
}

export async function main(): Promise<void> {
  const input: PreToolUseHookInput = await readStdin();

  const config = initHook(input.cwd);
  if (!config) return;

  const startTime = Date.now();

  debug(`PreToolUse hook: tool=${input.tool_name}, id=${input.tool_use_id}`);

  await atomicUpdateState(config.stateFilePath, (state) => {
    const ss = getSessionState(state, input.session_id);
    return {
      ...state,
      [input.session_id]: {
        ...ss,
        tool_tracing_modes: {
          ...ss.tool_tracing_modes,
          [input.tool_use_id]: resolveTurnTracingMode(
            config,
            input.session_id,
            ss.tool_tracing_modes?.[input.tool_use_id],
            ss.current_turn_tracing,
            ss.current_turn_run_id ? ss.open_turns?.[ss.current_turn_run_id]?.tracing : undefined,
          ),
        },
        tool_start_times: {
          ...ss.tool_start_times,
          [input.tool_use_id]: startTime,
        },
      },
    };
  });
}

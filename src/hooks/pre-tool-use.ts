#!/usr/bin/env node
/**
 * PreToolUse hook entry point.
 *
 * Fires before a tool executes. Records the wall-clock start time so
 * PostToolUse can use an accurate start_time instead of Date.now()
 * (which fires after the tool completes).
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
}

async function main(): Promise<void> {
  const input: PreToolUseHookInput = await readStdin();

  const config = initHook();
  if (!config) return;

  const startTime = Date.now();

  debug(`PreToolUse hook: tool=${input.tool_name}, id=${input.tool_use_id}`);

  await atomicUpdateState(config.stateFilePath, (state) => {
    const ss = getSessionState(state, input.session_id);
    return {
      ...state,
      [input.session_id]: {
        ...ss,
        tool_start_times: {
          ...ss.tool_start_times,
          [input.tool_use_id]: startTime,
        },
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

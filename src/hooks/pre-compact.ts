#!/usr/bin/env node
/**
 * PreCompact hook entry point.
 *
 * Fires before Claude Code runs a compact operation.
 * Records the start time so PostCompact can compute compaction duration.
 */

import { debug } from "../logger.js";
import { atomicUpdateState, getSessionState } from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";

interface PreCompactHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: "PreCompact";
  trigger: "manual" | "auto";
  custom_instructions: string;
}

async function main(): Promise<void> {
  const input: PreCompactHookInput = await readStdin();

  const config = initHook();
  if (!config) return;

  debug(`PreCompact hook started, session=${input.session_id}, trigger=${input.trigger}`);

  await atomicUpdateState(config.stateFilePath, (state) => {
    const sessionState = getSessionState(state, input.session_id);
    return {
      ...state,
      [input.session_id]: {
        ...sessionState,
        compaction_start_time: Date.now(),
      },
    };
  });

  debug(`Recorded compaction start time for session ${input.session_id}`);
}

main().catch((err) => {
  try {
    debug(`PreCompact hook error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0); // Always exit 0 so Claude Code isn't affected.
});

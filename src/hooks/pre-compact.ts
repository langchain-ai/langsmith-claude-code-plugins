/**
 * PreCompact hook handler.
 *
 * Fires before Claude Code runs a compact operation.
 * Records the start time so PostCompact can compute compaction duration.
 */

import { resolveTurnTracingMode } from "../tracing-mode.js";
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

export async function main(): Promise<void> {
  const input: PreCompactHookInput = await readStdin();

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`PreCompact hook started, session=${input.session_id}, trigger=${input.trigger}`);

  await atomicUpdateState(config.stateFilePath, (state) => {
    const sessionState = getSessionState(state, input.session_id);
    return {
      ...state,
      [input.session_id]: {
        ...sessionState,
        compaction_start_time: Date.now(),
        compaction_tracing: resolveTurnTracingMode(
          config,
          input.session_id,
          input.trigger === "manual" ? undefined : sessionState.current_turn_tracing,
          input.trigger !== "manual" && sessionState.current_turn_run_id
            ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing
            : undefined,
        ),
      },
    };
  });

  debug(`Recorded compaction start time for session ${input.session_id}`);
}

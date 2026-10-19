/**
 * StopFailure hook handler.
 *
 * Invoked when a turn ends due to an API error (rate limit, auth failure, etc.).
 * Closes out any open turn run in LangSmith with the error details so the
 * trace is visible rather than hanging open indefinitely.
 *
 * Note: output and exit code are ignored by Claude Code for this event.
 */

import { resolveTurnTracingMode } from "../tracing-mode.js";
import { error, debug } from "../logger.js";
import { captureRun, initTracing } from "../tracing-engine.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { isPayloadForHook } from "../utils/harness.js";
import { readStdin } from "../utils/stdin.js";

import { USER_PROMPT_TURN_NAME } from "../constants.js";
import { codingAgentMetadata } from "../metadata.js";
import type { StopFailureHookInput } from "../types.js";

export async function main(): Promise<void> {
  const input: StopFailureHookInput = await readStdin();
  if (!isPayloadForHook(input, "StopFailure")) return;

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`StopFailure hook: session=${input.session_id}, error=${input.error}`);

  initTracing(config, input.cwd, input.session_id);

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  if (!sessionState.current_turn_run_id) {
    debug("No open turn run to close");
    return;
  }

  const errorMessage = input.error_details ? `${input.error}: ${input.error_details}` : input.error;

  try {
    await captureRun(
      {
        name: USER_PROMPT_TURN_NAME,
        run_type: "chain",
        id: sessionState.current_turn_run_id,
        trace_id: sessionState.current_trace_id!,
        dotted_order: sessionState.current_dotted_order!,
        parent_run_id: sessionState.current_parent_run_id,
        start_time: sessionState.current_turn_start!,
        end_time: new Date().toISOString(),
        error: errorMessage,
        metadata: codingAgentMetadata({
          sessionId: input.session_id,
          base: config.customMetadata,
          turnNumber: sessionState.current_turn_number,
          runtimeVersion: sessionState.runtime_version,
          approvalPolicy: sessionState.approval_policy,
          agentType: "root",
        }),
      },
      resolveTurnTracingMode(
        config,
        input.session_id,
        sessionState.current_turn_tracing,
        sessionState.current_turn_run_id
          ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing
          : undefined,
      ),
      sessionState.current_turn_run_id,
      "patch",
    );
    debug(`Closed turn run ${sessionState.current_turn_run_id} with error: ${errorMessage}`);
  } catch (err) {
    error(`Failed to close turn run on StopFailure: ${err}`);
  }

  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        current_turn_tracing: undefined,
        current_turn_run_id: undefined,
        current_trace_id: undefined,
        current_dotted_order: undefined,
        current_parent_run_id: undefined,
      },
    };
  });
}

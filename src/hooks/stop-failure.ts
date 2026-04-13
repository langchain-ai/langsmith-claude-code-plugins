#!/usr/bin/env node
/**
 * StopFailure hook entry point.
 *
 * Invoked when a turn ends due to an API error (rate limit, auth failure, etc.).
 * Closes out any open turn run in LangSmith with the error details so the
 * trace is visible rather than hanging open indefinitely.
 *
 * Note: output and exit code are ignored by Claude Code for this event.
 */

import { error, debug } from "../logger.js";
import { initTracing, flushPendingTraces } from "../langsmith.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import { RunTree } from "langsmith";
import { USER_PROMPT_TURN_NAME } from "../constants.js";

interface StopFailureHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: "StopFailure";
  error: string;
  error_details?: string;
  last_assistant_message?: string;
}

async function main(): Promise<void> {
  const input: StopFailureHookInput = await readStdin();

  const config = initHook();
  if (!config) return;

  debug(`StopFailure hook: session=${input.session_id}, error=${input.error}`);

  const client = initTracing(config.apiKey, config.apiBaseUrl, config.replicas);

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  if (!sessionState.current_turn_run_id) {
    debug("No open turn run to close");
    return;
  }

  const errorMessage = input.error_details ? `${input.error}: ${input.error_details}` : input.error;

  try {
    const runTree = new RunTree({
      client,
      replicas: config.replicas,
      name: USER_PROMPT_TURN_NAME,
      run_type: "chain",
      project_name: config.project,
      id: sessionState.current_turn_run_id,
      trace_id: sessionState.current_trace_id,
      dotted_order: sessionState.current_dotted_order,
      parent_run_id: sessionState.current_parent_run_id,
      start_time: sessionState.current_turn_start,
      end_time: new Date().toISOString(),
      error: errorMessage,
      extra: {
        metadata: {
          thread_id: input.session_id,
          ls_integration: "claude-code",
          turn_number: sessionState.current_turn_number,
          ...config.customMetadata,
        },
      },
    });
    await runTree.patchRun({ excludeInputs: true });
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
        current_turn_run_id: undefined,
        current_trace_id: undefined,
        current_dotted_order: undefined,
        current_parent_run_id: undefined,
      },
    };
  });

  await flushPendingTraces();
}

main().catch((err) => {
  try {
    error(`StopFailure hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0);
});

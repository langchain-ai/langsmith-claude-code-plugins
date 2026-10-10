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
import { initTracing, flushPendingTraces } from "../langsmith.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { isPayloadForHook } from "../utils/harness.js";
import { readStdin } from "../utils/stdin.js";
import { readTurnRecord, turnRecordPath } from "../turn-record.js";

import {
  CLAUDE_CODE_INTEGRATION,
  CLAUDE_TURN_FAILURE_EVENT_SUFFIX,
  USER_PROMPT_TURN_NAME,
} from "../constants.js";
import { createRunTree } from "../privacy.js";
import { codingAgentMetadata, codingAgentMetadataOptions } from "../metadata.js";
import {
  captureClaudeRun,
  createClaudeTracingSession,
  sharedClaudeChildRunIds,
} from "../tracing-engine.js";

interface StopFailureHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: "StopFailure";
  error: string;
  error_details?: string;
  last_assistant_message?: string;
}

export async function main(): Promise<void> {
  const input: StopFailureHookInput = await readStdin();
  if (!isPayloadForHook(input, "StopFailure")) return;

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`StopFailure hook: session=${input.session_id}, error=${input.error}`);

  const client = initTracing(
    config.apiKey,
    config.apiBaseUrl,
    config.replicas,
    config.redact,
    config.redactExtraRules,
  );

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  if (!sessionState.current_turn_run_id) {
    debug("No open turn run to close");
    return;
  }

  const errorMessage = input.error_details ? `${input.error}: ${input.error_details}` : input.error;
  const tracing = resolveTurnTracingMode(
    config,
    input.session_id,
    sessionState.current_turn_tracing,
    sessionState.current_turn_run_id
      ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing
      : undefined,
  );
  const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
  let closed = false;

  try {
    const metadataInput = {
      sessionId: input.session_id,
      runType: "interrupted" as const,
      base: config.customMetadata,
      turnNumber: sessionState.current_turn_number,
      runtimeVersion: sessionState.runtime_version,
      approvalPolicy: sessionState.approval_policy,
      agentType: "root" as const,
    };
    const run = {
      id: sessionState.current_turn_run_id,
      name: USER_PROMPT_TURN_NAME,
      run_type: "chain",
      start_time: sessionState.current_turn_start,
      trace_id: sessionState.current_trace_id,
      dotted_order: sessionState.current_dotted_order,
      parent_run_id: sessionState.current_parent_run_id,
    };
    const endTime = new Date().toISOString();
    let rootCaptureAvailable = false;
    if (engine) {
      const rootCapture = await engine.captureStore.read({
        integration: CLAUDE_CODE_INTEGRATION,
        sessionId: input.session_id,
        turnId: sessionState.current_turn_run_id,
        eventId: sessionState.current_turn_run_id,
      });
      rootCaptureAvailable =
        rootCapture?.runId === sessionState.current_turn_run_id &&
        rootCapture.destinationFingerprint === engine.accountFingerprint;
      const record = readTurnRecord(
        turnRecordPath(config.stateFilePath, input.session_id, sessionState.current_turn_run_id),
      );
      if (!rootCaptureAvailable && record?.root?.shared) {
        throw new Error(`Could not find shared Turn capture ${sessionState.current_turn_run_id}`);
      }
    }
    if (engine && rootCaptureAvailable) {
      const captured = await captureClaudeRun(engine, {
        turnId: sessionState.current_turn_run_id,
        eventId: `${sessionState.current_turn_run_id}${CLAUDE_TURN_FAILURE_EVENT_SUFFIX}`,
        submission: {
          operation: "patch",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: codingAgentMetadataOptions(metadataInput),
          privacyContext: { status: "error" },
          run,
          patch: {
            fields: ["error", "end_time"],
            values: { error: errorMessage, end_time: endTime },
          },
        },
        turnEvidence: {
          rootRunId: sessionState.current_turn_run_id,
          childRunIds: await sharedClaudeChildRunIds(
            engine,
            sessionState.current_turn_run_id,
            sessionState.current_turn_run_id,
          ),
          closureState: "authoritative",
        },
      });
      if (!captured) throw new Error(`Could not capture shared Turn failure ${run.id}`);
    } else {
      const runTree = createRunTree(
        {
          client,
          replicas: config.replicas,
          project_name: config.project,
          ...run,
          end_time: endTime,
          error: errorMessage,
          extra: { metadata: codingAgentMetadata(metadataInput) },
        },
        tracing,
      );
      await runTree.patchRun({ excludeInputs: true });
    }
    closed = true;
    debug(`Closed turn run ${sessionState.current_turn_run_id} with error: ${errorMessage}`);
  } catch (err) {
    error(`Failed to close turn run on StopFailure: ${err}`);
  }

  if (closed) {
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

  await flushPendingTraces();
}

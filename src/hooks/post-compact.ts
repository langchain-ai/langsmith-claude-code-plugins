/**
 * PostCompact hook handler.
 *
 * Fires after Claude Code completes a compact operation.
 * Creates a LangSmith run capturing the compaction event and summary.
 */

import { resolveTurnTracingMode } from "../tracing-mode.js";
import { uuid7FromTime } from "langsmith";
import { debug, error } from "../logger.js";
import { initTracing, generateDottedOrderSegment, flushPendingTraces } from "../langsmith.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { readTurnRecord, turnRecordPath } from "../turn-record.js";
import { initHook } from "../utils/hook-init.js";
import { isPayloadForHook } from "../utils/harness.js";
import { readStdin } from "../utils/stdin.js";
import { createRunTree } from "../privacy.js";
import { codingAgentMetadata, codingAgentMetadataOptions } from "../metadata.js";
import { createClaudeTracingSession, captureClaudeRun } from "../tracing-engine.js";
import type { ClaudeSharedRunCapture } from "../models/tracing-engine.js";
import { CLAUDE_CODE_INTEGRATION } from "../constants.js";

interface PostCompactHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: "PostCompact";
  trigger: "manual" | "auto";
  compact_summary: string;
}

export async function main(): Promise<void> {
  const input: PostCompactHookInput = await readStdin();
  if (!isPayloadForHook(input, "PostCompact")) return;

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`PostCompact hook started, session=${input.session_id}, trigger=${input.trigger}`);

  const client = initTracing(
    config.apiKey,
    config.apiBaseUrl,
    config.replicas,
    config.redact,
    config.redactExtraRules,
  );

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  const endTime = new Date().toISOString();
  const startTime = sessionState.compaction_start_time
    ? new Date(sessionState.compaction_start_time).toISOString()
    : endTime;

  const runId = uuid7FromTime(startTime);
  const segment = generateDottedOrderSegment(startTime, runId);

  // Nest under the current turn's trace if one is active, otherwise standalone.
  const parentRunId = sessionState.current_turn_run_id;
  const traceId = sessionState.current_trace_id ?? runId;
  const dottedOrder = sessionState.current_dotted_order
    ? `${sessionState.current_dotted_order}.${segment}`
    : segment;
  const tracing = resolveTurnTracingMode(
    config,
    input.session_id,
    sessionState.compaction_tracing,
    sessionState.current_turn_tracing,
    sessionState.current_turn_run_id
      ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing
      : undefined,
  );
  const metadataInput = {
    sessionId: input.session_id,
    runType: "root" as const,
    base: config.customMetadata,
    turnNumber: sessionState.current_turn_number,
    runtimeVersion: sessionState.runtime_version,
    agentType: "compaction" as const,
    runSpecific: { trigger: input.trigger },
  };
  const metadata = codingAgentMetadata(metadataInput);
  const run = {
    id: runId,
    name: `Context Compaction (${input.trigger})`,
    run_type: "chain",
    inputs: {},
    outputs: { compact_summary: input.compact_summary },
    start_time: startTime,
    end_time: endTime,
    trace_id: traceId,
    dotted_order: dottedOrder,
    ...(parentRunId ? { parent_run_id: parentRunId } : {}),
  };

  let rootCaptureAvailable = !parentRunId;
  try {
    const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
    if (engine && parentRunId) {
      const rootCapture = await engine.captureStore.read({
        integration: CLAUDE_CODE_INTEGRATION,
        sessionId: input.session_id,
        turnId: parentRunId,
        eventId: parentRunId,
      });
      rootCaptureAvailable =
        rootCapture?.runId === parentRunId &&
        rootCapture.destinationFingerprint === engine.accountFingerprint;
      const record = readTurnRecord(
        turnRecordPath(config.stateFilePath, input.session_id, parentRunId),
      );
      if (!rootCaptureAvailable && record?.root?.shared) {
        throw new Error(`Could not find shared Turn capture ${parentRunId}`);
      }
    }
    const captureSharedRun: ClaudeSharedRunCapture | undefined = engine
      ? rootCaptureAvailable
        ? (capture) => captureClaudeRun(engine, capture)
        : undefined
      : undefined;
    if (captureSharedRun) {
      const rootRunId = parentRunId ?? runId;
      const captured = await captureSharedRun({
        turnId: rootRunId,
        eventId: runId,
        submission: {
          operation: "post",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: codingAgentMetadataOptions(metadataInput),
          privacyContext: { status: "completed" },
          run,
        },
        turnEvidence: { rootRunId, childRunIds: [runId], closureState: "open" },
      });
      if (!captured) throw new Error(`Could not capture shared Claude compaction run ${runId}`);
    } else {
      const runTree = createRunTree(
        {
          client,
          replicas: config.replicas,
          project_name: config.project,
          ...run,
          extra: { metadata },
        },
        tracing,
      );
      await runTree.postRun();
    }

    debug(`Created compaction run ${runId} (${input.trigger})`);
  } catch (err) {
    error(`Failed to create compaction run: ${err}`);
  }

  // Flush the compaction run before this async hook exits, or the SDK's batch
  // timer may not fire and the run would never reach LangSmith.
  await flushPendingTraces();

  // Clear compaction_start_time from state
  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        compaction_start_time: undefined,
        compaction_tracing: undefined,
      },
    };
  });
}

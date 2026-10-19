/**
 * PostCompact hook handler.
 *
 * Fires after Claude Code completes a compact operation.
 * Creates a LangSmith run capturing the compaction event and summary.
 */

import { resolveTurnTracingMode } from "../tracing-mode.js";
import { debug, error } from "../logger.js";
import { generateDottedOrderSegment } from "../langsmith.js";
import { captureRun, initTracing } from "../tracing-engine.js";
import { stableRunId } from "../utils/ids/run-id.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { isPayloadForHook } from "../utils/harness.js";
import { readStdin } from "../utils/stdin.js";
import { codingAgentMetadata } from "../metadata.js";
import type { PostCompactHookInput } from "../types.js";

export async function main(): Promise<void> {
  const input: PostCompactHookInput = await readStdin();
  if (!isPayloadForHook(input, "PostCompact")) return;

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`PostCompact hook started, session=${input.session_id}, trigger=${input.trigger}`);

  initTracing(config, input.cwd, input.session_id);

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  const endTime = new Date().toISOString();
  const startTime = sessionState.compaction_start_time
    ? new Date(sessionState.compaction_start_time).toISOString()
    : endTime;

  const runId = stableRunId(startTime, input.session_id, input.trigger);
  const segment = generateDottedOrderSegment(startTime, runId);

  // Nest under the current turn's trace if one is active, otherwise standalone.
  const parentRunId = sessionState.current_turn_run_id;
  const traceId = sessionState.current_trace_id ?? runId;
  const dottedOrder = sessionState.current_dotted_order
    ? `${sessionState.current_dotted_order}.${segment}`
    : segment;

  try {
    await captureRun(
      {
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
        metadata: codingAgentMetadata({
          sessionId: input.session_id,
          base: config.customMetadata,
          turnNumber: sessionState.current_turn_number,
          runtimeVersion: sessionState.runtime_version,
          agentType: "compaction",
          runSpecific: { trigger: input.trigger },
        }),
      },
      resolveTurnTracingMode(
        config,
        input.session_id,
        sessionState.compaction_tracing,
        sessionState.current_turn_tracing,
        sessionState.current_turn_run_id
          ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing
          : undefined,
      ),
    );

    debug(`Created compaction run ${runId} (${input.trigger})`);
  } catch (err) {
    error(`Failed to create compaction run: ${err}`);
  }

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

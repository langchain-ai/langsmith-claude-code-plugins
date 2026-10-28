/**
 * PostCompact hook handler.
 *
 * Fires after Claude Code completes a compact operation.
 * Creates a LangSmith run capturing the compaction event and summary.
 */

import { resolveTurnTracingMode } from "../tracing-mode.js";
import { debug, error } from "../logger.js";
import { generateDottedOrderSegment, parseDottedOrder } from "../langsmith.js";
import { captureRun, initTracing } from "../tracing-engine.js";
import { stableRunId } from "../utils/ids/run-id.js";
import { queueClosing } from "../closing-queue.js";
import { initHook } from "../utils/hook-init.js";
import { isPayloadForHook } from "../utils/harness.js";
import { readStdin } from "../utils/stdin.js";
import { codingAgentMetadata } from "../metadata.js";
import type { Config, PostCompactHookInput, QueuedClosing } from "../types.js";

export async function main(): Promise<void> {
  const input: PostCompactHookInput = await readStdin();
  if (!isPayloadForHook(input, "PostCompact")) return;

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`PostCompact hook started, session=${input.session_id}, trigger=${input.trigger}`);

  await queueClosing(config, "post-compact", input, {
    reset: () => ({ compaction_start_time: undefined, compaction_tracing: undefined }),
  });
}

export async function traceCompaction(
  _id: string,
  closing: QueuedClosing,
  config: Config,
): Promise<void> {
  const input = closing.input as PostCompactHookInput;
  const sessionState = closing.session;

  initTracing(config, input.cwd, input.session_id);

  const endTime = new Date(closing.at).toISOString();
  const startTime = sessionState.compaction_start_time
    ? new Date(sessionState.compaction_start_time).toISOString()
    : endTime;

  const runId = stableRunId(startTime, input.session_id, input.trigger);
  const segment = generateDottedOrderSegment(startTime, runId);

  // Nest under the current turn, or the last one when compacting between turns.
  const turnDottedOrder = sessionState.current_dotted_order;
  if (!turnDottedOrder || !sessionState.current_trace_id) {
    debug(`Skipping compaction run ${runId}: no turn to nest it under`);
    return;
  }
  const parentRunId = sessionState.current_turn_run_id ?? parseDottedOrder(turnDottedOrder).runId;
  const traceId = sessionState.current_trace_id;
  const dottedOrder = `${turnDottedOrder}.${segment}`;

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
        parent_run_id: parentRunId,
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
        !sessionState.current_turn_run_id && sessionState.closed_turn_tracing === "metadata"
          ? "metadata"
          : undefined,
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
}

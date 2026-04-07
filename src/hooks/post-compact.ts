#!/usr/bin/env node
/**
 * PostCompact hook entry point.
 *
 * Fires after Claude Code completes a compact operation.
 * Creates a LangSmith run capturing the compaction event and summary.
 */

import { RunTree, uuid7 } from "langsmith";
import { debug, error } from "../logger.js";
import { initTracing, generateDottedOrderSegment } from "../langsmith.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";

interface PostCompactHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: "PostCompact";
  trigger: "manual" | "auto";
  compact_summary: string;
}

async function main(): Promise<void> {
  const input: PostCompactHookInput = await readStdin();

  const config = initHook();
  if (!config) return;

  debug(`PostCompact hook started, session=${input.session_id}, trigger=${input.trigger}`);

  const client = initTracing(config.apiKey, config.apiBaseUrl, config.replicas);

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  const endTime = new Date().toISOString();
  const startTime = sessionState.compaction_start_time
    ? new Date(sessionState.compaction_start_time).toISOString()
    : endTime;

  const runId = uuid7();
  const segment = generateDottedOrderSegment(startTime, runId);

  // Nest under the current turn's trace if one is active, otherwise standalone.
  const parentRunId = sessionState.current_turn_run_id;
  const traceId = sessionState.current_trace_id ?? runId;
  const dottedOrder = sessionState.current_dotted_order
    ? `${sessionState.current_dotted_order}.${segment}`
    : segment;

  try {
    const runTree = new RunTree({
      client,
      replicas: config.replicas,
      id: runId,
      name: `Context Compaction (${input.trigger})`,
      run_type: "chain",
      inputs: {},
      outputs: { compact_summary: input.compact_summary },
      project_name: config.project,
      start_time: startTime,
      end_time: endTime,
      trace_id: traceId,
      dotted_order: dottedOrder,
      ...(parentRunId ? { parent_run_id: parentRunId } : {}),
      extra: {
        metadata: {
          thread_id: input.session_id,
          ls_integration: "claude-code",
          trigger: input.trigger,
        },
      },
    });
    await runTree.postRun();

    debug(`Created compaction run ${runId} (${input.trigger})`);
  } catch (err) {
    error(`Failed to create compaction run: ${err}`);
  }

  // Clear compaction_start_time from state
  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    return {
      ...s,
      [input.session_id]: { ...ss, compaction_start_time: undefined },
    };
  });
}

main().catch((err) => {
  try {
    error(`PostCompact hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0); // Always exit 0 so Claude Code isn't affected.
});

#!/usr/bin/env node
/**
 * UserPromptSubmit hook entry point.
 *
 * Invoked when a user submits a prompt, before Claude processes it.
 * Creates the initial RunTree for the turn and stores the run ID
 * for the Stop hook to use as the parent for all LLM and tool runs.
 */

import { debug, error } from "../logger.js";
import { initClient, generateDottedOrderSegment } from "../langsmith.js";
import { loadState, saveState, getSessionState } from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";

interface UserPromptSubmitHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  hook_event_name: "UserPromptSubmit";
  prompt: string;
  agent_id?: string;
  agent_type?: string;
}

async function main(): Promise<void> {
  const hookStartTime = Date.now();
  const input: UserPromptSubmitHookInput = await readStdin();

  const config = initHook();
  if (!config) return;

  debug(`UserPromptSubmit hook started, session=${input.session_id}`);

  const client = initClient(config.apiKey, config.apiBaseUrl);

  // Detect if this is a subagent
  const isSubagent = !!(input.agent_id || input.agent_type);

  // Load state to get turn count and parent run ID if this is a subagent
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);
  const turnNum = sessionState.turn_count + 1;

  // Build tags
  const tags = ["claude-code", `turn-${turnNum}`];
  if (isSubagent) {
    tags.push("subagent");
  }

  // For subagents, look up parent run ID from task_run_map
  let parentRunId: string | undefined;
  let parentTraceId: string | undefined;
  let parentDottedOrder: string | undefined;

  if (isSubagent && input.agent_id && sessionState.task_run_map) {
    const taskRunInfo = sessionState.task_run_map[input.agent_id];
    if (taskRunInfo) {
      parentRunId = taskRunInfo.run_id;
      debug(`Subagent ${input.agent_id} will be nested under parent run ${parentRunId}`);
      // Get parent trace info from session state
      parentTraceId = sessionState.current_trace_id;
      parentDottedOrder = taskRunInfo.dotted_order;
    }
  }

  // Generate run ID
  const { randomUUID } = await import("crypto");
  const runId = randomUUID();
  const startTime = Date.now();

  // trace_id is the root of the trace - either this run or the parent's trace
  const traceId = parentTraceId || runId;

  // dotted_order: For root runs, it's just the segment. For children, append to parent's.
  const dottedOrderSegment = generateDottedOrderSegment(startTime, runId, 1);
  const dottedOrder = parentDottedOrder
    ? `${parentDottedOrder}.${dottedOrderSegment}`
    : dottedOrderSegment;

  // Create the turn run using Client API
  await client.createRun({
    id: runId,
    name: "Claude Code Turn",
    run_type: "chain",
    inputs: { messages: [{ role: "user", content: input.prompt }] },
    project_name: config.project,
    start_time: startTime,
    parent_run_id: parentRunId,
    trace_id: traceId,
    dotted_order: dottedOrder,
    extra: {
      metadata: {
        thread_id: input.session_id,
        tags,
        turn_number: turnNum,
        ...(!isSubagent ? { ls_agent_type: "agent" } : {}),
      },
    },
  });

  debug(`Created initial run ${runId} for turn ${turnNum}`);

  // Store the run ID, trace ID, and dotted order in state for the Stop hook to use
  const updatedState = {
    ...state,
    [input.session_id]: {
      ...sessionState,
      current_turn_run_id: runId,
      current_trace_id: traceId,
      current_dotted_order: dottedOrder,
      current_turn_start: Date.now(),
    },
  };
  saveState(config.stateFilePath, updatedState);

  const duration = ((Date.now() - hookStartTime) / 1000).toFixed(1);
  debug(`UserPromptSubmit hook completed in ${duration}s`);
}

main().catch((err) => {
  try {
    error(`UserPromptSubmit hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0); // Always exit 0 so Claude Code isn't affected.
});

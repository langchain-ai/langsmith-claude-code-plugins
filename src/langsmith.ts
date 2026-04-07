/**
 * LangSmith run construction and submission.
 *
 * Converts parsed Turns into LangSmith run hierarchies and sends them
 * via the LangSmith JS SDK RunTree API, which handles batching, multipart
 * serialization, retries, and auth automatically.
 */

import { Client, RunTree, RunTreeConfig, uuid7 } from "langsmith";
import type { Turn, ContentBlock, Usage } from "./types.js";
import { readTranscript, groupIntoTurns } from "./transcript.js";
import { loadState, getSessionState } from "./state.js";
import * as logger from "./logger.js";
import { ASSISTANT_RUN_NAME, USER_PROMPT_TURN_NAME } from "./constants.js";

// ─── Client setup ───────────────────────────────────────────────────────────

let client: Client | undefined = undefined;
let replicas: RunTreeConfig["replicas"] | undefined = undefined;

export function initTracing(
  apiKey?: string,
  apiUrl?: string,
  providedReplicas?: RunTreeConfig["replicas"],
) {
  if (apiKey) {
    client = new Client({ apiKey, apiUrl });
  } else {
    client = undefined;
  }
  replicas = providedReplicas;
  return client;
}

/** Flush all pending batches to ensure traces are sent before hook exits. */
export async function flushPendingTraces(): Promise<void> {
  logger.debug("Awaiting pending trace batches...");
  // Flush our explicit client (if any) and the shared client used internally
  // by RunTree for replica API calls when no explicit client is provided.
  await Promise.all([
    client?.awaitPendingTraceBatches(),
    RunTree.getSharedClient().awaitPendingTraceBatches(),
  ]);
  logger.debug("Trace batches flushed successfully");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generate dotted order segment for a run.
 * Format: stripNonAlphanumeric(ISO_timestamp_with_execution_order) + runId
 * Based on LangSmith's convertToDottedOrderFormat function.
 *
 * Accepts an ISO string or milliseconds-since-epoch.
 */
export function generateDottedOrderSegment(time: string | number, runId: string): string {
  const iso = typeof time === "string" ? time : new Date(time).toISOString();
  // Add microsecond precision using execution order
  const isoWithMicroseconds = `${iso.slice(0, -1)}000Z`;
  // Strip non-alphanumeric characters
  const stripped = isoWithMicroseconds.replace(/[-:.]/g, "");
  return stripped + runId;
}

/**
 * Extract the run ID from a single dotted-order segment.
 * Each segment is <stripped_timestamp><run_id> where the timestamp always ends
 * with "Z". Returns everything after the "Z".
 */
function runIdFromSegment(segment: string): string {
  const zIdx = segment.indexOf("Z");
  return zIdx >= 0 ? segment.slice(zIdx + 1) : segment;
}

/**
 * Parse a LangSmith dotted_order string into its trace ID and the run ID of
 * the leaf (last) run. Useful for nesting new runs under an existing parent.
 */
export function parseDottedOrder(dottedOrder: string): { traceId: string; runId: string } {
  const segments = dottedOrder.split(".");
  const traceId = runIdFromSegment(segments[0]);
  const runId = runIdFromSegment(segments[segments.length - 1]);
  return { traceId, runId };
}

// ─── Content formatting ─────────────────────────────────────────────────────

/** Convert ContentBlocks to LangSmith message format. */
function formatContent(blocks: ContentBlock[]): Array<Record<string, unknown>> {
  return blocks.map((block) => {
    switch (block.type) {
      case "text":
        return { type: "text", text: block.text };
      case "thinking":
        return { type: "thinking", thinking: block.thinking };
      case "tool_use":
        return { type: "tool_call", name: block.name, args: block.input, id: block.id };
      default:
        return block as Record<string, unknown>;
    }
  });
}

/** Build usage_metadata from Usage for LangSmith. Returns undefined if there are no tokens. */
function buildUsageMetadata(usage: Usage) {
  const input_tokens =
    (usage.input_tokens ?? 0) +
    (usage.cache_creation_input_tokens ?? 0) +
    (usage.cache_read_input_tokens ?? 0);
  const output_tokens = usage.output_tokens ?? 0;
  const total_tokens = input_tokens + output_tokens;

  if (total_tokens === 0) {
    return undefined;
  }

  return {
    input_tokens,
    output_tokens,
    total_tokens,
    input_token_details: {
      cache_read: usage.cache_read_input_tokens ?? 0,
      cache_creation: usage.cache_creation_input_tokens ?? 0,
    },
  };
}

// ─── Run creation ───────────────────────────────────────────────────────────

/**
 * Create and submit LangSmith runs for a single Turn.
 *
 * Hierarchy:
 *   Turn (chain) - created by UserPromptSubmit or here if standalone
 *   ├── Assistant (llm)
 *   ├── ToolA (tool)
 *   ├── ToolB (tool)      ← tools are siblings of assistant, children of turn
 *   ├── Assistant (llm)
 *   └── ToolC (tool)
 */
export interface TraceTurnOptions {
  turn: Turn;
  sessionId: string;
  turnNum: number;
  project: string;
  parentRunId?: string;
  existingTaskRunMap?: Record<string, { run_id: string; dotted_order: string }>;
  /** tool_use_ids already traced by PostToolUse — skip creating runs for these */
  tracedToolUseIds?: Set<string>;
  traceId?: string;
  parentDottedOrder?: string;
}

/**
 * Trace a turn to LangSmith.
 * @returns A map of agent_id -> tool run info (ID and dotted_order) for Task tools (used to link subagent traces)
 */
export async function traceTurn(
  options: TraceTurnOptions,
): Promise<Record<string, { run_id: string; dotted_order: string }>> {
  const {
    turn,
    sessionId,
    turnNum,
    project,
    parentRunId,
    existingTaskRunMap,
    tracedToolUseIds,
    traceId: providedTraceId,
    parentDottedOrder: providedParentDottedOrder,
  } = options;

  let traceId = providedTraceId;
  let parentDottedOrder = providedParentDottedOrder;
  if (!client && !replicas) {
    throw new Error("LangSmith client not initialized — call initTracing() first");
  }

  const userContent =
    typeof turn.userContent === "string"
      ? [{ type: "text", text: turn.userContent }]
      : turn.userContent;

  // Determine the turn run ID and whether we need to create it
  let turnRunId: string;
  let shouldCreateTurn = false;

  if (parentRunId) {
    // UserPromptSubmit already created the Turn run (or this is a subagent under a tool run)
    // Use it as parent for LLM/tool runs
    logger.debug(`Using existing run ${parentRunId} as parent for LLM/tool runs`);
    turnRunId = parentRunId;

    // Validate that we have required trace context
    if (!traceId || !parentDottedOrder) {
      throw new Error(
        `Missing trace context when using parentRunId. ` +
          `traceId=${traceId}, parentDottedOrder=${parentDottedOrder}`,
      );
    }
  } else {
    // Create a new turn run for interrupted/standalone turns
    shouldCreateTurn = true;
    turnRunId = uuid7();
    traceId = turnRunId; // This turn is its own trace root

    parentDottedOrder = generateDottedOrderSegment(turn.userTimestamp, turnRunId);

    logger.debug(`Creating new standalone turn run ${turnRunId}`);
    const runTree = new RunTree({
      client,
      replicas,
      id: turnRunId,
      name: USER_PROMPT_TURN_NAME,
      run_type: "chain",
      inputs: { messages: [{ role: "user", content: userContent }] },
      project_name: project,
      start_time: turn.userTimestamp,
      trace_id: traceId,
      dotted_order: parentDottedOrder,
    });
    await runTree.postRun();
  }

  // Track accumulated messages for LLM input context.
  const accumulatedMessages: Array<Record<string, unknown>> = [
    { role: "user", content: userContent },
  ];

  // Track Task tool runs for subagent linking (merge with existing)
  const taskRunMap: Record<string, { run_id: string; dotted_order: string }> = {
    ...existingTaskRunMap,
  };

  let lastEndTime = turn.userTimestamp;

  // 2. Process each LLM call - create as children of the turn run
  for (const llmCall of turn.llmCalls) {
    const assistantContent = formatContent(llmCall.content);

    // Generate run ID for this LLM call
    const assistantRunId = uuid7();
    const assistantDottedOrderSegment = generateDottedOrderSegment(
      llmCall.startTime,
      assistantRunId,
    );
    const assistantDottedOrder = `${parentDottedOrder}.${assistantDottedOrderSegment}`;

    // Create assistant (LLM) run as child of turn using Client API
    const assistantRunTree = new RunTree({
      client,
      replicas,
      id: assistantRunId,
      name: ASSISTANT_RUN_NAME,
      run_type: "llm",
      inputs: { messages: [...accumulatedMessages] },
      project_name: project,
      start_time: llmCall.startTime,
      parent_run_id: turnRunId,
      trace_id: traceId,
      dotted_order: assistantDottedOrder,
    });
    await assistantRunTree.postRun();

    // 3. Create tool runs (siblings of assistant, children of turn).
    for (const toolCall of llmCall.toolCalls) {
      // Skip tools already traced by PostToolUse (agent tools via existingTaskRunMap,
      // regular tools via tracedToolUseIds).
      if (toolCall.agentId && existingTaskRunMap?.[toolCall.agentId]) {
        logger.debug(
          `Skipping Task tool for agent ${toolCall.agentId} - already traced by PostToolUse`,
        );
        lastEndTime = toolCall.result?.timestamp ?? llmCall.endTime;
        continue;
      }
      if (!toolCall.agentId && tracedToolUseIds?.has(toolCall.tool_use.id)) {
        lastEndTime = toolCall.result?.timestamp ?? llmCall.endTime;
        continue;
      }

      // Tools start when the LLM finishes, but for parallel tool calls the result
      // timestamp can precede the last LLM streaming chunk. Clamp to avoid negative latency.
      const toolEndTime = toolCall.result?.timestamp ?? llmCall.endTime;
      const toolStartTime = llmCall.endTime <= toolEndTime ? llmCall.endTime : toolEndTime;

      // Generate run ID for this tool
      const toolRunId = uuid7();
      const toolDottedOrderSegment = generateDottedOrderSegment(toolStartTime, toolRunId);
      const toolDottedOrder = `${parentDottedOrder}.${toolDottedOrderSegment}`;

      // Create and complete tool run in a single call.
      const runTree = new RunTree({
        client,
        replicas,
        id: toolRunId,
        name: toolCall.tool_use.name,
        run_type: "tool",
        inputs: { input: toolCall.tool_use.input },
        outputs: { output: toolCall.result?.content ?? "No result" },
        project_name: project,
        start_time: toolStartTime,
        end_time: toolEndTime,
        parent_run_id: turnRunId,
        trace_id: traceId,
        dotted_order: toolDottedOrder,
        extra: {
          metadata: { thread_id: sessionId, ls_integration: "claude-code" },
        },
      });
      await runTree.postRun();

      // If this is a Task tool, store the run ID and dotted_order for subagent linking
      if (toolCall.agentId) {
        taskRunMap[toolCall.agentId] = {
          run_id: toolRunId,
          dotted_order: toolDottedOrder,
        };
        logger.debug(
          `Task tool ${toolCall.tool_use.id} → agentId=${toolCall.agentId}, runId=${toolRunId}`,
        );
      }

      lastEndTime = toolEndTime;
    }

    // Complete the assistant run.
    const assistantEndTime = llmCall.toolCalls.length > 0 ? lastEndTime : llmCall.endTime;
    const runTree = new RunTree({
      client,
      replicas,
      id: assistantRunId,
      run_type: "llm",
      trace_id: traceId,
      dotted_order: assistantDottedOrder,
      parent_run_id: turnRunId,
      name: ASSISTANT_RUN_NAME,
      project_name: project,
      start_time: llmCall.startTime,
      end_time: assistantEndTime,
      outputs: {
        messages: [{ role: "assistant", content: assistantContent }],
      },
      extra: {
        metadata: {
          thread_id: sessionId,
          ls_integration: "claude-code",
          ls_provider: "anthropic",
          ls_model_name: llmCall.model,
          ls_invocation_params: {
            model: llmCall.model,
          },
          usage_metadata: buildUsageMetadata(llmCall.usage),
          ...(llmCall.synthetic ? { synthetic: true } : {}),
        },
      },
    });

    await runTree.patchRun({ excludeInputs: true });

    // Accumulate context for next LLM call.
    accumulatedMessages.push({ role: "assistant", content: assistantContent });
    for (const tc of llmCall.toolCalls) {
      accumulatedMessages.push({
        role: "tool",
        tool_call_id: tc.tool_use.id,
        content: [{ type: "text", text: tc.result?.content ?? "" }],
      });
    }

    lastEndTime = assistantEndTime;
  }

  // 4. Complete the turn run (only if we created it ourselves)
  if (shouldCreateTurn) {
    const turnOutputs = accumulatedMessages.filter((m) => m.role !== "user");

    // Mark incomplete turns with an error so they're visible in LangSmith
    const error = turn.isComplete ? undefined : "Interrupted";
    const runTree = new RunTree({
      client,
      replicas,
      id: turnRunId,
      run_type: "chain",
      trace_id: traceId,
      dotted_order: parentDottedOrder,
      name: USER_PROMPT_TURN_NAME,
      project_name: project,
      start_time: turn.userTimestamp,
      end_time: lastEndTime,
      outputs: { messages: turnOutputs },
      error: error,
      extra: {
        metadata: {
          thread_id: sessionId,
          ls_integration: "claude-code",
          turn_number: turnNum,
        },
      },
    });

    await runTree.patchRun({ excludeInputs: true });
  }

  const status = turn.isComplete ? "complete" : "interrupted";
  logger.log(
    `Traced turn ${turnNum}: ${turnRunId} with ${turn.llmCalls.length} LLM call(s) [${status}]`,
  );

  return taskRunMap;
}

// ─── Interrupted turn recovery ──────────────────────────────────────────────

/**
 * Close an interrupted turn run (Stop never fired for it).
 * Traces any LLM calls from the transcript, processes pending subagents,
 * closes the parent run with "User interrupt", and flushes pending traces.
 *
 * Used by UserPromptSubmit (on next prompt in same session) and SessionEnd
 * (on session exit after interrupt).
 *
 * @returns The advanced `lastLine` and number of turns traced, so the caller
 *          can advance `last_line` / `turn_count` in state.
 */
export async function closeInterruptedTurn(options: {
  sessionId: string;
  sessionState: import("./types.js").SessionState;
  transcriptPath: string | undefined;
  project: string;
  stateFilePath: string;
}): Promise<{ lastLine: number; turnsTraced: number }> {
  const { sessionId, sessionState, transcriptPath, project, stateFilePath } = options;
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized — call initTracing() first");

  let lastLine = sessionState.last_line;
  let turnsTraced = 0;
  let taskRunMap = sessionState.task_run_map ?? {};

  // Trace LLM calls from the transcript if we have a path.
  if (transcriptPath) {
    try {
      const { messages, lastLine: newLastLine } = readTranscript(
        transcriptPath,
        sessionState.last_line,
      );
      if (messages.length > 0) {
        const turns = groupIntoTurns(messages);
        if (turns.length > 0) {
          await traceTurn({
            turn: turns[turns.length - 1],
            sessionId,
            turnNum: sessionState.turn_count + 1,
            project,
            parentRunId: sessionState.current_turn_run_id,
            existingTaskRunMap: taskRunMap,
            tracedToolUseIds: new Set(sessionState.traced_tool_use_ids ?? []),
            traceId: sessionState.current_trace_id,
            parentDottedOrder: sessionState.current_dotted_order,
          });
          lastLine = newLastLine;
          turnsTraced = 1;
        }
      }
    } catch (err) {
      logger.error(`Failed to trace interrupted turn transcript: ${err}`);
    }
  }

  // Re-read state to pick up any task_run_map / pending_subagent_traces written by
  // async PostToolUse / SubagentStop hooks after the snapshot was taken.
  const freshSession = getSessionState(loadState(stateFilePath), sessionId);
  taskRunMap = { ...taskRunMap, ...freshSession.task_run_map };
  const pendingSubagents = freshSession.pending_subagent_traces ?? [];

  // Trace any pending subagents queued by SubagentStop.
  if (pendingSubagents.length > 0) {
    try {
      await tracePendingSubagents({
        sessionId,
        pendingSubagents,
        taskRunMap,
        parentTraceId: sessionState.current_trace_id,
        project,
      });
    } catch (err) {
      logger.error(`Failed to trace pending subagents on interrupt: ${err}`);
    }
  }

  const runTree = new RunTree({
    client,
    replicas,
    id: sessionState.current_turn_run_id!,
    run_type: "chain",
    trace_id: sessionState.current_trace_id,
    name: USER_PROMPT_TURN_NAME,
    project_name: project,
    dotted_order: sessionState.current_dotted_order,
    parent_run_id: sessionState.current_parent_run_id,
    start_time: sessionState.current_turn_start,
    end_time: new Date().toISOString(),
    error: "User interrupt",
    extra: {
      metadata: {
        thread_id: sessionId,
        ls_integration: "claude-code",
        turn_number: sessionState.current_turn_number,
      },
    },
  });

  // Close the parent turn run with "User interrupt".
  await runTree.patchRun({ excludeInputs: true });

  await flushPendingTraces();

  return { lastLine, turnsTraced };
}

// ─── Subagent tracing ────────────────────────────────────────────────────────

export interface PendingSubagent {
  agent_id: string;
  agent_type: string;
  agent_transcript_path: string;
  session_id: string;
}

export interface TaskRunEntry {
  run_id: string;
  dotted_order: string;
  deferred?: Record<string, unknown>;
}

/**
 * Trace pending subagents queued by SubagentStop.
 * Used by both the Stop hook (normal completion) and UserPromptSubmit
 * (interrupted turn recovery).
 */
export async function tracePendingSubagents(options: {
  sessionId: string;
  pendingSubagents: PendingSubagent[];
  taskRunMap: Record<string, TaskRunEntry>;
  parentTraceId: string | undefined;
  project: string;
}): Promise<void> {
  const { sessionId, pendingSubagents, taskRunMap, parentTraceId, project } = options;

  if (!client && !replicas) {
    throw new Error("LangSmith client not initialized — call initTracing() first");
  }

  if (!parentTraceId) {
    logger.warn("Cannot trace subagents: no parent trace ID");
    return;
  }

  for (const subagent of pendingSubagents) {
    try {
      const taskRunInfo = taskRunMap[subagent.agent_id];
      if (!taskRunInfo) {
        logger.error(`No Agent tool run found for ${subagent.agent_id} - cannot trace subagent`);
        continue;
      }

      const parentToolRunId = taskRunInfo.run_id;
      const agentToolDottedOrder = taskRunInfo.dotted_order;
      const toolName = subagent.agent_type || "Agent";
      const deferred = taskRunInfo.deferred;

      logger.debug(
        `Processing subagent ${toolName} (${subagent.agent_id}) under run ${parentToolRunId}`,
      );

      // Read subagent transcript and trace its turns.
      const { messages: subagentMessages } = readTranscript(subagent.agent_transcript_path, -1);
      if (subagentMessages.length === 0) {
        logger.debug(`Empty subagent transcript: ${subagent.agent_transcript_path}`);
        continue;
      }

      const subagentTurns = groupIntoTurns(subagentMessages);

      // PreToolUse records start time before the tool runs; PostToolUse records
      // end time after — so deferred times already bracket the subagent's transcript.
      const subagentStartTime =
        (deferred?.start_time as string | undefined) ?? new Date().toISOString();
      const subagentEndTime =
        (deferred?.end_time as string | undefined) ?? new Date().toISOString();

      // PostToolUse deferred the Agent tool run creation so we can use the
      // real subagent name. Create it now with the correct name and clamped times.
      if (deferred) {
        const runTree = new RunTree({
          client,
          replicas,
          id: parentToolRunId,
          name: "Agent",
          run_type: "tool",
          inputs: { input: deferred.inputs ?? {} },
          outputs: { output: deferred.outputs ?? {} },
          project_name: deferred.project_name as string | undefined,
          start_time: subagentStartTime,
          end_time: subagentEndTime,
          parent_run_id: deferred.parent_run_id as string,
          trace_id: deferred.trace_id as string,
          dotted_order: agentToolDottedOrder,
          extra: {
            metadata: {
              thread_id: sessionId,
              ls_integration: "claude-code",
              tool_name: "Agent",
              agent_type: toolName,
              agent_id: subagent.agent_id,
            },
          },
        });
        await runTree.postRun();
      }

      // Create an intermediate chain run as a child of the Agent tool run,
      // then nest all subagent turns under it.
      const subagentChainId = uuid7();
      const subagentChainDottedOrder = `${agentToolDottedOrder}.${generateDottedOrderSegment(subagentStartTime, subagentChainId)}`;

      const runTree = new RunTree({
        client,
        replicas,
        id: subagentChainId,
        name: `${toolName} Subagent`,
        run_type: "chain",
        inputs: deferred?.inputs ?? {},
        outputs: { output: deferred?.outputs },
        project_name: project,
        start_time: subagentStartTime,
        end_time: subagentEndTime,
        parent_run_id: parentToolRunId,
        trace_id: parentTraceId,
        dotted_order: subagentChainDottedOrder,
        extra: {
          metadata: {
            thread_id: sessionId,
            ls_integration: "claude-code",
            ls_agent_type: "subagent",
            agent_type: toolName,
            agent_id: subagent.agent_id,
          },
        },
      });
      await runTree.postRun();

      for (let i = 0; i < subagentTurns.length; i++) {
        await traceTurn({
          turn: subagentTurns[i],
          sessionId,
          turnNum: i + 1,
          project,
          parentRunId: subagentChainId,
          existingTaskRunMap: undefined,
          traceId: parentTraceId,
          parentDottedOrder: subagentChainDottedOrder,
        });
      }

      logger.log(
        `Traced subagent ${toolName} (${subagent.agent_id}): ${subagentTurns.length} turn(s)`,
      );
    } catch (err) {
      logger.error(`Failed to trace subagent ${subagent.agent_id}: ${err}`);
    }
  }
}

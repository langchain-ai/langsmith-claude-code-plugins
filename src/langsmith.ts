/**
 * LangSmith run construction and submission.
 *
 * Converts parsed Turns into LangSmith run hierarchies and sends them
 * via the LangSmith JS SDK RunTree API, which handles batching, multipart
 * serialization, retries, and auth automatically.
 */

import { Client } from "langsmith";
import type { Turn, ContentBlock, Usage } from "./types.js";
import * as logger from "./logger.js";
import { debug } from "./logger.js";

// ─── Client setup ───────────────────────────────────────────────────────────

let client: Client | null = null;

export function initClient(apiKey: string, apiUrl: string): Client {
  client = new Client({ apiKey, apiUrl });
  return client;
}

/** Flush all pending batches to ensure traces are sent before hook exits. */
export async function flushPendingTraces(): Promise<void> {
  if (!client) {
    logger.warn("Cannot flush: client not initialized");
    return;
  }
  if (typeof client.awaitPendingTraceBatches !== "function") {
    logger.warn("Cannot flush: awaitPendingTraceBatches not available on client");
    return;
  }
  logger.debug("Awaiting pending trace batches...");
  await client.awaitPendingTraceBatches();
  logger.debug("Trace batches flushed successfully");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert ISO timestamp to milliseconds since epoch. */
function isoToMillis(iso: string): number {
  return new Date(iso).getTime();
}

/**
 * Generate dotted order segment for a run.
 * Format: stripNonAlphanumeric(ISO_timestamp_with_execution_order) + runId
 * Based on LangSmith's convertToDottedOrderFormat function.
 */
export function generateDottedOrderSegment(
  epoch: number,
  runId: string,
  executionOrder: number = 1,
): string {
  // Add microsecond precision using execution order
  const paddedOrder = executionOrder.toFixed(0).slice(0, 3).padStart(3, "0");
  const isoWithMicroseconds = `${new Date(epoch).toISOString().slice(0, -1)}${paddedOrder}Z`;
  // Strip non-alphanumeric characters
  const stripped = isoWithMicroseconds.replace(/[-:.]/g, "");
  return stripped + runId;
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

/** Build usage_metadata from Usage for LangSmith. */
function buildUsageMetadata(usage: Usage) {
  return {
    input_tokens:
      (usage.input_tokens ?? 0) +
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0),
    output_tokens: usage.output_tokens ?? 0,
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
  isSubagent?: boolean;
  parentRunId?: string;
  existingTaskRunMap?: Record<string, { run_id: string; dotted_order: string }>;
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
    isSubagent = false,
    parentRunId,
    existingTaskRunMap,
    traceId: providedTraceId,
    parentDottedOrder: providedParentDottedOrder,
  } = options;

  let traceId = providedTraceId;
  let parentDottedOrder = providedParentDottedOrder;
  if (!client) {
    throw new Error("LangSmith client not initialized — call initClient() first");
  }

  const userContent = [{ type: "text", text: turn.userContent }];

  // Build tags - add "subagent" tag if this is a subagent trace
  const tags = ["claude-code", `turn-${turnNum}`];
  if (isSubagent) {
    tags.push("subagent");
  }

  // Determine the turn run ID and whether we need to create it
  let turnRunId: string;
  let shouldCreateTurn = false;

  if (parentRunId) {
    // UserPromptSubmit already created the Turn run (or this is a subagent under a tool run)
    // Use it as parent for LLM/tool runs
    debug(`Using existing run ${parentRunId} as parent for LLM/tool runs`);
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
    const { randomUUID } = await import("crypto");
    turnRunId = randomUUID();
    traceId = turnRunId; // This turn is its own trace root

    const turnStartTime = isoToMillis(turn.userTimestamp);
    parentDottedOrder = generateDottedOrderSegment(turnStartTime, turnRunId, 1);

    debug(`Creating new standalone turn run ${turnRunId}`);
    await client.createRun({
      id: turnRunId,
      name: "Claude Code",
      run_type: "chain",
      inputs: { messages: [{ role: "user", content: userContent }] },
      project_name: project,
      start_time: turnStartTime,
      trace_id: traceId,
      dotted_order: parentDottedOrder,
      extra: {
        metadata: {
          thread_id: sessionId,
          tags,
          turn_number: turnNum,
          ...(isSubagent ? { ls_subagent: true } : {}),
        },
      },
    });
  }

  // Track accumulated messages for LLM input context.
  const accumulatedMessages: Array<Record<string, unknown>> = [
    { role: "user", content: userContent },
  ];

  // Track Task tool runs for subagent linking (merge with existing)
  const taskRunMap: Record<string, { run_id: string; dotted_order: string }> = { ...existingTaskRunMap };

  let lastEndTime = turn.userTimestamp;
  let childCounter = 0;

  // 2. Process each LLM call - create as children of the turn run
  for (const llmCall of turn.llmCalls) {
    const assistantContent = formatContent(llmCall.content);

    // Generate run ID for this LLM call
    const { randomUUID } = await import("crypto");
    const assistantRunId = randomUUID();
    childCounter++;
    const assistantStartTime = isoToMillis(llmCall.startTime);
    const assistantDottedOrderSegment = generateDottedOrderSegment(
      assistantStartTime,
      assistantRunId,
      childCounter,
    );
    const assistantDottedOrder = `${parentDottedOrder}.${assistantDottedOrderSegment}`;

    // Create assistant (LLM) run as child of turn using Client API
    await client.createRun({
      id: assistantRunId,
      name: "Claude",
      run_type: "llm",
      inputs: { messages: [...accumulatedMessages] },
      project_name: project,
      start_time: assistantStartTime,
      parent_run_id: turnRunId,
      trace_id: traceId,
      dotted_order: assistantDottedOrder,
      extra: {
        metadata: {
          thread_id: sessionId,
          ls_provider: "anthropic",
          ls_model_name: llmCall.model,
          usage_metadata: buildUsageMetadata(llmCall.usage),
        },
        tags: [llmCall.model],
      },
    });

    // 3. Create tool runs (siblings of assistant, children of turn).
    for (const toolCall of llmCall.toolCalls) {
      // Skip Task tools that were already traced by PostToolUse hook
      if (toolCall.agentId && existingTaskRunMap?.[toolCall.agentId]) {
        debug(`Skipping Task tool for agent ${toolCall.agentId} - already traced by PostToolUse`);
        lastEndTime = toolCall.result?.timestamp ?? llmCall.endTime;
        continue;
      }

      const toolStartTime = llmCall.endTime; // tools start after LLM finishes
      const toolEndTime = toolCall.result?.timestamp ?? llmCall.endTime;

      // Generate run ID for this tool
      const toolRunId = randomUUID();
      childCounter++;
      const toolStartTimeMs = isoToMillis(toolStartTime);
      const toolDottedOrderSegment = generateDottedOrderSegment(
        toolStartTimeMs,
        toolRunId,
        childCounter,
      );
      const toolDottedOrder = `${parentDottedOrder}.${toolDottedOrderSegment}`;

      // Create tool run as child of turn using Client API
      await client.createRun({
        id: toolRunId,
        name: toolCall.tool_use.name,
        run_type: "tool",
        inputs: { input: toolCall.tool_use.input },
        project_name: project,
        start_time: toolStartTimeMs,
        parent_run_id: turnRunId,
        trace_id: traceId,
        dotted_order: toolDottedOrder,
        extra: {
          metadata: {
            thread_id: sessionId,
          },
          tags: ["tool"],
        },
      });

      // Update tool run with output
      await client.updateRun(toolRunId, {
        trace_id: traceId,
        dotted_order: toolDottedOrder,
        end_time: Math.max(isoToMillis(toolEndTime), toolStartTimeMs + 1),
        outputs: { output: toolCall.result?.content ?? "No result" },
      });

      // If this is a Task tool, store the run ID and dotted_order for subagent linking
      if (toolCall.agentId) {
        taskRunMap[toolCall.agentId] = {
          run_id: toolRunId,
          dotted_order: toolDottedOrder,
        };
        debug(
          `Task tool ${toolCall.tool_use.id} → agentId=${toolCall.agentId}, runId=${toolRunId}`,
        );
      }

      lastEndTime = toolEndTime;
    }

    // Complete the assistant run.
    const assistantEndTime = llmCall.toolCalls.length > 0 ? lastEndTime : llmCall.endTime;
    const assistantEndTimeMs = Math.max(isoToMillis(assistantEndTime), assistantStartTime + 1);

    await client.updateRun(assistantRunId, {
      trace_id: traceId,
      dotted_order: assistantDottedOrder,
      end_time: assistantEndTimeMs,
      outputs: {
        messages: [{ role: "assistant", content: assistantContent }],
      },
      extra: {
        metadata: {
          usage_metadata: buildUsageMetadata(llmCall.usage),
        },
      },
    });

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

    await client.updateRun(turnRunId, {
      trace_id: traceId,
      dotted_order: parentDottedOrder,
      end_time: isoToMillis(lastEndTime),
      outputs: { messages: turnOutputs },
      error: error,
    });
  }

  const status = turn.isComplete ? "complete" : "interrupted";
  logger.log(
    `Traced turn ${turnNum}: ${turnRunId} with ${turn.llmCalls.length} LLM call(s) [${status}]`,
  );

  return taskRunMap;
}

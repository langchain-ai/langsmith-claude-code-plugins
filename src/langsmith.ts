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
import { codingAgentMetadata } from "./metadata.js";

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
  /** Base coding-agent-v1 metadata (config base + user env metadata) merged onto every run. */
  customMetadata?: Record<string, unknown>;
  /** Claude Code CLI version → `ls_agent_runtime_version`. */
  runtimeVersion?: string;
  /** Permission mode → `approval_policy` (stamped on root/standalone turn runs only). */
  approvalPolicy?: string;
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
    customMetadata,
    runtimeVersion,
    approvalPolicy,
  } = options;

  // turn_id for every run created for this turn (transcript promptId).
  const turnId = turn.promptId;

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
      extra: {
        metadata: codingAgentMetadata({
          sessionId,
          base: customMetadata,
          turnId,
          turnNumber: turnNum,
          runtimeVersion,
          approvalPolicy,
          legacyRole: "root", // DEPRECATED compat alias ls_agent_type="root".
        }),
      },
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
          metadata: codingAgentMetadata({
            sessionId,
            base: customMetadata,
            turnId,
            turnNumber: turnNum,
            runtimeVersion,
            toolName: toolCall.tool_use.name,
            runName: toolCall.tool_use.name,
          }),
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
        metadata: codingAgentMetadata({
          sessionId,
          base: customMetadata,
          turnId,
          turnNumber: turnNum,
          runtimeVersion,
          runSpecific: {
            ls_provider: "anthropic",
            ls_model_name: llmCall.model,
            ls_invocation_params: {
              model: llmCall.model,
            },
            usage_metadata: buildUsageMetadata(llmCall.usage),
            ...(llmCall.synthetic ? { synthetic: true } : {}),
          },
        }),
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
        metadata: codingAgentMetadata({
          sessionId,
          base: customMetadata,
          turnId,
          turnNumber: turnNum,
          runtimeVersion,
          approvalPolicy,
          legacyRole: "root", // DEPRECATED compat alias ls_agent_type="root".
        }),
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

// ─── Turn run completion ─────────────────────────────────────────────────────

/** Identity + metadata needed to patch a root "Turn" run closed. */
export interface TurnRunIdentity {
  sessionId: string;
  project: string;
  runId: string;
  traceId?: string;
  dottedOrder?: string;
  parentRunId?: string;
  startTime?: string;
  turnId?: string;
  turnNumber?: number;
  runtimeVersion?: string;
  approvalPolicy?: string;
  customMetadata?: Record<string, unknown>;
}

/**
 * Patch a root "Turn" run closed — the single place every hook funnels through
 * to finalize a turn. `result` decides success vs. force-close: a
 * `lastAssistantMessage` writes outputs; an `error` writes an error/status.
 * A run can only be patched-closed once (LangSmith rejects re-patching a run
 * that already has an end_time), so callers must keep the run open until here.
 */
async function patchTurnRun(
  id: TurnRunIdentity,
  result: { lastAssistantMessage?: string } | { error: string },
): Promise<void> {
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized — call initTracing() first");

  const runTree = new RunTree({
    client,
    replicas,
    name: USER_PROMPT_TURN_NAME,
    run_type: "chain",
    project_name: id.project,
    id: id.runId,
    trace_id: id.traceId,
    dotted_order: id.dottedOrder,
    parent_run_id: id.parentRunId,
    start_time: id.startTime,
    end_time: new Date().toISOString(),
    ...("error" in result
      ? { error: result.error }
      : { outputs: { messages: [{ role: "assistant", content: result.lastAssistantMessage }] } }),
    extra: {
      metadata: codingAgentMetadata({
        sessionId: id.sessionId,
        base: id.customMetadata,
        turnId: id.turnId,
        turnNumber: id.turnNumber,
        runtimeVersion: id.runtimeVersion,
        approvalPolicy: id.approvalPolicy,
        legacyRole: "root", // DEPRECATED compat alias ls_agent_type="root".
      }),
    },
  });
  await runTree.patchRun({ excludeInputs: true });
}

/** Build a TurnRunIdentity from a stored OpenTurn (deferred / awaiting-subagent turn). */
export function turnIdentityFromOpenTurn(
  turn: import("./types.js").OpenTurn,
  ctx: { sessionId: string; project: string; customMetadata?: Record<string, unknown> },
): TurnRunIdentity {
  return {
    sessionId: ctx.sessionId,
    project: ctx.project,
    customMetadata: ctx.customMetadata,
    runId: turn.run_id,
    traceId: turn.trace_id,
    dottedOrder: turn.dotted_order,
    parentRunId: turn.parent_run_id,
    startTime: turn.start_time,
    turnId: turn.turn_id,
    turnNumber: turn.turn_number,
    runtimeVersion: turn.runtime_version,
    approvalPolicy: turn.approval_policy,
  };
}

/**
 * Complete (patch) the root "Turn" run created by UserPromptSubmit with its
 * final assistant outputs. Shared by every hook that finalizes a turn normally
 * (Stop, SubagentStop draining the last subagent, the task-notification turn's
 * Stop). Force-closing with an error goes through {@link closeTurnRun} instead.
 */
export async function completeTurnRun(options: {
  sessionId: string;
  runId: string;
  traceId?: string;
  dottedOrder?: string;
  parentRunId?: string;
  startTime?: string;
  project: string;
  /** Final assistant message → root run outputs. */
  lastAssistantMessage?: string;
  customMetadata?: Record<string, unknown>;
  turnId?: string;
  turnNumber?: number;
  runtimeVersion?: string;
  approvalPolicy?: string;
}): Promise<void> {
  await patchTurnRun(options, { lastAssistantMessage: options.lastAssistantMessage });
}

/** Force-close a turn's root run with an error/status (e.g. session ended). */
export async function closeTurnRun(id: TurnRunIdentity, error: string): Promise<void> {
  await patchTurnRun(id, { error });
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
  customMetadata?: Record<string, unknown>;
  /** Claude Code CLI version → `ls_agent_runtime_version`. */
  runtimeVersion?: string;
  /** Permission mode → `approval_policy` for the interrupted root turn. */
  approvalPolicy?: string;
  /** Close an explicit (already-fully-traced) deferred turn from open_turns
   *  instead of the live current turn. When set, the transcript / pending-subagent
   *  catch-up tracing is skipped — that turn's content was already traced by Stop;
   *  we only need to close its root run. */
  turn?: import("./types.js").OpenTurn;
  /** Root-run error/status message. Defaults to "User interrupt". */
  error?: string;
}): Promise<{ lastLine: number; turnsTraced: number }> {
  const {
    sessionId,
    sessionState,
    transcriptPath,
    project,
    stateFilePath,
    customMetadata,
    runtimeVersion,
    approvalPolicy,
    turn,
    error: errorMessage = "User interrupt",
  } = options;
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized — call initTracing() first");

  // Fast path: closing an explicit deferred turn (already traced by Stop). Just
  // patch its root run with the error message; no transcript/subagent catch-up.
  if (turn) {
    await closeTurnRun(
      {
        ...turnIdentityFromOpenTurn(turn, { sessionId, project, customMetadata }),
        runtimeVersion: turn.runtime_version ?? runtimeVersion,
        approvalPolicy: turn.approval_policy ?? approvalPolicy,
      },
      errorMessage,
    );
    await flushPendingTraces();
    return { lastLine: sessionState.last_line, turnsTraced: 0 };
  }

  let lastLine = sessionState.last_line;
  let turnsTraced = 0;
  let taskRunMap = sessionState.task_run_map ?? {};
  // Parent turn markers to propagate onto subagent runs.
  let turnId: string | undefined;
  const turnNumber = sessionState.current_turn_number;

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
          turnId = turns[turns.length - 1].promptId;
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
            customMetadata,
            runtimeVersion,
            approvalPolicy,
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
        customMetadata,
        runtimeVersion,
        turnId,
        turnNumber,
      });
    } catch (err) {
      logger.error(`Failed to trace pending subagents on interrupt: ${err}`);
    }
  }

  // Close the parent turn run with the error message.
  await closeTurnRun(
    {
      sessionId,
      project,
      customMetadata,
      runId: sessionState.current_turn_run_id!,
      traceId: sessionState.current_trace_id,
      dottedOrder: sessionState.current_dotted_order,
      parentRunId: sessionState.current_parent_run_id,
      startTime: sessionState.current_turn_start,
      turnNumber: sessionState.current_turn_number,
      runtimeVersion,
      approvalPolicy,
    },
    errorMessage,
  );

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
  /** Subagent type, recorded by SubagentStop; used when closing the Agent run. */
  agent_type?: string;
  /** True once SubagentStop has processed this async subagent (the join's
   *  subagent-side "done" marker, replacing the former open_agent_runs map). */
  subagent_done?: boolean;
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
  customMetadata?: Record<string, unknown>;
  /** Claude Code CLI version → `ls_agent_runtime_version`. */
  runtimeVersion?: string;
  /** Enclosing turn's promptId → `turn_id` on the subagent + Agent tool runs. */
  turnId?: string;
  /** Enclosing turn's 1-based index → `turn_number` (not re-incremented). */
  turnNumber?: number;
  /** Post the Agent tool run *open* (no end_time) so a later task-notification
   *  turn can nest under it within bounds. The caller must close it (via
   *  {@link closeAgentToolRun}) once that follow-up is done. Used for async
   *  (background) subagents, which always emit a task-notification afterward. */
  keepAgentToolRunOpen?: boolean;
}): Promise<string[]> {
  const {
    sessionId,
    pendingSubagents,
    taskRunMap,
    parentTraceId,
    project,
    customMetadata,
    runtimeVersion,
    turnId,
    turnNumber,
    keepAgentToolRunOpen,
  } = options;

  // agent_ids whose Agent tool run we posted *open* (keepAgentToolRunOpen), so
  // the caller knows which runs it's responsible for closing later.
  const openedAgentRunIds: string[] = [];

  if (!client && !replicas) {
    throw new Error("LangSmith client not initialized — call initTracing() first");
  }

  if (!parentTraceId) {
    logger.warn("Cannot trace subagents: no parent trace ID");
    return openedAgentRunIds;
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

      // Read subagent transcript. We still post the Agent tool run even when the
      // transcript is empty/unreadable (aborted or not-yet-flushed subagent), so
      // the run is opened and the launching turn can be drained/finalized normally
      // — only the inner subagent chain/turns are skipped. (Returning early here
      // would strand the launching turn open until SessionEnd.)
      const { messages: subagentMessages } = readTranscript(subagent.agent_transcript_path, -1);
      const subagentTurns = subagentMessages.length > 0 ? groupIntoTurns(subagentMessages) : [];
      if (subagentTurns.length === 0) {
        logger.debug(`Empty/unreadable subagent transcript: ${subagent.agent_transcript_path}`);
      }

      const subagentStartTime =
        (deferred?.start_time as string | undefined) ?? new Date().toISOString();
      // The Agent tool run and the subagent chain run must span the subagent's own
      // LLM/tool runs. For a *background* agent the deferred end_time is the launch
      // time (PostToolUse fires when the Task tool returns at launch, not when the
      // subagent finishes), which would leave the chain too short to contain its
      // children. Extend the end to the latest timestamp the subagent transcript
      // actually contains. (For a synchronous agent the deferred end already covers
      // it — ISO timestamps compare chronologically, so the max is a no-op.)
      const lastSubagentActivity = subagentTurns.reduce(
        (max, t) => t.llmCalls.reduce((m, c) => (c.endTime > m ? c.endTime : m), max),
        "",
      );
      const deferredEnd = (deferred?.end_time as string | undefined) ?? "";
      const subagentEndTime =
        (lastSubagentActivity > deferredEnd ? lastSubagentActivity : deferredEnd) ||
        new Date().toISOString();

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
          // Leave open for async agents — the task-notification turn nests under
          // this run, so it can't be closed until that turn completes.
          end_time: keepAgentToolRunOpen ? undefined : subagentEndTime,
          parent_run_id: deferred.parent_run_id as string,
          trace_id: deferred.trace_id as string,
          dotted_order: agentToolDottedOrder,
          extra: {
            metadata: codingAgentMetadata({
              sessionId,
              base: customMetadata,
              runtimeVersion,
              turnId,
              turnNumber,
              // run_type "tool" (run name "Agent", native tool "Task").
              toolName: "Task",
              runName: "Agent",
              runSpecific: {
                agent_type: toolName, // DEPRECATED compat alias.
                agent_id: subagent.agent_id, // DEPRECATED compat alias.
              },
            }),
          },
        });
        await runTree.postRun();
        if (keepAgentToolRunOpen) openedAgentRunIds.push(subagent.agent_id);
      }

      // Nest the subagent's own work under the Agent tool run — skipped when the
      // transcript was empty (the Agent tool run above still represents the run).
      if (subagentTurns.length > 0) {
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
            metadata: codingAgentMetadata({
              sessionId,
              base: customMetadata,
              runtimeVersion,
              turnId,
              turnNumber,
              legacyRole: "subagent", // DEPRECATED compat alias.
              subagentId: subagent.agent_id, // → ls_subagent_id (+ agent_id alias).
              subagentType: toolName, // → ls_subagent_type (+ agent_type alias).
            }),
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
            customMetadata,
            runtimeVersion,
          });
        }

        logger.log(
          `Traced subagent ${toolName} (${subagent.agent_id}): ${subagentTurns.length} turn(s)`,
        );
      }
    } catch (err) {
      logger.error(`Failed to trace subagent ${subagent.agent_id}: ${err}`);
    }
  }

  return openedAgentRunIds;
}

/**
 * Close (patch) an Agent tool run that was posted open by
 * {@link tracePendingSubagents} with `keepAgentToolRunOpen`. Reconstructs the
 * run from its stored `task_run_map` entry and stamps the end_time now. Called
 * once the agent's task-notification turn (which nests under it) has completed,
 * or by SessionEnd as a backstop.
 */
export async function closeAgentToolRun(options: {
  sessionId: string;
  agentId: string;
  agentType: string;
  taskRunInfo: TaskRunEntry;
  project: string;
  customMetadata?: Record<string, unknown>;
  runtimeVersion?: string;
  turnId?: string;
  turnNumber?: number;
}): Promise<void> {
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized — call initTracing() first");

  const deferred = (options.taskRunInfo.deferred ?? {}) as Record<string, unknown>;
  const toolName = options.agentType || "Agent";

  const runTree = new RunTree({
    client,
    replicas,
    id: options.taskRunInfo.run_id,
    name: "Agent",
    run_type: "tool",
    inputs: { input: deferred.inputs ?? {} },
    outputs: { output: deferred.outputs ?? {} },
    project_name: (deferred.project_name as string | undefined) ?? options.project,
    start_time: deferred.start_time as string | undefined,
    end_time: new Date().toISOString(),
    parent_run_id: deferred.parent_run_id as string | undefined,
    trace_id: deferred.trace_id as string | undefined,
    dotted_order: options.taskRunInfo.dotted_order,
    extra: {
      metadata: codingAgentMetadata({
        sessionId: options.sessionId,
        base: options.customMetadata,
        runtimeVersion: options.runtimeVersion,
        turnId: options.turnId,
        turnNumber: options.turnNumber,
        toolName: "Task",
        runName: "Agent",
        runSpecific: {
          agent_type: toolName, // DEPRECATED compat alias.
          agent_id: options.agentId, // DEPRECATED compat alias.
        },
      }),
    },
  });
  await runTree.patchRun({ excludeInputs: true });
}

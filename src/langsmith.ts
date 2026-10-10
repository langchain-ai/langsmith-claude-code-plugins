/**
 * LangSmith run construction and submission.
 *
 * Converts parsed Turns into LangSmith run hierarchies and sends them
 * via the LangSmith JS SDK RunTree API, which handles batching, multipart
 * serialization, retries, and auth automatically.
 */

import { resolveTurnTracingMode } from "./tracing-mode.js";
import { Client, RunTree, RunTreeConfig, uuid7FromTime } from "langsmith";
import { createSecretAnonymizer } from "langsmith/anonymizer";
import type { StringNodeRule } from "langsmith/anonymizer";
import type {
  Turn,
  ContentBlock,
  Usage,
  OpenTurn,
  SessionState,
  TracingMode,
  LSAgentType,
  CodingAgentMetadataOptions,
} from "./types.js";
import {
  readTranscript,
  groupIntoTurns,
  resolveProvider,
  completedToolUseIds,
  turnToolInputs,
} from "./transcript.js";
import { loadState, getSessionState } from "./state.js";
import * as logger from "./logger.js";
import {
  ASSISTANT_RUN_NAME,
  CLAUDE_CODE_INTEGRATION,
  CLAUDE_AGENT_CLOSURE_EVENT_SUFFIX,
  CLAUDE_TURN_CLOSURE_EVENT_SUFFIX,
  CLAUDE_TURN_PROGRESS_EVENT_SUFFIX,
  REPOSITORY_METADATA_KEYS,
  USER_PROMPT_TURN_NAME,
} from "./constants.js";
import { codingAgentMetadata, codingAgentMetadataOptions, skillNameFromTool } from "./metadata.js";
import { createRunTree } from "./privacy.js";
import {
  awaitsTheTurn,
  repoScopedMetadata,
  sessionScopedMetadata,
  turnScopedMetadata,
} from "./repo-attribution.js";
import { attributionFiller } from "./reconcile.js";
import { readTurnRecord, recordDelivered, recordRun } from "./turn-record.js";
import type { TurnRecordTarget } from "./types.js";
import type { ClaudeSharedChildRunIds, ClaudeSharedRunCapture } from "./models/tracing-engine.js";

// ─── Client setup ───────────────────────────────────────────────────────────

let client: Client | undefined = undefined;
let replicas: RunTreeConfig["replicas"] | undefined = undefined;

function metadataOptionsForTurn(
  options: CodingAgentMetadataOptions,
  fill: (metadata: Record<string, unknown>) => Record<string, unknown>,
) {
  const filled = fill(codingAgentMetadata(options));
  const base = { ...options.base };
  for (const key of REPOSITORY_METADATA_KEYS) {
    if (base[key] === undefined && filled[key] !== undefined) base[key] = filled[key];
  }
  return codingAgentMetadataOptions({
    ...options,
    ...(options.base === undefined && Object.keys(base).length === 0 ? {} : { base }),
  });
}

export function initTracing(
  apiKey?: string,
  apiUrl?: string,
  providedReplicas?: RunTreeConfig["replicas"],
  redact: boolean = true,
  extraRedactionRules?: StringNodeRule[],
) {
  // When redaction is on, attach an anonymizer that strips common secrets from
  // run inputs/outputs/metadata client-side, before upload. Because every
  // RunTree here is created with this client, the anonymizer also covers
  // replica destinations (they reuse the run's client unless given their own).
  const anonymizer = redact
    ? createSecretAnonymizer(extraRedactionRules ? { extraRules: extraRedactionRules } : undefined)
    : undefined;

  // Always retain the configured endpoint, even without a primary API key or
  // redaction. Replicas can carry their own auth and inherit this client's URL;
  // falling back to the shared client would silently use the SDK's default URL.
  client = new Client({ apiKey: apiKey || undefined, apiUrl, anonymizer });
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
  tracing?: TracingMode;
  toolTracingModes?: Record<string, TracingMode>;
  turn: Turn;
  sessionId: string;
  turnNum: number;
  project: string;
  parentRunId?: string;
  existingTaskRunMap?: Record<string, TaskRunEntry>;
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
  /** Role stamped on this turn and each of its child runs. */
  agentType?: LSAgentType;
  record?: TurnRecordTarget;
  hookCwd?: string;
  captureSharedRun?: ClaudeSharedRunCapture;
}

/**
 * Trace a turn to LangSmith.
 * @returns A map of agent_id -> tool run info (ID and dotted_order) for Task tools (used to link subagent traces)
 */
export async function traceTurn(options: TraceTurnOptions): Promise<Record<string, TaskRunEntry>> {
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
    agentType = "root",
    tracing = "full",
    toolTracingModes,
    record,
    hookCwd,
    captureSharedRun,
  } = options;

  const sessionCwd = typeof customMetadata?.cwd === "string" ? customMetadata.cwd : undefined;
  const modelRunBase = sessionScopedMetadata(customMetadata, hookCwd ?? sessionCwd);

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
  const turnMetadataBase = turnScopedMetadata(customMetadata, turnToolInputs(turn), sessionCwd);
  const filledForTheTurn = attributionFiller(record);

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
    turnRunId = uuid7FromTime(turn.userTimestamp);
    traceId = turnRunId; // This turn is its own trace root

    parentDottedOrder = generateDottedOrderSegment(turn.userTimestamp, turnRunId);

    logger.debug(`Creating new standalone turn run ${turnRunId}`);
    const rootMetadataInput = {
      sessionId,
      runType: turn.isComplete
        ? agentType === "subagent"
          ? ("subagent" as const)
          : ("root" as const)
        : ("interrupted" as const),
      base: turnMetadataBase,
      turnId,
      turnNumber: turnNum,
      runtimeVersion,
      approvalPolicy,
      agentType,
    };
    const rootInputs = { messages: [{ role: "user", content: userContent }] };
    if (captureSharedRun) {
      const captured = await captureSharedRun({
        turnId: turnRunId,
        eventId: turnRunId,
        submission: {
          operation: "post",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: metadataOptionsForTurn(rootMetadataInput, filledForTheTurn),
          privacyContext: { status: "running" },
          run: {
            id: turnRunId,
            name: USER_PROMPT_TURN_NAME,
            run_type: "chain",
            inputs: rootInputs,
            start_time: turn.userTimestamp,
            trace_id: traceId,
            dotted_order: parentDottedOrder,
          },
        },
        turnEvidence: { rootRunId: turnRunId, childRunIds: [], closureState: "open" },
      });
      if (!captured) throw new Error(`Could not capture shared Claude Turn run ${turnRunId}`);
    } else {
      const runTree = createRunTree(
        {
          client,
          replicas,
          id: turnRunId,
          name: USER_PROMPT_TURN_NAME,
          run_type: "chain",
          inputs: rootInputs,
          project_name: project,
          start_time: turn.userTimestamp,
          trace_id: traceId,
          dotted_order: parentDottedOrder,
          extra: { metadata: codingAgentMetadata(rootMetadataInput) },
        },
        tracing,
      );
      await runTree.postRun();
    }
  }

  // Track accumulated messages for LLM input context.
  const accumulatedMessages: Array<Record<string, unknown>> = [
    { role: "user", content: userContent },
  ];

  // Track Task tool runs for subagent linking (merge with existing)
  const taskRunMap: Record<string, TaskRunEntry> = {
    ...existingTaskRunMap,
  };
  const sharedChildRunIds = new Set<string>();

  let lastEndTime = turn.userTimestamp;

  // 2. Process each LLM call - create as children of the turn run
  for (const llmCall of turn.llmCalls) {
    const assistantContent = formatContent(llmCall.content);

    // Generate run ID for this LLM call
    const assistantRunId = uuid7FromTime(llmCall.startTime);
    const assistantDottedOrderSegment = generateDottedOrderSegment(
      llmCall.startTime,
      assistantRunId,
    );
    const assistantDottedOrder = `${parentDottedOrder}.${assistantDottedOrderSegment}`;
    const assistantMetadataInput = {
      sessionId,
      runType: "llm" as const,
      base: modelRunBase,
      turnId,
      turnNumber: turnNum,
      runtimeVersion,
      agentType,
    };
    const assistantMetadata = filledForTheTurn(codingAgentMetadata(assistantMetadataInput));
    const assistantInputs = { messages: [...accumulatedMessages] };
    if (!captureSharedRun) {
      await createRunTree(
        {
          client,
          replicas,
          id: assistantRunId,
          name: ASSISTANT_RUN_NAME,
          run_type: "llm",
          inputs: assistantInputs,
          project_name: project,
          start_time: llmCall.startTime,
          parent_run_id: turnRunId,
          trace_id: traceId,
          dotted_order: assistantDottedOrder,
          extra: { metadata: assistantMetadata },
        },
        tracing,
      ).postRun();
    }

    // 3. Create tool runs (siblings of assistant, children of turn).
    for (const toolCall of llmCall.toolCalls) {
      // A launch snapshot may restrict, but never unmute, its enclosing turn.
      const toolMode =
        tracing === "metadata" ? "metadata" : (toolTracingModes?.[toolCall.tool_use.id] ?? tracing);
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
      const toolRunId = uuid7FromTime(toolStartTime);
      const toolDottedOrderSegment = generateDottedOrderSegment(toolStartTime, toolRunId);
      const toolDottedOrder = `${parentDottedOrder}.${toolDottedOrderSegment}`;

      const toolMetadataInput = {
        sessionId,
        runType: "tool" as const,
        base: repoScopedMetadata(turnMetadataBase, toolCall.tool_use.input, sessionCwd),
        turnId,
        turnNumber: turnNum,
        runtimeVersion,
        agentType,
        toolName: toolCall.tool_use.name,
        runName: toolCall.tool_use.name,
        skillName: skillNameFromTool(toolCall.tool_use.name, toolCall.tool_use.input),
      };
      const toolInputs = { input: toolCall.tool_use.input };
      const toolOutputs = { output: toolCall.result?.content ?? "No result" };
      if (captureSharedRun) {
        const captured = await captureSharedRun({
          turnId: traceId ?? turnRunId,
          eventId: toolRunId,
          submission: {
            operation: "post",
            integration: CLAUDE_CODE_INTEGRATION,
            privacyMode: toolMode,
            metadata: metadataOptionsForTurn(toolMetadataInput, filledForTheTurn),
            privacyContext: { status: "completed" },
            run: {
              id: toolRunId,
              name: toolCall.tool_use.name,
              run_type: "tool",
              inputs: toolInputs,
              outputs: toolOutputs,
              start_time: toolStartTime,
              end_time: toolEndTime,
              parent_run_id: turnRunId,
              trace_id: traceId,
              dotted_order: toolDottedOrder,
            },
          },
          turnEvidence: {
            rootRunId: traceId ?? turnRunId,
            childRunIds: [toolRunId],
            closureState: "open",
          },
        });
        if (!captured) throw new Error(`Could not capture shared Claude tool run ${toolRunId}`);
        sharedChildRunIds.add(toolRunId);
      } else {
        const runTree = createRunTree(
          {
            client,
            replicas,
            id: toolRunId,
            name: toolCall.tool_use.name,
            run_type: "tool",
            inputs: toolInputs,
            outputs: toolOutputs,
            project_name: project,
            start_time: toolStartTime,
            end_time: toolEndTime,
            parent_run_id: turnRunId,
            trace_id: traceId,
            dotted_order: toolDottedOrder,
            extra: { metadata: codingAgentMetadata(toolMetadataInput) },
          },
          toolMode,
        );
        await runTree.postRun();
      }

      // If this is a Task tool, store the run ID and dotted_order for subagent linking
      if (toolCall.agentId) {
        taskRunMap[toolCall.agentId] = {
          tracing: toolMode,
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
    const usageMetadata = buildUsageMetadata(llmCall.usage);
    const closedAssistantMetadataInput = {
      sessionId,
      runType: "llm" as const,
      base: modelRunBase,
      turnId,
      turnNumber: turnNum,
      runtimeVersion,
      agentType,
      modelName: llmCall.model,
      usageMetadata,
      runSpecific: {
        ls_provider: resolveProvider(llmCall.model),
        ls_model_name: llmCall.model,
        ls_invocation_params: {
          model: llmCall.model,
          ...(llmCall.effort ? { effort: llmCall.effort } : {}),
          ...(llmCall.usage.service_tier ? { service_tier: llmCall.usage.service_tier } : {}),
        },
        ...(usageMetadata === undefined ? {} : { usage_metadata: usageMetadata }),
        ...(llmCall.synthetic ? { synthetic: true } : {}),
      },
    };
    const closedAssistantMetadataOptions = metadataOptionsForTurn(
      closedAssistantMetadataInput,
      filledForTheTurn,
    );
    const closedAssistantMetadata = filledForTheTurn(
      codingAgentMetadata(closedAssistantMetadataInput),
    );
    const settlesLater = record !== undefined && awaitsTheTurn(closedAssistantMetadata);
    const assistantClose = {
      id: assistantRunId,
      run_type: "llm",
      trace_id: traceId,
      dotted_order: assistantDottedOrder,
      parent_run_id: turnRunId,
      name: ASSISTANT_RUN_NAME,
      project_name: project,
      start_time: llmCall.startTime,
      ...(settlesLater ? {} : { end_time: assistantEndTime }),
      outputs: {
        messages: [{ role: "assistant", content: assistantContent }],
      },
      extra: { metadata: closedAssistantMetadata },
    };
    if (captureSharedRun) {
      const captured = await captureSharedRun({
        turnId: traceId ?? turnRunId,
        eventId: assistantRunId,
        submission: {
          operation: "post",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: closedAssistantMetadataOptions,
          privacyContext: { status: "completed" },
          run: {
            id: assistantRunId,
            name: ASSISTANT_RUN_NAME,
            run_type: "llm",
            inputs: assistantInputs,
            outputs: { messages: [{ role: "assistant", content: assistantContent }] },
            start_time: llmCall.startTime,
            end_time: assistantEndTime,
            parent_run_id: turnRunId,
            trace_id: traceId,
            dotted_order: assistantDottedOrder,
          },
        },
        turnEvidence: {
          rootRunId: traceId ?? turnRunId,
          childRunIds: [assistantRunId],
          closureState: "open",
        },
      });
      if (!captured) throw new Error(`Could not capture shared Claude LLM run ${assistantRunId}`);
      sharedChildRunIds.add(assistantRunId);
    } else {
      const runTree = createRunTree({ ...assistantClose, client, replicas }, tracing);
      await runTree.patchRun({ excludeInputs: true });
    }

    if (settlesLater && record && !captureSharedRun) {
      recordRun({
        path: record.path,
        run: assistantClose,
        tracing,
        origin: record.origin,
        closesAt: assistantEndTime,
      });
      recordDelivered(record.path, assistantRunId);
    }

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
    const rootMetadataInput = {
      sessionId,
      runType: turn.isComplete
        ? agentType === "subagent"
          ? ("subagent" as const)
          : ("root" as const)
        : ("interrupted" as const),
      base: turnMetadataBase,
      turnId,
      turnNumber: turnNum,
      runtimeVersion,
      approvalPolicy,
      agentType,
    };
    const outputs = { messages: turnOutputs };
    const endTime = lastEndTime;
    if (captureSharedRun) {
      const captured = await captureSharedRun({
        turnId: turnRunId,
        eventId: `${turnRunId}${CLAUDE_TURN_CLOSURE_EVENT_SUFFIX}`,
        submission: {
          operation: "patch",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: metadataOptionsForTurn(rootMetadataInput, filledForTheTurn),
          privacyContext: { status: error ? "error" : "completed" },
          run: {
            id: turnRunId,
            name: USER_PROMPT_TURN_NAME,
            run_type: "chain",
            start_time: turn.userTimestamp,
            trace_id: traceId,
            dotted_order: parentDottedOrder,
          },
          patch: {
            fields: error ? ["outputs", "error", "end_time"] : ["outputs", "end_time"],
            values: { outputs, ...(error ? { error } : {}), end_time: endTime },
          },
        },
        turnEvidence: {
          rootRunId: turnRunId,
          childRunIds: [...sharedChildRunIds].sort(),
          closureState: "authoritative",
        },
      });
      if (!captured) throw new Error(`Could not capture shared Claude Turn closure ${turnRunId}`);
    } else {
      const runTree = createRunTree(
        {
          client,
          replicas,
          id: turnRunId,
          run_type: "chain",
          trace_id: traceId,
          dotted_order: parentDottedOrder,
          name: USER_PROMPT_TURN_NAME,
          project_name: project,
          start_time: turn.userTimestamp,
          end_time: endTime,
          outputs,
          error: error,
          extra: { metadata: codingAgentMetadata(rootMetadataInput) },
        },
        tracing,
      );
      await runTree.patchRun({ excludeInputs: true });
    }
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
  tracing?: TracingMode;
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
  captureSharedRun?: ClaudeSharedRunCapture;
  sharedChildRunIds?: readonly string[];
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
  leaveOpen = false,
): Promise<Record<string, unknown>> {
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized — call initTracing() first");

  const metadataInput = {
    sessionId: id.sessionId,
    runType: "error" in result ? ("interrupted" as const) : ("root" as const),
    base: id.customMetadata,
    turnId: id.turnId,
    turnNumber: id.turnNumber,
    runtimeVersion: id.runtimeVersion,
    approvalPolicy: id.approvalPolicy,
    agentType: "root" as const,
  };
  const endTime = leaveOpen ? undefined : new Date().toISOString();
  const patch =
    "error" in result
      ? {
          fields: ["error", "end_time"] as const,
          values: { error: result.error, end_time: endTime! },
        }
      : leaveOpen
        ? {
            fields: ["outputs"] as const,
            values: {
              outputs: { messages: [{ role: "assistant", content: result.lastAssistantMessage }] },
            },
          }
        : {
            fields: ["outputs", "end_time"] as const,
            values: {
              outputs: { messages: [{ role: "assistant", content: result.lastAssistantMessage }] },
              end_time: endTime,
            },
          };
  const metadata = codingAgentMetadata(metadataInput);
  const config = {
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
    ...(endTime === undefined ? {} : { end_time: endTime }),
    ...("error" in result
      ? { error: result.error }
      : { outputs: { messages: [{ role: "assistant", content: result.lastAssistantMessage }] } }),
    extra: {
      metadata,
    },
  };
  if (id.captureSharedRun) {
    const captured = await id.captureSharedRun({
      turnId: id.runId,
      eventId: `${id.runId}${"error" in result ? CLAUDE_TURN_CLOSURE_EVENT_SUFFIX : leaveOpen ? CLAUDE_TURN_PROGRESS_EVENT_SUFFIX : CLAUDE_TURN_CLOSURE_EVENT_SUFFIX}`,
      submission: {
        operation: "patch",
        integration: CLAUDE_CODE_INTEGRATION,
        privacyMode: id.tracing ?? "full",
        metadata: codingAgentMetadataOptions(metadataInput),
        privacyContext: {
          status: "error" in result ? "error" : leaveOpen ? "running" : "completed",
        },
        run: {
          id: id.runId,
          name: USER_PROMPT_TURN_NAME,
          run_type: "chain",
          ...(id.startTime === undefined ? {} : { start_time: id.startTime }),
          ...(id.traceId === undefined ? {} : { trace_id: id.traceId }),
          ...(id.dottedOrder === undefined ? {} : { dotted_order: id.dottedOrder }),
          ...(id.parentRunId === undefined ? {} : { parent_run_id: id.parentRunId }),
        },
        patch,
      },
      turnEvidence: {
        rootRunId: id.runId,
        childRunIds: [...(id.sharedChildRunIds ?? [])],
        closureState: leaveOpen ? "open" : "authoritative",
      },
    });
    if (!captured) throw new Error(`Could not capture shared Claude Turn closure ${id.runId}`);
    return {
      ...config,
      project_name: id.project,
      ...(endTime === undefined ? {} : { end_time: endTime }),
      extra: { metadata },
    } as unknown as Record<string, unknown>;
  }
  const runTree = createRunTree(config, id.tracing);
  await runTree.patchRun({ excludeInputs: true });
  return config as unknown as Record<string, unknown>;
}

/** Build a TurnRunIdentity from a stored OpenTurn (deferred / awaiting-subagent turn). */
export function turnIdentityFromOpenTurn(
  turn: OpenTurn,
  ctx: { sessionId: string; project: string; customMetadata?: Record<string, unknown> },
): TurnRunIdentity {
  return {
    sessionId: ctx.sessionId,
    project: ctx.project,
    customMetadata: ctx.customMetadata,
    tracing: turn.tracing ?? "full",
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
  tracing?: TracingMode;
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
  /** Nothing can say yet where the turn worked, so the settle fills and closes it. */
  leaveOpen?: boolean;
  captureSharedRun?: ClaudeSharedRunCapture;
  sharedChildRunIds?: readonly string[];
}): Promise<Record<string, unknown>> {
  return patchTurnRun(
    options,
    { lastAssistantMessage: options.lastAssistantMessage },
    options.leaveOpen,
  );
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
  sessionState: SessionState;
  transcriptPath: string | undefined;
  project: string;
  stateFilePath: string;
  defaultMuted?: boolean;
  customMetadata?: Record<string, unknown>;
  /** Claude Code CLI version → `ls_agent_runtime_version`. */
  runtimeVersion?: string;
  /** Permission mode → `approval_policy` for the interrupted root turn. */
  approvalPolicy?: string;
  /** Close an explicit (already-fully-traced) deferred turn from open_turns
   *  instead of the live current turn. When set, the transcript / pending-subagent
   *  catch-up tracing is skipped — that turn's content was already traced by Stop;
   *  we only need to close its root run. */
  turn?: OpenTurn;
  /** Root-run error/status message. Defaults to "User interrupt". */
  error?: string;
  record?: TurnRecordTarget;
  captureSharedRun?: ClaudeSharedRunCapture;
  getSharedChildRunIds?: ClaudeSharedChildRunIds;
}): Promise<{ lastLine: number; turnsTraced: number; consumedToolUseIds?: string[] }> {
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
    record,
    captureSharedRun,
    getSharedChildRunIds,
    error: errorMessage = "User interrupt",
  } = options;
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized — call initTracing() first");

  // Fast path: closing an explicit deferred turn (already traced by Stop). Just
  // patch its root run with the error message; no transcript/subagent catch-up.
  if (turn) {
    const recordedChildIds = record
      ? (readTurnRecord(record.path)?.children ?? [])
          .filter((child) => child.shared)
          .map((child) => child.run_id)
      : [];
    const sharedChildRunIds = getSharedChildRunIds
      ? await getSharedChildRunIds(turn.run_id, turn.run_id, recordedChildIds)
      : recordedChildIds;
    await closeTurnRun(
      {
        ...turnIdentityFromOpenTurn(turn, { sessionId, project, customMetadata }),
        tracing: resolveTurnTracingMode(options, sessionId, turn.tracing),
        runtimeVersion: turn.runtime_version ?? runtimeVersion,
        approvalPolicy: turn.approval_policy ?? approvalPolicy,
        captureSharedRun,
        sharedChildRunIds,
      },
      errorMessage,
    );
    await flushPendingTraces();
    return { lastLine: sessionState.last_line, turnsTraced: 0 };
  }

  const tracing = resolveTurnTracingMode(
    options,
    sessionId,
    sessionState.current_turn_tracing,
    sessionState.current_turn_run_id
      ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing
      : undefined,
  );
  let lastLine = sessionState.last_line;
  let turnsTraced = 0;
  let consumedToolUseIds: string[] = [];
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
            tracing,
            toolTracingModes: sessionState.tool_tracing_modes ?? {},
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
            record,
            captureSharedRun,
          });
          lastLine = newLastLine;
          turnsTraced = 1;
          consumedToolUseIds = completedToolUseIds(turns);
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
        tracing,
        sessionId,
        pendingSubagents,
        taskRunMap,
        parentTraceId: sessionState.current_trace_id,
        project,
        customMetadata,
        runtimeVersion,
        turnId,
        turnNumber,
        record,
        captureSharedRun,
      });
    } catch (err) {
      logger.error(`Failed to trace pending subagents on interrupt: ${err}`);
    }
  }

  // Close the parent turn run with the error message.
  const recordedChildIds = record
    ? (readTurnRecord(record.path)?.children ?? [])
        .filter((child) => child.shared)
        .map((child) => child.run_id)
    : [];
  const sharedChildRunIds =
    getSharedChildRunIds && sessionState.current_turn_run_id
      ? await getSharedChildRunIds(
          sessionState.current_turn_run_id,
          sessionState.current_turn_run_id,
          recordedChildIds,
        )
      : recordedChildIds;
  await closeTurnRun(
    {
      sessionId,
      project,
      customMetadata,
      tracing,
      runId: sessionState.current_turn_run_id!,
      traceId: sessionState.current_trace_id,
      dottedOrder: sessionState.current_dotted_order,
      parentRunId: sessionState.current_parent_run_id,
      startTime: sessionState.current_turn_start,
      turnNumber: sessionState.current_turn_number,
      runtimeVersion,
      approvalPolicy,
      captureSharedRun,
      sharedChildRunIds,
    },
    errorMessage,
  );

  await flushPendingTraces();

  return { lastLine, turnsTraced, consumedToolUseIds };
}

// ─── Subagent tracing ────────────────────────────────────────────────────────

export interface PendingSubagent {
  agent_id: string;
  agent_type: string;
  agent_transcript_path: string;
  session_id: string;
}

export interface TaskRunEntry {
  tracing?: TracingMode;
  run_id: string;
  dotted_order: string;
  deferred?: Record<string, unknown>;
  /** Subagent type, recorded by SubagentStop; used when closing the Agent run. */
  agent_type?: string;
  /** True once SubagentStop has processed this async subagent (the join's
   *  subagent-side "done" marker, replacing the former open_agent_runs map). */
  subagent_done?: boolean;
  /** For dynamic Workflow runs: the workflow run_id (`wf_…`) used to correlate
   *  `workflow-subagent` stage SubagentStops (which carry it in their path). */
  workflow_run_id?: string;
  /** True when this entry is a Workflow tool run — names the run "Workflow". */
  is_workflow?: boolean;
}

/**
 * Trace pending subagents queued by SubagentStop.
 * Used by both the Stop hook (normal completion) and UserPromptSubmit
 * (interrupted turn recovery).
 */
export async function tracePendingSubagents(options: {
  /** Fallback launch mode; each saved task snapshot takes precedence. */
  tracing?: TracingMode;
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
  record?: TurnRecordTarget;
  captureSharedRun?: ClaudeSharedRunCapture;
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
    record,
    captureSharedRun,
  } = options;

  const filledForTheTurn = attributionFiller(record);

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

      const tracing = taskRunInfo.tracing ?? options.tracing ?? "full";
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
        const agentMetadataInput = {
          sessionId,
          runType: "tool" as const,
          base: customMetadata,
          runtimeVersion,
          turnId,
          turnNumber,
          agentType: "root" as const,
          toolName: "Task",
          runName: "Agent",
          runSpecific: { agent_type: toolName, agent_id: subagent.agent_id },
        };
        const agentInputs = { input: deferred.inputs ?? {} };
        const agentOutputs = { output: deferred.outputs ?? {} };
        const agentEndTime = keepAgentToolRunOpen ? undefined : subagentEndTime;
        if (captureSharedRun) {
          const captured = await captureSharedRun({
            turnId: parentTraceId,
            eventId: parentToolRunId,
            submission: {
              operation: "post",
              integration: CLAUDE_CODE_INTEGRATION,
              privacyMode: tracing,
              metadata: metadataOptionsForTurn(agentMetadataInput, filledForTheTurn),
              privacyContext: { status: keepAgentToolRunOpen ? "running" : "completed" },
              run: {
                id: parentToolRunId,
                name: "Agent",
                run_type: "tool",
                inputs: agentInputs,
                outputs: agentOutputs,
                start_time: subagentStartTime,
                ...(agentEndTime === undefined ? {} : { end_time: agentEndTime }),
                parent_run_id: deferred.parent_run_id as string,
                trace_id: deferred.trace_id as string,
                dotted_order: agentToolDottedOrder,
              },
            },
            turnEvidence: {
              rootRunId: parentTraceId,
              childRunIds: [parentToolRunId],
              closureState: "open",
            },
          });
          if (!captured)
            throw new Error(`Could not capture shared Claude Agent run ${parentToolRunId}`);
        } else {
          const runTree = createRunTree(
            {
              client,
              replicas,
              id: parentToolRunId,
              name: "Agent",
              run_type: "tool",
              inputs: agentInputs,
              outputs: agentOutputs,
              project_name: deferred.project_name as string | undefined,
              start_time: subagentStartTime,
              end_time: agentEndTime,
              parent_run_id: deferred.parent_run_id as string,
              trace_id: deferred.trace_id as string,
              dotted_order: agentToolDottedOrder,
              extra: { metadata: filledForTheTurn(codingAgentMetadata(agentMetadataInput)) },
            },
            tracing,
          );
          await runTree.postRun();
        }
        if (keepAgentToolRunOpen) openedAgentRunIds.push(subagent.agent_id);
      }

      // Nest the subagent's own work under the Agent tool run — skipped when the
      // transcript was empty (the Agent tool run above still represents the run).
      if (subagentTurns.length > 0) {
        await traceSubagentChain({
          tracing,
          sessionId,
          project,
          parentRunId: parentToolRunId,
          parentDottedOrder: agentToolDottedOrder,
          parentTraceId,
          subagentId: subagent.agent_id,
          subagentType: toolName,
          chainName: `${toolName} Subagent`,
          subagentTurns,
          startTime: subagentStartTime,
          endTime: subagentEndTime,
          inputs: deferred?.inputs as Record<string, unknown> | undefined,
          outputs: deferred?.outputs as Record<string, unknown> | undefined,
          customMetadata,
          runtimeVersion,
          turnId,
          turnNumber,
          record,
          captureSharedRun,
        });
      }
    } catch (err) {
      logger.error(`Failed to trace subagent ${subagent.agent_id}: ${err}`);
    }
  }

  return openedAgentRunIds;
}

/**
 * Post an intermediate "<name> Subagent" chain run under a parent run (an Agent
 * tool run, or a dynamic Workflow run) and nest the subagent's own turns beneath
 * it. Shared by {@link tracePendingSubagents} (Task subagents) and
 * {@link traceWorkflowStage} (workflow stages) — the only difference is the
 * parent and the chain name.
 */
async function traceSubagentChain(opts: {
  tracing?: TracingMode;
  sessionId: string;
  project: string;
  parentRunId: string;
  parentDottedOrder: string;
  parentTraceId: string;
  subagentId: string;
  subagentType: string;
  chainName: string;
  subagentTurns: Turn[];
  startTime: string;
  endTime: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  customMetadata?: Record<string, unknown>;
  runtimeVersion?: string;
  turnId?: string;
  turnNumber?: number;
  record?: TurnRecordTarget;
  captureSharedRun?: ClaudeSharedRunCapture;
}): Promise<void> {
  const filledForTheTurn = attributionFiller(opts.record);
  const subagentChainId = uuid7FromTime(opts.startTime);
  const subagentChainDottedOrder = `${opts.parentDottedOrder}.${generateDottedOrderSegment(opts.startTime, subagentChainId)}`;

  const chainMetadataInput = {
    sessionId: opts.sessionId,
    runType: "subagent" as const,
    base: opts.customMetadata,
    runtimeVersion: opts.runtimeVersion,
    turnId: opts.turnId,
    turnNumber: opts.turnNumber,
    agentType: "subagent" as const,
    subagentId: opts.subagentId,
    subagentType: opts.subagentType,
  };
  const chainInputs = opts.inputs ?? {};
  const chainOutputs = opts.outputs === undefined ? {} : { output: opts.outputs };
  if (opts.captureSharedRun) {
    const captured = await opts.captureSharedRun({
      turnId: opts.parentTraceId,
      eventId: subagentChainId,
      submission: {
        operation: "post",
        integration: CLAUDE_CODE_INTEGRATION,
        privacyMode: opts.tracing ?? "full",
        metadata: metadataOptionsForTurn(chainMetadataInput, filledForTheTurn),
        privacyContext: { status: "completed" },
        run: {
          id: subagentChainId,
          name: opts.chainName,
          run_type: "chain",
          inputs: chainInputs,
          outputs: chainOutputs,
          start_time: opts.startTime,
          ...(opts.endTime === undefined ? {} : { end_time: opts.endTime }),
          parent_run_id: opts.parentRunId,
          trace_id: opts.parentTraceId,
          dotted_order: subagentChainDottedOrder,
        },
      },
      turnEvidence: {
        rootRunId: opts.parentTraceId,
        childRunIds: [subagentChainId],
        closureState: "open",
      },
    });
    if (!captured)
      throw new Error(`Could not capture shared Claude subagent run ${subagentChainId}`);
  } else {
    const runTree = createRunTree(
      {
        client,
        replicas,
        id: subagentChainId,
        name: opts.chainName,
        run_type: "chain",
        inputs: chainInputs,
        outputs: chainOutputs,
        project_name: opts.project,
        start_time: opts.startTime,
        ...(opts.endTime === undefined ? {} : { end_time: opts.endTime }),
        parent_run_id: opts.parentRunId,
        trace_id: opts.parentTraceId,
        dotted_order: subagentChainDottedOrder,
        extra: { metadata: filledForTheTurn(codingAgentMetadata(chainMetadataInput)) },
      },
      opts.tracing,
    );
    await runTree.postRun();
  }

  for (let i = 0; i < opts.subagentTurns.length; i++) {
    await traceTurn({
      tracing: opts.tracing,
      turn: opts.subagentTurns[i],
      sessionId: opts.sessionId,
      turnNum: i + 1,
      project: opts.project,
      parentRunId: subagentChainId,
      existingTaskRunMap: undefined,
      traceId: opts.parentTraceId,
      parentDottedOrder: subagentChainDottedOrder,
      customMetadata: opts.customMetadata,
      runtimeVersion: opts.runtimeVersion,
      agentType: "subagent",
      record: opts.record,
      captureSharedRun: opts.captureSharedRun,
    });
  }

  logger.log(
    `Traced subagent ${opts.subagentType} (${opts.subagentId}): ${opts.subagentTurns.length} turn(s)`,
  );
}

/**
 * Trace one dynamic-workflow stage as a chain under its (already-open) Workflow
 * tool run. Unlike a Task subagent there is no per-stage Agent tool run — every
 * stage nests directly under the one Workflow run, correlated by the workflow
 * run_id embedded in the stage's transcript path. Called by SubagentStop for
 * each `workflow-subagent`.
 */
export async function traceWorkflowStage(opts: {
  tracing?: TracingMode;
  sessionId: string;
  project: string;
  /** The open Workflow tool run these stages nest under. */
  workflowRun: { run_id: string; dotted_order: string };
  parentTraceId: string | undefined;
  stageAgentId: string;
  stageType: string;
  transcriptPath: string;
  customMetadata?: Record<string, unknown>;
  runtimeVersion?: string;
  turnId?: string;
  turnNumber?: number;
  captureSharedRun?: ClaudeSharedRunCapture;
}): Promise<void> {
  if (!client && !replicas) {
    throw new Error("LangSmith client not initialized — call initTracing() first");
  }
  if (!opts.parentTraceId) {
    logger.warn(`Cannot trace workflow stage ${opts.stageAgentId}: no parent trace ID`);
    return;
  }

  const { messages } = readTranscript(opts.transcriptPath, -1);
  const turns = messages.length > 0 ? groupIntoTurns(messages) : [];
  if (turns.length === 0) {
    logger.debug(`Empty/unreadable workflow stage transcript: ${opts.transcriptPath}`);
    return;
  }

  const startTime =
    turns[0].llmCalls[0]?.startTime ?? turns[0].userTimestamp ?? new Date().toISOString();
  const endTime =
    turns.reduce(
      (max, t) => t.llmCalls.reduce((m, c) => (c.endTime > m ? c.endTime : m), max),
      "",
    ) || new Date().toISOString();

  await traceSubagentChain({
    tracing: opts.tracing,
    sessionId: opts.sessionId,
    project: opts.project,
    parentRunId: opts.workflowRun.run_id,
    parentDottedOrder: opts.workflowRun.dotted_order,
    parentTraceId: opts.parentTraceId,
    subagentId: opts.stageAgentId,
    subagentType: opts.stageType,
    chainName: "Workflow step",
    subagentTurns: turns,
    startTime,
    endTime,
    customMetadata: opts.customMetadata,
    runtimeVersion: opts.runtimeVersion,
    turnId: opts.turnId,
    turnNumber: opts.turnNumber,
    captureSharedRun: opts.captureSharedRun,
  });
}

/**
 * Close (patch) an Agent tool run that was posted open by
 * {@link tracePendingSubagents} with `keepAgentToolRunOpen`. Reconstructs the
 * run from its stored `task_run_map` entry and stamps the end_time now. Called
 * once the agent's task-notification turn (which nests under it) has completed,
 * or by SessionEnd as a backstop.
 */
export async function closeAgentToolRun(options: {
  tracing?: TracingMode;
  sessionId: string;
  agentId: string;
  agentType: string;
  taskRunInfo: TaskRunEntry;
  project: string;
  customMetadata?: Record<string, unknown>;
  runtimeVersion?: string;
  turnId?: string;
  turnNumber?: number;
  /** True when SubagentStop already posted the Agent tool run open (the normal
   *  case) — we patch it closed. False when it was never posted (the subagent was
   *  killed/interrupted, so SubagentStop never fired) — we create it already-closed
   *  so the trace still shows the agent was launched. */
  wasOpen: boolean;
  /** Optional error/status to stamp on the run (e.g. "Subagent killed"). */
  error?: string;
  captureSharedRun?: ClaudeSharedRunCapture;
}): Promise<void> {
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized — call initTracing() first");

  const deferred = (options.taskRunInfo.deferred ?? {}) as Record<string, unknown>;
  // A Workflow run is named "Workflow" (native tool "Workflow"); a Task Agent run
  // is named "Agent" (native tool "Task") with its resolved subagent type as the
  // deprecated agent_type alias.
  const isWorkflow = Boolean(options.taskRunInfo.is_workflow);
  const runName = isWorkflow ? "Workflow" : "Agent";
  const nativeToolName = isWorkflow ? "Workflow" : "Task";
  const agentTypeAlias = isWorkflow ? "Workflow" : options.agentType || "Agent";

  const tracing = options.taskRunInfo.tracing ?? options.tracing ?? "full";
  const metadataInput = {
    sessionId: options.sessionId,
    runType: "tool" as const,
    base: options.customMetadata,
    runtimeVersion: options.runtimeVersion,
    turnId: options.turnId,
    turnNumber: options.turnNumber,
    agentType: "root" as const,
    toolName: nativeToolName,
    runName,
    runSpecific: {
      agent_type: agentTypeAlias,
      agent_id: options.agentId,
    },
  };
  const metadata = codingAgentMetadata(metadataInput);
  const run = {
    id: options.taskRunInfo.run_id,
    name: runName,
    run_type: "tool",
    inputs: { input: deferred.inputs ?? {} },
    outputs: { output: deferred.outputs ?? {} },
    start_time: deferred.start_time as string | undefined,
    parent_run_id: deferred.parent_run_id as string | undefined,
    trace_id: deferred.trace_id as string | undefined,
    dotted_order: options.taskRunInfo.dotted_order,
  };
  if (options.captureSharedRun) {
    const runId = options.taskRunInfo.run_id;
    const rootRunId = (deferred.trace_id as string | undefined) ?? runId;
    const endTime = new Date().toISOString();
    const submission: Parameters<ClaudeSharedRunCapture>[0]["submission"] = options.wasOpen
      ? {
          operation: "patch" as const,
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: codingAgentMetadataOptions(metadataInput),
          privacyContext: { status: options.error ? ("error" as const) : ("completed" as const) },
          run: {
            id: runId,
            name: runName,
            run_type: "tool",
            ...(run.start_time === undefined ? {} : { start_time: run.start_time }),
            ...(run.parent_run_id === undefined ? {} : { parent_run_id: run.parent_run_id }),
            ...(run.trace_id === undefined ? {} : { trace_id: run.trace_id }),
            dotted_order: run.dotted_order,
          },
          patch: options.error
            ? {
                fields: ["outputs", "end_time", "error"],
                values: { outputs: run.outputs, end_time: endTime, error: options.error },
              }
            : {
                fields: ["outputs", "end_time"],
                values: { outputs: run.outputs, end_time: endTime },
              },
        }
      : {
          operation: "post" as const,
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: codingAgentMetadataOptions(metadataInput),
          privacyContext: { status: options.error ? ("error" as const) : ("completed" as const) },
          run: {
            id: runId,
            name: runName,
            run_type: "tool",
            inputs: run.inputs,
            outputs: run.outputs,
            ...(run.start_time === undefined ? {} : { start_time: run.start_time }),
            end_time: endTime,
            ...(run.parent_run_id === undefined ? {} : { parent_run_id: run.parent_run_id }),
            ...(run.trace_id === undefined ? {} : { trace_id: run.trace_id }),
            dotted_order: run.dotted_order,
            ...(options.error ? { error: options.error } : {}),
          },
        };
    const captured = await options.captureSharedRun({
      turnId: rootRunId,
      eventId: options.wasOpen ? `${runId}${CLAUDE_AGENT_CLOSURE_EVENT_SUFFIX}` : runId,
      submission,
      turnEvidence: { rootRunId, childRunIds: [runId], closureState: "open" },
    });
    if (!captured) throw new Error(`Could not capture shared Claude Agent closure ${runId}`);
    return;
  }

  const runTree = createRunTree(
    {
      client,
      replicas,
      ...run,
      project_name: (deferred.project_name as string | undefined) ?? options.project,
      end_time: new Date().toISOString(),
      ...(options.error ? { error: options.error } : {}),
      extra: { metadata },
    },
    tracing,
  );
  // Open run → patch it closed. Never posted (killed subagent) → create it
  // already-closed so the trace still shows the launched-then-killed agent.
  if (options.wasOpen) {
    await runTree.patchRun({ excludeInputs: true });
  } else {
    await runTree.postRun();
  }
}

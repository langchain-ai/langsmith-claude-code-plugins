/**
 * PostToolUse hook handler.
 *
 * Fires after a tool executes. For Task tools (subagent spawning), this
 * traces the tool call immediately and stores the run ID mapped to agent_id
 * so SubagentStop can nest the subagent trace under it.
 */

import { resolveTurnTracingMode } from "../tracing-mode.js";
import { uuid7FromTime } from "langsmith";
import { debug, error } from "../logger.js";
import { initTracing, generateDottedOrderSegment, flushPendingTraces } from "../langsmith.js";
import {
  loadState,
  atomicUpdateState,
  getSessionState,
  advanceToolTracingProgress,
} from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { isPayloadForHook } from "../utils/harness.js";
import { readStdin } from "../utils/stdin.js";
import { codingAgentMetadata, codingAgentMetadataOptions, skillNameFromTool } from "../metadata.js";
import { toolOrigin } from "../repo-attribution.js";
import { turnAttribution } from "../reconcile.js";
import { createRunTree, runConfigForMode } from "../privacy.js";
import { recordBackgroundRun } from "../background-runs.js";
import { detectWorkflowLaunch } from "../workflows.js";
import { enqueueRun, queueOrigin } from "../queue.js";
import { readTurnRecord, recordRun, turnRecordPath } from "../turn-record.js";
import { startQueueFlusher } from "../utils/detach.js";
import {
  captureClaudeRun,
  createClaudeTracingSession,
  queueClaudeToolReconstruction,
} from "../tracing-engine.js";
import { pinnedRepositoryKeys } from "../config.js";
import { CLAUDE_CODE_INTEGRATION, PINNED_REPOSITORY_KEYS } from "../constants.js";
import type { ClaudeSharedRunCapture } from "../models/tracing-engine.js";

interface PostToolUseHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  hook_event_name: "PostToolUse";
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response: Record<string, unknown>;
  tool_use_id: string;
  agent_id?: string;
  agent_type?: string;
}

export async function main(): Promise<void> {
  const input: PostToolUseHookInput = await readStdin();
  if (!isPayloadForHook(input, "PostToolUse")) return;

  const config = initHook(input.cwd, { deferGit: true });
  if (!config) return;

  // Subagent tool calls are traced by the Stop hook from the transcript.
  // Skip here to avoid double-tracing and orphan runs.
  if (input.agent_id || input.agent_type) {
    debug("Skipping PostToolUse for subagent tool — Stop hook handles tracing");
    return;
  }

  // Load state to get current turn's run ID (created by UserPromptSubmit)
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  const tracing = resolveTurnTracingMode(
    config,
    input.session_id,
    sessionState.tool_tracing_modes?.[input.tool_use_id],
    sessionState.current_turn_tracing,
    sessionState.current_turn_run_id
      ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing
      : undefined,
  );
  const parentRunId = sessionState.current_turn_run_id;
  const traceId = sessionState.current_trace_id;
  const parentDottedOrder = sessionState.current_dotted_order;

  if (!parentRunId || !traceId || !parentDottedOrder) {
    error("No current_turn_run_id or trace_id in state - UserPromptSubmit hook may not have run");
    return;
  }

  // Generate run ID and dotted order for this tool.
  // Use PreToolUse's recorded start time if available (accurate wall-clock time
  // from before the tool ran), otherwise fall back to Date.now().
  const startTime = sessionState.tool_start_times?.[input.tool_use_id] ?? Date.now();
  const toolRunId = uuid7FromTime(startTime);
  const toolEndTime = Date.now();
  // Convert to ISO for RunTree (avoids internal timestamp mangling)
  const startTimeIso = new Date(startTime).toISOString();
  const toolEndTimeIso = new Date(toolEndTime).toISOString();

  // Generate proper dotted order segment
  const toolDottedOrderSegment = generateDottedOrderSegment(startTime, toolRunId);
  const toolDottedOrder = `${parentDottedOrder}.${toolDottedOrderSegment}`;

  const agentId = (input.tool_response as { agentId?: string }).agentId;
  // A dynamic Workflow launch also spawns background work, but via the Workflow
  // tool (not Task) — detected structurally from tool_response, not an agentId.
  const workflow = !agentId
    ? detectWorkflowLaunch(input.tool_name, input.tool_response)
    : undefined;

  const origin = toolOrigin(input.tool_input, input.cwd);
  const turnRecord = turnRecordPath(config.stateFilePath, input.session_id, parentRunId);

  if (agentId) {
    // Agent tool: defer LangSmith run creation to the Stop hook, which will
    // have the actual subagent type from SubagentStop's pending_subagent_traces.
    debug(`Agent tool detected, deferring run creation for ${agentId} -> ${toolRunId}`);
  } else if (workflow) {
    // Workflow tool: its run name is known now ("Workflow"), so post it OPEN
    // immediately. Stage agents nest under it as they finish; the workflow's
    // task-notification closes it (there is no whole-workflow SubagentStop).
    debug(
      `Workflow tool detected, posting open run for ${workflow.runId} (task ${workflow.taskId}) -> ${toolRunId}`,
    );
    const client = initTracing(
      config.apiKey,
      config.apiBaseUrl,
      config.replicas,
      config.redact,
      config.redactExtraRules,
    );
    const metadataInput = {
      sessionId: input.session_id,
      runType: "tool" as const,
      base: config.customMetadata,
      turnNumber: sessionState.current_turn_number,
      runtimeVersion: sessionState.runtime_version,
      agentType: "root" as const,
      toolName: "Workflow",
      runName: "Workflow",
    };
    const metadata = codingAgentMetadata(metadataInput);
    const run = {
      id: toolRunId,
      name: "Workflow",
      run_type: "tool",
      inputs: { input: input.tool_input },
      start_time: startTimeIso,
      parent_run_id: parentRunId,
      trace_id: traceId,
      dotted_order: toolDottedOrder,
    };
    const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
    const captureSharedRun: ClaudeSharedRunCapture | undefined = engine
      ? (capture) => captureClaudeRun(engine, capture)
      : undefined;
    if (captureSharedRun) {
      const captured = await captureSharedRun({
        turnId: parentRunId,
        eventId: toolRunId,
        submission: {
          operation: "post",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: codingAgentMetadataOptions(metadataInput),
          privacyContext: { status: "running" },
          run,
        },
        turnEvidence: {
          rootRunId: traceId,
          childRunIds: [toolRunId],
          closureState: "open",
        },
      });
      if (!captured) throw new Error(`Could not capture shared Claude Workflow run ${toolRunId}`);
      recordRun({
        path: turnRecord,
        run: { ...run, project_name: config.project, extra: { metadata } },
        tracing,
        origin: queueOrigin(config),
        toolUseId: input.tool_use_id,
        shared: true,
        routing: { cwd: input.cwd },
      });
    } else {
      const runTree = createRunTree(
        {
          client,
          replicas: config.replicas,
          project_name: config.project,
          // No end_time — left open until finalizeNotificationChain closes it.
          ...run,
          extra: { metadata },
        },
        tracing,
      );
      await runTree.postRun();
    }
  } else {
    const queued = queueOrigin(config);
    const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
    const existing = readTurnRecord(turnRecord);
    const turnAttributionFallback =
      tracing === "full" && existing?.origin === queued ? turnAttribution(existing) : undefined;
    const toolMetadata = codingAgentMetadata({
      sessionId: input.session_id,
      runType: "tool",
      base: config.customMetadata,
      turnNumber: sessionState.current_turn_number,
      runtimeVersion: sessionState.runtime_version,
      agentType: "root",
      toolName: input.tool_name,
      runName: input.tool_name,
      skillName: skillNameFromTool(input.tool_name, input.tool_input),
    });
    const settles = tracing === "full" ? origin : undefined;
    const toolRun = {
      id: toolRunId,
      name: input.tool_name,
      run_type: "tool",
      inputs: { input: input.tool_input },
      outputs: { output: input.tool_response },
      project_name: config.project,
      start_time: startTimeIso,
      end_time: toolEndTimeIso,
      parent_run_id: parentRunId,
      trace_id: traceId,
      dotted_order: toolDottedOrder,
      extra: { metadata: toolMetadata },
    };
    if (engine) {
      const childRunIds = new Set<string>();
      for (const child of existing?.origin === queued ? existing.children : []) {
        if (child.shared) {
          childRunIds.add(child.run_id);
          continue;
        }
        const stored = await engine.captureStore.read({
          integration: CLAUDE_CODE_INTEGRATION,
          sessionId: input.session_id,
          turnId: parentRunId,
          eventId: child.run_id,
        });
        if (
          stored?.runId === child.run_id &&
          stored.destinationFingerprint === engine.accountFingerprint
        ) {
          childRunIds.add(child.run_id);
          continue;
        }
      }
      childRunIds.add(toolRunId);
      await queueClaudeToolReconstruction(engine, {
        turnId: parentRunId,
        privacyMode: tracing,
        run: {
          id: toolRunId,
          name: input.tool_name,
          run_type: "tool",
          inputs: { input: input.tool_input },
          outputs: { output: input.tool_response },
          start_time: startTimeIso,
          end_time: toolEndTimeIso,
          parent_run_id: parentRunId,
          trace_id: traceId,
          dotted_order: toolDottedOrder,
        },
        origin,
        ...(tracing === "full" && Object.hasOwn(config.customMetadata ?? {}, PINNED_REPOSITORY_KEYS)
          ? { pinnedRepositoryKeys: [...pinnedRepositoryKeys(config.customMetadata)].sort() }
          : {}),
        metadata: {
          turnNumber: sessionState.current_turn_number,
          runtimeVersion: sessionState.runtime_version,
          toolName: input.tool_name,
          skillName: skillNameFromTool(input.tool_name, input.tool_input),
          ...(tracing === "full" ? { base: config.customMetadata } : {}),
          ...(tracing === "full" && turnAttributionFallback !== undefined
            ? { turnAttributionFallback }
            : {}),
        },
        turnEvidence: {
          rootRunId: parentRunId,
          childRunIds: [...childRunIds],
          closureState: "open",
        },
      });
      recordRun({
        path: turnRecord,
        run: toolRun,
        tracing,
        origin: queued,
        shared: true,
        routing: { cwd: input.cwd },
        toolUseId: input.tool_use_id,
      });
    } else {
      recordRun({
        path: turnRecord,
        run: toolRun,
        tracing,
        origin: queued,
        routing: { cwd: input.cwd },
        toolUseId: input.tool_use_id,
      });
      await enqueueRun(
        config.stateFilePath,
        input.session_id,
        toolRun,
        tracing,
        queued,
        turnRecord,
        settles,
      );
      startQueueFlusher(input.cwd, input.session_id, config.project);
    }
  }

  // Save state atomically so concurrent PostToolUse hooks don't clobber each other.
  await atomicUpdateState(config.stateFilePath, (freshState) => {
    const freshSession = getSessionState(freshState, input.session_id);

    // Both the Agent and Workflow tools launch work that outlives this turn's
    // Stop. Register either the same way — under its launching turn in open_turns
    // (so Stop defers) with a task_run_map entry to nest/close later. The Task
    // Agent run is deferred (created by Stop with its real subagent type); the
    // Workflow run was posted open above (its name is known now), so we mark it
    // subagent_done + is_workflow so finalize patches it closed as "Workflow".
    let backgroundUpdate: Pick<typeof freshSession, "task_run_map" | "open_turns"> | undefined;
    if (agentId || workflow) {
      const deferred = runConfigForMode(
        {
          trace_id: traceId!,
          parent_run_id: parentRunId!,
          start_time: startTimeIso,
          end_time: toolEndTimeIso,
          inputs: input.tool_input,
          outputs: input.tool_response,
          project_name: config.project,
        },
        tracing,
      ) as Record<string, unknown>;
      const launchingTurn = {
        tracing: resolveTurnTracingMode(
          config,
          input.session_id,
          sessionState.current_turn_tracing,
          sessionState.current_turn_run_id
            ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing
            : undefined,
        ),
        run_id: parentRunId!,
        trace_id: traceId,
        dotted_order: parentDottedOrder,
        parent_run_id: sessionState.current_parent_run_id,
        start_time: sessionState.current_turn_start,
        turn_number: sessionState.current_turn_number,
        runtime_version: sessionState.runtime_version,
        approval_policy: sessionState.approval_policy,
      };
      backgroundUpdate = recordBackgroundRun(
        freshSession,
        launchingTurn,
        agentId ?? workflow!.taskId,
        {
          tracing,
          run_id: toolRunId,
          dotted_order: toolDottedOrder,
          deferred,
          ...(workflow
            ? { workflow_run_id: workflow.runId, is_workflow: true, subagent_done: true }
            : {}),
        },
      );
    }

    return {
      ...freshState,
      [input.session_id]: {
        ...freshSession,
        // Don't resurrect a snapshot reclaimed while this hook awaited the SDK
        // (notably by definitive SessionEnd). The local mode still protects this post.
        ...(sessionState.tool_tracing_modes?.[input.tool_use_id] !== undefined &&
        freshSession.tool_tracing_modes?.[input.tool_use_id] === undefined
          ? {}
          : advanceToolTracingProgress(
              {
                ...freshSession,
                tool_tracing_modes: {
                  ...freshSession.tool_tracing_modes,
                  [input.tool_use_id]: tracing,
                },
              },
              [input.tool_use_id],
              "post",
            )),
        last_tool_end_time: toolEndTime,
        ...backgroundUpdate,
        // Mark the tool_use_id traced so traceTurn (Stop) skips re-tracing this
        // tool call from the transcript. A deferred Agent tool is skipped there
        // via its agentId link instead, so it's the one case we don't record —
        // but a Workflow tool call has no agentId, so without this it would get a
        // duplicate "Workflow" tool run next to the open one posted above.
        ...(agentId
          ? {}
          : {
              traced_tool_use_ids: [...(freshSession.traced_tool_use_ids ?? []), input.tool_use_id],
            }),
      },
    };
  });

  // Only the open Workflow run posts here: a regular tool is queued for the detached
  // flusher, and the deferred Agent tool run is created by Stop.
  if (workflow) {
    await flushPendingTraces();
  }
}

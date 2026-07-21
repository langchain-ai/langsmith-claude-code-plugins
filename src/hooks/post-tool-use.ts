#!/usr/bin/env node
/**
 * PostToolUse hook entry point.
 *
 * Fires after a tool executes. For Task tools (subagent spawning), this
 * traces the tool call immediately and stores the run ID mapped to agent_id
 * so SubagentStop can nest the subagent trace under it.
 */

import { RunTree, uuid7 } from "langsmith";
import { debug, error } from "../logger.js";
import { initTracing, generateDottedOrderSegment, flushPendingTraces } from "../langsmith.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import { codingAgentMetadata, skillNameFromTool } from "../metadata.js";
import { recordBackgroundRun } from "../background-runs.js";
import { detectWorkflowLaunch } from "../workflows.js";

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

async function main(): Promise<void> {
  const input: PostToolUseHookInput = await readStdin();

  const config = initHook(input.cwd);
  if (!config) return;

  // Subagent tool calls are traced by the Stop hook from the transcript.
  // Skip here to avoid double-tracing and orphan runs.
  if (input.agent_id || input.agent_type) {
    debug("Skipping PostToolUse for subagent tool — Stop hook handles tracing");
    return;
  }

  const client = initTracing(
    config.apiKey,
    config.apiBaseUrl,
    config.replicas,
    config.redact,
    config.redactExtraRules,
  );

  // Load state to get current turn's run ID (created by UserPromptSubmit)
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

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
  const toolRunId = uuid7();
  const startTime = sessionState.tool_start_times?.[input.tool_use_id] ?? Date.now();
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
    const runTree = new RunTree({
      client,
      replicas: config.replicas,
      id: toolRunId,
      name: "Workflow",
      run_type: "tool",
      inputs: { input: input.tool_input },
      project_name: config.project,
      start_time: startTimeIso,
      // No end_time — left open until finalizeNotificationChain closes it.
      parent_run_id: parentRunId,
      trace_id: traceId,
      dotted_order: toolDottedOrder,
      extra: {
        metadata: codingAgentMetadata({
          sessionId: input.session_id,
          base: config.customMetadata,
          turnNumber: sessionState.current_turn_number,
          runtimeVersion: sessionState.runtime_version,
          agentType: "root",
          toolName: "Workflow",
          runName: "Workflow",
        }),
      },
    });
    await runTree.postRun();
  } else {
    // Regular tool: create and complete the run immediately.
    const runTree = new RunTree({
      client,
      replicas: config.replicas,
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
      extra: {
        metadata: codingAgentMetadata({
          sessionId: input.session_id,
          base: config.customMetadata,
          // turn_id (promptId) isn't in the PostToolUse payload; turn_number is
          // sufficient (the contract needs at least one of the two).
          turnNumber: sessionState.current_turn_number,
          runtimeVersion: sessionState.runtime_version,
          agentType: "root",
          toolName: input.tool_name,
          runName: input.tool_name,
          skillName: skillNameFromTool(input.tool_name, input.tool_input),
        }),
      },
    });
    await runTree.postRun();
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
      const deferred = {
        trace_id: traceId!,
        parent_run_id: parentRunId!,
        start_time: startTimeIso,
        end_time: toolEndTimeIso,
        inputs: input.tool_input,
        outputs: input.tool_response,
        project_name: config.project,
      } as Record<string, unknown>;
      const launchingTurn = {
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

  // Flush pending batches so traces are sent before this async hook exits. The
  // deferred Agent tool run is the one case that posts nothing here (Stop creates
  // it), so it has nothing to flush; regular tools and the open Workflow run do.
  if (!agentId) {
    await flushPendingTraces();
  }
}

main().catch((err) => {
  try {
    error(`PostToolUse hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0); // Always exit 0 so Claude Code isn't affected.
});

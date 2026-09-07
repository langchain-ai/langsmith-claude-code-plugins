#!/usr/bin/env node
/**
 * PostToolUse hook entry point.
 *
 * Fires after a tool executes. For Task tools (subagent spawning), this
 * traces the tool call immediately and stores the run ID mapped to agent_id
 * so SubagentStop can nest the subagent trace under it.
 */

import { uuid7FromTime } from "langsmith";
import { createRunTree, runConfigForMode } from "../privacy.js";
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

  // PostToolUse is async: current_* may already describe an unrelated prompt.
  // Only the synchronous PreToolUse snapshot can establish launch ownership.
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);
  const launch = sessionState.tool_launch_contexts?.[input.tool_use_id];
  const turn =
    launch?.turn?.run_id && launch.turn.trace_id && launch.turn.dotted_order
      ? launch.turn
      : undefined;
  const tracingMode = turn && launch?.tracing === "full" ? "full" : "metadata";
  const parentRunId = turn?.run_id;
  const parentDottedOrder = turn?.dotted_order;

  // Unknown ownership is a standalone metadata trace, never a child of whichever
  // full turn happens to be current. The legacy timing map proves no ownership.
  const startTime = launch?.start_time ?? Date.now();
  const toolRunId = uuid7FromTime(startTime);
  const toolEndTime = Date.now();
  // Convert to ISO for RunTree (avoids internal timestamp mangling)
  const startTimeIso = new Date(startTime).toISOString();
  const toolEndTimeIso = new Date(toolEndTime).toISOString();

  // Generate proper dotted order segment
  const toolDottedOrderSegment = generateDottedOrderSegment(startTime, toolRunId);
  const toolDottedOrder = parentDottedOrder
    ? `${parentDottedOrder}.${toolDottedOrderSegment}`
    : toolDottedOrderSegment;
  const traceId = turn?.trace_id ?? toolRunId;

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
    const runTree = createRunTree(
      {
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
            turnNumber: turn?.turn_number,
            runtimeVersion: turn?.runtime_version,
            agentType: "root",
            toolName: "Workflow",
            runName: "Workflow",
          }),
        },
      },
      tracingMode,
    );
    await runTree.postRun();
  } else {
    // Regular tool: create and complete the run immediately.
    const runTree = createRunTree(
      {
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
            turnNumber: turn?.turn_number,
            runtimeVersion: turn?.runtime_version,
            agentType: "root",
            toolName: input.tool_name,
            runName: input.tool_name,
            skillName: skillNameFromTool(input.tool_name, input.tool_input),
          }),
        },
      },
      tracingMode,
    );
    await runTree.postRun();
  }

  // Save state atomically so concurrent PostToolUse hooks don't clobber each other.
  await atomicUpdateState(config.stateFilePath, (freshState) => {
    const freshSession = getSessionState(freshState, input.session_id);
    const ownsCurrentTurn = !!turn && freshSession.current_turn_run_id === turn.run_id;

    // Both the Agent and Workflow tools launch work that outlives this turn's
    // Stop. Register either under its launching turn only while current or still
    // in open_turns, with a task_run_map entry to nest/close later. The Task
    // Agent run is deferred (created by Stop with its real subagent type); the
    // Workflow run was posted open above (its name is known now), so we mark it
    // subagent_done + is_workflow so finalize patches it closed as "Workflow".
    let backgroundUpdate: Pick<typeof freshSession, "task_run_map" | "open_turns"> | undefined;
    if (agentId || workflow) {
      // Never retain raw muted content for a later hook to accidentally promote.
      const deferred = runConfigForMode(
        {
          trace_id: traceId,
          parent_run_id: parentRunId,
          start_time: startTimeIso,
          end_time: toolEndTimeIso,
          inputs: input.tool_input,
          outputs: input.tool_response,
          project_name: config.project,
        },
        tracingMode,
      );
      const backgroundId = agentId ?? workflow!.taskId;
      const entry: NonNullable<typeof freshSession.task_run_map>[string] = {
        run_id: toolRunId,
        dotted_order: toolDottedOrder,
        tracing: tracingMode,
        launching_turn_run_id: turn?.run_id,
        // RunTree accepts ISO timestamps at runtime; its stored instance type
        // models them as numbers. Deferred configs intentionally retain ISO.
        deferred: deferred as Record<string, unknown>,
        ...(workflow
          ? { workflow_run_id: workflow.runId, is_workflow: true, subagent_done: true }
          : {}),
      };
      backgroundUpdate =
        turn && (ownsCurrentTurn || freshSession.open_turns?.[turn.run_id])
          ? recordBackgroundRun(
              freshSession,
              { ...turn, tracing: tracingMode },
              backgroundId,
              entry,
            )
          : {
              // A late snapshot proves ownership, not that its parent is still open.
              // Keep completion correlation without resurrecting a finished turn.
              task_run_map: { ...freshSession.task_run_map, [backgroundId]: entry },
              open_turns: freshSession.open_turns,
            };
    }

    const remainingLaunches = { ...freshSession.tool_launch_contexts };
    delete remainingLaunches[input.tool_use_id];

    return {
      ...freshState,
      [input.session_id]: {
        ...freshSession,
        tool_launch_contexts: remainingLaunches,
        ...(ownsCurrentTurn ? { last_tool_end_time: toolEndTime } : {}),
        ...backgroundUpdate,
        // Mark the tool_use_id traced so traceTurn (Stop) skips re-tracing this
        // tool call from the transcript. A deferred Agent tool is skipped there
        // via its agentId link instead, so it's the one case we don't record —
        // but a Workflow tool call has no agentId, so without this it would get a
        // duplicate "Workflow" tool run next to the open one posted above.
        ...(agentId || !ownsCurrentTurn
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

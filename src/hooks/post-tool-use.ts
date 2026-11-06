/**
 * PostToolUse hook handler.
 *
 * Fires after a tool executes. For Task tools (subagent spawning), this
 * traces the tool call immediately and stores the run ID mapped to agent_id
 * so SubagentStop can nest the subagent trace under it.
 */

import { resolveTurnTracingMode, toolTracingMode } from "../tracing-mode.js";
import { debug, error } from "../logger.js";
import {
  currentTurnMetadata,
  firstUnpostedCall,
  generateDottedOrderSegment,
  traceRunningSubagent,
  traceTurn,
} from "../langsmith.js";
import {
  loadState,
  atomicUpdateState,
  getSessionState,
  advanceToolTracingProgress,
  saveHeldRun,
  takeHeldRun,
} from "../state.js";
import { expandHome, initHook } from "../utils/hook-init.js";
import { isPayloadForHook } from "../utils/harness.js";
import { readStdin } from "../utils/stdin.js";
import { codingAgentMetadata, skillNameFromTool } from "../metadata.js";
import { toolOrigin } from "../repo-attribution.js";
import { recordBackgroundRun } from "../background-runs.js";
import { detectWorkflowLaunch } from "../workflows.js";
import { captureToolRun, initTracing } from "../tracing-engine.js";
import {
  findToolUse,
  groupIntoTurns,
  readRuntimeVersion,
  readTranscript,
  subagentLaunchId,
  subagentTranscriptPath,
  turnPrompt,
} from "../transcript.js";
import { WORKFLOW_SUBAGENT_TYPE } from "../constants.js";
import { stableRunId } from "../utils/ids/run-id.js";
import type {
  ClaudeRun,
  Config,
  PostToolUseHookInput,
  SessionState,
  ToolOrigin,
  TracingMode,
} from "../types.js";

export async function main(): Promise<void> {
  const input: PostToolUseHookInput = await readStdin();
  if (!isPayloadForHook(input, "PostToolUse")) return;

  const config = initHook(input.cwd);
  if (!config) return;

  // Subagent tool calls are traced from the subagent's transcript, not this payload,
  // to avoid double-tracing and orphan runs. A main-agent turn
  // carries agent_type without agent_id and is traced here as usual.
  if (input.agent_id) {
    try {
      await traceSubagentSoFar(config, input, input.agent_id);
    } catch (err) {
      error(`Failed to upload the subagent's finished steps: ${err}`);
    }
    return;
  }

  // Load state to get current turn's run ID (created by UserPromptSubmit)
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  const tracing = toolCallTracing(config, input, sessionState, input.tool_use_id);
  const parentRunId = sessionState.current_turn_run_id;
  const traceId = sessionState.current_trace_id;
  const parentDottedOrder = sessionState.current_dotted_order;

  if (!parentRunId || !traceId || !parentDottedOrder) {
    error("No current_turn_run_id or trace_id in state - UserPromptSubmit hook may not have run");
    return;
  }

  initTracing(config, input.cwd, input.session_id);

  // Generate run ID and dotted order for this tool.
  // Use PreToolUse's recorded start time if available (accurate wall-clock time
  // from before the tool ran), otherwise fall back to Date.now().
  const startTime = sessionState.tool_start_times?.[input.tool_use_id] ?? Date.now();
  const toolRunId = stableRunId(startTime, input.session_id, input.tool_use_id);
  const toolEndTime = Date.now();
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

  const origin = toolOrigin(input.tool_input, input.cwd, input.tool_name);
  let held = false;
  const heldKey = [config.stateFilePath, input.session_id, input.tool_use_id] as const;
  const hold = async (run: ClaudeRun, mode: TracingMode, _parent: string, from: ToolOrigin) => {
    const content = mode === "full" ? run : { ...run, inputs: {}, outputs: {} };
    saveHeldRun({ run: content, tracing: mode, origin: from }, ...heldKey);
    held = true;
  };

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
    await captureToolRun(
      {
        id: toolRunId,
        name: "Workflow",
        run_type: "tool",
        inputs: { input: input.tool_input },
        start_time: startTimeIso,
        // No end_time — left open until finalizeNotificationChain closes it.
        parent_run_id: parentRunId,
        trace_id: traceId,
        dotted_order: toolDottedOrder,
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
      tracing,
      parentRunId,
      origin,
    );
  } else {
    await (config.captureHookOutputs ? hold : captureToolRun)(
      {
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
        metadata: codingAgentMetadata({
          sessionId: input.session_id,
          base: config.customMetadata,
          turnNumber: sessionState.current_turn_number,
          runtimeVersion: sessionState.runtime_version,
          agentType: "root",
          toolName: input.tool_name,
          runName: input.tool_name,
          skillName: skillNameFromTool(input.tool_name, input.tool_input),
        }),
      },
      tracing,
      parentRunId,
      origin,
    );
  }
  let kept = false;

  // Save state atomically so concurrent PostToolUse hooks don't clobber each other.
  await atomicUpdateState(config.stateFilePath, (freshState) => {
    const freshSession = getSessionState(freshState, input.session_id);
    const closings = Object.values(freshSession.queued_closings ?? {}).map((c) => c.session);
    kept = held && [freshSession, ...closings].some((s) => s.current_turn_run_id === parentRunId);

    // Both the Agent and Workflow tools launch work that outlives this turn's
    // Stop. Register either the same way — under its launching turn in open_turns
    // (so Stop defers) with a task_run_map entry to nest/close later. The Task
    // Agent run is deferred (created by Stop with its real subagent type); the
    // Workflow run was posted open above (its name is known now), so we mark it
    // subagent_done + is_workflow so finalize patches it closed as "Workflow".
    let backgroundUpdate: Pick<typeof freshSession, "task_run_map" | "open_turns"> | undefined;
    if (agentId || workflow) {
      const deferred: Record<string, unknown> = {
        trace_id: traceId!,
        parent_run_id: parentRunId!,
        start_time: startTimeIso,
        end_time: toolEndTimeIso,
        ...(tracing === "full" ? { inputs: input.tool_input, outputs: input.tool_response } : {}),
      };
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
          ...(config.captureHookOutputs ? { tool_use_id: input.tool_use_id } : {}),
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
        ...(kept
          ? { held_tool_runs: { ...freshSession.held_tool_runs, [input.tool_use_id]: parentRunId } }
          : {}),
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
  if (held && !kept) takeHeldRun(...heldKey);

  try {
    await traceFinishedModelCalls(config, input, sessionState);
  } catch (err) {
    error(`Failed to upload finished model calls: ${err}`);
  }
}

async function traceFinishedModelCalls(
  config: Config,
  input: PostToolUseHookInput,
  sessionState: SessionState,
): Promise<void> {
  const transcriptPath = expandHome(input.transcript_path);
  const turnRunId = sessionState.current_turn_run_id;
  const toolStart = sessionState.tool_start_times?.[input.tool_use_id];
  if (!transcriptPath || !turnRunId || toolStart === undefined) return;

  const { messages } = readTranscript(
    transcriptPath,
    sessionState.last_line,
    undefined,
    turnPrompt(sessionState, sessionState.read_turn_run_id === turnRunId),
    sessionState,
  );
  const turns = groupIntoTurns(messages);
  const turn = turns.length === 1 ? turns[0] : undefined;
  const finished = turn?.llmCalls.slice(0, -1) ?? [];
  if (!turn || finished.length === 0) return;
  const toolCalls = finished.flatMap((llmCall) => llmCall.toolCalls);

  await traceTurn({
    tracing: resolveTurnTracingMode(
      config,
      input.session_id,
      sessionState.current_turn_tracing,
      sessionState.open_turns?.[turnRunId]?.tracing,
    ),
    turn: { ...turn, llmCalls: finished },
    sessionId: input.session_id,
    turnNum: sessionState.turn_count + 1,
    customMetadata: await currentTurnMetadata(config.customMetadata, sessionState),
    hookCwd: input.cwd,
    runtimeVersion: sessionState.runtime_version ?? readRuntimeVersion(transcriptPath),
    approvalPolicy: sessionState.approval_policy ?? input.permission_mode,
    parentRunId: turnRunId,
    tracedToolUseIds: new Set(toolCalls.map((toolCall) => toolCall.tool_use.id)),
    traceId: sessionState.current_trace_id,
    parentDottedOrder: sessionState.current_dotted_order,
    captureHookOutputs: config.captureHookOutputs,
    uploadFromCall: await firstUnpostedCall(turn, turnRunId, turnRunId, finished.length),
  });
}

function toolCallTracing(
  config: Config,
  input: PostToolUseHookInput,
  sessionState: SessionState,
  toolUseId: string,
): TracingMode {
  const turnTracing = resolveTurnTracingMode(
    config,
    input.session_id,
    sessionState.tool_tracing_modes?.[toolUseId],
    sessionState.current_turn_tracing,
    sessionState.current_turn_run_id
      ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing
      : undefined,
  );
  return toolTracingMode(
    config,
    input.session_id,
    sessionState,
    expandHome(input.transcript_path),
    toolUseId,
    turnTracing,
  );
}

async function traceSubagentSoFar(
  config: Config,
  input: PostToolUseHookInput,
  agentId: string,
): Promise<void> {
  const transcriptPath = expandHome(input.transcript_path);
  if (!transcriptPath || input.agent_type === WORKFLOW_SUBAGENT_TYPE) return;
  const subagent = {
    agent_id: agentId,
    agent_type: input.agent_type ?? "",
    agent_transcript_path: subagentTranscriptPath(transcriptPath, input.session_id, agentId),
    session_id: input.session_id,
  };
  const turns = groupIntoTurns(readTranscript(subagent.agent_transcript_path, -1).messages);
  const sessionState = getSessionState(loadState(config.stateFilePath), input.session_id);
  const turnRunId = sessionState.current_turn_run_id;
  const readCurrentTurn = () =>
    readTranscript(
      transcriptPath,
      sessionState.last_line,
      undefined,
      turnPrompt(sessionState, sessionState.read_turn_run_id === turnRunId),
      sessionState,
    ).messages;
  const recordedLaunch = sessionState.task_run_map?.[agentId];
  initTracing(config, input.cwd, input.session_id);

  if (recordedLaunch) {
    const launchedBy = recordedLaunch.deferred?.parent_run_id as string | undefined;
    const launchingTurn = launchedBy ? sessionState.open_turns?.[launchedBy] : undefined;
    const currentTurnId =
      launchedBy === turnRunId ? groupIntoTurns(readCurrentTurn()).at(-1)?.promptId : undefined;
    await traceRunningSubagent({
      subagent,
      taskRunInfo: recordedLaunch,
      turns,
      sessionId: input.session_id,
      customMetadata: config.customMetadata,
      runtimeVersion: launchingTurn?.runtime_version ?? sessionState.runtime_version,
      turnId: launchingTurn?.turn_id ?? currentTurnId,
      turnNumber: launchingTurn?.turn_number ?? sessionState.current_turn_number,
      captureHookOutputs: config.captureHookOutputs,
    });
    return;
  }

  const launchId = subagentLaunchId(subagent.agent_transcript_path);
  const startTime = launchId ? sessionState.tool_start_times?.[launchId] : undefined;
  if (!launchId || startTime === undefined) return;
  const messages = readCurrentTurn();
  const launch = findToolUse(messages, launchId);
  const traceId = sessionState.current_trace_id;
  const parentDottedOrder = sessionState.current_dotted_order;
  if (!launch || !turnRunId || !traceId || !parentDottedOrder) return;

  const tracing = toolCallTracing(config, input, sessionState, launch.id);
  const runId = stableRunId(startTime, input.session_id, launch.id);
  await traceRunningSubagent({
    subagent,
    taskRunInfo: {
      tracing,
      run_id: runId,
      dotted_order: `${parentDottedOrder}.${generateDottedOrderSegment(startTime, runId)}`,
      deferred: {
        trace_id: traceId,
        parent_run_id: turnRunId,
        start_time: new Date(startTime).toISOString(),
        ...(tracing === "full" ? { inputs: launch.input } : {}),
      },
    },
    turns,
    sessionId: input.session_id,
    customMetadata: await currentTurnMetadata(config.customMetadata, sessionState),
    runtimeVersion: sessionState.runtime_version ?? readRuntimeVersion(transcriptPath),
    turnId: groupIntoTurns(messages).at(-1)?.promptId,
    turnNumber: sessionState.current_turn_number,
    captureHookOutputs: config.captureHookOutputs,
  });
}

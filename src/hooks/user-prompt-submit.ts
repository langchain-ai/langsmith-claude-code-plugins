#!/usr/bin/env node
/**
 * UserPromptSubmit hook entry point.
 *
 * Invoked when a user submits a prompt, before Claude processes it.
 * Creates the initial RunTree for the turn and stores the run ID
 * for the Stop hook to use as the parent for all LLM and tool runs.
 *
 * Also handles interrupted turns: if Stop never fired for the previous turn
 * (user pressed Escape), traces the interrupted turn's content from the
 * transcript before closing it with "User interrupt".
 */

import { RunTree, uuid7 } from "langsmith";
import { debug, error } from "../logger.js";
import {
  initTracing,
  closeInterruptedTurn,
  generateDottedOrderSegment,
  parseDottedOrder,
} from "../langsmith.js";
import { finalizeNotificationChain } from "../finalize.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { getTranscriptEndLine, readRuntimeVersion } from "../transcript.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import { USER_PROMPT_TURN_NAME } from "../constants.js";
import { codingAgentMetadata } from "../metadata.js";

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

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`UserPromptSubmit hook started, session=${input.session_id}`);

  // Subagent turns are traced entirely by the Stop hook from the transcript.
  // Skip here to avoid orphan runs with incorrect nesting.
  if (input.agent_id || input.agent_type) {
    debug("Skipping UserPromptSubmit for subagent — Stop hook handles tracing");
    return;
  }

  const client = initTracing(config.apiKey, config.apiBaseUrl, config.replicas);

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  // CLI version (ls_agent_runtime_version); best-effort, Stop backfills if empty.
  const expandedTranscript = expandHome(input.transcript_path);
  const runtimeVersion =
    (expandedTranscript ? readRuntimeVersion(expandedTranscript) : undefined) ??
    sessionState.runtime_version;
  const approvalPolicy = input.permission_mode;

  // If state is fresh (last_line === -1) but the transcript already has content,
  // skip to the end. This avoids replaying thousands of old messages (which would
  // be rejected by LangSmith's ±24h timestamp window) when state is lost due to
  // file deletion, corruption, or session pruning.
  let interruptedLastLine = sessionState.last_line;
  if (interruptedLastLine === -1 && input.transcript_path) {
    const transcriptPath = expandHome(input.transcript_path)!;
    const endLine = getTranscriptEndLine(transcriptPath);
    if (endLine > 0) {
      debug(`Fresh state but transcript has ${endLine + 1} lines — skipping to end`);
      interruptedLastLine = endLine;
    }
  }

  // If there's a stale turn run, the previous turn was interrupted (Stop never fired).
  // Trace the interrupted turn's content then close the parent run.
  let interruptedTurnsTraced = 0;

  if (sessionState.current_turn_run_id) {
    // A stale current_turn_run_id means the previous turn's Stop never fired. The
    // usual cause is a user interrupt — but it also happens when several background
    // agents finish at once: their task-notifications arrive faster than the agent
    // responds, so a notification turn is superseded by the next before its Stop.
    // That's not a user interrupt: close it with an accurate status and, since its
    // launching turn is still deferred, finalize that chain so it doesn't hang.
    const supersededNotificationAgentId = sessionState.current_notification_agent_id;
    debug(
      `Closing stale turn ${sessionState.current_turn_run_id}` +
        (supersededNotificationAgentId ? " (superseded task-notification)" : " (interrupted)"),
    );
    try {
      const { lastLine, turnsTraced } = await closeInterruptedTurn({
        sessionId: input.session_id,
        sessionState,
        transcriptPath: expandHome(input.transcript_path),
        project: config.project,
        stateFilePath: config.stateFilePath,
        customMetadata: config.customMetadata,
        runtimeVersion,
        approvalPolicy,
        error: supersededNotificationAgentId
          ? "Superseded by a newer task-notification"
          : "User interrupt",
      });
      interruptedLastLine = lastLine;
      interruptedTurnsTraced = turnsTraced;
      if (supersededNotificationAgentId) {
        await finalizeNotificationChain({
          stateFilePath: config.stateFilePath,
          sessionId: input.session_id,
          project: config.project,
          customMetadata: config.customMetadata,
          runtimeVersion,
          agentId: supersededNotificationAgentId,
        });
      }
    } catch (err) {
      error(`Failed to close interrupted turn: ${err}`);
    }
  }

  const turnNum = sessionState.turn_count + interruptedTurnsTraced + 1;

  const runId = uuid7();
  const startTime = new Date().toISOString();
  const segment = generateDottedOrderSegment(startTime, runId);

  // Decide where this turn nests.
  let traceId: string;
  let parentRunId: string | undefined;
  let dottedOrder: string;

  // A task-notification turn is the main agent reacting to a finished background
  // subagent. Detect + correlate in one step by matching the prompt against the
  // agent_ids in task_run_map. We match by the launch-time task_run_map entry
  // (recorded by PostToolUse), not by whether SubagentStop has finished: a
  // background agent finishing while the main agent is idle can fire this
  // notification's UserPromptSubmit *before* SubagentStop, so a finished marker may
  // not be set yet — but the launch-time entry always is. A notification
  // necessarily references its agent by id, so an id substring match is robust to
  // message-format changes; a 17-char hex id colliding with human text is
  // astronomically unlikely. (Reading origin.kind from the transcript doesn't work
  // here either — the prompt's line often isn't flushed to disk when this fires.)
  // A match nests the turn under that subagent's Agent tool run instead of
  // cluttering the top-level turn sequence.
  const notifAgentId = Object.keys(sessionState.task_run_map ?? {}).find((id) =>
    input.prompt.includes(id),
  );
  const agentToolRun = notifAgentId ? sessionState.task_run_map?.[notifAgentId] : undefined;
  const notificationAgentId = agentToolRun ? notifAgentId : undefined;

  if (agentToolRun) {
    traceId = parseDottedOrder(agentToolRun.dotted_order).traceId;
    parentRunId = agentToolRun.run_id;
    dottedOrder = `${agentToolRun.dotted_order}.${segment}`;
    debug(
      `Task-notification for agent ${notifAgentId}, nesting turn under Agent run ${parentRunId}`,
    );
  } else if (config.parentDottedOrder) {
    // If a parent dotted_order is provided, nest this turn under the existing run.
    const parsed = parseDottedOrder(config.parentDottedOrder);
    traceId = parsed.traceId;
    parentRunId = parsed.runId;
    dottedOrder = `${config.parentDottedOrder}.${segment}`;
    debug(`Nesting under parent run ${parentRunId} (trace ${traceId})`);
  } else {
    traceId = runId;
    parentRunId = undefined;
    dottedOrder = segment;
  }

  const runTree = new RunTree({
    client,
    replicas: config.replicas,
    id: runId,
    name: USER_PROMPT_TURN_NAME,
    run_type: "chain",
    inputs: { messages: [{ role: "user", content: input.prompt }] },
    project_name: config.project,
    start_time: startTime,
    trace_id: traceId,
    dotted_order: dottedOrder,
    ...(parentRunId ? { parent_run_id: parentRunId } : {}),
    extra: {
      metadata: codingAgentMetadata({
        sessionId: input.session_id,
        base: config.customMetadata,
        // turn_id (promptId) isn't known yet; Stop stamps it on completion.
        turnNumber: turnNum,
        runtimeVersion,
        approvalPolicy,
        legacyRole: "root", // DEPRECATED compat alias ls_agent_type="root".
      }),
    },
  });

  await runTree.postRun();

  debug(`Created initial run ${runId} for turn ${turnNum}`);

  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);

    // Preserve state for background subagents from prior turns that are still
    // running (they outlive their turn's Stop hook). We keep their Agent tool run
    // info in task_run_map so their traces still nest correctly, and keep their
    // turns in open_turns so the last SubagentStop can complete them. But we drop
    // the turn we just closed as interrupted above — it's already finalized, so a
    // late SubagentStop should still trace the subagent but not re-complete it.
    const inflightAgentIds = new Set(
      Object.values(ss.open_turns ?? {}).flatMap((t) => t.agent_ids),
    );
    const preservedTaskRunMap = Object.fromEntries(
      Object.entries(ss.task_run_map ?? {}).filter(([id]) => inflightAgentIds.has(id)),
    );
    const preservedOpenTurns = { ...ss.open_turns };
    if (sessionState.current_turn_run_id) {
      delete preservedOpenTurns[sessionState.current_turn_run_id];
    }

    return {
      ...s,
      [input.session_id]: {
        ...ss,
        current_turn_run_id: runId,
        current_trace_id: traceId,
        current_dotted_order: dottedOrder,
        current_parent_run_id: parentRunId,
        current_turn_number: turnNum,
        current_turn_start: startTime,
        // If this is a task-notification turn, record the agent it's for so Stop
        // closes that agent's tool run + launching turn once this turn completes.
        current_notification_agent_id: notificationAgentId,
        // Persisted so the closing hooks can stamp them onto their runs.
        approval_policy: approvalPolicy,
        ...(runtimeVersion ? { runtime_version: runtimeVersion } : {}),
        // Advance past the interrupted turn's messages so Stop doesn't re-trace them
        last_line: interruptedLastLine,
        turn_count: ss.turn_count + interruptedTurnsTraced,
        // Clear this turn's stale data, but keep still-running background subagents
        // and any Agent tool runs left open awaiting their task-notification.
        task_run_map: preservedTaskRunMap,
        traced_tool_use_ids: [],
        tool_start_times: {},
        pending_subagent_traces: [],
        open_turns: preservedOpenTurns,
        notification_done_agents: ss.notification_done_agents,
      },
    };
  });

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

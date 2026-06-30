#!/usr/bin/env node
/**
 * SubagentStop hook entry point.
 *
 * Invoked when a Claude Code subagent finishes (including when aborted).
 *
 * Two cases, discriminated by whether PostToolUse has already recorded the
 * Agent tool run in `task_run_map`:
 *
 *  1. SYNCHRONOUS subagent — SubagentStop fires *before* the Task tool returns,
 *     so PostToolUse hasn't recorded the Agent tool run yet. We can't trace it
 *     here (no parent run to nest under), so we queue it in
 *     `pending_subagent_traces` for the Stop hook, which runs after PostToolUse.
 *     The Stop hook traces it and completes the launching turn.
 *
 *  2. ASYNC (background) subagent — the Task tool returned at launch, so
 *     PostToolUse already recorded the Agent tool run. We trace it now, nested
 *     under its *launching* turn's trace (recovered from task_run_map, not the
 *     session's current turn — a newer turn may be active). We leave the Agent
 *     tool run *open* and the launching turn *deferred*: Claude emits a
 *     `<task-notification>` turn next, which nests under this Agent run, so it
 *     can't be closed until that turn completes. The notification turn's Stop
 *     (via finalizeNotificationChain) closes the Agent run and the launching
 *     turn; SessionEnd is the backstop if no notification ever arrives.
 */

import { debug, error } from "../logger.js";
import { atomicUpdateState, getSessionState, loadState } from "../state.js";
import { initTracing, tracePendingSubagents, flushPendingTraces } from "../langsmith.js";
import { finalizeNotificationChain } from "../finalize.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import type { SubagentStopHookInput, OpenTurn } from "../types.js";

async function main(): Promise<void> {
  const input: SubagentStopHookInput = await readStdin();

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`SubagentStop hook: agent_id=${input.agent_id}, type=${input.agent_type}`);

  const agentTranscriptPath = expandHome(input.agent_transcript_path);
  if (!agentTranscriptPath) {
    debug("No agent_transcript_path provided, skipping");
    return;
  }

  initTracing(
    config.apiKey,
    config.apiBaseUrl,
    config.replicas,
    config.redact,
    config.redactExtraRules,
  );

  const sessionState = getSessionState(loadState(config.stateFilePath), input.session_id);
  const taskRunMap = sessionState.task_run_map ?? {};
  const taskRunInfo = taskRunMap[input.agent_id];

  // Case 1: synchronous subagent — PostToolUse hasn't recorded the Agent tool
  // run yet. Queue for the Stop hook (which runs after PostToolUse).
  if (!taskRunInfo) {
    await atomicUpdateState(config.stateFilePath, (s) => {
      const ss = getSessionState(s, input.session_id);
      return {
        ...s,
        [input.session_id]: {
          ...ss,
          pending_subagent_traces: [
            ...(ss.pending_subagent_traces || []),
            {
              agent_id: input.agent_id,
              agent_type: input.agent_type,
              agent_transcript_path: agentTranscriptPath,
              session_id: input.session_id,
            },
          ],
        },
      };
    });
    debug(`Queued subagent ${input.agent_id} for Stop hook (Agent tool run not recorded yet)`);
    return;
  }

  // Case 2: async (background) subagent. Recover the launching turn's trace
  // context from the deferred Agent tool run so the subagent nests under the
  // correct turn even if a newer turn is now active.
  const deferred = taskRunInfo.deferred as Record<string, unknown> | undefined;
  const turnRunId =
    (deferred?.parent_run_id as string | undefined) ?? sessionState.current_turn_run_id;
  const turnTraceId = (deferred?.trace_id as string | undefined) ?? sessionState.current_trace_id;
  const launchingTurn: OpenTurn | undefined = turnRunId
    ? sessionState.open_turns?.[turnRunId]
    : undefined;

  if (!turnTraceId) {
    debug(`No trace context for subagent ${input.agent_id}, cannot trace`);
    return;
  }

  try {
    await tracePendingSubagents({
      sessionId: input.session_id,
      pendingSubagents: [
        {
          agent_id: input.agent_id,
          agent_type: input.agent_type,
          agent_transcript_path: agentTranscriptPath,
          session_id: input.session_id,
        },
      ],
      taskRunMap,
      parentTraceId: turnTraceId,
      project: config.project,
      customMetadata: config.customMetadata,
      runtimeVersion: launchingTurn?.runtime_version ?? sessionState.runtime_version,
      turnId: launchingTurn?.turn_id,
      turnNumber: launchingTurn?.turn_number ?? sessionState.current_turn_number,
      // Leave the Agent tool run open — the task-notification turn nests under it.
      keepAgentToolRunOpen: true,
    });
    debug(`Traced background subagent ${input.agent_type} (${input.agent_id})`);
  } catch (err) {
    error(`Failed to trace background subagent: ${err}`);
  }

  // Mark the subagent done on its task_run_map entry, then join with the
  // notification side. The notification turn and this SubagentStop fire in
  // non-deterministic order; the agent's tool run + launching turn are closed by
  // whichever runs LAST. We mark `subagent_done` regardless of whether the trace
  // succeeded (empty/aborted transcript still leaves an Agent tool run posted), so
  // the launching turn is always drained and never stranded. If the notification
  // turn already completed (notification_done_agents has us), we're last → finalize;
  // otherwise leave it for the notification turn's Stop to finalize.
  let finalizeNow = false;
  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    const entry = ss.task_run_map?.[input.agent_id];
    const notifDone = (ss.notification_done_agents ?? []).includes(input.agent_id);
    if (notifDone) finalizeNow = true;
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        task_run_map: entry
          ? {
              ...ss.task_run_map,
              [input.agent_id]: {
                ...entry,
                agent_type: input.agent_type || entry.agent_type,
                subagent_done: true,
              },
            }
          : ss.task_run_map,
        notification_done_agents: notifDone
          ? (ss.notification_done_agents ?? []).filter((id) => id !== input.agent_id)
          : ss.notification_done_agents,
      },
    };
  });

  if (finalizeNow) {
    debug(`Notification already done for ${input.agent_id}; finalizing from SubagentStop`);
    await finalizeNotificationChain({
      stateFilePath: config.stateFilePath,
      sessionId: input.session_id,
      project: config.project,
      customMetadata: config.customMetadata,
      runtimeVersion: launchingTurn?.runtime_version ?? sessionState.runtime_version,
      agentId: input.agent_id,
    });
  } else {
    debug(`Subagent ${input.agent_id} traced; awaiting task-notification to finalize`);
  }

  await flushPendingTraces();
}

main().catch((err) => {
  try {
    error(`SubagentStop hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0);
});

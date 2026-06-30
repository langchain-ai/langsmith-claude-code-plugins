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
 *
 *  2. BACKGROUND subagent — the Task tool returned at launch, so PostToolUse has
 *     already recorded the Agent tool run. The Stop hook for its turn has very
 *     likely already fired (the main agent stopped while this subagent kept
 *     running), so we trace it here directly, nested under its *launching*
 *     turn's trace (recovered from task_run_map, NOT the session's current turn —
 *     a newer turn may already be active). If this drains the launching turn's
 *     last in-flight subagent and Stop already finished that turn, we complete
 *     the turn's root run too.
 */

import { debug, error } from "../logger.js";
import { atomicUpdateState, getSessionState, loadState } from "../state.js";
import {
  initTracing,
  tracePendingSubagents,
  completeTurnRun,
  flushPendingTraces,
} from "../langsmith.js";
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

  initTracing(config.apiKey, config.apiBaseUrl, config.replicas);

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

  // Case 2: background subagent. Recover the launching turn's trace context from
  // the deferred Agent tool run, so the subagent nests under the correct turn
  // even if a newer turn is now active.
  const deferred = taskRunInfo.deferred as Record<string, unknown> | undefined;
  const turnRunId = (deferred?.parent_run_id as string | undefined) ?? sessionState.current_turn_run_id;
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
    });
    debug(`Traced background subagent ${input.agent_type} (${input.agent_id})`);
  } catch (err) {
    // A trace failure (e.g. aborted subagent with an empty transcript) shouldn't
    // leave the turn open — fall through to drain it from open_turns so the turn
    // can still complete.
    error(`Failed to trace background subagent: ${err}`);
  }

  // Drain this subagent from its launching turn. If it was the last one and Stop
  // already finished that turn (stop_seen), complete the turn's root run now. The
  // lock serializes concurrent SubagentStop hooks; deleting the entry under the
  // lock ensures exactly one of them completes the run.
  let completion: OpenTurn | undefined;
  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    if (!turnRunId || !ss.open_turns?.[turnRunId]) return s;

    const openTurns = { ...ss.open_turns };
    const entry = openTurns[turnRunId];
    const remaining = entry.agent_ids.filter((id) => id !== input.agent_id);

    if (remaining.length === 0 && entry.stop_seen) {
      // Last subagent done and the main turn already finished — we complete it.
      completion = entry;
      delete openTurns[turnRunId];
    } else {
      // More subagents pending, or Stop hasn't finished the main turn yet (it will
      // complete the turn itself once it sees an empty agent_ids).
      openTurns[turnRunId] = { ...entry, agent_ids: remaining };
    }

    return { ...s, [input.session_id]: { ...ss, open_turns: openTurns } };
  });

  if (completion) {
    debug(`Last background subagent done — completing deferred turn ${completion.run_id}`);
    try {
      await completeTurnRun({
        sessionId: input.session_id,
        runId: completion.run_id,
        traceId: completion.trace_id,
        dottedOrder: completion.dotted_order,
        parentRunId: completion.parent_run_id,
        startTime: completion.start_time,
        project: config.project,
        lastAssistantMessage: completion.last_assistant_message,
        customMetadata: config.customMetadata,
        turnId: completion.turn_id,
        turnNumber: completion.turn_number,
        runtimeVersion: completion.runtime_version,
        approvalPolicy: completion.approval_policy,
      });
      debug(`Deferred turn run ${completion.run_id} completed`);
    } catch (err) {
      error(`Failed to complete deferred turn run: ${err}`);
    }
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

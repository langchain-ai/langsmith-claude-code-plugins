#!/usr/bin/env node
/**
 * Stop hook entry point.
 *
 * Invoked by Claude Code when the main agent finishes responding.
 * Reads the transcript, identifies new messages since last run,
 * groups them into turns, and sends traces to LangSmith.
 */

import { readTranscript, groupIntoTurns, readRuntimeVersion } from "../transcript.js";
import { log, warn, debug, error } from "../logger.js";
import {
  loadState,
  atomicUpdateState,
  getSessionState,
  updateSessionState,
  pruneOldSessions,
} from "../state.js";
import {
  initTracing,
  traceTurn,
  tracePendingSubagents,
  completeTurnRun,
  flushPendingTraces,
} from "../langsmith.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import { finalizeNotificationChain } from "../finalize.js";
import type { StopHookInput } from "../types.js";

async function main(): Promise<void> {
  const startTime = Date.now();

  // Read hook input from stdin.
  const input: StopHookInput = await readStdin();

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`Stop hook started, session=${input.session_id}`);

  // Skip recursive hook calls.
  if (input.stop_hook_active) {
    debug("stop_hook_active=true, skipping");
    return;
  }

  // Validate input.
  const transcriptPath = expandHome(input.transcript_path);
  if (!input.session_id || !transcriptPath) {
    warn(`Invalid input: session=${input.session_id}, transcript=${transcriptPath}`);
    return;
  }

  initTracing(
    config.apiKey,
    config.apiBaseUrl,
    config.replicas,
    config.redact,
    config.redactExtraRules,
  );

  // Load state and read new messages.
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  debug(`Last line: ${sessionState.last_line}, turn count: ${sessionState.turn_count}`);

  // CLI version + approval policy: prefer state, fall back to the transcript.
  const runtimeVersion = sessionState.runtime_version ?? readRuntimeVersion(transcriptPath);
  const approvalPolicy = sessionState.approval_policy ?? input.permission_mode;

  // Wait briefly for the transcript writer to flush. Stop fires as soon as the
  // model finishes generating, but the JSONL file write may still be in flight.
  await new Promise((r) => setTimeout(r, 200));

  const { messages, lastLine } = readTranscript(transcriptPath, sessionState.last_line);
  if (messages.length === 0) {
    debug("No new messages");
    // Clear stale current_turn_run_id so the next invocation doesn't try to complete it.
    if (sessionState.current_turn_run_id) {
      await atomicUpdateState(config.stateFilePath, (s) => {
        const ss = getSessionState(s, input.session_id);
        return { ...s, [input.session_id]: { ...ss, current_turn_run_id: undefined } };
      });
    }
    return;
  }

  log(`Found ${messages.length} new messages`);

  // Group into turns and trace each one.
  const turns = groupIntoTurns(messages);

  // The transcript file may not be fully flushed when this hook fires.
  // If the last turn's final LLM call had tool calls but there's no
  // subsequent LLM call, the final assistant response is missing from
  // the transcript. Patch it using last_assistant_message from the hook
  // input, which Claude Code guarantees is the complete final text.
  // Use real wall-clock times: last_tool_end_time (from PostToolUse) as
  // start, and Date.now() (Stop hook firing time) as end.
  if (turns.length > 0 && input.last_assistant_message) {
    const lastTurn = turns[turns.length - 1];
    const lastLlm = lastTurn.llmCalls[lastTurn.llmCalls.length - 1];
    if (lastLlm && lastLlm.toolCalls.length > 0) {
      debug("Final LLM response missing from transcript, synthesizing from last_assistant_message");
      const syntheticStart = sessionState.last_tool_end_time
        ? new Date(sessionState.last_tool_end_time).toISOString()
        : (lastLlm.toolCalls[lastLlm.toolCalls.length - 1].result?.timestamp ?? lastLlm.endTime);
      const syntheticEnd = new Date(startTime).toISOString(); // startTime = Date.now() at top of Stop hook
      lastTurn.llmCalls.push({
        content: [{ type: "text", text: input.last_assistant_message }],
        model: lastLlm.model,
        usage: { input_tokens: 0, output_tokens: 0 },
        startTime: syntheticStart,
        endTime: syntheticEnd,
        toolCalls: [],
        synthetic: true,
      });
    }
  }

  let tracedTurns = 0;

  // Collect task run mappings for subagent linking
  let allTaskRunMaps: Record<string, { run_id: string; dotted_order: string }> = {};

  // The current_turn_run_id from state is for the LAST turn (the one that just completed)
  // Earlier turns (from interruptions) are traced standalone
  const currentRunId = sessionState.current_turn_run_id;
  const currentTraceId = sessionState.current_trace_id;
  const currentDottedOrder = sessionState.current_dotted_order;
  const currentParentRunId = sessionState.current_parent_run_id;

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const isLastTurn = i === turns.length - 1;
    const turnNum = sessionState.turn_count + tracedTurns + 1;

    // Only the last turn gets nested under the UserPromptSubmit run
    const parentRunId = isLastTurn ? currentRunId : undefined;
    const traceId = isLastTurn ? currentTraceId : undefined;
    const dottedOrder = isLastTurn ? currentDottedOrder : undefined;

    // Pass existing task_run_map and traced_tool_use_ids so we don't duplicate
    // tools already traced by PostToolUse.
    const existingTaskRunMap = isLastTurn ? sessionState.task_run_map : undefined;
    const tracedToolUseIds = isLastTurn
      ? new Set(sessionState.traced_tool_use_ids ?? [])
      : undefined;

    try {
      const taskRunMap = await traceTurn({
        turn,
        sessionId: input.session_id,
        turnNum,
        project: config.project,
        customMetadata: config.customMetadata,
        runtimeVersion,
        approvalPolicy,

        parentRunId,
        existingTaskRunMap,
        tracedToolUseIds,
        traceId,
        parentDottedOrder: dottedOrder,
      });
      allTaskRunMaps = { ...allTaskRunMaps, ...taskRunMap };
      tracedTurns++;
    } catch (err) {
      error(`Failed to trace turn ${turnNum}: ${err}`);
    }
  }

  // Re-read state so we pick up writes from SubagentStop and PostToolUse
  // that may have landed while we were tracing the main transcript.
  const freshState = loadState(config.stateFilePath);
  const freshSession = getSessionState(freshState, input.session_id);

  // Merge task_run_map entries written by PostToolUse with those from traceTurn
  const mergedTaskRunMap = { ...freshSession.task_run_map, ...allTaskRunMaps };

  const lastTurnId = turns[turns.length - 1]?.promptId;

  // Process any pending subagent traces queued by SubagentStop. These are
  // synchronous subagents whose SubagentStop fired before PostToolUse recorded
  // the Agent tool run, so they were queued for us to trace here instead.
  const pendingSubagents = freshSession.pending_subagent_traces || [];
  const processedAgentIds = new Set<string>();
  if (pendingSubagents.length > 0) {
    debug(`Processing ${pendingSubagents.length} pending subagent trace(s)`);
    await tracePendingSubagents({
      sessionId: input.session_id,
      pendingSubagents,
      taskRunMap: mergedTaskRunMap,
      parentTraceId: freshSession.current_trace_id,
      project: config.project,
      customMetadata: config.customMetadata,
      runtimeVersion,
      turnId: lastTurnId,
      turnNumber: sessionState.current_turn_number,
    });
    for (const sa of pendingSubagents) processedAgentIds.add(sa.agent_id);
  }

  // Save updated state — re-read inside the lock so we don't clobber
  // concurrent writes from PostToolUse/SubagentStop.
  //
  // If we traced 0 turns, don't advance last_line. This handles the race
  // condition where Stop fires before the transcript contains the assistant
  // response (e.g. only a file-history-snapshot + user message are on disk).
  // Keeping last_line at its previous value lets the next Stop re-read from
  // the same position and pick up the complete turn.
  const savedLastLine = tracedTurns > 0 ? lastLine : sessionState.last_line;

  // Decide — atomically, inside the lock — whether to complete this turn's run
  // now or defer to the last SubagentStop. PostToolUse records each launched Agent
  // under its turn in open_turns[turnRunId].agent_ids; SubagentStop (background) or
  // this hook (sync, above) drains them as they're traced. If any background
  // subagent for THIS turn is still in flight when we read inside the lock, we must
  // defer so the turn's duration spans that work — recording stop_seen + the real
  // outputs in the same write, so a SubagentStop finishing concurrently can't drain
  // the turn without also seeing it's safe to complete. We always clear
  // current_turn_run_id (the main loop is done with this turn); a deferred turn
  // lives on in open_turns until its subagents drain. Whoever removes the turn from
  // open_turns / clears current_turn_run_id under the lock owns the one completion.
  let completeNow = false;
  // If this turn is a task-notification turn, the async agent it reports on —
  // claimed atomically below so only the Stop that actually completes the turn
  // runs the finalize (guards against a concurrent/re-fired Stop doing it twice).
  let notificationToFinalize: string | undefined;
  // True when the notification this turn handled reported a killed/interrupted
  // subagent — finalize without waiting on SubagentStop (which won't fire).
  let notificationInterrupted = false;
  await atomicUpdateState(config.stateFilePath, (latestState) => {
    const latestSession = getSessionState(latestState, input.session_id);
    const updatedState = updateSessionState(
      latestState,
      input.session_id,
      savedLastLine,
      latestSession.turn_count + tracedTurns,
      // Merge any late PostToolUse writes with our traced entries. allTaskRunMaps
      // wins on conflicts since it has the fully resolved data from traceTurn.
      { ...latestSession.task_run_map, ...allTaskRunMaps },
    );
    const s = updatedState[input.session_id];

    // Read the notification marker inside the lock so claiming + clearing it is
    // atomic with the completion decision.
    const notifAgentId = latestSession.current_notification_agent_id;
    const notifInterrupted = latestSession.current_notification_interrupted ?? false;

    // Drop the sync subagents we just traced from the queue.
    s.pending_subagent_traces = (latestSession.pending_subagent_traces ?? []).filter(
      (sa) => !processedAgentIds.has(sa.agent_id),
    );

    const openTurns = { ...latestSession.open_turns };
    const entry = currentRunId ? openTurns[currentRunId] : undefined;

    if (currentRunId && entry) {
      // This turn launched background subagents. Drain the ones we just traced and
      // mark the main turn finished, stashing the outputs only this hook carries.
      const remaining = entry.agent_ids.filter((id) => !processedAgentIds.has(id));
      if (remaining.length > 0) {
        openTurns[currentRunId] = {
          ...entry,
          agent_ids: remaining,
          stop_seen: true,
          last_assistant_message: input.last_assistant_message,
          turn_id: lastTurnId,
          // If this turn is itself a task-notification turn that spawned its own
          // background subagent, remember the agent to finalize once it drains.
          notification_for_agent_id: notifAgentId ?? entry.notification_for_agent_id,
        };
        debug(`${remaining.length} background subagent(s) in flight, deferring turn completion`);
      } else {
        // All drained already — complete now and drop the entry.
        completeNow = true;
        notificationToFinalize = notifAgentId;
        notificationInterrupted = notifInterrupted;
        delete openTurns[currentRunId];
      }
    } else {
      // No background subagents for this turn — normal inline completion.
      completeNow = Boolean(currentRunId);
      if (completeNow) {
        notificationToFinalize = notifAgentId;
        notificationInterrupted = notifInterrupted;
      }
    }
    s.open_turns = openTurns;

    // The main loop is done with this turn regardless; clear so the next
    // UserPromptSubmit doesn't mistake a deferred turn for an interrupted one.
    s.current_turn_run_id = undefined;
    // Consume the notification markers; the finalize below (or the deferred
    // open_turns entry) now owns them.
    s.current_notification_agent_id = undefined;
    s.current_notification_interrupted = undefined;
    s.traced_tool_use_ids = [];
    s.tool_start_times = {};
    return pruneOldSessions(updatedState);
  });

  // Complete the Turn run created by UserPromptSubmit (unless deferred above).
  if (completeNow && currentRunId) {
    debug(`Completing Turn run ${currentRunId}`);
    try {
      await completeTurnRun({
        sessionId: input.session_id,
        runId: currentRunId,
        traceId: currentTraceId,
        dottedOrder: currentDottedOrder,
        parentRunId: currentParentRunId,
        startTime: sessionState.current_turn_start,
        project: config.project,
        lastAssistantMessage: input.last_assistant_message,
        customMetadata: config.customMetadata,
        turnId: lastTurnId,
        turnNumber: sessionState.current_turn_number,
        runtimeVersion,
        approvalPolicy,
      });
      debug(`Turn run ${currentRunId} completed`);
    } catch (err) {
      error(`Failed to complete turn run: ${err}`);
    }
  }

  // If this was a task-notification turn that completed now, finalize the agent's
  // chain — but only once its subagent has actually been traced. SubagentStop and
  // this notification turn fire in non-deterministic order; we close the agent's
  // (open) tool run + launching turn from whichever runs LAST. Here (notification
  // side): if SubagentStop already traced the agent (task_run_map subagent_done is
  // set), we're last → finalize. Otherwise record this side as done and let
  // SubagentStop do it.
  if (notificationToFinalize && notificationInterrupted) {
    // The subagent was killed/interrupted: SubagentStop never fires for it, so
    // there's no join to wait on — finalize now, marking its tool run interrupted,
    // rather than leaving the launching turn open until SessionEnd.
    await finalizeNotificationChain({
      stateFilePath: config.stateFilePath,
      sessionId: input.session_id,
      project: config.project,
      customMetadata: config.customMetadata,
      runtimeVersion,
      agentId: notificationToFinalize,
      interrupted: true,
    });
  } else if (notificationToFinalize) {
    let finalizeNow = false;
    await atomicUpdateState(config.stateFilePath, (s) => {
      const ss = getSessionState(s, input.session_id);
      if (ss.task_run_map?.[notificationToFinalize!]?.subagent_done) {
        finalizeNow = true;
        return s;
      }
      return {
        ...s,
        [input.session_id]: {
          ...ss,
          notification_done_agents: [
            ...(ss.notification_done_agents ?? []).filter((id) => id !== notificationToFinalize),
            notificationToFinalize!,
          ],
        },
      };
    });
    if (finalizeNow) {
      await finalizeNotificationChain({
        stateFilePath: config.stateFilePath,
        sessionId: input.session_id,
        project: config.project,
        customMetadata: config.customMetadata,
        runtimeVersion,
        agentId: notificationToFinalize,
      });
    }
  }

  // Flush pending batches to ensure all traces are sent before hook exits.
  await flushPendingTraces();

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`Processed ${tracedTurns} turns in ${duration}s`);

  if (Date.now() - startTime > 180_000) {
    warn(`Hook took ${duration}s (>3min), consider optimizing`);
  }
}

main().catch((err) => {
  try {
    error(`Stop hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0); // Always exit 0 so Claude Code isn't affected.
});

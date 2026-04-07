#!/usr/bin/env node
/**
 * Stop hook entry point.
 *
 * Invoked by Claude Code when the main agent finishes responding.
 * Reads the transcript, identifies new messages since last run,
 * groups them into turns, and sends traces to LangSmith.
 */

import { readTranscript, groupIntoTurns } from "../transcript.js";
import { log, warn, debug, error } from "../logger.js";
import {
  loadState,
  atomicUpdateState,
  getSessionState,
  updateSessionState,
  pruneOldSessions,
} from "../state.js";
import { initTracing, traceTurn, tracePendingSubagents, flushPendingTraces } from "../langsmith.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import type { StopHookInput } from "../types.js";
import { RunTree } from "langsmith";
import { USER_PROMPT_TURN_NAME } from "../constants.js";

async function main(): Promise<void> {
  const startTime = Date.now();

  // Read hook input from stdin.
  const input: StopHookInput = await readStdin();

  const config = initHook();
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

  const client = initTracing(config.apiKey, config.apiBaseUrl, config.replicas);

  // Load state and read new messages.
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  debug(`Last line: ${sessionState.last_line}, turn count: ${sessionState.turn_count}`);

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

  // Complete the Turn run created by UserPromptSubmit
  if (currentRunId) {
    debug(`Completing Turn run ${currentRunId}`);

    // We need to patch the existing run with end time
    try {
      const runTree = new RunTree({
        client,
        replicas: config.replicas,
        name: USER_PROMPT_TURN_NAME,
        id: currentRunId,
        trace_id: currentTraceId,
        dotted_order: currentDottedOrder,
        parent_run_id: currentParentRunId,
        end_time: Date.now(),
        outputs: {
          messages: [{ role: "assistant", content: input.last_assistant_message }],
        },
        extra: {
          metadata: {
            thread_id: input.session_id,
            ls_integration: "claude-code",
            ls_agent_type: "root",
            turn_number: sessionState.current_turn_number,
          },
        },
      });
      await runTree.patchRun({ excludeInputs: true });
      debug(`Turn run ${currentRunId} completed`);
    } catch (err) {
      error(`Failed to complete turn run: ${err}`);
    }
  }

  // Re-read state so we pick up writes from SubagentStop and PostToolUse
  // that may have landed while we were tracing the main transcript.
  const freshState = loadState(config.stateFilePath);
  const freshSession = getSessionState(freshState, input.session_id);

  // Merge task_run_map entries written by PostToolUse with those from traceTurn
  const mergedTaskRunMap = { ...freshSession.task_run_map, ...allTaskRunMaps };

  // Process any pending subagent traces queued by SubagentStop
  const pendingSubagents = freshSession.pending_subagent_traces || [];
  if (pendingSubagents.length > 0) {
    debug(`Processing ${pendingSubagents.length} pending subagent trace(s)`);
    await tracePendingSubagents({
      sessionId: input.session_id,
      pendingSubagents,
      taskRunMap: mergedTaskRunMap,
      parentTraceId: freshSession.current_trace_id,
      project: config.project,
    });
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
    // Clear fields that are no longer needed
    updatedState[input.session_id].current_turn_run_id = undefined;
    updatedState[input.session_id].pending_subagent_traces = [];
    updatedState[input.session_id].traced_tool_use_ids = [];
    updatedState[input.session_id].tool_start_times = {};
    return pruneOldSessions(updatedState);
  });

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

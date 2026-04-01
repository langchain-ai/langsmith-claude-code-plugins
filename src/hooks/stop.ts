#!/usr/bin/env node
/**
 * Stop hook entry point.
 *
 * Invoked by Claude Code when the main agent finishes responding.
 * Reads the transcript, identifies new messages since last run,
 * groups them into turns, and sends traces to LangSmith.
 */

import { readTranscript, groupIntoTurns } from "../transcript.js";
import { loadConfig } from "../config.js";
import { initLogger, log, warn, debug, error } from "../logger.js";
import { loadState, saveState, getSessionState, updateSessionState } from "../state.js";
import { initClient, traceTurn, flushPendingTraces } from "../langsmith.js";
import type { StopHookInput } from "../types.js";

async function main(): Promise<void> {
  const startTime = Date.now();

  // Read hook input from stdin.
  const input: StopHookInput = await readStdin();

  const config = loadConfig();
  initLogger(config.debug);

  debug(`Stop hook started, session=${input.session_id}`);

  // Skip if tracing is disabled.
  if (!process.env.TRACE_TO_LANGSMITH || process.env.TRACE_TO_LANGSMITH.toLowerCase() !== "true") {
    debug("Tracing disabled (TRACE_TO_LANGSMITH !== true), exiting");
    return;
  }

  // Skip recursive hook calls.
  if (input.stop_hook_active) {
    debug("stop_hook_active=true, skipping");
    return;
  }

  // Validate config.
  if (!config.apiKey) {
    error("No API key set (CC_LANGSMITH_API_KEY or LANGSMITH_API_KEY)");
    return;
  }

  // Validate input.
  const transcriptPath = input.transcript_path?.replace(/^~/, process.env.HOME ?? "");
  if (!input.session_id || !transcriptPath) {
    warn(`Invalid input: session=${input.session_id}, transcript=${transcriptPath}`);
    return;
  }

  initClient(config.apiKey, config.apiBaseUrl);

  // Load state and read new messages.
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  debug(`Last line: ${sessionState.last_line}, turn count: ${sessionState.turn_count}`);

  const { messages, lastLine } = readTranscript(transcriptPath, sessionState.last_line);
  if (messages.length === 0) {
    debug("No new messages");
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
  if (turns.length > 0 && input.last_assistant_message) {
    const lastTurn = turns[turns.length - 1];
    const lastLlm = lastTurn.llmCalls[lastTurn.llmCalls.length - 1];
    if (lastLlm && lastLlm.toolCalls.length > 0) {
      debug("Final LLM response missing from transcript, synthesizing from last_assistant_message");
      const lastToolResult = lastLlm.toolCalls[lastLlm.toolCalls.length - 1];
      const syntheticStartTime = lastToolResult.result?.timestamp ?? lastLlm.endTime;
      lastTurn.llmCalls.push({
        content: [{ type: "text", text: input.last_assistant_message }],
        model: lastLlm.model,
        usage: { input_tokens: 0, output_tokens: 0 },
        startTime: syntheticStartTime,
        endTime: new Date().toISOString(),
        toolCalls: [],
      });
    }
  }

  let tracedTurns = 0;

  // Detect if this is a subagent based on agent_id or agent_type
  const isSubagent = !!(input.agent_id || input.agent_type);

  // Collect task run mappings for subagent linking
  const allTaskRunMaps: Record<string, { run_id: string; dotted_order: string }> = {};

  // The current_turn_run_id from state is for the LAST turn (the one that just completed)
  // Earlier turns (from interruptions) are traced standalone
  const currentRunId = sessionState.current_turn_run_id;
  const currentTraceId = sessionState.current_trace_id;
  const currentDottedOrder = sessionState.current_dotted_order;

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const isLastTurn = i === turns.length - 1;
    const turnNum = sessionState.turn_count + tracedTurns + 1;

    // Only the last turn gets nested under the UserPromptSubmit run
    const parentRunId = isLastTurn ? currentRunId : undefined;
    const traceId = isLastTurn ? currentTraceId : undefined;
    const dottedOrder = isLastTurn ? currentDottedOrder : undefined;

    // Pass existing task_run_map so we don't duplicate Task tools traced by PostToolUse
    const existingTaskRunMap = isLastTurn ? sessionState.task_run_map : undefined;

    try {
      const taskRunMap = await traceTurn({
        turn,
        sessionId: input.session_id,
        turnNum,
        project: config.project,
        isSubagent,
        parentRunId,
        existingTaskRunMap,
        traceId,
        parentDottedOrder: dottedOrder,
      });
      Object.assign(allTaskRunMaps, taskRunMap);
      tracedTurns++;
    } catch (err) {
      error(`Failed to trace turn ${turnNum}: ${err}`);
    }
  }

  // Complete the Turn run created by UserPromptSubmit
  if (currentRunId) {
    debug(`Completing Turn run ${currentRunId}`);

    const client = initClient(config.apiKey, config.apiBaseUrl);

    // We need to patch the existing run with end time
    // LangSmith SDK doesn't have a direct "patch" method, but we can call the API
    try {
      await client.updateRun(currentRunId, {
        trace_id: currentTraceId,
        dotted_order: currentDottedOrder,
        end_time: Date.now(),
        outputs: {
          messages: [{ role: "assistant", content: input.last_assistant_message }],
        },
      });
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

    for (const subagent of pendingSubagents) {
      try {
        const taskRunInfo = mergedTaskRunMap[subagent.agent_id];
        if (!taskRunInfo) {
          error(`No Agent tool run found for ${subagent.agent_id} - cannot trace subagent`);
          continue;
        }

        const parentToolRunId = taskRunInfo.run_id;
        const agentToolDottedOrder = taskRunInfo.dotted_order;
        // Use current_trace_id from fresh state (still valid — set by UserPromptSubmit)
        const parentTraceId = freshSession.current_trace_id;

        debug(`Processing subagent ${subagent.agent_type} (${subagent.agent_id}) under run ${parentToolRunId}`);

        // Read subagent transcript (JSONL format, same as main transcript)
        const { messages: subagentMessages } = readTranscript(subagent.agent_transcript_path, -1);
        if (subagentMessages.length === 0) {
          debug(`Empty subagent transcript: ${subagent.agent_transcript_path}`);
          continue;
        }

        const subagentTurns = groupIntoTurns(subagentMessages);

        for (let i = 0; i < subagentTurns.length; i++) {
          await traceTurn({
            turn: subagentTurns[i],
            sessionId: subagent.session_id,
            turnNum: i + 1,
            project: config.project,
            isSubagent: true,
            parentRunId: parentToolRunId,
            existingTaskRunMap: undefined,
            traceId: parentTraceId,
            parentDottedOrder: agentToolDottedOrder,
          });
        }

        log(`Traced subagent ${subagent.agent_type} (${subagent.agent_id}): ${subagentTurns.length} turn(s)`);
      } catch (err) {
        error(`Failed to trace subagent ${subagent.agent_id}: ${err}`);
      }
    }
  }

  // Flush pending batches to ensure traces are sent before exiting.
  if (tracedTurns > 0 || pendingSubagents.length > 0) {
    debug("Flushing pending trace batches...");
    await flushPendingTraces();
    debug("Flush complete");
  }

  // Save updated state — use freshState as base so we don't clobber
  // writes from PostToolUse/SubagentStop, then layer our updates on top.
  const updatedState = updateSessionState(
    freshState,
    input.session_id,
    lastLine,
    sessionState.turn_count + tracedTurns,
    allTaskRunMaps,
  );
  // Clear fields that are no longer needed
  updatedState[input.session_id].current_turn_run_id = undefined;
  updatedState[input.session_id].pending_subagent_traces = [];
  saveState(config.stateFilePath, updatedState);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`Processed ${tracedTurns} turns in ${duration}s`);

  if (Date.now() - startTime > 180_000) {
    warn(`Hook took ${duration}s (>3min), consider optimizing`);
  }
}

/** Read all of stdin as JSON. */
function readStdin(): Promise<StopHookInput> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error(`Failed to parse hook input: ${err}`));
      }
    });
    process.stdin.on("error", reject);
  });
}

main().catch((err) => {
  try {
    error(`Stop hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0); // Always exit 0 so Claude Code isn't affected.
});

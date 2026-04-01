#!/usr/bin/env node
/**
 * Stop hook entry point.
 *
 * Invoked by Claude Code when the main agent finishes responding.
 * Reads the transcript, identifies new messages since last run,
 * groups them into turns, and sends traces to LangSmith.
 */

import { uuid7 } from "langsmith";
import { readTranscript, groupIntoTurns } from "../transcript.js";
import { log, warn, debug, error } from "../logger.js";
import {
  loadState,
  atomicUpdateState,
  getSessionState,
  updateSessionState,
  pruneOldSessions,
} from "../state.js";
import {
  initClient,
  traceTurn,
  flushPendingTraces,
  generateDottedOrderSegment,
} from "../langsmith.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import type { StopHookInput } from "../types.js";

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

  const client = initClient(config.apiKey, config.apiBaseUrl);

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
      Object.assign(allTaskRunMaps, taskRunMap);
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
      await client.updateRun(currentRunId, {
        trace_id: currentTraceId,
        dotted_order: currentDottedOrder,
        end_time: Date.now(),
        outputs: {
          messages: [{ role: "assistant", content: input.last_assistant_message }],
        },
        extra: {
          metadata: {
            thread_id: input.session_id,
            ls_integration: "claude-code",
            ls_agent_type: "agent",
            turn_number: sessionState.current_turn_number,
          },
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
        const parentTraceId = freshSession.current_trace_id;
        const toolName = subagent.agent_type || "Agent";

        // Get deferred creation info from the fresh session state (PostToolUse writes it there)
        const freshTaskRunInfo = freshSession.task_run_map?.[subagent.agent_id];
        const deferred = freshTaskRunInfo?.deferred;

        debug(
          `Processing subagent ${toolName} (${subagent.agent_id}) under run ${parentToolRunId}`,
        );

        // PostToolUse deferred the Agent tool run creation so we can use the
        // real subagent name. Create it now with the correct name.
        if (deferred) {
          await client.createRun({
            id: parentToolRunId,
            name: "Agent",
            run_type: "tool",
            inputs: { input: deferred.inputs },
            outputs: { output: deferred.outputs },
            project_name: deferred.project_name,
            start_time: deferred.start_time,
            end_time: deferred.end_time,
            parent_run_id: deferred.parent_run_id,
            trace_id: deferred.trace_id,
            dotted_order: agentToolDottedOrder,
            extra: {
              metadata: {
                thread_id: input.session_id,
                ls_integration: "claude-code",
                tool_name: "Agent",
                agent_type: toolName,
                agent_id: subagent.agent_id,
              },
            },
          });
        }

        // Read subagent transcript (JSONL format, same as main transcript)
        const { messages: subagentMessages } = readTranscript(subagent.agent_transcript_path, -1);
        if (subagentMessages.length === 0) {
          debug(`Empty subagent transcript: ${subagent.agent_transcript_path}`);
          continue;
        }

        const subagentTurns = groupIntoTurns(subagentMessages);

        // Create an intermediate chain run named "${toolName} Subagent" as a child
        // of the Agent tool run, then nest all subagent turns under it.
        const subagentChainId = uuid7();
        const subagentChainStartTime = deferred?.start_time ?? Date.now();
        const subagentChainDottedOrder = `${agentToolDottedOrder}.${generateDottedOrderSegment(subagentChainStartTime, subagentChainId)}`;

        await client.createRun({
          id: subagentChainId,
          name: `${toolName} Subagent`,
          run_type: "chain",
          inputs: deferred?.inputs ?? {},
          outputs: { output: deferred?.outputs },
          project_name: config.project,
          start_time: subagentChainStartTime,
          end_time: deferred?.end_time ?? Date.now(),
          parent_run_id: parentToolRunId,
          trace_id: parentTraceId,
          dotted_order: subagentChainDottedOrder,
          extra: {
            metadata: {
              thread_id: input.session_id,
              ls_integration: "claude-code",
              agent_type: toolName,
              agent_id: subagent.agent_id,
            },
          },
        });

        for (let i = 0; i < subagentTurns.length; i++) {
          await traceTurn({
            turn: subagentTurns[i],
            sessionId: input.session_id,
            turnNum: i + 1,
            project: config.project,

            parentRunId: subagentChainId,
            existingTaskRunMap: undefined,
            traceId: parentTraceId,
            parentDottedOrder: subagentChainDottedOrder,
          });
        }

        log(
          `Traced subagent ${subagent.agent_type} (${subagent.agent_id}): ${subagentTurns.length} turn(s)`,
        );
      } catch (err) {
        error(`Failed to trace subagent ${subagent.agent_id}: ${err}`);
      }
    }
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
    const updatedState = updateSessionState(
      latestState,
      input.session_id,
      savedLastLine,
      sessionState.turn_count + tracedTurns,
      { ...getSessionState(latestState, input.session_id).task_run_map, ...allTaskRunMaps },
    );
    // Clear fields that are no longer needed
    updatedState[input.session_id].current_turn_run_id = undefined;
    updatedState[input.session_id].pending_subagent_traces = [];
    updatedState[input.session_id].traced_tool_use_ids = [];
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

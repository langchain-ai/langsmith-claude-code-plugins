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

  const config = initHook();
  if (!config) return;

  // Subagent tool calls are traced by the Stop hook from the transcript.
  // Skip here to avoid double-tracing and orphan runs.
  if (input.agent_id || input.agent_type) {
    debug("Skipping PostToolUse for subagent tool — Stop hook handles tracing");
    return;
  }

  const client = initTracing(config.apiKey, config.apiBaseUrl);

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

  // Generate proper dotted order segment
  const toolDottedOrderSegment = generateDottedOrderSegment(startTime, toolRunId);
  const toolDottedOrder = `${parentDottedOrder}.${toolDottedOrderSegment}`;

  const agentId = (input.tool_response as { agentId?: string }).agentId;

  if (agentId) {
    // Agent tool: defer LangSmith run creation to the Stop hook, which will
    // have the actual subagent type from SubagentStop's pending_subagent_traces.
    debug(`Agent tool detected, deferring run creation for ${agentId} -> ${toolRunId}`);
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
      start_time: startTime,
      end_time: toolEndTime,
      parent_run_id: parentRunId,
      trace_id: traceId,
      dotted_order: toolDottedOrder,
      extra: {
        metadata: {
          thread_id: input.session_id,
          ls_integration: "claude-code",
          tool_name: input.tool_name,
        },
      },
    });
    await runTree.postRun();
  }

  // Save state atomically so concurrent PostToolUse hooks don't clobber each other.
  await atomicUpdateState(config.stateFilePath, (freshState) => {
    const freshSession = getSessionState(freshState, input.session_id);
    return {
      ...freshState,
      [input.session_id]: {
        ...freshSession,
        last_tool_end_time: toolEndTime,
        ...(agentId
          ? {
              task_run_map: {
                ...freshSession.task_run_map,
                [agentId]: {
                  run_id: toolRunId,
                  dotted_order: toolDottedOrder,
                  deferred: {
                    trace_id: traceId!,
                    parent_run_id: parentRunId!,
                    start_time: startTime,
                    end_time: toolEndTime,
                    inputs: input.tool_input,
                    outputs: input.tool_response,
                    project_name: config.project,
                  },
                },
              },
            }
          : {
              // Record tool_use_id so traceTurn skips it (avoids double-tracing).
              traced_tool_use_ids: [...(freshSession.traced_tool_use_ids ?? []), input.tool_use_id],
            }),
      },
    };
  });

  // Flush pending batches so traces are sent before this async hook exits.
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

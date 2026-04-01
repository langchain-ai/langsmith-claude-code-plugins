#!/usr/bin/env node
/**
 * PostToolUse hook entry point.
 *
 * Fires after a tool executes. For Task tools (subagent spawning), this
 * traces the tool call immediately and stores the run ID mapped to agent_id
 * so SubagentStop can nest the subagent trace under it.
 */

import { loadConfig } from "../config.js";
import { initLogger, debug, error } from "../logger.js";
import { initClient, generateDottedOrderSegment } from "../langsmith.js";
import { loadState, saveState, getSessionState, updateSessionState } from "../state.js";

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
  const hookStartTime = Date.now();
  const input: PostToolUseHookInput = await readStdin();

  const config = loadConfig();
  initLogger(config.debug);

  debug(`PostToolUse hook for ${input.tool_name}`);

  if (!process.env.TRACE_TO_LANGSMITH || process.env.TRACE_TO_LANGSMITH.toLowerCase() !== "true") {
    return;
  }

  if (!config.apiKey) {
    error("No API key set (CC_LANGSMITH_API_KEY or LANGSMITH_API_KEY)");
    return;
  }

  const client = initClient(config.apiKey, config.apiBaseUrl);

  // Load state to get current turn's run ID (created by UserPromptSubmit)
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  const parentRunId = sessionState.current_turn_run_id;
  const traceId = sessionState.current_trace_id;
  const parentDottedOrder = sessionState.current_dotted_order;

  if (!parentRunId || !traceId) {
    error("No current_turn_run_id or trace_id in state - UserPromptSubmit hook may not have run");
    return;
  }

  // Generate run ID and dotted order for this tool
  const { randomUUID } = await import("crypto");
  const toolRunId = randomUUID();
  const startTime = Date.now();

  // Generate proper dotted order segment
  const toolDottedOrderSegment = generateDottedOrderSegment(startTime, toolRunId, 1);
  const toolDottedOrder = `${parentDottedOrder}.${toolDottedOrderSegment}`;

  // For Task/Agent tools, prefer the subagent_type from tool_input (e.g., "general-purpose"),
  // then fall back to tool_name.
  const subagentType = input.tool_input?.subagent_type as string | undefined;
  const toolName = subagentType || input.tool_name;

  // Create the tool run using Client API
  await client.createRun({
    id: toolRunId,
    name: toolName,
    run_type: "tool",
    inputs: { input: input.tool_input },
    project_name: config.project,
    start_time: startTime,
    parent_run_id: parentRunId,
    trace_id: traceId,
    dotted_order: toolDottedOrder,
    extra: {
      metadata: {
        thread_id: input.session_id,
        tool_name: input.tool_name,
        ...(input.agent_type ? { agent_type: input.agent_type, agent_id: input.agent_id } : {}),
      },
    },
  });

  // Update the run with outputs (tool execution already completed)
  await client.updateRun(toolRunId, {
    trace_id: traceId,
    dotted_order: toolDottedOrder,
    end_time: Date.now(),
    outputs: { output: input.tool_response },
  });

  debug(`Created tool run ${toolRunId} for ${input.tool_name}`);

  // If this is an Agent tool, store the mapping for subagent linking
  const agentId = (input.tool_response as { agentId?: string }).agentId;
  if (agentId) {
    debug(`Agent tool detected, storing mapping ${agentId} -> ${toolRunId}`);
    const taskRunMap = { 
      [agentId]: { 
        run_id: toolRunId, 
        dotted_order: toolDottedOrder 
      } 
    };
    const updatedState = updateSessionState(
      state,
      input.session_id,
      sessionState.last_line,
      sessionState.turn_count,
      taskRunMap,
    );
    saveState(config.stateFilePath, updatedState);
  }

  const duration = ((Date.now() - hookStartTime) / 1000).toFixed(1);
  debug(`PostToolUse hook completed in ${duration}s`);
}

function readStdin(): Promise<PostToolUseHookInput> {
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
    error(`PostToolUse hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(1);
});

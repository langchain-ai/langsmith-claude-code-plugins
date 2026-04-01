#!/usr/bin/env node
/**
 * SubagentStop hook entry point.
 *
 * Invoked when a Claude Code subagent finishes. Does NOT trace
 * anything itself — instead it queues the subagent info into
 * `pending_subagent_traces` in the shared state file.
 *
 * The Stop hook (which fires after the main agent's turn is done)
 * picks these up and traces them. By that time PostToolUse has
 * definitely written the Agent tool's run_id and dotted_order to
 * `task_run_map`, so there's no race condition.
 */

import { loadConfig } from "../config.js";
import { initLogger, debug, error } from "../logger.js";
import { loadState, saveState, getSessionState } from "../state.js";
import type { SubagentStopHookInput } from "../types.js";

async function main(): Promise<void> {
  const input: SubagentStopHookInput = await readStdin();

  const config = loadConfig();
  initLogger(config.debug);

  debug(`SubagentStop hook: agent_id=${input.agent_id}, type=${input.agent_type}`);

  if (!process.env.TRACE_TO_LANGSMITH || process.env.TRACE_TO_LANGSMITH.toLowerCase() !== "true") {
    return;
  }

  if (!config.apiKey) {
    error("No API key set");
    return;
  }

  const agentTranscriptPath = input.agent_transcript_path?.replace(/^~/, process.env.HOME ?? "");

  if (!agentTranscriptPath) {
    debug("No agent_transcript_path provided, skipping");
    return;
  }

  // Queue subagent info for the Stop hook to process later.
  // This avoids the race condition with PostToolUse (both run async).
  const state = loadState(config.stateFilePath);
  const parentSessionState = getSessionState(state, input.session_id);

  const pendingTraces = parentSessionState.pending_subagent_traces || [];
  pendingTraces.push({
    agent_id: input.agent_id,
    agent_type: input.agent_type,
    agent_transcript_path: agentTranscriptPath,
    session_id: input.session_id,
  });

  saveState(config.stateFilePath, {
    ...state,
    [input.session_id]: {
      ...parentSessionState,
      pending_subagent_traces: pendingTraces,
    },
  });

  debug(`Queued subagent trace for ${input.agent_type} (${input.agent_id}) - will be processed by Stop hook`);
}

function readStdin(): Promise<SubagentStopHookInput> {
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
    error(`SubagentStop hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0);
});

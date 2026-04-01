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

import { debug, error } from "../logger.js";
import { loadState, saveState, getSessionState } from "../state.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import type { SubagentStopHookInput } from "../types.js";

async function main(): Promise<void> {
  const input: SubagentStopHookInput = await readStdin();

  const config = initHook();
  if (!config) return;

  debug(`SubagentStop hook: agent_id=${input.agent_id}, type=${input.agent_type}`);

  const agentTranscriptPath = expandHome(input.agent_transcript_path);

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

  debug(
    `Queued subagent trace for ${input.agent_type} (${input.agent_id}) - will be processed by Stop hook`,
  );
}

main().catch((err) => {
  try {
    error(`SubagentStop hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0);
});

#!/usr/bin/env node
/**
 * UserPromptSubmit hook entry point.
 *
 * Invoked when a user submits a prompt, before Claude processes it.
 * Creates the initial RunTree for the turn and stores the run ID
 * for the Stop hook to use as the parent for all LLM and tool runs.
 */

import { randomUUID } from "node:crypto";
import { debug, error } from "../logger.js";
import { initClient, generateDottedOrderSegment } from "../langsmith.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { initHook } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";

interface UserPromptSubmitHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  hook_event_name: "UserPromptSubmit";
  prompt: string;
  agent_id?: string;
  agent_type?: string;
}

async function main(): Promise<void> {
  const hookStartTime = Date.now();
  const input: UserPromptSubmitHookInput = await readStdin();

  const config = initHook();
  if (!config) return;

  debug(`UserPromptSubmit hook started, session=${input.session_id}`);

  // Subagent turns are traced entirely by the Stop hook from the transcript.
  // Skip here to avoid orphan runs with incorrect nesting.
  if (input.agent_id || input.agent_type) {
    debug("Skipping UserPromptSubmit for subagent — Stop hook handles tracing");
    return;
  }

  const client = initClient(config.apiKey, config.apiBaseUrl);

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);
  const turnNum = sessionState.turn_count + 1;

  const runId = randomUUID();
  const startTime = Date.now();
  const dottedOrder = generateDottedOrderSegment(startTime, runId, 1);

  await client.createRun({
    id: runId,
    name: "Claude Code Turn",
    run_type: "chain",
    inputs: { messages: [{ role: "user", content: input.prompt }] },
    project_name: config.project,
    start_time: startTime,
    trace_id: runId,
    dotted_order: dottedOrder,
    extra: {
      metadata: {
        thread_id: input.session_id,
        ls_integration: "claude-code",
        turn_number: turnNum,
        ls_agent_type: "agent",
      },
    },
  });

  debug(`Created initial run ${runId} for turn ${turnNum}`);

  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        current_turn_run_id: runId,
        current_trace_id: runId,
        current_dotted_order: dottedOrder,
      },
    };
  });

  const duration = ((Date.now() - hookStartTime) / 1000).toFixed(1);
  debug(`UserPromptSubmit hook completed in ${duration}s`);
}

main().catch((err) => {
  try {
    error(`UserPromptSubmit hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0); // Always exit 0 so Claude Code isn't affected.
});

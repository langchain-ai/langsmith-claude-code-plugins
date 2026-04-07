#!/usr/bin/env node
/**
 * UserPromptSubmit hook entry point.
 *
 * Invoked when a user submits a prompt, before Claude processes it.
 * Creates the initial RunTree for the turn and stores the run ID
 * for the Stop hook to use as the parent for all LLM and tool runs.
 *
 * Also handles interrupted turns: if Stop never fired for the previous turn
 * (user pressed Escape), traces the interrupted turn's content from the
 * transcript before closing it with "User interrupt".
 */

import { RunTree, uuid7 } from "langsmith";
import { debug, error } from "../logger.js";
import {
  initTracing,
  closeInterruptedTurn,
  generateDottedOrderSegment,
  parseDottedOrder,
} from "../langsmith.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { getTranscriptEndLine } from "../transcript.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import { USER_PROMPT_TURN_NAME } from "../constants.js";

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

  const client = initTracing(config.apiKey, config.apiBaseUrl, config.replicas);

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  // If state is fresh (last_line === -1) but the transcript already has content,
  // skip to the end. This avoids replaying thousands of old messages (which would
  // be rejected by LangSmith's ±24h timestamp window) when state is lost due to
  // file deletion, corruption, or session pruning.
  let interruptedLastLine = sessionState.last_line;
  if (interruptedLastLine === -1 && input.transcript_path) {
    const transcriptPath = expandHome(input.transcript_path)!;
    const endLine = getTranscriptEndLine(transcriptPath);
    if (endLine > 0) {
      debug(`Fresh state but transcript has ${endLine + 1} lines — skipping to end`);
      interruptedLastLine = endLine;
    }
  }

  // If there's a stale turn run, the previous turn was interrupted (Stop never fired).
  // Trace the interrupted turn's content then close the parent run.
  let interruptedTurnsTraced = 0;

  if (sessionState.current_turn_run_id) {
    debug(`Tracing interrupted turn ${sessionState.current_turn_run_id}`);
    try {
      const { lastLine, turnsTraced } = await closeInterruptedTurn({
        sessionId: input.session_id,
        sessionState,
        transcriptPath: expandHome(input.transcript_path),
        project: config.project,
        stateFilePath: config.stateFilePath,
      });
      interruptedLastLine = lastLine;
      interruptedTurnsTraced = turnsTraced;
    } catch (err) {
      error(`Failed to close interrupted turn: ${err}`);
    }
  }

  const turnNum = sessionState.turn_count + interruptedTurnsTraced + 1;

  const runId = uuid7();
  const startTime = new Date().toISOString();
  const segment = generateDottedOrderSegment(startTime, runId);

  // If a parent dotted_order is provided, nest this turn under the existing run.
  let traceId: string;
  let parentRunId: string | undefined;
  let dottedOrder: string;
  if (config.parentDottedOrder) {
    const parsed = parseDottedOrder(config.parentDottedOrder);
    traceId = parsed.traceId;
    parentRunId = parsed.runId;
    dottedOrder = `${config.parentDottedOrder}.${segment}`;
    debug(`Nesting under parent run ${parentRunId} (trace ${traceId})`);
  } else {
    traceId = runId;
    parentRunId = undefined;
    dottedOrder = segment;
  }

  const runTree = new RunTree({
    client,
    replicas: config.replicas,
    id: runId,
    name: USER_PROMPT_TURN_NAME,
    run_type: "chain",
    inputs: { messages: [{ role: "user", content: input.prompt }] },
    project_name: config.project,
    start_time: startTime,
    trace_id: traceId,
    dotted_order: dottedOrder,
    ...(parentRunId ? { parent_run_id: parentRunId } : {}),
  });

  await runTree.postRun();

  debug(`Created initial run ${runId} for turn ${turnNum}`);

  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        current_turn_run_id: runId,
        current_trace_id: traceId,
        current_dotted_order: dottedOrder,
        current_parent_run_id: parentRunId,
        current_turn_number: turnNum,
        current_turn_start: startTime,
        // Advance past the interrupted turn's messages so Stop doesn't re-trace them
        last_line: interruptedLastLine,
        turn_count: ss.turn_count + interruptedTurnsTraced,
        // Clear interrupted turn's stale data
        task_run_map: {},
        traced_tool_use_ids: [],
        tool_start_times: {},
        pending_subagent_traces: [],
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

#!/usr/bin/env node
/**
 * SessionEnd hook entry point.
 *
 * Fires when a Claude Code session ends (user exits, /clear, /resume, etc.).
 * If the session was interrupted (Stop never fired for the last turn), closes
 * the open turn run so traces aren't left hanging in LangSmith.
 *
 * Note: default timeout is 1.5s. Set CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS
 * to a higher value if needed.
 */

import { debug, error } from "../logger.js";
import {
  initTracing,
  closeInterruptedTurn,
  closeAgentToolRun,
  completeTurnRun,
  turnIdentityFromOpenTurn,
} from "../langsmith.js";
import { loadState, atomicUpdateState, getSessionState } from "../state.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import { readRuntimeVersion } from "../transcript.js";

interface SessionEndHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: "SessionEnd";
  reason: string;
}

async function main(): Promise<void> {
  const input: SessionEndHookInput = await readStdin();

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`SessionEnd hook: session=${input.session_id}, reason=${input.reason}`);

  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  const openTurns = sessionState.open_turns ?? {};
  // Agent tool runs left open awaiting a task-notification that never arrived:
  // task_run_map entries marked subagent_done (traced + posted) but not yet
  // finalized (finalize deletes the entry).
  const openAgentRuns = Object.entries(sessionState.task_run_map ?? {}).filter(
    ([, e]) => e.subagent_done,
  );
  const hasOpenTurns = Object.keys(openTurns).length > 0;
  const hasOpenAgentRuns = openAgentRuns.length > 0;

  if (!sessionState.current_turn_run_id && !hasOpenTurns && !hasOpenAgentRuns) {
    debug("No open turn run — nothing to close");
    return;
  }

  initTracing(config.apiKey, config.apiBaseUrl, config.replicas);

  const expandedTranscript = expandHome(input.transcript_path);
  const runtimeVersion =
    sessionState.runtime_version ??
    (expandedTranscript ? readRuntimeVersion(expandedTranscript) : undefined);

  let lastLine = sessionState.last_line;
  let turnsTraced = 0;

  // Close the active turn if it was interrupted (Stop never fired for it).
  if (sessionState.current_turn_run_id) {
    debug(`Closing interrupted turn run ${sessionState.current_turn_run_id} on session end`);
    try {
      const res = await closeInterruptedTurn({
        sessionId: input.session_id,
        sessionState,
        transcriptPath: expandedTranscript,
        project: config.project,
        stateFilePath: config.stateFilePath,
        customMetadata: config.customMetadata,
        runtimeVersion,
        approvalPolicy: sessionState.approval_policy,
      });
      lastLine = res.lastLine;
      turnsTraced = res.turnsTraced;
    } catch (err) {
      error(`Failed to close interrupted turn on session end: ${err}`);
    }
  }

  // Close any Agent tool runs left open for async subagents whose task-notification
  // turn never arrived (agent aborted / session ended first). Close these (children)
  // before their launching turns (parents) below.
  for (const [agentId, taskRunInfo] of openAgentRuns) {
    try {
      await closeAgentToolRun({
        sessionId: input.session_id,
        agentId,
        agentType: taskRunInfo.agent_type ?? "",
        taskRunInfo,
        project: config.project,
        customMetadata: config.customMetadata,
        runtimeVersion,
      });
      debug(`Closed open Agent tool run ${agentId} on session end`);
    } catch (err) {
      error(`Failed to close Agent tool run ${agentId} on session end: ${err}`);
    }
  }

  // Close any deferred turns whose background subagents never finished before the
  // session ended, so their root runs aren't left hanging in LangSmith.
  //
  // A deferred turn that has stop_seen=true already produced its main response
  // (Stop ran and stashed last_assistant_message); only its background subagents
  // were still running. Complete it with its real outputs — it succeeded, it is
  // NOT an error. Only a turn whose Stop never fired (stop_seen=false, e.g. the
  // turn was interrupted before completing) is closed with an error.
  for (const [turnRunId, entry] of Object.entries(openTurns)) {
    if (turnRunId === sessionState.current_turn_run_id) continue; // closed above
    try {
      if (entry.stop_seen) {
        await completeTurnRun({
          ...turnIdentityFromOpenTurn(entry, {
            sessionId: input.session_id,
            project: config.project,
            customMetadata: config.customMetadata,
          }),
          lastAssistantMessage: entry.last_assistant_message,
        });
        debug(`Completed deferred turn ${turnRunId} on session end`);
      } else {
        await closeInterruptedTurn({
          sessionId: input.session_id,
          sessionState,
          transcriptPath: expandedTranscript,
          project: config.project,
          stateFilePath: config.stateFilePath,
          customMetadata: config.customMetadata,
          runtimeVersion,
          turn: entry,
          error: "Session ended before turn completed",
        });
        debug(`Closed interrupted deferred turn ${turnRunId} on session end`);
      }
    } catch (err) {
      error(`Failed to close deferred turn ${turnRunId} on session end: ${err}`);
    }
  }

  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        last_line: lastLine,
        turn_count: ss.turn_count + turnsTraced,
        current_turn_run_id: undefined,
        current_trace_id: undefined,
        current_dotted_order: undefined,
        current_parent_run_id: undefined,
        task_run_map: {},
        traced_tool_use_ids: [],
        tool_start_times: {},
        pending_subagent_traces: [],
        open_turns: {},
        current_notification_agent_id: undefined,
        notification_done_agents: [],
      },
    };
  });

  debug(`Session end cleanup complete (reason=${input.reason})`);
}

main().catch((err) => {
  try {
    error(`SessionEnd hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0);
});

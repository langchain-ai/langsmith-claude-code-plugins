/**
 * Finalize the trace chain for a finished task-notification turn.
 *
 * When an async (background) subagent finishes, its Agent tool run is left open
 * (so the resulting task-notification turn can nest inside it within time
 * bounds) and its launching turn's root run is left open too. Once that
 * notification turn completes, this routine closes — bottom-up, each exactly
 * once — the Agent tool run, then drains the agent from its launching turn and
 * completes that turn's root run if it was the last in-flight agent.
 *
 * If the launching turn is itself a task-notification turn (a notification turn
 * that spawned its own background subagent), it loops up the chain.
 */

import {
  closeAgentToolRun,
  completeTurnRun,
  flushPendingTraces,
  turnIdentityFromOpenTurn,
} from "./langsmith.js";
import { atomicUpdateState, getSessionState, loadState } from "./state.js";
import * as logger from "./logger.js";
import type { OpenTurn } from "./types.js";

export async function finalizeNotificationChain(opts: {
  stateFilePath: string;
  sessionId: string;
  project: string;
  customMetadata?: Record<string, unknown>;
  runtimeVersion?: string;
  /** The agent whose notification turn just completed. */
  agentId: string;
}): Promise<void> {
  const { stateFilePath, sessionId, project, customMetadata, runtimeVersion } = opts;

  let agentId: string | undefined = opts.agentId;
  while (agentId) {
    const ss = getSessionState(loadState(stateFilePath), sessionId);
    const taskRunInfo = ss.task_run_map?.[agentId];
    if (!taskRunInfo) {
      logger.debug(`finalizeNotificationChain: no task run for ${agentId}, stopping`);
      break;
    }

    const launchingTurnId = (taskRunInfo.deferred as Record<string, unknown> | undefined)
      ?.parent_run_id as string | undefined;
    const agentType = taskRunInfo.agent_type ?? "";

    // 1) Close the (open) Agent tool run for this agent.
    try {
      await closeAgentToolRun({
        sessionId,
        agentId,
        agentType,
        taskRunInfo,
        project,
        customMetadata,
        runtimeVersion,
        turnNumber: launchingTurnId ? ss.open_turns?.[launchingTurnId]?.turn_number : undefined,
      });
    } catch (err) {
      logger.error(`Failed to close Agent tool run for ${agentId}: ${err}`);
    }

    // 2) Atomically drain the agent from its launching turn + the open-run set,
    //    and drop its task_run_map entry. Decide whether the launching turn is
    //    now fully drained (so we complete it) and whether it is itself a
    //    notification turn (so we continue up the chain).
    let toComplete: OpenTurn | undefined;
    let nextAgentId: string | undefined;
    const drainedAgentId = agentId;
    await atomicUpdateState(stateFilePath, (s) => {
      const sess = getSessionState(s, sessionId);
      const openTurns = { ...sess.open_turns };
      const taskRunMap = { ...sess.task_run_map };
      delete taskRunMap[drainedAgentId];

      const entry = launchingTurnId ? openTurns[launchingTurnId] : undefined;
      if (entry) {
        const remaining = entry.agent_ids.filter((id) => id !== drainedAgentId);
        if (remaining.length === 0 && entry.stop_seen) {
          // Last subagent drained AND the launching turn's Stop has already run
          // (stop_seen) — it stashed the real last_assistant_message, so complete it.
          toComplete = entry;
          nextAgentId = entry.notification_for_agent_id;
          if (launchingTurnId) delete openTurns[launchingTurnId];
        } else {
          // Either more subagents pending, or Stop hasn't finished the launching
          // turn yet (stop_seen=false — e.g. it's still streaming, or was
          // interrupted). Keep the (possibly emptied) entry rather than completing
          // it blank here; whichever of Stop / UserPromptSubmit / SessionEnd handles
          // that turn will close it with its real outputs (or as interrupted).
          openTurns[launchingTurnId!] = { ...entry, agent_ids: remaining };
        }
      }

      return {
        ...s,
        [sessionId]: {
          ...sess,
          open_turns: openTurns,
          task_run_map: taskRunMap,
        },
      };
    });

    // 3) Complete the launching turn's root run if it fully drained.
    if (toComplete) {
      try {
        await completeTurnRun({
          ...turnIdentityFromOpenTurn(toComplete, { sessionId, project, customMetadata }),
          lastAssistantMessage: toComplete.last_assistant_message,
        });
        logger.debug(`Completed launching turn ${toComplete.run_id} after notification chain`);
      } catch (err) {
        logger.error(`Failed to complete launching turn ${toComplete.run_id}: ${err}`);
      }
    }

    // Continue up the chain if the launching turn was itself a notification turn.
    agentId = nextAgentId;
  }

  // Flush our own posted runs before returning — not every caller flushes after
  // us (e.g. UserPromptSubmit's superseded-notification path), and a hook process
  // can exit before LangSmith's batch timer fires, dropping the runs. A redundant
  // flush in callers that do flush (Stop, SubagentStop) is a harmless no-op.
  await flushPendingTraces();
}

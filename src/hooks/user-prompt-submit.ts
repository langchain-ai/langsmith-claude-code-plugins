/**
 * UserPromptSubmit hook handler.
 *
 * Invoked when a user submits a prompt, before Claude processes it.
 * Creates the initial RunTree for the turn and stores the run ID
 * for the Stop hook to use as the parent for all LLM and tool runs.
 *
 * Also handles interrupted turns: if Stop never fired for the previous turn
 * (user pressed Escape), traces the interrupted turn's content from the
 * transcript before closing it with "User interrupt".
 */

import { uuid7FromTime } from "langsmith";
import { debug, error } from "../logger.js";
import {
  initTracing,
  closeInterruptedTurn,
  completeTurnRun,
  generateDottedOrderSegment,
  parseDottedOrder,
  turnIdentityFromOpenTurn,
} from "../langsmith.js";
import { finalizeNotificationChain } from "../finalize.js";
import { settledFromTurn } from "../reconcile.js";
import {
  loadState,
  atomicUpdateState,
  getSessionState,
  advanceToolTracingProgress,
} from "../state.js";
import { getTranscriptEndLine, readRuntimeVersion } from "../transcript.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { isPayloadForHook } from "../utils/harness.js";
import { readStdin } from "../utils/stdin.js";
import { startQueueFlusher } from "../utils/detach.js";
import { queueOrigin } from "../queue.js";
import { recordRun, recordTurnClosed, turnRecordPath } from "../turn-record.js";
import { CLAUDE_CODE_INTEGRATION, USER_PROMPT_TURN_NAME } from "../constants.js";
import { codingAgentMetadata, codingAgentMetadataOptions } from "../metadata.js";
import { createRunTree } from "../privacy.js";
import { loadConfig } from "../config.js";
import {
  captureClaudeRun,
  captureClaudeRunWithReconstruction,
  createClaudeTracingSession,
  sharedClaudeChildRunIds,
} from "../tracing-engine.js";
import type { ClaudeSharedRunCapture } from "../models/tracing-engine.js";
import { describeThreadLinks } from "../thread-link.js";
import {
  parseTracingCommand,
  setThreadTracingMode,
  getThreadTracingMode,
} from "../tracing-policy.js";

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

/**
 * The task-notification <status> that means the subagent was forcibly stopped
 * (so SubagentStop never fires and we must finalize from the notification turn,
 * marking the agent interrupted). We match only this known value: an unknown/new
 * status falls back to being treated as a normal completion — we'd rather show a
 * killed subagent as completed than mislabel a successful one as interrupted if
 * Claude Code changes its status vocabulary. Matched case-insensitively.
 */
const KILLED_NOTIFICATION_STATUS = "killed";

export async function main(): Promise<void> {
  const hookStartTime = Date.now();
  const input: UserPromptSubmitHookInput = await readStdin();
  if (!isPayloadForHook(input, "UserPromptSubmit")) return;

  // Local commands must be handled before the master switch, credentials, or
  // any tracing/turn-state work. Even failures consume the prompt, not the model.
  const command = parseTracingCommand(input.prompt);
  if (command) {
    let reason: string;
    try {
      const commandConfig = loadConfig({ cwd: input.cwd });
      if (command === "trace") {
        reason = await describeThreadLinks(commandConfig, input.session_id);
      } else {
        const mode = command === "mute" ? "metadata" : "full";
        const result = await setThreadTracingMode(
          commandConfig.stateFilePath,
          input.session_id,
          mode,
        );
        reason = `Thread tracing ${command === "mute" ? "muted (metadata-only)" : "unmuted (full content)"}. Preference saved for the next turn; the current turn is unchanged.`;
        // Filesystem warnings stay in this local, blocked response, never tracing.
        if (result?.warning) reason += ` Warning: ${result.warning}.`;
        if (!commandConfig.enabled) {
          reason += " Master tracing is disabled; this preference does not enable it.";
        } else if (
          !commandConfig.apiKey &&
          (!commandConfig.replicas || commandConfig.replicas.length === 0)
        ) {
          reason += " Tracing remains inactive until credentials are configured.";
        }
      }
    } catch (err) {
      reason =
        command === "trace"
          ? `Could not run the trace command. Session ID: ${input.session_id}. No tracing settings were changed.`
          : `Could not ${command} thread tracing: ${err instanceof Error ? err.message : String(err)}. Tracing may still be enabled. Command blocked; no model turn was started.`;
    }
    try {
      console.log(JSON.stringify({ decision: "block", reason }));
    } catch (err) {
      error(`Could not write the ${command} command response: ${err}`);
    }
    return;
  }

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`UserPromptSubmit hook started, session=${input.session_id}`);

  // Subagent turns are traced entirely by the Stop hook from the transcript.
  // Skip here to avoid orphan runs with incorrect nesting.
  if (input.agent_id || input.agent_type) {
    debug("Skipping UserPromptSubmit for subagent — Stop hook handles tracing");
    return;
  }

  const client = initTracing(
    config.apiKey,
    config.apiBaseUrl,
    config.replicas,
    config.redact,
    config.redactExtraRules,
  );
  const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
  const captureSharedRun: ClaudeSharedRunCapture | undefined = engine
    ? (capture, nativeTurnRecordRunId) =>
        captureClaudeRunWithReconstruction(engine, capture, nativeTurnRecordRunId)
    : undefined;
  const getSharedChildRunIds = engine
    ? (turnId: string, rootRunId: string, recorded?: readonly string[]) =>
        sharedClaudeChildRunIds(engine, turnId, rootRunId, recorded)
    : undefined;

  const state = loadState(config.stateFilePath);
  // Sweep once at the start, for folders other sessions left behind long enough ago to be safe.
  if (state[input.session_id] === undefined)
    startQueueFlusher(input.cwd, input.session_id, config.project);
  const sessionState = getSessionState(state, input.session_id);
  const turnMode = getThreadTracingMode(
    config.stateFilePath,
    input.session_id,
    config.defaultMuted,
  );

  // CLI version (ls_agent_runtime_version); best-effort, Stop backfills if empty.
  const expandedTranscript = expandHome(input.transcript_path);
  const runtimeVersion =
    (expandedTranscript ? readRuntimeVersion(expandedTranscript) : undefined) ??
    sessionState.runtime_version;
  const approvalPolicy = input.permission_mode;

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
  let consumedToolUseIds: string[] = [];

  if (sessionState.current_turn_run_id) {
    // A stale current_turn_run_id means the previous turn's Stop never fired. The
    // usual cause is a user interrupt — but it also happens when several background
    // agents finish at once: their task-notifications arrive faster than the agent
    // responds, so a notification turn is superseded by the next before its Stop.
    // That's not a user interrupt: close it with an accurate status and, since its
    // launching turn is still deferred, finalize that chain so it doesn't hang.
    const supersededNotificationAgentId = sessionState.current_notification_agent_id;
    debug(
      `Closing stale turn ${sessionState.current_turn_run_id}` +
        (supersededNotificationAgentId ? " (superseded task-notification)" : " (interrupted)"),
    );
    try {
      const {
        lastLine,
        turnsTraced,
        consumedToolUseIds: consumed,
      } = await closeInterruptedTurn({
        defaultMuted: config.defaultMuted,
        sessionId: input.session_id,
        sessionState,
        transcriptPath: expandHome(input.transcript_path),
        project: config.project,
        stateFilePath: config.stateFilePath,
        customMetadata: config.customMetadata,
        runtimeVersion,
        approvalPolicy,
        record: {
          path: turnRecordPath(
            config.stateFilePath,
            input.session_id,
            sessionState.current_turn_run_id,
          ),
          origin: queueOrigin(config),
          runId: sessionState.current_turn_run_id,
        },
        error: supersededNotificationAgentId
          ? "Superseded by a newer task-notification"
          : "User interrupt",
        captureSharedRun,
        getSharedChildRunIds,
      });
      interruptedLastLine = lastLine;
      interruptedTurnsTraced = turnsTraced;
      consumedToolUseIds = consumed ?? [];
      if (supersededNotificationAgentId) {
        await finalizeNotificationChain({
          defaultMuted: config.defaultMuted,
          stateFilePath: config.stateFilePath,
          sessionId: input.session_id,
          project: config.project,
          customMetadata: config.customMetadata,
          runtimeVersion,
          agentId: supersededNotificationAgentId,
          // Carry the killed marker through this path too, in case the killed
          // subagent's notification turn was itself superseded before its Stop.
          interrupted: sessionState.current_notification_interrupted,
          captureSharedRun,
          getSharedChildRunIds,
        });
      }
    } catch (err) {
      error(`Failed to close interrupted turn: ${err}`);
    }
  }

  for (const [turnRunId, turn] of Object.entries(sessionState.open_turns ?? {})) {
    if (!turn.retry_closure) continue;
    try {
      const sharedChildRunIds = getSharedChildRunIds
        ? await getSharedChildRunIds(turnRunId, turnRunId)
        : [];
      const closedRun = await completeTurnRun({
        ...turnIdentityFromOpenTurn(turn, {
          sessionId: input.session_id,
          project: config.project,
          customMetadata: config.customMetadata,
        }),
        tracing: turn.tracing ?? "full",
        lastAssistantMessage: turn.last_assistant_message,
        leaveOpen: turn.leave_open,
        captureSharedRun,
        sharedChildRunIds,
      });
      const recordPath = turnRecordPath(config.stateFilePath, input.session_id, turnRunId);
      recordRun({
        path: recordPath,
        run: closedRun,
        tracing: turn.tracing ?? "full",
        origin: queueOrigin(config),
        shared: true,
        root: true,
        ...(turn.leave_open ? { closesAt: new Date().toISOString() } : {}),
        routing: { cwd: input.cwd },
      });
      recordTurnClosed(recordPath, turn.turn_id);
      await atomicUpdateState(config.stateFilePath, (s) => {
        const ss = getSessionState(s, input.session_id);
        const openTurns = { ...ss.open_turns };
        if (openTurns[turnRunId]?.retry_closure) delete openTurns[turnRunId];
        return { ...s, [input.session_id]: { ...ss, open_turns: openTurns } };
      });
    } catch (err) {
      error(`Failed to retry shared Turn closure ${turnRunId}: ${err}`);
    }
  }

  const turnNum = sessionState.turn_count + interruptedTurnsTraced + 1;

  const startTime = new Date().toISOString();
  const runId = uuid7FromTime(startTime);
  const segment = generateDottedOrderSegment(startTime, runId);

  // Decide where this turn nests.
  let traceId: string;
  let parentRunId: string | undefined;
  let dottedOrder: string;

  // A task-notification turn is the main agent reacting to a finished background
  // subagent. Detect + correlate in one step by matching the prompt against the
  // agent_ids in task_run_map. We match by the launch-time task_run_map entry
  // (recorded by PostToolUse), not by whether SubagentStop has finished: a
  // background agent finishing while the main agent is idle can fire this
  // notification's UserPromptSubmit *before* SubagentStop, so a finished marker may
  // not be set yet — but the launch-time entry always is. A notification
  // necessarily references its agent by id, so an id substring match is robust to
  // message-format changes; a 17-char hex id colliding with human text is
  // astronomically unlikely. (Reading origin.kind from the transcript doesn't work
  // here either — the prompt's line often isn't flushed to disk when this fires.)
  // A match nests the turn under that subagent's Agent tool run instead of
  // cluttering the top-level turn sequence.
  const notifAgentId = Object.keys(sessionState.task_run_map ?? {}).find((id) =>
    input.prompt.includes(id),
  );
  const agentToolRun = notifAgentId ? sessionState.task_run_map?.[notifAgentId] : undefined;
  const notificationAgentId = agentToolRun ? notifAgentId : undefined;
  // A cancelled subagent's notification reports a terminal <status> like "killed".
  // There's no structured field for it, so read the one tag from the body — only
  // to distinguish a forcibly-stopped subagent from a normal one, not to
  // detect/correlate. When killed, SubagentStop never fires, so Stop must finalize
  // without waiting on it. Only known cancellation statuses count (allowlist);
  // anything else (including a new/unknown status) is treated as a normal turn.
  const notificationStatus = notificationAgentId
    ? /<status>([^<]+)<\/status>/.exec(input.prompt)?.[1]
    : undefined;
  const notificationInterrupted = notificationStatus?.toLowerCase() === KILLED_NOTIFICATION_STATUS;

  if (agentToolRun) {
    traceId = parseDottedOrder(agentToolRun.dotted_order).traceId;
    parentRunId = agentToolRun.run_id;
    dottedOrder = `${agentToolRun.dotted_order}.${segment}`;
    debug(
      `Task-notification for agent ${notifAgentId}, nesting turn under Agent run ${parentRunId}`,
    );
  } else if (config.parentDottedOrder) {
    // If a parent dotted_order is provided, nest this turn under the existing run.
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

  const launchingTurnId = (agentToolRun?.deferred as Record<string, unknown> | undefined)
    ?.parent_run_id as string | undefined;
  const inherited = settledFromTurn({
    base: config.customMetadata,
    stateFilePath: config.stateFilePath,
    sessionId: input.session_id,
    turnRunId: launchingTurnId,
  });

  const rootMetadata = {
    sessionId: input.session_id,
    runType: "root" as const,
    base: inherited,
    turnNumber: turnNum,
    runtimeVersion,
    approvalPolicy,
    agentType: "root" as const,
  };
  const turnRun = {
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
    extra: {
      metadata: codingAgentMetadata(rootMetadata),
    },
  };

  const sharedRoot = engine
    ? await captureClaudeRun(engine, {
        turnId: runId,
        eventId: runId,
        submission: {
          operation: "post",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: turnMode,
          metadata: codingAgentMetadataOptions(rootMetadata),
          privacyContext: { status: "running" },
          run: {
            id: runId,
            name: USER_PROMPT_TURN_NAME,
            run_type: "chain",
            inputs: { messages: [{ role: "user", content: input.prompt }] },
            start_time: startTime,
            trace_id: traceId,
            dotted_order: dottedOrder,
            ...(parentRunId ? { parent_run_id: parentRunId } : {}),
          },
        },
        turnEvidence: { rootRunId: runId, childRunIds: [], closureState: "open" },
      })
    : false;
  if (!engine) await createRunTree(turnRun, turnMode).postRun();
  else if (!sharedRoot) {
    error(`Could not capture shared Turn run ${runId}`);
    return;
  }

  recordRun({
    path: turnRecordPath(config.stateFilePath, input.session_id, runId),
    run: turnRun,
    tracing: turnMode,
    origin: queueOrigin(config),
    root: true,
    shared: engine !== undefined,
    routing: { cwd: input.cwd },
  });

  debug(`Created initial run ${runId} for turn ${turnNum}`);

  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);

    // Preserve state for background subagents from prior turns that are still
    // running (they outlive their turn's Stop hook). We keep their Agent tool run
    // info in task_run_map so their traces still nest correctly, and keep their
    // turns in open_turns so the last SubagentStop can complete them. But we drop
    // the turn we just closed as interrupted above — it's already finalized, so a
    // late SubagentStop should still trace the subagent but not re-complete it.
    const inflightAgentIds = new Set(
      Object.values(ss.open_turns ?? {}).flatMap((t) => t.agent_ids),
    );
    const preservedTaskRunMap = Object.fromEntries(
      Object.entries(ss.task_run_map ?? {}).filter(([id]) => inflightAgentIds.has(id)),
    );
    const preservedOpenTurns = { ...ss.open_turns };
    if (sessionState.current_turn_run_id) {
      delete preservedOpenTurns[sessionState.current_turn_run_id];
    }

    return {
      ...s,
      [input.session_id]: {
        ...ss,
        current_turn_tracing: turnMode,
        current_turn_run_id: runId,
        current_trace_id: traceId,
        current_dotted_order: dottedOrder,
        current_parent_run_id: parentRunId,
        current_turn_number: turnNum,
        current_turn_start: startTime,
        // If this is a task-notification turn, record the agent it's for so Stop
        // closes that agent's tool run + launching turn once this turn completes.
        current_notification_agent_id: notificationAgentId,
        current_notification_interrupted: notificationInterrupted,
        // Persisted so the closing hooks can stamp them onto their runs.
        approval_policy: approvalPolicy,
        ...(runtimeVersion ? { runtime_version: runtimeVersion } : {}),
        // Advance past the interrupted turn's messages so Stop doesn't re-trace them
        last_line: interruptedLastLine,
        ...advanceToolTracingProgress(ss, consumedToolUseIds, "transcript"),
        turn_count: ss.turn_count + interruptedTurnsTraced,
        // Clear this turn's stale data, but keep still-running background subagents
        // and any Agent tool runs left open awaiting their task-notification.
        task_run_map: preservedTaskRunMap,
        traced_tool_use_ids: [],
        tool_start_times: {},
        pending_subagent_traces: [],
        open_turns: preservedOpenTurns,
        notification_done_agents: ss.notification_done_agents,
      },
    };
  });

  const duration = ((Date.now() - hookStartTime) / 1000).toFixed(1);
  debug(`UserPromptSubmit hook completed in ${duration}s`);
}

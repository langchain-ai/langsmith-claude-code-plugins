/**
 * Stop hook handler.
 *
 * Invoked by Claude Code when the main agent finishes responding.
 * Reads the transcript, identifies new messages since last run,
 * groups them into turns, and sends traces to LangSmith.
 */

import { resolveTurnTracingMode } from "../tracing-mode.js";
import {
  readTranscript,
  groupIntoTurns,
  readRuntimeVersion,
  completedToolUseIds,
  turnToolInputs,
} from "../transcript.js";
import { awaitsTheTurn, toolOrigin, turnScopedMetadata } from "../repo-attribution.js";
import { log, warn, debug, error } from "../logger.js";
import {
  loadState,
  atomicUpdateState,
  getSessionState,
  updateSessionState,
  pruneOldSessions,
  advanceToolTracingProgress,
} from "../state.js";
import {
  initTracing,
  traceTurn,
  tracePendingSubagents,
  completeTurnRun,
  flushPendingTraces,
} from "../langsmith.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { buildCodingAgentMetadata } from "@langchain/plugins-base/metadata";
import { isPayloadForHook } from "../utils/harness.js";
import { readStdin } from "../utils/stdin.js";
import { startQueueFlusher } from "../utils/detach.js";
import {
  readTurnRecord,
  recordRun,
  recordToolOrigin,
  recordTurnClosed,
  turnRecordPath,
} from "../turn-record.js";
import { queueOrigin } from "../queue.js";
import { pinnedRepositoryKeys } from "../config.js";
import type { Config } from "../config.js";
import { everyChildLanded, settledFromTurn, settledTurnMetadata } from "../reconcile.js";
import { finalizeNotificationChain } from "../finalize.js";
import { MUTED_TRACE_CONTENT } from "../privacy.js";
import {
  CLAUDE_CODE_INTEGRATION,
  CLAUDE_TURN_CLOSURE_EVENT_SUFFIX,
  CLAUDE_TURN_PROGRESS_EVENT_SUFFIX,
  PINNED_REPOSITORY_KEYS,
  USER_PROMPT_TURN_NAME,
} from "../constants.js";
import { codingAgentMetadata, codingAgentMetadataOptions } from "../metadata.js";
import {
  captureClaudeRun,
  captureClaudeRunWithReconstruction,
  createClaudeTracingSession,
  queueClaudeRunReconstruction,
  sharedClaudeChildRunIds,
} from "../tracing-engine.js";
import type { TaskRunEntry } from "../langsmith.js";
import type { SessionState, StopHookInput, TracingMode, Turn } from "../types.js";
import type { ClaudeSharedRunCapture } from "../models/tracing-engine.js";

function recordCompletedToolOrigins(
  path: string,
  origin: string,
  turn: Turn,
  config: Config,
  sessionId: string,
  sessionState: SessionState,
  tracing: TracingMode,
  cwd: string,
): string | undefined {
  const completed = new Set(completedToolUseIds([turn]));
  const pinnedKeys = Object.hasOwn(config.customMetadata ?? {}, PINNED_REPOSITORY_KEYS)
    ? [...pinnedRepositoryKeys(config.customMetadata)].sort()
    : undefined;
  let order = 0;
  for (const tool of turn.llmCalls.flatMap((call) => call.toolCalls)) {
    if (!completed.has(tool.tool_use.id)) {
      order++;
      continue;
    }
    const toolMode = resolveTurnTracingMode(
      config,
      sessionId,
      sessionState.tool_tracing_modes?.[tool.tool_use.id],
      tracing,
    );
    if (
      !recordToolOrigin(path, origin, toolMode, {
        toolUseId: tool.tool_use.id,
        toolName: tool.tool_use.name,
        order,
        origin: toolOrigin(tool.tool_use.input, cwd),
        ...(toolMode === "full" && pinnedKeys !== undefined
          ? { pinnedRepositoryKeys: pinnedKeys }
          : {}),
      })
    ) {
      warn(`Could not record the origin for tool ${tool.tool_use.id}`);
      return tool.tool_use.id;
    }
    order++;
  }
  return undefined;
}

export async function main(): Promise<void> {
  const startTime = Date.now();

  // Read hook input from stdin.
  const input: StopHookInput = await readStdin();
  if (!isPayloadForHook(input, "Stop")) return;

  const config = initHook(input.cwd);
  if (!config) return;

  debug(`Stop hook started, session=${input.session_id}`);

  // Hand the queued tool runs to a detached uploader, off this turn's response path.
  startQueueFlusher(input.cwd, input.session_id, config.project);

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

  initTracing(
    config.apiKey,
    config.apiBaseUrl,
    config.replicas,
    config.redact,
    config.redactExtraRules,
  );
  const engine = createClaudeTracingSession(config, input.cwd, input.session_id);

  // Load state and read new messages.
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);

  debug(`Last line: ${sessionState.last_line}, turn count: ${sessionState.turn_count}`);

  // CLI version + approval policy: prefer state, fall back to the transcript.
  const runtimeVersion = sessionState.runtime_version ?? readRuntimeVersion(transcriptPath);
  const approvalPolicy = sessionState.approval_policy ?? input.permission_mode;

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
        return {
          ...s,
          [input.session_id]: {
            ...ss,
            current_turn_run_id: undefined,
            current_turn_tracing: undefined,
          },
        };
      });
    }
    return;
  }

  log(`Found ${messages.length} new messages`);

  const notifiedBy = sessionState.current_notification_agent_id;
  const notifiedFrom = notifiedBy
    ? ((sessionState.task_run_map?.[notifiedBy]?.deferred as Record<string, unknown> | undefined)
        ?.parent_run_id as string | undefined)
    : undefined;
  const sessionMetadata = settledFromTurn({
    base: config.customMetadata,
    stateFilePath: config.stateFilePath,
    sessionId: input.session_id,
    turnRunId: notifiedFrom,
  });

  // Group into turns and trace each one.
  const turns = groupIntoTurns(messages);
  const currentTracing = resolveTurnTracingMode(
    config,
    input.session_id,
    sessionState.current_turn_tracing,
    sessionState.current_turn_run_id
      ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing
      : undefined,
  );

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
        // A request setting, so it carries over like the model. service_tier is a
        // response value with no reading for this call, so it stays absent.
        effort: lastLlm.effort,
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
  let allTaskRunMaps: Record<string, TaskRunEntry> = {};

  // The current_turn_run_id from state is for the LAST turn (the one that just completed)
  // Earlier turns (from interruptions) are traced standalone
  const currentRunId = sessionState.current_turn_run_id;
  const currentTraceId = sessionState.current_trace_id;
  const currentDottedOrder = sessionState.current_dotted_order;
  const currentParentRunId = sessionState.current_parent_run_id;
  const currentTurnRecord = currentRunId
    ? {
        path: turnRecordPath(config.stateFilePath, input.session_id, currentRunId),
        origin: queueOrigin(config),
        runId: currentRunId,
      }
    : undefined;
  const closingTurn = turns[turns.length - 1];
  const existingTurnRecord = currentTurnRecord ? readTurnRecord(currentTurnRecord.path) : undefined;
  const currentRecordIsValid =
    currentRunId !== undefined &&
    existingTurnRecord !== undefined &&
    existingTurnRecord?.origin === currentTurnRecord?.origin &&
    existingTurnRecord.root?.run_id === currentRunId;
  if (currentRunId !== undefined && currentTracing === "full" && !currentRecordIsValid) {
    error(`Cannot finish full-tracing turn ${currentRunId} without its native turn record`);
    return;
  }
  if (currentTurnRecord && existingTurnRecord && closingTurn && currentRecordIsValid) {
    const failedToolOriginId = recordCompletedToolOrigins(
      currentTurnRecord.path,
      currentTurnRecord.origin,
      closingTurn,
      config,
      input.session_id,
      sessionState,
      currentTracing,
      input.cwd,
    );
    if (failedToolOriginId)
      throw new Error(`Could not save tool ${failedToolOriginId}'s repository origin before Stop`);
  }
  const captureSharedRun: ClaudeSharedRunCapture | undefined = engine
    ? async (capture, nativeTurnRecordRunId) => {
        const source = capture.submission;
        const run = capture.submission.run;
        if (
          source.operation === "post" &&
          source.privacyMode === "full" &&
          run.run_type === "chain" &&
          run.name === USER_PROMPT_TURN_NAME &&
          run.id === capture.turnEvidence.rootRunId
        ) {
          const rootRunId = run.id;
          if (nativeTurnRecordRunId !== rootRunId) return false;
          if (currentRunId !== undefined) return false;
          const path = turnRecordPath(config.stateFilePath, input.session_id, rootRunId);
          const record = readTurnRecord(path);
          if (
            record &&
            (record.origin !== engine.recordOrigin || record.root?.run_id !== rootRunId)
          ) {
            return false;
          }
          if (!(await captureClaudeRun(engine, capture))) return false;
          if (
            !record &&
            !recordRun({
              path,
              run: {
                ...run,
                project_name: config.project,
                extra: { metadata: buildCodingAgentMetadata(source.metadata) },
              },
              tracing: "full",
              origin: engine.recordOrigin,
              shared: true,
              root: true,
              routing: { cwd: input.cwd },
            })
          ) {
            return false;
          }
          const failedToolOriginId = closingTurn
            ? recordCompletedToolOrigins(
                path,
                engine.recordOrigin,
                closingTurn,
                config,
                input.session_id,
                sessionState,
                currentTracing,
                input.cwd,
              )
            : undefined;
          if (failedToolOriginId) return false;
          return true;
        }
        if (
          source.operation === "post" &&
          source.privacyMode === "full" &&
          (run.run_type === "llm" || (run.run_type === "tool" && run.name === "Agent"))
        ) {
          return queueClaudeRunReconstruction(engine, capture, nativeTurnRecordRunId);
        }
        return captureClaudeRunWithReconstruction(engine, capture, nativeTurnRecordRunId);
      }
    : undefined;
  const getSharedChildRunIds = engine
    ? (turnId: string, rootRunId: string, recorded?: readonly string[]) =>
        sharedClaudeChildRunIds(engine, turnId, rootRunId, recorded)
    : undefined;

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
    const record = isLastTurn ? currentTurnRecord : undefined;

    try {
      const taskRunMap = await traceTurn({
        // Earlier transcript turns have no original snapshot; never backfill them as full.
        tracing: isLastTurn ? currentTracing : "metadata",
        toolTracingModes: sessionState.tool_tracing_modes ?? {},
        turn,
        sessionId: input.session_id,
        turnNum,
        project: config.project,
        customMetadata: sessionMetadata,
        hookCwd: input.cwd,
        runtimeVersion,
        approvalPolicy,

        parentRunId,
        existingTaskRunMap,
        tracedToolUseIds,
        traceId,
        parentDottedOrder: dottedOrder,
        record,
        captureSharedRun,
      });
      allTaskRunMaps = { ...allTaskRunMaps, ...taskRunMap };
      tracedTurns++;
    } catch (err) {
      error(`Failed to trace turn ${turnNum}: ${err}`);
      return;
    }
  }

  // Re-read state so we pick up writes from SubagentStop and PostToolUse
  // that may have landed while we were tracing the main transcript.
  const freshState = loadState(config.stateFilePath);
  const freshSession = getSessionState(freshState, input.session_id);

  // Merge task_run_map entries written by PostToolUse with those from traceTurn
  const mergedTaskRunMap = { ...freshSession.task_run_map, ...allTaskRunMaps };

  const lastTurnId = turns[turns.length - 1]?.promptId;
  const closingTurnTools = closingTurn ? turnToolInputs(closingTurn) : [];
  const turnMetadataBase = turnScopedMetadata(sessionMetadata, closingTurnTools, input.cwd);
  const recordedTurn = currentTurnRecord ? readTurnRecord(currentTurnRecord.path) : undefined;
  const turnMetadata =
    recordedTurn?.origin === currentTurnRecord?.origin
      ? settledTurnMetadata(turnMetadataBase, recordedTurn)
      : turnMetadataBase;

  // Process any pending subagent traces queued by SubagentStop. These are
  // synchronous subagents whose SubagentStop fired before PostToolUse recorded
  // the Agent tool run, so they were queued for us to trace here instead.
  const pendingSubagents = freshSession.pending_subagent_traces || [];
  const processedAgentIds = new Set<string>();
  if (pendingSubagents.length > 0) {
    debug(`Processing ${pendingSubagents.length} pending subagent trace(s)`);
    await tracePendingSubagents({
      tracing: currentTracing,
      sessionId: input.session_id,
      pendingSubagents,
      taskRunMap: mergedTaskRunMap,
      parentTraceId: freshSession.current_trace_id,
      project: config.project,
      customMetadata: turnMetadata,
      runtimeVersion,
      turnId: lastTurnId,
      turnNumber: sessionState.current_turn_number,
      record: currentTurnRecord,
      captureSharedRun,
    });
    for (const sa of pendingSubagents) processedAgentIds.add(sa.agent_id);
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

  // Decide — atomically, inside the lock — whether to complete this turn's run
  // now or defer to the last SubagentStop. PostToolUse records each launched Agent
  // under its turn in open_turns[turnRunId].agent_ids; SubagentStop (background) or
  // this hook (sync, above) drains them as they're traced. If any background
  // subagent for THIS turn is still in flight when we read inside the lock, we must
  // defer so the turn's duration spans that work — recording stop_seen + the real
  // outputs in the same write, so a SubagentStop finishing concurrently can't drain
  // the turn without also seeing it's safe to complete. We always clear
  // current_turn_run_id (the main loop is done with this turn); a deferred turn
  // lives on in open_turns until its subagents drain. Whoever removes the turn from
  // open_turns / clears current_turn_run_id under the lock owns the one completion.
  let completeNow = false;
  // If this turn is a task-notification turn, the async agent it reports on —
  // claimed atomically below so only the Stop that actually completes the turn
  // runs the finalize (guards against a concurrent/re-fired Stop doing it twice).
  let notificationToFinalize: string | undefined;
  // True when the notification this turn handled reported a killed/interrupted
  // subagent — finalize without waiting on SubagentStop (which won't fire).
  let notificationInterrupted = false;
  // Background subagents whose task-notification was consumed *within* this turn
  // (it's already in this turn's transcript) rather than arriving as a separate
  // turn afterward. Only these should be finalized here: a separate notification
  // turn still to come must be left alone so it can nest under the Agent run and
  // finalize itself — finalizing early would delete the task_run_map entry and
  // break that nesting. We detect "consumed within" by the agent id appearing in a
  // traced turn's user content (its notification references it); the launch itself
  // lives in tool_use/tool_result, not user content, so it doesn't false-match.
  const notifiedWithinTurn = new Set<string>();
  const knownAgentIds = Object.keys(sessionState.task_run_map ?? {});
  if (knownAgentIds.length > 0) {
    for (const t of turns) {
      const uc = typeof t.userContent === "string" ? t.userContent : "";
      for (const id of knownAgentIds) {
        if (uc.includes(id)) notifiedWithinTurn.add(id);
      }
    }
  }
  let doneAgentsToFinalize: string[] = [];
  await atomicUpdateState(config.stateFilePath, (latestState) => {
    const latestSession = getSessionState(latestState, input.session_id);
    const updatedState = updateSessionState(
      latestState,
      input.session_id,
      savedLastLine,
      latestSession.turn_count + tracedTurns,
      // Merge any late PostToolUse writes with our traced entries. allTaskRunMaps
      // wins on conflicts since it has the fully resolved data from traceTurn.
      { ...latestSession.task_run_map, ...allTaskRunMaps },
    );
    const s = updatedState[input.session_id];
    // Match cursor semantics: if any turn traced, all parsed messages are consumed,
    // including failed turns. If none traced, retain modes for the next replay.
    if (tracedTurns > 0) {
      Object.assign(
        s,
        advanceToolTracingProgress(latestSession, completedToolUseIds(turns), "transcript"),
      );
    }

    // Read the notification marker inside the lock so claiming + clearing it is
    // atomic with the completion decision.
    const notifAgentId = latestSession.current_notification_agent_id;
    const notifInterrupted = latestSession.current_notification_interrupted ?? false;

    // Drop the sync subagents we just traced from the queue.
    s.pending_subagent_traces = (latestSession.pending_subagent_traces ?? []).filter(
      (sa) => !processedAgentIds.has(sa.agent_id),
    );

    const openTurns = { ...latestSession.open_turns };
    const entry = currentRunId ? openTurns[currentRunId] : undefined;

    if (currentRunId && entry) {
      // This turn launched background subagents. Drain the ones we just traced and
      // mark the main turn finished, stashing the outputs only this hook carries.
      const remaining = entry.agent_ids.filter((id) => !processedAgentIds.has(id));
      // Of those, the ones that already finished AND whose notification was
      // consumed within this turn (no separate notification turn is coming) —
      // finalize them after the lock so the turn doesn't hang. Agents finished but
      // awaiting a *separate* notification turn are left for that turn to finalize.
      doneAgentsToFinalize = remaining.filter(
        (id) => latestSession.task_run_map?.[id]?.subagent_done && notifiedWithinTurn.has(id),
      );
      if (remaining.length > 0) {
        openTurns[currentRunId] = {
          ...entry,
          agent_ids: remaining,
          stop_seen: true,
          tracing: entry.tracing ?? currentTracing,
          last_assistant_message:
            (entry.tracing ?? currentTracing) === "metadata"
              ? MUTED_TRACE_CONTENT
              : input.last_assistant_message,
          turn_id: lastTurnId,
          // If this turn is itself a task-notification turn that spawned its own
          // background subagent, remember the agent to finalize once it drains.
          notification_for_agent_id: notifAgentId ?? entry.notification_for_agent_id,
        };
        debug(`${remaining.length} background subagent(s) in flight, deferring turn completion`);
      } else {
        // All drained already — complete now and drop the entry.
        completeNow = true;
        notificationToFinalize = notifAgentId;
        notificationInterrupted = notifInterrupted;
        delete openTurns[currentRunId];
      }
    } else {
      // No background subagents for this turn — normal inline completion.
      completeNow = Boolean(currentRunId);
      if (completeNow) {
        notificationToFinalize = notifAgentId;
        notificationInterrupted = notifInterrupted;
      }
    }
    s.open_turns = openTurns;

    // The main loop is done with this turn regardless; clear so the next
    // UserPromptSubmit doesn't mistake a deferred turn for an interrupted one.
    s.current_turn_run_id = undefined;
    s.current_turn_tracing = undefined;
    // Consume the notification markers; the finalize below (or the deferred
    // open_turns entry) now owns them.
    s.current_notification_agent_id = undefined;
    s.current_notification_interrupted = undefined;
    s.traced_tool_use_ids = [];
    s.tool_start_times = {};
    return pruneOldSessions(updatedState);
  });

  // Complete the Turn run created by UserPromptSubmit (unless deferred above).
  let turnRecord: string | undefined;
  let closedTurnRun: Record<string, unknown> | undefined;
  let leaveTurnOpen = false;
  let rootUsesSharedEngine = false;
  let turnClosureCaptured = false;
  if (completeNow && currentRunId) {
    debug(`Completing Turn run ${currentRunId}`);
    turnRecord = turnRecordPath(config.stateFilePath, input.session_id, currentRunId);
    const record = readTurnRecord(turnRecord);
    const everythingIn = !record || everyChildLanded(record);
    const settled = settledTurnMetadata(turnMetadata, record);
    const undeliveredChildren =
      record?.children.filter((child) => !record.delivered.has(child.run_id)) ?? [];
    const sharedSettlementOwnsPendingChildren =
      record?.root?.shared === true && undeliveredChildren.every((child) => child.shared);
    leaveTurnOpen = !everythingIn && awaitsTheTurn(settled) && !sharedSettlementOwnsPendingChildren;
    const rootCapture = engine
      ? await engine.captureStore.read({
          integration: CLAUDE_CODE_INTEGRATION,
          sessionId: input.session_id,
          turnId: currentRunId,
          eventId: currentRunId,
        })
      : undefined;
    const rootCaptureAvailable =
      engine !== undefined &&
      rootCapture?.runId === currentRunId &&
      rootCapture.destinationFingerprint === engine.accountFingerprint;
    rootUsesSharedEngine = rootCaptureAvailable || record?.root?.shared === true;
    try {
      if (rootUsesSharedEngine) {
        if (!engine || !rootCaptureAvailable) {
          error(
            `Could not capture shared Turn closure ${currentRunId}: root capture is unavailable`,
          );
        } else {
          const runMetadata = {
            sessionId: input.session_id,
            runType: "root" as const,
            base: settled,
            turnId: lastTurnId,
            turnNumber: sessionState.current_turn_number,
            runtimeVersion,
            approvalPolicy,
            agentType: "root" as const,
          };
          const run = {
            id: currentRunId,
            name: USER_PROMPT_TURN_NAME,
            run_type: "chain",
            ...(sessionState.current_turn_start === undefined
              ? {}
              : { start_time: sessionState.current_turn_start }),
            ...(currentTraceId === undefined ? {} : { trace_id: currentTraceId }),
            ...(currentDottedOrder === undefined ? {} : { dotted_order: currentDottedOrder }),
            ...(currentParentRunId === undefined ? {} : { parent_run_id: currentParentRunId }),
          };
          const outputs = {
            messages: [{ role: "assistant", content: input.last_assistant_message }],
          };
          const endTime = new Date().toISOString();
          const captured = await captureClaudeRun(engine, {
            turnId: currentRunId,
            eventId: `${currentRunId}${leaveTurnOpen ? CLAUDE_TURN_PROGRESS_EVENT_SUFFIX : CLAUDE_TURN_CLOSURE_EVENT_SUFFIX}`,
            submission: {
              operation: "patch",
              integration: CLAUDE_CODE_INTEGRATION,
              privacyMode: currentTracing,
              metadata: codingAgentMetadataOptions(runMetadata),
              privacyContext: { status: "completed" },
              run,
              patch: leaveTurnOpen
                ? { fields: ["outputs"], values: { outputs } }
                : { fields: ["outputs", "end_time"], values: { outputs, end_time: endTime } },
            },
            turnEvidence: {
              rootRunId: currentRunId,
              childRunIds: await sharedClaudeChildRunIds(
                engine,
                currentRunId,
                currentRunId,
                record?.origin === queueOrigin(config)
                  ? record.children.filter((child) => child.shared).map((child) => child.run_id)
                  : [],
              ),
              closureState: leaveTurnOpen ? "open" : "authoritative",
            },
          });
          if (!captured) {
            error(`Could not capture shared Turn closure ${currentRunId}`);
          } else {
            closedTurnRun = {
              ...run,
              project_name: config.project,
              ...(leaveTurnOpen ? {} : { end_time: endTime }),
              outputs,
              extra: { metadata: codingAgentMetadata(runMetadata) },
            };
            turnClosureCaptured = true;
          }
        }
      } else {
        closedTurnRun = await completeTurnRun({
          leaveOpen: leaveTurnOpen,
          tracing: currentTracing,
          sessionId: input.session_id,
          runId: currentRunId,
          traceId: currentTraceId,
          dottedOrder: currentDottedOrder,
          parentRunId: currentParentRunId,
          startTime: sessionState.current_turn_start,
          project: config.project,
          lastAssistantMessage: input.last_assistant_message,
          customMetadata: settled,
          turnId: lastTurnId,
          turnNumber: sessionState.current_turn_number,
          runtimeVersion,
          approvalPolicy,
        });
        turnClosureCaptured = closedTurnRun !== undefined;
      }
      if (closedTurnRun) debug(`Turn run ${currentRunId} completed`);
    } catch (err) {
      error(`Failed to complete turn run: ${err}`);
    }
  }

  // Finalize any background subagents that already finished within this turn (their
  // notification was consumed here, so no separate notification turn will finalize
  // them). finalizeNotificationChain closes each Agent tool run, drains it from the
  // (just-deferred) launching turn, and completes that turn once fully drained.
  for (const doneAgentId of doneAgentsToFinalize) {
    debug(`Finalizing subagent ${doneAgentId} that finished within its launching turn`);
    await finalizeNotificationChain({
      defaultMuted: config.defaultMuted,
      stateFilePath: config.stateFilePath,
      sessionId: input.session_id,
      project: config.project,
      customMetadata: turnMetadata,
      runtimeVersion,
      agentId: doneAgentId,
      captureSharedRun,
      getSharedChildRunIds,
    });
  }

  // If this was a task-notification turn that completed now, finalize the agent's
  // chain — but only once its subagent has actually been traced. SubagentStop and
  // this notification turn fire in non-deterministic order; we close the agent's
  // (open) tool run + launching turn from whichever runs LAST. Here (notification
  // side): if SubagentStop already traced the agent (task_run_map subagent_done is
  // set), we're last → finalize. Otherwise record this side as done and let
  // SubagentStop do it.
  if (notificationToFinalize && notificationInterrupted) {
    // The subagent was killed/interrupted: SubagentStop never fires for it, so
    // there's no join to wait on — finalize now, marking its tool run interrupted,
    // rather than leaving the launching turn open until SessionEnd.
    await finalizeNotificationChain({
      defaultMuted: config.defaultMuted,
      stateFilePath: config.stateFilePath,
      sessionId: input.session_id,
      project: config.project,
      customMetadata: sessionMetadata,
      runtimeVersion,
      agentId: notificationToFinalize,
      interrupted: true,
      captureSharedRun,
      getSharedChildRunIds,
    });
  } else if (notificationToFinalize) {
    let finalizeNow = false;
    await atomicUpdateState(config.stateFilePath, (s) => {
      const ss = getSessionState(s, input.session_id);
      if (ss.task_run_map?.[notificationToFinalize!]?.subagent_done) {
        finalizeNow = true;
        return s;
      }
      return {
        ...s,
        [input.session_id]: {
          ...ss,
          notification_done_agents: [
            ...(ss.notification_done_agents ?? []).filter((id) => id !== notificationToFinalize),
            notificationToFinalize!,
          ],
        },
      };
    });
    if (finalizeNow) {
      await finalizeNotificationChain({
        defaultMuted: config.defaultMuted,
        stateFilePath: config.stateFilePath,
        sessionId: input.session_id,
        project: config.project,
        customMetadata: sessionMetadata,
        runtimeVersion,
        agentId: notificationToFinalize,
        captureSharedRun,
        getSharedChildRunIds,
      });
    }
  }

  // Flush pending batches to ensure all traces are sent before hook exits.
  await flushPendingTraces();

  if (turnRecord) {
    if (closedTurnRun) {
      recordRun({
        path: turnRecord,
        run: closedTurnRun,
        tracing: currentTracing,
        origin: queueOrigin(config),
        shared: rootUsesSharedEngine,
        root: true,
        closesAt: leaveTurnOpen ? new Date().toISOString() : undefined,
        routing: { cwd: input.cwd },
      });
    }
    if (turnClosureCaptured) recordTurnClosed(turnRecord, lastTurnId);
  }

  if (completeNow && rootUsesSharedEngine && !turnClosureCaptured && currentRunId) {
    await atomicUpdateState(config.stateFilePath, (s) => {
      const ss = getSessionState(s, input.session_id);
      const openTurns = { ...ss.open_turns };
      const existing = openTurns[currentRunId];
      openTurns[currentRunId] = {
        ...existing,
        run_id: currentRunId,
        trace_id: currentTraceId,
        dotted_order: currentDottedOrder,
        parent_run_id: currentParentRunId,
        start_time: sessionState.current_turn_start,
        turn_number: sessionState.current_turn_number,
        turn_id: lastTurnId,
        runtime_version: runtimeVersion,
        approval_policy: approvalPolicy,
        tracing: currentTracing,
        last_assistant_message:
          currentTracing === "metadata" ? MUTED_TRACE_CONTENT : input.last_assistant_message,
        stop_seen: true,
        agent_ids: existing?.agent_ids ?? [],
        retry_closure: true,
        leave_open: leaveTurnOpen,
      };
      return { ...s, [input.session_id]: { ...ss, open_turns: openTurns } };
    });
  }

  startQueueFlusher(input.cwd, input.session_id, config.project);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`Processed ${tracedTurns} turns in ${duration}s`);

  if (Date.now() - startTime > 180_000) {
    warn(`Hook took ${duration}s (>3min), consider optimizing`);
  }
}

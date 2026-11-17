import { readFileSync } from "node:fs";
import { basename } from "node:path";
import {
  assistantMessages,
  buildUsageMetadata,
  generateDottedOrderSegment,
  textBlocks,
  toolResultBlocks,
} from "../langsmith.js";
import { ASSISTANT_RUN_NAME, USER_PROMPT_TURN_NAME } from "../constants.js";
import { codingAgentMetadata, skillNameFromTool } from "../metadata.js";
import {
  isHumanMessage,
  isInsertedMessage,
  mergeAdjacentTextBlocks,
  resolveProvider,
  stripModelDateSuffix,
} from "../transcript.js";
import { stripContentMarkup, typedSkillName } from "../utils/harness.js";
import { stableRunId } from "../utils/ids/run-id.js";
import { earlier, iso, later } from "../utils/times.js";
import type {
  ClaudeMetadataOptions,
  ContentBlock,
  SessionState,
  ToolResultBlock,
  ToolResultContent,
  TranscriptMessage,
  Turn,
} from "../types.js";
import {
  AGENT_NATIVE_TOOL_NAME,
  AGENT_RUN_NAME,
  AGENT_TOOL_NAMES,
  BUILDER_STATE_VERSION,
  COMPACT_BOUNDARY_SUBTYPE,
  COMPACTION_RUN_NAME,
  DEFAULT_COMPACT_TRIGGER,
  END_TURN,
  HOOK_EVENTS,
  MAIN_THREAD,
  NO_MESSAGE_ID,
  NO_TOOL_RESULT,
  SESSION_ENDED_ERROR,
  TRANSCRIPT_EXTENSION,
  TOOL_INTERRUPTED_ERROR,
  USER_INTERRUPT_ERROR,
} from "../constants.js";
import type {
  BuilderState,
  ClaudeLine,
  Message,
  NoteDetails,
  OpenRun,
  OpenTool,
  PatchContent,
  RunFields,
  RunPlace,
  Thread,
  ToolResult,
} from "./tracer-builder-models.js";
import type {
  CreateTranscriptBuilder,
  HookNote,
  LegacyOpenTurn,
  TracingMode,
  TranscriptLine,
} from "@langchain/plugins-base/tracer";

function childPlace(parent: RunPlace, id: string, start: string | number): RunPlace {
  const segment = generateDottedOrderSegment(start, id);
  return { id, traceId: parent.traceId, dottedOrder: `${parent.dottedOrder}.${segment}` };
}

function blocksOf<T>(line: ClaudeLine, type: string): T[] {
  const content = line.message?.content;
  return Array.isArray(content) ? content.filter((block) => block?.type === type) : [];
}

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n");
}

function freshThread(mode: TracingMode, agentType: Thread["agentType"]): Thread {
  return { mode, agentType, llmIndex: 0, endTurnSeen: false, messages: [], lastText: "" };
}

function restoredState(saved: unknown, mode: TracingMode = "full"): BuilderState {
  const candidate = saved as Partial<BuilderState> | undefined;
  if (candidate?.version === BUILDER_STATE_VERSION) return candidate as BuilderState;
  return {
    version: BUILDER_STATE_VERSION,
    sessionMode: mode,
    turnCount: 0,
    turns: {},
    threads: { [MAIN_THREAD]: freshThread(mode, "root") },
    tools: {},
    hookTimes: {},
  };
}

function promptAnchor(transcriptPath: string, promptStart: string) {
  const lines = readFileSync(transcriptPath, "utf8").split("\n").slice(0, -1);
  const parsed = lines.map((line) => JSON.parse(line) as TranscriptMessage & ClaudeLine);
  const isPrompt = (line: TranscriptMessage & ClaudeLine) =>
    isHumanMessage(line) && (line.timestamp ?? "") <= promptStart;
  const prompt = parsed.map(isPrompt).lastIndexOf(true);
  if (prompt < 0) return undefined;
  const ids = parsed.slice(0, prompt).flatMap((line) => line.uuid ?? []);
  return ids.length === 0 ? { fromStart: true } : { afterLineId: ids[ids.length - 1] };
}

export function legacyOpenTurn(session: SessionState, path: string): LegacyOpenTurn | undefined {
  const { current_turn_run_id: id, current_trace_id: traceId } = session;
  const { current_dotted_order: dottedOrder, current_turn_start: start } = session;
  if (!id || !traceId || !dottedOrder || !start) return undefined;
  const anchor = promptAnchor(path, start);
  if (anchor === undefined) return undefined;
  const builderState = restoredState(undefined, session.current_turn_tracing);
  builderState.turnCount = (session.current_turn_number ?? 1) - 1;
  builderState.seededRoot = { id, traceId, dottedOrder };
  return { rootRunId: id, ...anchor, builderState };
}

export const createTranscriptBuilder: CreateTranscriptBuilder = (context) => {
  const { sessionId, savedState, sink, tracingMode } = context;
  const state = restoredState(savedState, tracingMode);
  const main = () => state.threads[MAIN_THREAD];

  const metadata = (options: Omit<ClaudeMetadataOptions, "sessionId">) => {
    const { runtimeVersion, baseMetadata } = state;
    const base = { ...baseMetadata, ...options.base };
    return codingAgentMetadata({ sessionId, runtimeVersion, ...options, base });
  };

  function runIdentity(run: OpenRun) {
    return {
      id: run.id,
      name: run.name,
      run_type: run.runType,
      trace_id: run.traceId,
      dotted_order: run.dottedOrder,
      ...(run.parentId === undefined ? {} : { parent_run_id: run.parentId }),
      tracingMode: run.mode,
    };
  }

  function postRun(run: OpenRun, content: { inputs?: unknown; outputs?: unknown; error?: string }) {
    sink.post({
      ...runIdentity(run),
      start_time: run.start,
      ...(run.end === undefined ? {} : { end_time: run.end }),
      ...content,
      metadata: run.metadata,
    });
  }

  function patchRun(run: OpenRun, end: string, content: PatchContent) {
    sink.patch({
      ...runIdentity(run),
      end_time: later(run.start, end)!,
      ...content,
      metadata: content.metadata ?? run.metadata,
    });
  }

  function openRun(place: RunPlace, parent: RunPlace | undefined, fields: RunFields): OpenRun {
    return { ...place, ...fields, ...(parent === undefined ? {} : { parentId: parent.id }) };
  }

  function openTurn(time: string) {
    const pendingPrompt = state.pendingPrompt;
    const start = state.pendingStart;
    const turnNumber = ++state.turnCount;
    const promptId = pendingPrompt?.promptId;
    const lineTime = pendingPrompt?.time ?? time;
    if (start && pendingPrompt)
      state.hookClockOffset = Date.parse(start.time) - Date.parse(lineTime);
    const seeded = state.seededRoot;
    state.seededRoot = undefined;
    const startTime = start?.time ?? iso(Date.parse(lineTime) + (state.hookClockOffset ?? 0));
    const id = start
      ? stableRunId(startTime, sessionId, turnNumber)
      : stableRunId(startTime, sessionId, promptId, turnNumber);
    const newPlace = { id, traceId: id, dottedOrder: generateDottedOrderSegment(startTime, id) };
    const place = seeded ?? newPlace;
    const mode = start?.mode ?? state.sessionMode;
    const approvalPolicy = start?.approvalPolicy ?? pendingPrompt?.approvalPolicy;
    const content = pendingPrompt?.content as Turn["userContent"] | undefined;
    const run = openRun(place, undefined, {
      name: USER_PROMPT_TURN_NAME,
      runType: "chain",
      start: startTime,
      mode,
      metadata: metadata({ turnNumber, approvalPolicy, agentType: "root" }),
    });
    const userContent =
      content === undefined ? undefined : textBlocks(stripContentMarkup(content) ?? content);
    const messages = userContent ? [{ role: "user", content: userContent }] : [];
    if (seeded === undefined) postRun(run, { inputs: { messages } });
    state.turns[place.id] = {
      run,
      promptId,
      turnNumber,
      approvalPolicy,
      typedSkill: content === undefined ? undefined : typedSkillName(content),
      stopped: false,
    };
    state.currentTurn = place.id;
    state.lastTurnPlace = place;
    state.pendingStart = undefined;
    state.pendingPrompt = undefined;
    state.hookTimes = {};
    state.threads[MAIN_THREAD] = {
      ...freshThread(mode, "root"),
      parent: place,
      ownerId: place.id,
      promptId,
      turnNumber,
      messages: [...messages, ...main().messages],
      lastTime: startTime,
    };
  }

  function stopTurn(turnId: string, outcome: { error?: string; text?: string }) {
    const turn = state.turns[turnId];
    if (turn === undefined) return;
    if (state.currentTurn === turnId) {
      finishCall(MAIN_THREAD);
      turn.text = outcome.text ?? main().lastText;
      turn.run.end = later(turn.run.end, main().lastTime);
      state.currentTurn = undefined;
    }
    turn.stopped = true;
    turn.error = outcome.error;
    for (const tool of Object.values(state.tools)) {
      if (tool.turnId !== turnId) continue;
      const time = tool.result?.time ?? turn.run.end ?? turn.run.start;
      const error = outcome.error && TOOL_INTERRUPTED_ERROR;
      closeToolNow(tool, { output: NO_TOOL_RESULT, time, error });
    }
    maybeCloseTurn(turnId);
  }

  function maybeCloseTurn(turnId: string | undefined) {
    const turn = turnId === undefined ? undefined : state.turns[turnId];
    if (turn === undefined || !turn.stopped) return;
    if (Object.values(state.tools).some((tool) => tool.turnId === turnId)) return;
    delete state.turns[turnId!];
    const messages = turn.text ? [{ role: "assistant", content: turn.text }] : [];
    const { promptId, turnNumber, approvalPolicy } = turn;
    patchRun(turn.run, turn.run.end ?? turn.run.start, {
      outputs: { messages },
      ...(turn.error ? { error: turn.error } : {}),
      metadata: metadata({ turnId: promptId, turnNumber, approvalPolicy, agentType: "root" }),
    });
  }

  function readAssistant(threadKey: string, line: ClaudeLine, time: string) {
    const thread = state.threads[threadKey];
    const messageId = line.message?.id ?? NO_MESSAGE_ID;
    if (thread.call && thread.call.messageId !== messageId) finishCall(threadKey);
    const raw = line.message?.content;
    const content = (Array.isArray(raw) ? raw : []) as ContentBlock[];
    thread.call ??= {
      messageId,
      index: thread.llmIndex++,
      start: time,
      end: time,
      content: [],
      model: stripModelDateSuffix(line.message?.model ?? ""),
      usage: line.message?.usage ?? { input_tokens: 0, output_tokens: 0 },
      inputs: [...thread.messages],
    };
    const call = thread.call;
    call.end = time;
    call.content.push(...content);
    if (line.message?.usage) call.usage = line.message.usage;
    call.effort ??= line.effort;
    if (line.message?.stop_reason === END_TURN) thread.endTurnSeen = true;
    const text = textOf(content);
    if (text) thread.lastText = text;
    for (const use of content.filter((block) => block.type === "tool_use")) {
      const toolUseId = (use as { id: string }).id;
      const tool: OpenTool = {
        toolUseId,
        toolName: (use as { name: string }).name,
        thread: threadKey,
        turnId: threadKey === MAIN_THREAD ? state.currentTurn : undefined,
        input: (use as { input?: unknown }).input,
        callMessageId: messageId,
      };
      state.tools[toolUseId] = tool;
      const hook = threadKey === MAIN_THREAD ? state.hookTimes[toolUseId] : undefined;
      if (hook) applyHookTime(tool, hook.time, hook.mode);
    }
  }

  function finishCall(threadKey: string) {
    const thread = state.threads[threadKey];
    const call = thread?.call;
    if (call === undefined || thread.parent === undefined) return;
    thread.call = undefined;
    const id = stableRunId(call.start, thread.ownerId, thread.promptId, call.index);
    const merged = mergeAdjacentTextBlocks(call.content);
    const hasTools = merged.some((block) => block.type === "tool_use");
    const usage = buildUsageMetadata(call.usage);
    const firstMainCall = threadKey === MAIN_THREAD && call.index === 0 && call.inputs.length > 1;
    const typedSkill = firstMainCall ? state.turns[thread.ownerId!]?.typedSkill : undefined;
    const run = openRun(childPlace(thread.parent, id, call.start), thread.parent, {
      name: ASSISTANT_RUN_NAME,
      runType: "llm",
      start: call.start,
      mode: thread.mode,
      metadata: metadata({
        turnId: thread.promptId,
        turnNumber: thread.turnNumber,
        agentType: thread.agentType,
        modelName: call.model,
        skillName: typedSkill,
        usageMetadata: usage,
        runSpecific: {
          ls_provider: resolveProvider(call.model),
          ls_model_name: call.model,
          ls_invocation_params: {
            model: call.model,
            ...(call.effort ? { effort: call.effort } : {}),
            ...(call.usage.service_tier ? { service_tier: call.usage.service_tier } : {}),
          },
          usage_metadata: usage,
        },
      }),
    });
    run.end = hasTools ? (later(call.end, call.toolEnd) ?? call.end) : call.end;
    const outputs = assistantMessages(merged);
    postRun(run, { inputs: { messages: call.inputs }, outputs: { messages: outputs } });
    thread.messages = [];
    for (const tool of Object.values(state.tools)) {
      if (tool.thread !== threadKey || tool.callMessageId !== call.messageId || tool.run) continue;
      tool.callEnd = call.end;
      if (tool.result) postTool(tool, earlier(call.end, tool.result.time));
    }
  }

  function toolMode(tool: OpenTool): TracingMode {
    const turnMode = state.turns[tool.turnId ?? ""]?.run.mode ?? state.sessionMode;
    return turnMode === "full" ? (tool.hookMode ?? turnMode) : turnMode;
  }

  function applyHookTime(tool: OpenTool, time: number, mode: TracingMode | undefined) {
    delete state.hookTimes[tool.toolUseId];
    if (tool.run) return;
    tool.hookMode = mode;
    postTool(tool, time);
  }

  function postTool(tool: OpenTool, start: string | number) {
    const parent = state.turns[tool.turnId ?? ""]?.run;
    if (parent === undefined) return;
    const thread = state.threads[tool.thread];
    const id = stableRunId(start, sessionId, tool.toolUseId);
    const isAgent = AGENT_TOOL_NAMES.has(tool.toolName);
    const name = isAgent ? AGENT_RUN_NAME : tool.toolName;
    tool.run = openRun(childPlace(parent, id, start), parent, {
      name,
      runType: "tool",
      start: iso(start),
      mode: toolMode(tool),
      metadata: metadata({
        turnId: thread?.promptId,
        turnNumber: thread?.turnNumber,
        agentType: thread?.agentType ?? "root",
        toolName: isAgent ? AGENT_NATIVE_TOOL_NAME : tool.toolName,
        runName: name,
        skillName: skillNameFromTool(tool.toolName, tool.input),
      }),
    });
    postRun(tool.run, { inputs: { input: tool.input } });
    if (!isAgent) tool.input = undefined;
    if (tool.result) finishTool(tool, tool.result);
  }

  function readToolResult(key: string, line: ClaudeLine, block: ToolResultBlock, time: string) {
    const thread = state.threads[key];
    thread.messages.push({
      role: "tool",
      tool_call_id: block.tool_use_id,
      content: toolResultBlocks(block.content as ToolResultContent | undefined),
    });
    const tool = state.tools[block.tool_use_id];
    if (tool === undefined) return;
    const result: ToolResult = {
      time,
      output: line.toolUseResult ?? block.content,
      ...(block.is_error ? { error: textOf(block.content) || TOOL_INTERRUPTED_ERROR } : {}),
    };
    const call = state.threads[tool.thread]?.call;
    if (call?.messageId === tool.callMessageId) call.toolEnd = later(call.toolEnd, time);
    if (tool.run) return finishTool(tool, result);
    tool.result = result;
    if (tool.callEnd !== undefined) postTool(tool, earlier(tool.callEnd, time));
  }

  function finishTool(tool: OpenTool, result: ToolResult) {
    tool.result = undefined;
    closeToolNow(tool, result);
  }

  function closeToolNow(tool: OpenTool, outcome: ToolResult) {
    if (!tool.run) postTool(tool, tool.callEnd ?? outcome.time);
    delete state.tools[tool.toolUseId];
    if (!tool.run) return;
    patchRun(tool.run, outcome.time, {
      outputs: { output: outcome.output },
      ...(outcome.error ? { error: outcome.error } : {}),
    });
    const turn = state.turns[tool.turnId ?? ""];
    if (turn) turn.run.end = later(turn.run.end, outcome.time);
    maybeCloseTurn(tool.turnId);
  }

  function startsNewTurn(thread: Thread, line: ClaudeLine, hasTurn: boolean): boolean {
    if (!hasTurn) return true;
    const sameTurn = line.promptId !== undefined && line.promptId === thread.promptId;
    const inserted = isInsertedMessage(line as never) && !thread.endTurnSeen;
    return !sameTurn && !inserted;
  }

  function readMainHuman(line: ClaudeLine, time: string) {
    const thread = main();
    const pending = state.pendingPrompt;
    const promptId = state.currentTurn ? thread.promptId : pending?.promptId;
    const hasTurn = state.currentTurn !== undefined || pending !== undefined;
    if (!hasTurn && line.promptId !== undefined && line.promptId === thread.promptId) return;
    const endTurnSeen = state.currentTurn ? thread.endTurnSeen : false;
    if (!startsNewTurn({ ...thread, promptId, endTurnSeen }, line, hasTurn)) {
      thread.messages.push({ role: "user", content: line.message?.content });
      return;
    }
    if (state.currentTurn)
      stopTurn(state.currentTurn, { error: thread.endTurnSeen ? undefined : USER_INTERRUPT_ERROR });
    thread.messages = [];
    state.pendingPrompt = {
      time,
      promptId: line.promptId,
      content: line.message?.content as string | Message[],
      approvalPolicy: line.permissionMode,
    };
    if (state.pendingStart) openTurn(time);
  }

  function readCompaction(line: ClaudeLine, time: string) {
    if (line.subtype === COMPACT_BOUNDARY_SUBTYPE) {
      flushCompaction(undefined);
      const trigger = line.compactMetadata?.trigger ?? DEFAULT_COMPACT_TRIGGER;
      const start = earlier(state.preCompact?.time ?? time, time);
      state.compaction = { start, end: time, trigger, mode: state.preCompact?.mode };
      state.preCompact = undefined;
      return true;
    }
    flushCompaction(line.isCompactSummary ? textOf(line.message?.content) : undefined);
    return false;
  }

  function flushCompaction(summary: string | undefined) {
    const compaction = state.compaction;
    if (compaction === undefined) return;
    state.compaction = undefined;
    const turn = state.turns[state.currentTurn ?? ""];
    const parent = turn?.run ?? state.lastTurnPlace;
    if (parent === undefined) return;
    const id = stableRunId(compaction.start, sessionId, compaction.trigger);
    const run = openRun(childPlace(parent, id, compaction.start), parent, {
      name: COMPACTION_RUN_NAME(compaction.trigger),
      runType: "chain",
      start: compaction.start,
      mode: compaction.mode ?? turn?.run.mode ?? state.sessionMode,
      metadata: metadata({
        turnNumber: turn?.turnNumber,
        agentType: "compaction",
        runSpecific: { trigger: compaction.trigger },
      }),
    });
    run.end = compaction.end;
    postRun(run, { inputs: {}, outputs: { compact_summary: summary } });
  }

  function readMainLine(line: ClaudeLine, time: string) {
    if (readCompaction(line, time)) return;
    if (line.isSidechain) return;
    if (line.type === "assistant") {
      if (state.currentTurn === undefined) openTurn(time);
      readAssistant(MAIN_THREAD, line, time);
    } else if (line.type === "user") readUserLine(MAIN_THREAD, line, time);
    main().lastTime = later(main().lastTime, time);
  }

  function readUserLine(threadKey: string, line: ClaudeLine, time: string) {
    if (!isHumanMessage(line as TranscriptMessage)) {
      for (const block of blocksOf<ToolResultBlock>(line, "tool_result"))
        readToolResult(threadKey, line, block, time);
    } else if (!line.queueTranscriptOnly) readMainHuman(line, time);
  }

  function readLine(transcriptPath: string, transcriptLine: TranscriptLine) {
    const line = transcriptLine as ClaudeLine;
    if (typeof line.version === "string" && line.version) state.runtimeVersion = line.version;
    const isMain = basename(transcriptPath) === `${sessionId}${TRANSCRIPT_EXTENSION}`;
    if (state.mainPath === undefined && isMain) state.mainPath = transcriptPath;
    const time = line.timestamp;
    if (typeof time === "string") state.lastTime = later(state.lastTime, time);
    if (transcriptPath === state.mainPath && typeof time === "string") readMainLine(line, time);
  }

  function endSession() {
    flushCompaction(undefined);
    if (state.currentTurn) stopTurn(state.currentTurn, { error: SESSION_ENDED_ERROR });
    for (const [turnId, turn] of Object.entries(state.turns)) {
      turn.stopped = true;
      maybeCloseTurn(turnId);
    }
  }

  function receiveNote(note: HookNote) {
    const details = (note.details ?? {}) as NoteDetails;
    const time =
      details.time === undefined ? (state.lastTime ?? iso(Date.now())) : iso(details.time);
    if (details.metadata) state.baseMetadata = details.metadata;
    if (state.mainPath === undefined && note.transcriptPath && !note.agentId)
      state.mainPath = note.transcriptPath;
    const toolUseId = details.toolUseId;
    switch (note.event) {
      case HOOK_EVENTS.userPromptSubmit:
        if (note.agentId) return;
        state.sessionMode = note.tracingMode ?? state.sessionMode;
        const approvalPolicy = details.permissionMode;
        state.pendingStart = { time, mode: state.sessionMode, approvalPolicy };
        return;
      case HOOK_EVENTS.preToolUse:
        if (note.agentId || toolUseId === undefined || details.time === undefined) return;
        if (state.tools[toolUseId])
          applyHookTime(state.tools[toolUseId], details.time, note.tracingMode);
        else state.hookTimes[toolUseId] = { time: details.time, mode: note.tracingMode };
        return;
      case HOOK_EVENTS.stop: {
        const turn = state.turns[state.currentTurn ?? ""];
        if (note.agentId || turn === undefined) return;
        stopTurn(state.currentTurn!, { text: details.lastAssistantMessage });
        return;
      }
      case HOOK_EVENTS.stopFailure: {
        if (note.agentId || state.currentTurn === undefined) return;
        const { error, errorDetails } = details;
        stopTurn(state.currentTurn, { error: errorDetails ? `${error}: ${errorDetails}` : error });
        return;
      }
      case HOOK_EVENTS.preCompact:
        state.preCompact = { time, mode: note.tracingMode };
        return;
      case HOOK_EVENTS.sessionEnd:
        endSession();
        return;
    }
  }

  function transcripts(): string[] {
    return state.mainPath === undefined ? [] : [state.mainPath];
  }

  return {
    lineId: (line) => (typeof line.uuid === "string" ? line.uuid : undefined),
    readLine,
    receiveNote,
    transcripts,
    turnOpen: () =>
      Object.keys(state.turns).length > 0 || !!state.pendingStart || !!state.compaction,
    state: () => state,
  };
};

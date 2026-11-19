import { readFileSync } from "node:fs";
import { basename } from "node:path";
import {
  assistantMessages,
  buildUsageMetadata,
  generateDottedOrderSegment,
  hooksFiring,
  parseDottedOrder,
  textBlocks,
  toolResultBlocks,
  withHooks,
} from "../langsmith.js";
import { ASSISTANT_RUN_NAME, USER_PROMPT_TURN_NAME } from "../constants.js";
import { withPinnedRepositoryKeys } from "../config.js";
import { codingAgentMetadata, skillNameFromTool } from "../metadata.js";
import {
  clearRepoAttributionCache,
  originScopedMetadata,
  repoScopedMetadata,
  toolOrigin,
} from "../repo-attribution.js";
import {
  hookPlacement,
  hookToolUseId,
  isHumanMessage,
  isInsertedMessage,
  mergeAdjacentTextBlocks,
  resolveProvider,
  stripModelDateSuffix,
  transcriptHooks,
} from "../transcript.js";
import { jsonBytes } from "../utils/bytes.js";
import { stripContentMarkup, typedSkillName } from "../utils/harness.js";
import { stableRunId } from "../utils/ids/run-id.js";
import { stringValue } from "../utils/records.js";
import { earlier, iso, later } from "../utils/times.js";
import type {
  ClaudeMetadataOptions,
  ContentBlock,
  HookEntry,
  SessionState,
  ToolResultBlock,
  ToolResultContent,
  TranscriptMessage,
  Turn,
} from "../types.js";
import {
  lastLineUuid,
  metaAgentId,
  metaToolUseId,
  subagentIdOf,
  subagentTranscriptPath,
} from "./subagent-files.js";
import type { HookOutput } from "@langchain/plugins-base/tracing";
import {
  AGENT_NATIVE_TOOL_NAME,
  AGENT_RUN_NAME,
  AGENT_TOOL_NAMES,
  ASYNC_LAUNCHED_STATUS,
  BACKGROUND_AGENT_WAIT_MS,
  BUILDER_STATE_VERSION,
  COMPACT_BOUNDARY_SUBTYPE,
  COMPACTION_RUN_NAME,
  DEFAULT_COMPACT_TRIGGER,
  DEFAULT_SUBAGENT_TYPE,
  END_TURN,
  HOOK_BLOCKING_ATTACHMENT,
  HOOK_ENTRY_TYPE,
  HOOK_EVENTS,
  LATE_REPLY_WINDOW_MS,
  MAIN_THREAD,
  MODEL_HISTORY_RESULT_LIMIT_BYTES,
  MODEL_HISTORY_STUB,
  MODEL_HISTORY_STUB_ENDING,
  MODEL_HISTORY_TURN_LIMIT_BYTES,
  NO_MESSAGE_ID,
  NO_TOOL_RESULT,
  SESSION_ENDED_ERROR,
  TRANSCRIPT_EXTENSION,
  SUBAGENT_CHAIN_SUFFIX,
  TOOL_INTERRUPTED_ERROR,
  TRACING_MODE_STRICTNESS,
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

function outsideParent(dottedOrder: string | undefined): RunPlace | undefined {
  if (dottedOrder === undefined) return undefined;
  const { traceId, runId } = parseDottedOrder(dottedOrder);
  return { id: runId, traceId, dottedOrder };
}

function stricterMode(mode: TracingMode, other: TracingMode = mode): TracingMode {
  const rank = (candidate: TracingMode) => TRACING_MODE_STRICTNESS.indexOf(candidate);
  return rank(other) > rank(mode) ? other : mode;
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

function historyBytes(messages: Message[]): number {
  return messages.reduce((sum, message) => sum + jsonBytes(message), 0);
}

function stubbedContent(content: unknown, limit: number): unknown {
  const bytes = jsonBytes(content);
  return bytes > limit ? MODEL_HISTORY_STUB(bytes) : content;
}

function changeHistory(thread: Thread, start: number, removeCount: number, added: Message[] = []) {
  const before = thread.historyBytes ?? historyBytes(thread.messages);
  const removed = thread.messages.splice(start, removeCount, ...added);
  thread.historyBytes = before - historyBytes(removed) + historyBytes(added);
  for (let i = 1; i < thread.messages.length; i++) {
    if (thread.historyBytes <= MODEL_HISTORY_TURN_LIMIT_BYTES) return;
    const message = thread.messages[i];
    if (String(message.content).endsWith(MODEL_HISTORY_STUB_ENDING)) continue;
    const stubbed = { ...message, content: stubbedContent(message.content, 0) };
    const saved = jsonBytes(message) - jsonBytes(stubbed);
    if (saved <= 0) continue;
    thread.messages[i] = stubbed;
    thread.historyBytes -= saved;
  }
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
  try {
    const lines = readFileSync(transcriptPath, "utf8").split("\n").slice(0, -1);
    const parsed = lines.map((line) => JSON.parse(line) as TranscriptMessage & ClaudeLine);
    const isPrompt = (line: TranscriptMessage & ClaudeLine) =>
      isHumanMessage(line) && (line.timestamp ?? "") <= promptStart;
    const prompt = parsed.map(isPrompt).lastIndexOf(true);
    if (prompt < 0) return undefined;
    const ids = parsed.slice(0, prompt).flatMap((line) => line.uuid ?? []);
    return ids.length === 0 ? { fromStart: true } : { afterLineId: ids[ids.length - 1] };
  } catch {
    return undefined;
  }
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
    const notifiedTool = state.tools[pendingPrompt?.notificationOf ?? ""];
    const parent = notifiedTool?.run ?? outsideParent(start?.parentDottedOrder);
    const newPlace = parent
      ? childPlace(parent, id, startTime)
      : { id, traceId: id, dottedOrder: generateDottedOrderSegment(startTime, id) };
    const place = seeded ?? newPlace;
    const mode = stricterMode(start?.mode ?? state.sessionMode, notifiedTool?.run?.mode);
    const approvalPolicy = start?.approvalPolicy ?? pendingPrompt?.approvalPolicy;
    const content = pendingPrompt?.content as Turn["userContent"] | undefined;
    const run = openRun(place, parent, {
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
      toolOrigins: [],
      ...(state.captureHookOutputs ? { prompt: messages } : {}),
      ...(state.promptHooks ? { hooks: state.promptHooks } : {}),
    };
    state.promptHooks = undefined;
    if (notifiedTool?.launch) notifiedTool.launch.notificationTurn = place.id;
    state.currentTurn = place.id;
    state.stoppedTurn = undefined;
    state.lastTurnPlace = place;
    state.pendingStart = undefined;
    state.pendingPrompt = undefined;
    state.hookTimes = {};
    clearRepoAttributionCache();
    const carried = main().messages;
    state.threads[MAIN_THREAD] = {
      ...freshThread(mode, "root"),
      parent: place,
      ownerId: place.id,
      promptId,
      turnNumber,
      lastTime: startTime,
    };
    changeHistory(main(), 0, 0, [...messages, ...carried]);
  }

  function stopTurn(turnId: string, outcome: { error?: string; text?: string }) {
    const turn = state.turns[turnId];
    if (turn === undefined) return;
    if (state.currentTurn === turnId) {
      finishCall(MAIN_THREAD);
      changeHistory(main(), 0, main().messages.length);
      turn.text = outcome.text ?? main().lastText;
      turn.run.end = later(turn.run.end, main().lastTime);
      state.currentTurn = undefined;
    }
    turn.stopped = true;
    turn.error = outcome.error;
    releaseHeldTools();
    for (const tool of Object.values(state.tools)) {
      if (tool.turnId !== turnId || tool.launch) continue;
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
    const { promptId, turnNumber, approvalPolicy, gitMetadata: base } = turn;
    patchRun(turn.run, turn.run.end ?? turn.run.start, {
      ...withHookInputs({ messages: turn.prompt ?? [] }, turn.hooks),
      outputs: withHooks({ messages }, turn.hooks, "output"),
      ...(turn.error ? { error: turn.error } : {}),
      metadata: metadata({ base, turnId: promptId, turnNumber, approvalPolicy, agentType: "root" }),
    });
    const notified = Object.values(state.tools).find((t) => t.launch?.notificationTurn === turnId);
    if (notified?.launch) {
      notified.launch.notified = true;
      notified.run!.end = later(notified.run!.end, turn.run.end);
      maybeCloseAgentTool(notified);
    }
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
      historyIndex: thread.messages.length,
    };
    const call = thread.call;
    call.end = time;
    call.content.push(...content);
    if (line.message?.usage) call.usage = line.message.usage;
    call.effort ??= line.effort;
    if (line.message?.stop_reason === END_TURN) thread.endTurnSeen = true;
    const text = textOf(mergeAdjacentTextBlocks(call.content));
    if (text) thread.lastText = text;
    for (const use of content.filter((block) => block.type === "tool_use")) {
      const toolUseId = (use as { id: string }).id;
      const tool: OpenTool = {
        toolUseId,
        toolName: (use as { name: string }).name,
        thread: threadKey,
        turnId: threadKey === MAIN_THREAD ? state.currentTurn : undefined,
        input: (use as { input?: unknown }).input,
        cwd: line.cwd,
        callMessageId: messageId,
      };
      state.tools[toolUseId] = tool;
      if (tool.turnId)
        state.turns[tool.turnId]?.toolOrigins.push(toolOrigin(tool.input, state.cwd));
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
    changeHistory(thread, call.historyIndex, 0, outputs);
    for (const tool of Object.values(state.tools)) {
      if (tool.thread !== threadKey || tool.callMessageId !== call.messageId || tool.run) continue;
      tool.callEnd = call.end;
      if (tool.result) postTool(tool, earlier(call.end, tool.result.time));
      else if (threadKey !== MAIN_THREAD) postTool(tool, call.end);
    }
  }

  function toolParent(tool: OpenTool): RunPlace | undefined {
    if (tool.thread !== MAIN_THREAD) return state.threads[tool.thread]?.parent;
    return tool.turnId === undefined ? undefined : state.turns[tool.turnId]?.run;
  }

  function toolMode(tool: OpenTool): TracingMode {
    if (tool.thread !== MAIN_THREAD) return state.threads[tool.thread]?.mode ?? state.sessionMode;
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
    const parent = toolParent(tool);
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
        base: repoScopedMetadata(
          withPinnedRepositoryKeys(state.baseMetadata, state.pinnedRepositoryKeys),
          tool.input,
          tool.cwd ?? state.cwd,
          tool.toolName,
        ),
        turnId: thread?.promptId,
        turnNumber: thread?.turnNumber,
        agentType: thread?.agentType ?? "root",
        toolName: isAgent ? AGENT_NATIVE_TOOL_NAME : tool.toolName,
        runName: name,
        skillName: skillNameFromTool(tool.toolName, tool.input),
      }),
    });
    postRun(tool.run, { inputs: { input: tool.input } });
    if (!isAgent && !state.captureHookOutputs) tool.input = undefined;
    if (tool.result) settleTool(tool, tool.result);
  }

  function readToolResult(key: string, line: ClaudeLine, block: ToolResultBlock, time: string) {
    const thread = state.threads[key];
    const content = toolResultBlocks(block.content as ToolResultContent | undefined);
    changeHistory(thread, thread.messages.length, 0, [
      {
        role: "tool",
        tool_call_id: block.tool_use_id,
        content: stubbedContent(content, MODEL_HISTORY_RESULT_LIMIT_BYTES),
      },
    ]);
    const tool = state.tools[block.tool_use_id];
    if (tool === undefined) return;
    const nested =
      line.toolUseResult === undefined &&
      tool.thread !== MAIN_THREAD &&
      AGENT_TOOL_NAMES.has(tool.toolName);
    const result: ToolResult = {
      time,
      output: line.toolUseResult ?? block.content,
      ...(block.is_error ? { error: textOf(block.content) || TOOL_INTERRUPTED_ERROR } : {}),
      agentId:
        stringValue(line.toolUseResult?.agentId) ??
        (nested && state.mainPath
          ? metaAgentId(state.mainPath, sessionId, tool.toolUseId)
          : undefined),
      agentType: stringValue(line.toolUseResult?.agentType),
      launched: line.toolUseResult?.status === ASYNC_LAUNCHED_STATUS || nested,
    };
    const call = state.threads[tool.thread]?.call;
    if (call?.messageId === tool.callMessageId) call.toolEnd = later(call.toolEnd, time);
    if (tool.run) return settleTool(tool, result);
    tool.result = result;
    if (tool.callEnd !== undefined) postTool(tool, earlier(tool.callEnd, time));
  }

  function settleTool(tool: OpenTool, result: ToolResult) {
    if (!state.captureHookOutputs) return finishTool(tool, result);
    tool.result = undefined;
    tool.held = result;
  }

  function releaseHeldTools() {
    for (const tool of Object.values(state.tools)) {
      const held = tool.held;
      if (held === undefined) continue;
      tool.held = undefined;
      finishTool(tool, held);
    }
  }

  function finishTool(tool: OpenTool, result: ToolResult) {
    tool.result = undefined;
    if (result.agentId && AGENT_TOOL_NAMES.has(tool.toolName)) {
      linkAgent(tool, result.agentId, result.agentType);
      if (result.launched) {
        const chainClosed = !state.threads[result.agentId];
        tool.launch = { output: result.output, chainClosed, notified: tool.thread !== MAIN_THREAD };
        tool.run!.end = result.time;
        maybeCloseAgentTool(tool);
        return;
      }
    }
    closeToolNow(tool, result);
  }

  function closeToolNow(tool: OpenTool, outcome: Pick<ToolResult, "output" | "error" | "time">) {
    if (tool.agentId && !tool.launch) finishAgent(tool.agentId);
    if (!tool.run) postTool(tool, tool.callEnd ?? outcome.time);
    delete state.tools[tool.toolUseId];
    if (!tool.run) return;
    const runSpecific = { agent_type: tool.subagentType ?? AGENT_RUN_NAME, agent_id: tool.agentId };
    patchRun(tool.run, outcome.time, {
      ...withHookInputs({ input: tool.input }, tool.hooks),
      outputs: withHooks({ output: outcome.output }, tool.hooks, "output"),
      ...(outcome.error ? { error: outcome.error } : {}),
      ...(AGENT_TOOL_NAMES.has(tool.toolName)
        ? { metadata: { ...tool.run.metadata, runSpecific } }
        : {}),
    });
    const turn = state.turns[tool.turnId ?? ""];
    if (turn) turn.run.end = later(turn.run.end, outcome.time);
    maybeCloseTurn(tool.turnId);
  }

  function linkAgent(tool: OpenTool, agentId: string, agentType: string | undefined) {
    if (state.threads[agentId] || tool.agentId || !tool.run) return;
    const input = tool.input as { subagent_type?: unknown } | undefined;
    const subagentType = agentType ?? stringValue(input?.subagent_type) ?? DEFAULT_SUBAGENT_TYPE;
    const id = stableRunId(tool.run.start, tool.run.id, agentId);
    const parentThread = state.threads[tool.thread];
    const chain = openRun(childPlace(tool.run, id, tool.run.start), tool.run, {
      name: `${subagentType}${SUBAGENT_CHAIN_SUFFIX}`,
      runType: "chain",
      start: tool.run.start,
      mode: tool.run.mode,
      metadata: metadata({
        turnId: parentThread?.promptId,
        turnNumber: parentThread?.turnNumber,
        agentType: "subagent",
        subagentId: agentId,
        subagentType,
      }),
    });
    postRun(chain, { inputs: tool.input ?? {} });
    tool.agentId = agentId;
    tool.subagentType = subagentType;
    state.threads[agentId] = {
      ...freshThread(tool.run.mode, "subagent"),
      parent: chain,
      ownerId: id,
      chain,
      toolUseId: tool.toolUseId,
      turnNumber: 0,
      lastTime: tool.run.start,
    };
  }

  function linkFromMeta(agentId: string) {
    if (state.threads[agentId] || state.mainPath === undefined) return;
    const toolUseId = metaToolUseId(state.mainPath, sessionId, agentId);
    const tool = toolUseId === undefined ? undefined : state.tools[toolUseId];
    if (tool && AGENT_TOOL_NAMES.has(tool.toolName)) linkAgent(tool, agentId, undefined);
  }

  function finishAgent(agentId: string) {
    const thread = state.threads[agentId];
    if (thread === undefined || state.mainPath === undefined) return;
    const last = lastLineUuid(subagentTranscriptPath(state.mainPath, sessionId, agentId));
    if (last === undefined || last === thread.lastLineId) closeSubagent(agentId);
    else thread.closeAtLineId = last;
  }

  function closeSubagent(agentId: string) {
    const thread = state.threads[agentId];
    if (thread?.chain === undefined) return;
    finishCall(agentId);
    const end = thread.lastTime ?? thread.chain.start;
    for (const tool of Object.values(state.tools)) {
      if (tool.thread !== agentId || tool.launch) continue;
      const time = tool.result?.time ?? end;
      closeToolNow(tool, { output: NO_TOOL_RESULT, time, error: TOOL_INTERRUPTED_ERROR });
    }
    delete state.threads[agentId];
    patchRun(thread.chain, end, { outputs: { output: thread.lastText } });
    const tool = state.tools[thread.toolUseId ?? ""];
    if (tool?.launch) {
      tool.launch.chainClosed = true;
      tool.run!.end = later(tool.run!.end, end);
      maybeCloseAgentTool(tool);
    }
  }

  function maybeCloseAgentTool(tool: OpenTool) {
    const launch = tool.launch!;
    if (!launch.chainClosed || !launch.notified) return;
    closeToolNow(tool, { output: launch.output, time: tool.run!.end ?? tool.run!.start });
  }

  function closeLostLaunches(now: string) {
    for (const tool of Object.values(state.tools)) {
      const turn = state.turns[tool.turnId ?? ""];
      const since = turn?.stopped ? (turn.run.end ?? turn.run.start) : now;
      if (!tool.launch || Date.parse(now) - Date.parse(since) <= BACKGROUND_AGENT_WAIT_MS) continue;
      tool.launch = undefined;
      closeToolNow(tool, { output: NO_TOOL_RESULT, time: tool.run!.end ?? since });
    }
  }

  function notificationTarget(content: unknown): OpenTool | undefined {
    const text = textOf(content);
    return Object.values(state.tools).find(
      (tool) => tool.launch && (text.includes(tool.agentId!) || text.includes(tool.toolUseId)),
    );
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
    if (
      !hasTurn &&
      !state.pendingStart &&
      line.promptId !== undefined &&
      line.promptId === thread.promptId
    )
      return;
    if (!hasTurn && line.turnCompanion === true) return;
    const target = notificationTarget(line.message?.content);
    const endTurnSeen = state.currentTurn ? thread.endTurnSeen : false;
    if (target?.launch) finishAgent(target.agentId!);
    const transcriptOnly = line.queueTranscriptOnly === true;
    if (transcriptOnly || !startsNewTurn({ ...thread, promptId, endTurnSeen }, line, hasTurn)) {
      const shown = stripContentMarkup(line.message?.content as Turn["userContent"]);
      if (!transcriptOnly && shown)
        changeHistory(thread, thread.messages.length, 0, [
          { role: "user", content: textBlocks(shown) },
        ]);
      if (target?.launch) {
        target.launch.notified = true;
        maybeCloseAgentTool(target);
      }
      return;
    }
    if (state.currentTurn)
      stopTurn(state.currentTurn, { error: thread.endTurnSeen ? undefined : USER_INTERRUPT_ERROR });
    changeHistory(thread, 0, thread.messages.length);
    state.pendingPrompt = {
      time,
      promptId: line.promptId,
      content: line.message?.content as string | Message[],
      approvalPolicy: line.permissionMode,
      ...(target ? { notificationOf: target.toolUseId } : {}),
    };
    if (state.pendingStart) openTurn(time);
  }

  function readThreadHuman(threadKey: string, line: ClaudeLine) {
    const thread = state.threads[threadKey];
    if (!startsNewTurn(thread, line, thread.prompted === true)) {
      const shown = stripContentMarkup(line.message?.content as Turn["userContent"]);
      if (shown)
        changeHistory(thread, thread.messages.length, 0, [
          { role: "user", content: textBlocks(shown) },
        ]);
      return;
    }
    finishCall(threadKey);
    const prompt = line.message?.content as Turn["userContent"];
    thread.promptId = line.promptId;
    thread.prompted = true;
    thread.turnNumber = (thread.turnNumber ?? 0) + 1;
    thread.llmIndex = 0;
    thread.endTurnSeen = false;
    changeHistory(thread, 0, thread.messages.length, [
      { role: "user", content: textBlocks(stripContentMarkup(prompt) ?? prompt) },
    ]);
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

  function reopenBlockedTurn(line: ClaudeLine) {
    const turn = state.stoppedTurn;
    const { type, hookEvent } = line.attachment ?? {};
    if (type !== HOOK_BLOCKING_ATTACHMENT || hookEvent !== HOOK_EVENTS.stop) return;
    if (turn === undefined || state.currentTurn !== undefined || state.pendingPrompt) return;
    state.stoppedTurn = undefined;
    state.turns[turn.run.id] ??= turn;
    state.turns[turn.run.id].stopped = false;
    state.currentTurn = turn.run.id;
    main().endTurnSeen = false;
  }

  function reopenForLateReply(line: ClaudeLine, time: string): boolean {
    const late = state.lateReply;
    if (late === undefined || state.pendingStart || state.pendingPrompt) return false;
    if (Date.parse(time) - late.stoppedAt > LATE_REPLY_WINDOW_MS) return false;
    late.messageId = line.message?.id;
    state.turns[late.turn.run.id] ??= late.turn;
    state.turns[late.turn.run.id].stopped = false;
    state.currentTurn = late.turn.run.id;
    return true;
  }

  function closeLateReply(line?: ClaudeLine) {
    const late = state.lateReply;
    if (late?.messageId === undefined) return;
    if (line?.type === "assistant" && line.message?.id === late.messageId) return;
    state.lateReply = undefined;
    if (state.currentTurn === late.turn.run.id)
      stopTurn(late.turn.run.id, { text: late.turn.text });
  }

  function withHookInputs(inputs: object, hooks: HookOutput[] | undefined) {
    return hooksFiring(hooks, "input").length > 0
      ? { inputs: withHooks(inputs, hooks, "input") }
      : {};
  }

  function collectHooks(line: ClaudeLine, onMainThread: boolean) {
    if (!state.captureHookOutputs) return;
    const entry = line as unknown as HookEntry;
    const tool = state.tools[hookToolUseId(entry) ?? ""];
    const turn = onMainThread ? state.turns[state.currentTurn ?? ""] : undefined;
    for (const hook of transcriptHooks(entry)) {
      const owner = tool && hookPlacement(hook.name).scope === "tool" ? tool : turn;
      if (owner) (owner.hooks ??= []).push(hook);
      else if (onMainThread && hookPlacement(hook.name).direction === "input")
        (state.promptHooks ??= []).push(hook);
    }
  }

  function readMainLine(line: ClaudeLine, time: string) {
    if (typeof line.cwd === "string") state.cwd = line.cwd;
    if (line.type === HOOK_ENTRY_TYPE) collectHooks(line, true);
    else releaseHeldTools();
    closeLateReply(line);
    if (readCompaction(line, time)) return;
    reopenBlockedTurn(line);
    if (line.isSidechain) return;
    if (line.type === "assistant") {
      if (state.currentTurn === undefined && !reopenForLateReply(line, time)) openTurn(time);
      readAssistant(MAIN_THREAD, line, time);
    } else if (line.type === "user") readUserLine(MAIN_THREAD, line, time);
    main().lastTime = later(main().lastTime, time);
    closeLostLaunches(time);
  }

  function readSubagentLine(agentId: string, line: ClaudeLine, time: string) {
    if (line.type === HOOK_ENTRY_TYPE) collectHooks(line, false);
    else releaseHeldTools();
    const thread = state.threads[agentId];
    thread.lastTime = later(thread.lastTime, time);
    const kind = line.type === "assistant" ? "tool_use" : "tool_result";
    const blocks = blocksOf<{ id?: string; tool_use_id?: string }>(line, kind);
    if (blocks.some((block) => (block.id ?? block.tool_use_id) === thread.toolUseId)) return;
    if (line.type === "assistant") {
      if (thread.turnNumber === 0) thread.turnNumber = 1;
      readAssistant(agentId, line, time);
    } else if (line.type === "user") readUserLine(agentId, line, time);
  }

  function readUserLine(threadKey: string, line: ClaudeLine, time: string) {
    if (!isHumanMessage(line as TranscriptMessage)) {
      for (const block of blocksOf<ToolResultBlock>(line, "tool_result"))
        readToolResult(threadKey, line, block, time);
    } else if (threadKey === MAIN_THREAD) readMainHuman(line, time);
    else readThreadHuman(threadKey, line);
  }

  function readLine(transcriptPath: string, transcriptLine: TranscriptLine) {
    const line = transcriptLine as ClaudeLine;
    if (typeof line.version === "string" && line.version) state.runtimeVersion = line.version;
    const isMain = basename(transcriptPath) === `${sessionId}${TRANSCRIPT_EXTENSION}`;
    if (state.mainPath === undefined && isMain) state.mainPath = transcriptPath;
    const time = line.timestamp;
    if (typeof time === "string") state.lastTime = later(state.lastTime, time);
    if (transcriptPath === state.mainPath && typeof time === "string") readMainLine(line, time);
    const agentId = subagentIdOf(transcriptPath);
    const thread = agentId === undefined ? undefined : state.threads[agentId];
    if (thread === undefined) return;
    if (typeof time === "string") readSubagentLine(agentId!, line, time);
    if (line.uuid !== undefined) thread.lastLineId = line.uuid;
    if (thread.closeAtLineId !== undefined && thread.closeAtLineId === line.uuid)
      closeSubagent(agentId!);
  }

  function endSession() {
    flushCompaction(undefined);
    for (const agentId of Object.keys(state.threads)) closeSubagent(agentId);
    if (state.currentTurn) stopTurn(state.currentTurn, { error: SESSION_ENDED_ERROR });
    for (const tool of Object.values(state.tools)) {
      const time = tool.run?.end ?? state.lastTime ?? tool.run?.start ?? "";
      if (tool.launch) closeToolNow(tool, { output: tool.launch.output, time });
    }
    for (const [turnId, turn] of Object.entries(state.turns)) {
      turn.stopped = true;
      maybeCloseTurn(turnId);
    }
  }

  function receiveNote(note: HookNote) {
    closeLateReply();
    if (note.details && "captureHookOutputs" in note.details)
      state.captureHookOutputs = (note.details as NoteDetails).captureHookOutputs === true;
    const details = (note.details ?? {}) as NoteDetails;
    const time =
      details.time === undefined ? (state.lastTime ?? iso(Date.now())) : iso(details.time);
    if (details.metadata) {
      state.baseMetadata = details.metadata;
      state.pinnedRepositoryKeys = details.pinnedRepositoryKeys;
    }
    if (details.cwd) state.cwd = details.cwd;
    if (state.mainPath === undefined && note.transcriptPath && !note.agentId)
      state.mainPath = note.transcriptPath;
    const toolUseId = details.toolUseId;
    switch (note.event) {
      case HOOK_EVENTS.userPromptSubmit:
        if (note.agentId) return;
        state.sessionMode = note.tracingMode ?? state.sessionMode;
        const approvalPolicy = details.permissionMode;
        const parentDottedOrder = details.parentDottedOrder;
        state.pendingStart = { time, mode: state.sessionMode, approvalPolicy, parentDottedOrder };
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
        state.pendingStart = undefined;
        clearRepoAttributionCache();
        turn.gitMetadata = originScopedMetadata(state.baseMetadata, turn.toolOrigins, state.cwd);
        state.stoppedTurn = turn;
        const stoppedAt = Date.parse(time) - (state.hookClockOffset ?? 0);
        state.lateReply = main().endTurnSeen ? undefined : { turn, stoppedAt };
        stopTurn(state.currentTurn!, { text: details.lastAssistantMessage });
        return;
      }
      case HOOK_EVENTS.stopFailure: {
        if (note.agentId || state.currentTurn === undefined) return;
        state.pendingStart = undefined;
        const { error, errorDetails } = details;
        stopTurn(state.currentTurn, { error: errorDetails ? `${error}: ${errorDetails}` : error });
        return;
      }
      case HOOK_EVENTS.subagentStop:
        if (note.agentId === undefined) return;
        linkFromMeta(note.agentId);
        finishAgent(note.agentId);
        return;
      case HOOK_EVENTS.preCompact:
        state.preCompact = { time, mode: note.tracingMode };
        return;
      case HOOK_EVENTS.sessionEnd:
        endSession();
        return;
    }
  }

  function transcripts(): string[] {
    const mainPath = state.mainPath;
    if (mainPath === undefined) return [];
    const agents = Object.keys(state.threads).filter((key) => key !== MAIN_THREAD);
    return [mainPath, ...agents.map((id) => subagentTranscriptPath(mainPath, sessionId, id))];
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

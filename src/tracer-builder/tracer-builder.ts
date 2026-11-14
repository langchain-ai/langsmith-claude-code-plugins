import type { CodingAgentMetadataOptions } from "@langchain/plugins-base/metadata";
import { basename } from "node:path";
import {
  assistantMessages,
  buildUsageMetadata,
  generateDottedOrderSegment,
  parseDottedOrder,
  textBlocks,
  toolResultBlocks,
} from "../langsmith.js";
import { ASSISTANT_RUN_NAME, USER_PROMPT_TURN_NAME } from "../constants.js";
import { codingAgentMetadata, skillNameFromTool } from "../metadata.js";
import {
  clearRepoAttributionCache,
  originScopedMetadata,
  repoScopedMetadata,
  toolOrigin,
} from "../repo-attribution.js";
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
  ToolResultBlock,
  ToolResultContent,
  TranscriptMessage,
  Turn,
} from "../types.js";
import {
  lastLineUuid,
  metaToolUseId,
  subagentIdOf,
  subagentTranscriptPath,
} from "./subagent-files.js";
import {
  AGENT_NATIVE_TOOL_NAME,
  AGENT_RUN_NAME,
  AGENT_TOOL_NAMES,
  ASYNC_LAUNCHED_STATUS,
  BUILDER_STATE_VERSION,
  COMPACT_BOUNDARY_SUBTYPE,
  COMPACTION_RUN_NAME,
  DEFAULT_COMPACT_TRIGGER,
  DEFAULT_SUBAGENT_TYPE,
  END_TURN,
  HOOK_EVENTS,
  MAIN_THREAD,
  NO_MESSAGE_ID,
  NO_TOOL_RESULT,
  SESSION_ENDED_ERROR,
  TRANSCRIPT_EXTENSION,
  SUBAGENT_CHAIN_SUFFIX,
  TOOL_INTERRUPTED_ERROR,
  TRACING_MODE_STRICTNESS,
  USER_INTERRUPT_ERROR,
} from "./tracer-builder-constants.js";
import type {
  BuilderState,
  ClaudeLine,
  Message,
  NoteDetails,
  OpenRun,
  OpenTool,
  RunPlace,
  Thread,
  ToolCloseOutcome,
  ToolResult,
} from "./tracer-builder-models.js";
import type {
  CreateTranscriptBuilder,
  HookNote,
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

function rootPlace(id: string, start: string): RunPlace {
  return { id, traceId: id, dottedOrder: generateDottedOrderSegment(start, id) };
}

function isMainTranscript(path: string, sessionId: string): boolean {
  return basename(path) === `${sessionId}${TRANSCRIPT_EXTENSION}`;
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
  return { mode, agentType, llmIndex: 0, endTurnSeen: false, pendingInputs: [], lastText: "" };
}

function freshState(): BuilderState {
  return {
    version: BUILDER_STATE_VERSION,
    sessionMode: "full",
    turnCount: 0,
    turns: {},
    threads: { [MAIN_THREAD]: freshThread("full", "root") },
    tools: {},
    hookTimes: {},
  };
}

function restoredState(saved: unknown): BuilderState {
  const candidate = saved as Partial<BuilderState> | undefined;
  return candidate?.version === BUILDER_STATE_VERSION ? (candidate as BuilderState) : freshState();
}

export const createTranscriptBuilder: CreateTranscriptBuilder = ({
  sessionId,
  savedState,
  sink,
}) => {
  const state = restoredState(savedState);
  const main = () => state.threads[MAIN_THREAD];

  const metadata = (options: Omit<ClaudeMetadataOptions, "sessionId">) =>
    codingAgentMetadata({
      sessionId,
      runtimeVersion: state.runtimeVersion,
      ...options,
      base: { ...state.baseMetadata, ...options.base },
    });

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

  function patchRun(
    run: OpenRun,
    end: string,
    content: { outputs?: unknown; error?: string; metadata?: CodingAgentMetadataOptions },
  ) {
    sink.patch({
      ...runIdentity(run),
      end_time: later(run.start, end)!,
      ...content,
      metadata: content.metadata ?? run.metadata,
    });
  }

  function openRun(
    place: RunPlace,
    parent: RunPlace | undefined,
    fields: Pick<OpenRun, "name" | "runType" | "start" | "mode" | "metadata">,
  ): OpenRun {
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
    const startTime = start?.time ?? iso(Date.parse(lineTime) + (state.hookClockOffset ?? 0));
    const id = start
      ? stableRunId(startTime, sessionId, turnNumber)
      : stableRunId(startTime, sessionId, promptId, turnNumber);
    const notifiedTool = pendingPrompt?.notificationOf
      ? state.tools[pendingPrompt.notificationOf]
      : undefined;
    const parent = notifiedTool?.run ?? outsideParent(start?.parentDottedOrder);
    const place = parent ? childPlace(parent, id, startTime) : rootPlace(id, startTime);
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
    postRun(run, { inputs: { messages } });
    state.turns[id] = {
      run,
      promptId,
      turnNumber,
      approvalPolicy,
      typedSkill: content === undefined ? undefined : typedSkillName(content),
      stopped: false,
      toolOrigins: [],
    };
    if (notifiedTool?.launch) notifiedTool.launch.notificationTurn = id;
    state.currentTurn = id;
    state.lastTurnPlace = place;
    state.pendingStart = undefined;
    state.pendingPrompt = undefined;
    state.hookTimes = {};
    clearRepoAttributionCache();
    state.threads[MAIN_THREAD] = {
      ...freshThread(mode, "root"),
      parent: place,
      ownerId: id,
      promptId,
      turnNumber,
      pendingInputs: [...messages, ...main().pendingInputs],
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
      if (tool.turnId !== turnId || tool.launch) continue;
      const end = tool.result?.time ?? turn.run.end ?? turn.run.start;
      closeToolNow(tool, {
        output: NO_TOOL_RESULT,
        end,
        error: outcome.error && TOOL_INTERRUPTED_ERROR,
      });
    }
    maybeCloseTurn(turnId);
  }

  function maybeCloseTurn(turnId: string | undefined) {
    const turn = turnId === undefined ? undefined : state.turns[turnId];
    if (turn === undefined || !turn.stopped) return;
    if (Object.values(state.tools).some((tool) => tool.turnId === turnId)) return;
    delete state.turns[turnId!];
    const messages = turn.text ? [{ role: "assistant", content: turn.text }] : [];
    patchRun(turn.run, turn.run.end ?? turn.run.start, {
      outputs: { messages },
      ...(turn.error ? { error: turn.error } : {}),
      metadata: metadata({
        base: turn.gitMetadata,
        turnId: turn.promptId,
        turnNumber: turn.turnNumber,
        approvalPolicy: turn.approvalPolicy,
        agentType: "root",
      }),
    });
    const notified = Object.values(state.tools).find(
      (tool) => tool.launch?.notificationTurn === turnId,
    );
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
    const content = (
      Array.isArray(line.message?.content) ? line.message.content : []
    ) as ContentBlock[];
    thread.call ??= {
      messageId,
      index: thread.llmIndex++,
      start: time,
      end: time,
      content: [],
      model: stripModelDateSuffix(line.message?.model ?? ""),
      usage: line.message?.usage ?? { input_tokens: 0, output_tokens: 0 },
      inputs: thread.pendingInputs,
    };
    thread.pendingInputs = [];
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
    const typedSkill =
      threadKey === MAIN_THREAD && call.index === 0 && call.inputs.length > 1
        ? state.turns[thread.ownerId!]?.typedSkill
        : undefined;
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
    postRun(run, {
      inputs: { messages: call.inputs },
      outputs: { messages: assistantMessages(merged) },
    });
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
          state.baseMetadata,
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
    if (!isAgent) tool.input = undefined;
    if (tool.result) finishTool(tool, tool.result);
  }

  function readToolResult(
    threadKey: string,
    line: ClaudeLine,
    block: ToolResultBlock,
    time: string,
  ) {
    const thread = state.threads[threadKey];
    thread.pendingInputs.push({
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
      agentId:
        typeof line.toolUseResult?.agentId === "string" ? line.toolUseResult.agentId : undefined,
      agentType:
        typeof line.toolUseResult?.agentType === "string"
          ? line.toolUseResult.agentType
          : undefined,
      launched: line.toolUseResult?.status === ASYNC_LAUNCHED_STATUS,
    };
    const call = state.threads[tool.thread]?.call;
    if (call?.messageId === tool.callMessageId) call.toolEnd = later(call.toolEnd, time);
    if (tool.run) finishTool(tool, result);
    else if (tool.callEnd !== undefined) {
      tool.result = result;
      postTool(tool, earlier(tool.callEnd, time));
    } else tool.result = result;
  }

  function finishTool(tool: OpenTool, result: ToolResult) {
    tool.result = undefined;
    if (result.agentId && AGENT_TOOL_NAMES.has(tool.toolName)) {
      linkAgent(tool, result.agentId, result.agentType);
      if (result.launched) {
        tool.launch = {
          agentId: result.agentId,
          output: result.output,
          chainClosed: false,
          notified: false,
        };
        tool.run!.end = result.time;
        if (!state.threads[result.agentId]) tool.launch.chainClosed = true;
        maybeCloseAgentTool(tool);
        return;
      }
    }
    closeToolNow(tool, { output: result.output, error: result.error, end: result.time });
  }

  function closeToolNow(tool: OpenTool, outcome: ToolCloseOutcome) {
    if (tool.agentId && !tool.launch) finishAgent(tool.agentId);
    if (!tool.run) postTool(tool, tool.callEnd ?? outcome.end);
    delete state.tools[tool.toolUseId];
    if (!tool.run) return;
    patchRun(tool.run, outcome.end, {
      outputs: { output: outcome.output },
      ...(outcome.error ? { error: outcome.error } : {}),
      ...(AGENT_TOOL_NAMES.has(tool.toolName) ? { metadata: agentToolMetadata(tool) } : {}),
    });
    const turn = state.turns[tool.turnId ?? ""];
    if (turn) turn.run.end = later(turn.run.end, outcome.end);
    maybeCloseTurn(tool.turnId);
  }

  function agentToolMetadata(tool: OpenTool): CodingAgentMetadataOptions {
    return {
      ...tool.run!.metadata,
      runSpecific: { agent_type: tool.subagentType ?? AGENT_RUN_NAME, agent_id: tool.agentId },
    };
  }

  function linkAgent(tool: OpenTool, agentId: string, agentType: string | undefined) {
    if (state.threads[agentId] || tool.agentId || !tool.run) return;
    const subagentType =
      agentType ??
      ((tool.input as { subagent_type?: unknown } | undefined)?.subagent_type as
        | string
        | undefined) ??
      DEFAULT_SUBAGENT_TYPE;
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
      if (tool.thread !== agentId) continue;
      tool.launch = undefined;
      closeToolNow(tool, {
        output: NO_TOOL_RESULT,
        end: tool.result?.time ?? end,
        error: TOOL_INTERRUPTED_ERROR,
      });
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
    closeToolNow(tool, { output: launch.output, end: tool.run!.end ?? tool.run!.start });
  }

  function notificationTarget(content: unknown): OpenTool | undefined {
    const text = textOf(content);
    return Object.values(state.tools).find(
      (tool) =>
        tool.launch && (text.includes(tool.launch.agentId) || text.includes(tool.toolUseId)),
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
    const target = notificationTarget(line.message?.content);
    const endTurnSeen = state.currentTurn ? thread.endTurnSeen : false;
    if (!startsNewTurn({ ...thread, promptId, endTurnSeen }, line, hasTurn)) {
      thread.pendingInputs.push({ role: "user", content: line.message?.content });
      if (target?.launch) {
        target.launch.notified = true;
        finishAgent(target.launch.agentId);
        maybeCloseAgentTool(target);
      }
      return;
    }
    if (state.currentTurn) {
      stopTurn(state.currentTurn, { error: thread.endTurnSeen ? undefined : USER_INTERRUPT_ERROR });
    }
    thread.pendingInputs = [];
    state.pendingPrompt = {
      time,
      promptId: line.promptId,
      content: line.message?.content as string | Message[],
      approvalPolicy: line.permissionMode,
      ...(target ? { notificationOf: target.toolUseId } : {}),
    };
    if (target?.launch) finishAgent(target.launch.agentId);
    if (state.pendingStart) openTurn(time);
  }

  function readThreadHuman(threadKey: string, line: ClaudeLine) {
    const thread = state.threads[threadKey];
    const message = { role: "user", content: line.message?.content };
    if (!startsNewTurn(thread, line, thread.prompted === true)) {
      thread.pendingInputs.push(message);
      return;
    }
    finishCall(threadKey);
    const content = line.message?.content as Turn["userContent"];
    thread.promptId = line.promptId;
    thread.prompted = true;
    thread.turnNumber = (thread.turnNumber ?? 0) + 1;
    thread.llmIndex = 0;
    thread.endTurnSeen = false;
    thread.pendingInputs = [
      { role: "user", content: textBlocks(stripContentMarkup(content) ?? content) },
    ];
  }

  function readCompaction(line: ClaudeLine, time: string) {
    if (line.subtype === COMPACT_BOUNDARY_SUBTYPE) {
      flushCompaction(undefined);
      state.compaction = {
        start: state.preCompact?.time ?? time,
        end: time,
        trigger: line.compactMetadata?.trigger ?? DEFAULT_COMPACT_TRIGGER,
        mode: state.preCompact?.mode,
      };
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
    if (typeof line.cwd === "string") state.cwd = line.cwd;
    if (readCompaction(line, time)) return;
    if (line.isSidechain) return;
    if (line.type === "assistant") {
      if (state.currentTurn === undefined) openTurn(time);
      readAssistant(MAIN_THREAD, line, time);
    } else if (line.type === "user") readUserLine(MAIN_THREAD, line, time);
    main().lastTime = later(main().lastTime, time);
  }

  function readSubagentLine(agentId: string, line: ClaudeLine, time: string) {
    const thread = state.threads[agentId];
    thread.lastTime = later(thread.lastTime, time);
    const launchCopy = blocksOf<{ id?: string; tool_use_id?: string }>(
      line,
      line.type === "assistant" ? "tool_use" : "tool_result",
    ).some((block) => (block.id ?? block.tool_use_id) === thread.toolUseId);
    if (launchCopy) return;
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
    if (state.mainPath === undefined && isMainTranscript(transcriptPath, sessionId))
      state.mainPath = transcriptPath;
    const time = line.timestamp;
    if (typeof time === "string") state.lastTime = later(state.lastTime, time);
    if (transcriptPath === state.mainPath) {
      if (typeof time === "string") readMainLine(line, time);
      return;
    }
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
    for (const agentId of Object.keys(state.threads)) {
      if (agentId !== MAIN_THREAD) closeSubagent(agentId);
    }
    if (state.currentTurn) stopTurn(state.currentTurn, { error: SESSION_ENDED_ERROR });
    for (const tool of Object.values(state.tools)) {
      const end = tool.run?.end ?? state.lastTime ?? tool.run?.start ?? "";
      if (tool.launch) closeToolNow(tool, { output: tool.launch.output, end });
    }
    for (const [turnId, turn] of Object.entries(state.turns)) {
      turn.stopped = true;
      maybeCloseTurn(turnId);
    }
  }

  function receiveNote(note: HookNote) {
    const details = (note.details ?? {}) as NoteDetails;
    const time = details.time === undefined ? undefined : iso(details.time);
    if (details.metadata) state.baseMetadata = details.metadata;
    if (details.cwd) state.cwd = details.cwd;
    if (state.mainPath === undefined && note.transcriptPath && !note.agentId)
      state.mainPath = note.transcriptPath;
    const toolUseId = details.toolUseId;
    switch (note.event) {
      case HOOK_EVENTS.userPromptSubmit:
        if (note.agentId) return;
        state.sessionMode = note.tracingMode ?? state.sessionMode;
        state.pendingStart = {
          time: time ?? state.lastTime ?? iso(Date.now()),
          mode: state.sessionMode,
          approvalPolicy: details.permissionMode,
          parentDottedOrder: details.parentDottedOrder,
        };
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
        clearRepoAttributionCache();
        turn.gitMetadata = originScopedMetadata(state.baseMetadata, turn.toolOrigins, state.cwd);
        stopTurn(state.currentTurn!, { text: details.lastAssistantMessage });
        return;
      }
      case HOOK_EVENTS.stopFailure: {
        if (note.agentId || state.currentTurn === undefined) return;
        const error = details.errorDetails
          ? `${details.error}: ${details.errorDetails}`
          : details.error;
        stopTurn(state.currentTurn, { error });
        return;
      }
      case HOOK_EVENTS.subagentStop:
        if (note.agentId === undefined) return;
        linkFromMeta(note.agentId);
        finishAgent(note.agentId);
        return;
      case HOOK_EVENTS.preCompact:
        state.preCompact = {
          time: time ?? state.lastTime ?? iso(Date.now()),
          mode: note.tracingMode,
        };
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
    return [
      mainPath,
      ...agents.map((agentId) => subagentTranscriptPath(mainPath, sessionId, agentId)),
    ];
  }

  return {
    lineId: (line) => (typeof line.uuid === "string" ? line.uuid : undefined),
    readLine,
    receiveNote,
    transcripts,
    state: () => state,
  };
};

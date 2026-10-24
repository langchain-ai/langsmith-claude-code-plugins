/**
 * Transcript parsing — reads Claude Code JSONL transcripts and groups
 * messages into Turns (user prompt → LLM calls → tool results).
 */

import { readFileSync, statSync, fstatSync, openSync, readSync, closeSync } from "node:fs";
import { StringDecoder } from "node:string_decoder";
import { MAX_FULL_READ_BYTES, TASK_NOTIFICATION_OPENING } from "./constants.js";
import { readJson } from "./utils/files.js";
import { hashPrompt } from "./utils/ids/prompt-hash.js";
import type {
  TranscriptMessage,
  AssistantMessage,
  ToolResultMessage,
  UserMessage,
  Turn,
  LLMCall,
  ToolCall,
  ContentBlock,
  ToolUseBlock,
  Usage,
  SessionState,
  TranscriptRead,
  TurnPrompt,
  ReadAnchor,
} from "./types.js";

// ─── Low-level parsing ─────────────────────────────────────────────────────

/** Read a JSONL file and return parsed lines after the last read position. */
export function readTranscript(
  filePath: string,
  afterLine: number = -1,
  cutAt?: string,
  turn: TurnPrompt = {},
  anchor: ReadAnchor = {},
): TranscriptRead {
  const { promptAt, promptHash, nextPromptHash } = turn;
  let promptSeen = turn.promptRead ?? false;
  let ownSeen = false;
  let promptId: string | undefined;
  let laterPrompt = false;
  const opensLaterTurn = (message: UserMessage): boolean => {
    if (promptAt === undefined) return false;
    const hash =
      typeof message.message.content === "string" ? hashPrompt(message.message.content) : undefined;
    const own = !ownSeen && hash !== undefined && hash === promptHash;
    if (!own && hash !== undefined && hash === nextPromptHash) return (laterPrompt = true);
    if (!own) {
      if (message.promptId !== undefined && message.promptId === promptId) return false;
      const notification =
        typeof message.message.content === "string" &&
        message.message.content.startsWith(TASK_NOTIFICATION_OPENING);
      const earlier = Date.parse(message.timestamp) < Date.parse(promptAt);
      if (message.promptId === undefined && (notification || earlier)) return false;
      if (promptSeen && !earlier) return (laterPrompt = true);
    }
    ownSeen ||= own;
    promptSeen = true;
    promptId = message.promptId;
    return false;
  };
  const endsBeforeCut = (line: string, unterminated: boolean): boolean => {
    if (cutAt === undefined && promptAt === undefined) return false;
    let message: TranscriptMessage;
    try {
      message = JSON.parse(line) as TranscriptMessage;
    } catch {
      return cutAt !== undefined && unterminated;
    }
    if (!isHumanMessage(message)) return false;
    const pastCut = cutAt !== undefined && !(Date.parse(message.timestamp) <= Date.parse(cutAt));
    return pastCut || opensLaterTurn(message);
  };
  const needle = anchor.last_line_uuid && `"uuid":"${anchor.last_line_uuid}"`;
  let anchorFound = false;
  const alreadyRead = (index: number, line: string): boolean => {
    if (needle) {
      if (anchorFound) return false;
      anchorFound = line.includes(needle);
      return true;
    }
    if (anchor.last_line_at === undefined) return index <= afterLine;
    const timestamp = (readJson(line) as TranscriptMessage | undefined)?.timestamp;
    return !(
      typeof timestamp === "string" && Date.parse(timestamp) > Date.parse(anchor.last_line_at)
    );
  };
  let lastAnchor = anchor;
  const consume = (messages: TranscriptMessage[], line: string): void => {
    const message = readJson(line) as TranscriptMessage | undefined;
    if (message) messages.push(message);
    if (message?.uuid)
      lastAnchor = { last_line_uuid: message.uuid, last_line_at: message.timestamp };
  };
  const finish = (read: Omit<TranscriptRead, "anchor">): TranscriptRead =>
    needle && !anchorFound
      ? readTranscript(filePath, afterLine, cutAt, turn, { last_line_at: anchor.last_line_at })
      : { ...read, anchor: lastAnchor };
  let size: number;
  try {
    size = statSync(filePath).size;
  } catch {
    return { messages: [], lastLine: afterLine, laterPrompt, anchor };
  }

  // For small-to-moderate files, read the whole thing (simple, fast).
  if (size <= MAX_FULL_READ_BYTES) {
    const raw = readFileSync(filePath, "utf-8");

    const messages: TranscriptMessage[] = [];
    let lastLine = afterLine;
    let i = -1;
    const rows = raw.split("\n");

    for (const [row, line] of rows.entries()) {
      if (line.trim() === "") continue;
      i++;
      const read = alreadyRead(i, line);
      if (!read && endsBeforeCut(line, row === rows.length - 1)) break;
      lastLine = i;
      if (read) continue;
      consume(messages, line);
    }
    return finish({ messages, lastLine, laterPrompt });
  }

  // Large file: stream through in chunks to avoid loading everything at once.
  // We still need accurate line indices, but we only parse lines after afterLine.
  const fd = openSync(filePath, "r");
  try {
    const chunkSize = 2 * 1024 * 1024; // 2 MB
    const buf = Buffer.alloc(chunkSize);
    const messages: TranscriptMessage[] = [];
    let lastLine = afterLine;
    let lineIndex = -1; // current line number (0-based)
    let partial = ""; // leftover from previous chunk
    let bytesRead: number;
    let pos = 0;
    let cut = false;
    const decoder = new StringDecoder("utf-8");

    while (!cut && (bytesRead = readSync(fd, buf, 0, chunkSize, pos)) > 0) {
      const chunk = partial + decoder.write(buf.subarray(0, bytesRead));
      partial = "";
      const lines = chunk.split("\n");

      // Last element may be incomplete — save for next iteration.
      partial = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "") continue;
        const read = alreadyRead(lineIndex + 1, trimmed);
        if (!read && endsBeforeCut(trimmed, false)) {
          cut = true;
          break;
        }
        lineIndex++;
        lastLine = lineIndex;
        if (read) continue;
        consume(messages, trimmed);
      }
      pos += bytesRead;
    }

    // Handle final partial line (if file doesn't end with newline).
    const tail = partial.trim();
    const tailRead = tail !== "" && alreadyRead(lineIndex + 1, tail);
    if (!cut && tail !== "" && (tailRead || !endsBeforeCut(tail, true))) {
      lineIndex++;
      lastLine = lineIndex;
      if (!tailRead) consume(messages, tail);
    }

    return finish({ messages, lastLine, laterPrompt });
  } finally {
    closeSync(fd);
  }
}

/**
 * Return the index of the last line in a transcript file, without parsing
 * all the content. Used by UserPromptSubmit to skip to the end of a
 * pre-existing transcript when state is fresh (last_line === -1).
 *
 * Counts newlines in streaming chunks to avoid loading large files into memory.
 */
export function getTranscriptEndLine(filePath: string): number {
  try {
    const size = statSync(filePath).size;
    if (size === 0) return -1;

    // Small files: simple read.
    if (size <= MAX_FULL_READ_BYTES) {
      const raw = readFileSync(filePath, "utf-8");
      const lines = raw.split("\n").filter((l) => l.trim() !== "");
      return lines.length > 0 ? lines.length - 1 : -1;
    }

    // Large files: count non-empty lines by streaming chunks.
    const fd = openSync(filePath, "r");
    try {
      const chunkSize = 1024 * 1024; // 1 MB
      const buf = Buffer.alloc(chunkSize);
      let lineCount = 0;
      let bytesRead: number;
      let pos = 0;
      let partial = "";

      while ((bytesRead = readSync(fd, buf, 0, chunkSize, pos)) > 0) {
        const chunk = partial + buf.toString("utf-8", 0, bytesRead);
        partial = "";
        const lines = chunk.split("\n");
        partial = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim() !== "") lineCount++;
        }
        pos += bytesRead;
      }
      if (partial.trim() !== "") lineCount++;

      return lineCount > 0 ? lineCount - 1 : -1;
    } finally {
      closeSync(fd);
    }
  } catch {
    return -1;
  }
}

/**
 * Read the Claude Code CLI `version` from a transcript tail (→
 * `ls_agent_runtime_version`). Returns `undefined` if not found.
 */
export function readRuntimeVersion(filePath: string): string | undefined {
  let fd: number | undefined;
  try {
    // Open first, then fstat the descriptor (avoids a stat/open TOCTOU race).
    fd = openSync(filePath, "r");
    const size = fstatSync(fd).size;
    if (size === 0) return undefined;

    const window = 64 * 1024; // tail bytes — enough to contain at least one full line
    const start = Math.max(0, size - window);
    const len = size - start;
    const buf = Buffer.alloc(len);
    readSync(fd, buf, 0, len, start);

    const text = buf.toString("utf-8");
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    // Scan from the end for the most recent line carrying a version.
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]) as { version?: unknown };
        if (typeof parsed.version === "string" && parsed.version.length > 0) {
          return parsed.version;
        }
      } catch {
        // Partial/leading line from the tail window or malformed — skip.
      }
    }
  } catch {
    // File missing or unreadable — non-fatal.
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
  return undefined;
}

/** Check if a message is a human user prompt (string content, or array content without tool_result blocks — e.g. images). */
export function isHumanMessage(msg: TranscriptMessage): msg is UserMessage {
  if (msg.type !== "user") return false;
  if (typeof msg.message.content === "string") return true;
  // Array content is a human message if it contains no tool_result blocks
  // (e.g. text + image content blocks).
  if (Array.isArray(msg.message.content)) {
    return !msg.message.content.some((b: { type: string }) => b.type === "tool_result");
  }
  return false;
}

export function turnPrompt(session: SessionState, promptRead = false): TurnPrompt {
  return {
    promptAt: session.current_turn_start,
    promptHash: session.current_turn_prompt_hash,
    promptRead,
  };
}

export function turnOwnsToolUse(path: string, session: SessionState, toolUseId: string): boolean {
  const read = readTranscript(path, session.last_line, undefined, turnPrompt(session), session);
  return (
    !read.laterPrompt ||
    read.messages.some(
      (msg) =>
        isAssistantMessage(msg) &&
        msg.message.content.some((block) => block.type === "tool_use" && block.id === toolUseId),
    )
  );
}

/** Check if a message is a tool result (array content with tool_result blocks). */
export function isToolResult(msg: TranscriptMessage): msg is ToolResultMessage {
  if (msg.type !== "user" || !Array.isArray(msg.message.content)) return false;
  return msg.message.content.some((b: { type: string }) => b.type === "tool_result");
}

/** Check if a message is an assistant message. */
export function isAssistantMessage(msg: TranscriptMessage): msg is AssistantMessage {
  return msg.type === "assistant";
}

/** Strip the date suffix from a model name (e.g. "claude-sonnet-4-5-20250929" → "claude-sonnet-4-5"). */
export function stripModelDateSuffix(model: string): string {
  return model.replace(/-\d{8}$/, "");
}

/** Resolve model provider from Claude Code's routing env, falling back to the model id. */
export function resolveProvider(model: string): string {
  const flag = (name: string) => ["1", "true"].includes((process.env[name] ?? "").toLowerCase());
  if (flag("CLAUDE_CODE_USE_BEDROCK")) return "amazon_bedrock";
  if (flag("CLAUDE_CODE_USE_VERTEX")) return "google_vertex_ai";
  return /^([a-z0-9-]+\.)?anthropic\.claude/.test(model) ? "amazon_bedrock" : "anthropic";
}

export function turnToolInputs(turn: Turn): unknown[] {
  return turn.llmCalls.flatMap((call) => call.toolCalls.map((tool) => tool.tool_use.input));
}

/** Tool snapshots are no longer needed for replay once these turns' cursor is saved.
 *  A call without a result is still pending, even if the enclosing turn ended.
 */
export function completedToolUseIds(turns: Turn[]): string[] {
  return turns.flatMap((turn) =>
    turn.llmCalls.flatMap((call) =>
      call.toolCalls.filter((tool) => tool.result !== undefined).map((tool) => tool.tool_use.id),
    ),
  );
}

// ─── Streaming merge ────────────────────────────────────────────────────────

/**
 * Merge streaming assistant chunks that share the same message.id
 * into a single LLM call with concatenated text and final-chunk usage.
 */
function mergeAssistantChunks(chunks: AssistantMessage[]): {
  content: ContentBlock[];
  model: string;
  usage: Usage;
  effort?: string;
  startTime: string;
  endTime: string;
} {
  if (chunks.length === 0) {
    throw new Error("Cannot merge zero chunks");
  }

  const first = chunks[0];
  const last = chunks[chunks.length - 1];

  // Concatenate all content blocks across chunks, then merge adjacent text blocks.
  const allBlocks: ContentBlock[] = chunks.flatMap((c) => c.message.content);
  const merged = mergeAdjacentTextBlocks(allBlocks);

  return {
    content: merged,
    model: stripModelDateSuffix(first.message.model),
    usage: last.message.usage, // SSE usage is cumulative; last chunk has final totals.
    effort: chunks.find((c) => c.effort)?.effort, // Only some chunks carry effort; take the first.
    startTime: first.timestamp,
    endTime: last.timestamp,
  };
}

/** Merge adjacent text blocks into one (e.g. streaming token fragments). */
function mergeAdjacentTextBlocks(blocks: ContentBlock[]): ContentBlock[] {
  const result: ContentBlock[] = [];
  let textBuffer: string | null = null;

  for (const block of blocks) {
    if (block.type === "text") {
      textBuffer = (textBuffer ?? "") + block.text;
    } else {
      if (textBuffer !== null) {
        result.push({ type: "text", text: textBuffer });
        textBuffer = null;
      }
      result.push(block);
    }
  }
  if (textBuffer !== null) {
    result.push({ type: "text", text: textBuffer });
  }
  return result;
}

// ─── Tool result matching ───────────────────────────────────────────────────

/** Find the tool result for a given tool_use_id from the list of tool result messages. */
function findToolResult(
  toolUseId: string,
  toolResults: ToolResultMessage[],
): { content: string; timestamp: string; agentId?: string } | undefined {
  for (const msg of toolResults) {
    for (const block of msg.message.content) {
      if (block.type === "tool_result" && block.tool_use_id === toolUseId) {
        const content =
          typeof block.content === "string"
            ? block.content
            : (block.content as Array<{ type: string; text: string }>)
                .filter((c) => c.type === "text")
                .map((c) => c.text)
                .join(" ");

        return {
          content,
          timestamp: msg.timestamp,
          agentId: msg.toolUseResult?.agentId,
        };
      }
    }
  }
  return undefined;
}

// ─── Turn grouping ──────────────────────────────────────────────────────────

/**
 * Group a flat list of transcript messages into Turns.
 *
 * A Turn starts with a human user message and includes all subsequent
 * assistant messages and tool results. If messages have promptId metadata,
 * turn boundaries are determined by promptId changes. Otherwise, turns are
 * split whenever a new human message arrives.
 *
 * Turns are only finalized if the assistant completes with stop_reason: "end_turn"
 * (or if stop_reason is not present, for backward compatibility).
 */
export function groupIntoTurns(messages: TranscriptMessage[]): Turn[] {
  const turns: Turn[] = [];

  let currentPromptId: string | undefined | null = null;
  let currentUser: UserMessage | null = null;
  let assistantChunks: Map<string, AssistantMessage[]> = new Map();
  let assistantOrder: string[] = []; // preserve insertion order of message IDs
  let toolResults: ToolResultMessage[] = [];
  let hasStopReasonEndTurn = false;

  function finalizeTurn(forceIncomplete = false): void {
    if (!currentUser) return;
    if (assistantChunks.size === 0) return;

    // Check if turn is complete
    const assistantMessages = Array.from(assistantChunks.values()).flat();
    const hasStopReasonField = assistantMessages.some((m) => m.message.stop_reason !== undefined);
    // A turn is complete if it explicitly ended with end_turn, OR if there's no
    // stop_reason field at all (old transcript format — assume complete).
    // For the last turn in the transcript (forceIncomplete=true) we don't apply the
    // no-stop-reason shortcut: if it's the last thing we read and has no stop_reason,
    // it may have been interrupted mid-stream.
    const isComplete = hasStopReasonEndTurn || (!forceIncomplete && !hasStopReasonField);

    const llmCalls: LLMCall[] = [];

    for (const msgId of assistantOrder) {
      const chunks = assistantChunks.get(msgId);
      if (!chunks || chunks.length === 0) continue;

      const merged = mergeAssistantChunks(chunks);

      // Extract tool_use blocks and match with results.
      const toolUses = merged.content.filter((b): b is ToolUseBlock => b.type === "tool_use");

      const toolCalls: ToolCall[] = toolUses.map((tu) => {
        const result = findToolResult(tu.id, toolResults);
        return {
          tool_use: tu,
          result: result ? { content: result.content, timestamp: result.timestamp } : undefined,
          agentId: result?.agentId,
        };
      });

      llmCalls.push({
        content: merged.content,
        model: merged.model,
        usage: merged.usage,
        effort: merged.effort,
        startTime: merged.startTime,
        endTime: merged.endTime,
        toolCalls,
      });
    }

    turns.push({
      userContent: currentUser.message.content as string | Array<Record<string, unknown>>,
      userTimestamp: currentUser.timestamp,
      llmCalls,
      isComplete,
      promptId: currentUser.promptId,
    });
  }

  for (const msg of messages) {
    if (isHumanMessage(msg)) {
      // Determine if this is a new turn
      // If promptId is available, use it to detect turn boundaries
      // Otherwise, any new human message starts a new turn
      const isNewTurn =
        currentUser === null ||
        (msg.promptId !== undefined && msg.promptId !== currentPromptId) ||
        msg.promptId === undefined;

      if (isNewTurn) {
        // Finalize previous turn and start a new one
        finalizeTurn();
        currentPromptId = msg.promptId;
        currentUser = msg;
        assistantChunks = new Map();
        assistantOrder = [];
        toolResults = [];
        hasStopReasonEndTurn = false;
      }
    } else if (isToolResult(msg)) {
      toolResults.push(msg);
    } else if (isAssistantMessage(msg)) {
      const id = msg.message.id ?? "__no_id__";
      if (!assistantChunks.has(id)) {
        assistantChunks.set(id, []);
        assistantOrder.push(id);
      }
      assistantChunks.get(id)!.push(msg);

      // Check if this is the final chunk with stop_reason: "end_turn"
      if (msg.message.stop_reason === "end_turn") {
        hasStopReasonEndTurn = true;
      }
    }
  }

  // Finalize the last turn (including incomplete ones)
  finalizeTurn(true);

  return turns;
}

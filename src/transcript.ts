/**
 * Transcript parsing — reads Claude Code JSONL transcripts and groups
 * messages into Turns (user prompt → LLM calls → tool results).
 */

import { readFileSync } from "node:fs";
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
} from "./types.js";

// ─── Low-level parsing ─────────────────────────────────────────────────────

/** Read a JSONL file and return parsed lines starting after `afterLine`. */
export function readTranscript(
  filePath: string,
  afterLine: number = -1,
): { messages: TranscriptMessage[]; lastLine: number } {
  const raw = readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim() !== "");

  const messages: TranscriptMessage[] = [];
  let lastLine = afterLine;

  for (let i = 0; i < lines.length; i++) {
    lastLine = i;
    if (i <= afterLine) continue;
    try {
      messages.push(JSON.parse(lines[i]) as TranscriptMessage);
    } catch {
      // Skip malformed lines.
    }
  }

  return { messages, lastLine };
}

/** Check if a message is a human user prompt (string content) vs tool result (array content). */
export function isHumanMessage(msg: TranscriptMessage): msg is UserMessage {
  return msg.type === "user" && typeof msg.message.content === "string";
}

/** Check if a message is a tool result. */
export function isToolResult(msg: TranscriptMessage): msg is ToolResultMessage {
  return msg.type === "user" && Array.isArray(msg.message.content);
}

/** Check if a message is an assistant message. */
export function isAssistantMessage(msg: TranscriptMessage): msg is AssistantMessage {
  return msg.type === "assistant";
}

/** Strip the date suffix from a model name (e.g. "claude-sonnet-4-5-20250929" → "claude-sonnet-4-5"). */
export function stripModelDateSuffix(model: string): string {
  return model.replace(/-\d{8}$/, "");
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
    const isComplete = !hasStopReasonField || hasStopReasonEndTurn || forceIncomplete;

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
        startTime: merged.startTime,
        endTime: merged.endTime,
        toolCalls,
      });
    }

    turns.push({
      userContent: currentUser.message.content,
      userTimestamp: currentUser.timestamp,
      llmCalls,
      isComplete,
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

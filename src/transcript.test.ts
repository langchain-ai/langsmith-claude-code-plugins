import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  readTranscript,
  isHumanMessage,
  isToolResult,
  isAssistantMessage,
  stripModelDateSuffix,
  groupIntoTurns,
} from "./transcript.js";
import type {
  UserMessage,
  ToolResultMessage,
  AssistantMessage,
  TranscriptMessage,
} from "./types.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `transcript-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function writeJsonl(filename: string, lines: object[]): string {
  const path = join(tmpDir, filename);
  writeFileSync(path, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  return path;
}

function makeUser(content: string, ts = "2025-01-01T00:00:00Z", promptId?: string): UserMessage {
  return { type: "user", message: { role: "user", content }, timestamp: ts, promptId };
}

function makeAssistant(
  id: string,
  text: string,
  opts: {
    model?: string;
    ts?: string;
    toolUses?: Array<{ id: string; name: string; input: Record<string, unknown> }>;
    usage?: { input_tokens: number; output_tokens: number };
    stop_reason?: string | null;
  } = {},
): AssistantMessage {
  const content: AssistantMessage["message"]["content"] = [{ type: "text" as const, text }];
  if (opts.toolUses) {
    for (const tu of opts.toolUses) {
      content.push({ type: "tool_use" as const, id: tu.id, name: tu.name, input: tu.input });
    }
  }
  return {
    type: "assistant",
    message: {
      id,
      role: "assistant",
      model: opts.model ?? "claude-sonnet-4-5-20250929",
      content,
      usage: opts.usage ?? { input_tokens: 10, output_tokens: 5 },
      stop_reason: opts.stop_reason,
    },
    timestamp: opts.ts ?? "2025-01-01T00:00:01Z",
  };
}

function makeToolResult(
  toolUseId: string,
  content: string,
  ts = "2025-01-01T00:00:02Z",
  agentId?: string,
): ToolResultMessage {
  const msg: ToolResultMessage = {
    type: "user",
    message: {
      role: "user",
      content: [{ type: "tool_result", tool_use_id: toolUseId, content }],
    },
    timestamp: ts,
  };
  if (agentId) {
    msg.toolUseResult = { agentId };
  }
  return msg;
}

// ─── readTranscript ─────────────────────────────────────────────────────────

describe("readTranscript", () => {
  it("reads all messages from a JSONL file", () => {
    const path = writeJsonl("test.jsonl", [makeUser("Hello"), makeAssistant("msg_1", "Hi there!")]);
    const { messages, lastLine } = readTranscript(path);
    expect(messages).toHaveLength(2);
    expect(lastLine).toBe(1);
  });

  it("skips lines up to afterLine", () => {
    const path = writeJsonl("test.jsonl", [
      makeUser("Hello"),
      makeAssistant("msg_1", "Hi"),
      makeUser("Second"),
      makeAssistant("msg_2", "Response"),
    ]);
    const { messages, lastLine } = readTranscript(path, 1);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ type: "user", message: { content: "Second" } });
    expect(lastLine).toBe(3);
  });

  it("returns empty messages when afterLine is past end", () => {
    const path = writeJsonl("test.jsonl", [makeUser("Hello")]);
    const { messages, lastLine } = readTranscript(path, 100);
    expect(messages).toHaveLength(0);
    // lastLine tracks the actual last line index in the file (0), not the afterLine param
    expect(lastLine).toBe(0);
  });

  it("skips malformed lines", () => {
    const path = join(tmpDir, "bad.jsonl");
    writeFileSync(
      path,
      '{"type":"user","role":"user","content":"ok","timestamp":"2025-01-01T00:00:00Z"}\nnot json\n{"type":"user","role":"user","content":"also ok","timestamp":"2025-01-01T00:00:01Z"}\n',
    );
    const { messages } = readTranscript(path);
    expect(messages).toHaveLength(2);
  });

  it("handles empty file", () => {
    const path = join(tmpDir, "empty.jsonl");
    writeFileSync(path, "");
    const { messages, lastLine } = readTranscript(path);
    expect(messages).toHaveLength(0);
    expect(lastLine).toBe(-1);
  });

  it("handles file with only blank lines", () => {
    const path = join(tmpDir, "blanks.jsonl");
    writeFileSync(path, "\n\n\n");
    const { messages } = readTranscript(path);
    expect(messages).toHaveLength(0);
  });
});

// ─── Message type guards ────────────────────────────────────────────────────

describe("isHumanMessage", () => {
  it("returns true for user message with string content", () => {
    expect(isHumanMessage(makeUser("Hello"))).toBe(true);
  });

  it("returns false for tool result message", () => {
    expect(isHumanMessage(makeToolResult("tool_1", "result"))).toBe(false);
  });

  it("returns false for assistant message", () => {
    expect(isHumanMessage(makeAssistant("msg_1", "Hi"))).toBe(false);
  });
});

describe("isToolResult", () => {
  it("returns true for tool result message", () => {
    expect(isToolResult(makeToolResult("tool_1", "result"))).toBe(true);
  });

  it("returns false for human user message", () => {
    expect(isToolResult(makeUser("Hello"))).toBe(false);
  });

  it("returns false for assistant message", () => {
    expect(isToolResult(makeAssistant("msg_1", "Hi"))).toBe(false);
  });
});

describe("isAssistantMessage", () => {
  it("returns true for assistant message", () => {
    expect(isAssistantMessage(makeAssistant("msg_1", "Hi"))).toBe(true);
  });

  it("returns false for user message", () => {
    expect(isAssistantMessage(makeUser("Hello"))).toBe(false);
  });

  it("returns false for tool result", () => {
    expect(isAssistantMessage(makeToolResult("tool_1", "result"))).toBe(false);
  });
});

// ─── stripModelDateSuffix ───────────────────────────────────────────────────

describe("stripModelDateSuffix", () => {
  it("strips 8-digit date suffix", () => {
    expect(stripModelDateSuffix("claude-sonnet-4-5-20250929")).toBe("claude-sonnet-4-5");
  });

  it("leaves model without date suffix unchanged", () => {
    expect(stripModelDateSuffix("claude-sonnet-4-5")).toBe("claude-sonnet-4-5");
  });

  it("handles claude-haiku model", () => {
    expect(stripModelDateSuffix("claude-haiku-4-5-20250929")).toBe("claude-haiku-4-5");
  });

  it("does not strip non-date suffixes", () => {
    expect(stripModelDateSuffix("claude-sonnet-4-5-beta")).toBe("claude-sonnet-4-5-beta");
  });

  it("handles model with only numbers that are not a date suffix", () => {
    expect(stripModelDateSuffix("claude-3")).toBe("claude-3");
  });
});

// ─── groupIntoTurns ─────────────────────────────────────────────────────────

describe("groupIntoTurns", () => {
  it("groups a simple user/assistant exchange into one turn", () => {
    const messages: TranscriptMessage[] = [makeUser("Hello"), makeAssistant("msg_1", "Hi there!")];
    const turns = groupIntoTurns(messages);
    expect(turns).toHaveLength(1);
    expect(turns[0].userContent).toBe("Hello");
    expect(turns[0].llmCalls).toHaveLength(1);
    expect(turns[0].llmCalls[0].content).toEqual([{ type: "text", text: "Hi there!" }]);
  });

  it("groups multiple turns", () => {
    const messages: TranscriptMessage[] = [
      makeUser("Q1", "2025-01-01T00:00:00Z"),
      makeAssistant("msg_1", "A1", { ts: "2025-01-01T00:00:01Z" }),
      makeUser("Q2", "2025-01-01T00:00:02Z"),
      makeAssistant("msg_2", "A2", { ts: "2025-01-01T00:00:03Z" }),
      makeUser("Q3", "2025-01-01T00:00:04Z"),
      makeAssistant("msg_3", "A3", { ts: "2025-01-01T00:00:05Z" }),
    ];
    const turns = groupIntoTurns(messages);
    expect(turns).toHaveLength(3);
    expect(turns[0].userContent).toBe("Q1");
    expect(turns[1].userContent).toBe("Q2");
    expect(turns[2].userContent).toBe("Q3");
  });

  it("handles tool calls within a turn", () => {
    const messages: TranscriptMessage[] = [
      makeUser("Read file"),
      makeAssistant("msg_1", "I'll read that.", {
        toolUses: [{ id: "tool_1", name: "Read", input: { file_path: "/test.txt" } }],
      }),
      makeToolResult("tool_1", "file contents here"),
      makeAssistant("msg_2", "The file says: file contents here"),
    ];
    const turns = groupIntoTurns(messages);
    expect(turns).toHaveLength(1);
    expect(turns[0].llmCalls).toHaveLength(2);

    // First LLM call has a tool call
    expect(turns[0].llmCalls[0].toolCalls).toHaveLength(1);
    expect(turns[0].llmCalls[0].toolCalls[0].tool_use.name).toBe("Read");
    expect(turns[0].llmCalls[0].toolCalls[0].result?.content).toBe("file contents here");

    // Second LLM call has no tool calls
    expect(turns[0].llmCalls[1].toolCalls).toHaveLength(0);
  });

  it("merges streaming chunks with same message ID", () => {
    const messages: TranscriptMessage[] = [
      makeUser("Tell me a story"),
      {
        type: "assistant",
        message: {
          id: "msg_stream",
          role: "assistant",
          model: "claude-sonnet-4-5-20250929",
          content: [{ type: "text", text: "Once " }],
          usage: { input_tokens: 10, output_tokens: 2 },
        },
        timestamp: "2025-01-01T00:00:01.000Z",
      },
      {
        type: "assistant",
        message: {
          id: "msg_stream",
          role: "assistant",
          model: "claude-sonnet-4-5-20250929",
          content: [{ type: "text", text: "upon " }],
          usage: { input_tokens: 10, output_tokens: 4 },
        },
        timestamp: "2025-01-01T00:00:01.100Z",
      },
      {
        type: "assistant",
        message: {
          id: "msg_stream",
          role: "assistant",
          model: "claude-sonnet-4-5-20250929",
          content: [{ type: "text", text: "a time." }],
          usage: { input_tokens: 10, output_tokens: 8 },
        },
        timestamp: "2025-01-01T00:00:01.200Z",
      },
    ];
    const turns = groupIntoTurns(messages);
    expect(turns).toHaveLength(1);
    expect(turns[0].llmCalls).toHaveLength(1);

    const call = turns[0].llmCalls[0];
    // Text should be merged
    expect(call.content).toEqual([{ type: "text", text: "Once upon a time." }]);
    // Usage from last chunk (cumulative)
    expect(call.usage.output_tokens).toBe(8);
    // Times from first/last chunk
    expect(call.startTime).toBe("2025-01-01T00:00:01.000Z");
    expect(call.endTime).toBe("2025-01-01T00:00:01.200Z");
  });

  it("strips model date suffix", () => {
    const messages: TranscriptMessage[] = [
      makeUser("Hi"),
      makeAssistant("msg_1", "Hello", { model: "claude-sonnet-4-5-20250929" }),
    ];
    const turns = groupIntoTurns(messages);
    expect(turns[0].llmCalls[0].model).toBe("claude-sonnet-4-5");
  });

  it("returns empty array for no messages", () => {
    expect(groupIntoTurns([])).toEqual([]);
  });

  it("returns empty array for only user message with no assistant", () => {
    const turns = groupIntoTurns([makeUser("Hello")]);
    expect(turns).toEqual([]);
  });

  it("returns empty array for only assistant message with no user", () => {
    const turns = groupIntoTurns([makeAssistant("msg_1", "Hi")]);
    expect(turns).toEqual([]);
  });

  it("handles multiple tool calls in one assistant message", () => {
    const messages: TranscriptMessage[] = [
      makeUser("Do two things"),
      makeAssistant("msg_1", "I'll do both.", {
        toolUses: [
          { id: "tool_1", name: "Read", input: { path: "/a" } },
          { id: "tool_2", name: "Read", input: { path: "/b" } },
        ],
      }),
      makeToolResult("tool_1", "content A"),
      makeToolResult("tool_2", "content B"),
      makeAssistant("msg_2", "Done."),
    ];
    const turns = groupIntoTurns(messages);
    expect(turns[0].llmCalls[0].toolCalls).toHaveLength(2);
    expect(turns[0].llmCalls[0].toolCalls[0].result?.content).toBe("content A");
    expect(turns[0].llmCalls[0].toolCalls[1].result?.content).toBe("content B");
  });

  it("preserves agentId from Task tool results", () => {
    const messages: TranscriptMessage[] = [
      makeUser("Run task"),
      makeAssistant("msg_1", "Running task.", {
        toolUses: [{ id: "tool_task", name: "Task", input: { description: "do stuff" } }],
      }),
      makeToolResult("tool_task", "task done", "2025-01-01T00:00:05Z", "agent-abc123"),
      makeAssistant("msg_2", "Task completed."),
    ];
    const turns = groupIntoTurns(messages);
    expect(turns[0].llmCalls[0].toolCalls[0].agentId).toBe("agent-abc123");
  });

  it("handles assistant message with thinking block", () => {
    const messages: TranscriptMessage[] = [
      makeUser("Think about this"),
      {
        type: "assistant",
        message: {
          id: "msg_think",
          role: "assistant",
          model: "claude-sonnet-4-5-20250929",
          content: [
            { type: "thinking", thinking: "Let me consider..." },
            { type: "text", text: "Here's my answer." },
          ],
          usage: { input_tokens: 10, output_tokens: 20 },
        },
        timestamp: "2025-01-01T00:00:01Z",
      },
    ];
    const turns = groupIntoTurns(messages);
    expect(turns[0].llmCalls[0].content).toEqual([
      { type: "thinking", thinking: "Let me consider..." },
      { type: "text", text: "Here's my answer." },
    ]);
  });

  it("handles tool result with no matching tool call", () => {
    const messages: TranscriptMessage[] = [
      makeUser("Hello"),
      makeAssistant("msg_1", "Hi", {
        toolUses: [{ id: "tool_1", name: "Read", input: {} }],
      }),
      // tool result for a different ID
      makeToolResult("tool_nonexistent", "orphan result"),
      makeAssistant("msg_2", "Done"),
    ];
    const turns = groupIntoTurns(messages);
    // Should still work; the tool call just won't have a result
    expect(turns[0].llmCalls[0].toolCalls[0].result).toBeUndefined();
  });

  it("preserves user timestamp", () => {
    const messages: TranscriptMessage[] = [
      makeUser("Hello", "2025-06-15T12:30:00.500Z"),
      makeAssistant("msg_1", "Hi"),
    ];
    const turns = groupIntoTurns(messages);
    expect(turns[0].userTimestamp).toBe("2025-06-15T12:30:00.500Z");
  });
});

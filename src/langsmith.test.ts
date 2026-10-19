import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Turn } from "./types.js";
import { ASSISTANT_RUN_NAME, USER_PROMPT_TURN_NAME } from "./constants.js";

const mockCreateRun = vi.fn().mockResolvedValue(undefined);
const mockUpdateRun = vi.fn().mockResolvedValue(undefined);

const created = (name: string) =>
  mockCreateRun.mock.calls.map(([run]) => run).find((run) => run.name === name);

function timestampFromUuid7(uuid: string): number {
  return Number.parseInt(uuid.replaceAll("-", "").slice(0, 12), 16);
}
let allRunTreeInstances: Array<{ params: Record<string, unknown>; ops: string[] }> = [];

vi.mock("./tracing-engine.js", async () => {
  const { buildCodingAgentMetadata } = await import("@langchain/plugins-base/metadata");
  return {
    turnFiller: async () => (metadata: unknown) => metadata,
    captureRun: async (
      { metadata, ...run }: Record<string, any>,
      _mode?: string,
      _rootRunId?: string,
      operation = "post",
    ) => {
      const params = { ...run, extra: { metadata: buildCodingAgentMetadata(metadata) } };
      allRunTreeInstances.push({ params, ops: [operation === "post" ? "postRun" : "patchRun"] });
      if (operation === "post") mockCreateRun(params);
      else mockUpdateRun((params as unknown as { id: string }).id, params);
    },
  };
});

vi.mock("./logger.js", () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  initLogger: vi.fn(),
}));

import {
  traceTurn,
  completeTurnRun,
  closeAgentToolRun,
  generateDottedOrderSegment,
} from "./langsmith.js";

// ─── completeTurnRun ────────────────────────────────────────────────────────

describe("completeTurnRun", () => {
  beforeEach(() => {
    mockCreateRun.mockClear();
    mockUpdateRun.mockClear();
    allRunTreeInstances = [];
  });

  it("patches the existing Turn run with the real assistant outputs", async () => {
    await completeTurnRun({
      sessionId: "session-123",
      runId: "turn-run-1",
      traceId: "trace-1",
      dottedOrder: "20250101T000000000000Zturn-run-1",
      parentRunId: undefined,
      startTime: "2025-01-01T00:00:00Z",
      lastAssistantMessage: "Here is my final answer.",
      turnId: "prompt_abc",
      turnNumber: 3,
      runtimeVersion: "2.1.181",
      approvalPolicy: "default",
    });

    // Patches (not creates) the root run.
    expect(mockUpdateRun).toHaveBeenCalledTimes(1);
    expect(mockCreateRun).not.toHaveBeenCalled();

    const [patchedId, params] = mockUpdateRun.mock.calls[0];
    expect(patchedId).toBe("turn-run-1");
    expect(params.name).toBe(USER_PROMPT_TURN_NAME);
    expect(params.run_type).toBe("chain");
    expect(params.trace_id).toBe("trace-1");
    expect(params.end_time).toBeTruthy();

    // The actual assistant message must be the output — not a placeholder.
    expect(params.outputs).toEqual({
      messages: [{ role: "assistant", content: "Here is my final answer." }],
    });

    // Root-run metadata contract.
    const meta = (params.extra as Record<string, unknown>).metadata as Record<string, unknown>;
    expect(meta).toMatchObject({
      turn_id: "prompt_abc",
      turn_number: 3,
      approval_policy: "default",
      ls_agent_type: "root",
    });
  });
});

// ─── closeAgentToolRun ──────────────────────────────────────────────────────

describe("closeAgentToolRun", () => {
  beforeEach(() => {
    mockCreateRun.mockClear();
    mockUpdateRun.mockClear();
    allRunTreeInstances = [];
  });

  const taskRunInfo = {
    run_id: "agent-tool-run-1",
    dotted_order: "20250101T000000000000Zagent-tool-run-1",
    deferred: {
      trace_id: "trace-N",
      parent_run_id: "turn-N",
      start_time: "2025-01-01T00:00:00Z",
      inputs: { prompt: "explore" },
      outputs: { agentId: "a46e99ad19d864c31" },
      project_name: "test-project",
    },
  };

  it("patches the open Agent tool run closed when wasOpen=true", async () => {
    await closeAgentToolRun({
      sessionId: "session-123",
      agentId: "a46e99ad19d864c31",
      agentType: "Explore",
      taskRunInfo,
      wasOpen: true,
    });

    // Patches (not creates) the existing Agent tool run.
    expect(mockUpdateRun).toHaveBeenCalledTimes(1);
    expect(mockCreateRun).not.toHaveBeenCalled();
    const [patchedId, params] = mockUpdateRun.mock.calls[0];
    expect(patchedId).toBe("agent-tool-run-1");
    expect(params.name).toBe("Agent");
    expect(params.run_type).toBe("tool");
    expect(params.trace_id).toBe("trace-N");
    expect(params.parent_run_id).toBe("turn-N");
    expect(params.end_time).toBeTruthy();
    expect(params.error).toBeUndefined();

    const meta = (params.extra as Record<string, unknown>).metadata as Record<string, unknown>;
    expect(meta).toMatchObject({
      agent_type: "Explore", // DEPRECATED compat alias
      agent_id: "a46e99ad19d864c31",
      ls_tool_name: "Task",
    });
    expect(meta.ls_subagent_type).toBeUndefined(); // tool run, not a subagent run
  });

  it("creates the Agent tool run already-closed with an error when wasOpen=false (killed subagent)", async () => {
    await closeAgentToolRun({
      sessionId: "session-123",
      agentId: "a46e99ad19d864c31",
      agentType: "Explore",
      taskRunInfo,
      wasOpen: false,
      error: "Subagent killed",
    });

    // Creates (not patches) — SubagentStop never posted it open.
    expect(mockCreateRun).toHaveBeenCalledTimes(1);
    expect(mockUpdateRun).not.toHaveBeenCalled();
    const params = mockCreateRun.mock.calls[0][0];
    expect(params.id).toBe("agent-tool-run-1");
    expect(params.name).toBe("Agent");
    expect(params.end_time).toBeTruthy();
    expect(params.error).toBe("Subagent killed");
  });
});

// ─── generateDottedOrderSegment ─────────────────────────────────────────────

describe("generateDottedOrderSegment", () => {
  it("generates a segment with timestamp and run ID", () => {
    const epoch = new Date("2025-01-01T00:00:00.000Z").getTime();
    const runId = "abc-123";
    const segment = generateDottedOrderSegment(epoch, runId);
    // Should be stripped ISO timestamp + microseconds (000) + Z + runId
    expect(segment).toContain("abc-123");
    expect(segment).toMatch(/^\d{8}T\d{12}Zabc-123$/);
  });

  it("uses microseconds of 000 for consistent ordering", () => {
    const epoch = new Date("2025-01-01T00:00:00.000Z").getTime();
    const seg1 = generateDottedOrderSegment(epoch, "id1");
    const seg2 = generateDottedOrderSegment(epoch, "id2");
    // Both should have same timestamp prefix with 000 microseconds
    expect(seg1).toContain("000Z");
    expect(seg2).toContain("000Z");
    expect(seg1.split("Z")[0]).toBe(seg2.split("Z")[0]);
  });
});

// ─── traceTurn ──────────────────────────────────────────────────────────────

describe("traceTurn", () => {
  beforeEach(() => {
    mockCreateRun.mockClear();
    mockUpdateRun.mockClear();
    allRunTreeInstances = [];
  });

  it("creates a standalone turn when no parentRunId given", async () => {
    const turn: Turn = {
      userContent: "Hello",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [{ type: "text", text: "Hi there!" }],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 5 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [],
        },
      ],
      isComplete: true,
    };

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
    });

    expect(mockCreateRun).toHaveBeenCalledTimes(2);
    expect(mockUpdateRun).not.toHaveBeenCalled();

    const turnCall = created(USER_PROMPT_TURN_NAME);
    expect(turnCall.run_type).toBe("chain");
    expect(turnCall.trace_id).toBe(turnCall.id); // root trace
    expect(turnCall.dotted_order).toBeTruthy();

    const llmCall = created(ASSISTANT_RUN_NAME);
    expect(llmCall.run_type).toBe("llm");
    expect(llmCall.parent_run_id).toBe(turnCall.id);
    expect(llmCall.trace_id).toBe(turnCall.id);
    expect(llmCall.extra.metadata.ls_provider).toBe("anthropic");
    expect(llmCall.extra.metadata.ls_model_name).toBe("claude-sonnet-4-5");
    expect(llmCall.extra.metadata.ls_invocation_params).toEqual({
      model: "claude-sonnet-4-5",
    });

    expect(timestampFromUuid7(turnCall.id)).toBe(Date.parse(turnCall.start_time));
    expect(timestampFromUuid7(llmCall.id)).toBe(Date.parse(llmCall.start_time));
  });

  it.each([
    ["keeps", "high", "standard", { effort: "high", service_tier: "standard" }],
    ["drops empty and null", "", null, {}],
  ] as const)(
    "%s effort and service_tier in ls_invocation_params",
    async (_, effort, tier, extra) => {
      const turn: Turn = {
        userContent: "Hello",
        userTimestamp: "2025-01-01T00:00:00Z",
        llmCalls: [
          {
            content: [{ type: "text", text: "Hi there!" }],
            model: "claude-opus-5",
            usage: { input_tokens: 10, output_tokens: 5, service_tier: tier },
            effort,
            startTime: "2025-01-01T00:00:01Z",
            endTime: "2025-01-01T00:00:02Z",
            toolCalls: [],
          },
        ],
        isComplete: true,
      };

      await traceTurn({ turn, sessionId: "session-123", turnNum: 1 });

      expect(created(ASSISTANT_RUN_NAME).extra.metadata.ls_invocation_params).toEqual({
        model: "claude-opus-5",
        ...extra,
      });
    },
  );

  it("uses existing parentRunId and skips creating turn run", async () => {
    const turn: Turn = {
      userContent: "Hello",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [{ type: "text", text: "Hi there!" }],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 5 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [],
        },
      ],
      isComplete: true,
    };

    const parentRunId = "parent-run-id";
    const traceId = "trace-id";
    const parentDottedOrder = "20250101T000000000Z001parent-run-id";

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
      parentRunId,
      traceId,
      parentDottedOrder,
    });

    // Should only create 1 run (assistant), NOT a turn run
    expect(mockCreateRun).toHaveBeenCalledTimes(1);

    const llmCall = mockCreateRun.mock.calls[0][0];
    expect(llmCall.name).toBe(ASSISTANT_RUN_NAME);
    expect(llmCall.run_type).toBe("llm");
    expect(llmCall.parent_run_id).toBe(parentRunId);
    expect(llmCall.trace_id).toBe(traceId);
    expect(llmCall.dotted_order).toContain(parentDottedOrder);

    expect(mockUpdateRun).not.toHaveBeenCalled();
  });

  it("throws when parentRunId given without trace context", async () => {
    const turn: Turn = {
      userContent: "Hello",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [],
      isComplete: true,
    };

    await expect(
      traceTurn({
        turn,
        sessionId: "session-123",
        turnNum: 1,
        parentRunId: "some-id",
        // missing traceId and parentDottedOrder
      }),
    ).rejects.toThrow("Missing trace context");
  });

  it("creates tool runs as children of turn, not assistant", async () => {
    const turn: Turn = {
      userContent: "Read a file",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [
            { type: "text", text: "I'll read that." },
            { type: "tool_use", id: "tool_1", name: "Read", input: { file_path: "/test.txt" } },
          ],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 15 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [
            {
              tool_use: {
                type: "tool_use",
                id: "tool_1",
                name: "Read",
                input: { file_path: "/test.txt" },
              },
              result: { content: "file contents", timestamp: "2025-01-01T00:00:03Z" },
            },
          ],
        },
      ],
      isComplete: true,
    };

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
    });

    // Should create: turn + assistant + tool = 3 createRun calls
    expect(mockCreateRun).toHaveBeenCalledTimes(3);

    const turnCall = created(USER_PROMPT_TURN_NAME);
    const llmCall = created(ASSISTANT_RUN_NAME);
    const toolCall = created("Read");

    expect(timestampFromUuid7(turnCall.id)).toBe(Date.parse(turnCall.start_time));
    expect(timestampFromUuid7(llmCall.id)).toBe(Date.parse(llmCall.start_time));
    expect(timestampFromUuid7(toolCall.id)).toBe(Date.parse(toolCall.start_time));

    // Tool is child of turn, not assistant
    expect(toolCall.parent_run_id).toBe(turnCall.id);
    expect(toolCall.name).toBe("Read");
    expect(toolCall.run_type).toBe("tool");
    expect(toolCall.inputs).toEqual({ input: { file_path: "/test.txt" } });

    // LLM is also child of turn
    expect(llmCall.parent_run_id).toBe(turnCall.id);

    // Tool output is on createRun (tools are created and completed in one call)
    expect(toolCall.outputs).toEqual({ output: "file contents" });
  });

  it("handles multiple LLM calls in a turn", async () => {
    const turn: Turn = {
      userContent: "Do stuff",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [
            { type: "text", text: "First." },
            { type: "tool_use", id: "tool_1", name: "Read", input: {} },
          ],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 10 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [
            {
              tool_use: { type: "tool_use", id: "tool_1", name: "Read", input: {} },
              result: { content: "data", timestamp: "2025-01-01T00:00:03Z" },
            },
          ],
        },
        {
          content: [{ type: "text", text: "Done." }],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 20, output_tokens: 5 },
          startTime: "2025-01-01T00:00:04Z",
          endTime: "2025-01-01T00:00:05Z",
          toolCalls: [],
        },
      ],
      isComplete: true,
    };

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
    });

    // Should create: turn + assistant1 + tool + assistant2 = 4 createRun calls
    expect(mockCreateRun).toHaveBeenCalledTimes(4);

    // Second assistant should include accumulated context in inputs
    const assistant2Call = mockCreateRun.mock.calls
      .map(([run]) => run)
      .filter((run) => run.name === ASSISTANT_RUN_NAME)[1];
    expect(assistant2Call.inputs.messages).toHaveLength(3); // user + assistant1 + tool_result
    expect(assistant2Call.inputs.messages[0].role).toBe("user");
    expect(assistant2Call.inputs.messages[1].role).toBe("assistant");
    expect(assistant2Call.inputs.messages[2].role).toBe("tool");
  });

  it("includes usage_metadata in assistant run update", async () => {
    const turn: Turn = {
      userContent: "Hi",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [{ type: "text", text: "Hello" }],
          model: "claude-sonnet-4-5",
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_read_input_tokens: 500,
            cache_creation_input_tokens: 200,
          },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [],
        },
      ],
      isComplete: true,
    };

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
    });

    const assistantUpdateArgs = created(ASSISTANT_RUN_NAME);
    expect(assistantUpdateArgs.extra.metadata.usage_metadata).toEqual({
      input_tokens: 800, // 100 + 200 + 500
      output_tokens: 50,
      total_tokens: 850,
      input_token_details: {
        cache_read: 500,
        cache_creation: 200,
      },
    });
  });

  it("filters user messages from standalone turn outputs", async () => {
    const turn: Turn = {
      userContent: "Hi",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [{ type: "text", text: "Hello" }],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 5 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [],
        },
      ],
      isComplete: true,
    };

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
    });

    const turnUpdateArgs = created(USER_PROMPT_TURN_NAME);
    const outputRoles = turnUpdateArgs.outputs.messages.map((m: Record<string, unknown>) => m.role);
    expect(outputRoles).not.toContain("user");
  });

  it("defaults tool result to 'No result' when missing", async () => {
    const turn: Turn = {
      userContent: "Run",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [
            { type: "text", text: "Running." },
            { type: "tool_use", id: "tool_1", name: "Bash", input: { command: "ls" } },
          ],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 10 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [
            {
              tool_use: { type: "tool_use", id: "tool_1", name: "Bash", input: { command: "ls" } },
              // no result
            },
          ],
        },
      ],
      isComplete: true,
    };

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
    });

    const toolCreateArgs = created("Bash");
    expect(toolCreateArgs.outputs).toEqual({ output: "No result" });
  });

  it("skips Task tools already in existingTaskRunMap", async () => {
    const turn: Turn = {
      userContent: "Use a subagent",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [
            { type: "text", text: "I'll use a subagent." },
            { type: "tool_use", id: "tool_1", name: "Task", input: { description: "do stuff" } },
          ],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 15 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [
            {
              tool_use: {
                type: "tool_use",
                id: "tool_1",
                name: "Task",
                input: { description: "do stuff" },
              },
              result: { content: "done", timestamp: "2025-01-01T00:00:03Z" },
              agentId: "agent-1",
            },
          ],
        },
      ],
      isComplete: true,
    };

    const parentRunId = "parent-run-id";
    const traceId = "trace-id";
    const parentDottedOrder = "20250101T000000000Z001parent-run-id";

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
      parentRunId,
      traceId,
      parentDottedOrder,
      existingTaskRunMap: {
        "agent-1": { run_id: "existing-tool-run", dotted_order: "existing-dotted" },
      },
    });

    // Should create only 1 run (assistant), NOT a tool run since it was already traced
    expect(mockCreateRun).toHaveBeenCalledTimes(1);
    expect(mockCreateRun.mock.calls[0][0].run_type).toBe("llm");
  });

  it("returns taskRunMap for Task tools with agentId", async () => {
    const turn: Turn = {
      userContent: "Use a subagent",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [
            { type: "text", text: "Spawning." },
            { type: "tool_use", id: "tool_1", name: "Task", input: { description: "do stuff" } },
          ],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 15 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [
            {
              tool_use: {
                type: "tool_use",
                id: "tool_1",
                name: "Task",
                input: { description: "do stuff" },
              },
              result: { content: "done", timestamp: "2025-01-01T00:00:03Z" },
              agentId: "agent-1",
            },
          ],
        },
      ],
      isComplete: true,
    };

    const result = await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
    });

    // Should return a taskRunMap entry for the agent
    expect(result["agent-1"]).toBeDefined();
    expect(result["agent-1"].run_id).toBeTruthy();
    expect(result["agent-1"].dotted_order).toBeTruthy();
  });

  it("marks interrupted turns with error when standalone", async () => {
    const turn: Turn = {
      userContent: "Hello",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [{ type: "text", text: "I was interrupted" }],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 5 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [],
        },
      ],
      isComplete: false, // interrupted
    };

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
    });

    expect(created(USER_PROMPT_TURN_NAME).error).toBe("Interrupted");
  });

  it("attaches customMetadata to standalone turn creation and completion", async () => {
    const turn: Turn = {
      userContent: "Hello",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [{ type: "text", text: "Hi there!" }],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 5 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [],
        },
      ],
      isComplete: true,
    };

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
      customMetadata: { pr_url: "https://github.com/org/repo/pull/42", pr_author: "octocat" },
    });

    const turnPostInstances = allRunTreeInstances.filter(
      (i) => i.ops.includes("postRun") && i.params.name === USER_PROMPT_TURN_NAME,
    );
    expect(turnPostInstances).toHaveLength(1);
    const turnCreateMetadata = (turnPostInstances[0].params.extra as Record<string, unknown>)
      ?.metadata as Record<string, unknown>;
    expect(turnCreateMetadata.pr_url).toBe("https://github.com/org/repo/pull/42");
    expect(turnCreateMetadata.pr_author).toBe("octocat");
    // Standard metadata should still be present
    expect(turnCreateMetadata.thread_id).toBe("session-123");
    expect(turnCreateMetadata.ls_integration).toBe("claude-code");
  });

  it("attaches customMetadata to child LLM runs", async () => {
    const turn: Turn = {
      userContent: "Hello",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [{ type: "text", text: "Hi there!" }],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 5 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [],
        },
      ],
      isComplete: true,
    };

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
      customMetadata: { pr_url: "https://github.com/org/repo/pull/42" },
    });

    const llmPatchInstances = allRunTreeInstances.filter((i) => i.params.run_type === "llm");
    expect(llmPatchInstances).toHaveLength(1);
    const llmMetadata = (llmPatchInstances[0].params.extra as Record<string, unknown>)
      ?.metadata as Record<string, unknown>;
    expect(llmMetadata.pr_url).toBe("https://github.com/org/repo/pull/42");
    // Standard LLM metadata should still be present
    expect(llmMetadata.ls_provider).toBe("anthropic");
    expect(llmMetadata.ls_model_name).toBe("claude-sonnet-4-5");
  });

  it("stamps coding-agent-v1 keys (turn_id/turn_number/runtime/approval) on every run", async () => {
    const turn: Turn = {
      userContent: "Hello",
      userTimestamp: "2025-01-01T00:00:00Z",
      promptId: "prompt_xyz",
      llmCalls: [
        {
          content: [{ type: "text", text: "Hi" }],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 5 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [
            {
              tool_use: { type: "tool_use", id: "tu_1", name: "Bash", input: { command: "ls" } },
              result: { content: "ok", timestamp: "2025-01-01T00:00:03Z" },
            },
          ],
        },
      ],
      isComplete: false, // force standalone (root) turn creation + completion
    };

    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 7,
      customMetadata: { ls_integration_version: "0.1.3" },
      runtimeVersion: "2.1.181",
      approvalPolicy: "acceptEdits",
    });

    // Tool run (postRun) — has turn_id, turn_number, runtime version, tool_name compat.
    const toolPost = allRunTreeInstances.find(
      (i) => i.params.run_type === "tool" && i.ops.includes("postRun"),
    )!;
    const toolMeta = (toolPost.params.extra as Record<string, unknown>).metadata as Record<
      string,
      unknown
    >;
    expect(toolMeta).toMatchObject({
      ls_agent_purpose: "coding",
      ls_integration: "claude-code",
      ls_agent_runtime: "Claude Code",
      ls_trace_schema_version: "coding-agent-v1",
      thread_id: "session-123",
      turn_id: "prompt_xyz",
      turn_number: 7,
      ls_agent_runtime_version: "2.1.181",
      ls_integration_version: "0.1.3",
      tool_name: "Bash", // DEPRECATED compat alias
    });
    expect(toolMeta.ls_tool_name).toBeUndefined(); // equals run name → omitted
    expect(toolMeta.approval_policy).toBeUndefined(); // tool runs never get approval_policy

    // LLM run: contract keys + preserved model conventions.
    const llmPatch = allRunTreeInstances.find((i) => i.params.run_type === "llm")!;
    const llmMeta = (llmPatch.params.extra as Record<string, unknown>).metadata as Record<
      string,
      unknown
    >;
    expect(llmMeta).toMatchObject({
      turn_id: "prompt_xyz",
      turn_number: 7,
      ls_agent_runtime_version: "2.1.181",
      ls_provider: "anthropic",
    });
    expect(llmMeta.ls_agent_type).toBe("root");

    // Standalone (root) turn: approval_policy + ls_agent_type.
    const turnPatch = allRunTreeInstances.find((i) => i.params.name === USER_PROMPT_TURN_NAME)!;
    const turnMeta = (turnPatch.params.extra as Record<string, unknown>).metadata as Record<
      string,
      unknown
    >;
    expect(turnMeta).toMatchObject({
      turn_id: "prompt_xyz",
      turn_number: 7,
      approval_policy: "acceptEdits",
      ls_agent_type: "root",
    });
    expect(turnMeta.ls_subagent_type).toBeUndefined(); // never on root
  });
});

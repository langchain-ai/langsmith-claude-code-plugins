import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Turn } from "./types.js";
import { ASSISTANT_RUN_NAME, USER_PROMPT_TURN_NAME } from "./constants.js";

const mockCreateRun = vi.fn().mockResolvedValue(undefined);
const mockUpdateRun = vi.fn().mockResolvedValue(undefined);
const mockAwaitPendingTraceBatches = vi.fn().mockResolvedValue(undefined);

// Track the last RunTree params for assertions
let lastRunTreeParams: Record<string, unknown> | null = null;
// Track all RunTree instances with their operations
let allRunTreeInstances: Array<{ params: Record<string, unknown>; ops: string[] }> = [];

vi.mock("langsmith", () => {
  class MockClient {
    createRun = mockCreateRun;
    updateRun = mockUpdateRun;
    awaitPendingTraceBatches = mockAwaitPendingTraceBatches;
  }
  class MockRunTree {
    client: MockClient | undefined;
    params: Record<string, unknown>;
    _tracker: { params: Record<string, unknown>; ops: string[] };
    constructor(params: { client?: MockClient; id: string } & Record<string, unknown>) {
      this.client = params.client;
      this.params = params;
      lastRunTreeParams = params;
      this._tracker = { params, ops: [] };
      allRunTreeInstances.push(this._tracker);
    }
    postRun() {
      this._tracker.ops.push("postRun");
      // Only call createRun if client exists (for non-replica-only mode)
      if (this.client) {
        this.client.createRun(this.params);
      }
    }
    patchRun() {
      this._tracker.ops.push("patchRun");
      // Only call updateRun if client exists (for non-replica-only mode)
      if (this.client) {
        this.client.updateRun(this.params.id, this.params);
      }
    }
  }

  return {
    RunTree: MockRunTree,
    Client: MockClient,
    uuid7: () => `test-uuid-${Math.random().toString(36).slice(2, 15)}`,
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
  initTracing,
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
    mockAwaitPendingTraceBatches.mockClear();
    allRunTreeInstances = [];
    initTracing("test-api-key", "https://test.api.com");
  });

  it("patches the existing Turn run with the real assistant outputs", async () => {
    await completeTurnRun({
      sessionId: "session-123",
      runId: "turn-run-1",
      traceId: "trace-1",
      dottedOrder: "20250101T000000000000Zturn-run-1",
      parentRunId: undefined,
      startTime: "2025-01-01T00:00:00Z",
      project: "test-project",
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
      ls_agent_type: "root", // DEPRECATED compat alias
    });
  });
});

// ─── closeAgentToolRun ──────────────────────────────────────────────────────

describe("closeAgentToolRun", () => {
  beforeEach(() => {
    mockCreateRun.mockClear();
    mockUpdateRun.mockClear();
    allRunTreeInstances = [];
    initTracing("test-api-key", "https://test.api.com");
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
      project: "test-project",
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
      project: "test-project",
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
    mockAwaitPendingTraceBatches.mockClear();
    allRunTreeInstances = [];
    initTracing("test-api-key", "https://test.api.com");
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
      project: "test-project",
    });

    // Should create: turn run + assistant run = 2 createRun calls
    expect(mockCreateRun).toHaveBeenCalledTimes(2);

    // First call creates the standalone turn
    const turnCall = mockCreateRun.mock.calls[0][0];
    expect(turnCall.name).toBe(USER_PROMPT_TURN_NAME);
    expect(turnCall.run_type).toBe("chain");
    expect(turnCall.trace_id).toBe(turnCall.id); // root trace
    expect(turnCall.dotted_order).toBeTruthy();

    // Second call creates the assistant LLM run (bare — no metadata on createRun)
    const llmCall = mockCreateRun.mock.calls[1][0];
    expect(llmCall.name).toBe(ASSISTANT_RUN_NAME);
    expect(llmCall.run_type).toBe("llm");
    expect(llmCall.parent_run_id).toBe(turnCall.id);
    expect(llmCall.trace_id).toBe(turnCall.id);

    // Should update: assistant run + turn run = 2 updateRun calls
    expect(mockUpdateRun).toHaveBeenCalledTimes(2);

    // Metadata is on the assistant updateRun, not createRun
    const assistantUpdateArgs = mockUpdateRun.mock.calls[0][1];
    expect(assistantUpdateArgs.extra.metadata.ls_provider).toBe("anthropic");
    expect(assistantUpdateArgs.extra.metadata.ls_model_name).toBe("claude-sonnet-4-5");
    expect(assistantUpdateArgs.extra.metadata.ls_invocation_params.model).toBe("claude-sonnet-4-5");
  });

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
      project: "test-project",
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

    // Should only update 1 run (assistant), no turn update
    expect(mockUpdateRun).toHaveBeenCalledTimes(1);
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
        project: "test-project",
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
      project: "test-project",
    });

    // Should create: turn + assistant + tool = 3 createRun calls
    expect(mockCreateRun).toHaveBeenCalledTimes(3);

    const turnCall = mockCreateRun.mock.calls[0][0];
    const llmCall = mockCreateRun.mock.calls[1][0];
    const toolCall = mockCreateRun.mock.calls[2][0];

    // Tool is child of turn, not assistant
    expect(toolCall.parent_run_id).toBe(turnCall.id);
    expect(toolCall.name).toBe("Read");
    expect(toolCall.run_type).toBe("tool");
    expect(toolCall.inputs).toEqual({ input: { file_path: "/test.txt" } });

    // LLM is also child of turn
    expect(llmCall.parent_run_id).toBe(turnCall.id);

    // Should update: assistant + turn = 2 updateRun calls (tools are single createRun)
    expect(mockUpdateRun).toHaveBeenCalledTimes(2);

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
      project: "test-project",
    });

    // Should create: turn + assistant1 + tool + assistant2 = 4 createRun calls
    expect(mockCreateRun).toHaveBeenCalledTimes(4);

    // Second assistant should include accumulated context in inputs
    const assistant2Call = mockCreateRun.mock.calls[3][0];
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
      project: "test-project",
    });

    // First updateRun call is the assistant run (before the turn update)
    const assistantUpdateArgs = mockUpdateRun.mock.calls[0][1];
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
      project: "test-project",
    });

    // Last updateRun call is the turn completion (standalone turn)
    const turnUpdateArgs = mockUpdateRun.mock.calls[mockUpdateRun.mock.calls.length - 1][1];
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
      project: "test-project",
    });

    // Tool output is on createRun (tools are created and completed in one call)
    // createRun: turn (0), assistant (1), tool (2)
    const toolCreateArgs = mockCreateRun.mock.calls[2][0];
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
      project: "test-project",
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
      project: "test-project",
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
      project: "test-project",
    });

    // Last updateRun call is the turn completion
    const turnUpdateArgs = mockUpdateRun.mock.calls[mockUpdateRun.mock.calls.length - 1][1];
    expect(turnUpdateArgs.error).toBe("Interrupted");
  });

  it("passes replicas to RunTree when provided", async () => {
    const replicas = [
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_workspace_a",
        projectName: "project-prod",
      },
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_workspace_b",
        projectName: "project-staging",
        updates: { metadata: { environment: "staging" } },
      },
    ];

    // Re-initialize with replicas
    initTracing("test-api-key", "https://test.api.com", replicas);

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
      project: "test-project",
    });

    // Check that replicas were passed to RunTree
    expect(lastRunTreeParams).toBeDefined();
    expect(lastRunTreeParams?.replicas).toEqual(replicas);
  });

  it("works with replicas only (no client API key)", async () => {
    // Initialize with no API key but with replicas
    initTracing(undefined, undefined, [
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_replica",
        projectName: "project-replica",
      },
    ]);

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

    // Should not throw even without client
    await expect(
      traceTurn({
        turn,
        sessionId: "session-123",
        turnNum: 1,
        project: "test-project",
      }),
    ).resolves.not.toThrow();

    // RunTree should still be created with replicas
    expect(lastRunTreeParams).toBeDefined();
    expect(lastRunTreeParams?.replicas).toBeDefined();
    expect(lastRunTreeParams?.replicas).toHaveLength(1);
    // With redaction on (the default), a client is created even without an API
    // key so replica posts are anonymized rather than falling back to the
    // shared client, which carries no anonymizer.
    expect(lastRunTreeParams?.client).toBeDefined();
  });

  it("uses no client in replicas-only mode when redaction is disabled", async () => {
    // redact=false restores the original optimization: no explicit client, so
    // RunTree dispatches replica posts via the shared client.
    initTracing(
      undefined,
      undefined,
      [
        {
          apiUrl: "https://api.smith.langchain.com",
          apiKey: "ls__key_replica",
          projectName: "project-replica",
        },
      ],
      false,
    );

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

    await expect(
      traceTurn({ turn, sessionId: "session-123", turnNum: 1, project: "test-project" }),
    ).resolves.not.toThrow();

    expect(lastRunTreeParams?.replicas).toHaveLength(1);
    expect(lastRunTreeParams?.client).toBeUndefined();
  });

  it("throws when neither client nor replicas are initialized", async () => {
    // Initialize with no client and no replicas
    initTracing(undefined, undefined, undefined);

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
        project: "test-project",
      }),
    ).rejects.toThrow("LangSmith client not initialized");
  });

  it("passes replicas with updates field to RunTree", async () => {
    const replicas = [
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_workspace_a",
        projectName: "project-prod",
      },
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_workspace_b",
        projectName: "project-staging",
        updates: { metadata: { environment: "staging" } },
      },
    ];

    initTracing("test-api-key", "https://test.api.com", replicas);

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
      project: "test-project",
    });

    // Check that replicas with updates field was passed correctly
    expect(lastRunTreeParams?.replicas).toHaveLength(2);
    expect((lastRunTreeParams?.replicas as any)?.[1]).toHaveProperty("updates");
    expect((lastRunTreeParams?.replicas as any)?.[1].updates).toEqual({
      metadata: { environment: "staging" },
    });
  });

  it("traces to multiple different projects via replicas", async () => {
    const replicas = [
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_prod_workspace",
        projectName: "production-project",
      },
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_staging_workspace",
        projectName: "staging-project",
      },
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_dev_workspace",
        projectName: "dev-project",
      },
    ];

    initTracing("test-api-key", "https://test.api.com", replicas);

    const turn: Turn = {
      userContent: "Hello",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [{ type: "text", text: "Hi!" }],
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
      project: "test-project",
    });

    // Verify all three project destinations are in replicas
    expect(lastRunTreeParams?.replicas).toHaveLength(3);
    const projectNames = (lastRunTreeParams?.replicas as any[])?.map((r) => r.projectName);
    expect(projectNames).toContain("production-project");
    expect(projectNames).toContain("staging-project");
    expect(projectNames).toContain("dev-project");
  });

  it("works with replicas-only mode tracing to different projects", async () => {
    // No primary client - only replicas
    const replicas = [
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_workspace_a",
        projectName: "project-prod",
      },
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_workspace_b",
        projectName: "project-staging",
        updates: { metadata: { environment: "staging" } },
      },
    ];

    // Initialize with no API key, no API URL, only replicas
    initTracing(undefined, undefined, replicas);

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

    // Should successfully trace without a primary client
    await expect(
      traceTurn({
        turn,
        sessionId: "session-123",
        turnNum: 1,
        project: "test-project",
      }),
    ).resolves.not.toThrow();

    // Verify replicas are passed correctly
    expect(lastRunTreeParams?.replicas).toHaveLength(2);
    // Redaction is on by default, so a client is created to carry the
    // anonymizer even though no primary API key was provided.
    expect(lastRunTreeParams?.client).toBeDefined();

    // Verify both project destinations
    const projectNames = (lastRunTreeParams?.replicas as any[])?.map((r) => r.projectName);
    expect(projectNames).toContain("project-prod");
    expect(projectNames).toContain("project-staging");
  });

  it("supports replicas with different API URLs (multi-tenant)", async () => {
    const replicas = [
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_langsmith",
        projectName: "langsmith-project",
      },
      {
        apiUrl: "https://custom.langsmith.enterprise.com",
        apiKey: "ls__key_enterprise",
        projectName: "enterprise-project",
      },
    ];

    initTracing(undefined, undefined, replicas);

    const turn: Turn = {
      userContent: "Hello",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [{ type: "text", text: "Hi!" }],
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
      project: "test-project",
    });

    // Verify different API URLs are preserved
    const apiUrls = (lastRunTreeParams?.replicas as any[])?.map((r) => r.apiUrl);
    expect(apiUrls).toContain("https://api.smith.langchain.com");
    expect(apiUrls).toContain("https://custom.langsmith.enterprise.com");
  });

  it("applies updates metadata to replica runs", async () => {
    const replicas = [
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_with_updates",
        projectName: "project-with-metadata",
        updates: {
          metadata: {
            environment: "production",
            version: "1.0.0",
            team: "platform",
          },
        },
      },
    ];

    initTracing(undefined, undefined, replicas);

    const turn: Turn = {
      userContent: "Hello",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [{ type: "text", text: "Hi!" }],
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
      project: "test-project",
    });

    // Verify updates are passed through
    expect(lastRunTreeParams?.replicas).toHaveLength(1);
    expect((lastRunTreeParams?.replicas as any[])?.[0].updates).toEqual({
      metadata: {
        environment: "production",
        version: "1.0.0",
        team: "platform",
      },
    });
  });

  it("sets project_name consistently on patchRun RunTree instances (standalone turn)", async () => {
    const replicas = [
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_a",
        projectName: "project-a",
      },
    ];

    initTracing("test-api-key", "https://test.api.com", replicas);
    allRunTreeInstances = [];

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

    // Standalone turn (no parentRunId) creates the turn run itself
    await traceTurn({
      turn,
      sessionId: "session-123",
      turnNum: 1,
      project: "test-project",
    });

    // Every RunTree used for patchRun must have project_name and run_type set
    const patchInstances = allRunTreeInstances.filter((i) => i.ops.includes("patchRun"));
    expect(patchInstances.length).toBeGreaterThan(0);
    for (const inst of patchInstances) {
      expect(inst.params.project_name).toBe("test-project");
      expect(inst.params.run_type).toBeDefined();
    }

    // Standalone turn has: turn patchRun (chain) + assistant patchRun (llm)
    const llmPatches = patchInstances.filter((i) => i.params.run_type === "llm");
    const chainPatches = patchInstances.filter((i) => i.params.run_type === "chain");
    expect(llmPatches.length).toBe(1);
    expect(chainPatches.length).toBe(1);

    // start_time must be set on patchRun to prevent the SDK from defaulting to Date.now()
    // which would overwrite the correct start_time and cause negative durations
    expect(llmPatches[0].params.start_time).toBe("2025-01-01T00:00:01Z");
    expect(chainPatches[0].params.start_time).toBe("2025-01-01T00:00:00Z");
  });

  it("sets project_name and run_type consistently on patchRun RunTree instances (with parentRunId)", async () => {
    const replicas = [
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_a",
        projectName: "project-a",
      },
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_b",
        projectName: "test-project",
      },
    ];

    initTracing("test-api-key", "https://test.api.com", replicas);
    allRunTreeInstances = [];

    const parentRunId = "parent-run-id";
    const traceId = "trace-id";
    const parentDottedOrder = "20250101T000000000000Ztrace-id";

    const turn: Turn = {
      userContent: "Hello",
      userTimestamp: "2025-01-01T00:00:00Z",
      llmCalls: [
        {
          content: [{ type: "text", text: "Hi!" }],
          model: "claude-sonnet-4-5",
          usage: { input_tokens: 10, output_tokens: 5 },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [
            {
              tool_use: { id: "tool-1", name: "Read", input: { file: "test.ts" } },
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
      project: "test-project",
      parentRunId,
      traceId,
      parentDottedOrder,
    });

    // Every RunTree used for patchRun must have project_name and run_type
    const patchInstances = allRunTreeInstances.filter((i) => i.ops.includes("patchRun"));
    expect(patchInstances.length).toBeGreaterThan(0);
    for (const inst of patchInstances) {
      expect(inst.params.project_name).toBe("test-project");
      expect(inst.params.run_type).toBeDefined();
    }

    // With parentRunId (no standalone turn creation), only the assistant patchRun fires
    const llmPatches = patchInstances.filter((i) => i.params.run_type === "llm");
    expect(llmPatches.length).toBe(1);

    // LLM patchRun must carry the original start_time to avoid negative durations
    expect(llmPatches[0].params.start_time).toBe("2025-01-01T00:00:01Z");

    // end_time should be the last tool result timestamp (tool calls present)
    expect(llmPatches[0].params.end_time).toBe("2025-01-01T00:00:03Z");

    // postRun instances should also have project_name set
    const postInstances = allRunTreeInstances.filter((i) => i.ops.includes("postRun"));
    expect(postInstances.length).toBeGreaterThan(0);
    for (const inst of postInstances) {
      expect(inst.params.project_name).toBe("test-project");
    }
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
      project: "test-project",
      customMetadata: { pr_url: "https://github.com/org/repo/pull/42", pr_author: "octocat" },
    });

    // Standalone turn: postRun (creation) + patchRun (completion)
    const turnPostInstances = allRunTreeInstances.filter(
      (i) => i.ops.includes("postRun") && i.params.name === USER_PROMPT_TURN_NAME,
    );
    expect(turnPostInstances).toHaveLength(1);
    const turnCreateMetadata = (turnPostInstances[0].params.extra as Record<string, unknown>)
      ?.metadata as Record<string, unknown>;
    expect(turnCreateMetadata.pr_url).toBe("https://github.com/org/repo/pull/42");
    expect(turnCreateMetadata.pr_author).toBe("octocat");

    const turnPatchInstances = allRunTreeInstances.filter(
      (i) => i.ops.includes("patchRun") && i.params.name === USER_PROMPT_TURN_NAME,
    );
    expect(turnPatchInstances).toHaveLength(1);
    const turnPatchMetadata = (turnPatchInstances[0].params.extra as Record<string, unknown>)
      ?.metadata as Record<string, unknown>;
    expect(turnPatchMetadata.pr_url).toBe("https://github.com/org/repo/pull/42");
    expect(turnPatchMetadata.pr_author).toBe("octocat");
    // Standard metadata should still be present
    expect(turnPatchMetadata.thread_id).toBe("session-123");
    expect(turnPatchMetadata.ls_integration).toBe("claude-code");
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
      project: "test-project",
      customMetadata: { pr_url: "https://github.com/org/repo/pull/42" },
    });

    // LLM patchRun should also have custom metadata
    const llmPatchInstances = allRunTreeInstances.filter(
      (i) => i.ops.includes("patchRun") && i.params.run_type === "llm",
    );
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
      project: "test-project",
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
      ls_agent_kind: "coding_agent",
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

    // LLM run (patchRun) — contract keys + preserved model conventions.
    const llmPatch = allRunTreeInstances.find(
      (i) => i.params.run_type === "llm" && i.ops.includes("patchRun"),
    )!;
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
    expect(llmMeta.ls_agent_type).toBeUndefined(); // not a root/subagent run

    // Standalone (root) turn completion (patchRun) — approval_policy + ls_agent_type compat.
    const turnPatch = allRunTreeInstances.find(
      (i) => i.params.name === USER_PROMPT_TURN_NAME && i.ops.includes("patchRun"),
    )!;
    const turnMeta = (turnPatch.params.extra as Record<string, unknown>).metadata as Record<
      string,
      unknown
    >;
    expect(turnMeta).toMatchObject({
      turn_id: "prompt_xyz",
      turn_number: 7,
      approval_policy: "acceptEdits",
      ls_agent_type: "root", // DEPRECATED compat alias
    });
    expect(turnMeta.ls_subagent_type).toBeUndefined(); // never on root
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionState, TracingState } from "./types.js";

const h = vi.hoisted(() => ({
  state: {} as TracingState,
  input: {} as Record<string, unknown>,
  posts: [] as Array<{ config: Record<string, any>; mode: string }>,
  updates: 0,
  flushes: 0,
  beforePost: undefined as (() => void) | undefined,
}));
vi.mock("./utils/stdin.js", () => ({ readStdin: async () => h.input }));
vi.mock("./utils/hook-init.js", () => ({
  initHook: () => ({ stateFilePath: "unused", apiKey: "test", project: "test" }),
}));
vi.mock("./logger.js", () => ({ debug: vi.fn(), error: vi.fn() }));
vi.mock("./state.js", () => ({
  loadState: () => structuredClone(h.state),
  getSessionState: (state: TracingState, id: string) => state[id],
  atomicUpdateState: async (_path: string, fn: (state: TracingState) => TracingState) => {
    h.state = JSON.parse(JSON.stringify(fn(h.state)));
    h.updates++;
  },
}));
vi.mock("./langsmith.js", () => ({
  initTracing: () => ({}),
  generateDottedOrderSegment: (_time: unknown, id: string) => `segment-${id}`,
  flushPendingTraces: async () => {
    h.flushes++;
  },
}));
vi.mock("./privacy.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./privacy.js")>();
  return {
    ...actual,
    createRunTree: (config: Record<string, any>, mode: string) => ({
      postRun: async () => {
        h.posts.push({
          config: actual.runConfigForMode(config, mode as "full" | "metadata"),
          mode,
        });
        h.beforePost?.();
      },
    }),
  };
});

function session(mode: "full" | "metadata", id = "old"): SessionState {
  return {
    last_line: 0,
    turn_count: 1,
    updated: "",
    tracing: mode,
    current_turn_tracing: mode,
    current_turn_run_id: id,
    current_trace_id: `trace-${id}`,
    current_dotted_order: `order-${id}`,
    current_parent_run_id: `parent-${id}`,
    current_turn_number: id === "old" ? 1 : 2,
    current_turn_start: "2026-01-01T00:00:00.000Z",
    runtime_version: `runtime-${id}`,
    approval_policy: `policy-${id}`,
  };
}
function nextTurn() {
  h.state.s = {
    ...h.state.s,
    ...session("full", "new"),
    tool_start_times: { newer: 123 },
    last_tool_end_time: 456,
    traced_tool_use_ids: ["newer"],
  };
}
async function pre(extra = {}) {
  h.input = { session_id: "s", tool_use_id: "tool", tool_name: "Bash", ...extra };
  const updates = h.updates;
  vi.resetModules();
  await import("./hooks/pre-tool-use.js");
  await vi.waitFor(() => expect(h.updates).toBe(updates + 1));
}
async function post(
  tool_name = "Bash",
  tool_response: Record<string, unknown> = { secret: "OUTPUT" },
) {
  h.input = {
    session_id: "s",
    cwd: "/test",
    tool_use_id: "tool",
    tool_name,
    tool_input: { secret: "INPUT" },
    tool_response,
  };
  const updates = h.updates;
  vi.resetModules();
  await import("./hooks/post-tool-use.js");
  await vi.waitFor(() => expect(h.updates).toBe(updates + 1));
}
function expectNewTurnUntouched() {
  expect(h.state.s.current_turn_run_id).toBe("new");
  expect(h.state.s.tool_start_times).toEqual({ newer: 123 });
  expect(h.state.s.last_tool_end_time).toBe(456);
  expect(h.state.s.traced_tool_use_ids).toEqual(["newer"]);
}

beforeEach(() => {
  h.state = { s: session("metadata") };
  h.posts = [];
  h.updates = 0;
  h.flushes = 0;
  h.beforePost = undefined;
});

describe("async PostToolUse launch ownership", () => {
  it("keeps a delayed muted tool on its launching turn after a newer full prompt", async () => {
    await pre();
    const launch = structuredClone(h.state.s.tool_launch_contexts!.tool);
    expect(launch.tracing).toBe("metadata");
    nextTurn();
    // A duplicate old PreToolUse cannot clobber ownership or newer timing.
    await pre();
    expect(h.state.s.tool_launch_contexts!.tool).toEqual(launch);
    expectNewTurnUntouched();
    await post();
    expect(h.posts[0].mode).toBe("metadata");
    expect(h.posts[0].config).toMatchObject({
      parent_run_id: "old",
      trace_id: "trace-old",
      inputs: {},
      outputs: {},
      start_time: new Date(launch.start_time).toISOString(),
      extra: { metadata: { turn_number: 1, ls_agent_runtime_version: "runtime-old" } },
    });
    expectNewTurnUntouched();
    expect(h.state.s.tool_launch_contexts!.tool).toBeUndefined();
  });

  it.each(["Agent", "Workflow"])(
    "records delayed %s with the saved launch context",
    async (tool) => {
      await pre();
      nextTurn();
      const response =
        tool === "Agent"
          ? { agentId: "background", secret: "OUTPUT" }
          : { status: "async_launched", taskId: "background", runId: "wf_test", secret: "OUTPUT" };
      await post(tool, response);
      expect(h.state.s.task_run_map!.background).toMatchObject({
        tracing: "metadata",
        launching_turn_run_id: "old",
        deferred: { parent_run_id: "old", trace_id: "trace-old", inputs: {}, outputs: {} },
      });
      expect(h.state.s.open_turns).toBeUndefined();
      expect(JSON.stringify(h.state.s.task_run_map)).not.toContain("INPUT");
      expectNewTurnUntouched();
      if (tool === "Workflow") expect(h.posts[0].config.parent_run_id).toBe("old");
    },
  );

  describe.each(["full", "metadata"] as const)("%s background lifecycle", (mode) => {
    const tools = [
      { tool: "Agent", response: { agentId: "background", secret: "OUTPUT" } },
      {
        tool: "Workflow",
        response: {
          status: "async_launched",
          taskId: "background",
          runId: "wf_test",
          secret: "OUTPUT",
        },
      },
    ];

    it.each(tools)(
      "registers an initial active $tool launch normally",
      async ({ tool, response }) => {
        h.state.s = session(mode);
        await pre();
        await post(tool, response);
        expect(h.state.s.open_turns!.old).toMatchObject({
          run_id: "old",
          tracing: mode,
          parent_run_id: "parent-old",
          turn_number: 1,
          runtime_version: "runtime-old",
          approval_policy: "policy-old",
          stop_seen: false,
          agent_ids: ["background"],
        });
        expect(h.state.s.task_run_map!.background).toMatchObject({
          launching_turn_run_id: "old",
          tracing: mode,
        });
        expect(h.state.s.last_tool_end_time).toBeTypeOf("number");
      },
    );

    it.each(tools)(
      "adds delayed $tool to a still-open stopped parent",
      async ({ tool, response }) => {
        h.state.s = session(mode);
        await pre();
        h.state.s.open_turns = {
          old: {
            ...h.state.s.tool_launch_contexts!.tool.turn!,
            tracing: mode,
            stop_seen: true,
            agent_ids: ["earlier"],
          },
        };
        nextTurn();
        await post(tool, response);
        expect(h.state.s.open_turns!.old).toMatchObject({
          stop_seen: true,
          tracing: mode,
          agent_ids: ["earlier", "background"],
        });
        expect(h.state.s.open_turns!.new).toBeUndefined();
        expectNewTurnUntouched();
      },
    );

    describe.each(["finished", "interrupted"])("after parent %s", (lifecycle) => {
      it.each(tools)("keeps delayed $tool task-only correlation", async ({ tool, response }) => {
        h.state.s = session(mode);
        await pre();
        const launch = h.state.s.tool_launch_contexts!.tool;
        // Finished Stop clears current ownership; interruption replaces it with
        // the next prompt. Neither leaves an open parent for this late launch.
        h.state.s = {
          last_line: 0,
          turn_count: 1,
          updated: "",
          tracing: mode,
          tool_launch_contexts: { tool: launch },
        };
        if (lifecycle === "interrupted") nextTurn();
        await post(tool, response);
        expect(h.state.s.open_turns).toBeUndefined();
        const entry = h.state.s.task_run_map!.background;
        expect(entry).toMatchObject({
          tracing: mode,
          launching_turn_run_id: "old",
          deferred: {
            parent_run_id: "old",
            trace_id: "trace-old",
            inputs: mode === "full" ? { secret: "INPUT" } : {},
            outputs: mode === "full" ? response : {},
          },
        });
        expect(entry.dotted_order).toMatch(/^order-old\./);
        expect(h.state.s.tool_launch_contexts!.tool).toBeUndefined();
        if (lifecycle === "interrupted") expectNewTurnUntouched();
        else expect(h.state.s.current_turn_run_id).toBeUndefined();
        if (tool === "Workflow") {
          expect(entry).toMatchObject({
            is_workflow: true,
            subagent_done: true,
            workflow_run_id: "wf_test",
          });
          expect(h.posts[0]).toMatchObject({
            mode,
            config: { parent_run_id: "old", trace_id: "trace-old" },
          });
        } else expect(h.posts).toHaveLength(0);
      });
    });

    it("rechecks parent lifecycle after posting a Workflow", async () => {
      h.state.s = session(mode);
      await pre();
      h.beforePost = nextTurn;
      await post("Workflow", tools[1].response);
      expect(h.state.s.open_turns).toBeUndefined();
      expect(h.state.s.task_run_map!.background).toMatchObject({
        launching_turn_run_id: "old",
        tracing: mode,
      });
      expectNewTurnUntouched();
    });
  });

  it.each(["Bash", "Agent", "Workflow"])(
    "defaults unowned %s to metadata without borrowing current full ownership",
    async (tool) => {
      nextTurn();
      const response =
        tool === "Agent"
          ? { agentId: "background" }
          : tool === "Workflow"
            ? { status: "async_launched", taskId: "background", runId: "wf_test" }
            : { secret: "OUTPUT" };
      await post(tool, response);
      expectNewTurnUntouched();
      expect(h.state.s.open_turns).toBeUndefined();
      if (tool === "Agent" || tool === "Workflow") {
        const entry = h.state.s.task_run_map!.background;
        expect(entry.tracing).toBe("metadata");
        expect(entry.launching_turn_run_id).toBeUndefined();
        expect(entry.deferred?.parent_run_id).toBeUndefined();
        expect(entry.deferred?.inputs).toEqual({});
      }
      for (const { config, mode } of h.posts) {
        expect(mode).toBe("metadata");
        expect(config.parent_run_id).toBeUndefined();
        expect(config.trace_id).toBe(config.id);
        expect(config.inputs).toEqual({});
        expect(config.extra.metadata.turn_number).toBeUndefined();
      }
    },
  );

  it("does not infer full consent from a session preference when the turn snapshot is missing", async () => {
    h.state.s = session("full");
    delete h.state.s.current_turn_tracing;
    await pre();
    expect(h.state.s.tool_launch_contexts!.tool.tracing).toBe("metadata");
    await post();
    expect(h.posts[0].mode).toBe("metadata");
  });

  it("preserves the normal owned full path and current-turn bookkeeping", async () => {
    h.state.s = session("full");
    await pre();
    await post();
    expect(h.posts[0]).toMatchObject({
      mode: "full",
      config: {
        parent_run_id: "old",
        inputs: { input: { secret: "INPUT" } },
        outputs: { output: { secret: "OUTPUT" } },
      },
    });
    expect(h.state.s.traced_tool_use_ids).toEqual(["tool"]);
    expect(h.state.s.last_tool_end_time).toBeTypeOf("number");
    expect(h.flushes).toBe(1);
  });

  it("records an explicitly unowned launch without marking current-turn start times", async () => {
    h.state.s = { last_line: 0, turn_count: 0, updated: "", tracing: "full" };
    await pre();
    expect(h.state.s.tool_launch_contexts!.tool).toMatchObject({ tracing: "metadata" });
    expect(h.state.s.tool_launch_contexts!.tool.turn).toBeUndefined();
    expect(h.state.s.tool_start_times).toBeUndefined();
    nextTurn();
    await post();
    expect(h.posts[0].mode).toBe("metadata");
    expect(h.posts[0].config.parent_run_id).toBeUndefined();
    expectNewTurnUntouched();
  });

  it.each(["Agent", "Workflow"])(
    "retains full %s deferred payloads only with launch consent",
    async (tool) => {
      h.state.s = session("full");
      await pre();
      nextTurn();
      await post(
        tool,
        tool === "Agent"
          ? { agentId: "background" }
          : { status: "async_launched", taskId: "background", runId: "wf_test" },
      );
      expect(h.state.s.task_run_map!.background).toMatchObject({
        tracing: "full",
        launching_turn_run_id: "old",
        deferred: { parent_run_id: "old", inputs: { secret: "INPUT" } },
      });
      expectNewTurnUntouched();
    },
  );

  it("rechecks ownership when a newer prompt arrives during posting", async () => {
    h.state.s = session("full");
    await pre();
    h.beforePost = nextTurn;
    await post();
    expect(h.posts[0].config.parent_run_id).toBe("old");
    expectNewTurnUntouched();
  });
});

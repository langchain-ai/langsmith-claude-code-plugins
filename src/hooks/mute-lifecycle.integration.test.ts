import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TracingMode, TracingState, TranscriptMessage } from "../types.js";
import { tracingPolicyPath } from "../tracing-policy.js";

// Exercise the real hooks, grouping, run builders, background registration and
// finalization. Only I/O/SDK transport is replaced; privacy projection is real.
const h = vi.hoisted(() => ({
  state: {} as TracingState,
  policy: "full" as TracingMode,
  policyPath: undefined as string | undefined,
  input: {} as Record<string, unknown>,
  messages: [] as TranscriptMessage[],
  agentMessages: [] as TranscriptMessage[],
  operations: [] as Array<{ action: string; config: Record<string, any> }>,
  ids: 0,
  beforePost: undefined as undefined | (() => void | Promise<void>),
  errors: [] as unknown[],
}));
vi.mock("langsmith", () => ({
  Client: class {
    async awaitPendingTraceBatches() {}
  },
  uuid7FromTime: () => `run-${++h.ids}`,
  RunTree: class {
    constructor(private config: Record<string, any>) {}
    static getSharedClient() {
      return { awaitPendingTraceBatches: async () => {} };
    }
    async postRun() {
      await h.beforePost?.();
      h.operations.push({ action: "post", config: JSON.parse(JSON.stringify(this.config)) });
    }
    async patchRun() {
      h.operations.push({ action: "patch", config: JSON.parse(JSON.stringify(this.config)) });
    }
  },
}));
vi.mock("../utils/stdin.js", () => ({ readStdin: async () => h.input }));
vi.mock("../utils/hook-init.js", () => ({
  initHook: () => ({
    apiKey: "test",
    project: "test",
    stateFilePath: "/unused",
    redact: false,
    customMetadata: { custom: "PRIVATE_MARKER", ls_model_name: "PRIVATE_MARKER" },
  }),
  expandHome: (path: string) => path,
}));
vi.mock("../config.js", () => ({
  loadConfig: () => ({ stateFilePath: "/unused", apiKey: "test", enabled: true }),
}));
vi.mock("../tracing-policy.js", async (original) => {
  const policy = await original<typeof import("../tracing-policy.js")>();
  return {
    ...policy,
    getThreadTracingMode: (_: string, sessionId: string) =>
      h.policyPath ? policy.getThreadTracingMode(h.policyPath, sessionId) : h.policy,
    setThreadTracingMode: async (_: string, __: string, mode: TracingMode) => {
      h.policy = mode;
    },
  };
});
vi.mock("../logger.js", () => ({
  debug: () => {},
  log: () => {},
  warn: () => {},
  error: (...args: unknown[]) => h.errors.push(args),
}));
vi.mock("../state.js", async (original) => ({
  ...(await original<typeof import("../state.js")>()),
  loadState: () => structuredClone(h.state),
  atomicUpdateState: async (_: string, update: (state: TracingState) => TracingState) => {
    // Match persistence: no symbols/functions or shared references survive.
    h.state = JSON.parse(JSON.stringify(update(structuredClone(h.state))));
  },
}));
vi.mock("../transcript.js", async (original) => ({
  ...(await original<typeof import("../transcript.js")>()),
  readTranscript: (path: string) => ({
    messages: path.includes("agent-") ? h.agentMessages : h.messages,
    lastLine: 10,
  }),
  getTranscriptEndLine: () => -1,
  readRuntimeVersion: () => "test-runtime",
}));

const now = "2026-07-01T00:00:00.000Z";
const privateText = "PRIVATE_MARKER";
function transcript(
  tool?: { id: string; name: string; agentId?: string },
  prompt = privateText,
): TranscriptMessage[] {
  return [
    { type: "user", timestamp: now, message: { role: "user", content: prompt } },
    {
      type: "assistant",
      timestamp: now,
      message: {
        id: "message",
        role: "assistant",
        model: "claude-test",
        stop_reason: "end_turn",
        usage: { input_tokens: 2, output_tokens: 3 },
        content: [
          { type: "text", text: privateText },
          ...(tool
            ? [
                {
                  type: "tool_use" as const,
                  id: tool.id,
                  name: tool.name,
                  input: { content: privateText },
                },
              ]
            : []),
        ],
      },
    },
    ...(tool
      ? [
          {
            type: "user" as const,
            timestamp: now,
            message: {
              role: "user" as const,
              content: [
                { type: "tool_result" as const, tool_use_id: tool.id, content: privateText },
              ],
            },
            ...(tool.agentId ? { toolUseResult: { agentId: tool.agentId } } : {}),
          },
        ]
      : []),
  ];
}
function reset(mode: TracingMode) {
  h.state = {};
  h.policy = mode;
  h.ids = 0;
  h.operations = [];
  h.messages = [];
  h.agentMessages = transcript();
  h.errors = [];
  h.beforePost = undefined;
}
async function hook(name: string, extra: Record<string, unknown> = {}) {
  h.input = {
    session_id: "session",
    cwd: "/repo",
    transcript_path: "/transcript",
    prompt: privateText,
    last_assistant_message: privateText,
    stop_hook_active: false,
    tool_name: "Bash",
    tool_use_id: "tool",
    tool_input: { content: privateText },
    tool_response: { content: privateText },
    ...extra,
  };
  vi.resetModules();
  switch (name) {
    case "prompt":
      await import("./user-prompt-submit.js");
      break;
    case "pre":
      await import("./pre-tool-use.js");
      break;
    case "post":
      await import("./post-tool-use.js");
      break;
    case "stop":
      await import("./stop.js");
      break;
    case "agent":
      await import("./subagent-stop.js");
      break;
    case "precompact":
      await import("./pre-compact.js");
      break;
    case "postcompact":
      await import("./post-compact.js");
      break;
    case "failure":
      await import("./stop-failure.js");
      break;
    case "end":
      await import("./session-end.js");
      break;
  }
  // Hooks are executable entrypoints, not exported functions. Their only timer
  // is Stop's unchanged 200ms transcript flush delay.
  await new Promise((resolve) => setTimeout(resolve, name === "stop" ? 250 : 15));
}
function topology() {
  return h.operations.map(({ action, config: c }) => ({
    action,
    id: c.id,
    name: c.name,
    type: c.run_type,
    parent: c.parent_run_id,
    trace: c.trace_id,
    order: c.dotted_order,
    start: c.start_time,
    end: c.end_time,
  }));
}
function expectPrivate(operations = h.operations) {
  expect(JSON.stringify(operations)).not.toContain(privateText);
  for (const { config } of operations)
    expect(config.extra.metadata.ls_tracing_mode).toBe("metadata");
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(now));
});
afterEach(() => {
  vi.useRealTimers();
  if (h.policyPath) rmSync(join(h.policyPath, ".."), { recursive: true, force: true });
  h.policyPath = undefined;
});

function savedPolicy(mode: TracingMode | "corrupt") {
  h.policyPath = join(mkdtempSync(join(tmpdir(), "missing-mode-")), "state.json");
  writeFileSync(
    tracingPolicyPath(h.policyPath),
    mode === "corrupt"
      ? "{broken"
      : JSON.stringify({ default: "full", threads: { session: mode } }),
  );
}

// A legacy active parent has identity but no privacy snapshot. Do not manufacture
// a prompt run: PostToolUse must keep its existing missing-parent behavior.
function legacyParent() {
  h.state.session = {
    last_line: -1,
    turn_count: 0,
    current_turn_run_id: "legacy-root",
    current_trace_id: "legacy-root",
    current_dotted_order: "legacy-order",
    current_turn_start: now,
  };
}

describe("tool privacy snapshot reclamation", () => {
  it.each(["Bash", "Agent", "Workflow"])(
    "reclaims completed %s IDs after Stop, not Post",
    async (name) => {
      reset("metadata");
      await hook("prompt");
      await hook("pre", { tool_use_id: "pending" });
      await hook("pre");
      await hook("post", {
        tool_name: name,
        ...(name === "Agent" ? { tool_response: { agentId: "background" } } : {}),
        ...(name === "Workflow"
          ? {
              tool_response: {
                status: "async_launched",
                taskId: "workflow-task",
                runId: "wf_test",
              },
            }
          : {}),
      });
      expect(h.state.session.tool_tracing_modes?.tool).toBe("metadata");
      expect(h.state.session.tool_tracing_progress).toEqual({ tool: "post" });
      if (name === "Agent") expect(h.state.session.traced_tool_use_ids).not.toContain("tool");
      h.messages = transcript({
        id: "tool",
        name,
        ...(name === "Agent" ? { agentId: "background" } : {}),
      });
      await hook("stop");
      expect(h.state.session.tool_tracing_modes).toEqual({ pending: "metadata" });
      expect(h.state.session.tool_tracing_progress).toEqual({});
      if (name === "Agent")
        expect(h.state.session.task_run_map?.background.tracing).toBe("metadata");
      if (name === "Workflow")
        expect(h.state.session.task_run_map?.["workflow-task"].tracing).toBe("metadata");
      expectPrivate();
      expect(h.errors).toEqual([]);
    },
  );

  it.each(["stop", "prompt"])(
    "joins a delayed Post after %s consumes the result and policy becomes full",
    async (consumer) => {
      reset("metadata");
      await hook("prompt");
      await hook("pre");
      h.messages = transcript({ id: "tool", name: "Bash" });
      h.policy = "full";
      await hook(consumer);
      expect(h.state.session.tool_tracing_modes).toEqual({ tool: "metadata" });
      expect(h.state.session.tool_tracing_progress).toEqual({ tool: "transcript" });
      h.messages = []; // The consumed prefix will never be replayed by another Stop.
      if (consumer === "stop") await hook("prompt");
      expect(h.state.session.current_turn_tracing).toBe("full");
      const parent = h.state.session.current_turn_run_id;
      await hook("post");
      expectPrivate([h.operations.at(-1)!]);
      expect(h.operations.at(-1)!.config.parent_run_id).toBe(parent);
      expect(h.state.session.tool_tracing_modes).toEqual({});
      expect(h.state.session.tool_tracing_progress).toEqual({});
      await hook("pre", { tool_use_id: "new" });
      await hook("post", { tool_use_id: "new" });
      expect(h.operations.at(-1)!.config.extra.metadata.ls_tracing_mode).toBeUndefined();
      expect(h.errors).toEqual([]);
    },
  );

  it("retains completed IDs until a result is consumed, including empty Stop and prompt resets", async () => {
    reset("metadata");
    await hook("prompt");
    await hook("pre");
    await hook("post");
    await hook("stop"); // Empty transcript: no consumption.
    expect(h.state.session.tool_tracing_progress).toEqual({ tool: "post" });
    h.policy = "full";
    await hook("prompt");
    h.messages = transcript({ id: "tool", name: "Bash" }).slice(0, 2); // No result yet.
    await hook("stop");
    expect(h.state.session.tool_tracing_modes).toEqual({ tool: "metadata" });
    expect(h.state.session.tool_tracing_progress).toEqual({ tool: "post" });
    h.messages = [];
    await hook("prompt");
    h.messages = transcript({ id: "tool", name: "Bash" });
    const from = h.operations.length;
    await hook("stop");
    expectPrivate(h.operations.slice(from).filter((op) => op.config.run_type === "tool"));
    expect(h.state.session.tool_tracing_modes).toEqual({});
    expect(h.state.session.tool_tracing_progress).toEqual({});
    expect(h.errors).toEqual([]);
  });

  it("joins a Post committed while Stop is tracing using fresh locked state", async () => {
    reset("metadata");
    await hook("prompt");
    await hook("pre");
    h.messages = transcript({ id: "tool", name: "Bash" });
    h.beforePost = async () => {
      h.beforePost = undefined;
      await hook("post");
      expect(h.state.session.tool_tracing_progress).toEqual({ tool: "post" });
    };
    await hook("stop");
    expect(h.state.session.tool_tracing_modes).toEqual({});
    expect(h.state.session.tool_tracing_progress).toEqual({});
    expectPrivate();
    expect(h.errors).toEqual([]);
  });

  it("reclaims interrupted completed IDs at the same write that advances the cursor", async () => {
    reset("metadata");
    await hook("prompt");
    await hook("pre", { tool_use_id: "pending" });
    await hook("post"); // No PreToolUse is required for completion evidence.
    h.messages = transcript({ id: "tool", name: "Bash" });
    h.policy = "full";
    await hook("prompt");
    expect(h.state.session.last_line).toBe(10);
    expect(h.state.session.tool_tracing_modes).toEqual({ pending: "metadata" });
    expect(h.state.session.tool_tracing_progress).toEqual({});
    expect(h.errors).toEqual([]);
  });

  it("keeps both maps when all traces fail and the cursor stays put", async () => {
    reset("metadata");
    await hook("prompt");
    await hook("post");
    h.messages = transcript({ id: "tool", name: "Bash" });
    h.beforePost = () => {
      throw new Error("test trace failure");
    };
    await hook("stop");
    expect(h.state.session.last_line).toBe(-1);
    expect(h.state.session.tool_tracing_modes).toEqual({ tool: "metadata" });
    expect(h.state.session.tool_tracing_progress).toEqual({ tool: "post" });
    expect(h.errors.length).toBeGreaterThan(0);
    h.beforePost = undefined;
    await hook("stop");
    expect(h.state.session.tool_tracing_modes).toEqual({});
    expect(h.state.session.tool_tracing_progress).toEqual({});
  });

  it.each([true, false])(
    "SessionEnd clears pending and completed evidence with open runs=%s",
    async (open) => {
      reset("metadata");
      await hook("prompt");
      await hook("pre", { tool_use_id: "pending" });
      await hook("post");
      h.messages = transcript();
      if (!open) await hook("stop");
      h.policy = "full";
      const from = h.operations.length;
      await hook("end");
      expect(h.state.session.tool_tracing_modes).toEqual({});
      expect(h.state.session.tool_tracing_progress).toEqual({});
      if (!open) expect(h.operations).toHaveLength(from);
      else expectPrivate(h.operations.slice(from));
      const ended = structuredClone(h.state);
      await hook("post"); // No current parent: no resurrection after definitive end.
      expect(h.state).toEqual(ended);
    },
  );

  it("does not resurrect a cleared launch snapshot when Post commits after SessionEnd", async () => {
    reset("metadata");
    await hook("prompt");
    await hook("pre");
    h.beforePost = async () => {
      h.beforePost = undefined;
      await hook("end");
    };
    await hook("post");
    await vi.waitFor(() => expect(h.state.session.traced_tool_use_ids).toContain("tool"));
    expect(h.state.session.tool_tracing_modes).toEqual({});
    expect(h.state.session.tool_tracing_progress).toEqual({});
    expectPrivate();
    expect(h.errors).toEqual([]);
  });
});

describe("privacy propagation without lifecycle changes", () => {
  it.each(["metadata", "corrupt"] as const)(
    "Stop without UserPromptSubmit honors %s persistent policy",
    async (policy) => {
      reset("full");
      savedPolicy(policy);
      h.messages = transcript({ id: "transcript-tool", name: "Bash" });
      await hook("stop");
      expect(h.operations.length).toBeGreaterThan(0);
      expectPrivate();
      const { MUTED_TRACE_CONTENT } = await import("../privacy.js");
      expect(JSON.stringify(h.operations)).toContain(MUTED_TRACE_CONTENT);
      expect(h.operations.some((op) => op.config.run_type === "llm")).toBe(true);
      expect(h.operations.some((op) => op.config.name === "Bash")).toBe(true);
      expect(h.errors).toEqual([]);
    },
  );

  it.each(["metadata", "corrupt"] as const)(
    "unsnapshotted tools and compaction honor %s persistent policy without a prompt hook",
    async (policy) => {
      reset("full");
      savedPolicy(policy);
      legacyParent();
      await hook("pre");
      expect(h.state.session.tool_tracing_modes?.tool).toBe("metadata");
      await hook("post");
      await hook("post", { tool_use_id: "without-pre" });
      await hook("precompact", { trigger: "auto" });
      expect(h.state.session.compaction_tracing).toBe("metadata");
      await hook("postcompact", { trigger: "auto", compact_summary: privateText });
      await hook("postcompact", { trigger: "auto", compact_summary: privateText });
      expect(h.operations).toHaveLength(4);
      expectPrivate();
      expect(h.state.session.current_turn_tracing).toBeUndefined();
      expect(h.state.session.open_turns).toBeUndefined();
      expect(h.operations.every((op) => op.config.parent_run_id === "legacy-root")).toBe(true);
      expect(h.errors).toEqual([]);
    },
  );

  it.each(["failure", "end"])("unsnapshotted %s recovery honors saved mute", async (name) => {
    reset("full");
    savedPolicy("metadata");
    legacyParent();
    h.messages = transcript({ id: "recovered-tool", name: "Bash" });
    await hook(name, { error: privateText, error_details: privateText });
    expect(h.operations.length).toBeGreaterThan(0);
    expectPrivate();
    expect(h.errors).toEqual([]);
  });

  it("full snapshots survive a persisted next-turn mute through tools, compaction and Stop", async () => {
    reset("full");
    await hook("prompt");
    savedPolicy("metadata");
    await hook("pre");
    await hook("post");
    await hook("precompact", { trigger: "auto" });
    await hook("postcompact", { trigger: "auto", compact_summary: privateText });
    h.messages = transcript({ id: "tool", name: "Bash" });
    await hook("stop");
    expect(h.operations.every((op) => !op.config.extra?.metadata?.ls_tracing_mode)).toBe(true);
    expect(JSON.stringify(h.operations)).toContain(privateText);
    expect(h.errors).toEqual([]);
  });

  it.each(["agent", "workflow", "finalize", "end"])(
    "unsnapshotted background %s uses saved mute, not an unrelated full current turn",
    async (path) => {
      reset("full");
      savedPolicy("metadata");
      legacyParent();
      h.state.session.current_turn_tracing = "full";
      h.state.session.open_turns = {
        launch: {
          run_id: "launch",
          trace_id: "launch",
          dotted_order: "launch-order",
          start_time: now,
          stop_seen: true,
          agent_ids: ["background"],
          last_assistant_message: privateText,
        },
      };
      h.state.session.task_run_map = {
        background: {
          run_id: "background-run",
          dotted_order: "launch-order.background",
          subagent_done: true,
          deferred: {
            parent_run_id: "launch",
            trace_id: "launch",
            start_time: now,
            inputs: { content: privateText },
            outputs: { content: privateText },
          },
          ...(path === "workflow" ? { workflow_run_id: "wf_test", is_workflow: true } : {}),
        },
      };
      if (path === "finalize") {
        const { initTracing } = await import("../langsmith.js");
        const { finalizeNotificationChain } = await import("../finalize.js");
        initTracing("test", undefined, undefined, false);
        await finalizeNotificationChain({
          stateFilePath: "/unused",
          sessionId: "session",
          project: "test",
          agentId: "background",
        });
      } else if (path === "end") {
        await hook("end");
      } else {
        await hook("agent", {
          agent_id: "background",
          agent_type: path === "workflow" ? "workflow-subagent" : "Explore",
          agent_transcript_path:
            path === "workflow" ? "/workflows/wf_test/agent-stage" : "/agent-background",
        });
      }
      const background = h.operations.filter((op) => op.config.id !== "legacy-root");
      expect(background.length).toBeGreaterThan(0);
      expectPrivate(background);
      expect(h.errors).toEqual([]);
    },
  );

  it.each(["full", "metadata"] as const)(
    "missing current mode preserves the matching open turn's %s snapshot",
    async (mode) => {
      reset(mode === "full" ? "metadata" : "full");
      legacyParent();
      h.state.session.open_turns = {
        "legacy-root": {
          run_id: "legacy-root",
          tracing: mode,
          stop_seen: false,
          agent_ids: [],
        },
      };
      await hook("pre");
      await hook("post");
      await hook("precompact", { trigger: "auto" });
      await hook("postcompact", { trigger: "auto", compact_summary: privateText });
      h.messages = transcript();
      await hook("stop");
      if (mode === "metadata") expectPrivate();
      else
        expect(h.operations.every((op) => !op.config.extra?.metadata?.ls_tracing_mode)).toBe(true);
      expect(h.errors).toEqual([]);
    },
  );

  it("unknown older transcript turns remain metadata even under a healthy full policy", async () => {
    reset("full");
    savedPolicy("full");
    h.messages = [...transcript(), ...transcript()];
    await hook("stop");
    const older = h.operations.filter((op) => op.config.extra?.metadata?.turn_number === 1);
    const current = h.operations.filter((op) => op.config.extra?.metadata?.turn_number === 2);
    expect(older.length).toBeGreaterThan(0);
    expectPrivate(older);
    expect(current.length).toBeGreaterThan(0);
    expect(current.every((op) => !op.config.extra?.metadata?.ls_tracing_mode)).toBe(true);
    expect(JSON.stringify(current)).toContain(privateText);
    expect(h.errors).toEqual([]);
  });

  it.each(["full", "metadata"] as const)(
    "commands affect only the next turn from %s",
    async (mode) => {
      reset(mode);
      const next = mode === "full" ? "metadata" : "full";
      await hook("prompt");
      await hook("pre", { tool_use_id: "task" });
      await hook("post", {
        tool_use_id: "task",
        tool_name: "Task",
        tool_response: { agentId: "background", content: privateText },
      });
      const before = structuredClone(h.state);
      const posts = h.operations.length;
      const output = vi.spyOn(console, "log").mockImplementation(() => {});
      await hook("prompt", { prompt: `/langsmith-tracing:${mode === "full" ? "mute" : "unmute"}` });
      expect(h.state).toEqual(before);
      expect(h.operations).toHaveLength(posts);
      expect(output).toHaveBeenCalledWith(
        expect.stringContaining("for the next turn; the current turn is unchanged"),
      );
      output.mockRestore();
      expect(h.policy).toBe(next);
      await hook("pre");
      expect(h.state.session.tool_tracing_modes?.tool).toBe(mode);
      await hook("post");
      h.messages = transcript({ id: "task", name: "Task", agentId: "background" });
      await hook("stop");
      const oldRoot = before.session.current_turn_run_id!;
      expect(h.state.session.open_turns?.[oldRoot].tracing).toBe(mode);
      const from = h.operations.length;
      await hook("prompt", { prompt: "notification background " + privateText });
      expect(h.state.session.current_turn_tracing).toBe(next);
      expect(h.operations[from].config.parent_run_id).toBe(
        before.session.task_run_map!.background.run_id,
      );
      const agentFrom = h.operations.length;
      await hook("agent", {
        agent_id: "background",
        agent_type: "Explore",
        agent_transcript_path: "/agent-background",
      });
      if (mode === "metadata") expectPrivate(h.operations.slice(agentFrom));
      else
        expect(
          h.operations.slice(agentFrom).every((op) => !op.config.extra?.metadata?.ls_tracing_mode),
        ).toBe(true);
      expect(h.state.session.task_run_map!.background.tracing).toBe(mode);
      // Duplicate PreToolUse retains its original privacy snapshot even in a new turn.
      await hook("pre");
      expect(h.state.session.tool_tracing_modes?.tool).toBe(mode);
      const stopFrom = h.operations.length;
      h.messages = transcript(undefined, "notification background " + privateText);
      await hook("stop");
      const notificationOps = [
        h.operations[from],
        ...h.operations
          .slice(stopFrom)
          .filter(
            (op) =>
              op.config.id !== oldRoot &&
              op.config.id !== before.session.task_run_map!.background.run_id,
          ),
      ];
      if (next === "metadata") expectPrivate(notificationOps);
      else
        expect(notificationOps.every((op) => !op.config.extra?.metadata?.ls_tracing_mode)).toBe(
          true,
        );
      expect(h.errors).toEqual([]);
    },
  );

  it.each(["full", "metadata"] as const)(
    "transcript-only tools use the %s turn snapshot, not missing-map muting",
    async (mode) => {
      reset(mode);
      await hook("prompt");
      h.messages = transcript({ id: "no-hooks", name: "Bash" });
      await hook("stop");
      expect(h.operations.some((op) => op.config.name === "Bash")).toBe(true);
      if (mode === "metadata") expectPrivate();
      else
        expect(h.operations.every((op) => !op.config.extra?.metadata?.ls_tracing_mode)).toBe(true);
      expect(h.errors).toEqual([]);
    },
  );
  it("missing current snapshots default full and private tool replay does not demote its turn", async () => {
    reset("full");
    await hook("prompt");
    delete h.state.session.current_turn_tracing;
    await hook("pre", { tool_use_id: "default-full" });
    expect(h.state.session.tool_tracing_modes?.["default-full"]).toBe("full");
    await hook("post", { tool_use_id: "no-pre" });
    expect(h.operations.at(-1)!.config.extra.metadata.ls_tracing_mode).toBeUndefined();
    h.state.session.tool_tracing_modes!.private = "metadata";
    h.messages = transcript({ id: "private", name: "Bash" });
    const from = h.operations.length;
    await hook("stop");
    const replay = h.operations.slice(from);
    expectPrivate(replay.filter((op) => op.config.run_type === "tool"));
    expect(
      replay
        .filter((op) => op.config.run_type !== "tool")
        .every((op) => !op.config.extra?.metadata?.ls_tracing_mode),
    ).toBe(true);
    expect(h.errors).toEqual([]);
  });

  it.each(["Bash", "Task"])(
    "traceTurn cannot unmute %s with a full tool snapshot",
    async (name) => {
      const topologies = [];
      for (const mode of ["full", "metadata"] as const) {
        reset(mode);
        const { initTracing, traceTurn } = await import("../langsmith.js");
        const { groupIntoTurns } = await import("../transcript.js");
        initTracing("test", undefined, undefined, false);
        const turns = groupIntoTurns(
          transcript({ id: "tool", name, agentId: name === "Task" ? "agent" : undefined }),
        );
        const tasks = await traceTurn({
          turn: turns[0],
          sessionId: "session",
          turnNum: 1,
          project: "test",
          tracing: mode,
          toolTracingModes: { tool: "full" },
        });
        if (name === "Task") expect(tasks.agent.tracing).toBe(mode);
        if (mode === "metadata") expectPrivate();
        else expect(JSON.stringify(h.operations)).toContain(privateText);
        topologies.push(topology());
      }
      expect(topologies[1]).toEqual(topologies[0]);
    },
  );

  it.each(["metadata", "missing", "full"] as const)(
    "retains delayed %s tool privacy without demoting the current turn or changing topology",
    async (snapshot) => {
      reset(snapshot === "metadata" ? "metadata" : "full");
      await hook("prompt");
      if (snapshot !== "missing") await hook("pre");
      h.messages = transcript();
      await hook("stop");
      h.policy = "full";
      await hook("prompt");
      const parent = h.state.session.current_turn_run_id!;
      const order = h.state.session.current_dotted_order!;
      // An existing open root may already hold completion text. Unrelated roots
      // and all join fields must survive this privacy-only write unchanged.
      h.state.session.open_turns = {
        [parent]: {
          run_id: parent,
          tracing: "full",
          stop_seen: false,
          agent_ids: ["pending"],
          last_assistant_message: privateText,
        },
        other: {
          run_id: "other",
          tracing: "full",
          stop_seen: true,
          agent_ids: ["other-agent"],
          last_assistant_message: "other text",
        },
      };
      const before = structuredClone(h.state);
      const expectedMode = snapshot === "metadata" ? "metadata" : "full";
      const from = h.operations.length; // Earlier full posts are not retroactively scrubbed.
      let checkedBeforeNetwork = false;
      h.beforePost = async () => {
        h.beforePost = undefined;
        expect(h.state).toEqual(before);
        checkedBeforeNetwork = true;
        // Snapshot while PostToolUse is still awaiting the network boundary,
        // before its standard timing/traced-tool/background state update.
        await hook("pre", { tool_use_id: "next" });
        expect(h.state.session.tool_tracing_modes?.next).toBe("full");
      };
      await hook("post");
      expect(checkedBeforeNetwork).toBe(true);
      await vi.waitFor(() => expect(h.operations).toHaveLength(from + 1));
      await hook("post", { tool_use_id: "next" });
      expect(h.operations.slice(from)).toHaveLength(2);
      for (const { config } of h.operations.slice(from)) {
        expect(config.parent_run_id).toBe(parent);
        expect(config.trace_id).toBe(before.session.current_trace_id);
        expect(config.dotted_order).toBe(
          `${order}.${now.replace(/[-:.]/g, "").replace("Z", "000Z")}${config.id}`,
        );
      }
      if (expectedMode === "metadata") expectPrivate([h.operations[from]]);
      else expect(JSON.stringify(h.operations.slice(from))).toContain(privateText);
      expect(h.state.session.open_turns?.other).toEqual(before.session.open_turns?.other);
      h.messages = transcript({ id: "next", name: "Bash" });
      await hook("stop");
      if (expectedMode === "metadata") expectPrivate([h.operations[from]]);
      await hook("prompt", { prompt: "new ordinary prompt" });
      expect(h.state.session.current_turn_tracing).toBe("full");
      await hook("pre", { tool_use_id: "new-full" });
      expect(h.state.session.tool_tracing_modes?.["new-full"]).toBe("full");
      expect(h.errors).toEqual([]);
    },
  );

  it("preserves exact full/muted topology through tools, deferred Stop, SubagentStop and notification join", async () => {
    const topologies = [];
    for (const mode of ["full", "metadata"] as const) {
      reset(mode);
      await hook("prompt");
      const root = h.state.session.current_turn_run_id!;
      await hook("pre");
      await hook("post");
      await hook("pre", { tool_use_id: "task", tool_name: "Task" });
      await hook("post", {
        tool_use_id: "task",
        tool_name: "Task",
        tool_response: { agentId: "agent-123", content: privateText },
      });
      expect(h.state.session.task_run_map?.["agent-123"].tracing).toBe(mode);
      if (mode === "metadata") expect(JSON.stringify(h.state)).not.toContain(privateText);
      h.messages = transcript({ id: "task", name: "Task", agentId: "agent-123" });
      await hook("stop");
      expect(h.state.session.open_turns?.[root].tracing).toBe(mode);
      if (mode === "metadata") expect(JSON.stringify(h.state)).not.toContain(privateText);
      // A preference change never alters already launched work.
      h.policy = mode;
      await hook("agent", {
        agent_id: "agent-123",
        agent_type: "Explore",
        agent_transcript_path: "/agent-123",
      });
      const notification = "notification agent-123 " + privateText;
      await hook("prompt", { prompt: notification });
      expect(h.state.session.current_turn_tracing).toBe(mode);
      h.messages = transcript(undefined, notification);
      await hook("stop");
      expect(h.state.session.open_turns).toEqual({});
      expect(h.state.session.task_run_map).toEqual({});
      expect(h.errors).toEqual([]);
      topologies.push(topology());
      if (mode === "metadata") {
        expectPrivate();
        const llm = h.operations.find(
          (op) => op.action === "patch" && op.config.run_type === "llm",
        )!;
        expect(llm.config.extra.metadata.ls_model_name).toBe("claude-test");
        expect(llm.config.extra.metadata.usage_metadata.total_tokens).toBe(5);
      } else expect(JSON.stringify(h.operations)).toContain(privateText);
    }
    expect(topologies[1]).toEqual(topologies[0]);
  });

  it("absent PreToolUse follows the current snapshot with the same parent and fallback timing", async () => {
    const topologies = [];
    for (const mode of ["full", "metadata"] as const) {
      reset(mode);
      await hook("prompt");
      const parent = h.state.session.current_turn_run_id;
      await hook("post");
      expect(h.operations[1].config.parent_run_id).toBe(parent);
      if (mode === "metadata") expectPrivate([h.operations[1]]);
      else expect(JSON.stringify(h.operations[1])).toContain(privateText);
      expect(h.state.session.tool_tracing_modes?.tool).toBe(mode);
      h.messages = transcript({ id: "tool", name: "Bash" });
      await hook("stop");
      if (mode === "metadata") expectPrivate(h.operations.slice(1));
      else
        expect(h.operations.every((op) => !op.config.extra?.metadata?.ls_tracing_mode)).toBe(true);
      topologies.push(topology());
      expect(h.errors).toEqual([]);
    }
    expect(topologies[1]).toEqual(topologies[0]);
    reset("full");
    await hook("post");
    expect(h.operations).toEqual([]); // still returns when no current parent
    expect(h.state).toEqual({}); // privacy write does not resurrect a session
    reset("full");
    await hook("prompt");
    delete h.state.session.current_dotted_order;
    const incomplete = structuredClone(h.state);
    await hook("post");
    expect(h.state).toEqual(incomplete); // all missing-parent-context exits stay unchanged
  });

  it("retains delayed tool privacy evidence across turn resets without changing PostToolUse parent choice", async () => {
    reset("metadata");
    await hook("prompt");
    await hook("pre");
    h.messages = transcript();
    await hook("stop");
    h.policy = "full";
    await hook("prompt");
    const parent = h.state.session.current_turn_run_id;
    const from = h.operations.length;
    const openTurns = structuredClone(h.state.session.open_turns);
    await hook("post");
    expect(h.state.session.current_turn_tracing).toBe("full");
    expect(h.state.session.open_turns).toEqual(openTurns); // never creates an open root
    expect(h.operations.at(-1)!.config.parent_run_id).toBe(parent);
    h.messages = transcript({ id: "tool", name: "Bash" });
    await hook("stop");
    expectPrivate([h.operations[from]]);
    expect(JSON.stringify(h.operations.slice(from + 1))).toContain(privateText);
    expect(h.errors).toEqual([]);
  });

  it("uses interrupted, compaction and workflow snapshots with identical topology", async () => {
    const topologies = [];
    for (const mode of ["full", "metadata"] as const) {
      reset(mode);
      await hook("prompt");
      h.messages = transcript();
      h.policy = mode === "full" ? "metadata" : "full";
      const from = h.operations.length;
      await hook("prompt"); // closes the prior snapshot before creating the next
      if (mode === "metadata") expectPrivate(h.operations.slice(from, -1));
      h.policy = mode;
      await hook("precompact", { trigger: "manual" });
      h.policy = mode === "full" ? "metadata" : "full";
      await hook("postcompact", { trigger: "manual", compact_summary: privateText });
      if (mode === "metadata") expectPrivate([h.operations.at(-1)!]);
      // Start a fresh turn with the intended workflow launch mode.
      h.policy = mode;
      await hook("prompt");
      await hook("pre", { tool_name: "Workflow" });
      await hook("post", {
        tool_name: "Workflow",
        tool_response: {
          status: "async_launched",
          taskId: "workflow-task",
          runId: "wf_test",
          content: privateText,
        },
      });
      h.messages = transcript({ id: "tool", name: "Workflow" });
      await hook("stop");
      h.policy = mode;
      await hook("agent", {
        agent_id: "stage",
        agent_type: "workflow-subagent",
        agent_transcript_path: "/workflows/wf_test/agent-stage",
      });
      await hook("prompt", { prompt: "workflow-task " + privateText });
      h.messages = transcript(undefined, "workflow-task " + privateText);
      await hook("stop");
      expect(h.state.session.open_turns).toEqual({});
      expect(h.errors).toEqual([]);
      topologies.push(topology());
      if (mode === "metadata") {
        const workflow = h.operations.findIndex((op) => op.config.name === "Workflow");
        expectPrivate(h.operations.slice(workflow));
      }
    }
    expect(topologies[1]).toEqual(topologies[0]);
  });

  it("keeps an owned full launch full while policy is muted, including synchronous subagents", async () => {
    reset("full");
    await hook("prompt");
    h.policy = "metadata";
    await hook("pre", { tool_use_id: "task", tool_name: "Task" });
    expect(h.state.session.tool_tracing_modes?.task).toBe("full");
    await hook("agent", {
      agent_id: "sync-agent",
      agent_type: "Explore",
      agent_transcript_path: "/agent-sync",
    });
    await hook("post", {
      tool_use_id: "task",
      tool_name: "Task",
      tool_response: { agentId: "sync-agent", content: privateText },
    });
    h.messages = transcript({ id: "task", name: "Task", agentId: "sync-agent" });
    await hook("stop");
    expect(h.errors).toEqual([]);
    expect(
      h.operations.filter((op) => op.config.extra?.metadata?.ls_tracing_mode === "metadata"),
    ).toEqual([]);
    expect(JSON.stringify(h.operations)).toContain(privateText);
    expect(h.state.session.open_turns).toEqual({});
  });

  it("missing task snapshot falls back to its launching turn without changing its parent", async () => {
    reset("full");
    await hook("prompt");
    await hook("pre", { tool_use_id: "task" });
    await hook("post", {
      tool_use_id: "task",
      tool_name: "Task",
      tool_response: { agentId: "unknown-agent", content: privateText },
    });
    const task = h.state.session.task_run_map!["unknown-agent"];
    delete task.tracing;
    const from = h.operations.length;
    await hook("agent", {
      agent_id: "unknown-agent",
      agent_type: "Explore",
      agent_transcript_path: "/agent-unknown",
    });
    expect(JSON.stringify(h.operations.slice(from))).toContain(privateText);
    expect(
      h.operations.slice(from).every((op) => !op.config.extra?.metadata?.ls_tracing_mode),
    ).toBe(true);
    expect(h.operations[from + 1].config.parent_run_id).toBe(task.run_id);
    expect(h.errors).toEqual([]);
  });

  it("auto compaction and failure/end patches use saved modes rather than the new policy", async () => {
    reset("metadata");
    await hook("prompt");
    h.policy = "full";
    await hook("precompact", { trigger: "auto" });
    await hook("postcompact", { trigger: "auto", compact_summary: privateText });
    await hook("failure", { error: privateText, error_details: privateText });
    expectPrivate();
    expect(h.operations.at(-1)!.config.extra.metadata.status).toBe("error");
    reset("metadata");
    await hook("prompt");
    h.messages = transcript();
    h.policy = "full";
    await hook("end");
    expectPrivate();
    expect(h.errors).toEqual([]);
  });
});

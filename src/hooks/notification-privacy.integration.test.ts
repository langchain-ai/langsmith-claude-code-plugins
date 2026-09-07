import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { USER_PROMPT_TURN_NAME } from "../constants.js";
import { getSessionState, loadState, saveState } from "../state.js";
import type { SessionState, TracingMode } from "../types.js";

const mocks = vi.hoisted(() => ({
  readStdin: vi.fn(),
  config: vi.fn(),
  postRun: vi.fn(),
  closeInterruptedTurn: vi.fn(),
  error: vi.fn(),
}));

// Exercise the actual hook, privacy boundary, task resolver, and on-disk state.
// Only capture payloads at the SDK boundary; never mock createRunTree's policy.
vi.mock("langsmith", async (importOriginal) => {
  const actual = await importOriginal<typeof import("langsmith")>();
  return {
    ...actual,
    RunTree: class {
      constructor(private config: Record<string, unknown>) {}
      async postRun() {
        await mocks.postRun(this.config);
      }
    },
  };
});
vi.mock("../langsmith.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../langsmith.js")>();
  return {
    ...actual,
    initTracing: vi.fn(),
    closeInterruptedTurn: mocks.closeInterruptedTurn,
  };
});
vi.mock("../utils/stdin.js", () => ({ readStdin: mocks.readStdin }));
vi.mock("../utils/hook-init.js", () => ({
  initHook: mocks.config,
  expandHome: (path: string) => path,
}));
vi.mock("../config.js", () => ({ loadConfig: mocks.config }));
vi.mock("../logger.js", () => ({
  debug: vi.fn(),
  error: mocks.error,
  warn: vi.fn(),
  log: vi.fn(),
  initLogger: vi.fn(),
}));

const sessionId = "notification-privacy";
const taskId = "a1234567890abcdef";
const launchRunId = "01900000-0000-7000-8000-000000000001";
const toolRunId = "01900000-0000-7000-8000-000000000002";
const launchOrder = `20260101T000000000000Z${launchRunId}`;
const toolOrder = `${launchOrder}.20260101T000001000000Z${toolRunId}`;
const privateResult = "PRIVATE BACKGROUND TASK RESULT";
const privateMetadata = "PRIVATE CUSTOM METADATA";
const notification = `<task-notification>
<task-id>${taskId}</task-id>
<status>completed</status>
<summary>${privateResult}</summary>
</task-notification>`;
let directory: string;
let stateFilePath: string;

type TaskEntry = NonNullable<SessionState["task_run_map"]>[string];

function session(): SessionState {
  return getSessionState(loadState(stateFilePath), sessionId);
}

function seed(overrides: Partial<SessionState> = {}): void {
  saveState(stateFilePath, {
    [sessionId]: {
      last_line: 0,
      turn_count: 1,
      updated: new Date().toISOString(),
      tracing: "full",
      ...overrides,
    },
  });
}

function seedTask(
  tool: "Agent" | "Workflow",
  threadMode: TracingMode,
  taskMode?: TracingMode,
  openTurnMode?: TracingMode,
): void {
  const entry: TaskEntry = {
    run_id: toolRunId,
    dotted_order: toolOrder,
    launching_turn_run_id: launchRunId,
    ...(taskMode ? { tracing: taskMode } : {}),
    ...(tool === "Workflow"
      ? { is_workflow: true, workflow_run_id: "wf_private", subagent_done: true }
      : { deferred: { parent_run_id: launchRunId }, subagent_done: false }),
  };
  seed({
    tracing: threadMode,
    task_run_map: { [taskId]: entry },
    open_turns: {
      [launchRunId]: {
        run_id: launchRunId,
        trace_id: launchRunId,
        dotted_order: launchOrder,
        stop_seen: true,
        agent_ids: [taskId],
        ...(openTurnMode ? { tracing: openTurnMode } : {}),
      },
    },
  });
}

async function submit(prompt: string): Promise<void> {
  vi.resetModules();
  const posts = mocks.postRun.mock.calls.length;
  mocks.readStdin.mockResolvedValue({
    session_id: sessionId,
    transcript_path: "",
    cwd: directory,
    hook_event_name: "UserPromptSubmit",
    prompt,
  });
  await import("./user-prompt-submit.js");
  // main() is invoked at import time without exporting its promise. Wait for
  // the persisted turn identity, not just postRun, before inspecting/resetting.
  await vi.waitFor(() => {
    expect(mocks.postRun).toHaveBeenCalledTimes(posts + 1);
    expect(session().current_turn_run_id).toBe(mocks.postRun.mock.calls[posts][0].id);
  });
  expect(mocks.error).not.toHaveBeenCalled();
}

function expectTurnMode(mode: TracingMode, prompt: string): void {
  const payload = mocks.postRun.mock.calls.at(-1)![0];
  expect(payload.name).toBe(USER_PROMPT_TURN_NAME);
  expect(payload.inputs).toEqual(
    mode === "full" ? { messages: [{ role: "user", content: prompt }] } : {},
  );
  expect(session().current_turn_tracing).toBe(mode);
  if (mode === "metadata") {
    expect(payload.outputs).toEqual({});
    expect(payload.extra.metadata.ls_tracing_mode).toBe("metadata");
    expect(JSON.stringify(payload)).not.toContain(prompt);
    expect(JSON.stringify(payload)).not.toContain(privateResult);
    expect(JSON.stringify(payload)).not.toContain(privateMetadata);
  } else {
    expect(payload.extra.metadata.private).toBe(privateMetadata);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  directory = mkdtempSync(join(tmpdir(), "notification-privacy-"));
  stateFilePath = join(directory, "state.json");
  mocks.config.mockReturnValue({
    enabled: true,
    apiKey: "test-key",
    project: "test-project",
    stateFilePath,
    customMetadata: { private: privateMetadata },
  });
  mocks.postRun.mockResolvedValue(undefined);
  mocks.closeInterruptedTurn.mockResolvedValue({ lastLine: 0, turnsTraced: 1 });
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});

describe("UserPromptSubmit notification privacy", () => {
  it.each(["full", "metadata"] as const)(
    "normal prompts follow the %s thread preference, not unrelated tasks",
    async (mode) => {
      seedTask("Agent", mode, mode === "full" ? "metadata" : "full");
      const prompt = "PRIVATE NORMAL USER PROMPT";
      await submit(prompt);
      expectTurnMode(mode, prompt);
      expect(session().tracing).toBe(mode);
      expect(session().current_notification_agent_id).toBeUndefined();
      expect(mocks.postRun.mock.calls[0][0].parent_run_id).toBeUndefined();
    },
  );

  describe.each(["Agent", "Workflow"] as const)("%s task notifications", (tool) => {
    it.each([
      { task: "metadata", thread: "full", expected: "metadata" },
      { task: "full", thread: "metadata", expected: "metadata" },
      { task: "full", thread: "full", expected: "full" },
      { task: "metadata", thread: "metadata", expected: "metadata" },
      { task: undefined, thread: "full", expected: "metadata" },
    ] as const)(
      "launch $task / current $thread emits and persists $expected",
      async ({ task, thread, expected }) => {
        // No open-turn snapshot: explicit task consent must stand on its own;
        // legacy entries with unknown consent must not borrow the thread's full.
        seedTask(tool, thread, task);
        const taskMap = session().task_run_map;
        await submit(notification);
        expectTurnMode(expected, notification);
        const payload = mocks.postRun.mock.calls[0][0];
        expect(payload.parent_run_id).toBe(toolRunId);
        expect(payload.trace_id).toBe(launchRunId);
        expect(payload.dotted_order.startsWith(`${toolOrder}.`)).toBe(true);
        expect(session()).toMatchObject({
          tracing: thread,
          current_notification_agent_id: taskId,
          current_parent_run_id: toolRunId,
          current_trace_id: launchRunId,
          task_run_map: taskMap,
        });
      },
    );

    it.each(["full", "metadata"] as const)(
      "resolves legacy entries from the launching open turn's %s snapshot",
      async (mode) => {
        seedTask(tool, "full", undefined, mode);
        await submit(notification);
        expectTurnMode(mode, notification);
        expect(session().tracing).toBe("full");
        expect(session().current_notification_agent_id).toBe(taskId);
      },
    );
  });

  it.each(["Agent", "Workflow"] as const)(
    "retains a late %s correlation after its parent has closed",
    async (tool) => {
      seedTask(tool, "full", "metadata");
      const taskMap = session().task_run_map;
      saveState(stateFilePath, { [sessionId]: { ...session(), open_turns: {} } });
      await submit("A new unrelated prompt");
      expect(session().task_run_map).toEqual(taskMap);
      expect(session().open_turns).toEqual({});
      await submit(notification);
      expectTurnMode("metadata", notification);
      expect(session().current_parent_run_id).toBe(toolRunId);
      expect(session().open_turns).toEqual({});
    },
  );

  it.each(["normal", "notification"] as const)(
    "preserves tool_launch_contexts across a %s prompt reset",
    async (kind) => {
      seedTask("Agent", "full", "metadata");
      const contexts: NonNullable<SessionState["tool_launch_contexts"]> = {
        delayed: {
          start_time: 1767225600000,
          tracing: "metadata",
          turn: {
            run_id: launchRunId,
            trace_id: launchRunId,
            dotted_order: launchOrder,
            start_time: "2026-01-01T00:00:00.000Z",
            turn_number: 1,
            runtime_version: "2.0.0",
            approval_policy: "default",
          },
        },
        other: { start_time: 1767225601000, tracing: "full" },
      };
      seed({
        ...session(),
        current_turn_run_id: "interrupted-turn",
        current_turn_tracing: "full",
        tool_launch_contexts: contexts,
        tool_start_times: { delayed: 1767225600000 },
        traced_tool_use_ids: ["old-tool"],
      });
      const prompt = kind === "notification" ? notification : "PRIVATE NEXT PROMPT";
      await submit(prompt);
      expect(mocks.closeInterruptedTurn).toHaveBeenCalledTimes(1);
      expectTurnMode(kind === "notification" ? "metadata" : "full", prompt);
      expect(session().tool_launch_contexts).toEqual(contexts);
      expect(session().tool_start_times).toEqual({});
      expect(session().traced_tool_use_ids).toEqual([]);
      expect(session().current_turn_run_id).not.toBe("interrupted-turn");
    },
  );
});

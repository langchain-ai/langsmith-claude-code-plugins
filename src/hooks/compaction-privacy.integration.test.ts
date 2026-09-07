import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSessionState, loadState, saveState } from "../state.js";
import type { SessionState, TracingMode } from "../types.js";

const mocks = vi.hoisted(() => ({
  readStdin: vi.fn(),
  config: vi.fn(),
  postRun: vi.fn(),
  patchRun: vi.fn(),
  closeInterruptedTurn: vi.fn(),
}));

// Keep the real privacy boundary and on-disk state; capture only the SDK payloads.
vi.mock("langsmith", async (importOriginal) => {
  const actual = await importOriginal<typeof import("langsmith")>();
  return {
    ...actual,
    RunTree: class {
      constructor(private config: Record<string, unknown>) {}
      async postRun() {
        await mocks.postRun(this.config);
      }
      async patchRun() {
        await mocks.patchRun(this.config);
      }
    },
  };
});
vi.mock("../langsmith.js", () => ({
  initTracing: vi.fn(),
  flushPendingTraces: vi.fn().mockResolvedValue(undefined),
  generateDottedOrderSegment: (_time: string, id: string) => id,
  closeInterruptedTurn: mocks.closeInterruptedTurn,
  closeAgentToolRun: vi.fn(),
  completeTurnRun: vi.fn(),
  turnIdentityFromOpenTurn: vi.fn(),
}));
vi.mock("../utils/stdin.js", () => ({ readStdin: mocks.readStdin }));
vi.mock("../utils/hook-init.js", () => ({
  initHook: mocks.config,
  expandHome: (path: string) => path,
}));
vi.mock("../config.js", () => ({ loadConfig: mocks.config }));
vi.mock("../logger.js", () => ({
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
  initLogger: vi.fn(),
}));

const sessionId = "compaction-privacy";
const summary = "PRIVATE COMPACTION SUMMARY";
let directory: string;
let stateFilePath: string;

function session(): SessionState {
  return getSessionState(loadState(stateFilePath), sessionId);
}

function seed(overrides: Partial<SessionState> = {}): void {
  saveState(stateFilePath, {
    [sessionId]: {
      last_line: 0,
      turn_count: 1,
      updated: new Date().toISOString(),
      tracing: "metadata",
      ...overrides,
    },
  });
}

async function runHook(
  hook: string,
  done: () => void,
  input: Record<string, unknown> = {},
): Promise<void> {
  vi.resetModules();
  mocks.readStdin.mockResolvedValue({
    session_id: sessionId,
    transcript_path: "",
    cwd: directory,
    trigger: "manual",
    compact_summary: summary,
    error: "api_error",
    reason: "exit",
    ...input,
  });
  // Entry points invoke main without exporting its promise, so wait for the
  // terminal state update (or command response) before invoking the next hook.
  await import(/* @vite-ignore */ `./${hook}.ts`);
  await vi.waitFor(done);
}

async function preCompact(): Promise<void> {
  await runHook("pre-compact", () => {
    expect(session().compaction_start_time).toEqual(expect.any(Number));
  });
}

async function postCompact(): Promise<void> {
  const posts = mocks.postRun.mock.calls.length;
  await runHook("post-compact", () => {
    expect(mocks.postRun).toHaveBeenCalledTimes(posts + 1);
    expect(session().compaction_start_time).toBeUndefined();
    expect(session().compaction_tracing).toBeUndefined();
  });
}

function expectCompactionMode(mode: TracingMode): void {
  const payload = mocks.postRun.mock.calls.at(-1)![0];
  expect(payload.name).toBe("Context Compaction (manual)");
  expect(payload.outputs).toEqual(mode === "full" ? { compact_summary: summary } : {});
  if (mode === "metadata") {
    expect(payload.extra.metadata.ls_tracing_mode).toBe("metadata");
    expect(JSON.stringify(payload)).not.toContain(summary);
    expect(JSON.stringify(payload)).not.toContain("PRIVATE CUSTOM METADATA");
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  directory = mkdtempSync(join(tmpdir(), "compaction-privacy-"));
  stateFilePath = join(directory, "state.json");
  mocks.config.mockReturnValue({
    enabled: true,
    apiKey: "test-key",
    project: "test-project",
    stateFilePath,
    customMetadata: { private: "PRIVATE CUSTOM METADATA" },
  });
  mocks.postRun.mockResolvedValue(undefined);
  mocks.patchRun.mockResolvedValue(undefined);
  mocks.closeInterruptedTurn.mockResolvedValue({ lastLine: 0, turnsTraced: 1 });
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});

describe("compaction tracing snapshot privacy", () => {
  it("full turn failure -> /trace off -> compaction emits metadata only", async () => {
    seed({ tracing: "full", current_turn_run_id: "failed-turn", current_turn_tracing: "full" });
    await runHook("stop-failure", () => {
      expect(session().current_turn_run_id).toBeUndefined();
    });
    expect(mocks.patchRun.mock.calls[0][0].error).toBe("api_error");
    expect(session().current_turn_tracing).toBeUndefined();

    const stdout = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    await runHook(
      "user-prompt-submit",
      () => {
        expect(stdout).toHaveBeenCalled();
        expect(session().tracing).toBe("metadata");
      },
      { prompt: "/trace off" },
    );
    await preCompact();
    expect(session().compaction_tracing).toBe("metadata");
    await postCompact();
    expectCompactionMode("metadata");
  });

  it("PreCompact ignores a stale full snapshot without an active turn identity", async () => {
    seed({ current_turn_tracing: "full" });
    await preCompact();
    expect(session().compaction_tracing).toBe("metadata");
    await postCompact();
    expectCompactionMode("metadata");
  });

  it("PostCompact without PreCompact ignores a stale full snapshot without an active identity", async () => {
    seed({ current_turn_tracing: "full" });
    await postCompact();
    expectCompactionMode("metadata");
  });

  it.each(["full", "metadata"] as const)(
    "preserves an active %s turn snapshot over session policy",
    async (mode) => {
      seed({
        tracing: mode === "full" ? "metadata" : "full",
        current_turn_run_id: "active-turn",
        current_turn_tracing: mode,
      });
      // Exercise the fallback when PreCompact is missing, then the normal pair.
      await postCompact();
      expectCompactionMode(mode);
      await preCompact();
      expect(session().compaction_tracing).toBe(mode);
      await postCompact();
      expectCompactionMode(mode);
    },
  );

  it.each(["full", "metadata"] as const)(
    "preserves the compaction %s snapshot after the active turn ends and policy changes",
    async (mode) => {
      seed({ current_turn_run_id: "active-turn", current_turn_tracing: mode });
      await preCompact();
      seed({
        ...session(),
        tracing: mode === "full" ? "metadata" : "full",
        current_turn_run_id: undefined,
        current_turn_tracing: undefined,
      });
      await postCompact();
      expectCompactionMode(mode);
    },
  );

  it.each([false, true])("SessionEnd clears the turn snapshot (close fails: %s)", async (fails) => {
    seed({ current_turn_run_id: "interrupted-turn", current_turn_tracing: "full" });
    if (fails) mocks.closeInterruptedTurn.mockRejectedValueOnce(new Error("close failed"));
    await runHook("session-end", () => {
      expect(session().current_turn_run_id).toBeUndefined();
    });
    expect(session().current_turn_tracing).toBeUndefined();
    await preCompact();
    await postCompact();
    expectCompactionMode("metadata");
  });

  it("StopFailure clears the turn snapshot even when its patch fails", async () => {
    seed({ current_turn_run_id: "failed-turn", current_turn_tracing: "full" });
    mocks.patchRun.mockRejectedValueOnce(new Error("patch failed"));
    await runHook("stop-failure", () => {
      expect(session().current_turn_run_id).toBeUndefined();
    });
    expect(session().current_turn_tracing).toBeUndefined();
  });
});

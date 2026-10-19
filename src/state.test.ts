import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { withFileLock } from "@langchain/plugins-base/storage";
import {
  loadState,
  getSessionState,
  updateSessionState,
  atomicUpdateState,
  pruneOldSessions,
  advanceToolTracingProgress,
} from "./state.js";
import type { TracingState } from "./types.js";

const warn = vi.hoisted(() => vi.fn());
vi.mock("./logger.js", () => ({ warn }));

let tmpDir: string;

async function holdLock(path: string): Promise<{ release(): Promise<void> }> {
  let release = () => {};
  let markAcquired = () => {};
  const acquired = new Promise<void>((resolve) => {
    markAcquired = resolve;
  });
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const holder = withFileLock(path, async () => {
    markAcquired();
    await held;
  });
  await acquired;
  return {
    release: async () => {
      release();
      await holder;
    },
  };
}

function makeStateLockReleaseFail(stateFilePath: string): void {
  const claimDirectory = `${stateFilePath}.claims`;
  const claimName = readdirSync(claimDirectory).find((name) => name.endsWith(".json"));
  if (!claimName) throw new Error("The shared state lock claim is missing");
  const claimPath = join(claimDirectory, claimName);
  unlinkSync(claimPath);
  mkdirSync(claimPath);
}

beforeEach(() => {
  tmpDir = join(tmpdir(), `state-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("advanceToolTracingProgress", () => {
  it.each(["post", "transcript"] as const)(
    "joins %s first without retaining completed history",
    (first) => {
      const original = {
        last_line: -1,
        turn_count: 0,
        updated: "",
        tool_tracing_modes: { tool: "metadata" as const, pending: "full" as const },
      };
      const once = advanceToolTracingProgress(original, ["tool", "untracked"], first);
      expect(once.tool_tracing_progress).toEqual({ tool: first });
      const twice = advanceToolTracingProgress({ ...original, ...once }, ["tool"], first);
      expect(twice).toEqual(once);
      const joined = advanceToolTracingProgress(
        { ...original, ...twice },
        ["tool", "tool"],
        first === "post" ? "transcript" : "post",
      );
      expect(joined).toEqual({
        tool_tracing_modes: { pending: "full" },
        tool_tracing_progress: {},
      });
      expect(original.tool_tracing_modes).toEqual({ tool: "metadata", pending: "full" });
    },
  );

  it("does not accumulate completed IDs over many turns", () => {
    let session = getSessionState({}, "session");
    for (let i = 0; i < 1000; i++) {
      const id = `tool-${i}`;
      session.tool_tracing_modes = { ...session.tool_tracing_modes, [id]: "metadata" };
      session = { ...session, ...advanceToolTracingProgress(session, [id], "post") };
      session = { ...session, ...advanceToolTracingProgress(session, [id], "transcript") };
    }
    expect(session.tool_tracing_modes).toEqual({});
    expect(session.tool_tracing_progress).toEqual({});
  });
});

describe("loadState", () => {
  it("returns empty object for non-existent file", () => {
    expect(loadState(join(tmpDir, "missing.json"))).toEqual({});
  });

  it("loads saved state", async () => {
    const path = join(tmpDir, "state.json");
    const state = { "session-1": { last_line: 5, turn_count: 2, updated: "2025-01-01T00:00:00Z" } };
    writeFileSync(path, JSON.stringify(state));
    expect(loadState(path)).toEqual(state);
  });

  it("returns empty object for malformed JSON", () => {
    const path = join(tmpDir, "bad.json");
    writeFileSync(path, "not json");
    expect(loadState(path)).toEqual({});
  });
});

describe("getSessionState", () => {
  it("returns defaults for unknown session", () => {
    const result = getSessionState({}, "unknown");
    expect(result).toEqual({ last_line: -1, turn_count: 0, updated: "", task_run_map: {} });
  });

  it("returns existing session state", () => {
    const state = {
      "session-1": { last_line: 42, turn_count: 7, updated: "2025-01-01T00:00:00Z" },
    };
    expect(getSessionState(state, "session-1")).toEqual(state["session-1"]);
  });
});

describe("atomicUpdateState", () => {
  it("reads, transforms, and writes state atomically", async () => {
    const path = join(tmpDir, "state.json");
    writeFileSync(path, JSON.stringify({ s1: { last_line: 0, turn_count: 0, updated: "" } }));

    await atomicUpdateState(path, (state) => ({
      ...state,
      s1: { ...state.s1, last_line: 42 },
    }));

    expect(loadState(path).s1.last_line).toBe(42);
  });

  it("creates the file if it does not exist", async () => {
    const path = join(tmpDir, "new-state.json");

    await atomicUpdateState(path, (state) => ({
      ...state,
      s1: { last_line: 1, turn_count: 0, updated: "" },
    }));

    expect(loadState(path).s1.last_line).toBe(1);
  });

  it("serializes concurrent writers so no update is lost", async () => {
    const path = join(tmpDir, "concurrent.json");
    writeFileSync(path, JSON.stringify({ counter: { last_line: 0, turn_count: 0, updated: "" } }));

    // Fire 10 concurrent increments — without locking, race conditions would
    // cause lost updates; with the lock every increment must land.
    const N = 10;
    await Promise.all(
      Array.from({ length: N }, () =>
        atomicUpdateState(path, (state) => ({
          ...state,
          counter: { ...state.counter, last_line: state.counter.last_line + 1 },
        })),
      ),
    );

    expect(loadState(path).counter.last_line).toBe(N);
  });

  it("releases the lock even when the transform throws", async () => {
    const path = join(tmpDir, "throw.json");
    writeFileSync(path, JSON.stringify({ s1: { last_line: 0, turn_count: 0, updated: "" } }));

    await expect(
      atomicUpdateState(path, () => {
        throw new Error("transform error");
      }),
    ).rejects.toThrow("transform error");

    // Lock should be gone — a subsequent call must succeed
    await atomicUpdateState(path, (state) => ({
      ...state,
      s1: { ...state.s1, last_line: 99 },
    }));
    expect(loadState(path).s1.last_line).toBe(99);
  });

  it("excludes a writer still running the previous version's state lock", async () => {
    const path = join(tmpDir, "upgrade.json");
    const updates = 300;
    const oldWriter = spawn(
      process.execPath,
      [
        fileURLToPath(new URL("./fixtures/main-state-writer.mjs", import.meta.url)),
        path,
        "old",
        `${updates}`,
      ],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
    const oldDone = new Promise((resolve) => oldWriter.once("exit", resolve));
    for (let update = 0; update < updates; update += 1) {
      await atomicUpdateState(path, (state) => {
        const session = state.new ?? { last_line: 0, turn_count: 0, updated: "" };
        return { ...state, new: { ...session, last_line: session.last_line + 1 } };
      });
    }
    expect(await oldDone).toBe(0);

    expect(loadState(path).old.last_line).toBe(updates);
    expect(loadState(path).new.last_line).toBe(updates);
  }, 60000);

  it("waits the full time for a held lock only for the first update, then probes briefly", async () => {
    vi.resetModules();
    const { atomicUpdateState: update } = await import("./state.js");
    const path = join(tmpDir, "once.json");
    writeFileSync(path, JSON.stringify({ s1: { last_line: 0, turn_count: 0, updated: "" } }));
    const holder = await holdLock(path);
    const bump = (state: TracingState) => ({
      ...state,
      s1: { ...state.s1, last_line: state.s1.last_line + 1 },
    });

    try {
      await update(path, bump);
      const started = Date.now();
      await update(path, bump);
      await update(path, bump);
      expect(Date.now() - started).toBeLessThan(900);
    } finally {
      await holder.release();
    }
  }, 10000);

  it("keeps an update made while another process holds the lock and merges it for the next holder", async () => {
    vi.resetModules();
    const held = await import("./state.js");
    const path = join(tmpDir, "kept.json");
    writeFileSync(path, JSON.stringify({ s1: { last_line: 3, turn_count: 1, updated: "" } }));
    const holder = await holdLock(path);
    const bump = (state: TracingState) => ({
      ...state,
      s1: { ...state.s1, last_line: state.s1.last_line + 1, current_turn_run_id: "turn" },
    });

    try {
      const started = Date.now();
      await held.atomicUpdateState(path, bump);
      expect(Date.now() - started).toBeLessThan(2000);
      expect(JSON.parse(readFileSync(path, "utf-8")).s1.last_line).toBe(3);
      expect(held.loadState(path).s1).toMatchObject({ last_line: 4, current_turn_run_id: "turn" });
    } finally {
      await holder.release();
    }

    vi.resetModules();
    const next = await import("./state.js");
    await next.atomicUpdateState(path, (state) => bump(state));
    expect(JSON.parse(readFileSync(path, "utf-8")).s1).toMatchObject({
      last_line: 5,
      current_turn_run_id: "turn",
    });
    expect(existsSync(`${path}.pending`)).toBe(false);
  }, 15000);

  it("lets later processes probe briefly once an update is pending, and merges every update in order", async () => {
    vi.resetModules();
    const first = await import("./state.js");
    const path = join(tmpDir, "ordered.json");
    writeFileSync(path, JSON.stringify({ s1: { last_line: 0, turn_count: 0, updated: "" } }));
    const holder = await holdLock(path);
    const set = (line: number) => (state: TracingState) => ({
      ...state,
      s1: { ...state.s1, last_line: line },
    });

    try {
      await first.atomicUpdateState(path, set(1));
      vi.resetModules();
      const second = await import("./state.js");
      const started = Date.now();
      await second.atomicUpdateState(path, set(2));
      expect(Date.now() - started).toBeLessThan(800);
      expect(second.loadState(path).s1.last_line).toBe(2);
    } finally {
      await holder.release();
    }

    vi.resetModules();
    const third = await import("./state.js");
    await third.atomicUpdateState(path, set(3));
    expect(JSON.parse(readFileSync(path, "utf-8")).s1.last_line).toBe(3);
    expect(readdirSync(tmpDir).sort()).toEqual(["ordered.json", "ordered.json.claims"]);
  }, 15000);

  it("merges updates saved back to back in one process in the order they were made", async () => {
    vi.resetModules();
    const held = await import("./state.js");
    const path = join(tmpDir, "sequence.json");
    writeFileSync(path, JSON.stringify({ s1: { last_line: 0, turn_count: 0, updated: "" } }));
    const holder = await holdLock(path);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1_800_000_000_000);
    try {
      for (let line = 1; line <= 8; line++) {
        await held.atomicUpdateState(path, (state) => ({
          ...state,
          s1: { ...state.s1, last_line: line },
        }));
      }
    } finally {
      vi.useRealTimers();
      await holder.release();
    }
    vi.resetModules();
    await (await import("./state.js")).atomicUpdateState(path, (state) => state);
    expect(JSON.parse(readFileSync(path, "utf-8")).s1.last_line).toBe(8);
  }, 15000);

  it("keeps every update across 20 turns, some made under a held lock, and leaves no extra files", async () => {
    const path = join(tmpDir, "turns.json");
    writeFileSync(path, JSON.stringify({ s1: { last_line: 0, turn_count: 0, updated: "" } }));
    const count = (state: TracingState) => ({
      ...state,
      s1: { ...state.s1, last_line: state.s1.last_line + 1 },
    });
    for (let turn = 0; turn < 20; turn++) {
      vi.resetModules();
      const hooks = await import("./state.js");
      const holder = turn >= 5 && turn < 8 ? await holdLock(path) : undefined;
      try {
        for (let update = 0; update < 3; update++) await hooks.atomicUpdateState(path, count);
      } finally {
        await holder?.release();
      }
      expect(hooks.loadState(path).s1.last_line).toBe((turn + 1) * 3);
    }
    vi.resetModules();
    await (await import("./state.js")).atomicUpdateState(path, (state) => state);

    expect(JSON.parse(readFileSync(path, "utf-8")).s1.last_line).toBe(60);
    expect(readdirSync(tmpDir).sort()).toEqual(["turns.json", "turns.json.claims"]);
  }, 60000);

  it("ignores a half-written pending file and sweeps it once abandoned", async () => {
    const path = join(tmpDir, "crashed.json");
    writeFileSync(path, JSON.stringify({ s1: { last_line: 7, turn_count: 0, updated: "" } }));
    mkdirSync(`${path}.pending`);
    const partial = join(`${path}.pending`, "0000000000001-1-x.pending.tmp");
    writeFileSync(partial, '[{"session":"s1","set":');
    expect(loadState(path).s1.last_line).toBe(7);
    utimesSync(partial, new Date(0), new Date(0));

    await atomicUpdateState(path, (state) => state);

    expect(existsSync(`${path}.pending`)).toBe(false);
  });

  it("preserves a state write error when shared lock cleanup also fails", async () => {
    const path = join(tmpDir, "write-error.json");
    writeFileSync(path, JSON.stringify({ s1: { last_line: 3, turn_count: 1, updated: "" } }));
    warn.mockClear();
    let writeError: unknown;

    try {
      try {
        await atomicUpdateState(path, (state) => {
          makeStateLockReleaseFail(path);
          rmSync(path);
          mkdirSync(path);
          return { ...state, s1: { ...state.s1, last_line: 99 } };
        });
      } catch (error) {
        writeError = error;
      }

      expect(writeError).toBeInstanceOf(Error);
      expect((writeError as NodeJS.ErrnoException).code).toBeTruthy();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Could not release"));
    } finally {
      warn.mockClear();
    }
  });

  it("warns but succeeds when lock cleanup fails after state is written", async () => {
    const path = join(tmpDir, "committed.json");
    writeFileSync(path, JSON.stringify({ counter: { last_line: 0, turn_count: 0, updated: "" } }));
    warn.mockClear();
    let mutationCalls = 0;

    try {
      await expect(
        atomicUpdateState(path, (state) => {
          mutationCalls++;
          makeStateLockReleaseFail(path);
          return {
            ...state,
            counter: { ...state.counter, last_line: state.counter.last_line + 1 },
          };
        }),
      ).resolves.toBeUndefined();
      expect(mutationCalls).toBe(1);
      expect(loadState(path).counter.last_line).toBe(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Could not release"));
    } finally {
      warn.mockClear();
    }
  });
});

describe("pruneOldSessions", () => {
  const now = Date.now();
  const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

  it("removes sessions older than 24 hours", () => {
    const state = {
      old: { last_line: 5, turn_count: 1, updated: twoDaysAgo },
      recent: { last_line: 10, turn_count: 2, updated: oneHourAgo },
    };
    const result = pruneOldSessions(state, now);
    expect(result).not.toHaveProperty("old");
    expect(result).toHaveProperty("recent");
  });

  it("removes sessions with empty updated field", () => {
    const state = {
      noTimestamp: { last_line: 0, turn_count: 0, updated: "" },
      recent: { last_line: 1, turn_count: 1, updated: oneHourAgo },
    };
    const result = pruneOldSessions(state, now);
    expect(result).not.toHaveProperty("noTimestamp");
    expect(result).toHaveProperty("recent");
  });

  it("returns empty object when all sessions are stale", () => {
    const state = {
      old1: { last_line: 0, turn_count: 0, updated: twoDaysAgo },
      old2: { last_line: 0, turn_count: 0, updated: twoDaysAgo },
    };
    expect(pruneOldSessions(state, now)).toEqual({});
  });

  it("keeps all sessions when none are stale", () => {
    const state = {
      a: { last_line: 0, turn_count: 0, updated: oneHourAgo },
      b: { last_line: 0, turn_count: 0, updated: oneHourAgo },
    };
    const result = pruneOldSessions(state, now);
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("prunes sessions with current_turn_run_id older than 24 hours", () => {
    const state = {
      abandoned: {
        last_line: 500,
        turn_count: 50,
        updated: twoDaysAgo,
        current_turn_run_id: "run-abc-123",
      },
    };
    const result = pruneOldSessions(state, now);
    expect(result).not.toHaveProperty("abandoned");
  });

  it("preserves sessions with current_turn_run_id within 24 hours", () => {
    const state = {
      active: {
        last_line: 500,
        turn_count: 50,
        updated: oneHourAgo,
        current_turn_run_id: "run-abc-123",
      },
    };
    const result = pruneOldSessions(state, now);
    expect(result).toHaveProperty("active");
  });
});

describe("updateSessionState", () => {
  it("adds a new session", () => {
    const result = updateSessionState({}, "new-session", 10, 3);
    expect(result["new-session"].last_line).toBe(10);
    expect(result["new-session"].turn_count).toBe(3);
    expect(result["new-session"].updated).toBeTruthy();
  });

  it("updates an existing session", () => {
    const state = {
      s1: { last_line: 0, turn_count: 0, updated: "" },
    };
    const result = updateSessionState(state, "s1", 20, 5);
    expect(result.s1.last_line).toBe(20);
    expect(result.s1.turn_count).toBe(5);
  });

  it("preserves other sessions", () => {
    const state = {
      s1: { last_line: 5, turn_count: 1, updated: "old" },
      s2: { last_line: 10, turn_count: 2, updated: "old" },
    };
    const result = updateSessionState(state, "s1", 15, 3);
    expect(result.s2).toEqual(state.s2);
    expect(result.s1.last_line).toBe(15);
  });
});

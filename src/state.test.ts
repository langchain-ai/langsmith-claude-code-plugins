import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileLockTimeoutError, withFileLock } from "@langchain/plugins-base/storage";
import {
  loadState,
  saveState,
  getSessionState,
  updateSessionState,
  atomicUpdateState,
  pruneOldSessions,
  advanceToolTracingProgress,
} from "./state.js";

let tmpDir: string;
const tsxLoader = createRequire(import.meta.url).resolve("tsx/esm");
const stateModuleUrl = new URL("./state.ts", import.meta.url).href;

async function waitFor(condition: () => boolean, children: ChildProcess[]): Promise<void> {
  const deadline = Date.now() + 3000;
  while (!condition()) {
    const exited = children.find((child) => child.exitCode !== null || child.signalCode !== null);
    if (exited) {
      const status =
        exited.exitCode === null ? `signal ${exited.signalCode}` : `code ${exited.exitCode}`;
      throw new Error(`A state writer exited before reaching the barrier with ${status}`);
    }
    if (Date.now() >= deadline) throw new Error("Timed out waiting for state writers");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
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
    await saveState(path, state);
    expect(loadState(path)).toEqual(state);
  });

  it("returns empty object for malformed JSON", () => {
    const path = join(tmpDir, "bad.json");
    writeFileSync(path, "not json");
    expect(loadState(path)).toEqual({});
  });
});

describe("saveState", () => {
  it("creates parent directories if needed", async () => {
    const path = join(tmpDir, "deep", "nested", "state.json");
    await saveState(path, { s1: { last_line: 0, turn_count: 0, updated: "" } });
    const loaded = JSON.parse(readFileSync(path, "utf-8"));
    expect(loaded.s1.last_line).toBe(0);
  });

  it("overwrites existing state", async () => {
    const path = join(tmpDir, "state.json");
    await saveState(path, { s1: { last_line: 0, turn_count: 0, updated: "" } });
    await saveState(path, { s1: { last_line: 10, turn_count: 3, updated: "later" } });
    const loaded = JSON.parse(readFileSync(path, "utf-8"));
    expect(loaded.s1.last_line).toBe(10);
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
    await saveState(path, { s1: { last_line: 0, turn_count: 0, updated: "" } });

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
    await saveState(path, { counter: { last_line: 0, turn_count: 0, updated: "" } });

    // Fire 20 concurrent increments — without locking, race conditions would
    // cause lost updates; with the lock every increment must land.
    const N = 20;
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
    await saveState(path, { s1: { last_line: 0, turn_count: 0, updated: "" } });

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

  it("serializes updates from separate processes at the state lock barrier", async () => {
    const path = join(tmpDir, "processes.json");
    const childHome = join(tmpDir, "child-home");
    const goPath = join(tmpDir, "go");
    const releasePath = join(tmpDir, "release");
    const startedPaths = [join(tmpDir, "started-1"), join(tmpDir, "started-2")];
    const enteredPaths = [join(tmpDir, "entered-1"), join(tmpDir, "entered-2")];
    await saveState(path, { counter: { last_line: 0, turn_count: 0, updated: "" } });
    mkdirSync(childHome);

    const children = [0, 1].map((index) => {
      const script = `
        import { existsSync, writeFileSync } from "node:fs";
        import { atomicUpdateState } from ${JSON.stringify(stateModuleUrl)};
        const statePath = ${JSON.stringify(path)};
        const goPath = ${JSON.stringify(goPath)};
        const releasePath = ${JSON.stringify(releasePath)};
        const startedPath = ${JSON.stringify(startedPaths[index])};
        const enteredPath = ${JSON.stringify(enteredPaths[index])};
        const pause = new Int32Array(new SharedArrayBuffer(4));
        const waitForFile = (path) => {
          while (!existsSync(path)) Atomics.wait(pause, 0, 0, 5);
        };
        writeFileSync(startedPath, "started");
        waitForFile(goPath);
        await atomicUpdateState(statePath, (state) => {
          writeFileSync(enteredPath, "entered");
          waitForFile(releasePath);
          return {
            ...state,
            counter: { ...state.counter, last_line: state.counter.last_line + 1 },
          };
        });
      `;
      return spawn(process.execPath, ["--import", tsxLoader, "--input-type=module", "-e", script], {
        cwd: process.cwd(),
        env: {
          HOME: childHome,
          USERPROFILE: childHome,
          PATH: process.env.PATH ?? "",
          TMPDIR: childHome,
          TMP: childHome,
          TEMP: childHome,
          ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
        },
        stdio: "ignore",
        timeout: 7000,
        killSignal: "SIGKILL",
      });
    });
    const exits = children.map(
      (child, index) =>
        new Promise<PromiseSettledResult<void>>((resolve) => {
          child.once("error", (reason) => resolve({ status: "rejected", reason }));
          child.once("exit", (code, signal) => {
            if (code === 0) resolve({ status: "fulfilled", value: undefined });
            else {
              const status = code === null ? `signal ${signal}` : `code ${code}`;
              resolve({
                status: "rejected",
                reason: new Error(`State writer ${index + 1} exited with ${status}`),
              });
            }
          });
        }),
    );
    const claimDirectory = `${path}.claims`;
    const claimCount = () => {
      try {
        return readdirSync(claimDirectory).filter((name) => name.endsWith(".json")).length;
      } catch {
        return 0;
      }
    };
    let queuedClaimCount = 0;
    let enteredWhileHeld = 0;
    let barrierError: unknown;
    let barrierFailed = false;
    let cleanupError: unknown;
    let cleanupFailed = false;
    let exitResults: PromiseSettledResult<void>[] = [];

    try {
      await waitFor(() => startedPaths.every(existsSync), children);
      writeFileSync(goPath, "go");
      await waitFor(
        () =>
          enteredPaths.every(existsSync) || (claimCount() >= 2 && enteredPaths.some(existsSync)),
        children,
      );
      queuedClaimCount = claimCount();
      enteredWhileHeld = enteredPaths.filter(existsSync).length;
    } catch (error) {
      barrierFailed = true;
      barrierError = error;
    } finally {
      for (const [signalPath, contents] of [
        [goPath, "go"],
        [releasePath, "release"],
      ] as const) {
        try {
          writeFileSync(signalPath, contents);
        } catch (error) {
          if (!cleanupFailed) {
            cleanupFailed = true;
            cleanupError = error;
          }
        }
      }
      exitResults = await Promise.all(exits);
    }

    if (barrierFailed) throw barrierError;
    const exitFailure = exitResults.find((result) => result.status === "rejected");
    if (exitFailure?.status === "rejected") throw exitFailure.reason;
    if (cleanupFailed) throw cleanupError;

    expect(loadState(path).counter.last_line).toBe(2);
    expect(queuedClaimCount).toBeGreaterThanOrEqual(2);
    expect(enteredWhileHeld).toBe(1);
  }, 10000);

  it("does not mutate state when the shared lock times out", async () => {
    const path = join(tmpDir, "timeout.json");
    const initial = { s1: { last_line: 3, turn_count: 1, updated: "" } };
    await saveState(path, initial);
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
    let mutationCalls = 0;

    try {
      await expect(
        atomicUpdateState(path, (state) => {
          mutationCalls++;
          return { ...state, s1: { ...state.s1, last_line: 99 } };
        }),
      ).rejects.toBeInstanceOf(FileLockTimeoutError);
      expect(mutationCalls).toBe(0);
      expect(loadState(path)).toEqual(initial);
    } finally {
      release();
      await holder;
    }
  }, 10000);

  it("preserves a state write error when shared lock cleanup also fails", async () => {
    const path = join(tmpDir, "write-error.json");
    await saveState(path, { s1: { last_line: 3, turn_count: 1, updated: "" } });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
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
      expect(warning).toHaveBeenCalledOnce();
      expect(warning.mock.calls[0][1]).not.toBe(writeError);
    } finally {
      warning.mockRestore();
    }
  });

  it("warns but succeeds when lock cleanup fails after state is written", async () => {
    const path = join(tmpDir, "committed.json");
    await saveState(path, { counter: { last_line: 0, turn_count: 0, updated: "" } });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
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
      expect(warning).toHaveBeenCalledOnce();
    } finally {
      warning.mockRestore();
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

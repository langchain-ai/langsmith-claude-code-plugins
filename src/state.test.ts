import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  loadState,
  saveState,
  getSessionState,
  updateSessionState,
  atomicUpdateState,
  pruneOldSessions,
} from "./state.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `state-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("loadState", () => {
  it("returns empty object for non-existent file", () => {
    expect(loadState(join(tmpDir, "missing.json"))).toEqual({});
  });

  it("loads saved state", () => {
    const path = join(tmpDir, "state.json");
    const state = { "session-1": { last_line: 5, turn_count: 2, updated: "2025-01-01T00:00:00Z" } };
    saveState(path, state);
    expect(loadState(path)).toEqual(state);
  });

  it("returns empty object for malformed JSON", () => {
    const path = join(tmpDir, "bad.json");
    writeFileSync(path, "not json");
    expect(loadState(path)).toEqual({});
  });
});

describe("saveState", () => {
  it("creates parent directories if needed", () => {
    const path = join(tmpDir, "deep", "nested", "state.json");
    saveState(path, { s1: { last_line: 0, turn_count: 0, updated: "" } });
    const loaded = JSON.parse(readFileSync(path, "utf-8"));
    expect(loaded.s1.last_line).toBe(0);
  });

  it("overwrites existing state", () => {
    const path = join(tmpDir, "state.json");
    saveState(path, { s1: { last_line: 0, turn_count: 0, updated: "" } });
    saveState(path, { s1: { last_line: 10, turn_count: 3, updated: "later" } });
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
    saveState(path, { s1: { last_line: 0, turn_count: 0, updated: "" } });

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
    saveState(path, { counter: { last_line: 0, turn_count: 0, updated: "" } });

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
    saveState(path, { s1: { last_line: 0, turn_count: 0, updated: "" } });

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
});

describe("pruneOldSessions", () => {
  const now = Date.now();
  const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

  it("removes sessions older than 7 days", () => {
    const state = {
      old: { last_line: 5, turn_count: 1, updated: eightDaysAgo },
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
      old1: { last_line: 0, turn_count: 0, updated: eightDaysAgo },
      old2: { last_line: 0, turn_count: 0, updated: eightDaysAgo },
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

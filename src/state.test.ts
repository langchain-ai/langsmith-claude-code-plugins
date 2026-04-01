import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadState, saveState, getSessionState, updateSessionState } from "./state.js";

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

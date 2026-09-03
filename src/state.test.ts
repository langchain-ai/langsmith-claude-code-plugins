import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  readFileSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  loadState,
  saveState,
  getSessionState,
  updateSessionState,
  atomicUpdateState,
  recoverAndUpdateState,
  pruneOldSessions,
  getTracingMode,
  parseTraceCommand,
  traceCommandResponse,
} from "./state.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `state-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("trace policy", () => {
  it("defaults absent sessions to full and malformed state to metadata", () => {
    expect(getTracingMode({}, "new")).toBe("full");
    const path = join(tmpDir, "bad-policy.json");
    writeFileSync(path, "not json");
    expect(getTracingMode(loadState(path), "session")).toBe("metadata");
  });

  it("reports the master switch independently of the subordinate preference", () => {
    expect(JSON.parse(traceCommandResponse("full", false)).reason).toContain(
      "master switch is disabled",
    );
    expect(JSON.parse(traceCommandResponse("metadata", true)).reason).toContain("metadata only");
  });

  it("parses only exact lowercase trace commands", () => {
    expect(parseTraceCommand("/trace on")).toBe("on");
    expect(parseTraceCommand("/trace off")).toBe("off");
    expect(parseTraceCommand("/trace status")).toBe("status");
    expect(parseTraceCommand("/TRACE ON")).toBeUndefined();
    expect(parseTraceCommand(" /trace off")).toBeUndefined();
    expect(parseTraceCommand("/trace off now")).toBeUndefined();
  });
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

  it("durably marks malformed JSON fail-closed", () => {
    const path = join(tmpDir, "bad.json");
    writeFileSync(path, "not json");
    expect(loadState(path)).toEqual({ __langsmith_fail_closed: true });
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

  it.each(["", "legacy-lock"])("recovers an old malformed or legacy lock: %j", async (contents) => {
    const path = join(tmpDir, "stale.json");
    const lock = `${path}.lock`;
    writeFileSync(lock, contents);
    const old = new Date(Date.now() - 31_000);
    utimesSync(lock, old, old);

    await atomicUpdateState(path, (state) => ({
      ...state,
      s1: { last_line: 1, turn_count: 0, updated: "" },
    }));

    expect(loadState(path).s1.last_line).toBe(1);
    expect(existsSync(lock)).toBe(false);
  });

  it("does not steal a fresh empty lock before its owner writes", async () => {
    const path = join(tmpDir, "fresh.json");
    writeFileSync(`${path}.lock`, "");
    await expect(atomicUpdateState(path, (state) => state)).rejects.toThrow(
      "Timed out acquiring state lock",
    );
    expect(existsSync(`${path}.lock`)).toBe(true);
  }, 7_000);

  it("releases only the lock it owns", async () => {
    const path = join(tmpDir, "ownership.json");
    await atomicUpdateState(path, (state) => {
      writeFileSync(
        `${path}.lock`,
        JSON.stringify({ owner: "replacement", pid: process.pid, created: Date.now() }),
      );
      return state;
    });
    expect(existsSync(`${path}.lock`)).toBe(true);
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

  it("fail-closed overrides a stored full preference for ordinary reads", () => {
    expect(
      getTracingMode(
        {
          __langsmith_fail_closed: true,
          session: { last_line: 0, turn_count: 0, updated: "", tracing: "full" },
        } as never,
        "session",
      ),
    ).toBe("metadata");
  });

  it("explicit recovery quarantines corrupt state and clears fail-closed", async () => {
    const path = join(tmpDir, "corrupt.json");
    writeFileSync(path, "not json");

    const recovered = await recoverAndUpdateState(path, (state) => ({
      ...state,
      session: { last_line: -1, turn_count: 0, updated: "now", tracing: "full" },
    }));

    expect(getTracingMode(recovered, "session")).toBe("full");
    expect(loadState(path)).toEqual(recovered);
    expect(readdirSync(tmpDir).some((name) => name.startsWith("corrupt.json.corrupt."))).toBe(true);
  });

  it("explicit recovery persists metadata mode for trace off", async () => {
    const path = join(tmpDir, "corrupt-off.json");
    writeFileSync(path, "not json");
    const recovered = await recoverAndUpdateState(path, (state) => ({
      ...state,
      session: { last_line: -1, turn_count: 0, updated: "now", tracing: "metadata" },
    }));
    expect(getTracingMode(recovered, "session")).toBe("metadata");
  });

  it("ordinary updates preserve fail-closed state", async () => {
    const path = join(tmpDir, "corrupt.json");
    writeFileSync(path, "not json");
    await atomicUpdateState(path, (state) => ({ ...state }));
    expect(loadState(path)).toEqual({ __langsmith_fail_closed: true });
  });
});

describe("pruneOldSessions", () => {
  const now = Date.now();
  const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

  it("preserves muted policy beyond 24 hours", () => {
    const result = pruneOldSessions(
      { muted: { last_line: 5, turn_count: 1, updated: twoDaysAgo, tracing: "metadata" } },
      now,
    );
    expect(result.muted.tracing).toBe("metadata");
  });

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

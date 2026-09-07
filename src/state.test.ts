import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("node:fs", async (importOriginal) => {
  const fs = await importOriginal<typeof import("node:fs")>();
  return {
    ...fs,
    readFileSync: vi.fn(fs.readFileSync),
    copyFileSync: vi.fn(fs.copyFileSync),
    renameSync: vi.fn(fs.renameSync),
    writeFileSync: vi.fn(fs.writeFileSync),
    chmodSync: vi.fn(fs.chmodSync),
  };
});
import {
  existsSync,
  copyFileSync,
  renameSync,
  chmodSync,
  statSync,
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

import type { SessionState, TracingState } from "./types.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `state-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  vi.mocked(readFileSync).mockReset();
  vi.mocked(copyFileSync).mockReset();
  vi.mocked(renameSync).mockReset();
  vi.mocked(writeFileSync).mockReset();
  vi.mocked(chmodSync).mockReset();
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
    expect(parseTraceCommand("/ls-trace on")).toBe("on");
    expect(parseTraceCommand("/ls-trace off")).toBe("off");
    expect(parseTraceCommand("/ls-trace status")).toBe("status");
    expect(parseTraceCommand("/LS-TRACE ON")).toBeUndefined();
    for (const command of ["/trace on", "/trace off", "/trace status"]) {
      expect(parseTraceCommand(command)).toBeUndefined();
    }
    expect(parseTraceCommand(" /ls-trace off")).toBeUndefined();
    expect(parseTraceCommand("/ls-trace off now")).toBeUndefined();
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

  it.each([
    "null",
    "[]",
    "false",
    '"text"',
    '{"__langsmith_fail_closed": false}',
    '{"__langsmith_fail_closed": "true"}',
  ])("fails closed for malformed root or marker: %s", (contents) => {
    const path = join(tmpDir, "invalid.json");
    writeFileSync(path, contents);
    expect(getTracingMode(loadState(path), "unknown")).toBe("metadata");
  });

  it("marks malformed JSON fail-closed", () => {
    const path = join(tmpDir, "bad.json");
    writeFileSync(path, "not json");
    expect(loadState(path)).toEqual({ __langsmith_fail_closed: true });
  });
});

describe("recovery isolation and failures", () => {
  const session = (tracing: "full" | "metadata") => ({
    last_line: 12,
    turn_count: 3,
    updated: "2020-01-01",
    tracing,
  });
  const command = (path: string, id: string, tracing: "full" | "metadata") =>
    recoverAndUpdateState(path, id, (state) => ({
      ...state,
      [id]: { ...getSessionState(state, id), tracing },
    }));

  it.each(["EACCES", "EPERM", "EIO", "ENOTDIR"])(
    "fails closed on %s rather than treating it as absence",
    async (code) => {
      const path = join(tmpDir, "inaccessible.json");
      saveState(path, { muted: session("metadata") });
      const original = readFileSync(path, "utf-8");
      const realRead = vi.mocked(readFileSync).getMockImplementation()!;
      vi.mocked(readFileSync).mockImplementation((...args: Parameters<typeof readFileSync>) => {
        if (args[0] === path) throw Object.assign(new Error(code), { code });
        return realRead(...args);
      });
      expect(getTracingMode(loadState(path), "unknown")).toBe("metadata");
      const callback = vi.fn((state) => state);
      await expect(recoverAndUpdateState(path, "new", callback)).rejects.toThrow(code);
      await expect(atomicUpdateState(path, callback)).rejects.toThrow(code);
      expect(callback).not.toHaveBeenCalled();
      expect(existsSync(`${path}.lock`)).toBe(false);
      vi.mocked(readFileSync).mockReset();
      expect(readFileSync(path, "utf-8")).toBe(original);
    },
  );

  it("salvages valid muted records, invalidates old consent, and scopes explicit consent", async () => {
    const path = join(tmpDir, "partial.json");
    writeFileSync(
      path,
      JSON.stringify({
        muted: { ...session("metadata"), current_turn_tracing: "metadata" },
        stale: session("full"),
        previous: { ...session("full"), __langsmith_explicit_consent: true },
        broken: { tracing: "invalid" },
      }),
    );
    const before = loadState(path);
    expect(before.muted.current_turn_tracing).toBe("metadata");
    expect(getTracingMode(before, "previous")).toBe("metadata");
    await command(path, "active", "full");
    let state = loadState(path);
    expect(state.muted).toEqual(before.muted);
    expect(state.stale).toEqual(before.stale);
    for (const id of ["muted", "stale", "previous", "broken", "unknown"]) {
      expect(getTracingMode(state, id)).toBe("metadata");
    }
    expect(getTracingMode(state, "active")).toBe("full");
    await command(path, "stale", "full");
    await command(path, "active", "metadata");
    state = loadState(path);
    expect(getTracingMode(state, "stale")).toBe("full");
    expect(getTracingMode(state, "active")).toBe("metadata");
    expect(state.active).not.toHaveProperty("__langsmith_explicit_consent");
    expect(getTracingMode(state, "unknown")).toBe("metadata");
    // A valid metadata-default file does not need repeated quarantines.
    expect(readdirSync(tmpDir).filter((name) => name.includes(".corrupt."))).toHaveLength(1);
  });

  it("invalidates renewed consent on a subsequent corruption without losing muted records", async () => {
    const path = join(tmpDir, "recorrupt.json");
    writeFileSync(path, "not json");
    await command(path, "previous", "full");
    await command(path, "muted", "metadata");
    const stored = JSON.parse(readFileSync(path, "utf-8"));
    writeFileSync(path, JSON.stringify({ ...stored, broken: { tracing: "bad" } }));
    expect(getTracingMode(loadState(path), "previous")).toBe("metadata");
    await command(path, "next", "full");
    const state = loadState(path);
    expect(getTracingMode(state, "previous")).toBe("metadata");
    expect(getTracingMode(state, "next")).toBe("full");
    expect(state.muted).toEqual(stored.muted);
  });

  it("does not change the fresh-install default for healthy state", async () => {
    const path = join(tmpDir, "healthy.json");
    await command(path, "muted", "metadata");
    await command(path, "chosen", "full");
    expect(getTracingMode(loadState(path), "muted")).toBe("metadata");
    expect(getTracingMode(loadState(path), "chosen")).toBe("full");
    expect(getTracingMode(loadState(path), "unknown")).toBe("full");
    expect(readdirSync(tmpDir).some((name) => name.includes(".corrupt."))).toBe(false);
  });

  it("preserves all other records even with a mutating, replacement callback", async () => {
    const path = join(tmpDir, "callback.json");
    writeFileSync(
      path,
      JSON.stringify({
        __langsmith_fail_closed: true,
        muted: session("metadata"),
        stale: session("full"),
      }),
    );
    const before = loadState(path);
    const recovered = await recoverAndUpdateState(path, "chosen", (state) => {
      expect(state.muted).toEqual(before.muted);
      state.muted.tracing = "full";
      delete state.stale;
      delete state.__langsmith_fail_closed;
      return { chosen: session("full") };
    });
    expect(recovered.muted).toEqual(before.muted);
    expect(recovered.stale).toEqual(before.stale);
    expect(getTracingMode(recovered, "stale")).toBe("metadata");
    expect(getTracingMode(recovered, "chosen")).toBe("full");
    expect(getTracingMode(recovered, "unknown")).toBe("metadata");
  });

  it("keeps readers fail closed during quarantine, callback, and atomic replacement", async () => {
    const path = join(tmpDir, "reader.json");
    writeFileSync(path, "not json");
    const realRename = vi.mocked(renameSync).getMockImplementation()!;
    vi.mocked(renameSync).mockImplementation((source, dest) => {
      expect(dest).toBe(path);
      expect(readFileSync(path, "utf-8")).toBe("not json");
      expect(getTracingMode(loadState(path), "unknown")).toBe("metadata");
      realRename(source, dest);
    });
    await recoverAndUpdateState(path, "chosen", () => {
      expect(readFileSync(path, "utf-8")).toBe("not json");
      expect(getTracingMode(loadState(path), "chosen")).toBe("metadata");
      const backup = readdirSync(tmpDir).find((name) => name.includes(".corrupt."))!;
      expect(readFileSync(join(tmpDir, backup), "utf-8")).toBe("not json");
      expect(statSync(join(tmpDir, backup)).mode & 0o777).toBe(0o600);
      return { chosen: session("full") };
    });
    expect(getTracingMode(loadState(path), "chosen")).toBe("full");
    expect(getTracingMode(loadState(path), "unknown")).toBe("metadata");
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });

  it.each(["copy", "callback", "write", "chmod", "rename", "invalid callback"])(
    "retains authoritative corruption and releases lock on %s failure",
    async (stage) => {
      const path = join(tmpDir, "failure.json");
      writeFileSync(path, "not json");
      const fail = () => {
        throw new Error("injected failure");
      };
      if (stage === "copy") vi.mocked(copyFileSync).mockImplementationOnce(fail);
      if (stage === "rename") vi.mocked(renameSync).mockImplementationOnce(fail);
      if (stage === "write") {
        const realWrite = vi.mocked(writeFileSync).getMockImplementation()!;
        vi.mocked(writeFileSync).mockImplementation((...args: Parameters<typeof writeFileSync>) => {
          if (typeof args[0] === "string" && args[0].endsWith(".tmp")) fail();
          return realWrite(...args);
        });
      }
      if (stage === "chmod") {
        const realChmod = vi.mocked(chmodSync).getMockImplementation()!;
        vi.mocked(chmodSync).mockImplementation((file, mode) => {
          if (String(file).endsWith(".tmp")) fail();
          realChmod(file, mode);
        });
      }
      await expect(
        recoverAndUpdateState(path, "chosen", () => {
          if (stage === "callback") fail();
          return stage === "invalid callback" ? {} : { chosen: session("full") };
        }),
      ).rejects.toThrow();
      expect(readFileSync(path, "utf-8")).toBe("not json");
      expect(getTracingMode(loadState(path), "unknown")).toBe("metadata");
      expect(existsSync(`${path}.lock`)).toBe(false);
      expect(readdirSync(tmpDir).some((name) => name.endsWith(".tmp"))).toBe(false);
    },
  );

  it("serializes commands for different threads without granting unknown threads consent", async () => {
    const path = join(tmpDir, "concurrent-recovery.json");
    writeFileSync(path, "not json");
    await Promise.all([
      command(path, "a", "full"),
      command(path, "b", "metadata"),
      command(path, "c", "full"),
    ]);
    const state = loadState(path);
    expect(getTracingMode(state, "a")).toBe("full");
    expect(getTracingMode(state, "c")).toBe("full");
    expect(getTracingMode(state, "b")).toBe("metadata");
    expect(getTracingMode(state, "unknown")).toBe("metadata");
  });

  it("preserves metadata default through ordinary replacement updates and pruning", async () => {
    const path = join(tmpDir, "ordinary.json");
    writeFileSync(path, "not json");
    await command(path, "chosen", "full");
    await atomicUpdateState(path, (state) => updateSessionState(state, "chosen", 20, 4));
    expect(getTracingMode(loadState(path), "chosen")).toBe("full");
    await atomicUpdateState(path, () => ({
      stale: { ...session("full"), __langsmith_explicit_consent: true },
    }));
    expect(getTracingMode(loadState(path), "stale")).toBe("metadata");
    const pruned = pruneOldSessions(loadState(path));
    saveState(path, pruned);
    expect(getTracingMode(loadState(path), "unknown")).toBe("metadata");
  });

  it("trace off after corruption leaves unknown threads muted, including after pruning", async () => {
    const path = join(tmpDir, "off.json");
    writeFileSync(path, "not json");
    await command(path, "muted", "metadata");
    await command(path, "other", "full");
    saveState(path, pruneOldSessions(loadState(path)));
    expect(loadState(path).muted.tracing).toBe("metadata");
    expect(getTracingMode(loadState(path), "unknown")).toBe("metadata");
  });
});

describe("fail-closed completion snapshots", () => {
  const snapshots = (mode: "full" | "metadata" = "full"): SessionState => ({
    last_line: 12,
    turn_count: 3,
    updated: "2025-01-01",
    tracing: "full",
    current_turn_run_id: "turn",
    current_turn_tracing: mode,
    compaction_start_time: 123,
    compaction_tracing: mode,
    open_turns: {
      turn: { run_id: "turn", tracing: mode, stop_seen: true, agent_ids: ["agent"] },
    },
    task_run_map: {
      agent: {
        run_id: "task",
        dotted_order: "order",
        tracing: mode,
        launching_turn_run_id: "turn",
      },
    },
    tool_launch_contexts: {
      tool: { start_time: 123, tracing: mode, turn: { run_id: "turn" } },
    },
  });
  const marked = (sessions: TracingState): TracingState =>
    ({ ...sessions, __langsmith_fail_closed: true }) as unknown as TracingState;

  it.each(["fresh corruption", "persisted sentinel"])(
    "downgrades all salvaged completion contexts on %s without a policy lookup",
    async (source) => {
      const path = join(tmpDir, "snapshots.json");
      const stale = snapshots();
      const sessions = { stale, muted: { ...snapshots("metadata"), tracing: "metadata" as const } };
      writeFileSync(
        path,
        JSON.stringify(
          source === "fresh corruption"
            ? {
                ...sessions,
                stale: { ...stale, __langsmith_explicit_consent: true },
                broken: { tracing: "invalid" },
              }
            : marked(sessions),
        ),
      );
      const assertSnapshots = (state: TracingState) => {
        // Stop, subagent, PostToolUse and compaction consume these snapshots,
        // sometimes without calling getTracingMode at all.
        expect(state.stale).toEqual(snapshots("metadata"));
        expect(getSessionState(state, "stale")).toEqual(snapshots("metadata"));
        expect(state.muted).toEqual(sessions.muted);
      };
      assertSnapshots(loadState(path));
      // Loading is read-only; an ordinary update persists the safe snapshots.
      expect(JSON.parse(readFileSync(path, "utf-8")).stale.current_turn_tracing).toBe("full");
      await atomicUpdateState(path, (state) => {
        assertSnapshots(state);
        return state;
      });
      assertSnapshots(loadState(path));
      expect(JSON.parse(readFileSync(path, "utf-8")).stale).toEqual(snapshots("metadata"));
    },
  );

  it("protects directly supplied sentinel state without mutating the source", () => {
    const stale = snapshots();
    const state = marked({ stale });
    expect(getSessionState(state, "stale")).toEqual(snapshots("metadata"));
    expect(stale).toEqual(snapshots());
    expect(getSessionState(marked({}), "unknown")).toEqual({
      last_line: -1,
      turn_count: 0,
      updated: "",
      task_run_map: {},
    });
  });

  it("does not invent missing snapshots or change metadata snapshots", () => {
    const session: SessionState = {
      last_line: 0,
      turn_count: 0,
      updated: "",
      open_turns: { turn: { run_id: "turn", stop_seen: false, agent_ids: [] } },
      task_run_map: { agent: { run_id: "task", dotted_order: "order" } },
    };
    expect(getSessionState(marked({ session }), "session")).toEqual(session);
    expect(getSessionState(marked({ session: snapshots("metadata") }), "session")).toEqual(
      snapshots("metadata"),
    );
  });

  it("keeps old snapshots muted on renewal but permits newly full snapshots for that session only", async () => {
    const path = join(tmpDir, "renewed.json");
    saveState(path, marked({ chosen: snapshots(), stale: snapshots() }));
    const recovered = await recoverAndUpdateState(path, "chosen", (state) => {
      expect(state.chosen).toEqual(snapshots("metadata"));
      return { ...state, chosen: { ...getSessionState(state, "chosen"), tracing: "full" } };
    });
    expect(recovered.chosen.current_turn_tracing).toBe("metadata");
    await atomicUpdateState(path, (state) => ({
      ...state,
      chosen: { ...state.chosen, ...snapshots() },
      stale: snapshots(),
    }));
    const loaded = loadState(path);
    expect(getSessionState(loaded, "chosen")).toEqual({
      ...snapshots(),
      __langsmith_explicit_consent: true,
    });
    expect(loaded.chosen).toEqual(getSessionState(loaded, "chosen"));
    expect(loaded.stale).toEqual(snapshots("metadata"));
    // Subsequent corruption revokes even renewed consent and its snapshots.
    writeFileSync(path, JSON.stringify({ ...loaded, broken: null }));
    expect(loadState(path).chosen).toEqual(snapshots("metadata"));
  });

  it("retains launch-time full snapshots after normal /ls-trace off", async () => {
    const path = join(tmpDir, "normal-off.json");
    saveState(path, { session: snapshots() });
    await recoverAndUpdateState(path, "session", (state) => ({
      ...state,
      session: { ...getSessionState(state, "session"), tracing: "metadata" },
    }));
    const state = loadState(path);
    expect(getTracingMode(state, "session")).toBe("metadata");
    expect(getSessionState(state, "session")).toEqual({ ...snapshots(), tracing: "metadata" });
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

  it("explicit recovery quarantines corruption but retains the global metadata default", async () => {
    const path = join(tmpDir, "corrupt.json");
    writeFileSync(path, "not json");

    const recovered = await recoverAndUpdateState(path, "session", (state) => ({
      ...state,
      session: { last_line: -1, turn_count: 0, updated: "now", tracing: "full" },
    }));

    expect(getTracingMode(recovered, "session")).toBe("full");
    expect(loadState(path)).toEqual(recovered);
    expect(getTracingMode(loadState(path), "unknown")).toBe("metadata");
    expect(recovered).toHaveProperty("__langsmith_fail_closed", true);
    expect(readdirSync(tmpDir).some((name) => name.startsWith("corrupt.json.corrupt."))).toBe(true);
  });

  it("explicit recovery persists metadata mode for trace off", async () => {
    const path = join(tmpDir, "corrupt-off.json");
    writeFileSync(path, "not json");
    const recovered = await recoverAndUpdateState(path, "session", (state) => ({
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

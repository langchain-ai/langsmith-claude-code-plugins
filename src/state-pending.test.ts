import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { atomicUpdateState, loadState } from "./state.js";
import { applyPatches, diffState, readPending, writePending } from "./state-pending.js";
import type { StatePatch, TracingState } from "./types.js";

const hooks = vi.hoisted(() => ({
  afterStateRead: undefined as undefined | (() => void),
  publishFails: false,
  reverseListing: false,
}));

vi.mock("node:fs", async (importOriginal) => {
  const real = await importOriginal<typeof import("node:fs")>();
  return {
    ...real,
    readdirSync: ((...args: Parameters<typeof real.readdirSync>) => {
      const names = real.readdirSync(...args) as unknown as string[];
      return hooks.reverseListing ? names.reverse() : names;
    }) as unknown as typeof real.readdirSync,
    readFileSync: ((...args: Parameters<typeof real.readFileSync>) => {
      const result = real.readFileSync(...args);
      const after = hooks.afterStateRead;
      if (after && String(args[0]).endsWith("state.json")) {
        hooks.afterStateRead = undefined;
        after();
      }
      return result;
    }) as typeof real.readFileSync,
  };
});

vi.mock("./utils/atomic-file.js", async (importOriginal) => {
  const real = await importOriginal<typeof import("./utils/atomic-file.js")>();
  return {
    publishByRename: (...args: Parameters<typeof real.publishByRename>) => {
      if (hooks.publishFails) {
        hooks.publishFails = false;
        rmSync(args[0].slice(0, args[0].lastIndexOf("/")), { recursive: true, force: true });
        throw Object.assign(new Error("gone"), { code: "ENOENT" });
      }
      return real.publishByRename(...args);
    },
  };
});

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "state-pending-"));
});
afterEach(() => {
  vi.useRealTimers();
  hooks.reverseListing = false;
  rmSync(dir, { recursive: true, force: true });
});

describe("pending state patches", () => {
  const session = (line: number) => ({ last_line: line, turn_count: 0, updated: "" });

  it.each([
    ["a changed field", { a: session(1) }, { a: session(2) }],
    ["an unset field", { a: { ...session(1), current_turn_run_id: "t" } }, { a: session(1) }],
    ["a removed session", { a: session(1), b: session(2) }, { a: session(1) }],
    ["a new session", { a: session(1) }, { a: session(1), b: session(5) }],
    [
      "a nested change",
      { a: { ...session(1), task_run_map: {} } },
      { a: { ...session(1), task_run_map: { x: { run_id: "r", dotted_order: "d" } } } },
    ],
  ] as [string, TracingState, TracingState][])("rebuilds %s exactly", (_name, before, after) => {
    expect(applyPatches(before, [diffState(before, after)])).toEqual(after);
  });

  it("keeps both values when two writers add to the same list and map from the same state", () => {
    const base: TracingState = {
      a: { ...session(1), traced_tool_use_ids: ["x"], task_run_map: {} },
    };
    const writer = (id: string): TracingState => ({
      a: {
        ...base.a,
        traced_tool_use_ids: [...(base.a.traced_tool_use_ids ?? []), id],
        task_run_map: { [id]: { run_id: id, dotted_order: id } },
      },
    });
    const merged = applyPatches(base, [diffState(base, writer("b")), diffState(base, writer("c"))]);
    expect(merged.a.traced_tool_use_ids).toEqual(["x", "b", "c"]);
    expect(Object.keys(merged.a.task_run_map ?? {}).sort()).toEqual(["b", "c"]);
  });

  it("removes only what a writer removed from a list", () => {
    const base: TracingState = { a: { ...session(1), traced_tool_use_ids: ["x", "y", "z"] } };
    const dropY: TracingState = { a: { ...base.a, traced_tool_use_ids: ["x", "z"] } };
    const addW: TracingState = { a: { ...base.a, traced_tool_use_ids: ["x", "y", "z", "w"] } };
    expect(
      applyPatches(base, [diffState(base, dropY), diffState(base, addW)]).a.traced_tool_use_ids,
    ).toEqual(["x", "z", "w"]);
  });

  it("merges two pending files written from the same state into the state file without losing a value", async () => {
    const path = join(dir, "concurrent-pending.json");
    const base: TracingState = { a: { ...session(1), traced_tool_use_ids: ["x"] } };
    writeFileSync(path, JSON.stringify(base));
    for (const id of ["b", "c"]) {
      const next = { a: { ...base.a, traced_tool_use_ids: ["x", id] } };
      writePending(path, diffState(base, next));
    }

    await atomicUpdateState(path, (state) => state);

    expect(JSON.parse(readFileSync(path, "utf-8")).a.traced_tool_use_ids).toEqual(["x", "b", "c"]);
    expect(existsSync(`${path}.pending`)).toBe(false);
  });

  it("keeps a session named __proto__ as an ordinary key", () => {
    const after = JSON.parse('{"__proto__": {"last_line": 1, "turn_count": 0, "updated": ""}}');
    const rebuilt = applyPatches({}, [diffState({}, after)]);
    expect(Object.keys(rebuilt)).toEqual(["__proto__"]);
  });
});

describe("pending patch files", () => {
  const session = (line: number) => ({ last_line: line, turn_count: 0, updated: "" });
  const lineOf = (state: TracingState) => state.a.last_line;
  const setLine = (line: number): StatePatch => [
    { session: "a", operations: [{ path: ["last_line"], set: line }] },
  ];

  it("writes the patch even when the folder is removed between creating it and writing", () => {
    const path = join(dir, "state.json");
    writeFileSync(path, JSON.stringify({ a: session(1) }));
    hooks.publishFails = true;

    writePending(path, setLine(2));

    expect(lineOf(loadState(path))).toBe(2);
  });

  it("still sees a patch that a merge consumes between reading the file and the folder", () => {
    const path = join(dir, "state.json");
    writeFileSync(path, JSON.stringify({ a: session(1) }));
    writePending(path, setLine(2));
    hooks.afterStateRead = () => {
      writeFileSync(path, JSON.stringify({ a: session(2) }));
      rmSync(`${path}.pending`, { recursive: true });
    };

    expect(lineOf(loadState(path))).toBe(2);
  });

  it("gives patches written in the same millisecond different names", () => {
    const path = join(dir, "state.json");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1_800_000_000_000);

    writePending(path, setLine(1));
    writePending(path, setLine(2));

    expect(readdirSync(`${path}.pending`)).toHaveLength(2);
    expect(lineOf(applyPatches({ a: session(0) }, readPending(path).patches))).toBe(2);
  });

  it("applies patches in file name order whatever order the folder lists them", () => {
    const path = join(dir, "state.json");
    mkdirSync(`${path}.pending`);
    writeFileSync(
      join(`${path}.pending`, "0000000000002-000000-1.json"),
      JSON.stringify(setLine(2)),
    );
    writeFileSync(
      join(`${path}.pending`, "0000000000001-000000-1.json"),
      JSON.stringify(setLine(1)),
    );

    hooks.reverseListing = true;

    expect(lineOf(applyPatches({ a: session(0) }, readPending(path).patches))).toBe(2);
  });

  it("adds a list item once however many times the patch is applied", () => {
    const patch: StatePatch = [
      { session: "a", operations: [{ path: ["traced_tool_use_ids"], add: ["x"], remove: [] }] },
    ];

    const once = applyPatches({ a: session(1) }, [patch]);

    expect(applyPatches(once, [patch, patch]).a.traced_tool_use_ids).toEqual(["x"]);
  });
});

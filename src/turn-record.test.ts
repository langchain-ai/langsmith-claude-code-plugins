import { describe, expect, it } from "vitest";
import { mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { TURN_RECORD_LINE } from "./constants.js";
import { readTurnRecord, turnRecordPath } from "./turn-record.js";
import { safeName } from "./utils/session-store.js";

describe("where a turn's record is kept", () => {
  // Catches a session or turn named only with dots pointing the folder at its parent, which
  // would let a trace write outside the plugin's own area. No other test names one that way.
  it("never lets a name of nothing but dots climb out of its folder", () => {
    for (const name of ["..", ".", "..."]) expect(safeName(name)).not.toBe(name);
    expect(turnRecordPath("/state/state.json", "..", "..")).toContain(
      join("/state", "langsmith_turns", "_"),
    );
  });
});

describe("origin-scoped delivery acknowledgments", () => {
  it("ignores A's acknowledgments after B becomes the record origin", () => {
    const dir = mkdtempSync(join(tmpdir(), "turn-record-"));
    const path = join(dir, "turn.jsonl");
    const run = {
      run_id: "run-a",
      trace_id: "trace-a",
      dotted_order: "order-a",
      name: "tool",
      run_type: "tool",
      tracing: "full",
      metadata: {},
    };
    writeFileSync(
      path,
      [
        { k: "run", root: true, origin: "origin-a", run },
        { k: "run", root: true, origin: "origin-b", run: { ...run, metadata: { fromB: true } } },
        {
          k: "run",
          root: true,
          origin: "origin-a",
          ackOrigin: "origin-a",
          run: { ...run, metadata: { git_branch: "from-a" } },
        },
        {
          k: TURN_RECORD_LINE.delivered,
          id: "child-a",
          origin: "origin-a",
          ackOrigin: "origin-a",
        },
      ]
        .map((line) => JSON.stringify(line))
        .join("\n"),
    );

    try {
      const record = readTurnRecord(path)!;
      expect(record.origin).toBe("origin-b");
      expect(record.root?.metadata).toEqual({ fromB: true });
      expect(record.delivered.has("child-a")).toBe(false);
    } finally {
      unlinkSync(path);
      rmdirSync(dir);
    }
  });
});

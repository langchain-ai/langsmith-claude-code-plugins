import { describe, expect, it } from "vitest";
import { join } from "node:path";

import { turnRecordPath } from "./turn-record.js";
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

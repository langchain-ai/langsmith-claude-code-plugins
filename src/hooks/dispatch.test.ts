import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { HOOK_EVENT_NAMES } from "../constants.js";

const bundle = fileURLToPath(new URL("../../bundle/dispatch.js", import.meta.url));

let home: string;
beforeEach(() => (home = mkdtempSync(join(tmpdir(), "ls-dispatch-"))));
afterEach(() => rmSync(home, { recursive: true, force: true }));

// Claude Code runs the bundle, not the source, so drive the built artifact.
function dispatch(...args: string[]) {
  return spawnSync(process.execPath, [bundle, ...args], {
    cwd: home,
    env: {
      HOME: home,
      PATH: "",
      TRACE_TO_LANGSMITH: "false",
      STATE_FILE: join(home, "state.json"),
    },
    input: JSON.stringify({
      session_id: "dispatch-test",
      transcript_path: join(home, "missing.jsonl"),
      cwd: home,
      prompt: "ordinary prompt",
    }),
    encoding: "utf8",
    timeout: 10000,
  });
}

describe("bundle/dispatch.js", () => {
  it.each(HOOK_EVENT_NAMES)("runs %s and writes no state while tracing is off", (event) => {
    const result = dispatch(event);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe("");
    expect(existsSync(join(home, "state.json"))).toBe(false);
  });

  it.each([[], ["NotAnEvent"], ["SessionStart"], ["userpromptsubmit"]])(
    "exits 0 without running a hook for argv %j",
    (...args) => {
      const result = dispatch(...args.flat());
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("");
      expect(existsSync(join(home, "state.json"))).toBe(false);
    },
  );
});

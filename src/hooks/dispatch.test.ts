import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { HOOK_EVENT_NAMES } from "../constants.js";
import { EXECUTABLE_NAME } from "../sea-constants.js";

const root = new URL("../../", import.meta.url);
const bundle = fileURLToPath(new URL("bundle/dispatch.js", root));
const { version } = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));

let home: string;
beforeEach(() => (home = mkdtempSync(join(tmpdir(), "ls-dispatch-"))));
afterEach(() => rmSync(home, { recursive: true, force: true }));

// Claude Code runs the bundle, not the source, so drive the built artifact.
function dispatch(args: string[], prompt = "ordinary prompt") {
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
      prompt,
    }),
    encoding: "utf8",
    timeout: 10000,
  });
}

// A handler's initHook creates this directory, so it is proof the handler ran.
const logDir = () => join(home, ".claude", "state");

describe("bundle/dispatch.js", () => {
  it("prints the package version for --version", () => {
    const result = dispatch(["--version"]);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe(version);
    expect(existsSync(logDir())).toBe(false);
  });

  it.each(HOOK_EVENT_NAMES)(
    "runs the %s handler and writes no state while tracing is off",
    (event) => {
      const result = dispatch([event]);
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("");
      expect(existsSync(logDir()), result.stderr).toBe(true);
      expect(existsSync(join(home, "state.json"))).toBe(false);
    },
  );

  // Only UserPromptSubmit answers the trace command, so its reply pins the routing.
  it.each(HOOK_EVENT_NAMES)("routes %s to that event's own handler", (event) => {
    const result = dispatch([event], "/langsmith-tracing:trace");
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    const decision = result.stdout === "" ? undefined : JSON.parse(result.stdout).decision;
    expect(decision).toBe(event === "UserPromptSubmit" ? "block" : undefined);
  });

  it.each([[], ["NotAnEvent"], ["SessionStart"], ["userpromptsubmit"]])(
    "logs a diagnostic and runs no handler for argv %j",
    (...args) => {
      const result = dispatch(args);
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("");
      expect(readFileSync(join(logDir(), "hook.log"), "utf8")).toContain("Unknown hook event");
      expect(existsSync(join(home, "state.json"))).toBe(false);
    },
  );

  it.each(["--help", "-h"])("prints the usage for %s and runs no handler", (flag) => {
    const result = dispatch([flag]);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage:");
    expect(result.stdout).toContain(`${EXECUTABLE_NAME} --install`);
    expect(result.stdout).toContain("--help, -h");
    expect(result.stdout).toContain("--version, -v");
    expect(existsSync(logDir())).toBe(false);
  });

  it("names every hook event and flag it accepts in the usage", () => {
    const usage = dispatch(["--help"]).stdout;
    expect(usage).toContain("<HookEventName>");
    for (const flag of ["--install", "--print", "--project", "--tag", "--update", "--version"]) {
      expect(usage, flag).toContain(flag);
    }
  });

  it("prints the same version for -v as for --version", () => {
    expect(dispatch(["-v"]).stdout.trim()).toBe(version);
  });

  it.each(["--instal", "-x", "--print"])(
    "rejects the unknown option %s with the usage and runs no handler",
    (flag) => {
      const result = dispatch([flag]);
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain(`unknown option: ${flag}`);
      expect(result.stderr).toContain("Usage:");
      expect(existsSync(logDir())).toBe(false);
    },
  );
});

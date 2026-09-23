import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { binary as tracing } from "../binary-target.js";
import { HOOK_EVENT_NAMES } from "../constants.js";

const EXECUTABLE_NAME = tracing.target.executableName;
const root = new URL("../../", import.meta.url);
const { version } = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const binary = fileURLToPath(new URL(`bin/${EXECUTABLE_NAME}`, root));
const built = existsSync(binary);

// A skip still exits 0, so a missing binary has to fail the runner that just built it.
if (!built && process.env.CI && process.platform === "darwin") {
  throw new Error(`Expected 'pnpm build:binary' to have produced ${binary}`);
}

let home: string;
beforeEach(() => (home = mkdtempSync(join(tmpdir(), "ls-dispatch-binary-"))));
afterEach(() => rmSync(home, { recursive: true, force: true }));

function dispatch(args: string[], prompt = "ordinary prompt") {
  return spawnSync(binary, args, {
    cwd: home,
    env: {
      HOME: home,
      PATH: "",
      TRACE_TO_LANGSMITH: "false",
      STATE_FILE: join(home, "state.json"),
    },
    input: JSON.stringify({
      session_id: "dispatch-binary-test",
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

function registerInstalledBinary(event: string) {
  mkdirSync(join(home, ".langsmith"), { recursive: true });
  writeFileSync(join(home, ".langsmith", EXECUTABLE_NAME), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  mkdirSync(join(home, ".claude"), { recursive: true });
  writeFileSync(
    join(home, ".claude", "settings.json"),
    JSON.stringify({
      hooks: {
        [event]: [
          {
            hooks: [
              { type: "command", command: `"\${HOME}/.langsmith/${EXECUTABLE_NAME}" ${event}` },
            ],
          },
        ],
      },
    }),
  );
}

describe.skipIf(!built)("the standalone binary, bin/langsmith-claude-code-tracing", () => {
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

  it.each(["--help", "-h"])("prints the usage for %s and runs no handler", (flag) => {
    const result = dispatch([flag]);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("Usage:");
    expect(result.stdout).toContain("--help, -h");
    expect(existsSync(logDir())).toBe(false);
  });

  it("rejects an unknown option with the usage and runs no handler", () => {
    const result = dispatch(["--instal"]);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("unknown option: --instal");
    expect(existsSync(logDir())).toBe(false);
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

  it.each(HOOK_EVENT_NAMES)(
    "runs the %s handler even though it is the registered binary",
    (event) => {
      registerInstalledBinary(event);
      const result = dispatch([event]);
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(existsSync(logDir()), result.stderr).toBe(true);
    },
  );

  it("runs the handler from a copy of itself saved under another name", () => {
    registerInstalledBinary("UserPromptSubmit");
    const renamed = join(home, "lstrace");
    copyFileSync(binary, renamed);
    const result = spawnSync(renamed, ["UserPromptSubmit"], {
      cwd: home,
      env: { HOME: home, PATH: "", TRACE_TO_LANGSMITH: "false", STATE_FILE: join(home, "s.json") },
      input: JSON.stringify({ session_id: "renamed", cwd: home, prompt: "ordinary prompt" }),
      encoding: "utf8",
      timeout: 10000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(logDir()), result.stderr).toBe(true);
  });
});

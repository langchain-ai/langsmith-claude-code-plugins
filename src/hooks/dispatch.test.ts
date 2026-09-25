import { spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
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

import { binary } from "../binary-target.js";
import { HAND_INSTALLED_BINARY_WARNING, HOOK_EVENT_NAMES } from "../constants.js";

const EXECUTABLE_NAME = binary.target.executableName;

const staleBinaryWarning = () =>
  JSON.stringify({
    systemMessage: HAND_INSTALLED_BINARY_WARNING.replace("%s", binary.installedBinaryPath(home)),
  }) + "\n";

const root = new URL("../../", import.meta.url);
const bundle = fileURLToPath(new URL("bundle/dispatch.js", root));
const tsx = fileURLToPath(new URL("node_modules/.bin/tsx", root));
const stdinSource = fileURLToPath(new URL("src/utils/stdin.ts", root));
const { version } = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));

let home: string;
beforeEach(() => (home = mkdtempSync(join(tmpdir(), "ls-dispatch-"))));
afterEach(() => rmSync(home, { recursive: true, force: true }));

// Claude Code runs the bundle, not the source, so drive the built artifact.
function dispatch(args: string[], prompt = "ordinary prompt", cwd = home, filler = "") {
  return spawnSync(process.execPath, [bundle, ...args], {
    cwd,
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
      tool_response: filler,
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

  it("leaves stderr silent when git runs outside a repository", () => {
    const result = spawnSync(process.execPath, [bundle, "UserPromptSubmit"], {
      cwd: home,
      env: {
        HOME: home,
        PATH: process.env.PATH ?? "",
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
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe("");
  });

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

function installBinary() {
  mkdirSync(join(home, ".langsmith"), { recursive: true });
  writeFileSync(join(home, ".langsmith", EXECUTABLE_NAME), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
}

function writeSettings(directory: string, contents: string) {
  mkdirSync(join(directory, ".claude"), { recursive: true });
  const path = join(directory, ".claude", "settings.json");
  writeFileSync(path, contents);
  return path;
}

const command = (event: string) => `"\${HOME}/.langsmith/${EXECUTABLE_NAME}" ${event}`;
const registration = (event: string) =>
  JSON.stringify({
    hooks: { [event]: [{ hooks: [{ type: "command", command: command(event) }] }] },
  });
const pluginRegistration = JSON.stringify({
  hooks: {
    UserPromptSubmit: [
      {
        hooks: [
          { type: "command", command: 'node "${CLAUDE_PLUGIN_ROOT}/bundle/dispatch.js" Stop' },
        ],
      },
    ],
  },
});

describe("standing down for the installed binary", () => {
  it.each(HOOK_EVENT_NAMES)("runs no %s handler once the binary owns that event", (event) => {
    installBinary();
    writeSettings(home, registration(event));
    const result = dispatch([event]);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe(event === "Stop" ? staleBinaryWarning() : "");
    expect(result.stderr).toBe("");
    expect(existsSync(logDir())).toBe(false);
  });

  it.each([200, 200_000])("stands down without EPIPE on a %d byte payload", (size) => {
    installBinary();
    writeSettings(home, registration("PostToolUse"));
    const result = dispatch(["PostToolUse"], "ordinary prompt", home, "x".repeat(size));
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe("");
    expect(existsSync(logDir())).toBe(false);
  });

  it.each([
    `"\${HOME}/bin/${EXECUTABLE_NAME}" UserPromptSubmit`,
    `echo installing ${EXECUTABLE_NAME}`,
    `node "\${CLAUDE_PLUGIN_ROOT}/bundle/dispatch.js" UserPromptSubmit # ${EXECUTABLE_NAME}`,
  ])("runs the handler when a hook command only mentions the binary, %j", (mention) => {
    installBinary();
    writeSettings(
      home,
      JSON.stringify({
        hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: mention }] }] },
      }),
    );
    const result = dispatch(["UserPromptSubmit"]);
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(logDir()), result.stderr).toBe(true);
  });

  it("runs no handler when the binary is registered in the project settings", () => {
    const project = mkdtempSync(join(tmpdir(), "ls-dispatch-project-"));
    installBinary();
    writeSettings(project, registration("UserPromptSubmit"));
    try {
      const result = dispatch(["UserPromptSubmit"], "ordinary prompt", project);
      expect(result.status, result.stderr).toBe(0);
      expect(existsSync(logDir())).toBe(false);
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  });

  it("still reads the project settings when the home settings are malformed", () => {
    const project = mkdtempSync(join(tmpdir(), "ls-dispatch-project-"));
    installBinary();
    writeSettings(home, "{ not json");
    writeSettings(project, registration("UserPromptSubmit"));
    try {
      const result = dispatch(["UserPromptSubmit"], "ordinary prompt", project);
      expect(result.status, result.stderr).toBe(0);
      expect(existsSync(logDir())).toBe(false);
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  });

  it("runs the handler when the binary is registered but not installed", () => {
    writeSettings(home, registration("UserPromptSubmit"));
    const result = dispatch(["UserPromptSubmit"]);
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(logDir()), result.stderr).toBe(true);
  });

  it("runs the handler when the binary is installed but registers no hooks", () => {
    installBinary();
    writeSettings(home, pluginRegistration);
    const result = dispatch(["UserPromptSubmit"]);
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(logDir()), result.stderr).toBe(true);
  });

  it("runs the handler when no settings file exists", () => {
    installBinary();
    const result = dispatch(["UserPromptSubmit"]);
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(logDir()), result.stderr).toBe(true);
  });

  it("runs the handler when the settings file cannot be read", () => {
    installBinary();
    chmodSync(writeSettings(home, registration("UserPromptSubmit")), 0o000);
    const result = dispatch(["UserPromptSubmit"]);
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(logDir()), result.stderr).toBe(true);
  });

  it.each(["{ not json", "", "[]", '{ "hooks": 7 }', '{ "hooks": { "Stop": 7 } }'])(
    "runs the handler when the settings file holds %j",
    (contents) => {
      installBinary();
      writeSettings(home, contents);
      const result = dispatch(["UserPromptSubmit"]);
      expect(result.status, result.stderr).toBe(0);
      expect(existsSync(logDir()), result.stderr).toBe(true);
    },
  );

  function drainInChild(timeoutMs: number, setup = "") {
    const script =
      `${setup};import(${JSON.stringify(stdinSource)})` +
      `.then((m) => m.drainStdinToAvoidEpipe(${timeoutMs}))`;
    return new Promise<number | null | "hung">((resolve, reject) => {
      const child = spawn(tsx, ["-e", script], { stdio: ["pipe", "ignore", "inherit"] });
      const watchdog = setTimeout(() => {
        child.kill("SIGKILL");
        resolve("hung");
      }, 4_000);
      child.on("error", reject);
      child.on("close", (code) => {
        clearTimeout(watchdog);
        resolve(code);
      });
    });
  }

  it("gives up on a pipe the parent never closes", { timeout: 15_000 }, async () => {
    expect(await drainInChild(50)).toBe(0);
  });

  it("reads nothing when stdin is a terminal", { timeout: 15_000 }, async () => {
    expect(await drainInChild(60_000, "process.stdin.isTTY = true")).toBe(0);
  });
});

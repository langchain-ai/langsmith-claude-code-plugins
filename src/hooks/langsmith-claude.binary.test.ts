import { spawnSync } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  BINARY_COLD_START_TIMEOUT_MS,
  ENGINE_WORKER_ARG,
  GATEWAY_PLUGIN,
  HOOK_EVENT_NAMES,
  PLUGIN_FLAG,
  TRACING_PLUGIN,
} from "../constants.js";
import { configDir, loadConfig } from "../proxy/config.js";
import { healthy, waitForStopped } from "../proxy/lifecycle.js";
import { executableName, root, version } from "../fixtures/launcher-sandbox.js";

const binary = join(root, "bin", executableName);
const built = existsSync(binary);
const DAEMON_STOP_TIMEOUT_MS = 15_000;
const machineHasManagedFile = (() => {
  if (process.platform !== "darwin") return false;
  const entry = spawnSync("/usr/bin/id", ["-P", String(process.getuid?.())], { encoding: "utf8" });
  const accountHome = entry.stdout?.split(":")[8];
  return (
    Boolean(accountHome) && existsSync(join(accountHome, ".langsmith-plugins", "managed.json"))
  );
})();

if (!built && process.env.CI && process.platform === "darwin") {
  throw new Error(`Expected 'pnpm build:binary' to have produced ${binary}`);
}

async function freePort(): Promise<number> {
  const server = http.createServer().listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as { port: number };
  server.close();
  await once(server, "close");
  return port;
}

let home: string;
beforeEach(() => (home = mkdtempSync(join(tmpdir(), "ls-claude-binary-"))));
afterEach(async () => {
  const config = loadConfig(home);
  rmSync(join(configDir(home), "config.json"), { force: true });
  if (config) await waitForStopped(config, DAEMON_STOP_TIMEOUT_MS);
  rmSync(home, { recursive: true, force: true });
}, DAEMON_STOP_TIMEOUT_MS + 5_000);

describe.skipIf(!built)(`the standalone binary, bin/${executableName}`, () => {
  // Catches the gateway relaunching itself without its plugin flag.
  it("starts the gateway's local proxy from the binary itself", async () => {
    mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
    writeFileSync(
      join(configDir(home), "config.json"),
      JSON.stringify({
        enabled: true,
        useClaudeSubscription: false,
        cli: "/never-run-synthetic-cli",
        profile: "preview",
        port: await freePort(),
        secret: "a".repeat(64),
      }),
      { mode: 0o600 },
    );
    const result = spawnSync(binary, [PLUGIN_FLAG, GATEWAY_PLUGIN], {
      encoding: "utf8",
      env: { HOME: home, PATH: "/usr/bin:/bin" },
      input: JSON.stringify({ hook_event_name: "SessionStart", session_id: "binary", cwd: home }),
      timeout: 30_000,
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe("");
    expect(await healthy(loadConfig(home)!)).toBe(true);
  }, 40_000);
});

describe.skipIf(!built)(`the standalone binary, bin/${executableName} as tracing`, () => {
  function dispatch(args: string[], prompt = "ordinary prompt", timeout = 10000) {
    return spawnSync(binary, [PLUGIN_FLAG, TRACING_PLUGIN, ...args], {
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
      timeout,
    });
  }

  // A handler's initHook creates this directory, so it is proof the handler ran.
  const logDir = () => join(home, ".claude", "state");

  beforeAll(() => {
    home = mkdtempSync(join(tmpdir(), "ls-claude-binary-"));
    try {
      for (const event of HOOK_EVENT_NAMES)
        dispatch([event], undefined, BINARY_COLD_START_TIMEOUT_MS);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  }, BINARY_COLD_START_TIMEOUT_MS * HOOK_EVENT_NAMES.length);

  it("prints the package version for --version", () => {
    const result = dispatch(["--version"]);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe(version);
    expect(existsSync(logDir())).toBe(false);
  });

  it.each(HOOK_EVENT_NAMES.filter((e) => !(machineHasManagedFile && e === "UserPromptSubmit")))(
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

  // Catches the binary turning the uploader's own argument away as an unknown option,
  // which loses every tool trace for a binary user and says nothing about it.
  it("drains the queue rather than rejecting the uploader's argument", () => {
    const result = dispatch([ENGINE_WORKER_ARG]);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).not.toContain("unknown option");
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
});

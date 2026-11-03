import { spawnSync } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as after } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { configDir, loadConfig } from "../proxy/config.js";
import { healthy } from "../proxy/lifecycle.js";

const root = new URL("../../", import.meta.url);
const { executableName } = JSON.parse(
  readFileSync(new URL("gateway.binary.config.json", root), "utf8"),
);
const binary = fileURLToPath(new URL(`bin/${executableName}`, root));
const built = existsSync(binary);
const DAEMON_STOP_TIMEOUT_MS = 15_000;

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
beforeEach(() => (home = mkdtempSync(join(tmpdir(), "ls-gateway-binary-"))));
afterEach(async () => {
  const config = loadConfig(home);
  rmSync(join(configDir(home), "config.json"), { force: true });
  const deadline = Date.now() + DAEMON_STOP_TIMEOUT_MS;
  while (config && (await healthy(config)) && Date.now() < deadline) await after(250);
  rmSync(home, { recursive: true, force: true });
}, DAEMON_STOP_TIMEOUT_MS + 5_000);

describe.skipIf(!built)(`the standalone binary, bin/${executableName}`, () => {
  // Catches the binary relaunching itself as if it were Node running a script,
  // which leaves every gateway user on a binary without their local proxy.
  it("starts the local proxy from the binary itself", async () => {
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
    const result = spawnSync(binary, [], {
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

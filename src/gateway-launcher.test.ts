import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as after } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const launcher = join(root, "plugins/langsmith-gateway/hooks/langsmith-gateway");
const standIn = join(root, "src/fixtures/gateway-launcher.cjs");
const { executableName } = JSON.parse(
  readFileSync(join(root, "gateway.binary.config.json"), "utf8"),
);
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const asset = `${executableName}-darwin-arm64-${version}`;
const RELEASE_URL = `https://github.com/langchain-ai/langsmith-claude-code-plugins/releases/download/${version}`;
const TEAM_REQUIREMENT = 'anchor apple generic and certificate leaf[subject.OU] = "H253X88X9F"';
const DOWNLOAD_WAIT_MS = 10_000;
const TEST_TIMEOUT_MS = 30_000;
const EVENT = JSON.stringify({ hook_event_name: "SessionStart", session_id: "launcher" });
const FAKE_TOOLS = ["curl", "codesign", "uname"];
type Hooks = Record<string, { hooks: { command: string }[] }[]>;

const STAND_IN = readFileSync(standIn, "utf8");

function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), "langsmith-gateway-launcher-"));
  for (const folder of ["hooks", "bundle", "machine", "release", "data"]) {
    mkdirSync(join(dir, folder));
  }
  cpSync(launcher, join(dir, "hooks/langsmith-gateway"));
  cpSync(standIn, join(dir, "bundle/gateway.js"));
  for (const tool of FAKE_TOOLS) cpSync(standIn, join(dir, "machine", tool));
  cpSync(standIn, join(dir, "release", asset));
  return dir;
}

function environment(dir: string, extra: Record<string, string> = {}) {
  return {
    ...process.env,
    CLAUDE_PLUGIN_ROOT: dir,
    CLAUDE_PLUGIN_DATA: join(dir, "data"),
    PATH: `${join(dir, "machine")}:${process.env.PATH ?? ""}`,
    RELEASE: join(dir, "release"),
    CURL_LOG: join(dir, "curl.log"),
    CODESIGN_LOG: join(dir, "codesign.log"),
    // The suite's loader makes Node refuse a stand-in named like a versioned build.
    NODE_OPTIONS: "",
    ...extra,
  };
}

function run(dir: string, extra: Record<string, string> = {}) {
  return spawnSync(join(dir, "hooks/langsmith-gateway"), [], {
    encoding: "utf8",
    input: EVENT,
    env: environment(dir, extra),
  });
}

const installed = (dir: string) => join(dir, "data/bin", asset);
const requested = (dir: string) =>
  existsSync(join(dir, "curl.log"))
    ? readFileSync(join(dir, "curl.log"), "utf8").trim().split("\n")
    : [];

async function eventually(holds: () => boolean) {
  const deadline = Date.now() + DOWNLOAD_WAIT_MS;
  while (!holds() && Date.now() < deadline) await after(50);
  expect(holds()).toBe(true);
}

const partials = (dir: string) =>
  readdirSync(join(dir, "data/bin")).filter((name) => name.includes(".partial."));
const runnable = (dir: string) =>
  existsSync(installed(dir)) && (statSync(installed(dir)).mode & 0o111) !== 0;
const downloadFinished = (dir: string) =>
  eventually(() => runnable(dir) && partials(dir).length === 0);

function age(path: string, minutes: number) {
  const then = new Date(Date.now() - minutes * 60 * 1000);
  utimesSync(path, then, then);
}

function place(dir: string, name: string) {
  mkdirSync(join(dir, "data/bin"), { recursive: true });
  cpSync(standIn, join(dir, "data/bin", name));
  chmodSync(join(dir, "data/bin", name), 0o755);
}

describe("the gateway launcher", { timeout: TEST_TIMEOUT_MS }, () => {
  it("is what every gateway hook starts, with Node on the next line for Windows", () => {
    const hooks: Hooks = JSON.parse(
      readFileSync(join(root, "plugins/langsmith-gateway/hooks/hooks.json"), "utf8"),
    ).hooks;
    const commands = Object.values(hooks).flatMap((groups) =>
      groups.flatMap((group) => group.hooks.map((hook) => hook.command)),
    );
    expect(commands).toHaveLength(3);
    for (const command of commands) {
      expect(command.split("\n")).toEqual([
        'exec "${CLAUDE_PLUGIN_ROOT}/hooks/langsmith-gateway"',
        'node "${CLAUDE_PLUGIN_ROOT}/bundle/gateway.js"',
      ]);
    }
  });

  it("lets Node answer while it downloads this version's build", async () => {
    const dir = sandbox();
    const result = run(dir);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe(`node ${EVENT.length} bytes`);
    await downloadFinished(dir);
    expect(requested(dir)).toEqual([`${RELEASE_URL}/${asset}`]);
    expect(readFileSync(installed(dir), "utf8")).toBe(STAND_IN);
    expect(run(dir).stdout.trim()).toBe(`build ${EVENT.length} bytes`);
  });

  it("holds back a download not signed by our Apple team for six hours, then tries again", async () => {
    const dir = sandbox();
    const unsigned = { CODESIGN_RESULT: "3" };
    expect(run(dir, unsigned).stdout.trim()).toBe(`node ${EVENT.length} bytes`);
    await eventually(() => existsSync(installed(dir)) && partials(dir).length === 0);
    expect(runnable(dir)).toBe(false);
    expect(readFileSync(join(dir, "codesign.log"), "utf8")).toContain(`-R=${TEAM_REQUIREMENT}`);
    run(dir, unsigned);
    await after(500);
    expect(requested(dir)).toHaveLength(1);

    age(installed(dir), 7 * 60);
    run(dir, unsigned);
    await eventually(() => requested(dir).length === 2);
  });

  it("retries a download that never finished on the very next hook", async () => {
    const dir = sandbox();
    mkdirSync(join(dir, "empty"));
    run(dir, { RELEASE: join(dir, "empty") });
    await eventually(() => requested(dir).length === 1 && partials(dir).length === 0);
    expect(existsSync(installed(dir))).toBe(false);
    run(dir);
    await downloadFinished(dir);
  });

  it("answers the hook without waiting for the download", () => {
    const dir = sandbox();
    const started = Date.now();
    const result = run(dir, { CURL_DELAY: "3" });
    expect(result.stdout.trim()).toBe(`node ${EVENT.length} bytes`);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("asks for the Intel build on an Intel Mac", async () => {
    const dir = sandbox();
    run(dir, { FAKE_HARDWARE: "x86_64" });
    await eventually(() => requested(dir).length > 0);
    expect(requested(dir)[0]).toBe(`${RELEASE_URL}/${executableName}-darwin-x64-${version}`);
  });

  it("hands Node the event when the build cannot run, then replaces the build six hours later", async () => {
    const dir = sandbox();
    place(dir, asset);
    const result = run(dir, { FAKE_BUILD: "refuses" });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(`node ${EVENT.length} bytes`);
    expect(result.stderr.trim().split("\n")).toHaveLength(1);
    expect(runnable(dir)).toBe(false);

    run(dir);
    await after(500);
    expect(requested(dir)).toEqual([]);

    age(installed(dir), 7 * 60);
    run(dir);
    await downloadFinished(dir);
    expect(readFileSync(installed(dir), "utf8")).toBe(STAND_IN);
  });

  it("stays on Node and downloads nothing off a Mac", async () => {
    const dir = sandbox();
    expect(run(dir, { FAKE_SYSTEM: "Linux" }).stdout.trim()).toBe(`node ${EVENT.length} bytes`);
    const withoutDataFolder = run(dir, { FAKE_SYSTEM: "Linux", CLAUDE_PLUGIN_DATA: "" });
    expect(withoutDataFolder.stdout.trim()).toBe(`node ${EVENT.length} bytes`);
    expect(withoutDataFolder.stderr).toBe("");
    await after(500);
    expect(requested(dir)).toEqual([]);
  });

  it("starts no second download while one is still running", async () => {
    const dir = sandbox();
    run(dir, { CURL_DELAY: "2" });
    await eventually(() => partials(dir).length === 1);
    run(dir);
    await downloadFinished(dir);
    expect(requested(dir).filter((url) => url.endsWith(asset))).toHaveLength(1);
  });

  it("cleans up a killed download and retries it on the very next hook", async () => {
    const dir = sandbox();
    mkdirSync(join(dir, "data/bin"), { recursive: true });
    const killed = `${installed(dir)}.partial.${spawnSync("/usr/bin/true").pid}`;
    writeFileSync(killed, "half a build");
    run(dir);
    await downloadFinished(dir);
    expect(readFileSync(installed(dir), "utf8")).toBe(STAND_IN);
  });

  it("clears a download killed while another one was finishing", async () => {
    const dir = sandbox();
    run(dir, { CURL_DELAY: "2" });
    await eventually(() => partials(dir).length === 1);
    const killed = `${installed(dir)}.partial.${spawnSync("/usr/bin/true").pid}`;
    writeFileSync(killed, "half a build");
    await downloadFinished(dir);
    expect(existsSync(killed)).toBe(false);
  });

  it("leaves a download that is still running alone when another one finishes", async () => {
    const dir = sandbox();
    run(dir, { CURL_DELAY: "2" });
    await eventually(() => partials(dir).length === 1);
    const running = `${installed(dir)}.partial.${process.pid}`;
    writeFileSync(running, "another download in progress");
    await eventually(() => runnable(dir));
    await after(500);
    expect(existsSync(running)).toBe(true);
    expect(runnable(dir)).toBe(true);
  });

  it("runs the previous version's build while this version's downloads", async () => {
    const dir = sandbox();
    place(dir, `${executableName}-darwin-arm64-0.0.1`);
    expect(run(dir, { CURL_DELAY: "2" }).stdout.trim()).toBe(`build ${EVENT.length} bytes`);
    expect(runnable(dir)).toBe(false);
    await downloadFinished(dir);
  });

  it("deletes an older version's build only once nothing has fetched it for a week", async () => {
    const dir = sandbox();
    const unused = `${executableName}-darwin-arm64-0.0.1`;
    const inUse = `${executableName}-darwin-arm64-0.0.2`;
    place(dir, unused);
    place(dir, inUse);
    age(join(dir, "data/bin", unused), 8 * 24 * 60);
    run(dir);
    await downloadFinished(dir);
    expect(readdirSync(join(dir, "data/bin")).sort()).toEqual([asset, inUse].sort());
  });
});

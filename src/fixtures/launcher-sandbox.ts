import { execFileSync, spawn, spawnSync } from "node:child_process";
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
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { waitFor } from "./wait-for.js";

export const root = fileURLToPath(new URL("../../", import.meta.url));
export const gatewayPlugin = join(root, "plugins/langsmith-gateway");
const launcher = join(gatewayPlugin, "hooks/langsmith-claude-launcher");
const standIn = join(root, "src/fixtures/launcher-stand-in.cjs");
export const { executableName } = JSON.parse(
  readFileSync(join(root, "langsmith-claude.binary.config.json"), "utf8"),
);
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
export const build = `${executableName}-${version}`;
export const EVENT = JSON.stringify({ hook_event_name: "SessionStart", session_id: "launcher" });
export const STAND_IN = readFileSync(standIn, "utf8");
const FAKE_TOOLS = ["tar", "codesign", "uname"];
const UNPACK_WAIT_MS = 10_000;

export function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), "langsmith-claude-launcher-"));
  for (const folder of ["hooks", "bundle", "machine", "binary", "packing"]) {
    mkdirSync(join(dir, folder));
  }
  cpSync(launcher, join(dir, "hooks/langsmith-claude-launcher"));
  cpSync(standIn, join(dir, "bundle/gateway.js"));
  for (const tool of FAKE_TOOLS) cpSync(standIn, join(dir, "machine", tool));
  cpSync(standIn, join(dir, "packing", executableName));
  repack(dir);
  return dir;
}

export function repack(dir: string) {
  execFileSync("/usr/bin/tar", [
    "-cJf",
    join(dir, "binary", `${executableName}.tar.xz`),
    "-C",
    join(dir, "packing"),
    executableName,
  ]);
}

export function environment(dir: string, extra: Record<string, string> = {}) {
  return {
    ...process.env,
    CLAUDE_PLUGIN_ROOT: dir,
    PATH: `${join(dir, "machine")}:${process.env.PATH ?? ""}`,
    TAR_LOG: join(dir, "tar.log"),
    CODESIGN_LOG: join(dir, "codesign.log"),
    FAKE_BUILD_VERSION: version,
    // The suite's loader rejects stand-ins named like versioned builds.
    NODE_OPTIONS: "",
    ...extra,
  };
}

export function run(dir: string, extra: Record<string, string> = {}) {
  return spawnSync(join(dir, "hooks/langsmith-claude-launcher"), [], {
    encoding: "utf8",
    input: EVENT,
    env: environment(dir, extra),
  });
}

export function runAtOnce(dir: string, count: number): Promise<string[]> {
  return Promise.all(
    Array.from({ length: count }, () => {
      const hook = spawn(join(dir, "hooks/langsmith-claude-launcher"), [], {
        env: environment(dir, { TAR_DELAY: "1" }),
        stdio: ["pipe", "pipe", "ignore"],
      });
      let output = "";
      hook.stdout.on("data", (chunk) => (output += chunk));
      hook.stdin.end(EVENT);
      return new Promise<string>((resolve) => hook.on("close", () => resolve(output.trim())));
    }),
  );
}

export function place(dir: string, name: string) {
  cpSync(standIn, join(dir, "binary", name));
  chmodSync(join(dir, "binary", name), 0o755);
}

export function age(path: string, minutes: number, setTimes = utimesSync) {
  const then = new Date(Date.now() - minutes * 60 * 1000);
  setTimes(path, then, then);
}

export const deadProcess = () => String(spawnSync("/usr/bin/true").pid);
export const installed = (dir: string) => join(dir, "binary", build);
export const unpacks = (dir: string) =>
  existsSync(join(dir, "tar.log"))
    ? readFileSync(join(dir, "tar.log"), "utf8").trim().split("\n")
    : [];
export const partials = (dir: string) =>
  readdirSync(join(dir, "binary")).filter((name) => name.includes(".partial."));
export const runnable = (dir: string) =>
  existsSync(installed(dir)) && (statSync(installed(dir)).mode & 0o111) !== 0;
export const settles = (holds: () => boolean) => waitFor(holds, UNPACK_WAIT_MS);
export const unpackFinished = (dir: string) =>
  settles(() => runnable(dir) && partials(dir).length === 0);
export const unpackSettled = (dir: string) =>
  settles(() => existsSync(installed(dir)) && partials(dir).length === 0);

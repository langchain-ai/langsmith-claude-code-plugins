import { afterEach, beforeEach, expect } from "vitest";
import { execFile } from "node:child_process";
import { once } from "node:events";
import http from "node:http";
import {
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { configDir } from "../config.js";
import { CREDENTIAL_STATE_PATH, HEALTH_PATH } from "../proxy-constants.js";
import type { ProxyConfig } from "../proxy-models.js";
import { identity } from "../server.js";
import { targetPaths } from "../scopes.js";

export let root: string, home: string, project: string, config: ProxyConfig;
let listener: http.Server | undefined;
export let requests: string[];
let allowHealth: boolean;
export const save = (path: string, value: unknown) =>
  writeFileSync(path, JSON.stringify(value), { mode: 0o600 });
export function saveConfig(value: unknown = config) {
  mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
  save(join(configDir(home), "config.json"), value);
}
export function provision(scope: "global" | "project", cwd = project) {
  const paths = targetPaths(home, scope, cwd);
  mkdirSync(join(scope === "global" ? home : cwd, ".claude"), { recursive: true, mode: 0o700 });
  const afterBase = `http://127.0.0.1:${config.port}`;
  const afterHeaders = `X-Private: synthetic-header\nX-LangSmith-Proxy-Key: ${config.secret}`;
  save(paths.settings, {
    env: { ANTHROPIC_BASE_URL: afterBase, ANTHROPIC_CUSTOM_HEADERS: afterHeaders },
  });
  return paths;
}
// Exclude atime: reads may update it; content, permissions, inode and mtime must
// stay identical, and even transient write attempts are fatal in the child.
function tree(path: string): unknown {
  const stat = lstatSync(path);
  return {
    mode: stat.mode,
    ino: stat.ino,
    mtime: stat.mtimeMs,
    data: stat.isDirectory()
      ? Object.fromEntries(
          readdirSync(path)
            .sort()
            .map((name) => [name, tree(join(path, name))]),
        )
      : stat.isSymbolicLink()
        ? "symlink"
        : readFileSync(path, "utf8"),
  };
}
export async function probe(
  kind: "match" | "mismatch" | "offline" | "timeout" | "draining",
  credential: unknown = {},
) {
  allowHealth = true;
  listener = http.createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    expect(req.headers["x-langsmith-proxy-key"]).toBe(config.secret);
    if (kind === "timeout") return;
    if (req.url === CREDENTIAL_STATE_PATH) {
      res.end(typeof credential === "string" ? credential : JSON.stringify(credential));
      return;
    }
    res.statusCode = kind === "draining" ? 503 : 200;
    res.end(kind === "match" ? identity(config) : "synthetic-private-response");
  });
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  config.port = (listener.address() as { port: number }).port;
  if (kind === "offline") {
    await new Promise<void>((resolve) => listener!.close(() => resolve()));
    listener = undefined;
  }
}
function guard() {
  const file = join(root, "guard.cjs");
  writeFileSync(
    file,
    `
const home = ${JSON.stringify(home)}, project = ${JSON.stringify(project)}, port = ${config.port};
require("node:os").userInfo = () => ({ homedir: home });
const deny = () => { process.stderr.write("FORBIDDEN EFFECT\\n"); process.exit(97); };
for (const [module, names] of [
 ["node:child_process", ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]],
 ["node:https", ["request", "get"]], ["node:tls", ["connect"]],
 ["node:dns", ["lookup", "resolve"]], ["node:dgram", ["createSocket"]],
]) for (const name of names) require(module)[name] = deny;
globalThis.fetch = deny;
const http = require("node:http"), request = http.request;
http.get = deny;
const readOnlyPaths = ${JSON.stringify([HEALTH_PATH, CREDENTIAL_STATE_PATH])};
http.request = (opts, ...args) => ${allowHealth} && opts.hostname === "127.0.0.1" && opts.port === port &&
 opts.method === "GET" && readOnlyPaths.includes(opts.path) && opts.agent === false
 ? request(opts, ...args) : deny();
const net = require("node:net"), connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(...args) {
 const o = Array.isArray(args[0]) ? args[0][0] : args[0];
 return o && (o.host === "127.0.0.1" || o.hostname === "127.0.0.1") && Number(o.port) === port
  ? connect.apply(this, args) : deny();
};
const fs = require("node:fs");
for (const name of ["writeFile", "appendFile", "mkdir", "mkdtemp", "unlink", "rm", "rmdir", "rename", "copyFile", "cp", "link", "symlink", "chmod", "chown", "truncate", "write", "writev", "fchmod", "fchown", "ftruncate", "utimes", "lutimes", "fsync", "fdatasync"]) {
 for (const key of [name, name + "Sync"]) if (key in fs) fs[key] = deny;
 if (name in fs.promises) fs.promises[name] = deny;
}
fs.createWriteStream = deny;
function allowed(path) {
 const s = String(path);
 if (!s.startsWith(home) && !s.startsWith(project)) return true;
 return s.endsWith("/config.json") || s.endsWith("/settings.json") || s.endsWith("/settings.local.json");
}
for (const target of [fs, fs.promises]) for (const name of ["open", "openSync"]) {
 if (!(name in target)) continue;
 const original = target[name].bind(target);
 target[name] = (path, flags, ...args) => allowed(path) && (flags === "r" ||
 (typeof flags === "number" && (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_APPEND)) === 0))
 ? original(path, flags, ...args) : deny();
}
const read = fs.readFileSync;
fs.readFileSync = (path, ...args) => typeof path === "number" || allowed(path) ? read(path, ...args) : deny();
require("node:module").syncBuiltinESMExports();
`,
  );
  return file;
}
export async function invoke(
  prompt = "/langsmith-gateway:status",
  cwd: unknown = project,
  env = {},
) {
  const preload = guard();
  const before = tree(root);
  const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = execFile(
      process.execPath,
      ["--require", preload, join(root, "plugin/bundle/gateway.js")],
      {
        cwd: root,
        env: { HOME: "/not-real-home", PATH: "", ...env },
        timeout: 5000,
      },
      (error, stdout, stderr) =>
        error ? reject(new Error(`${error.message}: ${stderr}`)) : resolve({ stdout, stderr }),
    );
    child.stdin!.end(
      JSON.stringify({
        hook_event_name: "UserPromptSubmit",
        prompt,
        cwd,
        session_id: "must-not-renew",
      }),
    );
  });
  expect(result.stderr).toBe("");
  expect(tree(root)).toEqual(before);
  for (const secret of [
    config.secret,
    config.cli,
    "synthetic-header",
    "synthetic-before-base",
    "synthetic-native",
    "synthetic-ls",
    "synthetic-private-response",
  ])
    expect(result.stdout).not.toContain(secret);
  const output = JSON.parse(result.stdout);
  expect(output.decision).toBe("block");
  expect(Object.keys(output)).toEqual(["decision", "reason"]);
  return output.reason as string;
}
export const disclaimer =
  "This shows saved settings. Your current Claude session may still be using earlier settings. Configured forwarding mode does not verify actual Anthropic usage, authentication or subscription validity. Other projects may use the shared daemon.";
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), "gateway-status-")));
  home = join(root, "home");
  project = join(root, "project");
  mkdirSync(home, { mode: 0o700 });
  mkdirSync(project, { mode: 0o700 });
  cpSync(
    fileURLToPath(new URL("../../../plugins/langsmith-gateway", import.meta.url)),
    join(root, "plugin"),
    { recursive: true },
  );
  config = {
    enabled: true,
    useClaudeSubscription: false,
    cli: "/never-run-synthetic-cli",
    profile: "preview",
    port: 52507,
    secret: "a".repeat(64),
  };
  requests = [];
  allowHealth = false;
});
afterEach(async () => {
  if (listener) {
    listener.closeAllConnections();
    await new Promise<void>((resolve) => listener!.close(() => resolve()));
    listener = undefined;
  }
  rmSync(root, { recursive: true, force: true });
});

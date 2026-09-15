import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { once } from "node:events";
import http from "node:http";
import {
  chmodSync,
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONFIG_UPDATE_GUIDANCE,
  API_URL,
  UPSTREAM,
  configDir,
  configStatus,
  loadConfig,
  type ProxyConfig,
} from "./config.js";
import { identity } from "./server.js";
import { targetPaths } from "./scopes.js";
import { STATUS_ERROR } from "./status.js";
import { parseGatewayCommand, STATUS_GUIDANCE } from "./options.js";

let root: string, home: string, project: string, config: ProxyConfig;
let listener: http.Server | undefined;
let requests: string[];
let allowHealth: boolean;
const save = (path: string, value: unknown) =>
  writeFileSync(path, JSON.stringify(value), { mode: 0o600 });
function saveConfig(value: unknown = config) {
  mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
  save(join(configDir(home), "config.json"), value);
}
function provision(scope: "global" | "project", cwd = project) {
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
async function probe(kind: "match" | "mismatch" | "offline" | "timeout" | "draining") {
  allowHealth = true;
  listener = http.createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    expect(req.headers["x-langsmith-proxy-key"]).toBe(config.secret);
    if (kind === "timeout") return;
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
http.request = (opts, ...args) => ${allowHealth} && opts.hostname === "127.0.0.1" && opts.port === port &&
 opts.method === "GET" && opts.path === "/_langsmith/health" && opts.agent === false
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
 if (!s.startsWith(home) && !s.startsWith(project)) return true; // module loader
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
async function invoke(prompt = "/langsmith-gateway:status", cwd: unknown = project, env = {}) {
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
const disclaimer =
  "This shows saved settings. Your current Claude session may still be using earlier settings. Configured forwarding mode does not verify actual Anthropic usage, authentication or subscription validity. Other projects may use the shared daemon.";
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), "gateway-status-")));
  home = join(root, "home");
  project = join(root, "project");
  mkdirSync(home, { mode: 0o700 });
  mkdirSync(project, { mode: 0o700 });
  cpSync(
    fileURLToPath(new URL("../../plugins/langsmith-gateway", import.meta.url)),
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

describe("packaged read-only status", () => {
  it("reports both missing targets without creating .claude or checking a daemon", async () => {
    expect(await invoke()).toBe(
      [
        "Gateway status (read-only)",
        "Selected routing targets: global + current project",
        `  global ${JSON.stringify(join(home, ".claude/settings.json"))}: settings missing; proxy setup is missing.`,
        `  project ${JSON.stringify(join(project, ".claude/settings.local.json"))}: settings missing; proxy setup is missing.`,
        "Shared proxy configuration (applies to enabled scopes): not configured.",
        "Shared daemon: not checked (proxy setup is missing).",
        disclaimer,
      ].join("\n"),
    );
    expect(requests).toEqual([]);
  });
  it.each([{ enabled: false }, { useClaudeSubscription: undefined }])(
    "rejects incomplete config %j without probes or effects",
    async (invalid) => {
      saveConfig("enabled" in invalid ? invalid : { ...config, ...invalid });
      expect(await invoke()).toContain("one-time private config update");
      expect(requests).toEqual([]);
      expect(() => configStatus(home)).toThrow("one-time private config update");
      for (const includeDisabled of [false, true])
        expect(() => loadConfig(home, includeDisabled)).toThrow("one-time private config update");
    },
  );
  it.each([true, false])(
    "reports shared saved mode %s from receipt-free provisioning without credential reads",
    async (mode) => {
      await probe("match");
      config.useClaudeSubscription = mode;
      saveConfig({
        ...config,
        useClaudeSubscription: mode,
        apiUrl: "https://API.preview.test:443/",
        gatewayUrl: "https://gateway.preview.test:8443/",
      });
      // identity includes normalized endpoint origins.
      config.apiUrl = "https://api.preview.test";
      config.gatewayUrl = "https://gateway.preview.test:8443";
      const global = provision("global");
      const local = provision("project");
      const result = await invoke(undefined, project, {
        CLAUDE_CODE_OAUTH_TOKEN: "synthetic-native",
        LANGSMITH_API_KEY: "synthetic-ls",
      });
      expect(result).toBe(
        [
          "Gateway status (read-only)",
          "Selected routing targets: global + current project",
          `  global ${JSON.stringify(global.settings)}: settings present; configured to use the local gateway proxy.`,
          `  project ${JSON.stringify(local.settings)}: settings present; configured to use the local gateway proxy.`,
          `Shared proxy configuration (applies to enabled scopes): enabled; useClaudeSubscription ${mode === false ? "off" : "on"}; profile "preview"; API https://api.preview.test; gateway https://gateway.preview.test:8443.`,
          "Shared daemon: matching listener reachable.",
          disclaimer,
        ].join("\n"),
      );
      expect(requests).toEqual(["GET /_langsmith/health"]);
    },
  );
  it.each(["mismatch", "offline", "timeout", "draining"] as const)(
    "does not claim stopped on %s health",
    async (kind) => {
      await probe(kind);
      saveConfig();
      provision("global");
      const start = performance.now();
      const result = await invoke();
      expect(performance.now() - start).toBeLessThan(2000);
      expect(result).toContain("Shared daemon: not reachable or incompatible.");
      expect(result).not.toContain("stopped");
      expect(requests).toEqual(kind === "offline" ? [] : ["GET /_langsmith/health"]);
    },
  );
  it("preserves disabled retained mode while checking a listener awaiting drain", async () => {
    await probe("match");
    saveConfig({ ...config, enabled: false });
    expect(loadConfig(home)).toBeUndefined();
    expect(loadConfig(home, true)?.enabled).toBe(false);
    const result = await invoke();
    expect(result).toContain(
      `disabled; useClaudeSubscription off; profile "preview"; API ${API_URL}; gateway ${UPSTREAM}.`,
    );
    expect(result).toContain(
      "matching listener reachable (saved config disabled; may be awaiting drain)",
    );
    expect(requests).toEqual(["GET /_langsmith/health"]);
  });
  it.each([
    ["missing", "gateway routing is not configured in this settings file"],
    ["env", "gateway routing is not configured in this settings file"],
    ["base", "Claude’s saved API address differs from this proxy’s address"],
    ["headers", "local proxy authentication header is missing"],
  ])(
    "reports project %s settings separately from matching global routing",
    async (kind, diagnostic) => {
      await probe("match");
      saveConfig();
      provision("global");
      const paths = provision("project");
      if (kind === "missing") rmSync(paths.settings);
      else if (kind === "env") save(paths.settings, {});
      else {
        const disk = JSON.parse(readFileSync(paths.settings, "utf8"));
        disk.env[kind === "base" ? "ANTHROPIC_BASE_URL" : "ANTHROPIC_CUSTOM_HEADERS"] =
          "synthetic-private-response";
        save(paths.settings, disk);
      }
      const result = await invoke();
      expect(result).toContain(
        `project ${JSON.stringify(paths.settings)}: settings ${kind === "missing" ? "missing" : "present"}; ${diagnostic}.`,
      );
      expect(result).toContain(
        `global ${JSON.stringify(targetPaths(home, "global", project).settings)}: settings present; configured to use the local gateway proxy.`,
      );
    },
  );
  it.each(["malformed", "stale", "symlink"])(
    "ignores %s legacy receipts without reading them",
    async (kind) => {
      await probe("match");
      saveConfig();
      provision("global");
      const path = join(configDir(home), "settings-ownership.json");
      if (kind === "symlink") symlinkSync(join(root, "missing"), path);
      else
        writeFileSync(
          path,
          kind === "malformed"
            ? "synthetic-secret"
            : JSON.stringify({ identity: "old", beforeHeaders: "synthetic-secret" }),
          { mode: 0o600 },
        );
      expect(await invoke()).toContain("configured to use the local gateway proxy");
    },
  );
  it("can show a shared running daemon with neither current target configured", async () => {
    await probe("match");
    saveConfig();
    const other = join(root, "other-project");
    mkdirSync(other, { mode: 0o700 });
    provision("project", other);
    const result = await invoke();
    expect(result.match(/gateway routing is not configured in this settings file/g)).toHaveLength(
      2,
    );
    expect(result).toContain("Shared daemon: matching listener reachable.");
    expect(result).not.toContain(other);
  });
  it("escapes project paths rather than emitting terminal control characters", async () => {
    const escaped = join(root, 'project-"quoted"\nline');
    mkdirSync(escaped, { mode: 0o700 });
    expect(await invoke(undefined, escaped)).toContain(
      JSON.stringify(join(escaped, ".claude/settings.local.json")),
    );
  });
  it("scope selects routing only, and global scope needs no project cwd", async () => {
    await probe("offline");
    saveConfig({ ...config, enabled: false });
    const result = await invoke("/langsmith-gateway:status --scope global", null);
    expect(result).toContain("Selected routing targets: global\n");
    expect(result).not.toContain("  project ");
    expect(await invoke("/langsmith-gateway:status --scope project")).not.toContain("  global ");
    expect(parseGatewayCommand("/langsmith-gateway:status")).toEqual({
      command: "status",
      args: [],
    });
  });
  it.each([
    "malformed-config",
    "invalid-mode",
    "unsafe-config",
    "invalid-profile",
    "invalid-endpoints",
    "malformed-settings",
    "symlink-settings",
    "symlink-settings-dir",
    "symlink-cwd",
    "unknown-cwd",
    "missing-cwd",
    "relative-cwd",
    "custom-home",
  ])("sanitizes %s errors with no effects", async (kind) => {
    saveConfig();
    let cwd: unknown = project;
    let env = {};
    if (kind === "malformed-config")
      writeFileSync(join(configDir(home), "config.json"), "synthetic-native");
    if (kind === "invalid-mode")
      saveConfig({ ...config, useClaudeSubscription: "synthetic-native" });
    if (kind === "invalid-profile") saveConfig({ ...config, profile: "synthetic-native\n" });
    if (kind === "invalid-endpoints")
      saveConfig({ ...config, apiUrl: "https://synthetic-native@api.test", gatewayUrl: UPSTREAM });
    if (kind === "symlink-settings-dir")
      symlinkSync(join(home, ".claude"), join(project, ".claude"));
    if (kind === "missing-cwd") cwd = null;
    if (kind === "unsafe-config") chmodSync(join(configDir(home), "config.json"), 0o644);
    if (kind === "malformed-settings")
      writeFileSync(join(home, ".claude/settings.json"), "synthetic-native", { mode: 0o600 });
    if (kind === "symlink-settings")
      symlinkSync(join(configDir(home), "config.json"), join(home, ".claude/settings.json"));
    if (kind === "symlink-cwd") {
      cwd = join(root, "link");
      symlinkSync(project, cwd as string);
    }
    if (kind === "unknown-cwd") cwd = join(root, "missing");
    if (kind === "relative-cwd") cwd = "relative";
    if (kind === "custom-home") env = { CLAUDE_CONFIG_DIR: "/synthetic-native" };
    expect(await invoke(undefined, cwd, env)).toBe(
      ["invalid-mode", "invalid-profile", "invalid-endpoints"].includes(kind)
        ? CONFIG_UPDATE_GUIDANCE
        : STATUS_ERROR,
    );
    expect(requests).toEqual([]);
  });
  it.each([
    "--yes",
    "--scope",
    "--scope local",
    "--scope global --scope project",
    "--profile synthetic-native",
    "--use-claude-subscription",
    "--scope=project",
    "synthetic-native",
    "--scope global\n",
    "--scope 'global'",
  ])("strictly blocks invalid args %s", async (args) => {
    expect(await invoke(`/langsmith-gateway:status ${args}`, "missing-relative-cwd")).toBe(
      STATUS_GUIDANCE,
    );
    expect(requests).toEqual([]);
  });
});

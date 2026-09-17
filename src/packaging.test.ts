import { describe, expect, it, vi } from "vitest";
import { build } from "esbuild";
import { execFile, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { once } from "node:events";
import { createProxy } from "./proxy/server.js";
import { COMMAND_GUIDANCE, parseGatewayCommand } from "./proxy/options.js";
import { endpoints, type ProxyConfig } from "./proxy/config.js";
import { isBuiltin } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { HOOK_EVENT_NAMES } from "./constants.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const gatewayRoot = join(root, "plugins/langsmith-gateway");
const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const events = ["SessionStart", "UserPromptSubmit", "SessionEnd"];
type Hooks = Record<string, { hooks: { type: string; command: string }[] }[]>;

function hookBundles(pluginRoot: string): string[] {
  const hooks: Hooks = json(join(pluginRoot, "hooks/hooks.json")).hooks;
  return Object.entries(hooks).flatMap(([event, groups]) =>
    groups.flatMap((group) =>
      group.hooks.map((hook) => {
        expect(hook.type).toBe("command");
        const match = /^node "\$\{CLAUDE_PLUGIN_ROOT\}\/(bundle\/[^" ]+\.js)"( \S+)?$/.exec(
          hook.command,
        );
        expect(match, hook.command).not.toBeNull();
        // The dispatcher runs whichever event it is given, so a mislabelled
        // argument would quietly run the wrong hook.
        if (match![1] === "bundle/dispatch.js") expect(match![2], hook.command).toBe(` ${event}`);
        const path = resolve(pluginRoot, match![1]);
        expect(path.startsWith(resolve(pluginRoot) + sep)).toBe(true);
        expect(existsSync(path), path).toBe(true);
        return match![1];
      }),
    ),
  );
}

describe("separate marketplace packages", () => {
  it("resolves marketplace sources to matching independent manifests and local hook bundles", () => {
    const entries = json(join(root, ".claude-plugin/marketplace.json")).plugins;
    expect(entries.map((entry: { name: string }) => entry.name).sort()).toEqual([
      "langsmith-gateway",
      "langsmith-tracing",
    ]);
    for (const entry of entries) {
      expect(entry.source).toBe(
        entry.name === "langsmith-tracing" ? "./" : "./plugins/langsmith-gateway",
      );
      const pluginRoot = resolve(root, entry.source);
      const manifest = json(join(pluginRoot, ".claude-plugin/plugin.json"));
      expect(manifest.name).toBe(entry.name);
      if (entry.name === "langsmith-tracing") {
        expect(manifest.version).toBe(json(join(root, "package.json")).version);
        expect(hookBundles(pluginRoot)).toEqual(
          Array(HOOK_EVENT_NAMES.length).fill("bundle/dispatch.js"),
        );
        expect(existsSync(join(pluginRoot, "bundle/gateway.js"))).toBe(false);
      } else {
        expect(manifest.version).toBe("0.1.0");
        expect(manifest.description).toMatch(/experimental/i);
        expect(entry.description).toMatch(/experimental/i);
        expect(Object.keys(json(join(pluginRoot, "hooks/hooks.json")).hooks).sort()).toEqual(
          [...events].sort(),
        );
        expect(hookBundles(pluginRoot)).toEqual(events.map(() => "bundle/gateway.js"));
      }
    }
  });

  it("ships only argument-preserving deterministic command wrappers in the gateway", () => {
    for (const name of ["setup", "disable", "status"]) {
      const command = readFileSync(join(gatewayRoot, "commands", `${name}.md`), "utf8");
      const [, frontmatter, body] = command.split("---\n");
      expect(frontmatter.trim().split("\n")).toEqual([
        name === "status"
          ? "description: Show read-only gateway routing and shared proxy status"
          : `description: ${name === "setup" ? "Enable" : "Disable"} gateway settings deterministically for an explicit scope`,
        name === "setup"
          ? `argument-hint: "--scope global|project [--use-claude-subscription] [--profile name] [--api-url HTTPS_ORIGIN --gateway-url HTTPS_ORIGIN] [--cli /absolute/path --port 52507]"`
          : name === "status"
            ? `argument-hint: "[--scope global|project]"`
            : `argument-hint: "--scope global|project"`,
        "disable-model-invocation: true",
      ]);
      // Like tracing mute/unmute: no model instructions or fallback prose.
      expect(body.trim()).toBe(`/langsmith-gateway:${name} $ARGUMENTS`);
      for (const scope of ["global", "project"]) {
        const args = ["--scope", scope];
        if (name === "setup")
          args.push(
            ...(scope === "global" ? ["--use-claude-subscription"] : []),
            "--profile",
            "preview",
            "--api-url",
            "https://api.preview.test/",
            "--gateway-url",
            "https://gateway.preview.test:8443/",
            "--cli",
            "/absolute/path/to/langsmith",
            "--port",
            "52508",
          );
        const expanded = body.trim().replace("$ARGUMENTS", args.join(" "));
        expect(expanded).toBe(`/langsmith-gateway:${name} ${args.join(" ")}`);
        expect(parseGatewayCommand(expanded)).toEqual({ command: name, args });
      }
      expect(existsSync(join(root, "commands", `${name}.md`))).toBe(false);
    }
  });

  it.each(["missing", "disabled", "retained-disabled", "enabled", "malformed"])(
    "rejects unsupported or unconsented invocations without effects with %s config",
    (state) => {
      const sandbox = mkdtempSync(join(tmpdir(), "langsmith-rejected-package-"));
      try {
        const installed = join(sandbox, "plugin");
        cpSync(gatewayRoot, installed, { recursive: true });
        const home = join(sandbox, "home");
        const dir = join(home, ".claude/langsmith-proxy");
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        const config =
          state === "disabled"
            ? '{"enabled":false}'
            : state === "malformed"
              ? "invalid-private-config"
              : JSON.stringify({
                  enabled: state !== "retained-disabled",
                  useClaudeSubscription: false,
                  apiUrl: "https://api.preview.test",
                  gatewayUrl: "https://gateway.preview.test",
                  cli: process.execPath,
                  profile: "private-profile",
                  port: 52507,
                  secret: "b".repeat(64),
                });
        if (state !== "missing") writeFileSync(join(dir, "config.json"), config, { mode: 0o600 });
        const settings = join(home, ".claude/settings.json");
        const beforeSettings = '{"env":{"ANTHROPIC_CUSTOM_HEADERS":"X-Private: synthetic"}}';
        writeFileSync(settings, beforeSettings, { mode: 0o600 });
        const guard = join(sandbox, "guard.cjs");
        // Redirect OS home, not just HOME. Exit immediately on any forbidden
        // attempt so the runtime cannot swallow a denial and hide a regression.
        writeFileSync(
          guard,
          `
const home = ${JSON.stringify(home)};
require("node:os").userInfo = () => ({ homedir: home });
const deny = () => { process.stderr.write("FORBIDDEN EFFECT\\n"); process.exit(97); };
for (const [module, names] of [
  ["node:child_process", ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]],
  ["node:http", ["request", "get", "createServer"]],
  ["node:https", ["request", "get", "createServer"]],
  ["node:net", ["connect", "createConnection", "createServer"]],
  ["node:tls", ["connect", "createServer"]],
  ["node:dgram", ["createSocket"]],
  ["node:dns", ["lookup", "resolve"]],
]) for (const name of names) require(module)[name] = deny;
require("node:net").Socket.prototype.connect = deny;
const fs = require("node:fs");
for (const name of ["writeFile", "appendFile", "mkdir", "mkdtemp", "unlink", "rm", "rmdir", "rename", "copyFile", "cp", "link", "symlink", "chmod", "chown", "truncate", "write", "writev", "fchmod", "fchown", "ftruncate", "utimes", "lutimes"]) {
  for (const key of [name, name + "Sync"]) if (key in fs) fs[key] = deny;
  if (name in fs.promises) fs.promises[name] = deny;
}
fs.createWriteStream = deny;
// Node's module loader needs read-only opens for the copied bundle.
for (const target of [fs, fs.promises]) for (const name of ["open", "openSync"]) {
  if (!(name in target)) continue;
  const original = target[name].bind(target);
  target[name] = (path, flags, ...args) =>
    !String(path).startsWith(home) && (flags === "r" || flags === 0)
      ? original(path, flags, ...args) : deny();
}
for (const name of ["readFileSync", "statSync", "lstatSync", "accessSync", "existsSync"]) {
  const original = fs[name];
  fs[name] = (path, ...args) => String(path).startsWith(home) ? deny() : original(path, ...args);
}
globalThis.fetch = deny;
require("node:module").syncBuiltinESMExports();
`,
        );
        const invoke = (args: string[], prompt?: string) =>
          spawnSync(
            process.execPath,
            ["--require", guard, join(installed, "bundle/gateway.js"), ...args],
            {
              cwd: sandbox,
              env: { HOME: "/must-not-use-env-home", PATH: "", CLAUDE_PLUGIN_ROOT: installed },
              encoding: "utf8",
              timeout: 5000,
              input:
                prompt === undefined
                  ? undefined
                  : JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt, cwd: sandbox }),
            },
          );
        const invocations = [
          [""],
          ["daemon", ""],
          ["plan"],
          ["enable", "--yes", "--scope", "global"],
          ["disable", "--yes", "--scope", "global"],
          ["status"],
          ["daemon", "extra"],
          ["daemon", "--scope", "global"],
          ["setup"],
          ["setup", process.execPath, "private-argument", "52507"],
          ["setup", "--yes", "--scope", "global", "--profile", "private-argument"],
          ["launch"],
          ["unknown-private-argument"],
          ["--help"],
          ["enable"],
          ["enable", process.execPath, "private-argument", "52507"],
          ["disable"],
        ];
        for (const args of invocations) {
          const result = invoke(args);
          expect(result.error, args.join(" ")).toBeUndefined();
          expect(result.status, result.stderr).toBe(1);
          expect(result.stdout).toBe("");
          expect(result.stderr).toBe(COMMAND_GUIDANCE + "\n");
        }
        for (const prompt of [
          "/langsmith-gateway:setup",
          "/langsmith-gateway:setup --scope " + "private-argument".repeat(5000),
          "/langsmith-gateway:setup --scope global /absolute/cli profile 52507",
          "/langsmith-gateway:setup --yes --scope global",
          "/langsmith-gateway:setup --scope global --use-claude-subscription true",
          "/langsmith-gateway:setup --scope global --scope project",
          "/langsmith-gateway:setup --scope global --use-claude-subscription --no-use-claude-subscription",
          "/langsmith-gateway:setup --scope global --no-use-claude-subscription",
          "/langsmith-gateway:setup --scope global --use-claude-subscription=false",
          "/langsmith-gateway:setup --scope global; echo secret",
          "/langsmith-gateway:disable --scope global --yes",
          "/langsmith-gateway:status --unknown private-argument",
          "/langsmith-gateway:status --scope project --scope global",
          "/langsmith-gateway:status --scope",
          "/langsmith-gateway:status --use-claude-subscription",
          "/langsmith-gateway:status --scope global; private-argument",
        ]) {
          const result = invoke([], prompt);
          expect(result.status, result.stderr).toBe(0);
          expect(result.stderr).toBe("");
          expect(JSON.parse(result.stdout)).toEqual({
            decision: "block",
            reason: expect.stringContaining("within Claude Code"),
          });
        }
        expect(readdirSync(dir)).toEqual(state === "missing" ? [] : ["config.json"]);
        if (state !== "missing")
          expect(readFileSync(join(dir, "config.json"), "utf8")).toBe(config);
        expect(readdirSync(join(home, ".claude")).sort()).toEqual([
          "langsmith-proxy",
          "settings.json",
        ]);
        expect(readFileSync(settings, "utf8")).toBe(beforeSettings);
      } finally {
        rmSync(sandbox, { recursive: true, force: true });
      }
    },
  );

  it("enables/disables the standalone bundle against isolated OS home and a healthy daemon without invoking tokens", async () => {
    const sandbox = realpathSync(mkdtempSync(join(tmpdir(), "langsmith-enable-package-")));
    const config: ProxyConfig = {
      enabled: true,
      useClaudeSubscription: false,
      cli: process.execPath,
      profile: "fake",
      port: 0,
      secret: "b".repeat(64),
    };
    const token = vi.fn(async (): Promise<string> => {
      throw new Error("No eager authentication permitted");
    });
    const daemon = createProxy(config, { token });
    const controls: string[] = [];
    daemon.server.on("request", (req) => controls.push(`${req.method} ${req.url}`));
    daemon.server.listen(0, "127.0.0.1");
    await once(daemon.server, "listening");
    config.port = (daemon.server.address() as { port: number }).port;
    try {
      const installed = join(sandbox, "plugin");
      cpSync(gatewayRoot, installed, { recursive: true });
      const home = join(sandbox, "home");
      const dir = join(home, ".claude/langsmith-proxy");
      mkdirSync(dir, { recursive: true, mode: 0o700 });
      writeFileSync(join(dir, "config.json"), JSON.stringify(config), { mode: 0o600 });
      const settings = join(home, ".claude/settings.json");
      writeFileSync(
        settings,
        '{"model":"keep","env":{"ANTHROPIC_CUSTOM_HEADERS":"X-Test: keep"}}',
        { mode: 0o600 },
      );
      const guard = join(sandbox, "guard.cjs");
      writeFileSync(
        guard,
        `
require("node:os").userInfo = () => ({ homedir: ${JSON.stringify(home)} });
const deny = () => { throw new Error("No subprocess/CLI permitted"); };
const cp = require("node:child_process");
const originalSpawnSync = cp.spawnSync;
for (const name of ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]) cp[name] = deny;
// Only repository metadata checks are allowed; never a CLI/token subprocess.
cp.spawnSync = (file, args, options) => file === "git" ? originalSpawnSync("/usr/bin/git", args, options) : deny();
globalThis.fetch = deny;
require("node:module").syncBuiltinESMExports();
`,
      );
      const invokeHook = (prompt: string) =>
        new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
          const child = execFile(
            process.execPath,
            ["--require", guard, join(installed, "bundle/gateway.js")],
            {
              cwd: sandbox,
              env: { HOME: "/must-not-use-env-home", PATH: "" },
              timeout: 5000,
            },
            (error, stdout, stderr) => (error ? reject(error) : resolve({ stdout, stderr })),
          );
          child.stdin!.end(
            JSON.stringify({
              hook_event_name: "UserPromptSubmit",
              prompt,
              cwd: sandbox,
            }),
          );
        });
      const setupScope = async (scope: string) => {
        for (const state of ["saved", "already configured"]) {
          const started = performance.now();
          const result = await invokeHook(`/langsmith-gateway:setup --scope ${scope}`);
          expect(performance.now() - started).toBeLessThan(2000);
          expect(result.stderr).toBe("");
          const output = JSON.parse(result.stdout);
          expect(output.decision).toBe("block");
          expect(output.reason).toContain(`Gateway settings ${state} for the selected scope`);
          expect(output.reason).toContain("local daemon healthy");
          expect(output.reason).toContain("Authentication is checked on the first model request");
          expect(output.reason).not.toMatch(/restart|live|next request/i);
          expect(output.reason).not.toContain(config.secret);
        }
      };
      for (const scope of ["global", "project"]) {
        await setupScope(scope);
        const status = await invokeHook(`/langsmith-gateway:status --scope ${scope}`);
        expect(status.stderr).toBe("");
        expect(JSON.parse(status.stdout)).toMatchObject({
          decision: "block",
          reason: expect.stringContaining("configured to use the local gateway proxy"),
        });
      }
      expect(controls).toEqual(Array(6).fill("GET /_langsmith/health"));
      expect(token).not.toHaveBeenCalled();
      expect(json(settings).env.ANTHROPIC_CUSTOM_HEADERS).toBe(
        `X-Test: keep\nX-LangSmith-Proxy-Key: ${config.secret}`,
      );
      const result = await invokeHook("/langsmith-gateway:disable --scope global");
      expect(result.stderr).toBe("");
      const reason = JSON.parse(result.stdout).reason;
      expect(JSON.parse(result.stdout).decision).toBe("block");
      expect(reason).toContain("Gateway disabled");
      expect(reason).toContain("Other known matching scopes remain active");
      expect(reason).toContain("Restart affected Claude sessions to stop using the proxy.");
      expect(reason).toContain("up to 30 seconds for active work");
      expect(reason).not.toContain(config.secret);
      expect(json(join(dir, "config.json")).enabled).toBe(true);
      const projectDisabled = await invokeHook("/langsmith-gateway:disable --scope project");
      expect(projectDisabled.stderr).toBe("");
      expect(JSON.parse(projectDisabled.stdout)).toEqual({ decision: "block", reason });
      expect(json(settings)).toEqual({
        model: "keep",
        env: { ANTHROPIC_CUSTOM_HEADERS: "X-Test: keep" },
      });
      expect(json(join(dir, "config.json"))).toEqual({
        ...config,
        ...endpoints(config),
        enabled: false,
        settingsTargets: [],
      });
      // Fresh and repeated hook setup, then hook disable, against the same local double.
      writeFileSync(join(dir, "config.json"), JSON.stringify(config));
      await setupScope("global");
      const disabled = await invokeHook("/langsmith-gateway:disable --scope global");
      expect(disabled.stderr).toBe("");
      expect(JSON.parse(disabled.stdout)).toEqual({
        decision: "block",
        reason,
      });
      expect(json(settings)).toEqual({
        model: "keep",
        env: { ANTHROPIC_CUSTOM_HEADERS: "X-Test: keep" },
      });
      expect(json(join(dir, "config.json")).enabled).toBe(false);
      expect(token).not.toHaveBeenCalled();
    } finally {
      daemon.drain();
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it("loads the shipped gateway outside the repo with no root runtime dependencies and safely no-ops disabled", async () => {
    const sandbox = mkdtempSync(join(tmpdir(), "langsmith-package-"));
    try {
      const installed = join(sandbox, "plugin");
      cpSync(gatewayRoot, installed, { recursive: true });
      const artifact = join(installed, "bundle/gateway.js");
      // Analyze the actual distributable, not source-text pins. Any remaining
      // package import is forbidden; relative imports must resolve in the copy.
      const result = await build({
        entryPoints: [artifact],
        bundle: true,
        platform: "node",
        format: "esm",
        packages: "external",
        write: false,
        metafile: true,
      });
      for (const output of Object.values(result.metafile!.outputs)) {
        expect(output.imports.every((dependency) => isBuiltin(dependency.path))).toBe(true);
      }
      expect(Object.keys(result.metafile!.inputs)).toHaveLength(1);

      const home = join(sandbox, "home");
      const configDir = join(home, ".claude/langsmith-proxy");
      mkdirSync(configDir, { recursive: true, mode: 0o700 });
      const retained = {
        enabled: false,
        useClaudeSubscription: false,
        cli: process.execPath,
        profile: "fake",
        port: 52507,
        secret: "b".repeat(64),
      };
      writeFileSync(join(configDir, "config.json"), JSON.stringify(retained), { mode: 0o600 });
      const guard = join(sandbox, "guard.cjs");
      // HOME alone is NOT isolation: production uses os.userInfo().homedir.
      // Redirect that builtin before loading ESM; deny effects even on regression.
      writeFileSync(
        guard,
        `
const os = require("node:os");
os.userInfo = () => ({ homedir: ${JSON.stringify(home)} });
const deny = () => { process.stderr.write("FORBIDDEN EFFECT\\n"); process.exit(97); };
for (const [module, names] of [
  ["node:child_process", ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]],
  ["node:http", ["request", "get", "createServer"]],
  ["node:https", ["request", "get", "createServer"]],
  ["node:net", ["connect", "createConnection", "createServer"]],
  ["node:tls", ["connect", "createServer"]],
  ["node:fs", ["writeFileSync", "mkdirSync", "appendFileSync", "unlinkSync"]],
]) for (const name of names) require(module)[name] = deny;
globalThis.fetch = deny;
require("node:module").syncBuiltinESMExports();
`,
      );
      for (const hook_event_name of [...events, "daemon"]) {
        const result = spawnSync(
          process.execPath,
          ["--require", guard, artifact, ...(hook_event_name === "daemon" ? ["daemon"] : [])],
          {
            cwd: sandbox,
            env: { HOME: home, PATH: "", CLAUDE_PLUGIN_ROOT: installed },
            input: JSON.stringify({
              hook_event_name,
              session_id: "isolated-package-test",
              cwd: sandbox,
            }),
            encoding: "utf8",
            timeout: 5000,
          },
        );
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(0);
        expect(result.stdout).toBe("");
        expect(result.stderr).toBe("");
      }
      const largeInput = JSON.stringify({
        hook_event_name: "UserPromptSubmit",
        prompt: "ordinary long prompt ".repeat(4000),
        session_id: "isolated-package-test",
        cwd: sandbox,
      });
      const malformedInput = JSON.stringify({ prompt: "private-malformed-input" }) + "invalid";
      for (const input of [largeInput, malformedInput]) {
        const result = spawnSync(process.execPath, ["--require", guard, artifact], {
          cwd: sandbox,
          env: { HOME: "/must-not-use-env-home", PATH: "" },
          input,
          encoding: "utf8",
          timeout: 5000,
        });
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(0);
        expect(result.stdout).toBe("");
        if (input === largeInput) expect(result.stderr).toBe("");
        else {
          expect(result.stderr).toContain("No sensitive error details are printed.");
          expect(result.stderr).not.toContain("private-malformed-input");
          expect(result.stderr).not.toContain("Failed to parse hook input");
        }
      }
      // Leave stdin open beyond the former one-second cutoff. The child has an
      // outer test timeout; production relies on the timeout owned by Claude.
      const delayed = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        const child = execFile(
          process.execPath,
          ["--require", guard, artifact],
          {
            cwd: sandbox,
            env: { HOME: "/must-not-use-env-home", PATH: "" },
            timeout: 5000,
          },
          (error, stdout, stderr) => {
            clearTimeout(timer);
            if (error) reject(error);
            else resolve({ stdout, stderr });
          },
        );
        child.stdin!.on("error", reject);
        child.stdin!.write(largeInput.slice(0, 100));
        const timer = setTimeout(() => child.stdin!.end(largeInput.slice(100)), 1500);
      });
      expect(delayed).toEqual({ stdout: "", stderr: "" });
      expect(readdirSync(configDir)).toEqual(["config.json"]);
      expect(json(join(configDir, "config.json"))).toEqual(retained);
      // Invalid disabled data must not silently short-circuit validation. Hook
      // failures stay safe and sanitized; daemon errors exit nonzero.
      for (const invalid of [
        { enabled: false },
        { ...retained, useClaudeSubscription: undefined },
        { ...retained, enabled: true, useClaudeSubscription: undefined },
        { ...retained, apiUrl: "https://private.invalid/path" },
        { ...retained, enabled: "false" },
        { ...retained, enabled: undefined },
        { ...retained, useClaudeSubscription: null },
      ]) {
        const before = JSON.stringify(invalid);
        writeFileSync(join(configDir, "config.json"), before);
        for (const mode of [...events, "daemon", "status", "setup", "disable"]) {
          const command = ["status", "setup", "disable"].includes(mode);
          const result = spawnSync(
            process.execPath,
            ["--require", guard, artifact, ...(mode === "daemon" ? ["daemon"] : [])],
            {
              cwd: sandbox,
              env: { HOME: "/untrusted", PATH: "" },
              input: JSON.stringify({
                hook_event_name: command ? "UserPromptSubmit" : mode,
                prompt: command ? `/langsmith-gateway:${mode} --scope global` : "ordinary prompt",
                session_id: "isolated-package-test",
                cwd: sandbox,
              }),
              encoding: "utf8",
              timeout: 5000,
            },
          );
          expect(result.error).toBeUndefined();
          expect(result.status, result.stderr).toBe(mode === "daemon" ? 1 : 0);
          if (command) {
            expect(result.stderr).toBe("");
            expect(JSON.parse(result.stdout)).toMatchObject({
              decision: "block",
              reason: expect.stringContaining("one-time private config update"),
            });
          } else {
            expect(result.stdout).toBe("");
            expect(result.stderr).toContain("one-time private config update");
          }
          expect(result.stdout + result.stderr).not.toContain(retained.secret);
          expect(result.stdout + result.stderr).not.toContain("private.invalid");
          expect(readFileSync(join(configDir, "config.json"), "utf8")).toBe(before);
          expect(readdirSync(configDir)).toEqual(["config.json"]);
        }
      }
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});

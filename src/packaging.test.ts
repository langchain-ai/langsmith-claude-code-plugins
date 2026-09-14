import { describe, expect, it, vi } from "vitest";
import { build } from "esbuild";
import { execFile, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { once } from "node:events";
import { promisify } from "node:util";
import { createProxy } from "./proxy/server.js";
import { parseGatewayCommand } from "./proxy/options.js";
import { endpoints, type ProxyConfig } from "./proxy/config.js";
import { isBuiltin } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const gatewayRoot = join(root, "plugins/langsmith-gateway");
const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const events = ["SessionStart", "UserPromptSubmit", "SessionEnd"];
type Hooks = Record<string, { hooks: { type: string; command: string }[] }[]>;

function hookBundles(pluginRoot: string): string[] {
  const hooks: Hooks = json(join(pluginRoot, "hooks/hooks.json")).hooks;
  return Object.values(hooks).flatMap((groups) =>
    groups.flatMap((group) =>
      group.hooks.map((hook) => {
        expect(hook.type).toBe("command");
        const match = /^node "\$\{CLAUDE_PLUGIN_ROOT\}\/(bundle\/[^" ]+\.js)"$/.exec(hook.command);
        expect(match, hook.command).not.toBeNull();
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
        expect(hookBundles(pluginRoot)).not.toContain("bundle/gateway.js");
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
    for (const name of ["setup", "disable"]) {
      const command = readFileSync(join(gatewayRoot, "commands", `${name}.md`), "utf8");
      const [, frontmatter, body] = command.split("---\n");
      expect(frontmatter.trim().split("\n")).toEqual([
        `description: ${name === "setup" ? "Enable" : "Disable"} gateway settings deterministically for an explicit scope`,
        name === "setup"
          ? `argument-hint: "--scope global|project [--use-claude-subscription] [--profile name] [--api-url HTTPS_ORIGIN --gateway-url HTTPS_ORIGIN] [--cli /absolute/path --port 43127]"`
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
            "43128",
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
                  apiUrl: "https://api.preview.test",
                  gatewayUrl: "https://gateway.preview.test",
                  cli: process.execPath,
                  profile: "private-profile",
                  port: 43127,
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
        const invocations = [
          ["setup"],
          ["setup", process.execPath, "private-argument", "43127"],
          ["setup", "--yes", "--scope", "global", "--profile", "private-argument"],
          ["launch"],
          ["launch", "--print", "private-argument"],
          ["unknown-private-argument"],
          ["--help"],
          ["enable"],
          ["enable", process.execPath, "private-argument", "43127"],
          ["enable", "--yes", "--scope", "global", "--unknown", "private-argument"],
          ["enable", "--yes", "--scope", "global", "--no-use-claude-subscription"],
          ["enable", "--yes", "--scope", "global", "--use-claude-subscription=false"],
          ["disable"],
          ["disable", "--yes", "--scope", "global", "private-argument"],
        ];
        for (const args of invocations) {
          const result = spawnSync(
            process.execPath,
            ["--require", guard, join(installed, "bundle/gateway.js"), ...args],
            {
              cwd: sandbox,
              env: { HOME: "/must-not-use-env-home", PATH: "", CLAUDE_PLUGIN_ROOT: installed },
              encoding: "utf8",
              timeout: 5000,
            },
          );
          expect(result.error, args.join(" ")).toBeUndefined();
          expect(result.status, result.stderr).toBe(1);
          expect(result.stdout).toBe("");
          const guidance =
            "Use /langsmith-gateway:setup --scope global|project or /langsmith-gateway:disable --scope global|project within Claude Code.\n";
          expect(result.stderr).toBe(
            args[0] === "disable"
              ? guidance
              : args[0] === "enable" && args[1] !== "--yes"
                ? "Explicit invocation required. " + guidance
                : guidance,
          );
        }
        for (const prompt of [
          "/langsmith-gateway:setup",
          "/langsmith-gateway:setup --scope global --scope project",
          "/langsmith-gateway:setup --scope global --use-claude-subscription --no-use-claude-subscription",
          "/langsmith-gateway:setup --scope global --no-use-claude-subscription",
          "/langsmith-gateway:setup --scope global --use-claude-subscription=false",
          "/langsmith-gateway:setup --scope global; echo secret",
          "/langsmith-gateway:disable --scope global --yes",
        ]) {
          const result = spawnSync(
            process.execPath,
            ["--require", guard, join(installed, "bundle/gateway.js")],
            {
              cwd: sandbox,
              env: { PATH: "", HOME: "/not-trusted" },
              encoding: "utf8",
              timeout: 5000,
              input: JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt, cwd: sandbox }),
            },
          );
          expect(result.status, result.stderr).toBe(0);
          expect(result.stderr).toBe("");
          expect(JSON.parse(result.stdout)).toEqual({
            decision: "block",
            reason: expect.stringContaining("within Claude Code"),
          });
        }
        // The same packaged runtime has one read-only pre-consent exception.
        // Permit safe config reads only; keep writes, network and processes fatal.
        const planGuard = join(sandbox, "plan-guard.cjs");
        writeFileSync(
          planGuard,
          readFileSync(guard, "utf8")
            .replace(
              '!String(path).startsWith(home) && (flags === "r" || flags === 0)',
              '(flags === "r" || (typeof flags === "number" && (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC)) === 0))',
            )
            .replace(
              "String(path).startsWith(home) ? deny() : original(path, ...args)",
              'String(path).endsWith("settings.json") || String(path).includes("settings-ownership") ? deny() : original(path, ...args)',
            ),
        );
        for (const options of [
          ["--scope", "global"],
          [
            "--scope",
            "global",
            "--profile",
            "explicit",
            "--api-url",
            "https://api.other.test/",
            "--gateway-url",
            "https://gateway.other.test/",
          ],
        ]) {
          const result = spawnSync(
            process.execPath,
            ["--require", planGuard, join(installed, "bundle/gateway.js"), "plan", ...options],
            {
              cwd: sandbox,
              env: { HOME: "/must-not-use-env-home", PATH: "" },
              encoding: "utf8",
              timeout: 5000,
            },
          );
          expect(result.error).toBeUndefined();
          if (state === "malformed") {
            expect(result.status).toBe(1);
            expect(result.stdout).toBe("");
            expect(result.stderr).not.toContain("invalid-private-config");
            expect(result.stderr).not.toContain("FORBIDDEN");
          } else {
            expect(result.status, result.stderr).toBe(0);
            expect(result.stderr).toBe("");
            const retained = ["enabled", "retained-disabled"].includes(state);
            expect(JSON.parse(result.stdout)).toEqual({
              apiUrl:
                options.length > 2
                  ? "https://api.other.test"
                  : retained
                    ? "https://api.preview.test"
                    : "https://api.smith.langchain.com",
              gatewayUrl:
                options.length > 2
                  ? "https://gateway.other.test"
                  : retained
                    ? "https://gateway.preview.test"
                    : "https://gateway.smith.langchain.com",
              profile:
                options.length > 2 ? "explicit" : retained ? "private-profile" : "claude-gateway",
              useClaudeSubscription: false,
              port: 43127,
              status: state === "enabled" ? "enabled" : retained ? "disabled" : "missing",
            });
            expect(result.stdout).not.toContain("b".repeat(64));
            expect(result.stdout).not.toContain(process.execPath);
            expect(result.stdout).not.toContain("X-Private");
          }
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
    const sandbox = mkdtempSync(join(tmpdir(), "langsmith-enable-package-"));
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
      const invoke = (args: string[]) =>
        promisify(execFile)(
          process.execPath,
          ["--require", guard, join(installed, "bundle/gateway.js"), ...args],
          {
            cwd: sandbox,
            env: { HOME: "/must-not-use-env-home", PATH: "" },
            timeout: 5000,
          },
        );
      for (let i = 0; i < 2; i++) {
        const started = performance.now();
        const result = await invoke(["enable", "--yes", "--scope", "global"]);
        expect(performance.now() - started).toBeLessThan(2000);
        expect(result.stderr).toContain("Authentication is checked on the first model request");
        expect(result.stderr).not.toContain("daemon was verified");
        expect(token).not.toHaveBeenCalled();
        expect(result.stdout).toBe("");
        expect(result.stderr).toBe(
          (i === 0
            ? "Gateway settings saved for the selected scope; "
            : "Gateway settings already configured for the selected scope; ") +
            "OAuth-only gateway auth; native credentials are not forwarded. Gateway provider keys and provider billing apply. local proxy healthy. Authentication is checked on the first model request, not during setup; deployment compatibility is not verified." +
            (i === 0 ? " Restart Claude to apply the settings." : "") +
            " Use /langsmith-gateway:disable --scope global|project to undo owned settings.\n",
        );
        expect(result.stderr).not.toContain(config.secret);
        expect(result.stderr).not.toContain("e30.");
        expect(json(settings).env.ANTHROPIC_BASE_URL).toBe(`http://127.0.0.1:${config.port}`);
        expect(json(settings).env.ANTHROPIC_CUSTOM_HEADERS).toBe(
          `X-Test: keep\nX-LangSmith-Proxy-Key: ${config.secret}`,
        );
      }
      expect(controls).toEqual(["GET /_langsmith/health", "GET /_langsmith/health"]);
      const hookResult = await new Promise<{ stdout: string; stderr: string }>(
        (resolve, reject) => {
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
              prompt: "/langsmith-gateway:setup --scope global",
              cwd: sandbox,
            }),
          );
        },
      );
      expect(JSON.parse(hookResult.stdout)).toEqual({
        decision: "block",
        reason:
          "Gateway settings already configured for the selected scope; OAuth-only gateway auth; native credentials are not forwarded. Gateway provider keys and provider billing apply. local daemon healthy. Authentication is checked on the first model request, not setup.",
      });
      expect(hookResult.stderr).toBe("");
      expect(token).not.toHaveBeenCalled();

      const result = await invoke(["disable", "--yes", "--scope", "global"]);
      expect(result.stderr).toContain("Gateway disabled");
      expect(result.stderr).not.toContain(config.secret);
      expect(json(settings)).toEqual({
        model: "keep",
        env: { ANTHROPIC_CUSTOM_HEADERS: "X-Test: keep" },
      });
      expect(json(join(dir, "config.json"))).toEqual({
        ...config,
        ...endpoints(config),
        enabled: false,
      });
      try {
        await invoke(["enable"]);
        throw new Error("Expected refusal");
      } catch (error) {
        expect((error as { stderr: string }).stderr).toContain("within Claude Code");
        expect((error as { stderr: string }).stderr).not.toContain(config.secret);
      }
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
      writeFileSync(join(configDir, "config.json"), '{"enabled":false}', { mode: 0o600 });
      const guard = join(sandbox, "guard.cjs");
      // HOME alone is NOT isolation: production uses os.userInfo().homedir.
      // Redirect that builtin before loading ESM; deny effects even on regression.
      writeFileSync(
        guard,
        `
const os = require("node:os");
os.userInfo = () => ({ homedir: ${JSON.stringify(home)} });
const deny = () => { throw new Error("Forbidden effect in disabled package test"); };
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
      for (const hook_event_name of events) {
        const result = spawnSync(process.execPath, ["--require", guard, artifact], {
          cwd: sandbox,
          env: { HOME: home, PATH: "", CLAUDE_PLUGIN_ROOT: installed },
          input: JSON.stringify({
            hook_event_name,
            session_id: "isolated-package-test",
            cwd: sandbox,
          }),
          encoding: "utf8",
          timeout: 5000,
        });
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(0);
        expect(result.stdout).toBe("");
        expect(result.stderr).toBe("");
      }
      expect(readdirSync(configDir)).toEqual(["config.json"]);
      expect(readFileSync(join(configDir, "config.json"), "utf8")).toBe('{"enabled":false}');
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});

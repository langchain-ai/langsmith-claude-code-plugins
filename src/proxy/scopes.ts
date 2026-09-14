import { realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { configDir, type ProxyConfig } from "./config.js";
import { directory, snapshot } from "./files.js";
import { SetupError, type SetupOptions } from "./options.js";

export function targetPaths(home: string, scope: SetupOptions["scope"], cwd: string) {
  if (scope === "global")
    return {
      settings: join(home, ".claude/settings.json"),
      config: join(configDir(home), "config.json"),
    };
  if (!cwd || !cwd.startsWith("/"))
    throw new SetupError("Project scope requires an absolute hook cwd.");
  const root = realpathSync(cwd);
  // Reject links in the supplied project path, not just the final file.
  if (resolve(cwd) !== root)
    throw new SetupError("Project path must be canonical and not a symlink.");
  directory(root);
  const settings = join(root, ".claude/settings.local.json");
  return {
    settings,
    config: join(configDir(home), "config.json"),
  };
}

// Fail closed in repositories: ignored is not enough if already tracked. Never
// modify .gitignore or stage files on the user's behalf.
export function secretGitCheck(path: string): void {
  const cwd = dirname(path);
  const run = (args: string[]) =>
    spawnSync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      timeout: 5000,
      env: {
        PATH: process.env.PATH,
        HOME: "/dev/null",
        LC_ALL: "C",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_OPTIONAL_LOCKS: "0",
      },
    });
  const repo = run(["rev-parse", "--is-inside-work-tree"]);
  if (repo.error)
    throw new SetupError("Cannot verify secrets are outside version control; git is required.");
  if (repo.status !== 0) {
    if (repo.status === 128 && repo.stderr.includes("not a git repository")) return;
    throw new SetupError("Cannot verify secret destination repository safety.");
  }
  const tracked = run(["ls-files", "--cached", "--", path]);
  const ignored = run(["check-ignore", "--no-index", "--quiet", "--", path]);
  if (tracked.status !== 0 || tracked.stdout.trim() || ignored.status !== 0)
    throw new SetupError(
      `Secret destination ${JSON.stringify(path)} is tracked or not git-ignored. Untrack and privately ignore it before setup; nothing was written there.`,
    );
}

export const BASE = "ANTHROPIC_BASE_URL";
export const HEADERS = "ANTHROPIC_CUSTOM_HEADERS";
export const proxyKeyLine = (config: ProxyConfig) => `X-LangSmith-Proxy-Key: ${config.secret}`;

// These snapshots are routing observations, not authorization or restoration records.
// Never follow linked parent directories, including optional registered project paths.
export function routingSnapshot(path: string) {
  try {
    const root = dirname(dirname(path));
    if (realpathSync(root) !== root) throw new Error("Noncanonical routing target");
    directory(root);
    directory(dirname(path));
    return snapshot(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
export function unchangedRouting(path: string, saved: ReturnType<typeof snapshot>): void {
  if (JSON.stringify(routingSnapshot(path)) !== JSON.stringify(saved))
    throw new Error("Settings changed concurrently; retry");
}
export function routingEnv(saved: ReturnType<typeof snapshot>): Record<string, unknown> {
  const value = saved ? JSON.parse(saved.text) : {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid settings");
  const env = value.env === undefined ? {} : value.env;
  if (!env || typeof env !== "object" || Array.isArray(env)) throw new Error("Invalid settings");
  return env;
}
export function matchesRouting(env: Record<string, unknown>, config: ProxyConfig): boolean {
  const headers = env[HEADERS];
  return (
    env[BASE] === `http://127.0.0.1:${config.port}` &&
    typeof headers === "string" &&
    headers.split("\n").filter((line) => /^\s*x-langsmith-proxy-key\s*:/i.test(line)).length ===
      1 &&
    headers.split("\n").includes(proxyKeyLine(config))
  );
}

// Optional config bookkeeping lets explicit commands discover other plugin-created
// scopes. Disk routing, not list membership, determines whether a target is active.
export function routingTargets(home: string, cwd: string, config?: ProxyConfig) {
  const paths = new Set([
    targetPaths(home, "global", cwd).settings,
    ...(config?.settingsTargets ?? []),
  ]);
  if (cwd) paths.add(targetPaths(home, "project", cwd).settings);
  return [...paths].map((path) => ({ path, saved: routingSnapshot(path) }));
}

// Only private OS-home config selects executable, endpoints, mode and secret.
// Claude settings merely signal routing to that configured loopback listener.
// Hooks are read-only and work with externally provisioned, receipt-free settings.
export function configuredScope(
  home: string,
  cwd: string | undefined,
  config: ProxyConfig,
): boolean {
  let env = routingEnv(routingSnapshot(targetPaths(home, "global", "").settings));
  if (cwd) {
    const local = targetPaths(home, "project", cwd).settings;
    env = {
      ...env,
      ...routingEnv(routingSnapshot(join(dirname(local), "settings.json"))),
      ...routingEnv(routingSnapshot(local)),
    };
  }
  return matchesRouting(env, config);
}

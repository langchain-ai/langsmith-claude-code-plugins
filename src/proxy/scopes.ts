import { realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
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

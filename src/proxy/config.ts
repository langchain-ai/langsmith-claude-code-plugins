import { lstatSync } from "node:fs";
import { isAbsolute, join, normalize } from "node:path";
import { userInfo } from "node:os";
import { directories, snapshot } from "./files.js";

export class ConfigError extends Error {}
export const CONFIG_UPDATE_GUIDANCE =
  "Invalid proxy configuration. A one-time private config update is required: use the full current schema with explicit enabled and useClaudeSubscription booleans, including when disabled. Retain your existing local key, CLI, profile, port and endpoints; review LOCAL_PROXY.md privately. Do not paste secrets or delete/reset configuration.";

export const API_URL = "https://api.smith.langchain.com";
export const UPSTREAM = "https://gateway.smith.langchain.com";
export const KEY_HEADER = "x-langsmith-proxy-key";
export const userHome = () => userInfo().homedir;
export const configDir = (home = userHome()) => join(home, ".claude", "langsmith-proxy");
export interface ProxyConfig {
  enabled: boolean;
  useClaudeSubscription: boolean;
  cli: string;
  profile: string;
  port: number;
  secret: string;
  // Optional discovery index only; never credentials, previous values or authorization.
  settingsTargets?: string[];
  apiUrl?: string;
  gatewayUrl?: string;
}

// Explicit, operator-approved public DNS origins only. Validate the raw spelling
// before WHATWG URL normalization can erase paths, credentials or empty delimiters.
export function httpsOrigin(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    /\s/.test(value) ||
    !/^https:\/\/[a-zA-Z0-9.-]+(?::[0-9]{1,5})?\/?$/.test(value)
  )
    throw new Error(
      "Endpoints must be HTTPS DNS origins without credentials, path, query or fragment",
    );
  const url = new URL(value);
  const host = url.hostname;
  const labels = host.split(".");
  if (
    host.length > 253 ||
    labels.length < 2 ||
    labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
    !/^[a-z][a-z0-9-]*$/.test(labels.at(-1)!) ||
    /(?:^|\.)(?:localhost|local|internal|home|lan)$/.test(host) ||
    (url.port !== "" && (Number(url.port) < 1 || Number(url.port) > 65535))
  )
    throw new Error("Endpoints must use public DNS names and HTTPS ports 1-65535");
  return url.origin;
}

export function endpoints(c: { apiUrl?: unknown; gatewayUrl?: unknown }): {
  apiUrl: string;
  gatewayUrl: string;
} {
  if ((c.apiUrl === undefined) !== (c.gatewayUrl === undefined))
    throw new Error("Supply both --api-url and --gateway-url; no implicit production endpoint");
  return {
    apiUrl: httpsOrigin(c.apiUrl === undefined ? API_URL : c.apiUrl),
    gatewayUrl: httpsOrigin(c.gatewayUrl === undefined ? UPSTREAM : c.gatewayUrl),
  };
}

export function privatePath(path: string, directory = false): void {
  const s = lstatSync(path);
  if (
    s.uid !== process.getuid?.() ||
    (s.mode & 0o077) !== 0 ||
    (directory ? !s.isDirectory() : !s.isFile())
  )
    throw new Error("Unsafe proxy configuration");
}

// Never consult cwd, tracing configuration, or environment overrides.
// Validate the full schema even when disabled; preserve its saved enabled state.
export function loadConfig(home = userHome(), includeDisabled = false): ProxyConfig | undefined {
  let saved;
  try {
    directories(home);
    privatePath(configDir(home), true);
    saved = snapshot(join(configDir(home), "config.json"), true);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
    if (e instanceof Error && e.message === "Unsafe settings file")
      throw new Error("Unsafe proxy configuration");
    throw e;
  }
  if (!saved) return;
  const c: ProxyConfig = JSON.parse(saved.text);
  if (
    !c ||
    typeof c.enabled !== "boolean" ||
    typeof c.useClaudeSubscription !== "boolean" ||
    typeof c.cli !== "string" ||
    !isAbsolute(c.cli) ||
    typeof c.profile !== "string" ||
    !/^[a-zA-Z0-9_.-]{1,128}$/.test(c.profile) ||
    !Number.isInteger(c.port) ||
    c.port < 1024 ||
    c.port > 65535 ||
    typeof c.secret !== "string" ||
    !/^[a-f0-9]{64}$/.test(c.secret) ||
    (c.settingsTargets !== undefined &&
      (!Array.isArray(c.settingsTargets) ||
        c.settingsTargets.length > 128 ||
        c.settingsTargets.some(
          (path) =>
            typeof path !== "string" ||
            path.length > 4096 ||
            !isAbsolute(path) ||
            normalize(path) !== path ||
            path.includes("\0") ||
            !/\/\.claude\/settings(?:\.local)?\.json$/.test(path),
        ))) ||
    Object.keys(c).some(
      (k) =>
        ![
          "enabled",
          "settingsTargets",
          "cli",
          "profile",
          "port",
          "secret",
          "apiUrl",
          "gatewayUrl",
          "useClaudeSubscription",
        ].includes(k),
    )
  )
    throw new ConfigError(CONFIG_UPDATE_GUIDANCE);
  let selected: ReturnType<typeof endpoints>;
  try {
    selected = endpoints(c);
  } catch {
    throw new ConfigError(CONFIG_UPDATE_GUIDANCE);
  }
  if (!c.enabled && !includeDisabled) return;
  return { ...c, ...selected };
}

// One validated private disk read, including retained disabled configuration.
export function configStatus(home = userHome()): {
  state: "not configured" | "enabled" | "disabled";
  config?: ProxyConfig;
} {
  const config = loadConfig(home, true);
  return {
    state: config === undefined ? "not configured" : config.enabled ? "enabled" : "disabled",
    config,
  };
}

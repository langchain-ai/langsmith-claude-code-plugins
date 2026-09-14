import { constants, openSync, closeSync, fstatSync, readFileSync, lstatSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { userInfo } from "node:os";
import { directories } from "./files.js";

export const API_URL = "https://api.smith.langchain.com";
export const UPSTREAM = "https://gateway.smith.langchain.com";
export const KEY_HEADER = "x-langsmith-proxy-key";
export const userHome = () => userInfo().homedir;
export const configDir = (home = userHome()) => join(home, ".claude", "langsmith-proxy");
export interface ProxyConfig {
  enabled: true;
  useClaudeSubscription: boolean;
  cli: string;
  profile: string;
  port: number;
  secret: string;
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
export function loadConfig(home = userHome(), includeDisabled = false): ProxyConfig | undefined {
  const dir = configDir(home);
  try {
    directories(home);
    privatePath(dir, true);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
    throw e;
  }
  const path = join(dir, "config.json");
  let fd: number;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
    throw e;
  }
  let c: ProxyConfig;
  try {
    const s = fstatSync(fd);
    if (
      !s.isFile() ||
      s.nlink !== 1 ||
      s.uid !== process.getuid?.() ||
      s.mode & 0o077 ||
      s.size > 8192
    )
      throw new Error("Unsafe proxy configuration");
    c = JSON.parse(readFileSync(fd, "utf8"));
  } finally {
    closeSync(fd);
  }
  if (c && (c as { enabled: unknown }).enabled === false) {
    if (!includeDisabled || Object.keys(c).length === 1) return;
    c = { ...c, enabled: true }; // Validate retained configuration for explicit re-enable.
  }
  if (
    !c ||
    c.enabled !== true ||
    (c.useClaudeSubscription !== undefined && typeof c.useClaudeSubscription !== "boolean") ||
    typeof c.cli !== "string" ||
    !isAbsolute(c.cli) ||
    typeof c.profile !== "string" ||
    !/^[a-zA-Z0-9_.-]{1,128}$/.test(c.profile) ||
    !Number.isInteger(c.port) ||
    c.port < 1024 ||
    c.port > 65535 ||
    typeof c.secret !== "string" ||
    !/^[a-f0-9]{64}$/.test(c.secret) ||
    Object.keys(c).some(
      (k) =>
        ![
          "enabled",
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
    throw new Error("Invalid proxy configuration");
  // Existing pre-field configs always forwarded native auth. Only disk reads
  // migrate missing fields to true; fresh creation writes an explicit false.
  return { ...c, ...endpoints(c), useClaudeSubscription: c.useClaudeSubscription ?? true };
}

import { lstatSync } from "node:fs";
import { join } from "node:path";
import { userInfo } from "node:os";
import { directories, snapshot } from "./files.js";
import {
  API_URL,
  CONFIG_UPDATE_GUIDANCE,
  ORIGIN_DNS_GUIDANCE,
  ORIGIN_SHAPE_GUIDANCE,
  UPSTREAM,
} from "./proxy-constants.js";
import { isSavedConfig, publicDnsOrigin, wellFormedOrigin } from "./config-validation.js";
import type { Endpoints, ProxyConfig } from "./proxy-models.js";

export class ConfigError extends Error {}
export const userHome = () => userInfo().homedir;
export const configDir = (home = userHome()) => join(home, ".claude", "langsmith-proxy");

// Explicit, operator-approved public DNS origins only. Validate the raw spelling
// before WHATWG URL normalization can erase paths, credentials or empty delimiters.
export function httpsOrigin(value: unknown): string {
  if (!wellFormedOrigin(value)) throw new Error(ORIGIN_SHAPE_GUIDANCE);
  const url = new URL(value);
  if (!publicDnsOrigin(url)) throw new Error(ORIGIN_DNS_GUIDANCE);
  return url.origin;
}

export function endpoints(c: { apiUrl?: unknown; gatewayUrl?: unknown }): Endpoints {
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
  if (!c || !isSavedConfig(c)) throw new ConfigError(CONFIG_UPDATE_GUIDANCE);
  let selected: Endpoints;
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

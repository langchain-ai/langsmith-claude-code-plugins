/**
 * Shared hook startup utilities.
 */

import { loadConfig } from "../config.js";
import type { Config } from "../types.js";
import { initLogger, error } from "../logger.js";
import { hasUsableDestination } from "./replicas.js";

/**
 * Standard hook startup: load config, init logger, check kill-switch and credentials.
 * Returns the Config if tracing should proceed, null if the hook should exit early.
 *
 * Pass the hook input's `cwd` so repo/git metadata and the `cwd` contract key
 * reflect the working directory Claude Code is operating in.
 */
export function initHook(cwd?: string): Config | null {
  const config = loadConfig({ cwd });
  initLogger(config.debug);

  if (!config.enabled) {
    return null;
  }

  if (!hasUsableDestination(config)) {
    error(config.credentialProblem!);
    return null;
  }

  return config;
}

/** Expand a leading `~` to the user's home directory. */
export function expandHome(path: string | undefined): string | undefined {
  return path?.replace(/^~/, process.env.HOME ?? "");
}

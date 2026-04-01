/**
 * Shared hook startup utilities.
 */

import { loadConfig, type Config } from "../config.js";
import { initLogger, error } from "../logger.js";

/**
 * Standard hook startup: load config, init logger, check kill-switch and API key.
 * Returns the Config if tracing should proceed, null if the hook should exit early.
 */
export function initHook(): Config | null {
  const config = loadConfig();
  initLogger(config.debug);

  if (process.env.TRACE_TO_LANGSMITH?.toLowerCase() !== "true") {
    return null;
  }

  if (!config.apiKey) {
    error("No API key set (CC_LANGSMITH_API_KEY or LANGSMITH_API_KEY)");
    return null;
  }

  return config;
}

/** Expand a leading `~` to the user's home directory. */
export function expandHome(path: string | undefined): string | undefined {
  return path?.replace(/^~/, process.env.HOME ?? "");
}

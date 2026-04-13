import type { RunTreeConfig } from "langsmith";
import { error } from "./logger.js";

/**
 * Configuration — reads from environment variables.
 */

export interface Config {
  apiKey: string;
  project: string;
  apiBaseUrl: string;
  stateFilePath: string;
  debug: boolean;
  /** Dotted-order string of an existing LangSmith run to nest all traces under. */
  parentDottedOrder?: string;
  replicas?: RunTreeConfig["replicas"];
  /** Custom metadata to attach to root turn runs (parsed from CC_LANGSMITH_METADATA). */
  customMetadata?: Record<string, unknown>;
}

export function loadConfig(): Config {
  const apiKey = process.env.CC_LANGSMITH_API_KEY ?? process.env.LANGSMITH_API_KEY ?? "";

  const project = process.env.CC_LANGSMITH_PROJECT ?? "claude-code";

  const apiBaseUrl = process.env.LANGSMITH_ENDPOINT ?? "https://api.smith.langchain.com";

  const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
  const stateFilePath = process.env.STATE_FILE ?? `${homeDir}/.claude/state/langsmith_state.json`;

  const debug = (process.env.CC_LANGSMITH_DEBUG ?? "").toLowerCase() === "true";

  let replicas;
  const providedReplicas = process.env.CC_LANGSMITH_RUNS_ENDPOINTS;
  if (providedReplicas !== undefined) {
    try {
      replicas = JSON.parse(providedReplicas);
    } catch {
      error(
        "Failed to parse provided CC_LANGSMITH_RUNS_ENDPOINTS. Please make sure they are valid JSON.",
      );
    }
  }

  const parentDottedOrder = process.env.CC_LANGSMITH_PARENT_DOTTED_ORDER || undefined;

  let customMetadata: Record<string, unknown> | undefined;
  const providedMetadata = process.env.CC_LANGSMITH_METADATA;
  if (providedMetadata !== undefined) {
    try {
      const parsed = JSON.parse(providedMetadata);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        customMetadata = parsed;
      } else {
        error("CC_LANGSMITH_METADATA must be a JSON object (not an array or primitive).");
      }
    } catch {
      error("Failed to parse provided CC_LANGSMITH_METADATA. Please make sure it is valid JSON.");
    }
  }

  return {
    apiKey,
    project,
    apiBaseUrl,
    stateFilePath,
    debug,
    parentDottedOrder,
    replicas,
    customMetadata,
  };
}

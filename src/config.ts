import { readFileSync } from "node:fs";
import { userInfo } from "node:os";
import { join } from "node:path";
import type { RunTreeConfig } from "langsmith";
import { debug, error } from "./logger.js";

/**
 * Configuration — reads from environment variables.
 */

/**
 * Read the Anthropic user ID from `~/.claude.json` if available.
 *
 * Claude Code stores a stable per-installation hashed user identifier as
 * `userID` in the user's `~/.claude.json` config file. Returns `undefined`
 * if the file doesn't exist, can't be parsed, or doesn't contain a userID.
 */
export function readAnthropicUserId(): string | undefined {
  const homeDir = process.env.HOME ?? process.env.USERPROFILE;
  if (!homeDir) return undefined;

  const configPath = join(homeDir, ".claude.json");
  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    const userId = parsed?.userID;
    if (typeof userId === "string" && userId.length > 0) {
      return userId;
    }
  } catch (err) {
    // File missing or unreadable — non-fatal, just skip.
    debug(`Could not read Anthropic user ID from ${configPath}: ${err}`);
  }
  return undefined;
}

/** Read the local OS username via `os.userInfo()`. */
export function readLocalUsername(): string {
  return userInfo().username;
}

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

  // Attach identity metadata so every traced run can be attributed to a
  // specific Claude Code installation and local OS user. User-supplied
  // metadata wins on key collision.
  const anthropicUserId = readAnthropicUserId();
  const localUsername = readLocalUsername();
  const identityMetadata: Record<string, unknown> = { local_username: localUsername };
  if (anthropicUserId) {
    identityMetadata.anthropic_user_id = anthropicUserId;
  }
  customMetadata = { ...identityMetadata, ...customMetadata };

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

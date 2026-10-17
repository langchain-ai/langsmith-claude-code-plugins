import { readFileSync } from "node:fs";
import {
  mergeCommonConfig,
  readCommonConfigFiles,
  toSdkReplicas,
} from "@langchain/plugins-base/settings";
import { homedir, userInfo } from "node:os";
import { join } from "node:path";
import type { RunTreeConfig } from "langsmith";
import type { StringNodeRule } from "langsmith/anonymizer";
import { debug, error } from "./logger.js";
import {
  REPOSITORY_METADATA_KEYS,
  withBothGitMetadataNames,
} from "@langchain/plugins-base/metadata";
import {
  BOOLEAN_SETTINGS,
  NO_PINNED_KEYS,
  PINNED_REPOSITORY_KEYS,
  STATE_FILE_DEFAULT,
} from "./constants.js";
import type { BooleanSetting, Config, MetadataWithPins } from "./types.js";

/**
 * Configuration — existing Claude environment discovery plus the shared langsmith-plugins.json contract.
 */

/**
 * Read the Anthropic user ID from `~/.claude.json` if available.
 *
 * Claude Code stores a stable per-installation hashed user identifier as
 * `userID` in the user's `~/.claude.json` config file. Returns `undefined`
 * if the file doesn't exist, can't be parsed, or doesn't contain a userID.
 */
function readAnthropicUserId(): string | undefined {
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
function readLocalUsername(): string {
  return userInfo().username;
}

export function pinnedRepositoryKeys(
  metadata: Record<string, unknown> | undefined,
): ReadonlySet<string> {
  return (metadata as MetadataWithPins | undefined)?.[PINNED_REPOSITORY_KEYS] ?? NO_PINNED_KEYS;
}

/** Preserve Claude environment boolean parsing; the shared helper receives parsed values. */
function envBoolean(field: BooleanSetting): boolean | undefined {
  const setting = BOOLEAN_SETTINGS[field];
  const env = process.env[setting.env]?.toLowerCase();
  if (env === undefined) return undefined;
  if (env === "true") return true;
  if (env === "false") return false;
  return setting.restrictive;
}

export function resolveStateFilePath(): string {
  return process.env.STATE_FILE ?? join(homedir(), ...STATE_FILE_DEFAULT);
}

export function loadConfig(options?: { cwd?: string }): Config {
  const cwd = options?.cwd ?? process.cwd();
  const homeDir = homedir();
  const stateFilePath = resolveStateFilePath();

  const debug = (process.env.CC_LANGSMITH_DEBUG ?? "").toLowerCase() === "true";

  let replicas: RunTreeConfig["replicas"];
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

  // Secret redaction is on by default; disable with a falsy CC_LANGSMITH_REDACT
  // value (false/0/no/off). Normalized to match the codex plugin's parsing.
  const redactEnv = (process.env.CC_LANGSMITH_REDACT ?? "").trim().toLowerCase();
  const redact = !["0", "false", "no", "off"].includes(redactEnv);

  // Optional user-supplied redaction rules: JSON array of { pattern, replace }.
  // `pattern` is a string (compiled with the global flag by the SDK anonymizer).
  let redactExtraRules: StringNodeRule[] | undefined;
  const providedExtra = process.env.CC_LANGSMITH_REDACT_EXTRA;
  if (providedExtra !== undefined) {
    try {
      const parsed = JSON.parse(providedExtra);
      if (!Array.isArray(parsed)) {
        error("CC_LANGSMITH_REDACT_EXTRA must be a JSON array of { pattern, replace }.");
      } else {
        // Validate each rule's shape and compile its pattern here, so a malformed
        // rule surfaces as a logged error instead of throwing inside
        // createSecretAnonymizer — which would break tracing for the whole session.
        const validRules: StringNodeRule[] = [];
        for (const rule of parsed) {
          if (
            typeof rule !== "object" ||
            rule === null ||
            typeof rule.pattern !== "string" ||
            (rule.replace !== undefined && typeof rule.replace !== "string")
          ) {
            error(
              `Skipping invalid CC_LANGSMITH_REDACT_EXTRA rule (expected { pattern: string, replace?: string }): ${JSON.stringify(rule)}`,
            );
            continue;
          }
          try {
            // Surface invalid regex patterns here rather than at anonymizer build time.
            new RegExp(rule.pattern);
          } catch {
            error(
              `Skipping CC_LANGSMITH_REDACT_EXTRA rule with an invalid regex pattern: ${rule.pattern}`,
            );
            continue;
          }
          validRules.push(rule);
        }
        if (validRules.length > 0 || parsed.length === 0) redactExtraRules = validRules;
      }
    } catch {
      error("Failed to parse CC_LANGSMITH_REDACT_EXTRA. Please make sure it is valid JSON.");
    }
  }

  const files = readCommonConfigFiles({ cwd, home: homeDir, harnessDirectory: ".claude" });
  const common = mergeCommonConfig(
    {
      harness: files.harness.common,
      root: files.root.common,
      user: files.user.common,
      userRoot: files.userRoot.common,
      env: {
        enabled: envBoolean("enabled"),
        defaultMuted: envBoolean("defaultMuted"),
        api_key: process.env.CC_LANGSMITH_API_KEY ?? process.env.LANGSMITH_API_KEY,
        api_url: process.env.LANGSMITH_ENDPOINT,
        project: process.env.CC_LANGSMITH_PROJECT,
        metadata: customMetadata,
        redact: process.env.CC_LANGSMITH_REDACT === undefined ? undefined : redact,
        // Environment rules retain the existing tolerant parser.
      },
      defaults: { api_key: "", api_url: "https://api.smith.langchain.com", project: "claude-code" },
    },
    { envFirst: true },
  );
  // Environment replicas retain their SDK format, including legacy tuples.
  if (replicas === undefined) replicas = toSdkReplicas(common.replicas);
  redactExtraRules ??= common.redact_extra_rules;
  customMetadata = common.metadata && withBothGitMetadataNames(common.metadata);

  // Attach identity metadata so every traced run can be attributed to a
  // specific Claude Code installation and local OS user. User-supplied
  // metadata wins on key collision.
  const anthropicUserId = readAnthropicUserId();
  const localUsername = readLocalUsername();
  const identityMetadata: Record<string, unknown> = { local_username: localUsername };
  if (anthropicUserId) {
    // Standardized coding-agent-v1 key (preferred over local_username)...
    identityMetadata.user_id = anthropicUserId;
    // ...and the original key, kept as a DEPRECATED compat alias (≥1 release).
    identityMetadata.anthropic_user_id = anthropicUserId;
  }

  const pinned = REPOSITORY_METADATA_KEYS.filter((key) => customMetadata?.[key] !== undefined);
  customMetadata = { cwd, ...identityMetadata, ...customMetadata };
  // Carried privately so per-tool attribution can leave these alone; spreading drops it.
  Object.defineProperty(customMetadata, PINNED_REPOSITORY_KEYS, { value: new Set<string>(pinned) });

  return {
    enabled: common.enabled,
    defaultMuted: common.defaultMuted,
    apiKey: common.api_key!,
    project: common.project!,
    apiBaseUrl: common.api_url!,
    stateFilePath,
    debug,
    parentDottedOrder,
    replicas,
    customMetadata,
    redact: common.redact,
    redactExtraRules,
  };
}

import { readFileSync } from "node:fs";
import { userInfo } from "node:os";
import { join } from "node:path";
import type { RunTreeConfig } from "langsmith";
import type { StringNodeRule } from "langsmith/anonymizer";
import { debug, error } from "./logger.js";
import { execSync } from "node:child_process";

/**
 * Configuration — reads from environment variables.
 */

/**
 * Plugin version, injected at build time by esbuild `define` (no runtime
 * package.json). `typeof` guards the non-bundled case; env is the fallback.
 */
declare const __LS_INTEGRATION_VERSION__: string;
export const LS_INTEGRATION_VERSION: string | undefined =
  typeof __LS_INTEGRATION_VERSION__ !== "undefined"
    ? __LS_INTEGRATION_VERSION__
    : process.env.CC_LANGSMITH_INTEGRATION_VERSION || undefined;

/** Host used to build a canonical https repository_url from a parsed provider. */
const PROVIDER_HOSTS: Record<string, string> = {
  github: "github.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
  devAzure: "dev.azure.com",
};

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
  /** Base metadata (static contract keys + user CC_LANGSMITH_METADATA) for every run. */
  customMetadata?: Record<string, unknown>;
  /** Whether to redact detected secrets from traced data before upload. */
  redact: boolean;
  /** Extra user-supplied redaction rules (parsed from CC_LANGSMITH_REDACT_EXTRA). */
  redactExtraRules?: StringNodeRule[];
}

/**
 * Extract repo name (owner/repo) from a git remote URL.
 * Supports HTTPS, SSH, and git@ URL formats for common hosts
 * (github.com, gitlab.com, bitbucket.org, etc.).
 */

const GIT_PROVIDERS_REGEX = {
  github: /[@/](?:github\.com)[:/](.+?)(?:\.git)?\s/,
  gitlab: /[@/](?:gitlab\.com)[:/](.+?)(?:\.git)?\s/,
  bitbucket: /[@/](?:bitbucket\.org)[:/](.+?)(?:\.git)?\s/,
  devAzure: /[@/](?:dev\.azure\.com)[:/](.+?)(?:\.git)?\s/,
};

export function parseRepoName(remoteUrl: string): { provider: string; name: string } | undefined {
  // Match git@host:owner/repo.git or ssh://git@host/owner/repo.git
  for (const [provider, regex] of Object.entries(GIT_PROVIDERS_REGEX)) {
    const match = remoteUrl.match(regex);
    if (match) return { provider, name: match[1] };
  }
  return undefined;
}

/**
 * Detect the git repo name from remotes in the given directory.
 * Gives precedence to "origin", then picks the first remote matching a known host.
 */
export function getRepoName(cwd: string): { provider: string; name: string } | undefined {
  try {
    const output = execSync("git remote -v", { cwd, encoding: "utf-8", timeout: 5000 });
    const lines = output.trim().split("\n").filter(Boolean);

    // Parse all remotes: [name, url, type]
    const remotes: Array<{ name: string; url: string }> = [];
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2 && line.includes("(fetch)")) {
        remotes.push({ name: parts[0], url: parts[1] });
      }
    }

    // Prefer "origin"
    const origin = remotes.find((r) => r.name === "origin");
    if (origin) {
      const name = parseRepoName(origin.url + " ");
      if (name) return name;
    }

    // Fall back to first remote that matches a known host
    for (const remote of remotes) {
      const name = parseRepoName(remote.url + " ");
      if (name) return name;
    }
  } catch {
    // Not a git repo or git not available — silently skip
  }
  return undefined;
}

/** Read the current git branch and commit SHA via the git CLI (omitted if absent). */
export function getGitInfo(cwd: string): { branch?: string; commit?: string } {
  const result: { branch?: string; commit?: string } = {};
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
    // "HEAD" means detached — no branch name available.
    if (branch && branch !== "HEAD") result.branch = branch;
  } catch {
    // Not a git repo / git unavailable — skip.
  }
  try {
    const commit = execSync("git rev-parse HEAD", { cwd, encoding: "utf-8", timeout: 5000 }).trim();
    if (commit) result.commit = commit;
  } catch {
    // Not a git repo / git unavailable — skip.
  }
  return result;
}

export function loadConfig(options?: { cwd?: string }): Config {
  const cwd = options?.cwd ?? process.cwd();
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
        if (validRules.length > 0) redactExtraRules = validRules;
      }
    } catch {
      error("Failed to parse CC_LANGSMITH_REDACT_EXTRA. Please make sure it is valid JSON.");
    }
  }

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

  // coding-agent-v1 static identity literals + versions, merged onto every run.
  const contractMetadata: Record<string, unknown> = {
    ls_agent_purpose: "coding",
    ls_integration: "claude-code",
    ls_agent_runtime: "Claude Code",
    ls_trace_schema_version: "coding-agent-v1",
    cwd,
  };
  if (LS_INTEGRATION_VERSION) {
    contractMetadata.ls_integration_version = LS_INTEGRATION_VERSION;
  }

  // Attach git repo metadata if available, to attribute runs to a specific codebase.
  const repoMetadata: Record<string, unknown> = {};
  const repoName = getRepoName(cwd);
  if (repoName != null) {
    repoMetadata.repository_name = repoName.name;
    repoMetadata.repository_provider = repoName.provider;
    const host = PROVIDER_HOSTS[repoName.provider];
    if (host) repoMetadata.repository_url = `https://${host}/${repoName.name}`;
  }
  const gitInfo = getGitInfo(cwd);
  if (gitInfo.branch) repoMetadata.git_branch = gitInfo.branch;
  if (gitInfo.commit) repoMetadata.git_commit_sha = gitInfo.commit;

  customMetadata = { ...contractMetadata, ...identityMetadata, ...repoMetadata, ...customMetadata };

  return {
    apiKey,
    project,
    apiBaseUrl,
    stateFilePath,
    debug,
    parentDottedOrder,
    replicas,
    customMetadata,
    redact,
    redactExtraRules,
  };
}

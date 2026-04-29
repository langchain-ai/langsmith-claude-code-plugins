import type { RunTreeConfig } from "langsmith";
import { error } from "./logger.js";
import { execSync } from "node:child_process";

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
    console.log("...", output);
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

  const repoName = getRepoName(cwd);
  if (repoName != null) {
    customMetadata ??= {};
    customMetadata.repository_name = repoName.name;
    customMetadata.repository_provider = repoName.provider;
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

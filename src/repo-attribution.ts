// A session started in a central folder works across several repositories, so its working
// directory says nothing about the repository a given tool call touched.

import { existsSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import {
  getGitUserName,
  getGitInfo,
  getRepoName,
  getRepoRoot,
  getRepoUrl,
  pinnedRepositoryKeys,
} from "./config.js";
import { GIT_DIRECTORY_NAME, REPOSITORY_METADATA_KEYS, TOOL_PATH_INPUT_KEYS } from "./constants.js";
import type { RepositoryAttribution, ToolPathLookup } from "./types.js";

const rootByDirectory = new Map<string, string | null | undefined>();
const attributionByRoot = new Map<string, RepositoryAttribution>();
const identifierByRoot = new Map<string, RepositoryAttribution>();

export function toolPathFromInput(toolInput: unknown, sessionCwd?: string): ToolPathLookup {
  if (!toolInput || typeof toolInput !== "object" || Array.isArray(toolInput)) {
    return { namedAPath: false };
  }
  const input = toolInput as Record<string, unknown>;
  let namedAPath = false;
  for (const key of TOOL_PATH_INPUT_KEYS) {
    const value = input[key];
    if (typeof value !== "string" || value.length === 0) continue;
    namedAPath = true;
    if (isAbsolute(value)) return { path: value, namedAPath };
    if (!sessionCwd || !isAbsolute(sessionCwd)) continue;
    const resolved = resolve(sessionCwd, value);
    if (existsSync(resolved)) return { path: resolved, namedAPath };
  }
  return { namedAPath };
}

function outsideGitDirectory(path: string): string {
  const nestedAt = path.indexOf(`${sep}.git${sep}`);
  if (nestedAt > 0) return path.slice(0, nestedAt);
  const trailing = `${sep}.git`;
  return path.endsWith(trailing) && path.length > trailing.length
    ? path.slice(0, -trailing.length)
    : path;
}

function nearestExistingDirectory(path: string): string | undefined {
  let current = outsideGitDirectory(path);
  for (;;) {
    const parent = dirname(current);
    const reachedFilesystemRoot = parent === current;
    if (reachedFilesystemRoot) return undefined;
    try {
      if (statSync(current).isDirectory()) return current;
    } catch {}
    current = parent;
  }
}

function rootFromGitMarker(directory: string): string | null | undefined {
  let current = resolve(directory);
  for (;;) {
    try {
      if (statSync(join(current, GIT_DIRECTORY_NAME)).isDirectory()) return current;
      return undefined;
    } catch {}
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function rootForPath(path: string): string | null | undefined {
  const directory = nearestExistingDirectory(path);
  if (!directory) return undefined;
  if (rootByDirectory.has(directory)) return rootByDirectory.get(directory);
  const marked = rootFromGitMarker(directory);
  const root = marked === undefined ? getRepoRoot(directory) : marked;
  rootByDirectory.set(directory, root);
  return root;
}

function isSessionsOwnRepository(sessionCwd: string | undefined, root: string): boolean {
  return sessionCwd ? rootForPath(sessionCwd) === root : false;
}

function withoutPinnedKeys(
  attribution: RepositoryAttribution,
  pinned: ReadonlySet<string>,
): Record<string, unknown> {
  if (pinned.size === 0) return { ...attribution };
  return Object.fromEntries(Object.entries(attribution).filter(([key]) => !pinned.has(key)));
}

function withoutRepositoryKeys(
  base: Record<string, unknown> | undefined,
  pinned: ReadonlySet<string>,
): Record<string, unknown> {
  const stripped: Record<string, unknown> = { ...base };
  for (const key of REPOSITORY_METADATA_KEYS) {
    if (!pinned.has(key)) delete stripped[key];
  }
  return stripped;
}

function identifierForRoot(root: string): RepositoryAttribution {
  const cached = identifierByRoot.get(root);
  if (cached) return cached;
  const userName = getGitUserName(root);
  const identifier: RepositoryAttribution = userName ? { ls_attribution_identifier: userName } : {};
  identifierByRoot.set(root, identifier);
  return identifier;
}

function attributionForRoot(root: string): RepositoryAttribution {
  const cached = attributionByRoot.get(root);
  if (cached) return cached;
  const attribution: RepositoryAttribution = { ...identifierForRoot(root) };
  const repoName = getRepoName(root);
  if (repoName) {
    attribution.repository_name = repoName.name;
    attribution.repository_provider = repoName.provider;
    const url = getRepoUrl(repoName.provider, repoName.name);
    if (url) attribution.repository_url = url;
  }
  const gitInfo = getGitInfo(root);
  if (gitInfo.branch) attribution.git_branch = gitInfo.branch;
  if (gitInfo.commit) attribution.git_commit_sha = gitInfo.commit;
  attributionByRoot.set(root, attribution);
  return attribution;
}

function withSessionAuthor(
  base: Record<string, unknown> | undefined,
  sessionRoot: string,
): Record<string, unknown> | undefined {
  if (base?.ls_attribution_identifier !== undefined) return base;
  return { ...base, ...identifierForRoot(sessionRoot) };
}

export function sessionScopedMetadata(
  base: Record<string, unknown> | undefined,
  sessionCwd?: string,
): Record<string, unknown> | undefined {
  const sessionRoot = sessionCwd ? rootForPath(sessionCwd) : undefined;
  return typeof sessionRoot === "string" ? withSessionAuthor(base, sessionRoot) : base;
}

export function repoScopedMetadata(
  base: Record<string, unknown> | undefined,
  toolInput: unknown,
  sessionCwd?: string,
): Record<string, unknown> | undefined {
  const lookup = toolPathFromInput(toolInput, sessionCwd);
  const path = lookup.path ?? (lookup.namedAPath ? undefined : sessionCwd);
  if (!path || !isAbsolute(path)) return base;

  const root = rootForPath(path);
  const gitCouldNotAnswer = root === undefined;
  if (gitCouldNotAnswer) return base;

  const pinned = pinnedRepositoryKeys(base);
  const pathIsInNoRepository = root === null;
  if (pathIsInNoRepository) return withoutRepositoryKeys(base, pinned);

  if (isSessionsOwnRepository(sessionCwd, root)) {
    return { ...base, ...withoutPinnedKeys(identifierForRoot(root), pinned) };
  }
  return {
    ...withoutRepositoryKeys(base, pinned),
    ...withoutPinnedKeys(attributionForRoot(root), pinned),
  };
}

export function turnScopedMetadata(
  base: Record<string, unknown> | undefined,
  toolInputs: Iterable<unknown>,
  sessionCwd?: string,
): Record<string, unknown> | undefined {
  const sessionRoot = sessionCwd ? rootForPath(sessionCwd) : undefined;
  if (typeof sessionRoot === "string") return withSessionAuthor(base, sessionRoot);
  for (const toolInput of toolInputs) {
    const { path } = toolPathFromInput(toolInput, sessionCwd);
    if (!path) continue;
    const landedInRepository = typeof rootForPath(path) === "string";
    if (landedInRepository) return repoScopedMetadata(base, toolInput, sessionCwd);
  }
  return base;
}

/** Tests only, since a hook process never outlives its caches. */
export function clearRepoAttributionCache(): void {
  rootByDirectory.clear();
  attributionByRoot.clear();
  identifierByRoot.clear();
}

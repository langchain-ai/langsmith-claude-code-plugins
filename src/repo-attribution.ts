// A session started in a central folder works across several repositories, so its working
// directory says nothing about the repository a given tool call touched.

import { dirname, isAbsolute, join } from "node:path";
import {
  createGitHubLoginFallback,
  getGitUserName,
  getRepoRoot,
  getRepositoryMetadata,
  nearestExistingDirectory,
  rootFromGitMarker,
} from "@langchain/plugins-base/git";
import { pinnedRepositoryKeys, resolveStateFilePath } from "./config.js";
import {
  REPOSITORY_METADATA_KEYS,
  type RepositoryAttribution,
} from "@langchain/plugins-base/metadata";
import { GH_LOGIN_MARKER_FILE } from "./constants.js";
import { toolPathFromInput } from "./repo-attribution-paths.js";
import type { ToolOrigin, ToolPathLookup } from "./types.js";

const rootByDirectory = new Map<string, string | null | undefined>();
const attributionByRoot = new Map<string, RepositoryAttribution>();
const identifierByRoot = new Map<string, RepositoryAttribution>();
let githubLogin: (() => string | undefined) | undefined;

function gitUserName(root: string): string | undefined {
  const stateFile = resolveStateFilePath();
  githubLogin ??= createGitHubLoginFallback({
    markerPath: join(dirname(stateFile), GH_LOGIN_MARKER_FILE),
  });
  return getGitUserName(root, { githubLogin });
}

function rootForPath(path: string): string | null | undefined {
  const directory = nearestExistingDirectory(path);
  if (!directory) return undefined;
  if (rootByDirectory.has(directory)) return rootByDirectory.get(directory);
  const walked = rootFromGitMarker(directory);
  const onlyGitCanSay = walked === undefined;
  const root = onlyGitCanSay ? getRepoRoot(directory) : walked;
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
  const userName = gitUserName(root);
  const identifier: RepositoryAttribution = userName ? { ls_attribution_identifier: userName } : {};
  identifierByRoot.set(root, identifier);
  return identifier;
}

function attributionForRoot(root: string): RepositoryAttribution {
  const cached = attributionByRoot.get(root);
  if (cached) return cached;
  const attribution: RepositoryAttribution = {
    ...identifierForRoot(root),
    ...getRepositoryMetadata(root),
  };
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

function scopedToPath(
  base: Record<string, unknown> | undefined,
  lookup: ToolPathLookup,
  sessionCwd: string | undefined,
  pinned: ReadonlySet<string>,
): Record<string, unknown> | undefined {
  const { path: toolPath, namedAPath } = lookup;
  const namedSomewhereNothingSits = namedAPath && !toolPath;
  if (namedSomewhereNothingSits) return base;

  const path = toolPath ?? sessionCwd;
  if (!path || !isAbsolute(path)) return base;

  const root = rootForPath(path);
  const gitCouldNotAnswer = root === undefined;
  if (gitCouldNotAnswer) return base;

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

export function repoScopedMetadata(
  base: Record<string, unknown> | undefined,
  toolInput: unknown,
  sessionCwd?: string,
): Record<string, unknown> | undefined {
  return scopedToPath(
    base,
    toolPathFromInput(toolInput, sessionCwd),
    sessionCwd,
    pinnedRepositoryKeys(base),
  );
}

export function toolOrigin(toolInput: unknown, sessionCwd?: string): ToolOrigin {
  return { cwd: sessionCwd, ...toolPathFromInput(toolInput, sessionCwd) };
}

function withSessionRepository(
  base: Record<string, unknown> | undefined,
  sessionCwd: string | undefined,
): Record<string, unknown> | undefined {
  const sessionRoot = sessionCwd ? rootForPath(sessionCwd) : undefined;
  if (typeof sessionRoot !== "string") return base;
  return { ...attributionForRoot(sessionRoot), ...base };
}

export function settledRepositoryMetadata(
  base: Record<string, unknown> | undefined,
  origin: ToolOrigin,
): Record<string, unknown> | undefined {
  const pinned = new Set(REPOSITORY_METADATA_KEYS.filter((key) => base?.[key] !== undefined));
  const sessionScoped = withSessionRepository(base, origin.cwd);
  return scopedToPath(
    sessionScoped,
    { path: origin.path, namedAPath: origin.namedAPath },
    origin.cwd,
    pinned,
  );
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
  githubLogin = undefined;
}

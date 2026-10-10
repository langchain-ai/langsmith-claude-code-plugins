// A session started in a central folder works across several repositories, so its working
// directory says nothing about the repository a given tool call touched.

import { isAbsolute } from "node:path";
import {
  getGitUserName,
  getGitInfo,
  getRepoName,
  getRepoRoot,
  getRepoUrl,
  pinnedRepositoryKeys,
} from "./config.js";
import {
  ATTRIBUTION_IDENTIFIER_KEY,
  REPOSITORY_METADATA_KEYS,
  REPOSITORY_NAME_KEY,
} from "./constants.js";
import {
  nearestExistingDirectory,
  rootFromGitMarker,
  toolPathFromInput,
} from "./repo-attribution-paths.js";
import type { RepositoryAttribution, ToolOrigin, ToolPathLookup } from "./types.js";

const rootByDirectory = new Map<string, string | null | undefined>();
const attributionByRoot = new Map<string, RepositoryAttribution>();
const identifierByRoot = new Map<string, RepositoryAttribution>();

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

export const awaitsTheTurn = (metadata: Record<string, unknown> | undefined): boolean =>
  !metadata?.[REPOSITORY_NAME_KEY] || !metadata?.[ATTRIBUTION_IDENTIFIER_KEY];

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
  turnAttributionFallback?: RepositoryAttribution,
): Record<string, unknown> | undefined {
  const pinned = new Set(REPOSITORY_METADATA_KEYS.filter((key) => base?.[key] !== undefined));
  const sessionScoped = withSessionRepository(base, origin.cwd);
  const settled = scopedToPath(
    sessionScoped,
    { path: origin.path, namedAPath: origin.namedAPath },
    origin.cwd,
    pinned,
  );
  const sessionRoot = origin.cwd ? rootForPath(origin.cwd) : undefined;
  const sessionAttribution =
    typeof sessionRoot === "string" ? attributionForRoot(sessionRoot) : undefined;
  const sessionAuthorFallback =
    (settled?.[REPOSITORY_NAME_KEY] === sessionAttribution?.[REPOSITORY_NAME_KEY] ||
      turnAttributionFallback?.[REPOSITORY_NAME_KEY] ===
        sessionAttribution?.[REPOSITORY_NAME_KEY]) &&
    typeof sessionAttribution?.[ATTRIBUTION_IDENTIFIER_KEY] === "string"
      ? { [ATTRIBUTION_IDENTIFIER_KEY]: sessionAttribution[ATTRIBUTION_IDENTIFIER_KEY] }
      : undefined;
  const fallback = { ...sessionAuthorFallback, ...turnAttributionFallback };
  const settledRepository = settled?.[REPOSITORY_NAME_KEY];
  const fallbackRepository = fallback[REPOSITORY_NAME_KEY];
  if (
    typeof fallbackRepository !== "string" ||
    (typeof settledRepository === "string" && settledRepository !== fallbackRepository)
  )
    return settled;
  const missing = Object.fromEntries(
    Object.entries(fallback).filter(([key]) => settled?.[key] === undefined),
  );
  return { ...settled, ...missing };
}

/** The settled run to upload, left open when only the turn can say where it worked. */
export function settledRunConfig(
  run: Record<string, unknown>,
  origin: ToolOrigin,
): { run: Record<string, unknown>; open: boolean } {
  const extra = run.extra as { metadata?: Record<string, unknown> } | undefined;
  const metadata = settledRepositoryMetadata(extra?.metadata, origin) ?? extra?.metadata ?? {};
  const settled: Record<string, unknown> = { ...run, extra: { ...extra, metadata } };
  const open = awaitsTheTurn(metadata);
  if (open) delete settled.end_time;
  return { run: settled, open };
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

// A session started in a central folder works across several repositories, so its working
// directory says nothing about the repository a given tool call touched.

import { dirname, join } from "node:path";
import { createRepositoryAttributor, type RepositoryAttributor } from "@langchain/plugins-base/git";
import { REPOSITORY_METADATA_KEYS } from "@langchain/plugins-base/metadata";
import { pinnedRepositoryKeys, resolveStateFilePath } from "./config.js";
import { GH_LOGIN_MARKER_FILE, PINNED_REPOSITORY_KEYS } from "./constants.js";
import { toolPathFromInput } from "./repo-attribution-paths.js";
import type { ToolOrigin } from "./types.js";

let attributor: RepositoryAttributor | undefined;

function repositoryAttributor(): RepositoryAttributor {
  attributor ??= createRepositoryAttributor({
    githubLoginMarkerPath: join(dirname(resolveStateFilePath()), GH_LOGIN_MARKER_FILE),
  });
  return attributor;
}

function withoutUnpinnedRepositoryKeys(
  base: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const pinned = pinnedRepositoryKeys(base);
  const stripped: Record<string, unknown> = { ...base };
  for (const key of REPOSITORY_METADATA_KEYS) {
    if (!pinned.has(key)) delete stripped[key];
  }
  return stripped;
}

function withPinsOf(
  base: Record<string, unknown> | undefined,
  scoped: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (scoped && base) {
    Object.defineProperty(scoped, PINNED_REPOSITORY_KEYS, { value: pinnedRepositoryKeys(base) });
  }
  return scoped;
}

export function toolOrigin(toolInput: unknown, sessionCwd?: string): ToolOrigin {
  return { cwd: sessionCwd, ...toolPathFromInput(toolInput, sessionCwd) };
}

export function sessionScopedMetadata(
  base: Record<string, unknown> | undefined,
  sessionCwd?: string,
): Record<string, unknown> | undefined {
  return withPinsOf(base, repositoryAttributor().turnMetadata(base, sessionCwd, []));
}

export function repoScopedMetadata(
  base: Record<string, unknown> | undefined,
  toolInput: unknown,
  sessionCwd?: string,
): Record<string, unknown> | undefined {
  return repositoryAttributor().toolMetadata(
    withoutUnpinnedRepositoryKeys(base),
    toolOrigin(toolInput, sessionCwd),
  );
}

export function settledRepositoryMetadata(
  base: Record<string, unknown> | undefined,
  origin: ToolOrigin,
): Record<string, unknown> | undefined {
  return repositoryAttributor().toolMetadata(base, origin);
}

export function turnScopedMetadata(
  base: Record<string, unknown> | undefined,
  toolInputs: Iterable<unknown>,
  sessionCwd?: string,
): Record<string, unknown> | undefined {
  const origins = [...toolInputs].map((input) => toolOrigin(input, sessionCwd));
  return withPinsOf(base, repositoryAttributor().turnMetadata(base, sessionCwd, origins));
}

/** Tests only, since a hook process never outlives its caches. */
export function clearRepoAttributionCache(): void {
  attributor = undefined;
}

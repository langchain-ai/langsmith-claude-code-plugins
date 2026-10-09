import { existsSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { GIT_DIRECTORY_NAME, GIT_MARKERS, TOOL_PATH_INPUT_KEYS } from "./constants.js";
import type { GitMarker, ToolPathLookup } from "./types.js";

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

export function nearestExistingDirectory(path: string): string | undefined {
  let current = path;
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

function gitMarkerAt(directory: string): GitMarker {
  try {
    return statSync(join(directory, GIT_DIRECTORY_NAME)).isDirectory()
      ? GIT_MARKERS.REPOSITORY_ROOT
      : GIT_MARKERS.ONLY_GIT_CAN_SAY;
  } catch {
    return GIT_MARKERS.NOTHING_HERE;
  }
}

export function rootFromGitMarker(directory: string): string | null | undefined {
  let current = resolve(directory);
  for (;;) {
    const marker = gitMarkerAt(current);
    if (marker === GIT_MARKERS.REPOSITORY_ROOT) return current;
    if (marker === GIT_MARKERS.ONLY_GIT_CAN_SAY) return undefined;
    const parent = dirname(current);
    const reachedFilesystemRoot = parent === current;
    if (reachedFilesystemRoot) return null;
    current = parent;
  }
}

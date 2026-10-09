import { statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { GIT_DIRECTORY_NAME, GIT_MARKERS } from "./constants.js";
import type { GitMarker } from "./types.js";

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

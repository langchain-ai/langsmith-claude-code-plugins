import { statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { GIT_DIRECTORY_NAME } from "./constants.js";
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
      ? "repository root"
      : "only git can say";
  } catch {
    return "nothing here";
  }
}

export function rootFromGitMarker(directory: string): string | null | undefined {
  let current = resolve(directory);
  for (;;) {
    const marker = gitMarkerAt(current);
    if (marker === "repository root") return current;
    if (marker === "only git can say") return undefined;
    const parent = dirname(current);
    const reachedFilesystemRoot = parent === current;
    if (reachedFilesystemRoot) return null;
    current = parent;
  }
}

import { statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { GIT_DIRECTORY_NAME } from "./constants.js";

function outsideGitDirectory(path: string): string {
  const nestedAt = path.indexOf(`${sep}.git${sep}`);
  if (nestedAt > 0) return path.slice(0, nestedAt);
  const trailing = `${sep}.git`;
  return path.endsWith(trailing) && path.length > trailing.length
    ? path.slice(0, -trailing.length)
    : path;
}

export function nearestExistingDirectory(path: string): string | undefined {
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

export function rootFromGitMarker(directory: string): string | null | undefined {
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

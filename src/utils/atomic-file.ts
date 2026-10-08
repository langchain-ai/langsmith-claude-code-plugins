/**
 * Publishing a file by rename, so no reader ever sees a half-written one.
 */

import { openSync, writeSync, closeSync, renameSync } from "node:fs";
import { randomUUID } from "node:crypto";

/** Staged under an unguessable name, since "wx" refuses an existing path and a planted symlink cannot redirect the write. */
export function publishByRename(
  path: string,
  contents: string,
  tempSuffix: string,
  mode: number,
): void {
  const temp = `${path}.${randomUUID()}${tempSuffix}`;
  const fd = openSync(temp, "wx", mode);
  try {
    writeSync(fd, contents);
  } finally {
    closeSync(fd);
  }
  renameSync(temp, path);
}

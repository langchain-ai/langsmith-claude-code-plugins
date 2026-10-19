import { join, dirname } from "node:path";
import type { Stats } from "node:fs";
import {
  LEGACY_EMPTY_FOLDER_IDLE_MS,
  LEGACY_FLUSH_LOCK_FILE,
  LEGACY_MAX_AGE_MS,
  LEGACY_QUEUE_FILE,
  LEGACY_QUEUE_TEMP_FILE,
  LEGACY_TURN_FILE,
  QUEUE_DIR_NAME,
  TURN_RECORD_DIR_NAME,
} from "./constants.js";
import { entryInfo, listDirectory, removeEmptyFolder, removeFile } from "./utils/files.js";

function idleMs(info: Stats | undefined, now: number): number {
  return info ? now - info.mtimeMs : 0;
}

function removeIfOld(path: string, now: number): boolean {
  const info = entryInfo(path);
  return info?.isFile() === true && idleMs(info, now) >= LEGACY_MAX_AGE_MS && removeFile(path);
}

function mayAgeOut(name: string, path: string, removable: ReadonlySet<string>): boolean {
  if (LEGACY_QUEUE_TEMP_FILE.test(name)) return true;
  return (LEGACY_QUEUE_FILE.test(name) || LEGACY_TURN_FILE.test(name)) && removable.has(path);
}

function sweepSession(path: string, removable: ReadonlySet<string>, now: number): number {
  const aged = listDirectory(path).filter((name) => {
    const entry = join(path, name);
    return mayAgeOut(name, entry, removable) && removeIfOld(entry, now);
  }).length;
  if (aged > 0 || idleMs(entryInfo(path), now) >= LEGACY_EMPTY_FOLDER_IDLE_MS) {
    removeEmptyFolder(path);
  }
  return aged;
}

function sweepFolder(path: string, removable: ReadonlySet<string>, now: number): number {
  if (!entryInfo(path)?.isDirectory()) return 0;
  let aged = 0;
  for (const name of listDirectory(path)) {
    const entry = join(path, name);
    if (entryInfo(entry)?.isDirectory()) aged += sweepSession(entry, removable, now);
    else if (LEGACY_FLUSH_LOCK_FILE.test(name)) removeIfOld(entry, now);
  }
  removeEmptyFolder(path);
  return aged;
}

export function sweepLegacyLeftovers(
  stateFilePath: string,
  removable: ReadonlySet<string>,
  now: number = Date.now(),
): number {
  const root = dirname(stateFilePath);
  return [QUEUE_DIR_NAME, TURN_RECORD_DIR_NAME].reduce(
    (aged, folder) => aged + sweepFolder(join(root, folder), removable, now),
    0,
  );
}

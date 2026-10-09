import { readdirSync, rmdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { QUEUE_SESSION_UNSAFE_CHARS } from "../constants.js";

export const safeName = (value: string): string => {
  const safe = value.replace(QUEUE_SESSION_UNSAFE_CHARS, "_");
  return /[^.]/.test(safe) ? safe : `_${safe}`;
};

export const storeRoot = (stateFilePath: string, dirName: string): string =>
  join(dirname(stateFilePath), dirName);

export const storeDir = (stateFilePath: string, dirName: string, sessionId: string): string =>
  join(storeRoot(stateFilePath, dirName), safeName(sessionId));

export function listStoredSessions(stateFilePath: string, dirName: string): string[] {
  try {
    return readdirSync(storeRoot(stateFilePath, dirName), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

export function discardDirIfEmpty(dir: string): void {
  try {
    rmdirSync(dir);
  } catch {
    /* ignore */
  }
}

import {
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import type { Stats } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { PRIVATE_FILE_MODE, PRIVATE_FOLDER_MODE, TEMP_FILE_SUFFIX } from "../constants.js";

export function listDirectory(path: string): string[] {
  try {
    return readdirSync(path).sort();
  } catch {
    return [];
  }
}

export function entryInfo(path: string): Stats | undefined {
  try {
    return lstatSync(path);
  } catch {
    return undefined;
  }
}

export function removeFile(path: string): boolean {
  if (!entryInfo(path)?.isFile()) return false;
  try {
    unlinkSync(path);
    return true;
  } catch {
    return false;
  }
}

export function removeEmptyFolder(path: string): void {
  try {
    rmdirSync(path);
  } catch {
    return;
  }
}

export function readText(path: string): string {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return "";
  }
}

export function readJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function publishFile(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true, mode: PRIVATE_FOLDER_MODE });
  const temp = `${path}.${randomUUID()}${TEMP_FILE_SUFFIX}`;
  writeFileSync(temp, text, { flag: "wx", mode: PRIVATE_FILE_MODE });
  renameSync(temp, path);
}

import { lstatSync, readdirSync, readFileSync, rmdirSync, unlinkSync } from "node:fs";
import type { Stats } from "node:fs";

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

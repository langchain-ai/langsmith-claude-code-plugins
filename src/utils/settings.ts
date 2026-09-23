import { existsSync, readFileSync } from "node:fs";
import * as fs from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import type { SettingsFile } from "../types.js";

export function userSettingsPath(home: string): string {
  return join(home, ".claude", "settings.json");
}

export function projectSettingsPath(cwd: string): string {
  return join(cwd, ".claude", "settings.json");
}

export async function readSettings(path: string): Promise<SettingsFile> {
  return fs.readFile(path, "utf-8").then(
    (text) => JSON.parse(text) as SettingsFile,
    () => ({}),
  );
}

export function readSettingsSync(path: string): SettingsFile {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf-8")) as SettingsFile;
}

export async function writeSettings(path: string, contents: string): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true });
  const mode = await fs.stat(path).then(
    (stats) => stats.mode & 0o777,
    () => 0o600,
  );
  const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.${Date.now()}.tmp`);
  try {
    await fs.writeFile(temporary, contents, { mode: 0o600 });
    await fs.chmod(temporary, mode);
    await fs.rename(temporary, path);
  } catch (err) {
    await fs.unlink(temporary).catch(() => undefined);
    throw err;
  }
}

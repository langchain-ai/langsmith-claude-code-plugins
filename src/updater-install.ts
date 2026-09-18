import { execFileSync } from "node:child_process";
import * as fs from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { EXECUTABLE_NAME, INSTALL_DIRECTORY_NAME, LOCK_MAX_AGE_MS } from "./sea-constants.js";
import type { Release } from "./sea-models.js";
import { downloadAsset } from "./updater-download.js";

export function installDirectory(home = homedir()): string {
  return join(home, INSTALL_DIRECTORY_NAME);
}

export function installedBinaryPath(installDir: string): string {
  return join(installDir, EXECUTABLE_NAME);
}

export async function runningAsInstalledBinary(
  executablePath: string,
  target: string,
): Promise<boolean> {
  const [running, installed] = await Promise.all([
    fs.realpath(executablePath).catch(() => undefined),
    fs.realpath(target).catch(() => undefined),
  ]);
  return running !== undefined && running === installed;
}

export async function acquireLock(path: string, now: number): Promise<fs.FileHandle | undefined> {
  try {
    return await fs.open(path, "wx", 0o600);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
  }

  const abandoned = await fs.stat(path).then(
    (stats) => now - stats.mtimeMs > LOCK_MAX_AGE_MS,
    () => false,
  );
  if (!abandoned) return undefined;
  try {
    await fs.unlink(path);
    return await fs.open(path, "wx", 0o600);
  } catch {
    return undefined;
  }
}

export async function releaseLock(path: string, lock: fs.FileHandle): Promise<void> {
  await lock.close().catch(() => undefined);
  await fs.unlink(path).catch(() => undefined);
}

function assertReportsVersion(executable: string, expected: string): void {
  const reported = execFileSync(executable, ["--version"], { encoding: "utf-8" }).trim();
  if (reported !== expected) {
    throw new Error(`the downloaded binary reports version ${reported}, expected ${expected}`);
  }
}

async function stageInstall(
  installDir: string,
  version: string,
  fill: (temporary: string) => Promise<void>,
): Promise<void> {
  await fs.mkdir(installDir, { recursive: true, mode: 0o700 });
  const temporary = join(installDir, `.${EXECUTABLE_NAME}.${process.pid}.${Date.now()}.tmp`);
  try {
    await fill(temporary);
    await fs.chmod(temporary, 0o755);
    assertReportsVersion(temporary, version);
    await fs.rename(temporary, installedBinaryPath(installDir));
  } catch (err) {
    await fs.unlink(temporary).catch(() => undefined);
    throw err;
  }
}

export async function installRelease(
  release: Release,
  installDir: string,
  fetchImpl: typeof fetch,
  releasesApi: string,
  currentVersion: string,
): Promise<void> {
  await stageInstall(installDir, release.version, (temporary) =>
    downloadAsset(release.asset, temporary, fetchImpl, releasesApi, currentVersion),
  );
}

export async function installRunningBinary(
  executablePath: string,
  installDir: string,
  version: string,
): Promise<void> {
  await stageInstall(installDir, version, (temporary) => fs.copyFile(executablePath, temporary));
}

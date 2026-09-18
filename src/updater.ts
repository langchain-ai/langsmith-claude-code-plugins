import { join } from "node:path";
import { arch as osArch, platform as osPlatform } from "node:os";
import { LS_INTEGRATION_VERSION } from "./config.js";
import { debug, log, warn } from "./logger.js";
import { LOCK_FILE } from "./sea-constants.js";
import type { UpdateOptions, UpdateResult } from "./sea-models.js";
import {
  acquireLock,
  installDirectory,
  installedBinaryPath,
  installRelease,
  releaseLock,
  runningAsInstalledBinary,
} from "./updater-install.js";
import { fetchReleaseList, pickNewestRelease } from "./updater-releases.js";
import { configuredReleasesApi, isPublishedTarget } from "./updater-utils.js";

export async function updateFromGitHub(options: UpdateOptions = {}): Promise<UpdateResult> {
  const currentVersion = options.currentVersion ?? LS_INTEGRATION_VERSION;
  const platform = options.runtimePlatform ?? osPlatform();
  const arch = options.runtimeArch ?? osArch();
  if (!currentVersion || !isPublishedTarget(platform, arch)) return { status: "unsupported" };

  const installDir = options.installDir ?? installDirectory();
  const executablePath = options.executablePath ?? process.execPath;
  if (!(await runningAsInstalledBinary(executablePath, installedBinaryPath(installDir)))) {
    debug(`Skipping the update check outside the install path: ${executablePath}`);
    return { status: "not-installed" };
  }

  const now = (options.now ?? Date.now)();
  const lockFile = join(installDir, LOCK_FILE);
  const lock = await acquireLock(lockFile, now);
  if (!lock) return { status: "busy" };

  try {
    const releasesApi = options.releasesApi ?? configuredReleasesApi();
    const fetchImpl = options.fetchImpl ?? fetch;
    const releases = await fetchReleaseList(fetchImpl, releasesApi, currentVersion, platform, arch);

    const release = pickNewestRelease(releases, currentVersion);
    if (!release) return { status: "current" };

    await installRelease(release, installDir, fetchImpl, releasesApi, currentVersion);
    return { status: "updated", version: release.version };
  } finally {
    await releaseLock(lockFile, lock);
  }
}

export async function runUpdateCheck(): Promise<UpdateResult | undefined> {
  try {
    const result = await updateFromGitHub();
    log(
      `Update check: ${result.status}${result.status === "updated" ? ` (${result.version})` : ""}`,
    );
    return result;
  } catch (err) {
    warn(`Update check failed: ${err}`);
    return undefined;
  }
}

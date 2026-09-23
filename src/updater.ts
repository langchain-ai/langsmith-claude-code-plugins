import { binary } from "./binary-target.js";
import { LS_INTEGRATION_VERSION } from "./config.js";
import { debug, log, warn } from "./logger.js";
import type { BinaryUpdateOptions, BinaryUpdateResult } from "./types.js";

export async function updateFromGitHub(
  options: BinaryUpdateOptions = {},
): Promise<BinaryUpdateResult> {
  const currentVersion = options.currentVersion ?? LS_INTEGRATION_VERSION ?? "";
  const executablePath = options.executablePath ?? process.execPath;

  // A stray copy in a build tree must never replace the one in the install directory.
  if (!(await binary.isInstalledBinary(executablePath, options.home))) {
    debug(`Skipping the update check outside the install path: ${executablePath}`);
    return { status: "not-installed" };
  }

  return binary.update({
    currentVersion,
    fetchImpl: options.fetchImpl,
    home: options.home,
    releasesApi: options.releasesApi,
    runtimeArch: options.runtimeArch,
    runtimePlatform: options.runtimePlatform,
    verifySignature: options.verifySignature,
  });
}

export async function runUpdateCheck(): Promise<BinaryUpdateResult | undefined> {
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

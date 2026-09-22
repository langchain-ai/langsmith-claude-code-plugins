import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { EXECUTABLE_NAME, INSTALL_DIRECTORY_NAME } from "../binary-constants.js";
import type { SettingsFile } from "../binary-models.js";
import { runningCompiledBinary } from "../binary-runtime.js";
import { installDirectory, installedBinaryPath } from "../updater-install.js";

const REGISTERED_COMMAND = `/${INSTALL_DIRECTORY_NAME}/${EXECUTABLE_NAME}`;

export async function pluginShouldStandDown(
  home = homedir(),
  cwd = process.cwd(),
): Promise<boolean> {
  try {
    if (runningCompiledBinary()) return false;
    if (!existsSync(installedBinaryPath(installDirectory(home)))) return false;
    return [join(home, ".claude", "settings.json"), join(cwd, ".claude", "settings.json")].some(
      registersTheBinary,
    );
  } catch {
    return false;
  }
}

function registersTheBinary(settingsPath: string): boolean {
  try {
    if (!existsSync(settingsPath)) return false;
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8")) as SettingsFile;
    return Object.values(settings.hooks ?? {}).some((groups) =>
      groups.some((group) =>
        group?.hooks?.some((hook) => hook?.command?.includes(REGISTERED_COMMAND)),
      ),
    );
  } catch {
    return false;
  }
}

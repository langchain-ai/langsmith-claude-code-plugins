import { existsSync } from "node:fs";
import { homedir } from "node:os";

import { binary } from "../binary-target.js";
import { runningCompiledBinary } from "../utils/binary-runtime.js";
import { projectSettingsPath, readSettingsSync, userSettingsPath } from "../utils/settings.js";

const REGISTERED_COMMAND = `/${binary.target.installDirectoryName}/${binary.target.executableName}`;

export function pluginShouldStandDown(home = homedir(), cwd = process.cwd()): boolean {
  try {
    if (runningCompiledBinary()) return false;
    if (!existsSync(binary.installedBinaryPath(home))) return false;
    return [userSettingsPath(home), projectSettingsPath(cwd)].some(registersTheBinary);
  } catch {
    return false;
  }
}

function registersTheBinary(settingsPath: string): boolean {
  try {
    const settings = readSettingsSync(settingsPath);
    return Object.values(settings.hooks ?? {}).some((groups) =>
      groups.some((group) =>
        group?.hooks?.some((hook) => hook?.command?.includes(REGISTERED_COMMAND)),
      ),
    );
  } catch {
    return false;
  }
}

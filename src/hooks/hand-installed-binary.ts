import { rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";

import { binary } from "../binary-target.js";
import {
  HAND_INSTALLED_BINARY_WARNING,
  HAND_INSTALLED_BINARY_WARNING_EVENT,
  HAND_INSTALLED_BINARY_WARNING_MARKER_SUFFIX,
  type HookEventName,
} from "../constants.js";
import { binaryOwnsAnyHook, runningTheInstalledBinary } from "./stand-down.js";

export function warnAboutHandInstalledBinary(
  event: HookEventName,
  out: (line: string) => void = console.log,
  home = homedir(),
): void {
  try {
    if (event !== HAND_INSTALLED_BINARY_WARNING_EVENT) return;
    if (runningTheInstalledBinary(home)) return;
    const path = binary.installedBinaryPath(home);
    const marker = `${path}${HAND_INSTALLED_BINARY_WARNING_MARKER_SUFFIX}`;
    if (!binaryOwnsAnyHook(home)) {
      rmSync(marker, { force: true });
      return;
    }
    writeFileSync(marker, "", { flag: "wx" });
    out(JSON.stringify({ systemMessage: HAND_INSTALLED_BINARY_WARNING.replace("%s", path) }));
  } catch {
    return;
  }
}

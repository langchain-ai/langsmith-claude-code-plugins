import { afterEach, beforeEach, vi } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as os from "node:os";
import { enable } from "../settings.js";
import { loadConfig } from "../config.js";
import { control, ensure, waitForStopped } from "../lifecycle.js";

export let home: string, settings: string;
export const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
export function save(value: unknown) {
  writeFileSync(settings, JSON.stringify(value), { mode: 0o600 });
}
export const transport = ({
  settingsTargets: _targets,
  ...config
}: NonNullable<ReturnType<typeof loadConfig>>) => config;
export const args = () => [
  "--scope",
  "global",
  "--cli",
  process.execPath,
  "--profile",
  "fake-profile",
  "--port",
  "52507",
];
export const run = () => enable("/fake/gateway.js", args(), {});
beforeEach(() => {
  home = realpathSync(mkdtempSync(join(tmpdir(), "gateway-settings-")));
  vi.mocked(os.userInfo).mockReturnValue({ homedir: home } as ReturnType<typeof os.userInfo>);
  mkdirSync(join(home, ".claude"), { mode: 0o700 });
  settings = join(home, ".claude/settings.json");
  vi.mocked(ensure).mockResolvedValue(undefined);
  vi.mocked(waitForStopped).mockResolvedValue(undefined);
  vi.mocked(control).mockResolvedValue("");
});
afterEach(() => {
  vi.clearAllMocks();
  rmSync(home, { recursive: true, force: true });
});

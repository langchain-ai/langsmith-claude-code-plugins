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
export const WORKSPACE = "11111111-2222-3333-4444-555555555555";
export const TOKEN_COMMAND = "printf token";
export const tokenArgs = (cli?: string) => [
  "--scope",
  "global",
  ...(cli === undefined ? [] : ["--cli", cli]),
  "--workspace-id",
  WORKSPACE,
  "--identity-token-command",
  TOKEN_COMMAND,
];
export const refusal = (env: NodeJS.ProcessEnv, before?: unknown): Promise<unknown> => {
  if (before !== undefined) save(before);
  return enable("/fake/gateway.js", args(), env).catch((reason: unknown) => reason);
};
export const noCliEnv = { PATH: "relative:/does-not-exist" };
export const cliPath = () => join(home, "bin", "langsmith");
export function installCli(): { PATH: string } {
  const dir = join(home, "bin");
  mkdirSync(dir, { mode: 0o700 });
  writeFileSync(cliPath(), "#!/bin/sh\nexit 1\n", { mode: 0o700 });
  return { PATH: `relative:${dir}` };
}
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

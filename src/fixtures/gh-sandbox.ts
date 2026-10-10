import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";

export function createGhSandbox(prefix: string) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const commandBin = join(root, "fake gh bin");
  const commandPath = join(commandBin, process.platform === "win32" ? "gh.exe" : "gh");
  mkdirSync(commandBin);
  if (process.platform === "win32") {
    copyFileSync(process.execPath, commandPath);
    chmodSync(commandPath, 0o755);
  } else {
    symlinkSync(process.execPath, commandPath);
  }

  const emptyBin = (name: string): string => {
    const dir = join(root, `${name} bin`);
    mkdirSync(dir, { recursive: true });
    return dir;
  };

  const fakeGh = (_name: string, script: string): string => {
    writeFileSync(join(root, "api"), `${script}\n`);
    return [commandBin, process.env.PATH ?? ""].filter(Boolean).join(delimiter);
  };

  const prints = (login: string): string => `console.log(${JSON.stringify(login)});`;

  const stateFile = (name: string): string => {
    const dir = join(root, `${name} state`);
    mkdirSync(dir, { recursive: true });
    return join(dir, "langsmith_state.json");
  };

  const markerFor = (statePath: string): string => join(statePath, "..", "langsmith_gh_login.json");

  return {
    root,
    emptyBin,
    fakeGh,
    prints,
    stateFile,
    markerFor,
    remove: () => rmSync(root, { recursive: true, force: true }),
  };
}

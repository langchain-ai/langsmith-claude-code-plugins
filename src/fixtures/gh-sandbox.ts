import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function createGhSandbox(prefix: string) {
  const root = mkdtempSync(join(tmpdir(), prefix));

  const emptyBin = (name: string): string => {
    const dir = join(root, `${name} bin`);
    mkdirSync(dir, { recursive: true });
    return dir;
  };

  const fakeGh = (name: string, script: string): string => {
    const dir = emptyBin(name);
    writeFileSync(join(dir, "gh"), `#!/bin/sh\n${script}\n`, { mode: 0o755 });
    return `${dir}:${process.env.PATH ?? ""}`;
  };

  const prints = (login: string): string => `echo "${login}"`;

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

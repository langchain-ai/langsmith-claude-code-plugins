import { expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";

import { binary } from "./binary-target.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const onWindows = process.platform === "win32";
const SHELL_TIMEOUT_MS = 60_000;
const executable = binary.target.executableName;

type Hooks = Record<string, { hooks: { command: string }[] }[]>;
const hooks: Hooks = JSON.parse(readFileSync(join(root, "hooks/hooks.json"), "utf8")).hooks;
const registered = hooks.SessionEnd[0].hooks[0].command;

function sandbox(builds: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "langsmith hooks "));
  for (const folder of ["hooks", "binary", "bundle", "machine"]) mkdirSync(join(dir, folder));
  cpSync(join(root, "hooks/langsmith-tracing"), join(dir, "hooks/langsmith-tracing"));
  chmodSync(join(dir, "hooks/langsmith-tracing"), 0o755);
  writeFileSync(join(dir, "bundle/dispatch.js"), 'console.log("node " + process.argv[2]);\n');
  writeFileSync(
    join(dir, "machine/uname"),
    '#!/bin/sh\ncase "$1" in -m) echo arm64 ;; *) echo Darwin ;; esac\n',
  );
  chmodSync(join(dir, "machine/uname"), 0o755);
  for (const build of builds) {
    const path = join(dir, "binary", `${executable}-${build}`);
    writeFileSync(path, `#!/bin/sh\necho "${build} $1"\n`);
    chmodSync(path, 0o755);
  }
  return dir;
}

function shell(dir: string): string {
  const command = registered.replaceAll("${CLAUDE_PLUGIN_ROOT}", dir);
  const options = {
    encoding: "utf8" as const,
    input: JSON.stringify({ hook_event_name: "SessionEnd" }),
    env: onWindows
      ? { ...process.env, CLAUDE_PLUGIN_ROOT: dir }
      : {
          ...process.env,
          CLAUDE_PLUGIN_ROOT: dir,
          PATH: `${join(dir, "machine")}${delimiter}${process.env.PATH ?? ""}`,
        },
  };
  const result = onWindows
    ? spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], options)
    : spawnSync("/bin/sh", ["-c", command], options);
  expect(result.error, String(result.error)).toBeUndefined();
  return result.stdout.trim();
}

function inSandbox(builds: string[], check: (dir: string) => void): void {
  const dir = sandbox(builds);
  try {
    check(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

it("gives every hook a starter line and a Node line carrying the same event", () => {
  for (const [event, groups] of Object.entries(hooks)) {
    for (const group of groups) {
      for (const hook of group.hooks) {
        const [starter, fallback, ...extra] = hook.command.split("\n");
        expect(extra, hook.command).toEqual([]);
        expect(starter).toBe(`exec "\${CLAUDE_PLUGIN_ROOT}/hooks/langsmith-tracing" ${event}`);
        expect(fallback).toBe(`node "\${CLAUDE_PLUGIN_ROOT}/bundle/dispatch.js" ${event}`);
      }
    }
  }
});

it.runIf(onWindows)(
  "reaches Node through PowerShell, which cannot start the starter",
  () => {
    inSandbox([], (dir) => expect(shell(dir)).toBe("node SessionEnd"));
  },
  SHELL_TIMEOUT_MS,
);

it.runIf(!onWindows)(
  "runs the carried build through a POSIX shell, and Node when none is carried",
  () => {
    inSandbox(["darwin-arm64"], (dir) => expect(shell(dir)).toBe("darwin-arm64 SessionEnd"));
    inSandbox([], (dir) => expect(shell(dir)).toBe("node SessionEnd"));
  },
  SHELL_TIMEOUT_MS,
);

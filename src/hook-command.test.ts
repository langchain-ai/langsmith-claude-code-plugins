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

import { build } from "./fixtures/launcher-sandbox.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const onWindows = process.platform === "win32";
const SHELL_TIMEOUT_MS = 60_000;

type Hooks = Record<string, { hooks: { command: string }[] }[]>;
const hooks: Hooks = JSON.parse(
  readFileSync(join(root, "plugins/langsmith-tracing/hooks/hooks.json"), "utf8"),
).hooks;
const registered = hooks.SessionEnd[0].hooks[0].command;

function sandbox(builds: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "langsmith hooks "));
  for (const folder of ["hooks", "binary", "bundle", "machine"]) mkdirSync(join(dir, folder));
  cpSync(
    join(root, "plugins/langsmith-tracing/hooks/langsmith-claude-launcher"),
    join(dir, "hooks/langsmith-claude-launcher"),
  );
  chmodSync(join(dir, "hooks/langsmith-claude-launcher"), 0o755);
  writeFileSync(
    join(dir, "bundle/dispatch.js"),
    'console.log("node " + process.argv.slice(2).join(" "));\n',
  );
  writeFileSync(join(dir, "machine/uname"), "#!/bin/sh\necho Darwin\n");
  chmodSync(join(dir, "machine/uname"), 0o755);
  for (const name of builds) {
    const path = join(dir, "binary", name);
    writeFileSync(path, '#!/bin/sh\necho "build $*"\n');
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
        expect(starter).toBe(
          `exec "\${CLAUDE_PLUGIN_ROOT}/hooks/langsmith-claude-launcher" ${event}`,
        );
        expect(fallback).toBe(
          `node "\${CLAUDE_PLUGIN_ROOT}/bundle/dispatch.js" --plugin tracing ${event}`,
        );
      }
    }
  }
});

it.runIf(onWindows)(
  "reaches Node through PowerShell, which cannot start the starter",
  () => {
    inSandbox([], (dir) => expect(shell(dir)).toBe("node --plugin tracing SessionEnd"));
  },
  SHELL_TIMEOUT_MS,
);

it.runIf(!onWindows)(
  "runs the carried build through a POSIX shell, and Node when none is carried",
  () => {
    inSandbox([build], (dir) => expect(shell(dir)).toBe("build --plugin tracing SessionEnd"));
    inSandbox([], (dir) => expect(shell(dir)).toBe("node --plugin tracing SessionEnd"));
  },
  SHELL_TIMEOUT_MS,
);

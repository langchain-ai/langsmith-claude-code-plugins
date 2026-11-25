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

type Hooks = Record<string, { hooks: { command: string; async?: boolean; timeout?: number }[] }[]>;
const hooks: Hooks = JSON.parse(
  readFileSync(join(root, "plugins/langsmith-tracing/hooks/hooks.json"), "utf8"),
).hooks;
const registered = hooks.SessionEnd[0].hooks[0].command;
const FILTERED_EVENTS = ["PostToolUseFailure", "PostToolBatch", "MessageDisplay"];
const expectedFilteredCommand = (event: string) =>
  [
    "input=$(cat)",
    `case "$input" in *'"transcript_path":"'[!\\"]*) exit 0 ;; esac`,
    `printf '%s' "$input" | "\${CLAUDE_PLUGIN_ROOT}/hooks/langsmith-tracing" ${event} || printf '%s' "$input" | node "\${CLAUDE_PLUGIN_ROOT}/bundle/dispatch.js" ${event}`,
  ].join("\n");

function sandbox(builds: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "langsmith hooks "));
  for (const folder of ["hooks", "binary", "bundle", "machine"]) mkdirSync(join(dir, folder));
  cpSync(
    join(root, "plugins/langsmith-tracing/hooks/langsmith-tracing"),
    join(dir, "hooks/langsmith-tracing"),
  );
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

function shell(
  dir: string,
  registeredCommand = registered,
  input = JSON.stringify({ hook_event_name: "SessionEnd" }),
): string {
  const command = registeredCommand.replaceAll("${CLAUDE_PLUGIN_ROOT}", dir);
  const options = {
    encoding: "utf8" as const,
    input,
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

it("gives every hook the transcript filter lacks a starter line and a Node line carrying the same event", () => {
  for (const [event, groups] of Object.entries(hooks).filter(
    ([name]) => !FILTERED_EVENTS.includes(name),
  )) {
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

it("gives the three transcript-filtered hooks exactly the filter, the starter and the Node fallback", () => {
  for (const event of FILTERED_EVENTS) {
    expect(hooks[event][0].hooks[0].command).toBe(expectedFilteredCommand(event));
  }
});

it("runs PostToolBatch synchronously with a 10 second timeout", () => {
  const [hook] = hooks.PostToolBatch[0].hooks;
  expect(hook.async).toBeUndefined();
  expect(hook.timeout).toBe(10);
});

it.runIf(!onWindows)(
  "starts the plugin for a filtered hook unless the transcript path is a real path, passing the input on untouched",
  () => {
    const local = JSON.stringify({ transcript_path: "/t/s.jsonl", delta: "hi" });
    const empty = JSON.stringify({ transcript_path: "", delta: 'say "hi"\nthere \\n' });
    const absent = JSON.stringify({ delta: "hi" });
    const nulled = JSON.stringify({ transcript_path: null, delta: "hi" });
    for (const event of FILTERED_EVENTS) {
      const command = hooks[event][0].hooks[0].command;
      inSandbox(["darwin-arm64"], (dir) => {
        writeFileSync(
          join(dir, "binary", `${executable}-darwin-arm64`),
          '#!/bin/sh\nprintf "%s %s" "$1" "$(cat)"\n',
          { mode: 0o755 },
        );
        expect(shell(dir, command, local)).toBe("");
        for (const input of [empty, absent, nulled]) {
          expect(shell(dir, command, input)).toBe(`${event} ${input}`);
        }
      });
      inSandbox([], (dir) => {
        expect(shell(dir, command, local)).toBe("");
        for (const input of [empty, absent, nulled]) {
          expect(shell(dir, command, input)).toBe(`node ${event}`);
        }
      });
    }
  },
  SHELL_TIMEOUT_MS,
);

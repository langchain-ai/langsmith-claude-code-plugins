import { describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { binary } from "./binary-target.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const picker = join(root, "hooks/langsmith-tracing");
const executable = binary.target.executableName;

function sandbox(builds: string[], { runnable = true } = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "langsmith-picker-"));
  mkdirSync(join(dir, "hooks"));
  mkdirSync(join(dir, "binary"));
  mkdirSync(join(dir, "bundle"));
  mkdirSync(join(dir, "machine"));
  cpSync(picker, join(dir, "hooks/langsmith-tracing"));
  chmodSync(join(dir, "hooks/langsmith-tracing"), 0o755);
  writeFileSync(join(dir, "bundle/dispatch.js"), 'console.log("node " + process.argv[2]);\n');
  for (const build of builds) {
    const path = join(dir, "binary", `${executable}-${build}`);
    writeFileSync(path, `#!/bin/sh\necho "${build} $1"\n`);
    chmodSync(path, runnable ? 0o755 : 0o644);
  }
  return dir;
}

function machine(dir: string, system: string, hardware: string): string {
  const path = join(dir, "machine/uname");
  writeFileSync(
    path,
    `#!/bin/sh\nif [ "$1" = "-m" ]; then echo ${hardware}; else echo ${system}; fi\n`,
  );
  chmodSync(path, 0o755);
  return `${join(dir, "machine")}:${process.env.PATH ?? ""}`;
}

function pick(
  dir: string,
  { system = "Darwin", hardware = "arm64", event = "Stop", ...env } = {},
): string {
  const result = spawnSync(join(dir, "hooks/langsmith-tracing"), [event], {
    encoding: "utf8",
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: dir,
      PATH: machine(dir, system, hardware),
      ...env,
    },
  });
  expect(result.error, result.stderr).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  return result.stdout.trim();
}

function inSandbox(builds: string[], check: (dir: string) => void, options = {}): void {
  const dir = sandbox(builds, options);
  try {
    check(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("the build picker", () => {
  it("survives a clone runnable, so the hooks can start it", () => {
    const tracked = execFileSync("git", ["ls-files", "--stage", "--", "hooks/langsmith-tracing"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(tracked.slice(0, 6)).toBe("100755");
  });

  it("survives a Windows clone runnable, where Git rewrites line endings", () => {
    const converted = execFileSync(
      "git",
      ["-c", "core.autocrlf=true", "cat-file", "--filters", ":hooks/langsmith-tracing"],
      { cwd: root },
    );
    inSandbox(["darwin-arm64"], (dir) => {
      writeFileSync(join(dir, "hooks/langsmith-tracing"), converted);
      chmodSync(join(dir, "hooks/langsmith-tracing"), 0o755);
      expect(pick(dir)).toBe("darwin-arm64 Stop");
    });
  });

  it("runs the Apple silicon build on an Apple silicon Mac", () => {
    inSandbox(["darwin-arm64", "darwin-x64"], (dir) => {
      expect(pick(dir)).toBe("darwin-arm64 Stop");
    });
  });

  it("runs the Intel build under Rosetta when it is the only one carried", () => {
    inSandbox(["darwin-x64"], (dir) => {
      expect(pick(dir)).toBe("darwin-x64 Stop");
    });
  });

  it("runs the Intel build on an Intel Mac and never the Apple silicon one", () => {
    inSandbox(["darwin-arm64", "darwin-x64"], (dir) => {
      expect(pick(dir, { hardware: "x86_64" })).toBe("darwin-x64 Stop");
    });
  });

  it("falls back to Node when no build has been committed yet", () => {
    inSandbox([], (dir) => {
      expect(pick(dir)).toBe("node Stop");
    });
  });

  it("falls back to Node when a build lost its executable bit", () => {
    inSandbox(
      ["darwin-arm64", "darwin-x64"],
      (dir) => {
        expect(pick(dir)).toBe("node Stop");
      },
      { runnable: false },
    );
  });

  it("falls back to Node off a Mac, so a Mac build is never started there", () => {
    inSandbox(["darwin-arm64", "darwin-x64"], (dir) => {
      expect(pick(dir, { system: "Linux", hardware: "x86_64" })).toBe("node Stop");
    });
  });

  it("finds its own plugin root when Claude Code does not supply one", () => {
    inSandbox(["darwin-arm64", "darwin-x64"], (dir) => {
      const result = spawnSync(join(dir, "hooks/langsmith-tracing"), ["PreToolUse"], {
        encoding: "utf8",
        cwd: tmpdir(),
        env: {
          ...process.env,
          CLAUDE_PLUGIN_ROOT: "",
          PATH: machine(dir, "Darwin", "arm64"),
        },
      });
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout.trim()).toBe("darwin-arm64 PreToolUse");
    });
  });
});

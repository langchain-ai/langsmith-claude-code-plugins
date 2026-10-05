import { describe, expect, it } from "vitest";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as after } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { binary } from "./binary-target.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const picker = join(root, "hooks/langsmith-tracing");
const executable = binary.target.executableName;
const SLOW_BUILD_TIMEOUT_MS = 15_000;

const body = {
  works: (build: string) => `#!/bin/sh\necho "${build} $1"\n`,
  unreadableToTheKernel: () => `${String.fromCharCode(0, 1)}not a program at all`,
  killedOnTheSpot: () => "#!/bin/sh\nkill -9 $$\n",
  reportsItCouldNotStart: () => "#!/bin/sh\nexit 127\n",
  failsForItsOwnReason: (build: string) => `#!/bin/sh\necho "${build} refused"\nexit 3\n`,
  stopsWithOne: () => "#!/bin/sh\nexit 1\n",
  stopsWithTwo: () => "#!/bin/sh\nexit 2\n",
  stopsWithThree: () => "#!/bin/sh\nexit 3\n",
  stopsWithTheHighestCode: () => "#!/bin/sh\nexit 255\n",
  countsItsInput: (build: string) => `#!/bin/sh\necho "${build} $(wc -c | tr -d ' ') bytes"\n`,
  diesPartWayThroughTheEvent: () => "#!/bin/sh\nhead -c 10 >/dev/null\nkill -9 $$\n",
  outlastsTheTimeout: () => "#!/bin/sh\nhead -c 10 >/dev/null\nsleep 30\nexit 127\n",
  readsOffTheSpoolPermissions: () => '#!/bin/sh\nset -- "$TMPDIR"/*\nls -l "$1" | cut -c1-10\n',
};

type Body = keyof typeof body;

function sandbox(builds: string[], { runnable = true, shaped = "works" as Body } = {}): string {
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
    writeFileSync(path, body[shaped](build));
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

function run(
  dir: string,
  {
    system = "Darwin",
    hardware = "arm64",
    event = "Stop",
    input = undefined as string | undefined,
    ...env
  } = {},
) {
  return spawnSync(join(dir, "hooks/langsmith-tracing"), [event], {
    encoding: "utf8",
    input,
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: dir,
      PATH: machine(dir, system, hardware),
      ...env,
    },
  });
}

const interpreters = ["/bin/sh", "/bin/bash", "/bin/zsh", "/bin/dash"].filter((path) =>
  existsSync(path),
);

function under(interpreter: string, dir: string, redirect = "") {
  const argv = ["-c", `exec "$0" "$1" Stop ${redirect}`, interpreter, launcher(dir)];
  return spawnSync(interpreter, argv, {
    encoding: "utf8",
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: dir,
      PATH: machine(dir, "Darwin", "arm64"),
    },
  });
}

function launcher(dir: string): string {
  return join(dir, "hooks/langsmith-tracing");
}

function pick(dir: string, options = {}): string {
  const result = run(dir, options);
  expect(result.error, result.stderr).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  return result.stdout.trim();
}

async function timedOut(
  dir: string,
  feed: (stdin: NodeJS.WritableStream) => void,
  signal: NodeJS.Signals = "SIGTERM",
): Promise<{ code: number | null; spool: string; took: number }> {
  const spool = join(dir, "spool");
  mkdirSync(spool);
  const child = spawn(join(dir, "hooks/langsmith-tracing"), ["Stop"], {
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: dir,
      TMPDIR: spool,
      PATH: machine(dir, "Darwin", "arm64"),
    },
    stdio: ["pipe", "ignore", "ignore"],
  });
  child.stdin.on("error", () => {});
  feed(child.stdin);
  await after(750);
  const sent = Date.now();
  child.kill(signal);
  const [code] = (await once(child, "exit")) as [number | null];
  return { code, spool, took: Date.now() - sent };
}

function inSandbox(
  builds: string[],
  check: (dir: string) => void,
  options: { runnable?: boolean; shaped?: Body } = {},
): void {
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

  it.each([
    ["is too broken to start", "unreadableToTheKernel"],
    ["is killed the moment it starts", "killedOnTheSpot"],
    ["reports it could not be started", "reportsItCouldNotStart"],
    ["stops with 1, as a failed start does under /bin/sh", "stopsWithOne"],
    ["stops with 2, as unreadable bytes read as a script do", "stopsWithTwo"],
    ["stops with 3, as a build that crashed after starting does", "stopsWithThree"],
    ["stops with the highest code a shell can report", "stopsWithTheHighestCode"],
  ] as const)("falls back to Node when a build %s", (_, shaped) => {
    inSandbox(
      ["darwin-arm64", "darwin-x64"],
      (dir) => {
        expect(pick(dir)).toBe("node Stop");
      },
      { shaped },
    );
  });

  it("tries the Intel build when the Apple silicon one cannot start", () => {
    inSandbox(["darwin-x64"], (dir) => {
      const broken = join(dir, "binary", `${executable}-darwin-arm64`);
      writeFileSync(broken, body.unreadableToTheKernel());
      chmodSync(broken, 0o755);
      expect(pick(dir)).toBe("darwin-x64 Stop");
    });
  });

  it("lets a build that already answered answer twice when it then fails", () => {
    inSandbox(
      ["darwin-arm64"],
      (dir) => {
        const result = run(dir);
        expect(result.status, result.stderr).toBe(0);
        expect(result.stdout.trim().split("\n")).toEqual(["darwin-arm64 refused", "node Stop"]);
      },
      { shaped: "failsForItsOwnReason" },
    );
  });

  it("says once that a carried build could not run, so the turn is not lost in silence", () => {
    inSandbox(
      ["darwin-arm64", "darwin-x64"],
      (dir) => {
        const result = run(dir);
        const said = result.stderr
          .trim()
          .split("\n")
          .filter((line) => line.includes("carried build did not run"));
        expect(said).toHaveLength(1);
        expect(said[0]).toContain("exited 3");
      },
      { shaped: "stopsWithThree" },
    );
  });

  it("says nothing at all when the carried build runs the turn", () => {
    inSandbox(["darwin-arm64"], (dir) => {
      const result = run(dir);
      expect(result.stdout.trim()).toBe("darwin-arm64 Stop");
      expect(result.stderr).toBe("");
    });
  });

  it("says nothing when there is no carried build to try", () => {
    inSandbox([], (dir) => {
      const result = run(dir);
      expect(result.stdout.trim()).toBe("node Stop");
      expect(result.stderr).toBe("");
    });
  });

  it("has at least two of the four interpreters to run the launcher under", () => {
    expect(interpreters.length, `only found ${interpreters.join(", ")}`).toBeGreaterThanOrEqual(2);
  });

  it.each(interpreters)(
    "keeps the turn and exits 0 under %s when a build stops with its own code",
    (interpreter) => {
      inSandbox(
        ["darwin-arm64"],
        (dir) => {
          const result = under(interpreter, dir);
          expect(result.status, result.stderr).toBe(0);
          expect(result.stdout.trim()).toBe("node Stop");
        },
        { shaped: "stopsWithThree" },
      );
    },
  );

  it.each(interpreters)(
    "still reaches Node under %s when the warning has nowhere to go",
    (interpreter) => {
      inSandbox(
        ["darwin-arm64"],
        (dir) => {
          const result = under(interpreter, dir, "2>&-");
          expect(result.status, result.stdout).toBe(0);
          expect(result.stdout.trim()).toBe("node Stop");
        },
        { shaped: "stopsWithThree" },
      );
    },
  );

  it("still reaches Node when the warning is written into a dead pipe", () => {
    inSandbox(
      ["darwin-arm64"],
      (dir) => {
        const result = under("/bin/bash", dir, "2> >(exit 0)");
        expect(result.status, result.stdout).toBe(0);
        expect(result.stdout.trim()).toBe("node Stop");
      },
      { shaped: "stopsWithThree" },
    );
  });

  it("hands Node an event far larger than a pipe buffer when no build starts", () => {
    inSandbox(
      ["darwin-arm64", "darwin-x64"],
      (dir) => {
        writeFileSync(
          join(dir, "bundle/dispatch.js"),
          'let n=0;process.stdin.on("data",(c)=>{n+=c.length});process.stdin.on("end",()=>console.log("node "+n));\n',
        );
        expect(pick(dir, { input: "x".repeat(1_048_576) })).toBe("node 1048576");
      },
      { shaped: "unreadableToTheKernel" },
    );
  });

  it("hands Node the whole event when a build dies part way through reading it", () => {
    inSandbox(
      ["darwin-arm64"],
      (dir) => {
        writeFileSync(
          join(dir, "bundle/dispatch.js"),
          'let n=0;process.stdin.on("data",(c)=>{n+=c.length});process.stdin.on("end",()=>console.log("node "+n));\n',
        );
        expect(pick(dir, { input: "x".repeat(200_000) })).toBe("node 200000");
      },
      { shaped: "diesPartWayThroughTheEvent" },
    );
  });

  it("hands a working build an event far larger than a pipe buffer", () => {
    inSandbox(
      ["darwin-arm64"],
      (dir) => {
        expect(pick(dir, { input: "x".repeat(1_048_576) })).toBe("darwin-arm64 1048576 bytes");
      },
      { shaped: "countsItsInput" },
    );
  });

  it("keeps the spooled event readable only by the person being traced", () => {
    inSandbox(
      ["darwin-arm64"],
      (dir) => {
        const spool = join(dir, "spool");
        mkdirSync(spool);
        expect(pick(dir, { TMPDIR: spool, input: "x".repeat(1_000) })).toBe("-rw-------");
      },
      { shaped: "readsOffTheSpoolPermissions" },
    );
  });

  it("hands the turn to node when the event cannot be spooled at all", () => {
    inSandbox(["darwin-arm64"], (dir) => {
      const spool = join(dir, "spool");
      mkdirSync(spool, { mode: 0o500 });
      expect(pick(dir, { TMPDIR: spool, input: "hello" })).toBe("node Stop");
    });
  });

  it("leaves no half-written copy behind when the event cannot be spooled", () => {
    inSandbox(["darwin-arm64"], (dir) => {
      const spool = join(dir, "spool");
      mkdirSync(spool);
      const result = spawnSync(
        "/bin/sh",
        ["-c", 'ulimit -f 1; exec "$0" Stop', join(dir, "hooks/langsmith-tracing")],
        {
          encoding: "utf8",
          input: "x".repeat(200_000),
          env: {
            ...process.env,
            CLAUDE_PLUGIN_ROOT: dir,
            TMPDIR: spool,
            PATH: machine(dir, "Darwin", "arm64"),
          },
        },
      );
      expect(result.status).not.toBe(0);
      expect(readdirSync(spool)).toEqual([]);
    });
  });

  it("keeps no copy of the event once it is done, whichever path ran it", () => {
    const spooled = (shaped: Body, expected: string) =>
      inSandbox(
        ["darwin-arm64"],
        (dir) => {
          const spool = join(dir, "spool");
          mkdirSync(spool);
          expect(pick(dir, { TMPDIR: spool, input: "x".repeat(200_000) })).toBe(expected);
          expect(readdirSync(spool)).toEqual([]);
        },
        { shaped },
      );
    spooled("countsItsInput", "darwin-arm64 200000 bytes");
    spooled("reportsItCouldNotStart", "node Stop");
  });

  it(
    "stops when Claude Code times it out, rather than waiting out a stuck build",
    async () => {
      const dir = sandbox(["darwin-arm64"], { shaped: "outlastsTheTimeout" });
      try {
        const { code, spool, took } = await timedOut(dir, (stdin) =>
          stdin.end("x".repeat(200_000)),
        );
        expect({ code, promptly: took < 10_000 }).toEqual({ code: 143, promptly: true });
        expect(readdirSync(spool)).toEqual([]);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
    SLOW_BUILD_TIMEOUT_MS,
  );

  it.each([
    ["SIGTERM", 143],
    ["SIGQUIT", 131],
  ])(
    "leaves nothing behind when %s lands while the event is still arriving",
    async (signal, expected) => {
      const dir = sandbox(["darwin-arm64"], { shaped: "reportsItCouldNotStart" });
      try {
        const { code, spool } = await timedOut(
          dir,
          (stdin) => stdin.write("x".repeat(1_000)),
          signal as NodeJS.Signals,
        );
        expect(code).toBe(expected);
        expect(readdirSync(spool)).toEqual([]);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
    SLOW_BUILD_TIMEOUT_MS,
  );

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

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Every fixture path holds a space, since a quoted-argument bug only shows up there. */
export function createGitSandbox(prefix: string) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  if (spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root }).status === 0) {
    throw new Error(`${root} is inside a git repository, so point TMPDIR somewhere that is not`);
  }
  const globalConfig = join(root, "global config");
  writeFileSync(globalConfig, "[user]\n\tname = Global Fallback\n");
  // Windows reads USERPROFILE, so redirect both and no runner can reach a real home.
  const env = { HOME: root, USERPROFILE: root, GIT_CONFIG_GLOBAL: globalConfig };

  const git = (cwd: string, ...args: string[]): string =>
    execFileSync("git", args, {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...env },
    }).trim();

  const makeDir = (...segments: string[]): string => {
    const path = join(...segments);
    mkdirSync(path, { recursive: true });
    return path;
  };

  const makeRepo = (name: string, branch: string, user: string, remote?: string): string => {
    const path = makeDir(root, name);
    git(path, "init", "--initial-branch", branch);
    git(path, "config", "user.name", user);
    git(path, "config", "user.email", `${branch}@example.test`);
    if (remote) git(path, "remote", "add", "origin", remote);
    writeFileSync(join(path, "seed.txt"), "seed\n");
    git(path, "add", "seed.txt");
    git(path, "commit", "-m", "Seed");
    return path;
  };

  return {
    root,
    env,
    git,
    makeDir,
    makeRepo,
    waitForWorkers: () => waitUntilNoProcessMentions(root),
    // A detached uploader may still be writing here, so give the removal a few tries.
    remove: () => rmSync(root, { recursive: true, force: true, maxRetries: 20, retryDelay: 150 }),
  };
}

async function waitUntilNoProcessMentions(root: string, ms = 30_000): Promise<void> {
  if (process.platform === "win32") return;
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const listing = spawnSync("ps", ["-axww", "-o", "pid=,command="], { encoding: "utf-8" }).stdout;
    const running = listing
      .split("\n")
      .filter((line) => line.includes(root) && !line.trim().startsWith(`${process.pid} `));
    if (running.length === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

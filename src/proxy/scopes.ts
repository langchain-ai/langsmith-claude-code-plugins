import { readdirSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { configDir, type ProxyConfig } from "./config.js";
import { directory, snapshot } from "./files.js";
import { SetupError, type SetupOptions } from "./options.js";

export function targetPaths(home: string, scope: SetupOptions["scope"], cwd: string) {
  if (scope === "global")
    return {
      settings: join(home, ".claude/settings.json"),
      config: join(configDir(home), "config.json"),
      receipt: join(configDir(home), "settings-ownership.json"),
    };
  if (!cwd || !cwd.startsWith("/"))
    throw new SetupError("Project scope requires an absolute hook cwd.");
  const root = realpathSync(cwd);
  // Reject links in the supplied project path, not just the final file.
  if (resolve(cwd) !== root)
    throw new SetupError("Project path must be canonical and not a symlink.");
  directory(root);
  const settings = join(root, ".claude/settings.local.json");
  const id = createHash("sha256").update(settings).digest("hex");
  return {
    settings,
    config: join(configDir(home), "config.json"),
    receipt: join(configDir(home), `settings-ownership-${id}.json`),
  };
}

// Fail closed in repositories: ignored is not enough if already tracked. Never
// modify .gitignore or stage files on the user's behalf.
export function secretGitCheck(path: string): void {
  const cwd = dirname(path);
  const run = (args: string[]) =>
    spawnSync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      timeout: 5000,
      env: {
        PATH: process.env.PATH,
        HOME: "/dev/null",
        LC_ALL: "C",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_OPTIONAL_LOCKS: "0",
      },
    });
  const repo = run(["rev-parse", "--is-inside-work-tree"]);
  if (repo.error)
    throw new SetupError("Cannot verify secrets are outside version control; git is required.");
  if (repo.status !== 0) {
    if (repo.status === 128 && repo.stderr.includes("not a git repository")) return;
    throw new SetupError("Cannot verify secret destination repository safety.");
  }
  const tracked = run(["ls-files", "--cached", "--", path]);
  const ignored = run(["check-ignore", "--no-index", "--quiet", "--", path]);
  if (tracked.status !== 0 || tracked.stdout.trim() || ignored.status !== 0)
    throw new SetupError(
      `Secret destination ${JSON.stringify(path)} is tracked or not git-ignored. Untrack and privately ignore it before setup; nothing was written there.`,
    );
}

export function receiptSnapshots(home: string) {
  return readdirSync(configDir(home))
    .filter((name) => /^settings-ownership(?:-[a-f0-9]{64})?\.json$/.test(name))
    .map((name) => ({
      path: join(configDir(home), name),
      saved: snapshot(join(configDir(home), name), true)!,
    }))
    .filter(({ saved }) => JSON.parse(saved.text) !== null);
}

// Trust only private OS-home receipts, never a project's config/settings/env.
export function authorizedScope(
  home: string,
  cwd: string | undefined,
  config: ProxyConfig,
): boolean {
  const valid = (saved: ReturnType<typeof snapshot>) => {
    if (!saved) return false;
    const r = JSON.parse(saved.text);
    return (
      r?.version === 1 &&
      r.identity ===
        createHash("sha256")
          .update(JSON.stringify([config.cli, config.profile, config.port, config.secret]))
          .digest("hex") &&
      typeof r.afterHeaders === "string" &&
      r.afterBase === `http://127.0.0.1:${config.port}`
    );
  };
  const global = snapshot(join(configDir(home), "settings-ownership.json"), true);
  if (valid(global)) return true;
  if (!cwd) return false;
  const p = targetPaths(home, "project", cwd);
  const saved = snapshot(p.receipt, true);
  return valid(saved);
}

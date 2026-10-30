import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", { spy: true });

import { execFileSync } from "node:child_process";
import { createGitSandbox } from "./fixtures/git-sandbox.js";
import { loadConfig } from "./config.js";
import { toolPathFromInput } from "./repo-attribution-paths.js";
import {
  clearRepoAttributionCache,
  repoScopedMetadata,
  sessionScopedMetadata,
  turnScopedMetadata,
} from "./repo-attribution.js";

const sandbox = createGitSandbox("ls repo attribution ");
const { git, makeDir, makeRepo, root } = sandbox;

const alpha = makeRepo("alpha repo", "trunk-alpha", "Alpha Owner", "git@github.com:acme/alpha.git");
const beta = makeRepo("beta repo", "trunk-beta", "Beta Owner", "https://gitlab.com/acme/beta.git");
const plain = makeDir(root, "plain folder");
const nested = join(makeDir(alpha, "sub dir"), "nested.txt");
const betaNested = join(makeDir(beta, "sub dir"), "nested.txt");
for (const path of [nested, betaNested]) writeFileSync(path, "nested\n");
const worktree = join(root, "alpha worktree");
git(alpha, "worktree", "add", "-b", "side-branch", worktree);
const submodule = makeDir(alpha, "broken submodule");
writeFileSync(join(submodule, ".git"), `gitdir: ${join(alpha, ".git", "modules", "gone")}\n`);

const alphaSeed = join(alpha, "seed.txt");
const betaSeed = join(beta, "seed.txt");
const gitCommands = () =>
  vi.mocked(execFileSync).mock.calls.map(([file, args]) => [file, ...(args ?? [])].join(" "));

// What loadConfig stamps for a session started outside every repository here.
const session = {
  cwd: "/somewhere/central",
  ls_git_repo: "acme/session",
  ls_repo_provider: "github",
  ls_git_repo_url: "https://github.com/acme/session",
  ls_git_branch: "session-branch",
  ls_git_commit_hash: "0".repeat(40),
  ls_integration: "claude-code",
};
const noRepository = { cwd: session.cwd, ls_integration: session.ls_integration };
const inAlpha = { ls_git_repo: "acme/alpha", ls_attribution_identifier: "Alpha Owner" };
const inBeta = { ls_git_repo: "acme/beta" };
const everythingBetaReveals = {
  ...inBeta,
  ls_repo_provider: "gitlab",
  ls_git_repo_url: "https://gitlab.com/acme/beta",
  ls_git_branch: "trunk-beta",
  ls_git_commit_hash: git(beta, "rev-parse", "HEAD"),
  repository_name: "acme/beta",
  repository_provider: "gitlab",
  repository_url: "https://gitlab.com/acme/beta",
  git_branch: "trunk-beta",
  git_commit_sha: git(beta, "rev-parse", "HEAD"),
  ls_attribution_identifier: "Beta Owner",
  ls_integration: "claude-code",
};

type Row = Record<string, unknown>;
type Case = [name: string, input: Record<string, string>, want: Row, cwd?: string];

afterAll(() => sandbox.remove());

beforeEach(() => {
  clearRepoAttributionCache();
  vi.clearAllMocks();
});

afterEach(() => vi.unstubAllEnvs());

describe("repoScopedMetadata", () => {
  // The first row pins every field; the rest cover each input key a tool may hide a
  // path under, since one left out silently attributes the call to the session.
  it.each<Case>([
    ["a file in another repository", { file_path: betaSeed }, everythingBetaReveals],
    ["a notebook path", { notebook_path: betaSeed }, inBeta],
    ["a bare path", { path: betaSeed }, inBeta],
    ["a relative directory", { cwd: "beta repo" }, inBeta, root],
    ["a file nothing has created yet", { file_path: join(alpha, "new", "deep", "x.txt") }, inAlpha],
    ["a file in the git directory", { file_path: join(alpha, ".git", "config") }, inAlpha],
    [
      "a linked worktree, on its own branch rather than the main checkout's",
      { file_path: join(worktree, "seed.txt") },
      { ls_git_repo: "acme/alpha", ls_git_branch: "side-branch" },
    ],
  ])("attributes %s", (_name, input, want, cwd) => {
    expect(repoScopedMetadata(session, input, cwd)).toMatchObject(want);
  });

  describe("a tool that names a folder only inside its command or pattern", () => {
    const inSession = () => sessionScopedMetadata(noRepository, alpha);
    const staysInAlpha = { ls_git_repo: "acme/alpha", ls_attribution_identifier: "Alpha Owner" };
    const noRepoKeys = { cwd: session.cwd, ls_integration: session.ls_integration };
    const missing = join(root, "no such folder");

    it.each<[name: string, input: Record<string, string>]>([
      ["git -C with a quoted folder", { command: `git -C "${beta}" log` }],
      ["git -C with a relative folder", { command: "git -C '../beta repo' log" }],
      ["a leading cd into a quoted folder", { command: `cd "${beta}" && ls` }],
      ["a leading cd ended by a semicolon", { command: `cd '${beta}'; ls` }],
      ["a relative leading cd", { command: 'cd "../beta repo" && ls' }],
      ["an absolute file argument", { command: `cat "${betaSeed}"` }],
      ["the first repository an argument names", { command: `diff "${betaSeed}" "${alphaSeed}"` }],
      ["a Glob pattern with a wildcard", { pattern: `${beta}/**/*.txt` }],
      ["a Glob pattern ending in a partial file name", { pattern: `${beta}/seed*` }],
      ["a Grep pattern given as a file", { pattern: betaSeed }],
    ])("attributes %s to the repository it names", (_name, input) => {
      expect(repoScopedMetadata(inSession(), input, alpha)).toMatchObject(inBeta);
    });

    it("reads ~ in a folder the command enters as the person's home", () => {
      vi.stubEnv("HOME", root);
      vi.stubEnv("USERPROFILE", root);

      expect(
        repoScopedMetadata(inSession(), { command: 'cd "~/beta repo" && ls' }, plain),
      ).toMatchObject(inBeta);
      expect(
        repoScopedMetadata(inSession(), { command: 'git -C "~/beta repo" log' }, plain),
      ).toMatchObject(inBeta);
    });

    it("lets git -C win over the folder a leading cd entered", () => {
      const command = `cd "${alpha}" && git -C "${beta}" log`;

      expect(repoScopedMetadata(inSession(), { command }, alpha)).toMatchObject(inBeta);
    });

    it("attributes a shell command that entered a folder outside every repository to none", () => {
      expect(repoScopedMetadata(inSession(), { command: `cd "${plain}" && ls` }, alpha)).toEqual(
        noRepoKeys,
      );
    });

    it.each<[name: string, input: Record<string, string>]>([
      ["a path in no repository", { command: `ls "${join(plain, "x.txt")}"` }],
      ["a system path", { command: "cat /etc/hosts" }],
      ["a folder nothing sits at", { command: `cd "${missing}" && ls` }],
      ["a git -C folder nothing sits at", { command: `git -C "${missing}" log` }],
      ["a Grep regex that looks like a path", { pattern: "/api/v1/users" }],
      ["a Glob pattern outside every repository", { pattern: `${plain}/*.txt` }],
      ["a relative Glob pattern", { pattern: "**/*.txt" }],
    ])("keeps the session repository for %s", (_name, input) => {
      expect(repoScopedMetadata(inSession(), input, alpha)).toMatchObject(staysInAlpha);
    });
  });

  it("reads a relative pattern as no path rather than against the hook's own folder", () => {
    expect(toolPathFromInput({ pattern: "src/**/*.ts" }, alpha)).toEqual({ namedAPath: false });
  });

  it("keeps the session repository's author on a tool naming a path nothing sits at", () => {
    const base = sessionScopedMetadata(noRepository, alpha);

    expect(repoScopedMetadata(base, { path: "notion/page/abc123" }, alpha)).toMatchObject({
      ls_attribution_identifier: "Alpha Owner",
    });
  });

  it("attributes a shell command to the repository it ran in", () => {
    expect(repoScopedMetadata(noRepository, { command: "ls -la" }, beta)).toMatchObject({
      ls_attribution_identifier: "Beta Owner",
    });
  });

  it("gives each tool its own repository rather than reusing the first one answered", () => {
    const attributed = { ...session, ls_attribution_identifier: "Alpha Owner" };

    expect(repoScopedMetadata(attributed, { file_path: betaSeed }, alpha)).toMatchObject(inBeta);
    expect(repoScopedMetadata(attributed, { file_path: join(plain, "x.txt") }, alpha)).toEqual({
      cwd: session.cwd,
      ls_integration: session.ls_integration,
    });
  });

  it("ignores git settings the session exported, which answer for the wrong directory", () => {
    vi.stubEnv("GIT_DIR", join(alpha, ".git"));
    vi.stubEnv("GIT_CEILING_DIRECTORIES", beta);

    // A ceiling only bites below a root, so the nested path is the one that proves the scrub.
    for (const path of [betaSeed, betaNested]) {
      expect(repoScopedMetadata(session, { file_path: path })).toMatchObject(inBeta);
    }
  });

  it("keeps a repository name the person pinned wherever a tool reaches", () => {
    vi.stubEnv("HOME", root);
    vi.stubEnv("USERPROFILE", root);
    vi.stubEnv("TRACE_TO_LANGSMITH", "true");
    vi.stubEnv("LANGSMITH_API_KEY", "lsv2_pt_fake_key_for_tests");
    vi.stubEnv("CC_LANGSMITH_METADATA", '{"ls_git_repo":"acme/pinned"}');
    const pinned = loadConfig({ cwd: alpha }).customMetadata;
    const uploaderBase = sessionScopedMetadata(pinned, alpha);
    const turnBase = turnScopedMetadata(uploaderBase, [{ file_path: alphaSeed }], alpha);

    for (const base of [pinned, uploaderBase, turnBase]) {
      for (const path of [alphaSeed, betaSeed, join(plain, "x.txt")]) {
        expect(repoScopedMetadata(base, { file_path: path }, alpha)).toMatchObject({
          ls_git_repo: "acme/pinned",
        });
      }
    }
    // Everything the person did not pin still follows the path.
    expect(repoScopedMetadata(pinned, { file_path: betaSeed }, alpha)).toMatchObject({
      ls_git_branch: "trunk-beta",
      ls_attribution_identifier: "Beta Owner",
    });
  });

  it("runs git once per repository however many of its paths a turn touches", () => {
    const first = repoScopedMetadata(session, { file_path: alphaSeed });
    const afterFirstPath = gitCommands().length;
    expect(afterFirstPath).toBeGreaterThan(0);

    for (const path of [nested, alphaSeed]) {
      expect(repoScopedMetadata(session, { file_path: path })).toEqual(first);
      expect(gitCommands()).toHaveLength(afterFirstPath);
    }
  });
});

describe("turnScopedMetadata", () => {
  const pathless = { command: "ls -la" };
  const outside = { file_path: join(plain, "x.txt") };
  const filledFromBeta = { ...noRepository, ...everythingBetaReveals };

  type TurnCase = [name: string, base: Row, inputs: unknown[], want: Row];

  it.each<TurnCase>([
    [
      "the repository its first tool lands in",
      noRepository,
      [{ file_path: betaSeed }, { file_path: alphaSeed }],
      filledFromBeta,
    ],
    [
      "the repository the first tool to land anywhere is in",
      noRepository,
      [pathless, outside, { file_path: betaSeed }],
      filledFromBeta,
    ],
  ])("gives the turn %s", (_name, base, inputs, want) => {
    expect(turnScopedMetadata(base, inputs, base.cwd as string)).toEqual(want);
  });
});

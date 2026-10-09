import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", { spy: true });

import { execSync } from "node:child_process";
import { createGitSandbox } from "./fixtures/git-sandbox.js";
import { loadConfig } from "./config.js";
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
const remoteless = makeRepo("remoteless repo", "trunk-local", "Local Owner");
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
const gitCommands = () => vi.mocked(execSync).mock.calls.map(([command]) => String(command));

// What loadConfig stamps for a session started outside every repository here.
const session = {
  cwd: "/somewhere/central",
  repository_name: "acme/session",
  repository_provider: "github",
  repository_url: "https://github.com/acme/session",
  git_branch: "session-branch",
  git_commit_sha: "0".repeat(40),
  ls_integration: "claude-code",
};
const noRepository = { cwd: session.cwd, ls_integration: session.ls_integration };
const inAlpha = { repository_name: "acme/alpha", ls_attribution_identifier: "Alpha Owner" };
const inBeta = { repository_name: "acme/beta" };
const everythingBetaReveals = {
  ...inBeta,
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
      { repository_name: "acme/alpha", git_branch: "side-branch" },
    ],
  ])("attributes %s", (_name, input, want, cwd) => {
    expect(repoScopedMetadata(session, input, cwd)).toMatchObject(want);
  });

  it.each<Case>([
    [
      "a repository with no recognized remote, which still has an author",
      { file_path: join(remoteless, "seed.txt") },
      {
        ...noRepository,
        git_branch: "trunk-local",
        git_commit_sha: git(remoteless, "rev-parse", "HEAD"),
        ls_attribution_identifier: "Local Owner",
      },
    ],
    ["a path git places in no repository", { file_path: join(plain, "x.txt") }, noRepository],
    ["an opaque identifier no file sits at", { path: "notion/page/abc123" }, session, beta],
    ["a broken submodule git cannot answer for", { file_path: join(submodule, "x.txt") }, session],
    ["a shell command run outside every repository", { command: "ls -la" }, noRepository, plain],
  ])("stamps exactly what %s accounts for", (_name, input, want, cwd) => {
    expect(repoScopedMetadata(session, input, cwd)).toEqual(want);
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

  it("adds only the author for a tool inside the session's own repository", () => {
    const base = { cwd: alpha, repository_name: "acme/alpha", git_branch: "trunk-alpha" };

    expect(repoScopedMetadata(base, { file_path: alphaSeed }, alpha)).toEqual({
      ...base,
      ls_attribution_identifier: "Alpha Owner",
    });
    expect(gitCommands().filter((command) => command.includes("remote"))).toEqual([]);
  });

  it("keeps a repository name the person pinned wherever a tool reaches", () => {
    vi.stubEnv("HOME", root);
    vi.stubEnv("USERPROFILE", root);
    vi.stubEnv("TRACE_TO_LANGSMITH", "true");
    vi.stubEnv("LANGSMITH_API_KEY", "lsv2_pt_fake_key_for_tests");
    vi.stubEnv("CC_LANGSMITH_METADATA", '{"repository_name":"acme/pinned"}');
    const pinned = loadConfig({ cwd: alpha }).customMetadata;

    for (const path of [alphaSeed, betaSeed, join(plain, "x.txt")]) {
      expect(repoScopedMetadata(pinned, { file_path: path }, alpha)).toMatchObject({
        repository_name: "acme/pinned",
      });
    }
    // Everything the person did not pin still follows the path.
    expect(repoScopedMetadata(pinned, { file_path: betaSeed }, alpha)).toMatchObject({
      git_branch: "trunk-beta",
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

  it("asks git nothing to place a path, so only naming a repository costs a process", () => {
    expect(repoScopedMetadata(session, { file_path: join(plain, "x.txt") })).toEqual(noRepository);
    expect(gitCommands()).toEqual([]);

    repoScopedMetadata(session, { file_path: alphaSeed }, alpha);
    expect(gitCommands()).toEqual(["git config user.name"]);
  });
});

describe("turnScopedMetadata", () => {
  const pathless = { command: "ls -la" };
  const outside = { file_path: join(plain, "x.txt") };
  const filledFromBeta = { ...noRepository, ...everythingBetaReveals };
  // A session sitting in a repository with no remote, so git resolves one it cannot name.
  const inRemoteless = {
    cwd: remoteless,
    git_branch: "trunk-local",
    git_commit_sha: git(remoteless, "rev-parse", "HEAD"),
    ls_integration: session.ls_integration,
  };

  type TurnCase = [name: string, base: Row, inputs: unknown[], want: Row];

  it.each<TurnCase>([
    [
      "the repository it already resolved, which has no remote to name it, and its author",
      inRemoteless,
      [{ file_path: betaSeed }],
      { ...inRemoteless, ls_attribution_identifier: "Local Owner" },
    ],
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

  it("gives the turn the same author its tools get, inside the session's own repository", () => {
    const base = { cwd: alpha, repository_name: "acme/alpha", git_branch: "trunk-alpha" };
    const author = { ls_attribution_identifier: "Alpha Owner" };

    expect(turnScopedMetadata(base, [{ file_path: alphaSeed }], alpha)).toEqual({
      ...base,
      ...author,
    });
    expect(repoScopedMetadata(base, { file_path: alphaSeed }, alpha)).toMatchObject(author);
  });

  it("keeps an author the person configured rather than the one git reports", () => {
    const base = { cwd: alpha, repository_name: "acme/alpha", ls_attribution_identifier: "Chosen" };

    expect(turnScopedMetadata(base, [{ file_path: alphaSeed }], alpha)).toEqual(base);
  });
});

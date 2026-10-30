import { join } from "node:path";
import { symlinkSync, writeFileSync } from "node:fs";
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

const sandbox = createGitSandbox("ls-repo-attribution-");
const { git, makeDir, makeRepo, root } = sandbox;

const alpha = makeRepo("alpha-repo", "trunk-alpha", "Alpha Owner", "git@github.com:acme/alpha.git");
const beta = makeRepo("beta-repo", "trunk-beta", "Beta Owner", "https://gitlab.com/acme/beta.git");
const plain = makeDir(root, "plain-folder");
makeRepo("~tilde-repo", "trunk-tilde", "Tilde Owner");
makeDir(alpha, "-");
makeDir(root, "undefined", "beta-repo");
makeDir(alpha, "[Z]");
makeDir(alpha, "#h");
const nested = join(makeDir(alpha, "sub dir"), "nested.txt");
const betaNested = join(makeDir(beta, "sub dir"), "nested.txt");
for (const path of [nested, betaNested]) writeFileSync(path, "nested\n");
const worktree = join(root, "alpha worktree");
git(alpha, "worktree", "add", "-b", "side-branch", worktree);
const submodule = makeDir(alpha, "broken submodule");
writeFileSync(join(submodule, ".git"), `gitdir: ${join(alpha, ".git", "modules", "gone")}\n`);

const alphaSeed = `${alpha}/seed.txt`;
const betaSeed = `${beta}/seed.txt`;
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

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("repoScopedMetadata", () => {
  // The first row pins every field; the rest cover each input key a tool may hide a
  // path under, since one left out silently attributes the call to the session.
  it.each<Case>([
    ["a file in another repository", { file_path: betaSeed }, everythingBetaReveals],
    ["a notebook path", { notebook_path: betaSeed }, inBeta],
    ["a bare path", { path: betaSeed }, inBeta],
    ["a relative directory", { cwd: "beta-repo" }, inBeta, root],
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
    const missing = `${root}/no-such-folder`;
    const attributes = (input: Record<string, string>, cwd: string, tool?: string) =>
      repoScopedMetadata(inSession(), input, cwd, tool);

    it.each<[name: string, input: Record<string, string>, tool?: string]>([
      ["git -C", { command: `git -C ${beta} log` }],
      ["a relative git -C", { command: "git -C ../beta-repo log" }],
      ["a leading cd", { command: `cd ${beta} && ls` }],
      ["a leading cd after spaces", { command: `  cd ${beta} && ls` }],
      ["a run of cds", { command: `cd ${alpha} && cd ${beta} && git status` }],
      ["a git -C after a cd", { command: `cd ${alpha} && git -C ${beta} log` }],
      ["every git -C in order", { command: `git -C ${alpha} -C ${beta} log` }],
      ["a git -c before git -C", { command: `git -c core.x=1 -C ${beta} log` }],
      ["a Glob pattern with a wildcard", { pattern: `${beta}/**/*.txt` }, "Glob"],
      ["a Glob pattern ending in a partial file name", { pattern: `${beta}/seed*` }, "Glob"],
    ])("attributes %s to the repository it names", (_name, input, tool) => {
      expect(attributes(input, alpha, tool)).toMatchObject(inBeta);
    });

    const afterEntering = [
      "cd -",
      "cd",
      "cd $HOME/x",
      `cd ${missing}`,
      "pushd x",
      "popd",
      "eval ls",
      "sh -c ls",
      "bash -c ls",
      "zsh -c ls",
      "echo $(pwd)",
      "echo `pwd`",
      "GIT_DIR=x ls",
      "GIT_WORK_TREE=x ls",
      "make -C sub",
      "git status |& cat",
      "ls --git-dir",
      "ls --work-tree",
      "ls --dir x",
      "ls --directory x",
      "ls --cwd x",
      "ls --prefix x",
      "tmux new-session -c x",
      "echo {a,b}",
      "echo {a,}",
      "source ./go.sh",
      "env ls",
      ". ./go.sh",
      "if :; then . ./set.sh; fi",
      "time . x",
      "! . x",
      "command . x",
      "builtin . x",
      "ls\nls",
      `git -C\t${alpha} log`,
    ].map((tail) => `cd ${beta} && ${tail}`);

    const standalone = [
      `c""d ${alpha} && git status`,
      `c$'d' ${alpha} && git status`,
      `c$"d" ${alpha} && git status`,
      `pu$'shd' ${alpha} && git status`,
      `git "-C" ${alpha} status`,
      `git -\\C ${alpha} status`,
      `git -C${alpha} status`,
      "GIT_WORK_T''REE=x git status",
      `cd ${beta} &&`,
      "cd../beta-repo && ls",
      "cd  && ls",
      "cd - && ls",
      `cd "${beta}" && ls`,
      `git -C '${beta}' log`,
      `cd ${alpha}/[Z] && ls`,
      "cd #h && ls",
      `git -c core.pager="a -C ${alpha}" status`,
      "case x in x) . ./set.sh;; esac; git status",
      `cd ${betaSeed} && ls`,
      `cd ${alpha} && git --no-pager -C ${beta} log`,
      `cd ${plain} && ls`,
      `cd\t${alpha} && ls`,
      `\ufeffcd ${beta} && ls`,
    ];

    it.each([...afterEntering, ...standalone])("emits no repository for %j", (command) => {
      expect(attributes({ command }, alpha)).toEqual(noRepoKeys);
    });

    it.each([
      "git log -1 --format='%h %cd'",
      "git add ci/cd/x.yml",
      "git add . && git commit -m x",
      "find . -name x",
      "ls .",
      "grep -r foo . | head",
      "git log -- . | head",
    ])("keeps the call's own folder for %s", (command) => {
      expect(attributes({ command }, alpha)).toMatchObject(staysInAlpha);
    });

    it("reads a relative session folder as unknown", () => {
      vi.spyOn(process, "cwd").mockReturnValue(root);

      for (const callCwd of [".", undefined]) {
        expect(toolPathFromInput({ command: "cd beta-repo && ls" }, callCwd)).toEqual({
          namedAPath: false,
        });
      }
    });

    it.skipIf(process.platform === "win32")("resolves git -C through a symlink as git does", () => {
      const link = `${root}/link-to-sub`;
      symlinkSync(join(alpha, "sub dir"), link);

      expect(attributes({ command: `git -C ${link}/.. log` }, plain)).toMatchObject(staysInAlpha);
      expect(attributes({ command: `cd ${link}/.. && ls` }, plain)).toEqual(noRepoKeys);
    });

    it("resolves a relative git -C against the folder a cd entered", () => {
      const command = "cd alpha-repo && git -C ../beta-repo log";

      expect(attributes({ command }, root)).toMatchObject(inBeta);
    });

    it("reads an unquoted ~ as the person's home but a quoted one as text", () => {
      vi.stubEnv("HOME", root);
      vi.stubEnv("USERPROFILE", root);

      for (const command of ["cd ~/~tilde-repo && ls", "git -C ~/~tilde-repo log"]) {
        expect(attributes({ command }, plain)).toMatchObject({ ls_git_branch: "trunk-tilde" });
      }
      for (const command of [
        'cd "~/~tilde-repo"',
        "git -C '~/~tilde-repo' log",
        "cd ~tilde-repo",
      ]) {
        expect(attributes({ command }, plain)).toEqual(noRepoKeys);
      }
      expect(attributes({ command: "cd ~tilde-repo" }, root)).toEqual(noRepoKeys);
    });

    it.each<[name: string, input: Record<string, string>, tool?: string]>([
      ["a Grep regex given as a path", { pattern: betaSeed }, "Grep"],
      ["a Glob pattern outside every repository", { pattern: `${plain}/*.txt` }, "Glob"],
      ["a relative Glob pattern", { pattern: "**/*.txt" }, "Glob"],
    ])("keeps the session repository for %s", (_name, input, tool) => {
      expect(attributes(input, alpha, tool)).toMatchObject(staysInAlpha);
    });
  });

  it("reads a relative pattern as no path rather than against the hook's own folder", () => {
    vi.spyOn(process, "cwd").mockReturnValue(alpha);

    expect(toolPathFromInput({ pattern: "seed*" }, alpha, "Glob")).toEqual({ namedAPath: false });
  });

  it("reads a relative cd as no path when the session folder is unknown", () => {
    vi.spyOn(process, "cwd").mockReturnValue(root);

    expect(toolPathFromInput({ command: 'cd "beta-repo" && ls' })).toEqual({ namedAPath: false });
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
    const turnBase = turnScopedMetadata(uploaderBase, [{ input: { file_path: alphaSeed } }], alpha);

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

  it("does not label a turn from the folder a command that names none ran in", () => {
    const tools = [{ input: { command: "ls" }, cwd: beta }];

    expect(turnScopedMetadata(noRepository, tools, root)).toEqual(noRepository);
  });

  it("reads a Glob pattern by the tool's name", () => {
    const tools = [{ input: { pattern: join(beta, "**") }, name: "Glob" }];

    expect(turnScopedMetadata(noRepository, tools, root)).toEqual(filledFromBeta);
  });

  it("reads a relative path against the session folder when its tool has none", () => {
    const tools = [{ input: { file_path: "beta-repo/seed.txt" } }];

    expect(turnScopedMetadata(noRepository, tools, root)).toEqual(filledFromBeta);
  });

  it("reads a relative path against the folder its own tool ran in", () => {
    const tools = [{ input: { file_path: "seed.txt" }, cwd: beta }];

    expect(turnScopedMetadata(noRepository, tools, root)).toEqual(filledFromBeta);
  });

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
    const tools = inputs.map((input) => ({ input }));

    expect(turnScopedMetadata(base, tools, base.cwd as string)).toEqual(want);
  });
});

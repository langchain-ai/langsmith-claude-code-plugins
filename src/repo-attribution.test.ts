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

const sandbox = createGitSandbox("ls repo attribution ");
const { git, makeDir, makeRepo, root } = sandbox;

const alpha = makeRepo("alpha repo", "trunk-alpha", "Alpha Owner", "git@github.com:acme/alpha.git");
const beta = makeRepo("beta repo", "trunk-beta", "Beta Owner", "https://gitlab.com/acme/beta.git");
const plain = makeDir(root, "plain folder");
makeRepo("~tilde-repo", "trunk-tilde", "Tilde Owner");
makeDir(alpha, "-");
makeDir(root, "undefined", "beta repo");
makeDir(alpha, "$ROOT");
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

    it.each<[name: string, input: Record<string, string>, tool?: string]>([
      ["git -C with a quoted folder", { command: `git -C "${beta}" log` }],
      ["git -C with a relative folder", { command: "git -C '../beta repo' log" }],
      ["a leading cd into a quoted folder", { command: `cd "${beta}" && ls` }],
      ["a relative cd", { command: 'cd "../beta repo" && ls' }],
      ["a run of cds", { command: `cd "${alpha}" && cd "${beta}" && git status` }],
      ["a cd alone", { command: `cd "${beta}"` }],
      ["a git -C after a cd", { command: `cd "${alpha}" && git -C "${beta}" log` }],
      ["every git -C in order", { command: `git -C "${alpha}" -C "${beta}" log` }],
      ["a relative git -C after another", { command: `git -C "${root}" -C "beta repo" log` }],
      ["a git -c before git -C", { command: `git -c core.x=1 -C "${beta}" log` }],
      ["a git -c after a cd", { command: `cd "${alpha}" && git -c core.x=1 -C "${beta}" log` }],
      ["a Glob pattern with a wildcard", { pattern: `${beta}/**/*.txt` }, "Glob"],
      ["a Glob pattern ending in a partial file name", { pattern: `${beta}/seed*` }, "Glob"],
    ])("attributes %s to the repository it names", (_name, input, tool) => {
      expect(repoScopedMetadata(inSession(), input, alpha, tool)).toMatchObject(inBeta);
    });

    it.each<[name: string, command: string]>([
      ["a cd word", `cd "${beta}" && cd -`],
      ["a pushd word", `cd "${beta}" && pushd x`],
      ["a popd word", `cd "${beta}" && popd`],
      ["eval", `cd "${beta}" && eval ls`],
      ["sh -c", `cd "${beta}" && sh -c ls`],
      ["bash -c", `cd "${beta}" && bash -c ls`],
      ["zsh -c", `cd "${beta}" && zsh -c ls`],
      ["a substitution", `cd "${beta}" && echo $(pwd)`],
      ["a backtick", `cd "${beta}" && echo \`pwd\``],
      ["GIT_DIR", `cd "${beta}" && GIT_DIR=x ls`],
      ["GIT_WORK_TREE", `cd "${beta}" && GIT_WORK_TREE=x ls`],
      ["a -C option", `cd "${beta}" && make -C sub`],
      ["--git-dir", `cd "${beta}" && ls --git-dir`],
      ["--work-tree", `cd "${beta}" && ls --work-tree`],
      ["a newline", `cd "${beta}" && ls\nls`],
      ["a nested bash -c", `cd "${beta}" && bash -c "cd ${alpha} && git log"`],
      ["a cd in a substitution", `cd "${beta}" && echo "$(cd ${alpha} && git log)"`],
      ["a cd hidden between apostrophes", `cd "${beta}" && echo it's; cd "${alpha}"; echo don't`],
      ["a backslash cd", `cd "${beta}" && \\cd "${alpha}"`],
      ["a cd after an assignment", `cd "${beta}" && FOO=1 cd "${alpha}"`],
      ["a cd in a case", `cd "${beta}" && case x in x) cd "${alpha}";; esac`],
      ["a quoted cd", `cd "${beta}" && 'cd' "${alpha}"`],
      ["a cd into a variable", `cd "${beta}" && cd $HOME/x`],
      ["a cd into a variable inside quotes", `cd "$ROOT" && ls`],
      ["a cd with an escaped space", `cd "${beta}" && cd ${alpha.replaceAll(" ", "\\ ")}`],
      ["a cd into nothing", `cd "${beta}" && cd "${missing}" && ls`],
      ["a cd into a file", `cd "${betaSeed}" && ls`],
      ["a git -C into nothing", `git -C "${missing}" log`],
      ["a git -C into a variable", `git -C "$REPO" log`],
      ["a git option before -C", `cd "${alpha}" && git --no-pager -C "${beta}" log`],
      ["a second git -C", `git -C "${beta}" pull && git -C "${alpha}" pull`],
    ])("emits no repository when a command has %s", (_name, command) => {
      expect(repoScopedMetadata(inSession(), { command }, alpha)).toEqual(noRepoKeys);
    });

    it.each<[name: string, command: string]>([
      ["a cd in a format string", "git log -1 --format='%h %cd'"],
      ["a cd in a path", "git add ci/cd/x.yml"],
    ])("keeps the call's own folder for %s", (_name, command) => {
      expect(repoScopedMetadata(inSession(), { command }, alpha)).toMatchObject(staysInAlpha);
    });

    it("reads leading whitespace before a cd", () => {
      expect(
        repoScopedMetadata(inSession(), { command: `  cd "${beta}" && ls` }, alpha),
      ).toMatchObject(inBeta);
    });

    it("reads a relative session folder as unknown", () => {
      vi.spyOn(process, "cwd").mockReturnValue(root);

      for (const callCwd of [".", undefined]) {
        expect(toolPathFromInput({ command: 'cd "beta repo" && ls' }, callCwd)).toEqual({
          namedAPath: false,
        });
      }
    });

    it.skipIf(process.platform === "win32")("resolves git -C through a symlink as git does", () => {
      const link = join(root, "link to sub");
      symlinkSync(join(alpha, "sub dir"), link);

      expect(
        repoScopedMetadata(inSession(), { command: `git -C "${link}/.." log` }, plain),
      ).toMatchObject(staysInAlpha);
      expect(repoScopedMetadata(inSession(), { command: `cd "${link}/.." && ls` }, plain)).toEqual(
        noRepoKeys,
      );
    });

    it.skipIf(process.platform === "win32")("keeps a backslash inside quotes", () => {
      const odd = makeRepo("odd\\name", "trunk-odd", "Odd Owner", "git@github.com:acme/odd.git");

      expect(
        repoScopedMetadata(inSession(), { command: `cd "${odd}" && ls` }, plain),
      ).toMatchObject({ ls_git_repo: "acme/odd" });
    });

    it("resolves a relative git -C against the folder a cd entered", () => {
      const command = 'cd "alpha repo" && git -C "../beta repo" log';

      expect(repoScopedMetadata(inSession(), { command }, root)).toMatchObject(inBeta);
    });

    it("does not read another user's home as a folder next to the session's", () => {
      expect(repoScopedMetadata(inSession(), { command: "cd ~tilde-repo && ls" }, root)).toEqual(
        noRepoKeys,
      );
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

    it("attributes a shell command that entered a folder outside every repository to none", () => {
      expect(repoScopedMetadata(inSession(), { command: `cd "${plain}" && ls` }, alpha)).toEqual(
        noRepoKeys,
      );
    });

    it.each<[name: string, input: Record<string, string>, tool?: string]>([
      ["a commit message naming a path", { command: `git commit -m "see ${betaSeed}"` }],
      ["an echo naming a path", { command: `echo "${betaSeed}"` }],
      ["a curl body naming a path", { command: `curl -d "${betaSeed}" http://localhost:1` }],
      ["a docker volume that looks like a drive", { command: "docker run -v x:/data image" }],
      ["a variable that looks like a drive path", { command: "PATH=C:\\tools ls" }],
      ["a path in no repository", { command: `ls "${join(plain, "x.txt")}"` }],
      ["a Grep regex given as a path", { pattern: betaSeed }, "Grep"],
      ["a Glob pattern outside every repository", { pattern: `${plain}/*.txt` }, "Glob"],
      ["a relative Glob pattern", { pattern: "**/*.txt" }, "Glob"],
    ])("keeps the session repository for %s", (_name, input, tool) => {
      expect(repoScopedMetadata(inSession(), input, alpha, tool)).toMatchObject(staysInAlpha);
    });
  });

  it("reads a relative pattern as no path rather than against the hook's own folder", () => {
    vi.spyOn(process, "cwd").mockReturnValue(alpha);

    expect(toolPathFromInput({ pattern: "seed*" }, alpha, "Glob")).toEqual({ namedAPath: false });
  });

  it("reads a relative cd as no path when the session folder is unknown", () => {
    vi.spyOn(process, "cwd").mockReturnValue(root);

    expect(toolPathFromInput({ command: 'cd "beta repo" && ls' })).toEqual({ namedAPath: false });
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

import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { githubLoginFromHostsFile } from "./gh-config.js";
import { getGitUserName } from "../config.js";
import { createGitSandbox } from "../fixtures/git-sandbox.js";

const root = mkdtempSync(join(tmpdir(), "ls gh config "));

function configDir(name: string, hosts?: string): string {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  if (hosts !== undefined) writeFileSync(join(dir, "hosts.yml"), hosts);
  return dir;
}

const oneAccount = "github.com:\n    git_protocol: https\n    user: ejaimez14\n";

beforeEach(() => vi.unstubAllEnvs());
afterEach(() => vi.unstubAllEnvs());
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("the GitHub login on disk", () => {
  it("reads the login the command line tool stored", () => {
    vi.stubEnv("GH_CONFIG_DIR", configDir("signed in", oneAccount));
    expect(githubLoginFromHostsFile()).toBe("ejaimez14");
  });

  it("answers with nothing when no file is there", () => {
    vi.stubEnv("GH_CONFIG_DIR", configDir("never signed in"));
    expect(githubLoginFromHostsFile()).toBeUndefined();
  });

  it("answers with nothing when the file makes no sense", () => {
    vi.stubEnv("GH_CONFIG_DIR", configDir("garbage", "\u0000not yaml at all\n[[[\n"));
    expect(githubLoginFromHostsFile()).toBeUndefined();
  });

  it("answers with nothing when the file cannot be read", () => {
    const dir = configDir("locked", oneAccount);
    chmodSync(join(dir, "hosts.yml"), 0o000);
    vi.stubEnv("GH_CONFIG_DIR", dir);
    expect(githubLoginFromHostsFile()).toBeUndefined();
    chmodSync(join(dir, "hosts.yml"), 0o600);
  });

  it("prefers github.com over an enterprise server in the same file", () => {
    const hosts = "ghe.acme.test:\n    user: work-account\n" + "github.com:\n    user: ejaimez14\n";
    vi.stubEnv("GH_CONFIG_DIR", configDir("two hosts", hosts));
    expect(githubLoginFromHostsFile()).toBe("ejaimez14");
  });

  it("uses an enterprise server when it is the only host", () => {
    vi.stubEnv(
      "GH_CONFIG_DIR",
      configDir("enterprise", "ghe.acme.test:\n    user: work-account\n"),
    );
    expect(githubLoginFromHostsFile()).toBe("work-account");
  });

  it("picks the signed-in account rather than one of the others listed", () => {
    const hosts =
      "github.com:\n" +
      "    users:\n" +
      "        other-account:\n" +
      "            oauth_token: x\n" +
      "        ejaimez14:\n" +
      "            oauth_token: y\n" +
      "    user: ejaimez14\n";
    vi.stubEnv("GH_CONFIG_DIR", configDir("two accounts", hosts));
    expect(githubLoginFromHostsFile()).toBe("ejaimez14");
  });
});

describe("the name a trace is labelled with", () => {
  const sandbox = createGitSandbox("ls gh fallback ");
  const named = sandbox.makeRepo("named repo", "trunk-named", "Erick Jaimez");
  const nameless = sandbox.makeRepo("nameless repo", "trunk-nameless", "Temporary");
  sandbox.git(nameless, "config", "--unset", "user.name");
  const emptyGlobal = join(sandbox.root, "empty global config");
  writeFileSync(emptyGlobal, "");

  beforeEach(() => {
    vi.stubEnv("GIT_CONFIG_GLOBAL", emptyGlobal);
    vi.stubEnv("GIT_CONFIG_SYSTEM", emptyGlobal);
    vi.stubEnv("GH_CONFIG_DIR", configDir("labelling", oneAccount));
  });

  afterAll(() => sandbox.remove());

  it("keeps the git name when the person set one", () => {
    expect(getGitUserName(named)).toBe("Erick Jaimez");
  });

  it("falls back to the GitHub login when the git name is empty", () => {
    expect(getGitUserName(nameless)).toBe("ejaimez14");
  });
});

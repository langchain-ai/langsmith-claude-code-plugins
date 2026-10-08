import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearGithubLoginCache, githubLogin } from "./gh-login.js";
import { getGitUserName } from "../config.js";
import { createGitSandbox } from "../fixtures/git-sandbox.js";
import { createGhSandbox } from "../fixtures/gh-sandbox.js";
import { GH_LOGIN_RETRY_AFTER_MS, GH_LOGIN_TIMEOUT_MS } from "../constants.js";

const gh = createGhSandbox("ls gh login ");
const { emptyBin, fakeGh, prints } = gh;

const statePath = gh.stateFile("shared");
const marker = gh.markerFor(statePath);

function markerSaying(failed: string): void {
  writeFileSync(marker, JSON.stringify({ failed }));
}

beforeEach(() => {
  vi.unstubAllEnvs();
  clearGithubLoginCache();
  rmSync(marker, { force: true });
  vi.stubEnv("STATE_FILE", statePath);
});

afterAll(() => gh.remove());

describe("the GitHub login the tool reports", () => {
  it("answers with nothing when the tool is not installed", () => {
    vi.stubEnv("PATH", emptyBin("no tool"));
    expect(githubLogin()).toBeUndefined();
  });

  it.each([
    ["the word for no account", "null"],
    ["a run longer than any login", "x".repeat(60)],
    ["something starting with a dash", "-rf"],
  ])("answers with nothing when the tool prints %s", (name, printed) => {
    vi.stubEnv("PATH", fakeGh(name, prints(printed)));
    expect(githubLogin()).toBeUndefined();
  });

  it("gives up on a tool that never answers", () => {
    vi.stubEnv("PATH", fakeGh("hanging", "sleep 30"));
    const started = Date.now();
    expect(githubLogin()).toBeUndefined();
    const waited = Date.now() - started;
    expect(waited).toBeGreaterThanOrEqual(GH_LOGIN_TIMEOUT_MS - 500);
    expect(waited).toBeLessThan(20_000);
  }, 40_000);

  it("asks once however many times it is needed", () => {
    const counter = join(gh.root, "times asked");
    rmSync(counter, { force: true });
    vi.stubEnv("PATH", fakeGh("counting", `echo x >> "${counter}"\n${prints("ejaimez14")}`));
    expect(githubLogin()).toBe("ejaimez14");
    expect(githubLogin()).toBe("ejaimez14");
    expect(readFileSync(counter, "utf-8").trim().split("\n")).toHaveLength(1);
  });
});

describe("the day of quiet after a failure", () => {
  it("writes down a failure", () => {
    vi.stubEnv("PATH", emptyBin("no tool"));
    githubLogin();
    expect(existsSync(marker)).toBe(true);
  });

  it("leaves the tool alone for the rest of the day", () => {
    const counter = join(gh.root, "times asked after failing");
    rmSync(counter, { force: true });
    markerSaying(new Date().toISOString());
    vi.stubEnv("PATH", fakeGh("quiet", `echo x >> "${counter}"\n${prints("ejaimez14")}`));
    expect(githubLogin()).toBeUndefined();
    expect(existsSync(counter)).toBe(false);
  });

  it("asks again once the day has passed", () => {
    markerSaying(new Date(Date.now() - GH_LOGIN_RETRY_AFTER_MS - 1000).toISOString());
    vi.stubEnv("PATH", fakeGh("a day later", prints("ejaimez14")));
    expect(githubLogin()).toBe("ejaimez14");
  });

  it("asks again when the note was written in the future", () => {
    markerSaying(new Date(Date.now() + GH_LOGIN_RETRY_AFTER_MS).toISOString());
    vi.stubEnv("PATH", fakeGh("clock moved", prints("ejaimez14")));
    expect(githubLogin()).toBe("ejaimez14");
  });

  it("asks again when the note cannot be read", () => {
    writeFileSync(marker, "{ this is not json");
    vi.stubEnv("PATH", fakeGh("unreadable note", prints("ejaimez14")));
    expect(githubLogin()).toBe("ejaimez14");
  });
});

describe("the name a trace is labelled with", () => {
  const sandbox = createGitSandbox("ls gh fallback ");
  const named = sandbox.makeRepo("named repo", "trunk-named", "Erick Jaimez");
  const nameless = sandbox.makeRepo("nameless repo", "trunk-nameless", "Temporary");
  sandbox.git(nameless, "config", "--unset", "user.name");
  const emptyGitConfig = join(sandbox.root, "empty git config");
  writeFileSync(emptyGitConfig, "");
  const asked = join(gh.root, "asked github");

  beforeEach(() => {
    rmSync(asked, { force: true });
    vi.stubEnv("GIT_CONFIG_GLOBAL", emptyGitConfig);
    vi.stubEnv("GIT_CONFIG_SYSTEM", emptyGitConfig);
    vi.stubEnv("PATH", fakeGh("labelling", `touch "${asked}"\n${prints("ejaimez14")}`));
  });

  afterAll(() => sandbox.remove());

  it("keeps the git name without asking GitHub at all", () => {
    expect(getGitUserName(named)).toBe("Erick Jaimez");
    expect(existsSync(asked)).toBe(false);
  });

  it("falls back to the GitHub login when the git name is empty", () => {
    expect(getGitUserName(nameless)).toBe("ejaimez14");
  });
});

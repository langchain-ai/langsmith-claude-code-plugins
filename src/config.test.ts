import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadConfig, pinnedRepositoryKeys } from "./config.js";
import { execFileSync } from "node:child_process";

vi.mock("node:child_process", { spy: true });
vi.mock("node:fs", { spy: true });
vi.mock("node:os", { spy: true });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(readFileSync).mockReset();
  vi.mocked(execFileSync).mockReset();
});

describe("loadConfig", () => {
  const originalEnv = { ...process.env };
  let tmpHome: string;
  const cwd = "/tmp/langsmith-claude-code-plugins/cwd";

  beforeEach(() => {
    // Clear relevant env vars
    delete process.env.TRACE_TO_LANGSMITH;
    delete process.env.CC_LANGSMITH_DEFAULT_MUTED;
    delete process.env.CC_LANGSMITH_API_KEY;
    delete process.env.LANGSMITH_API_KEY;
    delete process.env.CC_LANGSMITH_PROJECT;
    delete process.env.LANGSMITH_ENDPOINT;
    delete process.env.STATE_FILE;
    delete process.env.CC_LANGSMITH_DEBUG;
    delete process.env.CC_LANGSMITH_RUNS_ENDPOINTS;
    delete process.env.CC_LANGSMITH_METADATA;
    delete process.env.CC_LANGSMITH_REDACT;
    delete process.env.CC_LANGSMITH_REDACT_EXTRA;

    // Isolate home-directory reads on every platform.
    tmpHome = mkdtempSync(join(tmpdir(), "ls-cc-test-"));
    vi.mocked(homedir).mockReturnValue(tmpHome);
    // Omitted-cwd calls must not read config from the developer's checkout.
    vi.spyOn(process, "cwd").mockReturnValue(tmpHome);
    process.env.HOME = tmpHome;
    delete process.env.USERPROFILE;
  });

  afterEach(() => {
    // Restore
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
    if (tmpHome) {
      rmSync(tmpHome, { recursive: true, force: true });
    }
  });

  describe("config files", () => {
    let projectDir: string;
    let paths: string[];

    beforeEach(() => {
      projectDir = join(tmpHome, "project");
      mkdirSync(join(projectDir, ".claude"), { recursive: true });
      mkdirSync(join(tmpHome, ".claude"));
      paths = [
        join(projectDir, ".claude", "langsmith.json"),
        join(projectDir, "langsmith-plugins.json"),
        join(tmpHome, ".claude", "langsmith.json"),
        join(tmpHome, ".langsmith-plugins.json"),
      ];
      vi.mocked(execFileSync).mockReturnValue("");
    });

    const settings = [
      { field: "enabled", envName: "TRACE_TO_LANGSMITH", restrictive: false },
      { field: "defaultMuted", envName: "CC_LANGSMITH_DEFAULT_MUTED", restrictive: true },
    ] as const;

    it("reads the project .claude file, the project root file, the user .claude file and the user root file in that order", () => {
      const names = ["claude", "root", "user", "home"];
      names.forEach((name, i) => writeFileSync(paths[i], JSON.stringify({ project: name })));
      names.forEach((name, i) => {
        expect(loadConfig({ cwd: projectDir }).project).toBe(name);
        rmSync(paths[i]);
      });
      expect(loadConfig({ cwd: projectDir }).project).toBe("claude-code");
    });

    it.each(
      settings.flatMap((setting) =>
        ["true", "TRUE", "false", " false ", "1", "yes", ""].map((env) => ({ ...setting, env })),
      ),
    )("$field resolves the environment value $env over a contradicting file", (setting) => {
      const { field, envName, restrictive, env } = setting;
      const parsed = env.toLowerCase() === "true" || (env.toLowerCase() !== "false" && restrictive);
      process.env[envName] = env;
      writeFileSync(paths[0], JSON.stringify({ [field]: !parsed }));
      expect(loadConfig({ cwd: projectDir })[field]).toBe(parsed);
    });

    it.each(settings.flatMap((setting) => [0, 1, 2, 3].map((scope) => ({ ...setting, scope }))))(
      "$field fails closed when the file at scope $scope is malformed",
      ({ field, envName, restrictive, scope }) => {
        paths.forEach((path, i) =>
          writeFileSync(path, i < scope ? "{}" : JSON.stringify({ [field]: !restrictive })),
        );
        writeFileSync(paths[scope], "{");
        expect(loadConfig({ cwd: projectDir })[field]).toBe(restrictive);
        process.env[envName] = String(!restrictive);
        expect(loadConfig({ cwd: projectDir })[field]).toBe(!restrictive);
      },
    );

    it("falls through absent switches in each file independently", () => {
      writeFileSync(paths[0], '{"enabled":true}');
      writeFileSync(paths[2], '{"defaultMuted":true}');
      expect(loadConfig({ cwd: projectDir })).toMatchObject({ enabled: true, defaultMuted: true });
      writeFileSync(paths[0], "{}");
      expect(loadConfig({ cwd: projectDir })).toMatchObject({ enabled: false, defaultMuted: true });
    });

    it("keeps visible project and hidden home config distinct when cwd equals home", () => {
      writeFileSync(
        paths[3],
        '{"enabled":true,"defaultMuted":true,"api_key":"hidden-key","project":"hidden-home"}',
      );
      const visibleRoot = join(tmpHome, "langsmith-plugins.json");
      writeFileSync(visibleRoot, '{"enabled":false,"project":"visible-project"}');
      expect(loadConfig({ cwd: tmpHome })).toMatchObject({
        enabled: false,
        defaultMuted: true,
        apiKey: "hidden-key",
        project: "visible-project",
      });
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        enabled: true,
        defaultMuted: true,
        apiKey: "hidden-key",
        project: "hidden-home",
      });
    });

    it.each([
      ["langsmith.json beside the project", () => join(projectDir, "langsmith.json")],
      ["langsmith.json in the home folder", () => join(tmpHome, "langsmith.json")],
      ["langsmith-plugins.json in the home folder", () => join(tmpHome, "langsmith-plugins.json")],
    ])("ignores %s", (_name, locate) => {
      const ignored = locate();
      writeFileSync(ignored, '{"enabled":true,"defaultMuted":true,"api_key":"old-key"}');
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        enabled: false,
        defaultMuted: false,
        apiKey: "",
      });
      expect(vi.mocked(readFileSync).mock.calls.some(([path]) => path === ignored)).toBe(false);
    });

    it("looks only in the given folder, or the working folder when none is given", () => {
      writeFileSync(paths[1], '{"enabled":true,"defaultMuted":true}');
      vi.spyOn(process, "cwd").mockReturnValue(projectDir);
      expect(loadConfig()).toMatchObject({ enabled: true, defaultMuted: true });
      const child = join(projectDir, "child");
      mkdirSync(child);
      expect(loadConfig({ cwd: child })).toMatchObject({ enabled: false, defaultMuted: false });
    });

    it("reads the user files from the operating system home when the home variables are absent", () => {
      delete process.env.HOME;
      delete process.env.USERPROFILE;
      writeFileSync(paths[2], '{"enabled":true}');
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        enabled: true,
        stateFilePath: join(tmpHome, ".claude", "state", "langsmith_state.json"),
      });
      expect(homedir).toHaveBeenCalled();
    });

    it("loads live file fields, merges metadata, and preserves original env overrides and SDK tuples", () => {
      writeFileSync(
        paths[2],
        JSON.stringify({
          api_key: "user-key",
          api_url: "user-url",
          project: "user-project",
          metadata: { user: true, nested: { user: true } },
        }),
      );
      writeFileSync(
        paths[1],
        JSON.stringify({ api_url: "root-url", metadata: { root: true, nested: { root: true } } }),
      );
      writeFileSync(
        paths[0],
        JSON.stringify({
          enabled: true,
          defaultMuted: true,
          project: "file-project",
          replicas: [{ api_url: "file-url", api_key: "replica-key", project: "replica" }],
          metadata: { harness: true },
          redact: false,
          redact_extra_rules: [{ pattern: "private", replace: "hidden" }],
          claude: null,
        }),
      );
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        enabled: true,
        defaultMuted: true,
        apiKey: "user-key",
        apiBaseUrl: "root-url",
        project: "file-project",
        replicas: [{ apiUrl: "file-url", apiKey: "replica-key", projectName: "replica" }],
        customMetadata: { user: true, root: true, harness: true, nested: { root: true } },
        redact: false,
        redactExtraRules: [{ pattern: "private", replace: "hidden" }],
      });
      process.env.CC_LANGSMITH_API_KEY = "";
      process.env.LANGSMITH_API_KEY = "ignored";
      process.env.LANGSMITH_ENDPOINT = "";
      process.env.CC_LANGSMITH_PROJECT = "";
      process.env.CC_LANGSMITH_REDACT = "true";
      process.env.CC_LANGSMITH_REDACT_EXTRA = "[]";
      process.env.CC_LANGSMITH_METADATA = '{"nested":{"env":true}}';
      const tuples = [["legacy-project", { extra: { metadata: { legacy: true } } }]];
      process.env.CC_LANGSMITH_RUNS_ENDPOINTS = JSON.stringify(tuples);
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        apiKey: "",
        apiBaseUrl: "",
        project: "",
        replicas: tuples,
        redact: true,
        redactExtraRules: [],
        customMetadata: { user: true, root: true, harness: true, nested: { env: true } },
      });
      process.env.CC_LANGSMITH_RUNS_ENDPOINTS = "[]";
      expect(loadConfig({ cwd: projectDir }).replicas).toEqual([]);
      // Invalid env JSON keeps existing parser behavior and permits file fallback.
      process.env.CC_LANGSMITH_RUNS_ENDPOINTS = "{";
      expect(loadConfig({ cwd: projectDir }).replicas).toEqual([
        { apiUrl: "file-url", apiKey: "replica-key", projectName: "replica" },
      ]);
      writeFileSync(paths[0], '{"enabled":true,"api_key":"discard","metadata":null}');
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        enabled: false,
        defaultMuted: true,
        apiKey: "",
        apiBaseUrl: "",
      });
      delete process.env.CC_LANGSMITH_API_KEY;
      delete process.env.LANGSMITH_API_KEY;
      expect(loadConfig({ cwd: projectDir }).apiKey).toBe("user-key");
    });
  });

  it("reads CC_LANGSMITH_API_KEY first", () => {
    process.env.CC_LANGSMITH_API_KEY = "cc-key";
    process.env.LANGSMITH_API_KEY = "fallback-key";
    expect(loadConfig({ cwd }).apiKey).toBe("cc-key");
  });

  it("falls back to LANGSMITH_API_KEY", () => {
    process.env.LANGSMITH_API_KEY = "fallback-key";
    expect(loadConfig({ cwd }).apiKey).toBe("fallback-key");
  });

  it("returns empty string when no API key set", () => {
    expect(loadConfig({ cwd }).apiKey).toBe("");
  });

  it("defaults project to 'claude-code'", () => {
    expect(loadConfig({ cwd }).project).toBe("claude-code");
  });

  it("reads custom project name", () => {
    process.env.CC_LANGSMITH_PROJECT = "my-project";
    expect(loadConfig({ cwd }).project).toBe("my-project");
  });

  it("defaults API base URL", () => {
    expect(loadConfig({ cwd }).apiBaseUrl).toBe("https://api.smith.langchain.com");
  });

  it("reads custom API base URL", () => {
    process.env.LANGSMITH_ENDPOINT = "https://custom.api.com";
    expect(loadConfig({ cwd }).apiBaseUrl).toBe("https://custom.api.com");
  });

  it("reads custom state file path", () => {
    process.env.STATE_FILE = "/custom/state.json";
    expect(loadConfig({ cwd }).stateFilePath).toBe("/custom/state.json");
  });

  it("defaults debug to false", () => {
    expect(loadConfig({ cwd }).debug).toBe(false);
  });

  it("enables debug with 'true'", () => {
    process.env.CC_LANGSMITH_DEBUG = "true";
    expect(loadConfig({ cwd }).debug).toBe(true);
  });

  it("enables debug case-insensitively", () => {
    process.env.CC_LANGSMITH_DEBUG = "TRUE";
    expect(loadConfig({ cwd }).debug).toBe(true);
  });

  it("does not enable debug with other values", () => {
    process.env.CC_LANGSMITH_DEBUG = "1";
    expect(loadConfig({ cwd }).debug).toBe(false);
  });

  it("parses CC_LANGSMITH_RUNS_ENDPOINTS as JSON array", () => {
    process.env.CC_LANGSMITH_RUNS_ENDPOINTS = JSON.stringify([
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_workspace_a",
        projectName: "project-prod",
      },
    ]);
    const config = loadConfig({ cwd });
    expect(config.replicas).toBeDefined();
    expect(config.replicas).toHaveLength(1);
    expect(config.replicas?.[0]).toEqual({
      apiUrl: "https://api.smith.langchain.com",
      apiKey: "ls__key_workspace_a",
      projectName: "project-prod",
    });
  });

  it("parses multiple replicas from CC_LANGSMITH_RUNS_ENDPOINTS", () => {
    process.env.CC_LANGSMITH_RUNS_ENDPOINTS = JSON.stringify([
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_workspace_a",
        projectName: "project-prod",
      },
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_workspace_b",
        projectName: "project-staging",
        updates: { metadata: { environment: "staging" } },
      },
    ]);
    const config = loadConfig({ cwd });
    expect(config.replicas).toHaveLength(2);
    expect((config.replicas?.[1] as { updates?: unknown } | undefined)?.updates).toEqual({
      metadata: { environment: "staging" },
    });
  });

  it("returns undefined replicas when CC_LANGSMITH_RUNS_ENDPOINTS not set", () => {
    expect(loadConfig({ cwd }).replicas).toBeUndefined();
  });

  it("handles invalid JSON in CC_LANGSMITH_RUNS_ENDPOINTS gracefully", () => {
    const originalError = console.error;
    console.error = vi.fn();
    process.env.CC_LANGSMITH_RUNS_ENDPOINTS = "not valid json";
    const config = loadConfig({ cwd });
    // Should not throw and replicas should be undefined
    expect(config.replicas).toBeUndefined();
    console.error = originalError;
  });

  it("parses CC_LANGSMITH_METADATA as JSON object", () => {
    process.env.CC_LANGSMITH_METADATA = JSON.stringify({
      pr_url: "https://github.com/org/repo/pull/42",
      pr_author: "octocat",
    });
    const config = loadConfig({ cwd });
    expect(config.customMetadata).toMatchObject({
      pr_url: "https://github.com/org/repo/pull/42",
      pr_author: "octocat",
    });
    expect(config.customMetadata?.local_username).toEqual(expect.any(String));
  });

  it("populates customMetadata with identity fields when CC_LANGSMITH_METADATA not set", () => {
    const config = loadConfig({ cwd });
    // local_username always resolves (at minimum to "unknown")
    expect(config.customMetadata?.local_username).toEqual(expect.any(String));
  });

  it("handles invalid JSON in CC_LANGSMITH_METADATA gracefully", () => {
    const originalError = console.error;
    console.error = vi.fn();
    process.env.CC_LANGSMITH_METADATA = "not valid json";
    const config = loadConfig({ cwd });
    // Falls back to identity-only metadata
    expect(config.customMetadata).toMatchObject({ local_username: expect.any(String) });
    expect(config.customMetadata).not.toHaveProperty("anthropic_user_id");
    console.error = originalError;
  });

  it("rejects array CC_LANGSMITH_METADATA", () => {
    const originalError = console.error;
    console.error = vi.fn();
    process.env.CC_LANGSMITH_METADATA = '["not", "an", "object"]';
    const config = loadConfig({ cwd });
    expect(config.customMetadata).toMatchObject({ local_username: expect.any(String) });
    console.error = originalError;
  });

  it("rejects primitive CC_LANGSMITH_METADATA", () => {
    const originalError = console.error;
    console.error = vi.fn();
    process.env.CC_LANGSMITH_METADATA = '"just a string"';
    const config = loadConfig({ cwd });
    expect(config.customMetadata).toMatchObject({ local_username: expect.any(String) });
    console.error = originalError;
  });

  describe("secret redaction", () => {
    it("defaults redact to true", () => {
      expect(loadConfig({ cwd }).redact).toBe(true);
    });

    it.each(["false", "0", "no", "off", "FALSE", " Off "])(
      "disables redaction with %j (normalized)",
      (value) => {
        process.env.CC_LANGSMITH_REDACT = value;
        expect(loadConfig({ cwd }).redact).toBe(false);
      },
    );

    it.each(["true", "1", "yes", "on", ""])("keeps redaction on for %j", (value) => {
      process.env.CC_LANGSMITH_REDACT = value;
      expect(loadConfig({ cwd }).redact).toBe(true);
    });

    it("parses CC_LANGSMITH_REDACT_EXTRA into rules", () => {
      process.env.CC_LANGSMITH_REDACT_EXTRA = JSON.stringify([
        { pattern: "sk-[a-z0-9]+", replace: "[REDACTED]" },
        { pattern: "token=\\w+" },
      ]);
      expect(loadConfig({ cwd }).redactExtraRules).toEqual([
        { pattern: "sk-[a-z0-9]+", replace: "[REDACTED]" },
        { pattern: "token=\\w+" },
      ]);
    });

    it("returns undefined rules when CC_LANGSMITH_REDACT_EXTRA not set", () => {
      expect(loadConfig({ cwd }).redactExtraRules).toBeUndefined();
    });

    it("skips malformed rules but keeps valid ones", () => {
      process.env.CC_LANGSMITH_REDACT_EXTRA = JSON.stringify([
        { pattern: "ok" },
        { replace: "no pattern" }, // missing pattern
        { pattern: 123 }, // non-string pattern
        { pattern: "valid", replace: 5 }, // non-string replace
        { pattern: "(" }, // invalid regex
      ]);
      expect(loadConfig({ cwd }).redactExtraRules).toEqual([{ pattern: "ok" }]);
    });

    it("returns undefined when every rule is malformed", () => {
      process.env.CC_LANGSMITH_REDACT_EXTRA = JSON.stringify([{ replace: "x" }]);
      expect(loadConfig({ cwd }).redactExtraRules).toBeUndefined();
    });

    it("rejects a non-array CC_LANGSMITH_REDACT_EXTRA", () => {
      process.env.CC_LANGSMITH_REDACT_EXTRA = JSON.stringify({ pattern: "x" });
      expect(loadConfig({ cwd }).redactExtraRules).toBeUndefined();
    });

    it("handles invalid JSON in CC_LANGSMITH_REDACT_EXTRA gracefully", () => {
      process.env.CC_LANGSMITH_REDACT_EXTRA = "not valid json";
      expect(loadConfig({ cwd }).redactExtraRules).toBeUndefined();
    });
  });

  describe("Anthropic user ID", () => {
    it("includes anthropic_user_id from ~/.claude.json", () => {
      writeFileSync(
        join(tmpHome, ".claude.json"),
        JSON.stringify({ userID: "abc123hashed_user_id" }),
      );
      const config = loadConfig({ cwd });
      expect(config.customMetadata).toMatchObject({
        anthropic_user_id: "abc123hashed_user_id",
        local_username: expect.any(String),
      });
    });

    it("merges anthropic_user_id with CC_LANGSMITH_METADATA", () => {
      writeFileSync(join(tmpHome, ".claude.json"), JSON.stringify({ userID: "user-xyz" }));
      process.env.CC_LANGSMITH_METADATA = JSON.stringify({ pr_author: "octocat" });
      const config = loadConfig({ cwd });
      expect(config.customMetadata).toMatchObject({
        anthropic_user_id: "user-xyz",
        pr_author: "octocat",
        local_username: expect.any(String),
      });
    });

    it("user-supplied CC_LANGSMITH_METADATA overrides anthropic_user_id on conflict", () => {
      writeFileSync(join(tmpHome, ".claude.json"), JSON.stringify({ userID: "auto-id" }));
      process.env.CC_LANGSMITH_METADATA = JSON.stringify({ anthropic_user_id: "manual-id" });
      const config = loadConfig({ cwd });
      expect(config.customMetadata?.anthropic_user_id).toBe("manual-id");
    });

    it("omits anthropic_user_id when ~/.claude.json is missing", () => {
      // tmpHome is empty
      const config = loadConfig({ cwd });
      expect(config.customMetadata).not.toHaveProperty("anthropic_user_id");
      expect(config.customMetadata).toMatchObject({ local_username: expect.any(String) });
    });

    it("ignores non-string userID", () => {
      writeFileSync(join(tmpHome, ".claude.json"), JSON.stringify({ userID: 12345 }));
      expect(loadConfig().customMetadata).not.toHaveProperty("anthropic_user_id");
    });
  });

  describe("local username", () => {
    it("includes local_username in customMetadata", () => {
      const config = loadConfig({ cwd });
      const username = config.customMetadata?.local_username;
      expect(typeof username).toBe("string");
      expect((username as string).length).toBeGreaterThan(0);
    });

    it("user-supplied CC_LANGSMITH_METADATA overrides local_username on conflict", () => {
      process.env.CC_LANGSMITH_METADATA = JSON.stringify({ local_username: "custom-name" });
      const config = loadConfig({ cwd });
      expect(config.customMetadata?.local_username).toBe("custom-name");
    });
  });

  it("gives both names of a field the value the person set under either one", () => {
    const url = "https://github.com/langchain-ai/example.git";
    vi.mocked(execFileSync).mockImplementation(() => `origin\t${url} (fetch)`);
    process.env.CC_LANGSMITH_METADATA = JSON.stringify({ repository_name: "chosen/repo" });

    const config = loadConfig({ cwd: __dirname });

    expect(config.customMetadata).toMatchObject({
      repository_name: "chosen/repo",
      ls_git_repo: "chosen/repo",
    });
    expect(pinnedRepositoryKeys(config.customMetadata)).toContain("ls_git_repo");
  });

  describe("coding-agent-v1 contract metadata", () => {
    it("includes the working directory", () => {
      expect(loadConfig({ cwd }).customMetadata).toMatchObject({ cwd });
    });

    it("surfaces the hashed anthropic id as user_id (preferred) and keeps the compat alias", () => {
      writeFileSync(join(tmpHome, ".claude.json"), JSON.stringify({ userID: "hashed-123" }));
      const config = loadConfig({ cwd });
      expect(config.customMetadata).toMatchObject({
        user_id: "hashed-123",
        anthropic_user_id: "hashed-123", // DEPRECATED compat alias
      });
    });
  });
});

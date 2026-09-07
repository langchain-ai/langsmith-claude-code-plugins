import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadConfig, parseRepoName } from "./config.js";
import { execSync } from "node:child_process";

vi.mock("node:child_process", { spy: true });
vi.mock("node:fs", { spy: true });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(readFileSync).mockReset();
  vi.mocked(execSync).mockReset();
});

describe("loadConfig", () => {
  const originalEnv = { ...process.env };
  let tmpHome: string;
  const cwd = "/tmp/langsmith-claude-code-plugins/cwd";

  beforeEach(() => {
    // Clear relevant env vars
    delete process.env.TRACE_TO_LANGSMITH;
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

    // Point HOME at an empty temp dir so tests don't read the real ~/.claude.json.
    tmpHome = mkdtempSync(join(tmpdir(), "ls-cc-test-"));
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

  describe("master switch", () => {
    let projectDir: string;
    let projectPath: string;
    let userPath: string;

    beforeEach(() => {
      projectDir = join(tmpHome, "project");
      mkdirSync(join(projectDir, ".claude"), { recursive: true });
      mkdirSync(join(tmpHome, ".claude"));
      projectPath = join(projectDir, ".claude", "langsmith.json");
      userPath = join(tmpHome, ".claude", "langsmith.json");
      vi.mocked(execSync).mockReturnValue("");
    });

    it.each(
      [undefined, "true", "TRUE", "TrUe", "false", "FALSE", "", "1", "yes", " true "].flatMap(
        (env) =>
          [undefined, true, false].flatMap((project) =>
            [undefined, true, false].map((user) => ({
              env,
              project,
              user,
              expected:
                env !== undefined ? env.toLowerCase() === "true" : (project ?? user ?? false),
            })),
          ),
      ),
    )("env=$env project=$project user=$user -> $expected", ({ env, project, user, expected }) => {
      if (env !== undefined) process.env.TRACE_TO_LANGSMITH = env;
      if (project !== undefined) writeFileSync(projectPath, JSON.stringify({ enabled: project }));
      if (user !== undefined) writeFileSync(userPath, JSON.stringify({ enabled: user }));
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(expected);
    });

    it.each(
      ["project", "user"].flatMap((scope) =>
        [
          "",
          "{",
          "null",
          "[]",
          "true",
          "{}",
          '{"enabled":"true"}',
          '{"enabled":1}',
          '{"enabled":null}',
        ].map((raw) => ({ scope, raw })),
      ),
    )("fails closed for malformed $scope file: $raw", ({ scope, raw }) => {
      if (scope === "project") writeFileSync(userPath, '{"enabled":true}');
      writeFileSync(scope === "project" ? projectPath : userPath, raw);
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(false);
    });

    it.each(
      ["project", "user"].flatMap((scope) =>
        ["EACCES", "EPERM", "EIO", "EISDIR", "ENOTDIR"].map((code) => ({ scope, code })),
      ),
    )("fails closed on $scope read error $code", ({ scope, code }) => {
      const path = scope === "project" ? projectPath : userPath;
      writeFileSync(userPath, '{"enabled":true}');
      const read = vi.mocked(readFileSync).getMockImplementation()!;
      vi.mocked(readFileSync).mockImplementation((...args: Parameters<typeof readFileSync>) => {
        if (args[0] === path) throw Object.assign(new Error("unreadable"), { code });
        return read(...args);
      });
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(false);
    });

    it.each(["true", "false", ""])("env %j bypasses unreadable files", (env) => {
      process.env.TRACE_TO_LANGSMITH = env;
      const read = vi.mocked(readFileSync).getMockImplementation()!;
      vi.mocked(readFileSync).mockImplementation((...args: Parameters<typeof readFileSync>) => {
        if (args[0] === projectPath || args[0] === userPath)
          throw new Error("must not read switch files");
        return read(...args);
      });
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(env === "true");
      expect(
        vi
          .mocked(readFileSync)
          .mock.calls.some(([path]) => path === projectPath || path === userPath),
      ).toBe(false);
    });

    it.each([true, false])("project enabled=%s does not read user config", (enabled) => {
      writeFileSync(projectPath, JSON.stringify({ enabled }));
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(enabled);
      expect(vi.mocked(readFileSync).mock.calls.some(([path]) => path === userPath)).toBe(false);
    });

    it("uses enabled user config only when the project entry is truly absent", () => {
      writeFileSync(userPath, '{"enabled":true}');
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(true);

      symlinkSync(join(projectDir, "nonexistent.json"), projectPath);
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(false);

      process.env.TRACE_TO_LANGSMITH = "true";
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(true);
    });

    it("fails closed when the user config is a dangling symlink", () => {
      symlinkSync(join(tmpHome, "nonexistent.json"), userPath);
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(false);
    });

    it("fails closed when the project config is a directory", () => {
      mkdirSync(projectPath);
      writeFileSync(userPath, '{"enabled":true}');
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(false);
    });

    it("does not load credentials or other settings from master-switch files", () => {
      writeFileSync(
        projectPath,
        JSON.stringify({
          enabled: true,
          apiKey: "file-key",
          project: "file-project",
          replicas: [{ apiKey: "file-replica" }],
        }),
      );
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        enabled: true,
        apiKey: "",
        project: "claude-code",
        replicas: undefined,
      });
    });

    it("uses process.cwd when cwd is omitted", () => {
      vi.spyOn(process, "cwd").mockReturnValue(projectDir);
      writeFileSync(projectPath, '{"enabled":true}');
      expect(loadConfig().enabled).toBe(true);
    });

    it("uses USERPROFILE when HOME is absent", () => {
      delete process.env.HOME;
      process.env.USERPROFILE = tmpHome;
      writeFileSync(userPath, '{"enabled":true}');
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(true);
    });

    it("defaults off when no home directory or project config is available", () => {
      delete process.env.HOME;
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(false);
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
    expect(config.replicas?.[1].updates).toEqual({ metadata: { environment: "staging" } });
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

    it("ignores ~/.claude.json without a userID field", () => {
      writeFileSync(join(tmpHome, ".claude.json"), JSON.stringify({ otherField: "x" }));
      expect(loadConfig().customMetadata).not.toHaveProperty("anthropic_user_id");
    });

    it("handles malformed ~/.claude.json gracefully", () => {
      writeFileSync(join(tmpHome, ".claude.json"), "not valid json");
      expect(loadConfig().customMetadata).not.toHaveProperty("anthropic_user_id");
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

  it.each([
    ["github", "https://github.com/langchain-ai/example.git"],
    ["gitlab", "https://gitlab.com/langchain-ai/example.git"],
    ["bitbucket", "https://bitbucket.org/langchain-ai/example.git"],
    ["devAzure", "https://dev.azure.com/langchain-ai/example.git"],
  ])("inserts repository name into customMetadata for %s", (provider, url) => {
    vi.mocked(execSync).mockImplementation(() => {
      return [["origin", url + " (fetch)"].join("\t"), ["origin", url + " (push)"].join("\t")].join(
        "\n",
      );
    });

    process.env.CC_LANGSMITH_METADATA = JSON.stringify({
      pr_url: "https://github.com/org/repo/pull/42",
      pr_author: "octocat",
    });

    const config = loadConfig({ cwd: __dirname });
    expect(config.customMetadata).toMatchObject({
      pr_url: "https://github.com/org/repo/pull/42",
      pr_author: "octocat",
      repository_name: "langchain-ai/example",
      repository_provider: provider,
    });
  });

  describe("coding-agent-v1 contract metadata", () => {
    it("includes the frozen identity literals and cwd", () => {
      const config = loadConfig({ cwd });
      expect(config.customMetadata).toMatchObject({
        ls_agent_purpose: "coding",
        ls_integration: "claude-code",
        ls_agent_runtime: "Claude Code",
        ls_trace_schema_version: "coding-agent-v1",
        cwd,
      });
    });

    it("surfaces the hashed anthropic id as user_id (preferred) and keeps the compat alias", () => {
      writeFileSync(join(tmpHome, ".claude.json"), JSON.stringify({ userID: "hashed-123" }));
      const config = loadConfig({ cwd });
      expect(config.customMetadata).toMatchObject({
        user_id: "hashed-123",
        anthropic_user_id: "hashed-123", // DEPRECATED compat alias
      });
    });

    it("derives repository_url + git_branch + git_commit_sha", () => {
      vi.mocked(execSync).mockImplementation((command: string) => {
        if (command.includes("remote -v")) {
          const url = "git@github.com:langchain-ai/example.git";
          return [`origin\t${url} (fetch)`, `origin\t${url} (push)`].join("\n");
        }
        if (command.includes("abbrev-ref")) return "feature/my-branch\n";
        if (command.includes("rev-parse HEAD")) return "deadbeefcafe1234\n";
        return "";
      });
      const config = loadConfig({ cwd: __dirname });
      expect(config.customMetadata).toMatchObject({
        repository_name: "langchain-ai/example",
        repository_provider: "github",
        repository_url: "https://github.com/langchain-ai/example",
        git_branch: "feature/my-branch",
        git_commit_sha: "deadbeefcafe1234",
      });
    });

    it("omits git_branch for a detached HEAD", () => {
      vi.mocked(execSync).mockImplementation((command: string) => {
        if (command.includes("abbrev-ref")) return "HEAD\n";
        if (command.includes("rev-parse HEAD")) return "deadbeef\n";
        return "";
      });
      const config = loadConfig({ cwd: __dirname });
      expect(config.customMetadata).not.toHaveProperty("git_branch");
      expect(config.customMetadata).toMatchObject({ git_commit_sha: "deadbeef" });
    });
  });
});

describe("parseRepoName", () => {
  it.each([
    "https://username:password@github.com/langchain-ai/example.git",
    "http://username:password@gitlab.com/langchain-ai/example.git",
    "ssh://username:password@bitbucket.org/langchain-ai/example.git",
    "ssh://username:password@github.com:2222/langchain-ai/example.git",
  ])("excludes credentials from URL repository names: %s", (url) => {
    expect(parseRepoName(url)?.name).toBe("langchain-ai/example");
  });

  it("parses SCP-style SSH remotes", () => {
    expect(parseRepoName("git@github.com:langchain-ai/example.git")).toEqual({
      provider: "github",
      name: "langchain-ai/example",
    });
  });
});

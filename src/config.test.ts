import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  const originalEnv = { ...process.env };
  let tmpHome: string;

  beforeEach(() => {
    // Clear relevant env vars
    delete process.env.CC_LANGSMITH_API_KEY;
    delete process.env.LANGSMITH_API_KEY;
    delete process.env.CC_LANGSMITH_PROJECT;
    delete process.env.LANGSMITH_ENDPOINT;
    delete process.env.STATE_FILE;
    delete process.env.CC_LANGSMITH_DEBUG;
    delete process.env.CC_LANGSMITH_RUNS_ENDPOINTS;
    delete process.env.CC_LANGSMITH_METADATA;

    // Point HOME at an empty temp dir so tests don't read the real ~/.claude.json.
    tmpHome = mkdtempSync(join(tmpdir(), "ls-cc-test-"));
    process.env.HOME = tmpHome;
    delete process.env.USERPROFILE;
  });

  afterEach(() => {
    // Restore
    Object.assign(process.env, originalEnv);
    if (tmpHome) {
      rmSync(tmpHome, { recursive: true, force: true });
    }
  });

  it("reads CC_LANGSMITH_API_KEY first", () => {
    process.env.CC_LANGSMITH_API_KEY = "cc-key";
    process.env.LANGSMITH_API_KEY = "fallback-key";
    expect(loadConfig().apiKey).toBe("cc-key");
  });

  it("falls back to LANGSMITH_API_KEY", () => {
    process.env.LANGSMITH_API_KEY = "fallback-key";
    expect(loadConfig().apiKey).toBe("fallback-key");
  });

  it("returns empty string when no API key set", () => {
    expect(loadConfig().apiKey).toBe("");
  });

  it("defaults project to 'claude-code'", () => {
    expect(loadConfig().project).toBe("claude-code");
  });

  it("reads custom project name", () => {
    process.env.CC_LANGSMITH_PROJECT = "my-project";
    expect(loadConfig().project).toBe("my-project");
  });

  it("defaults API base URL", () => {
    expect(loadConfig().apiBaseUrl).toBe("https://api.smith.langchain.com");
  });

  it("reads custom API base URL", () => {
    process.env.LANGSMITH_ENDPOINT = "https://custom.api.com";
    expect(loadConfig().apiBaseUrl).toBe("https://custom.api.com");
  });

  it("reads custom state file path", () => {
    process.env.STATE_FILE = "/custom/state.json";
    expect(loadConfig().stateFilePath).toBe("/custom/state.json");
  });

  it("defaults debug to false", () => {
    expect(loadConfig().debug).toBe(false);
  });

  it("enables debug with 'true'", () => {
    process.env.CC_LANGSMITH_DEBUG = "true";
    expect(loadConfig().debug).toBe(true);
  });

  it("enables debug case-insensitively", () => {
    process.env.CC_LANGSMITH_DEBUG = "TRUE";
    expect(loadConfig().debug).toBe(true);
  });

  it("does not enable debug with other values", () => {
    process.env.CC_LANGSMITH_DEBUG = "1";
    expect(loadConfig().debug).toBe(false);
  });

  it("parses CC_LANGSMITH_RUNS_ENDPOINTS as JSON array", () => {
    process.env.CC_LANGSMITH_RUNS_ENDPOINTS = JSON.stringify([
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__key_workspace_a",
        projectName: "project-prod",
      },
    ]);
    const config = loadConfig();
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
    const config = loadConfig();
    expect(config.replicas).toHaveLength(2);
    expect(config.replicas?.[1].updates).toEqual({ metadata: { environment: "staging" } });
  });

  it("returns undefined replicas when CC_LANGSMITH_RUNS_ENDPOINTS not set", () => {
    expect(loadConfig().replicas).toBeUndefined();
  });

  it("handles invalid JSON in CC_LANGSMITH_RUNS_ENDPOINTS gracefully", () => {
    const originalError = console.error;
    console.error = vi.fn();
    process.env.CC_LANGSMITH_RUNS_ENDPOINTS = "not valid json";
    const config = loadConfig();
    // Should not throw and replicas should be undefined
    expect(config.replicas).toBeUndefined();
    console.error = originalError;
  });

  it("parses CC_LANGSMITH_METADATA as JSON object", () => {
    process.env.CC_LANGSMITH_METADATA = JSON.stringify({
      pr_url: "https://github.com/org/repo/pull/42",
      pr_author: "octocat",
    });
    const config = loadConfig();
    expect(config.customMetadata).toMatchObject({
      pr_url: "https://github.com/org/repo/pull/42",
      pr_author: "octocat",
    });
    expect(config.customMetadata?.local_username).toEqual(expect.any(String));
  });

  it("populates customMetadata with identity fields when CC_LANGSMITH_METADATA not set", () => {
    const config = loadConfig();
    // local_username always resolves (at minimum to "unknown")
    expect(config.customMetadata?.local_username).toEqual(expect.any(String));
  });

  it("handles invalid JSON in CC_LANGSMITH_METADATA gracefully", () => {
    const originalError = console.error;
    console.error = vi.fn();
    process.env.CC_LANGSMITH_METADATA = "not valid json";
    const config = loadConfig();
    // Falls back to identity-only metadata
    expect(config.customMetadata).toMatchObject({ local_username: expect.any(String) });
    expect(config.customMetadata).not.toHaveProperty("anthropic_user_id");
    console.error = originalError;
  });

  it("rejects array CC_LANGSMITH_METADATA", () => {
    const originalError = console.error;
    console.error = vi.fn();
    process.env.CC_LANGSMITH_METADATA = '["not", "an", "object"]';
    const config = loadConfig();
    expect(config.customMetadata).toMatchObject({ local_username: expect.any(String) });
    console.error = originalError;
  });

  it("rejects primitive CC_LANGSMITH_METADATA", () => {
    const originalError = console.error;
    console.error = vi.fn();
    process.env.CC_LANGSMITH_METADATA = '"just a string"';
    const config = loadConfig();
    expect(config.customMetadata).toMatchObject({ local_username: expect.any(String) });
    console.error = originalError;
  });

  describe("Anthropic user ID", () => {
    it("includes anthropic_user_id from ~/.claude.json", () => {
      writeFileSync(
        join(tmpHome, ".claude.json"),
        JSON.stringify({ userID: "abc123hashed_user_id" }),
      );
      const config = loadConfig();
      expect(config.customMetadata).toMatchObject({
        anthropic_user_id: "abc123hashed_user_id",
        local_username: expect.any(String),
      });
    });

    it("merges anthropic_user_id with CC_LANGSMITH_METADATA", () => {
      writeFileSync(join(tmpHome, ".claude.json"), JSON.stringify({ userID: "user-xyz" }));
      process.env.CC_LANGSMITH_METADATA = JSON.stringify({ pr_author: "octocat" });
      const config = loadConfig();
      expect(config.customMetadata).toMatchObject({
        anthropic_user_id: "user-xyz",
        pr_author: "octocat",
        local_username: expect.any(String),
      });
    });

    it("user-supplied CC_LANGSMITH_METADATA overrides anthropic_user_id on conflict", () => {
      writeFileSync(join(tmpHome, ".claude.json"), JSON.stringify({ userID: "auto-id" }));
      process.env.CC_LANGSMITH_METADATA = JSON.stringify({ anthropic_user_id: "manual-id" });
      const config = loadConfig();
      expect(config.customMetadata?.anthropic_user_id).toBe("manual-id");
    });

    it("omits anthropic_user_id when ~/.claude.json is missing", () => {
      // tmpHome is empty
      const config = loadConfig();
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
      const config = loadConfig();
      const username = config.customMetadata?.local_username;
      expect(typeof username).toBe("string");
      expect((username as string).length).toBeGreaterThan(0);
    });

    it("user-supplied CC_LANGSMITH_METADATA overrides local_username on conflict", () => {
      process.env.CC_LANGSMITH_METADATA = JSON.stringify({ local_username: "custom-name" });
      const config = loadConfig();
      expect(config.customMetadata?.local_username).toBe("custom-name");
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  const originalEnv = { ...process.env };

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
  });

  afterEach(() => {
    // Restore
    Object.assign(process.env, originalEnv);
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
    expect(config.customMetadata).toEqual({
      pr_url: "https://github.com/org/repo/pull/42",
      pr_author: "octocat",
    });
  });

  it("returns undefined customMetadata when CC_LANGSMITH_METADATA not set", () => {
    expect(loadConfig().customMetadata).toBeUndefined();
  });

  it("handles invalid JSON in CC_LANGSMITH_METADATA gracefully", () => {
    const originalError = console.error;
    console.error = vi.fn();
    process.env.CC_LANGSMITH_METADATA = "not valid json";
    const config = loadConfig();
    expect(config.customMetadata).toBeUndefined();
    console.error = originalError;
  });
});

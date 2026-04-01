import { describe, it, expect, beforeEach, afterEach } from "vitest";
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
});

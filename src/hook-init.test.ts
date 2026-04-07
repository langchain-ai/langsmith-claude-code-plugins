import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("./logger.js", () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  initLogger: vi.fn(),
}));

import { initHook } from "./utils/hook-init.js";

describe("initHook", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.CC_LANGSMITH_API_KEY;
    delete process.env.LANGSMITH_API_KEY;
    delete process.env.TRACE_TO_LANGSMITH;
    delete process.env.CC_LANGSMITH_RUNS_ENDPOINTS;
    delete process.env.CC_LANGSMITH_DEBUG;
    delete process.env.CC_LANGSMITH_PROJECT;
    delete process.env.LANGSMITH_ENDPOINT;
    delete process.env.STATE_FILE;
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
  });

  it("returns null when TRACE_TO_LANGSMITH is not true", () => {
    process.env.CC_LANGSMITH_API_KEY = "test-key";
    expect(initHook()).toBeNull();
  });

  it("returns null when no API key and no replicas", () => {
    process.env.TRACE_TO_LANGSMITH = "true";
    expect(initHook()).toBeNull();
  });

  it("returns config when API key is set", () => {
    process.env.TRACE_TO_LANGSMITH = "true";
    process.env.CC_LANGSMITH_API_KEY = "test-key";
    const config = initHook();
    expect(config).not.toBeNull();
    expect(config!.apiKey).toBe("test-key");
  });

  it("returns config when replicas are set but no API key", () => {
    process.env.TRACE_TO_LANGSMITH = "true";
    process.env.CC_LANGSMITH_RUNS_ENDPOINTS = JSON.stringify([
      {
        apiUrl: "https://api.smith.langchain.com",
        apiKey: "ls__replica_key",
        projectName: "replica-project",
      },
    ]);
    const config = initHook();
    expect(config).not.toBeNull();
    expect(config!.apiKey).toBe("");
    expect(config!.replicas).toHaveLength(1);
  });

  it("returns null when replicas array is empty and no API key", () => {
    process.env.TRACE_TO_LANGSMITH = "true";
    process.env.CC_LANGSMITH_RUNS_ENDPOINTS = "[]";
    expect(initHook()).toBeNull();
  });
});

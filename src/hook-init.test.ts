import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("node:child_process", () => ({ execSync: vi.fn(() => "") }));
vi.mock("./utils/stdin.js", () => ({ readStdin: vi.fn() }));
vi.mock("./langsmith.js", { spy: true });

vi.mock("./logger.js", () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  initLogger: vi.fn(),
}));

import { initHook } from "./utils/hook-init.js";
import { readStdin } from "./utils/stdin.js";
import { initTracing } from "./langsmith.js";
import { error } from "./logger.js";

describe("initHook", () => {
  const originalEnv = { ...process.env };
  let home: string;
  let cwd: string;
  let projectPath: string;
  let userPath: string;

  beforeEach(() => {
    vi.clearAllMocks();
    home = mkdtempSync(join(tmpdir(), "ls-hook-init-"));
    cwd = join(home, "project");
    mkdirSync(join(cwd, ".claude"), { recursive: true });
    mkdirSync(join(home, ".claude"));
    projectPath = join(cwd, ".claude", "langsmith.json");
    userPath = join(home, ".claude", "langsmith.json");
    process.env.HOME = home;
    delete process.env.USERPROFILE;
    vi.spyOn(process, "cwd").mockReturnValue(cwd);
    delete process.env.CC_LANGSMITH_API_KEY;
    delete process.env.LANGSMITH_API_KEY;
    delete process.env.TRACE_TO_LANGSMITH;
    delete process.env.CC_LANGSMITH_DEFAULT_MUTED;
    delete process.env.CC_LANGSMITH_RUNS_ENDPOINTS;
    delete process.env.CC_LANGSMITH_DEBUG;
    delete process.env.CC_LANGSMITH_PROJECT;
    delete process.env.LANGSMITH_ENDPOINT;
    delete process.env.STATE_FILE;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
    rmSync(home, { recursive: true, force: true });
  });

  it("returns null when no source enables tracing", () => {
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

  it.each(
    ["project", "user"].flatMap((scope) => [undefined, "false", ""].map((env) => ({ scope, env }))),
  )("enables tracing from the $scope file with credentials despite env=$env", ({ scope, env }) => {
    if (env !== undefined) process.env.TRACE_TO_LANGSMITH = env;
    writeFileSync(scope === "project" ? projectPath : userPath, '{"enabled":true}');
    process.env.CC_LANGSMITH_API_KEY = "test-key";
    expect(initHook(cwd)).toMatchObject({ enabled: true, apiKey: "test-key" });
  });

  it.each(["project", "user"])(
    "still requires credentials when the %s file enables tracing",
    (scope) => {
      writeFileSync(scope === "project" ? projectPath : userPath, '{"enabled":true}');
      expect(initHook(cwd)).toBeNull();
      expect(error).toHaveBeenCalledOnce();
    },
  );

  it("preserves replica-only credentials when enabled by a file", () => {
    writeFileSync(projectPath, '{"enabled":true}');
    const replicas = [
      { apiUrl: "https://replica.test", apiKey: "replica-key", projectName: "replica" },
    ];
    process.env.CC_LANGSMITH_RUNS_ENDPOINTS = JSON.stringify(replicas);
    expect(initHook(cwd)).toMatchObject({ enabled: true, apiKey: "", replicas });
  });

  it.each([
    { name: "default off", env: undefined, project: undefined, user: undefined },
    { name: "env false with absent files", env: "false", project: undefined, user: undefined },
    { name: "env empty with absent files", env: "", project: undefined, user: undefined },
    { name: "project veto", env: undefined, project: false, user: true },
    { name: "project veto over env true", env: "true", project: false, user: true },
    { name: "user off", env: undefined, project: undefined, user: false },
    { name: "user veto over env true", env: "true", project: undefined, user: false },
  ])(
    "master off ($name) returns null and hooks never initialize tracing or upload content",
    async ({ env, project, user }) => {
      process.env.CC_LANGSMITH_DEFAULT_MUTED = "true";
      if (env !== undefined) process.env.TRACE_TO_LANGSMITH = env;
      if (project !== undefined) writeFileSync(projectPath, JSON.stringify({ enabled: project }));
      if (user !== undefined) writeFileSync(userPath, JSON.stringify({ enabled: user }));
      process.env.CC_LANGSMITH_API_KEY = "test-key";
      process.env.CC_LANGSMITH_RUNS_ENDPOINTS = JSON.stringify([
        { apiUrl: "https://replica.test", apiKey: "replica-key", projectName: "replica" },
      ]);
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      expect(initHook(cwd)).toBeNull();

      // Real hook entrypoints, with only stdin and the HTTP boundary replaced.
      // Assert the SDK is never initialized, covering primary and replica uploads
      // via POST /runs, PATCH /runs/:id, /runs/batch and /runs/multipart alike.
      for (const runHook of [
        () => import("./hooks/user-prompt-submit.js"),
        () => import("./hooks/pre-tool-use.js"),
        () => import("./hooks/post-tool-use.js"),
        () => import("./hooks/pre-compact.js"),
        () => import("./hooks/post-compact.js"),
        () => import("./hooks/stop.js"),
        () => import("./hooks/stop-failure.js"),
        () => import("./hooks/subagent-stop.js"),
        () => import("./hooks/session-end.js"),
      ]) {
        vi.resetModules();
        vi.mocked(readStdin).mockResolvedValue({
          cwd,
          session_id: "master-off-session",
          prompt: "PRIVATE_CONTENT_MUST_NOT_UPLOAD",
          tool_input: { content: "PRIVATE_CONTENT_MUST_NOT_UPLOAD" },
          tool_response: "PRIVATE_CONTENT_MUST_NOT_UPLOAD",
        });
        await runHook();
        await new Promise((resolve) => setImmediate(resolve));
      }
      expect(readStdin).toHaveBeenCalledTimes(9);
      expect(initTracing).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    },
  );

  it("returns null when replicas array is empty and no API key", () => {
    process.env.TRACE_TO_LANGSMITH = "true";
    process.env.CC_LANGSMITH_RUNS_ENDPOINTS = "[]";
    expect(initHook()).toBeNull();
  });
});

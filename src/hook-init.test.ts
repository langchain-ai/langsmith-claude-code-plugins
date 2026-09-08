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
  let rootPath: string;
  let userPath: string;
  let userRootPath: string;

  beforeEach(() => {
    vi.clearAllMocks();
    home = mkdtempSync(join(tmpdir(), "ls-hook-init-"));
    cwd = join(home, "project");
    mkdirSync(join(cwd, ".claude"), { recursive: true });
    mkdirSync(join(home, ".claude"));
    projectPath = join(cwd, ".claude", "langsmith.json");
    rootPath = join(cwd, "langsmith-plugins.json");
    userPath = join(home, ".claude", "langsmith.json");
    userRootPath = join(home, ".langsmith-plugins.json");
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

  it.each(["api_key", "replicas"] as const)(
    "file-only %s credentials work, but master switch still gates",
    (field) => {
      const credentials =
        field === "api_key"
          ? { api_key: "file-key" }
          : {
              replicas: [
                { api_url: "https://replica.test", api_key: "replica-key", project: "replica" },
              ],
            };
      writeFileSync(rootPath, JSON.stringify({ enabled: true, ...credentials }));
      expect(initHook(cwd)).toMatchObject(
        field === "api_key"
          ? { enabled: true, apiKey: "file-key" }
          : {
              enabled: true,
              apiKey: "",
              replicas: [
                { apiUrl: "https://replica.test", apiKey: "replica-key", projectName: "replica" },
              ],
            },
      );
      writeFileSync(projectPath, '{"enabled":false}');
      expect(initHook(cwd)).toBeNull();
    },
  );

  it.each(['{"enabled":true,"api_key":"old-key"}', '{"enabled":false}', "{"])(
    "ignores old home config and initializes from hidden home credentials: %s",
    (raw) => {
      writeFileSync(join(home, "langsmith-plugins.json"), raw);
      expect(initHook(cwd)).toBeNull();
      expect(initTracing).not.toHaveBeenCalled();
      writeFileSync(userRootPath, '{"enabled":true,"api_key":"hidden-key","defaultMuted":true}');
      expect(initHook(cwd)).toMatchObject({
        enabled: true,
        apiKey: "hidden-key",
        defaultMuted: true,
      });
      expect(error).not.toHaveBeenCalled();
    },
  );

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
    ["project", "root", "user", "userRoot"].flatMap((scope) =>
      [undefined, "false", ""].map((env) => ({ scope, env })),
    ),
  )("resolves tracing from the $scope file with credentials and env=$env", ({ scope, env }) => {
    if (env !== undefined) process.env.TRACE_TO_LANGSMITH = env;
    writeFileSync(
      scope === "project"
        ? projectPath
        : scope === "root"
          ? rootPath
          : scope === "user"
            ? userPath
            : userRootPath,
      '{"enabled":true}',
    );
    process.env.CC_LANGSMITH_API_KEY = "test-key";
    if (env === undefined)
      expect(initHook(cwd)).toMatchObject({ enabled: true, apiKey: "test-key" });
    else expect(initHook(cwd)).toBeNull();
  });

  it.each(["project", "root", "user", "userRoot"])(
    "still requires credentials when the %s file enables tracing",
    (scope) => {
      writeFileSync(
        scope === "project"
          ? projectPath
          : scope === "root"
            ? rootPath
            : scope === "user"
              ? userPath
              : userRootPath,
        '{"enabled":true}',
      );
      expect(initHook(cwd)).toBeNull();
      expect(error).toHaveBeenCalledOnce();
    },
  );

  it.each([true, false])(
    "passes root defaultMuted=%s to mode resolution without overriding snapshots",
    async (defaultMuted) => {
      const { resolveTurnTracingMode } = await import("./tracing-mode.js");
      const { tracingPolicyPath } = await import("./tracing-policy.js");
      const { existsSync } = await import("node:fs");
      process.env.CC_LANGSMITH_API_KEY = "test-key";
      process.env.STATE_FILE = join(home, "state.json");
      writeFileSync(rootPath, JSON.stringify({ enabled: true, defaultMuted }));
      vi.spyOn(process, "cwd").mockReturnValue(home);
      const config = initHook(cwd)!;
      expect(config).toMatchObject({ enabled: true, defaultMuted });
      expect(resolveTurnTracingMode(config, "fresh")).toBe(defaultMuted ? "metadata" : "full");
      expect(resolveTurnTracingMode(config, "fresh", "full")).toBe("full");
      expect(resolveTurnTracingMode(config, "fresh", "metadata")).toBe("metadata");
      expect(existsSync(tracingPolicyPath(config.stateFilePath))).toBe(false);
      process.env.CC_LANGSMITH_DEFAULT_MUTED = String(!defaultMuted);
      const next = initHook(cwd)!;
      expect(resolveTurnTracingMode(next, "fresh")).toBe(defaultMuted ? "full" : "metadata");
      expect(resolveTurnTracingMode(next, "fresh", "full")).toBe("full");
      expect(resolveTurnTracingMode(next, "fresh", "metadata")).toBe("metadata");
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
    { name: "root veto", env: undefined, root: false, project: undefined, user: true },
    { name: ".claude over root", env: undefined, root: true, project: false, user: true },
    { name: "env false over files", env: "false", root: true, project: true, user: true },
    { name: "env invalid over files", env: "yes", root: true, project: true, user: true },
    { name: "env empty over files", env: "", root: true, project: true, user: true },
    { name: "project veto", env: undefined, project: false, user: true },
    { name: "user off", env: undefined, project: undefined, user: false },
  ])(
    "master off ($name) returns null and hooks never initialize tracing or upload content",
    async ({ env, project, root, user }) => {
      process.env.CC_LANGSMITH_DEFAULT_MUTED = "true";
      if (env !== undefined) process.env.TRACE_TO_LANGSMITH = env;
      if (project !== undefined) writeFileSync(projectPath, JSON.stringify({ enabled: project }));
      if (root !== undefined) writeFileSync(rootPath, JSON.stringify({ enabled: root }));
      // Hooks must use payload cwd rather than the plugin/process directory.
      vi.spyOn(process, "cwd").mockReturnValue(home);
      if (user !== undefined) writeFileSync(userPath, JSON.stringify({ enabled: user }));
      process.env.CC_LANGSMITH_API_KEY = "test-key";
      process.env.CC_LANGSMITH_RUNS_ENDPOINTS = JSON.stringify([
        { apiUrl: "https://replica.test", apiKey: "replica-key", projectName: "replica" },
      ]);
      process.env.STATE_FILE = join(home, "state.json");
      const { setThreadTracingMode } = await import("./tracing-policy.js");
      await setThreadTracingMode(process.env.STATE_FILE, "master-off-session", "full");
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

  it.each(["project", "root", "user", "userRoot"])(
    "env true enables the real prompt hook despite disabled %s config",
    async (scope) => {
      for (const path of [projectPath, rootPath, userPath, userRootPath]) {
        writeFileSync(path, JSON.stringify({ api_key: "file-key", enabled: false }));
      }
      // Include malformed sources: environment is a per-field override, not a global veto.
      const path = { project: projectPath, root: rootPath, user: userPath, userRoot: userRootPath }[
        scope
      ]!;
      writeFileSync(path, "{");
      process.env.TRACE_TO_LANGSMITH = "true";
      process.env.CC_LANGSMITH_DEFAULT_MUTED = "false";
      process.env.STATE_FILE = join(home, "state.json");
      const transcript = join(home, "transcript.jsonl");
      writeFileSync(transcript, "");
      const { RunTree } = await import("langsmith");
      // Replace the SDK transport operation before invoking the actual hook.
      const post = vi.spyOn(RunTree.prototype, "postRun").mockResolvedValue(undefined);
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      vi.mocked(readStdin).mockResolvedValue({
        cwd,
        session_id: "env-enabled",
        transcript_path: transcript,
        prompt: "test prompt",
      });
      vi.resetModules();
      await import("./hooks/user-prompt-submit.js");
      const { readFileSync, existsSync } = await import("node:fs");
      await vi.waitFor(() => {
        expect(existsSync(process.env.STATE_FILE!)).toBe(true);
        expect(
          JSON.parse(readFileSync(process.env.STATE_FILE!, "utf8"))["env-enabled"],
        ).toMatchObject({ current_turn_tracing: "full" });
      });
      expect(initTracing).toHaveBeenCalled();
      expect(post).toHaveBeenCalledOnce();
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

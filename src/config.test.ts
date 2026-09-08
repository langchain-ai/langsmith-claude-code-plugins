import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadConfig, parseRepoName } from "./config.js";
import { execSync } from "node:child_process";

vi.mock("node:child_process", { spy: true });
vi.mock("node:fs", { spy: true });
vi.mock("node:os", { spy: true });

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

  describe("project-root boolean config", () => {
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
      vi.mocked(execSync).mockReturnValue("");
    });

    const settings = [
      {
        field: "enabled",
        other: "defaultMuted",
        envName: "TRACE_TO_LANGSMITH",
        restrictive: false,
      },
      {
        field: "defaultMuted",
        other: "enabled",
        envName: "CC_LANGSMITH_DEFAULT_MUTED",
        restrictive: true,
      },
    ] as const;
    const values = [undefined, false, true];

    it.each(
      settings.flatMap((setting) =>
        values.flatMap((claude) =>
          values.flatMap((root) =>
            values.flatMap((user) =>
              values.flatMap((userRoot) =>
                values.map((env) => ({ ...setting, claude, root, user, userRoot, env })),
              ),
            ),
          ),
        ),
      ),
    )(
      "$field: .claude=$claude root=$root user=$user userRoot=$userRoot env=$env",
      ({ field, other, envName, claude, root, user, userRoot, env }) => {
        if (env !== undefined) process.env[envName] = String(env);
        // Missing fields fall through independently of the other field.
        [claude, root, user, userRoot].forEach((value, i) => {
          writeFileSync(paths[i], JSON.stringify({ [field]: value, [other]: i === 0 }));
        });
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          [field]: env ?? claude ?? root ?? user ?? userRoot ?? false,
          [other]: true,
        });
      },
    );

    it.each(
      settings.flatMap((setting) =>
        [0, 1, 2, 3].flatMap((scope) =>
          [
            "",
            "{",
            "null",
            "[]",
            "true",
            '"text"',
            ...["true", "false", 0, 1, null, [], {}].map((value) =>
              JSON.stringify({ [setting.field]: value }),
            ),
          ].map((raw) => ({ ...setting, scope, raw })),
        ),
      ),
    )(
      "$field fails closed at scope $scope: $raw",
      ({ field, envName, restrictive, scope, raw }) => {
        paths.forEach((path, i) =>
          writeFileSync(path, i < scope ? "{}" : JSON.stringify({ [field]: !restrictive })),
        );
        writeFileSync(paths[scope], raw);
        expect(loadConfig({ cwd: projectDir })[field]).toBe(restrictive);
        process.env[envName] = String(!restrictive);
        expect(loadConfig({ cwd: projectDir })[field]).toBe(!restrictive);
      },
    );

    it.each(
      [0, 1, 2, 3].flatMap((scope) =>
        ["EACCES", "EPERM", "EIO", "EISDIR", "ENOTDIR", "dangling"].map((code) => ({
          scope,
          code,
        })),
      ),
    )(
      "unreadable scope $scope ($code) blocks lower files but permits per-field env overrides",
      ({ scope, code }) => {
        paths.forEach((path, i) => {
          if (i !== scope)
            writeFileSync(path, i < scope ? "{}" : '{"enabled":true,"defaultMuted":false}');
        });
        if (code === "dangling") {
          symlinkSync(join(tmpHome, "missing.json"), paths[scope]);
        } else {
          writeFileSync(paths[scope], "{}");
          const read = vi.mocked(readFileSync).getMockImplementation()!;
          vi.mocked(readFileSync).mockImplementation((...args: Parameters<typeof readFileSync>) => {
            if (args[0] === paths[scope]) throw Object.assign(new Error("unreadable"), { code });
            return read(...args);
          });
        }
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          enabled: false,
          defaultMuted: true,
        });
        process.env.TRACE_TO_LANGSMITH = "true";
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          enabled: true,
          defaultMuted: true,
        });
        process.env.CC_LANGSMITH_DEFAULT_MUTED = "false";
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          enabled: true,
          defaultMuted: false,
        });
      },
    );

    it.each(['{"enabled":false,"defaultMuted":true}', "{", '{"enabled":true}'])(
      "ignores old root langsmith.json entirely: %s",
      (raw) => {
        const oldRoot = join(projectDir, "langsmith.json");
        writeFileSync(oldRoot, raw);
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          enabled: false,
          defaultMuted: false,
        });

        process.env.TRACE_TO_LANGSMITH = "true";
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          enabled: true,
          defaultMuted: false,
        });

        writeFileSync(paths[1], '{"enabled":true,"defaultMuted":true,"project":"new-root"}');
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          enabled: true,
          defaultMuted: true,
          project: "new-root",
        });

        delete process.env.TRACE_TO_LANGSMITH;
        writeFileSync(paths[0], '{"enabled":false,"defaultMuted":false,"project":"claude"}');
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          enabled: false,
          defaultMuted: false,
          project: "claude",
        });
        expect(vi.mocked(readFileSync).mock.calls.some(([path]) => path === oldRoot)).toBe(false);
      },
    );

    it.each([
      '{"enabled":false,"defaultMuted":true}',
      "{",
      '{"enabled":true,"api_key":"old-key","project":"old-home"}',
    ])(
      "ignores nonhidden home config without fallback and honors hidden home config: %s",
      (raw) => {
        const oldHome = join(tmpHome, "langsmith-plugins.json");
        writeFileSync(oldHome, raw);
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          enabled: false,
          defaultMuted: false,
          apiKey: "",
          project: "claude-code",
        });

        writeFileSync(
          paths[3],
          '{"enabled":true,"defaultMuted":false,"api_key":"hidden-key","project":"hidden-home"}',
        );
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          enabled: true,
          defaultMuted: false,
          apiKey: "hidden-key",
          project: "hidden-home",
        });
        expect(vi.mocked(readFileSync).mock.calls.some(([path]) => path === oldHome)).toBe(false);
      },
    );

    it("keeps visible project and hidden home config distinct when cwd equals home", () => {
      writeFileSync(
        paths[3],
        '{"enabled":true,"defaultMuted":true,"api_key":"hidden-key","project":"hidden-home"}',
      );
      const visibleRoot = join(tmpHome, "langsmith-plugins.json");
      writeFileSync(visibleRoot, '{"enabled":false,"project":"visible-project"}');
      // Omitted cwd resolves to tmpHome, so the visible file is a project source.
      expect(loadConfig()).toMatchObject({
        enabled: false,
        defaultMuted: true,
        apiKey: "hidden-key",
        project: "visible-project",
      });
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

    it("higher switches win even though lower sources are read for ordinary fields", () => {
      writeFileSync(paths[0], '{"enabled":true,"defaultMuted":false}');
      writeFileSync(paths[1], "{");
      writeFileSync(paths[2], "{");
      expect(loadConfig({ cwd: projectDir })).toMatchObject({ enabled: true, defaultMuted: false });
      expect(
        vi.mocked(readFileSync).mock.calls.some(([p]) => p === paths[1] || p === paths[2]),
      ).toBe(true);
    });

    it("uses only resolved cwd, without ancestor traversal, and defaults false/false", () => {
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        enabled: false,
        defaultMuted: false,
      });
      writeFileSync(paths[1], '{"enabled":true,"defaultMuted":true}');
      vi.spyOn(process, "cwd").mockReturnValue(projectDir);
      expect(loadConfig()).toMatchObject({ enabled: true, defaultMuted: true });
      const child = join(projectDir, "child");
      mkdirSync(child);
      expect(loadConfig({ cwd: child })).toMatchObject({ enabled: false, defaultMuted: false });
      writeFileSync(paths[0], '{"enabled":true,"defaultMuted":true}');
      expect(loadConfig({ cwd: child })).toMatchObject({ enabled: false, defaultMuted: false });
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

    it("layers all home-root common fields, per-field overrides, metadata and replacing arrays", () => {
      const baseline = {
        enabled: true,
        defaultMuted: true,
        api_key: "home-key",
        api_url: "home-url",
        project: "home-project",
        replicas: [{ api_key: "home-replica" }],
        metadata: { home: true, nested: { home: true }, winner: "home" },
        redact: false,
        redact_extra_rules: [{ pattern: "home", replace: "hidden" }],
        unknown: { ignored: true },
      };
      const target = join(tmpHome, "baseline.json");
      writeFileSync(target, JSON.stringify(baseline));
      symlinkSync(target, paths[3]);
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        enabled: true,
        defaultMuted: true,
        apiKey: "home-key",
        apiBaseUrl: "home-url",
        project: "home-project",
        replicas: [{ apiKey: "home-replica" }],
        customMetadata: baseline.metadata,
        redact: false,
        redactExtraRules: baseline.redact_extra_rules,
      });
      for (const [i, scope] of [
        [2, "user"],
        [1, "root"],
        [0, "claude"],
      ] as const) {
        writeFileSync(
          paths[i],
          JSON.stringify({
            project: scope,
            metadata: { [scope]: true, winner: scope, nested: { [scope]: true } },
            replicas: [],
            redact_extra_rules: [],
          }),
        );
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          apiKey: "home-key",
          apiBaseUrl: "home-url",
          project: scope,
          replicas: [],
          redactExtraRules: [],
          redact: false,
          customMetadata: { home: true, winner: scope, nested: { [scope]: true } },
        });
      }
      process.env.CC_LANGSMITH_METADATA = '{"winner":"env","nested":{"env":true}}';
      process.env.CC_LANGSMITH_PROJECT = "env";
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        project: "env",
        customMetadata: {
          home: true,
          user: true,
          root: true,
          claude: true,
          winner: "env",
          nested: { env: true },
        },
      });
      // Home-root uses the same validator, not a permissive alternate schema.
      writeFileSync(
        target,
        JSON.stringify({ ...baseline, redact_extra_rules: [{ pattern: "[" }] }),
      );
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        enabled: false,
        defaultMuted: true,
        apiKey: "",
        apiBaseUrl: "https://api.smith.langchain.com",
      });
    });

    it.each(['{"enabled":true,"defaultMuted":true}', "{"])(
      "ignores the old home langsmith.json alias: %s",
      (raw) => {
        const oldHome = join(tmpHome, "langsmith.json");
        writeFileSync(oldHome, raw);
        expect(loadConfig({ cwd: projectDir })).toMatchObject({
          enabled: false,
          defaultMuted: false,
        });
        expect(vi.mocked(readFileSync).mock.calls.some(([path]) => path === oldHome)).toBe(false);
      },
    );

    it("accepts common fields and ignores noncanonical top-level aliases", () => {
      writeFileSync(
        paths[1],
        JSON.stringify({
          enabled: true,
          defaultMuted: true,
          apiKey: "file-key",
          project: "file-project",
          replicas: [{ apiKey: "file-replica" }],
          customMetadata: { rootOnly: "secret" },
          redact: false,
        }),
      );
      const config = loadConfig({ cwd: projectDir });
      expect(config).toMatchObject({
        enabled: true,
        defaultMuted: true,
        apiKey: "",
        project: "file-project",
        replicas: [{ apiKey: "file-replica" }],
        redact: false,
      });
      expect(config.customMetadata).not.toHaveProperty("rootOnly");
    });
  });

  describe("default mute config", () => {
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
      [
        undefined,
        "true",
        "TRUE",
        "TrUe",
        "false",
        "FALSE",
        "FaLsE",
        "",
        "1",
        "0",
        "yes",
        "no",
        " false ",
      ].flatMap((env) =>
        [undefined, true, false].flatMap((project) =>
          [undefined, true, false].map((user) => ({ env, project, user })),
        ),
      ),
    )("env=$env project=$project user=$user", ({ env, project, user }) => {
      if (env !== undefined) process.env.CC_LANGSMITH_DEFAULT_MUTED = env;
      // Present enabled-only files must not mask fallback for defaultMuted.
      writeFileSync(projectPath, JSON.stringify({ enabled: true, defaultMuted: project }));
      writeFileSync(userPath, JSON.stringify({ enabled: false, defaultMuted: user }));
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        enabled: true,
        defaultMuted:
          env !== undefined ? env.toLowerCase() !== "false" : (project ?? user ?? false),
      });
    });

    it.each([true, false])("resolves enabled independently of defaultMuted=%s", (defaultMuted) => {
      process.env.TRACE_TO_LANGSMITH = "true";
      writeFileSync(projectPath, JSON.stringify({ defaultMuted }));
      expect(loadConfig({ cwd: projectDir })).toMatchObject({ enabled: true, defaultMuted });
      writeFileSync(userPath, '{"enabled":false}');
      expect(loadConfig({ cwd: projectDir })).toMatchObject({ enabled: true, defaultMuted });
      writeFileSync(projectPath, JSON.stringify({ enabled: false, defaultMuted }));
      writeFileSync(userPath, '{"enabled":true}');
      expect(loadConfig({ cwd: projectDir })).toMatchObject({ enabled: true, defaultMuted });
    });

    it.each(
      ["project", "user"].flatMap((scope) =>
        [
          "",
          "{",
          "null",
          "[]",
          "true",
          '{"defaultMuted":"false"}',
          '{"defaultMuted":0}',
          '{"defaultMuted":null}',
        ].map((raw) => ({ scope, raw })),
      ),
    )("fails closed for $scope: $raw", ({ scope, raw }) => {
      if (scope === "project") writeFileSync(userPath, '{"defaultMuted":false}');
      writeFileSync(scope === "project" ? projectPath : userPath, raw);
      expect(loadConfig({ cwd: projectDir }).defaultMuted).toBe(true);
    });

    it.each(
      ["project", "user"].flatMap((scope) =>
        ["EACCES", "EPERM", "EIO", "EISDIR", "ENOTDIR"].map((code) => ({ scope, code })),
      ),
    )("fails closed on $scope read error $code", ({ scope, code }) => {
      const path = scope === "project" ? projectPath : userPath;
      writeFileSync(userPath, '{"defaultMuted":false}');
      const read = vi.mocked(readFileSync).getMockImplementation()!;
      vi.mocked(readFileSync).mockImplementation((...args: Parameters<typeof readFileSync>) => {
        if (args[0] === path) throw Object.assign(new Error("unreadable"), { code });
        return read(...args);
      });
      expect(loadConfig({ cwd: projectDir }).defaultMuted).toBe(true);
    });

    it.each(["project", "user"])("treats a dangling %s symlink as unreadable", (scope) => {
      symlinkSync(join(tmpHome, "missing.json"), scope === "project" ? projectPath : userPath);
      expect(loadConfig({ cwd: projectDir }).defaultMuted).toBe(true);
    });

    it("uses the supplied cwd, or process.cwd when omitted, and homedir for user defaults", () => {
      writeFileSync(projectPath, '{"defaultMuted":true}');
      writeFileSync(userPath, '{"defaultMuted":false}');
      vi.spyOn(process, "cwd").mockReturnValue(tmpHome);
      expect(loadConfig().defaultMuted).toBe(false);
      expect(loadConfig({ cwd: projectDir }).defaultMuted).toBe(true);
      vi.spyOn(process, "cwd").mockReturnValue(projectDir);
      expect(loadConfig().defaultMuted).toBe(true);
      rmSync(projectPath);
      delete process.env.HOME;
      delete process.env.USERPROFILE;
      writeFileSync(userPath, '{"defaultMuted":true}');
      expect(loadConfig({ cwd: projectDir }).defaultMuted).toBe(true);
    });

    it("defaults unmuted with absent files and falls through empty objects", () => {
      expect(loadConfig({ cwd: projectDir }).defaultMuted).toBe(false);
      process.env.CC_LANGSMITH_DEFAULT_MUTED = "true";
      process.env.TRACE_TO_LANGSMITH = "true";
      writeFileSync(projectPath, "{}");
      writeFileSync(userPath, "{}");
      expect(loadConfig({ cwd: projectDir })).toMatchObject({ enabled: true, defaultMuted: true });
    });
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
      if (scope === "project") writeFileSync(projectPath, "{}");
      const read = vi.mocked(readFileSync).getMockImplementation()!;
      vi.mocked(readFileSync).mockImplementation((...args: Parameters<typeof readFileSync>) => {
        if (args[0] === path) throw Object.assign(new Error("unreadable"), { code });
        return read(...args);
      });
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(false);
    });

    it.each(["true", "false", ""])("env %j overrides unreadable project file", (env) => {
      process.env.TRACE_TO_LANGSMITH = env;
      writeFileSync(projectPath, "{}");
      const read = vi.mocked(readFileSync).getMockImplementation()!;
      vi.mocked(readFileSync).mockImplementation((...args: Parameters<typeof readFileSync>) => {
        if (args[0] === projectPath || args[0] === userPath)
          throw new Error("unreadable switch file");
        return read(...args);
      });
      expect(loadConfig({ cwd: projectDir }).enabled).toBe(env === "true");
      expect(vi.mocked(readFileSync).mock.calls.some(([path]) => path === projectPath)).toBe(true);
      expect(vi.mocked(readFileSync).mock.calls.some(([path]) => path === userPath)).toBe(false);
    });

    it.each([true, false])(
      "complete project config enabled=%s skips reading an absent user file",
      (enabled) => {
        writeFileSync(projectPath, JSON.stringify({ enabled, defaultMuted: false }));
        expect(loadConfig({ cwd: projectDir }).enabled).toBe(enabled);
        expect(vi.mocked(readFileSync).mock.calls.some(([path]) => path === userPath)).toBe(false);
      },
    );

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

    it("loads common project and replicas but not top-level camelCase credentials", () => {
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
        project: "file-project",
        replicas: [{ apiKey: "file-replica" }],
      });
    });

    it("uses process.cwd when cwd is omitted", () => {
      vi.spyOn(process, "cwd").mockReturnValue(projectDir);
      writeFileSync(projectPath, '{"enabled":true}');
      expect(loadConfig().enabled).toBe(true);
    });

    it("uses os.homedir when home environment variables are absent", () => {
      delete process.env.HOME;
      delete process.env.USERPROFILE;
      writeFileSync(userPath, '{"enabled":true}');
      expect(loadConfig({ cwd: projectDir })).toMatchObject({
        enabled: true,
        stateFilePath: `${tmpHome}/.claude/state/langsmith_state.json`,
      });
      expect(homedir).toHaveBeenCalled();
    });

    it("defaults off when the resolved home and project have no config", () => {
      delete process.env.HOME;
      delete process.env.USERPROFILE;
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

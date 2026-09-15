import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  chmodSync,
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as os from "node:os";
import { enable, disable, routingStatus, SetupError } from "./settings.js";
import { API_URL, UPSTREAM, configDir, loadConfig } from "./config.js";
import { atomic, snapshot, transaction } from "./files.js";
import { control, ensure, waitForStopped } from "./lifecycle.js";
import { targetPaths, configuredScope, matchesRouting, BASE, HEADERS } from "./scopes.js";
import { spawnSync } from "node:child_process";
import { handleGatewayInput } from "./commands.js";
import { identity } from "./server.js";
import * as setupModule from "./setup.js";

vi.mock("node:os", async (original) => ({
  ...(await original<typeof import("node:os")>()),
  userInfo: vi.fn(),
}));
vi.mock("./lifecycle.js", async (original) => ({
  ...(await original<typeof import("./lifecycle.js")>()),
  ensure: vi.fn(),
  control: vi.fn(),
  waitForStopped: vi.fn(),
}));
let home: string, settings: string;
const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
function save(value: unknown) {
  writeFileSync(settings, JSON.stringify(value), { mode: 0o600 });
}
const transport = ({
  settingsTargets: _targets,
  ...config
}: NonNullable<ReturnType<typeof loadConfig>>) => config;
const args = () => [
  "--scope",
  "global",
  "--cli",
  process.execPath,
  "--profile",
  "fake-profile",
  "--port",
  "52507",
];
const run = () => enable("/fake/gateway.js", args(), {});
beforeEach(() => {
  home = realpathSync(mkdtempSync(join(tmpdir(), "gateway-settings-")));
  vi.mocked(os.userInfo).mockReturnValue({ homedir: home } as ReturnType<typeof os.userInfo>);
  mkdirSync(join(home, ".claude"), { mode: 0o700 });
  settings = join(home, ".claude/settings.json");
  vi.mocked(ensure).mockResolvedValue(undefined);
  vi.mocked(waitForStopped).mockResolvedValue(undefined);
  vi.mocked(control).mockResolvedValue("");
});
afterEach(() => {
  vi.clearAllMocks();
  rmSync(home, { recursive: true, force: true });
});

describe("consented user transport setup (OS-home isolated, no real CLI/network)", () => {
  it("validates named scope before any filesystem or daemon effects", async () => {
    await expect(enable("/fake", [], {})).rejects.toThrow("within Claude Code");
    expect(() => disable([], {})).toThrow("within Claude Code");
    expect(existsSync(configDir(home))).toBe(false);
    expect(ensure).not.toHaveBeenCalled();
  });
  it("preserves settings and exact header text, pins config, and reverses idempotently", async () => {
    const before = {
      model: "openai/test",
      permissions: { allow: ["Read"] },
      env: {
        KEEP: "original",
        CLAUDE_CODE_OAUTH_TOKEN: "synthetic-native",
        ANTHROPIC_CUSTOM_HEADERS: "X-Test:  keep  \n\nX-Other: two\n",
      },
    };
    save(before);
    await expect(run()).resolves.toEqual({
      settingsChanged: true,
      useClaudeSubscription: false,
      modeChanged: false,
    });
    const config = loadConfig()!;
    expect(config.profile).toBe("fake-profile");
    expect(config.secret).toMatch(/^[a-f0-9]{64}$/);
    const after = json(settings);
    expect({
      ...after,
      env: { ...after.env, ANTHROPIC_CUSTOM_HEADERS: before.env.ANTHROPIC_CUSTOM_HEADERS },
    }).toMatchObject(before);
    expect(after.env.ANTHROPIC_CUSTOM_HEADERS).toBe(
      before.env.ANTHROPIC_CUSTOM_HEADERS + "\nX-LangSmith-Proxy-Key: " + config.secret,
    );
    expect(after.env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:52507");
    for (const key of ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"])
      expect(after.env[key]).toBeUndefined();
    expect(after.apiKeyHelper).toBeUndefined();
    expect(ensure).toHaveBeenCalledWith(
      expect.objectContaining(transport(config)),
      "/fake/gateway.js",
    );
    expect(control).not.toHaveBeenCalled();
    const bytes = readFileSync(settings, "utf8");
    await expect(run()).resolves.toEqual({
      settingsChanged: false,
      useClaudeSubscription: false,
      modeChanged: false,
    });
    expect(readFileSync(settings, "utf8")).toBe(bytes);
    for (const file of [settings, join(configDir(home), "config.json")])
      expect(statSync(file).mode & 0o777).toBe(0o600);
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual(before);
    expect(loadConfig()).toBeUndefined();
    expect(loadConfig(home, true)).toEqual({ ...config, enabled: false, settingsTargets: [] });
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual(before);
    await expect(enable("/fake/gateway.js", ["--scope", "global"], {})).resolves.toEqual({
      settingsChanged: true,
      useClaudeSubscription: false,
      modeChanged: false,
    });
    expect(loadConfig()).toEqual({ ...config, settingsTargets: expect.any(Array) });
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual(before);
  });
  it("requires disable before switching and replaces retained endpoints/profile without losing unrelated settings", async () => {
    const before = { model: "keep", env: { ANTHROPIC_CUSTOM_HEADERS: "X-Keep: original" } };
    save(before);
    await run();
    const original = loadConfig()!;
    const preview = [
      "--scope",
      "global",
      "--profile",
      "preview-42",
      "--api-url",
      "https://PR-42-api.review.smith.langchain.com/",
      "--gateway-url",
      "https://PR-42-gateway.review.smith.langchain.com:8443/",
    ];
    await expect(enable("/fake", preview, {})).rejects.toThrow("disable first");
    expect(loadConfig()).toEqual({ ...original, settingsTargets: expect.any(Array) });
    disable(["--scope", "global"], {});
    vi.mocked(waitForStopped).mockImplementationOnce(async (old) => {
      expect(old).toEqual({ ...original, enabled: false, settingsTargets: [] });
      expect(loadConfig()).toBeUndefined();
    });
    await enable("/fake", preview, {});
    const current = loadConfig()!;
    expect(current).toMatchObject({
      ...original,
      profile: "preview-42",
      apiUrl: "https://pr-42-api.review.smith.langchain.com",
      gatewayUrl: "https://pr-42-gateway.review.smith.langchain.com:8443",
    });
    expect(ensure).toHaveBeenLastCalledWith(expect.objectContaining(transport(current)), "/fake");
    expect(JSON.stringify(json(settings))).not.toContain("review.smith");
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual(before);
    await enable(
      "/fake",
      [
        "--scope",
        "global",
        "--profile",
        original.profile,
        "--api-url",
        API_URL,
        "--gateway-url",
        UPSTREAM,
      ],
      {},
    );
    expect(loadConfig()).toEqual({ ...original, settingsTargets: expect.any(Array) });
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual(before);
  });
  it("replaces a deleted disabled CLI without validating the old executable", async () => {
    const before = { model: "keep", env: { ANTHROPIC_CUSTOM_HEADERS: "X-Keep: original" } };
    save(before);
    const oldCLI = join(home, "old-langsmith");
    const newCLI = join(home, "new-langsmith");
    for (const cli of [oldCLI, newCLI]) writeFileSync(cli, "#!/bin/sh\nexit 1\n", { mode: 0o700 });
    await enable(
      "/fake",
      ["--scope", "global", "--cli", oldCLI, "--profile", "fake-profile", "--port", "52507"],
      {},
    );
    const original = loadConfig()!;
    disable(["--scope", "global"], {});
    rmSync(oldCLI);
    expect(existsSync(original.cli)).toBe(false);
    // Retaining the deleted executable must still fail validation.
    await expect(enable("/fake", ["--scope", "global"], {})).rejects.toThrow();
    vi.clearAllMocks();
    const validate = vi.spyOn(setupModule, "validateCLI");
    try {
      vi.mocked(waitForStopped).mockImplementationOnce(async (old) => {
        expect(old).toEqual({ ...original, enabled: false, settingsTargets: [] });
        expect(loadConfig()).toBeUndefined();
        expect(loadConfig(home, true)).toEqual({
          ...original,
          enabled: false,
          settingsTargets: [],
        });
        expect(json(settings)).toEqual(before);
        expect(ensure).not.toHaveBeenCalled();
        expect(control).not.toHaveBeenCalled();
      });
      await enable(
        "/fake",
        [
          "--scope",
          "global",
          "--cli",
          newCLI,
          "--profile",
          "preview-42",
          "--port",
          "52508",
          "--api-url",
          "https://PR-42-api.review.smith.langchain.com/",
          "--gateway-url",
          "https://PR-42-gateway.review.smith.langchain.com:8443/",
        ],
        {},
      );
      const current = loadConfig()!;
      expect(current).toEqual({
        ...original,
        cli: realpathSync(newCLI),
        profile: "preview-42",
        port: 52508,
        apiUrl: "https://pr-42-api.review.smith.langchain.com",
        gatewayUrl: "https://pr-42-gateway.review.smith.langchain.com:8443",
      });
      expect(validate).toHaveBeenCalledWith(newCLI);
      expect(validate).not.toHaveBeenCalledWith(original.cli);
      expect(waitForStopped).toHaveBeenCalledExactlyOnceWith({
        ...original,
        enabled: false,
        settingsTargets: [],
      });
      expect(ensure).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining(transport(current)),
        "/fake",
      );
      expect(control).not.toHaveBeenCalled();
      expect(json(settings).env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:52508");
      expect(json(settings).env.ANTHROPIC_CUSTOM_HEADERS).toBe(
        before.env.ANTHROPIC_CUSTOM_HEADERS + "\nX-LangSmith-Proxy-Key: " + original.secret,
      );
      disable(["--scope", "global"], {});
      expect(json(settings)).toEqual(before);
      expect(loadConfig()).toBeUndefined();
      expect(loadConfig(home, true)).toEqual({ ...current, enabled: false, settingsTargets: [] });
    } finally {
      validate.mockRestore();
    }
  });
  it("leaves disabled config/settings untouched when the old listener has not drained", async () => {
    await run();
    disable(["--scope", "global"], {});
    const before = loadConfig(home, true);
    const saved = readFileSync(settings, "utf8");
    vi.clearAllMocks();
    vi.mocked(waitForStopped).mockRejectedValueOnce(new Error("synthetic private details"));
    await expect(
      enable(
        "/fake",
        [
          "--scope",
          "global",
          "--profile",
          "preview",
          "--api-url",
          "https://api.preview.test",
          "--gateway-url",
          "https://gateway.preview.test",
        ],
        {},
      ),
    ).rejects.toThrow("Config remains disabled");
    expect(loadConfig()).toBeUndefined();
    expect(loadConfig(home, true)).toEqual(before);
    expect(readFileSync(settings, "utf8")).toBe(saved);
    expect(ensure).not.toHaveBeenCalled();
    expect(control).not.toHaveBeenCalled();
  });
  it("failed preview daemon startup retains disabled preview config, never falls back to production", async () => {
    vi.mocked(ensure).mockRejectedValueOnce(new Error("Local proxy unavailable"));
    await expect(
      enable(
        "/fake",
        [
          ...args(),
          "--api-url",
          "https://api.preview.test",
          "--gateway-url",
          "https://gateway.preview.test",
        ],
        {},
      ),
    ).rejects.toThrow("Local proxy unavailable");
    expect(loadConfig()).toBeUndefined();
    expect(loadConfig(home, true)).toMatchObject({
      apiUrl: "https://api.preview.test",
      gatewayUrl: "https://gateway.preview.test",
    });
    expect(existsSync(settings)).toBe(false);
  });
  describe.each(["fresh", "enabled", "disabled"])("%s installation preflight", (state) => {
    it.each([
      { value: { disableAllHooks: true }, message: "Persistent setup requires hooks" },
      {
        value: { env: { ANTHROPIC_CUSTOM_HEADERS: "Host: private-host.invalid" } },
        message: "Custom Host headers are unsupported",
      },
      {
        value: { env: { ANTHROPIC_CUSTOM_HEADERS: "X-Safe: keep\nhOsT: private-host.invalid" } },
        message: "Custom Host headers are unsupported",
      },
      {
        value: { env: { ANTHROPIC_CUSTOM_HEADERS: "HOST: 127.0.0.1:52507" } },
        message: "Custom Host headers are unsupported",
      },
    ])("rejects $message without writes or startup", async ({ value, message }) => {
      save({ model: "private-model", permissions: { allow: ["Read"] } });
      if (state !== "fresh") {
        await run();
        if (state === "disabled") disable(["--scope", "global"], {});
      }
      const current = json(settings);
      save({ ...current, ...value, env: { ...current.env, ...value.env } });
      const paths = [settings, join(configDir(home), "config.json")];
      const before = paths.map((path) => snapshot(path));
      vi.clearAllMocks();
      // Check both user-only headers and the same headers inherited by Claude.
      for (const env of [
        {},
        { ANTHROPIC_CUSTOM_HEADERS: json(settings).env.ANTHROPIC_CUSTOM_HEADERS },
      ]) {
        const error = await enable("/fake/gateway.js", args(), env).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(SetupError);
        expect(String(error)).toContain(message);
        expect(String(error)).not.toContain("private-host");
        expect(String(error)).not.toContain("private-model");
        expect(paths.map((path) => snapshot(path))).toEqual(before);
        expect(ensure).not.toHaveBeenCalled();
        expect(control).not.toHaveBeenCalled();
        expect(existsSync(join(configDir(home), "settings.lock"))).toBe(false);
      }
    });
  });
  it("allows explicitly enabled hooks and Host-like header names without changing them", async () => {
    const before = {
      disableAllHooks: false,
      env: { ANTHROPIC_CUSTOM_HEADERS: "X-Host: keep\nHostname: keep" },
    };
    save(before);
    await run();
    expect(json(settings).disableAllHooks).toBe(false);
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual(before);
  });
  it("disable preserves later disabled hooks and custom Host while removing owned transport", async () => {
    save({ env: { ANTHROPIC_CUSTOM_HEADERS: "X-Old: keep" } });
    await run();
    const changed = json(settings);
    changed.disableAllHooks = true;
    changed.env.ANTHROPIC_CUSTOM_HEADERS += "\nhOsT: private-host.invalid";
    save(changed);
    vi.clearAllMocks();
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual({
      disableAllHooks: true,
      env: { ANTHROPIC_CUSTOM_HEADERS: "X-Old: keep\nhOsT: private-host.invalid" },
    });
    expect(loadConfig()).toBeUndefined();
    expect(ensure).not.toHaveBeenCalled();
    expect(control).not.toHaveBeenCalled();
  });
  it("ignores malformed legacy receipts and never restores their previous values", async () => {
    await run();
    const path = join(configDir(home), "settings-ownership.json");
    writeFileSync(path, "malformed synthetic-secret", { mode: 0o600 });
    const current = json(settings);
    current.env.ANTHROPIC_CUSTOM_HEADERS =
      "Host: private-host.invalid\n" + current.env.ANTHROPIC_CUSTOM_HEADERS;
    current.disableAllHooks = true;
    save(current);
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual({
      disableAllHooks: true,
      env: { ANTHROPIC_CUSTOM_HEADERS: "Host: private-host.invalid" },
    });
    expect(readFileSync(path, "utf8")).toBe("malformed synthetic-secret");
    expect(loadConfig()).toBeUndefined();
  });
  it.each([undefined, {}, { env: {} }, { env: { ANTHROPIC_CUSTOM_HEADERS: "" } }])(
    "unsets routing without restoring absent/empty env distinctions: %j",
    async (before) => {
      if (before !== undefined) save(before);
      await run();
      disable(["--scope", "global"], {});
      expect(json(settings)).toEqual({});
    },
  );
  it("preserves later user edits, removing only the exact owned header line", async () => {
    save({ env: { ANTHROPIC_CUSTOM_HEADERS: "X-Old: original" }, model: "old" });
    await run();
    const changed = json(settings);
    changed.model = "new";
    changed.extra = { keep: true };
    changed.env.ANTHROPIC_BASE_URL = "https://user-changed.invalid";
    changed.env.ANTHROPIC_CUSTOM_HEADERS =
      changed.env.ANTHROPIC_CUSTOM_HEADERS.replace("original", "edited") + "\nX-New: keep";
    save(changed);
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual({
      ...changed,
      env: { ...changed.env, ANTHROPIC_CUSTOM_HEADERS: "X-Old: edited\nX-New: keep" },
    });
  });
  it("never removes a later replacement key or resurrects a removed header", async () => {
    await run();
    const changed = json(settings);
    changed.env.ANTHROPIC_CUSTOM_HEADERS = "X-LangSmith-Proxy-Key: user-replacement";
    save(changed);
    disable(["--scope", "global"], {});
    expect(json(settings).env).toEqual({
      ANTHROPIC_CUSTOM_HEADERS: "X-LangSmith-Proxy-Key: user-replacement",
    });
  });
  it.each([
    { apiKeyHelper: "secret-command" },
    { env: { ANTHROPIC_API_KEY: "secret" } },
    { env: { ANTHROPIC_AUTH_TOKEN: "secret" } },
    { env: { CLAUDE_CODE_USE_VERTEX: "1" } },
    { env: { ANTHROPIC_BASE_URL: "https://other.invalid" } },
    { env: { ANTHROPIC_CUSTOM_HEADERS: "x-langsmith-proxy-key: secret" } },
    { env: { ANTHROPIC_CUSTOM_HEADERS: "Authorization: secret" } },
    { env: { ANTHROPIC_CUSTOM_HEADERS: "X-Test: value\r\nX-Other: value" } },
    { env: { ANTHROPIC_CUSTOM_HEADERS: 12 } },
    { env: [] },
  ])("refuses conflicts without printing values or creating config: %j", async (before) => {
    save(before);
    const bytes = readFileSync(settings, "utf8");
    let error: unknown;
    try {
      await run();
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toContain("secret");
    expect(readFileSync(settings, "utf8")).toBe(bytes);
    expect(loadConfig()).toBeUndefined();
    expect(ensure).not.toHaveBeenCalled();
  });
  it.each([
    { ANTHROPIC_API_KEY: "secret" },
    { ANTHROPIC_BASE_URL: "https://elsewhere.invalid" },
    { ANTHROPIC_CUSTOM_HEADERS: "X-Shell: secret" },
    { CLAUDE_CONFIG_DIR: "/other" },
  ])("refuses inherited overrides without persisting them", async (env) => {
    await expect(enable("/fake", args(), env)).rejects.toThrow();
    expect(existsSync(settings)).toBe(false);
    expect(ensure).not.toHaveBeenCalled();
  });
  it("reports CLI installation guidance without invoking auth", async () => {
    await expect(
      enable("/fake", ["--scope", "global"], { PATH: "relative:/does-not-exist" }),
    ).rejects.toThrow("LangSmith CLI not found");
    expect(ensure).not.toHaveBeenCalled();
  });
  it("refuses malformed settings and changed pinned arguments", async () => {
    writeFileSync(settings, "not-json", { mode: 0o600 });
    await expect(run()).rejects.toThrow();
    expect(readFileSync(settings, "utf8")).toBe("not-json");
    save({});
    await run();
    await expect(
      enable(
        "/fake",
        ["--scope", "global", "--cli", process.execPath, "--profile", "other", "--port", "52507"],
        {},
      ),
    ).rejects.toThrow("Existing pinned");
  });
  it.each(["settings", "claude", "config-dir", "config"])(
    "refuses %s symlinks without changing targets",
    async (kind) => {
      const target = join(home, "target");
      writeFileSync(target, "untouched", { mode: 0o600 });
      if (kind === "settings") symlinkSync(target, settings);
      if (kind === "claude") {
        rmSync(join(home, ".claude"), { recursive: true });
        symlinkSync(home, join(home, ".claude"));
      }
      if (["config-dir", "config"].includes(kind)) {
        if (kind === "config-dir") symlinkSync(home, configDir(home));
        else {
          mkdirSync(configDir(home), { mode: 0o700 });
          symlinkSync(target, join(configDir(home), "config.json"));
        }
      }
      await expect(run()).rejects.toThrow();
      expect(readFileSync(target, "utf8")).toBe("untouched");
      expect(ensure).not.toHaveBeenCalled();
    },
  );
  it("refuses unsafe owner modes and disables safely on readiness failure", async () => {
    save({ model: "keep" });
    chmodSync(settings, 0o666);
    await expect(run()).rejects.toThrow("Unsafe settings file");
    chmodSync(settings, 0o600);
    vi.mocked(ensure).mockRejectedValueOnce(new Error("Local proxy unavailable"));
    await expect(run()).rejects.toThrow("Local proxy unavailable");
    expect(json(settings)).toEqual({ model: "keep" });
    expect(loadConfig()).toBeUndefined();
    expect(loadConfig(home, true)?.profile).toBe("fake-profile");
    expect(existsSync(join(configDir(home), "settings-ownership.json"))).toBe(false);
  });
  it("does not mutate settings on identity/health failure", async () => {
    vi.mocked(ensure).mockRejectedValue(new Error("Local proxy unavailable"));
    await expect(run()).rejects.toThrow("Local proxy unavailable");
    expect(control).not.toHaveBeenCalled();
    expect(existsSync(settings)).toBe(false);
    expect(loadConfig()).toBeUndefined();
  });
  it.each(["enabled", "disabled"])(
    "preserves %s installation on daemon health failure",
    async (state) => {
      save({ model: "keep" });
      await run();
      if (state === "disabled") disable(["--scope", "global"], {});
      const beforeConfig = readFileSync(join(configDir(home), "config.json"), "utf8");
      const beforeSettings = readFileSync(settings, "utf8");
      vi.mocked(ensure).mockRejectedValueOnce(new Error("Local proxy unavailable"));
      await expect(run()).rejects.toThrow("Local proxy unavailable");
      expect(readFileSync(join(configDir(home), "config.json"), "utf8")).toBe(beforeConfig);
      expect(readFileSync(settings, "utf8")).toBe(beforeSettings);
      expect(existsSync(join(configDir(home), "settings.lock"))).toBe(false);
    },
  );
  it("detects edits during readiness checks and serializes setup/disable", async () => {
    save({ model: "before" });
    vi.mocked(ensure).mockImplementation(async () => {
      expect(() => disable(["--scope", "global"], {})).toThrow("Another setup/disable");
      save({ model: "concurrent" });
    });
    await expect(run()).rejects.toThrow("Settings changed concurrently");
    expect(json(settings)).toEqual({ model: "concurrent" });
    expect(loadConfig()).toBeUndefined();
  });
  it.each(["settings", "config"])("bounds secure %s reads at 1 MiB", async (kind) => {
    await run();
    const path = kind === "settings" ? settings : join(configDir(home), "config.json");
    const read = () => (kind === "settings" ? snapshot(path, true) : loadConfig(home, true));
    const text = readFileSync(path, "utf8").padEnd(1024 * 1024, " ");
    writeFileSync(path, text);
    expect(read()).toBeDefined();
    writeFileSync(path, text + " ");
    expect(read).toThrow("Unsafe");
  });
  it("compare-before-rename refuses intervening edits", () => {
    save({ old: true });
    const before = snapshot(settings);
    save({ later: true });
    expect(() => atomic(settings, "{}", before)).toThrow("Settings changed concurrently");
    expect(json(settings)).toEqual({ later: true });
  });
  it("refuses hard-linked settings and never follows a symlink on disable", async () => {
    const target = join(home, "target");
    save({ keep: true });
    linkSync(settings, target);
    await expect(run()).rejects.toThrow("Unsafe settings file");
    rmSync(target);
    await run();
    const original = readFileSync(settings, "utf8");
    writeFileSync(target, "untouched", { mode: 0o600 });
    rmSync(settings);
    symlinkSync(target, settings);
    expect(() => disable(["--scope", "global"], {})).toThrow();
    expect(readFileSync(target, "utf8")).toBe("untouched");
    expect(loadConfig()?.enabled).toBe(true);
    rmSync(settings);
    writeFileSync(settings, original, { mode: 0o600 });
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual({ keep: true });
  });
  it("refuses an unexpected owner without reading or changing the settings", async () => {
    save({ keep: true });
    const uid = process.getuid!();
    const spy = vi.spyOn(process, "getuid").mockReturnValue(uid + 1);
    try {
      await expect(run()).rejects.toThrow("Unsafe settings directory");
    } finally {
      spy.mockRestore();
    }
    expect(json(settings)).toEqual({ keep: true });
    expect(ensure).not.toHaveBeenCalled();
  });
  it("exclusively publishes new atomic files and retains later creation", () => {
    save({ created: "by other writer" });
    expect(() => atomic(settings, "{}", undefined)).toThrow("Settings changed concurrently");
    expect(json(settings)).toEqual({ created: "by other writer" });
  });
  it("disable handles an interrupted setup without restoring unrelated data", async () => {
    const before = { model: "keep", env: { OTHER: "keep" } };
    save(before);
    await run();
    // Simulate routing absent after a partial setup.
    save({ ...before, model: "later" });
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual({ ...before, model: "later" });
    expect(loadConfig()).toBeUndefined();
  });
});

describe("explicit scoped deterministic setup", () => {
  function project(name: string) {
    const cwd = join(home, name);
    mkdirSync(cwd, { mode: 0o700 });
    return realpathSync(cwd);
  }
  const scoped = (scope: string) => ["--scope", scope];
  it("shares a singleton across global and two projects and disables by matching known disk targets", async () => {
    const a = project("a"),
      b = project("b");
    await run();
    const config = loadConfig()!;
    for (const cwd of [a, b]) {
      await enable("/fake", scoped("project"), {}, home, cwd);
      expect(loadConfig()).toEqual({ ...config, settingsTargets: expect.any(Array) });
      const p = targetPaths(home, "project", cwd);
      expect(statSync(p.settings).mode & 0o777).toBe(0o600);
      expect(json(p.settings).env.ANTHROPIC_CUSTOM_HEADERS).toContain(config.secret);
    }
    const bytes = snapshot(targetPaths(home, "project", b).settings);
    await expect(
      enable("/fake", [...scoped("project"), "--profile", "different"], {}, home, b),
    ).rejects.toThrow("Existing pinned");
    expect(snapshot(targetPaths(home, "project", b).settings)).toEqual(bytes);
    expect(loadConfig()).toEqual({ ...config, settingsTargets: expect.any(Array) });
    disable(scoped("global"), {}, home);
    expect(loadConfig()).toEqual({ ...config, settingsTargets: expect.any(Array) });
    expect(configuredScope(home, a, config)).toBe(true);
    expect(configuredScope(home, project("unapproved"), config)).toBe(false);
    disable(scoped("project"), {}, home, a);
    expect(loadConfig()).toEqual({ ...config, settingsTargets: expect.any(Array) });
    expect(configuredScope(home, a, config)).toBe(false);
    disable(scoped("project"), {}, home, a);
    expect(loadConfig()).toEqual({ ...config, settingsTargets: expect.any(Array) });
    disable(scoped("project"), {}, home, b);
    expect(loadConfig()).toBeUndefined();
    expect(json(targetPaths(home, "project", a).settings)).toEqual({});
    expect(json(targetPaths(home, "project", b).settings)).toEqual({});
  });
  it("adopts explicit-mode endpoint-less config without receipts or losing unrelated settings", async () => {
    save({ env: { ANTHROPIC_CUSTOM_HEADERS: "X-Old: keep" } });
    await run();
    const path = join(configDir(home), "config.json");
    const legacy = json(path);
    delete legacy.apiUrl;
    delete legacy.gatewayUrl;
    writeFileSync(path, JSON.stringify(legacy));
    expect(loadConfig()?.useClaudeSubscription).toBe(false);
    const cwd = project("provisioned");
    await enable("/fake", scoped("project"), {}, home, cwd);
    disable(scoped("global"), {}, home);
    expect(json(settings)).toEqual({ env: { ANTHROPIC_CUSTOM_HEADERS: "X-Old: keep" } });
    expect(loadConfig()).toBeDefined();
    disable(scoped("project"), {}, home, cwd);
    expect(loadConfig()).toBeUndefined();
  });
  it("expanded slash commands preserve arguments, block the model, and never call auth", async () => {
    const expand = (name: string, args: string) =>
      readFileSync(
        new URL(`../../plugins/langsmith-gateway/commands/${name}.md`, import.meta.url),
        "utf8",
      )
        .split("---\n")[2]
        .trim()
        .replace("$ARGUMENTS", args);
    const output = vi.fn();
    await handleGatewayInput(
      {
        hook_event_name: "UserPromptSubmit",
        prompt: expand(
          "setup",
          `--scope global --cli ${process.execPath} --profile preview --port 52508 --api-url https://api.preview.test/ --gateway-url https://gateway.preview.test:8443/`,
        ),
        cwd: home,
      },
      "/fake",
      {},
      home,
      output,
    );
    expect(output).toHaveBeenCalledWith({
      decision: "block",
      reason:
        "Gateway settings saved for the selected scope; OAuth-only gateway auth; native credentials are not forwarded. Gateway provider keys and provider billing apply. local daemon healthy. Authentication is checked on the first model request, not setup.",
    });
    expect(output).toHaveBeenCalledTimes(1);
    expect(loadConfig()).toMatchObject({
      cli: process.execPath,
      profile: "preview",
      port: 52508,
      apiUrl: "https://api.preview.test",
      gatewayUrl: "https://gateway.preview.test:8443",
    });
    expect(json(settings).env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:52508");
    expect(control).not.toHaveBeenCalled();
    await handleGatewayInput(
      {
        hook_event_name: "UserPromptSubmit",
        prompt: expand("disable", "--scope global"),
        cwd: home,
      },
      "/fake",
      {},
      home,
      output,
    );
    expect(output).toHaveBeenLastCalledWith({
      decision: "block",
      reason: expect.stringContaining("Gateway disabled"),
    });
    expect(output).toHaveBeenCalledTimes(2);
    expect(output.mock.calls[0][0].reason).not.toMatch(/restart|live|next request/i);
    expect(output.mock.calls[1][0].reason).toBe(
      "Gateway disabled for the selected scope; matching gateway routing settings removed (no previous values restored) and later edits preserved. Restart affected Claude sessions to stop using the proxy. Other known matching scopes remain active. After the last known active scope is disabled, the daemon drains (up to 5 seconds to notice, then up to 30 seconds for active work).",
    );
    expect(loadConfig()).toBeUndefined();
  });
  it("reports already configured without another restart instruction on repeated setup", async () => {
    await run();
    const before = readFileSync(settings, "utf8");
    const output = vi.fn();
    await handleGatewayInput(
      {
        hook_event_name: "UserPromptSubmit",
        prompt: "/langsmith-gateway:setup --scope global",
        cwd: home,
      },
      "/fake",
      {},
      home,
      output,
    );
    expect(output).toHaveBeenCalledExactlyOnceWith({
      decision: "block",
      reason:
        "Gateway settings already configured for the selected scope; OAuth-only gateway auth; native credentials are not forwarded. Gateway provider keys and provider billing apply. local daemon healthy. Authentication is checked on the first model request, not setup.",
    });
    expect(readFileSync(settings, "utf8")).toBe(before);
    expect(ensure).toHaveBeenCalledTimes(2);
    expect(control).not.toHaveBeenCalled();
  });
  it.each([
    "/langsmith-gateway:setup",
    "/langsmith-gateway:setup --scope global --scope project",
    "/langsmith-gateway:setup --scope project; touch /tmp/no",
    "/langsmith-gateway:disable --scope global --profile bad",
    "/langsmith-gateway:setup --scope global\nextra",
    "/langsmith-gateway:setup --scope global --port 4e4",
    "/langsmith-gateway:setup --scope global --api-url https://example.com",
  ])("blocks malformed command before any config IO: %s", async (prompt) => {
    const output = vi.fn();
    await handleGatewayInput(
      { hook_event_name: "UserPromptSubmit", prompt, cwd: home },
      "/fake",
      {},
      "/unreadable/nonexistent",
      output,
    );
    expect(output).toHaveBeenCalledWith({
      decision: "block",
      reason: expect.stringMatching(/within Claude Code|Supply both/),
    });
    expect(existsSync(configDir(home))).toBe(false);
    expect(ensure).not.toHaveBeenCalled();
  });
  it("ignores lookalikes and project-controlled configuration without autoenable", async () => {
    const output = vi.fn();
    const cwd = project("untrusted");
    mkdirSync(join(cwd, ".claude"));
    writeFileSync(join(cwd, ".claude/settings.local.json"), '{"enabled":true}');
    for (const prompt of [
      "explain /langsmith-gateway:setup --scope global",
      "/langsmith-gateway:setup-more --scope global",
    ])
      await handleGatewayInput(
        { hook_event_name: "UserPromptSubmit", prompt, cwd, session_id: "test" },
        "/fake",
        {},
        home,
        output,
      );
    expect(output).not.toHaveBeenCalled();
    expect(ensure).not.toHaveBeenCalled();
    expect(loadConfig()).toBeUndefined();
  });
});

it("rolls back completed writes on a later transaction failure without persistent backups", () => {
  const first = join(home, "first");
  writeFileSync(first, "original", { mode: 0o600 });
  const second = join(home, "missing-parent", "second");
  expect(() =>
    transaction([
      { path: first, text: "replacement", prior: snapshot(first) },
      { path: second, text: "never-written", prior: undefined },
    ]),
  ).toThrow();
  expect(readFileSync(first, "utf8")).toBe("original");
  expect(existsSync(second)).toBe(false);
});

it("rejects project settings hardlinks/symlinks without changing other targets", async () => {
  const cwd = realpathSync(home);
  const p = targetPaths(home, "project", cwd);
  await enable("/fake", ["--scope", "project", "--cli", process.execPath], {}, home, cwd);
  const config = loadConfig()!;
  const backup = join(home, "backup");
  linkSync(p.settings, backup);
  expect(() => disable(["--scope", "project"], {}, home, cwd)).toThrow("Unsafe settings file");
  rmSync(backup);
  const original = readFileSync(p.settings, "utf8");
  rmSync(p.settings);
  writeFileSync(backup, "untouched", { mode: 0o600 });
  symlinkSync(backup, p.settings);
  expect(() => disable(["--scope", "project"], {}, home, cwd)).toThrow();
  expect(readFileSync(backup, "utf8")).toBe("untouched");
  expect(loadConfig()).toEqual({ ...config, settingsTargets: expect.any(Array) });
  rmSync(p.settings);
  writeFileSync(p.settings, original, { mode: 0o600 });
  disable(["--scope", "project"], {}, home, cwd);
  expect(loadConfig()).toBeUndefined();
});

it.each(["global", "project"] as const)(
  "switches only the active %s mode, preserving settings, key and target index",
  async (scope) => {
    const cwd = realpathSync(home);
    const p = targetPaths(home, scope, cwd);
    const invoke = (...flags: string[]) =>
      enable("/fake", ["--scope", scope, ...flags], {}, home, cwd);
    await invoke("--cli", process.execPath);
    const original = loadConfig()!;
    const bytes = readFileSync(p.settings, "utf8");
    for (const choice of [true, false]) {
      const old = loadConfig()!;
      vi.mocked(waitForStopped).mockImplementationOnce(async (config) => {
        expect(config).toEqual(old);
        expect(loadConfig()).toBeUndefined();
        expect(loadConfig(home, true)?.useClaudeSubscription).toBe(choice);
        expect(readFileSync(p.settings, "utf8")).toBe(bytes);
      });
      const flags = choice ? ["--use-claude-subscription"] : [];
      await expect(invoke(...flags)).resolves.toEqual({
        settingsChanged: false,
        useClaudeSubscription: choice,
        modeChanged: true,
      });
      expect(loadConfig()).toEqual({ ...original, useClaudeSubscription: choice });
      expect(configuredScope(home, cwd, loadConfig()!)).toBe(true);
      expect(ensure).toHaveBeenLastCalledWith(
        expect.objectContaining(transport(loadConfig()!)),
        "/fake",
      );
      expect(readFileSync(p.settings, "utf8")).toBe(bytes);
      expect(identity(loadConfig()!)).not.toBe(identity(old));
      await expect(invoke(...flags)).resolves.toMatchObject({
        useClaudeSubscription: choice,
        modeChanged: false,
      });
      expect(loadConfig()?.useClaudeSubscription).toBe(choice);
    }
    expect(control).not.toHaveBeenCalled();
  },
);

it("refuses shared mode changes and unconfigured targets without altering any active scope", async () => {
  await run();
  const cwd = realpathSync(home);
  const invoke = (scope: string, ...flags: string[]) =>
    enable("/fake", ["--scope", scope, ...flags], {}, home, cwd);
  const original = loadConfig()!;
  await expect(invoke("project", "--use-claude-subscription")).rejects.toThrow(
    "Disable every other active scope",
  );
  await invoke("project");
  const paths = [
    settings,
    targetPaths(home, "project", cwd).settings,
    ...["config.json"].map((n) => join(configDir(home), n)),
  ];
  const saved = paths.map((path) => snapshot(path));
  await expect(invoke("global", "--use-claude-subscription")).rejects.toThrow(
    "Disable every other active scope",
  );
  expect(paths.map((path) => snapshot(path))).toEqual(saved);
  expect(loadConfig()).toEqual({ ...original, settingsTargets: expect.any(Array) });
  disable(["--scope", "project"], {}, home, cwd);
  await invoke("global", "--use-claude-subscription");
  expect(loadConfig()?.useClaudeSubscription).toBe(true);
});

it.each(["drain", "health"])(
  "retains requested opt-out disabled and transport intact on %s failure, then retries",
  async (failure) => {
    await enable("/fake", [...args(), "--use-claude-subscription"], {});
    const bytes = readFileSync(settings, "utf8");
    if (failure === "drain") vi.mocked(waitForStopped).mockRejectedValueOnce(new Error("private"));
    else vi.mocked(ensure).mockRejectedValueOnce(new Error("private"));
    const optOut = () => enable("/fake", ["--scope", "global"], {});
    await expect(optOut()).rejects.toThrow("Config remains disabled");
    expect(loadConfig()).toBeUndefined();
    expect(loadConfig(home, true)?.useClaudeSubscription).toBe(false);
    expect(readFileSync(settings, "utf8")).toBe(bytes);
    await optOut();
    expect(loadConfig()?.useClaudeSubscription).toBe(false);
  },
);

it.each([false, true])(
  "rejects missing mode and incomplete disabled config without changing disk (disabled=%s)",
  async (disabled) => {
    await run();
    const path = join(configDir(home), "config.json");
    const saved = json(path);
    const beforeSettings = readFileSync(settings, "utf8");
    for (const invalid of [
      { ...saved, enabled: !disabled, useClaudeSubscription: undefined },
      { enabled: false },
    ]) {
      writeFileSync(path, JSON.stringify(invalid));
      const before = readFileSync(path, "utf8");
      vi.clearAllMocks();
      for (const includeDisabled of [false, true])
        expect(() => loadConfig(home, includeDisabled)).toThrow("one-time private config update");
      await expect(run()).rejects.toThrow("one-time private config update");
      expect(() => disable(["--scope", "global"], {})).toThrow("one-time private config update");
      expect(readFileSync(path, "utf8")).toBe(before);
      expect(readFileSync(settings, "utf8")).toBe(beforeSettings);
      expect(ensure).not.toHaveBeenCalled();
      expect(control).not.toHaveBeenCalled();
      expect(waitForStopped).not.toHaveBeenCalled();
    }
  },
);

it("omitted setup refuses to switch multiple active true scopes without writes", async () => {
  const cwd = realpathSync(home);
  const invoke = (scope: string, ...flags: string[]) =>
    enable("/fake", ["--scope", scope, ...flags], {}, home, cwd);
  await invoke("global", "--cli", process.execPath, "--use-claude-subscription");
  await invoke("project", "--use-claude-subscription");
  const global = targetPaths(home, "global", cwd);
  const project = targetPaths(home, "project", cwd);
  const paths = [global.config, global.settings, project.settings];
  const before = paths.map((path) => snapshot(path));
  for (const scope of ["global", "project"]) {
    await expect(invoke(scope)).rejects.toThrow("Disable every other active scope");
    expect(paths.map((path) => snapshot(path))).toEqual(before);
  }
  expect(waitForStopped).not.toHaveBeenCalled();
});

it("macro opt-out switches daemon without a client restart instruction or authentication", async () => {
  await enable("/fake", [...args(), "--use-claude-subscription"], {});
  const output = vi.fn();
  await handleGatewayInput(
    {
      hook_event_name: "UserPromptSubmit",
      prompt: "/langsmith-gateway:setup --scope global",
      cwd: home,
    },
    "/fake",
    {},
    home,
    output,
  );
  const result = output.mock.calls[0][0];
  expect(result.decision).toBe("block");
  expect(result.reason).toContain("OAuth-only");
  expect(result.reason).toContain("downtime");
  expect(result.reason).not.toMatch(/restart|live|next request/i);
  expect(control).not.toHaveBeenCalled();
});

it("mode exception cannot relax pinned endpoint changes", async () => {
  await run();
  const config = loadConfig()!;
  const bytes = readFileSync(settings, "utf8");
  await expect(
    enable(
      "/fake",
      [
        ...args(),
        "--use-claude-subscription",
        "--api-url",
        "https://api.example.com",
        "--gateway-url",
        "https://gateway.example.com",
      ],
      {},
    ),
  ).rejects.toThrow("disable first");
  expect(loadConfig()).toEqual({ ...config, settingsTargets: expect.any(Array) });
  expect(readFileSync(settings, "utf8")).toBe(bytes);
  expect(waitForStopped).not.toHaveBeenCalled();
});

it("preserves later settings edits while switching and later disable still undoes only owned transport", async () => {
  save({ model: "before", env: { ANTHROPIC_CUSTOM_HEADERS: "X-Old: keep" } });
  await run();
  const later = json(settings);
  later.model = "after";
  later.env.ANTHROPIC_CUSTOM_HEADERS += "\nX-Later: keep";
  save(later);
  const bytes = readFileSync(settings, "utf8");
  await enable("/fake", [...args(), "--use-claude-subscription"], {});
  expect(readFileSync(settings, "utf8")).toBe(bytes);
  disable(["--scope", "global"], {});
  expect(json(settings)).toEqual({
    model: "after",
    env: { ANTHROPIC_CUSTOM_HEADERS: "X-Old: keep\nX-Later: keep" },
  });
});

it("refuses intervening settings edits during mode drain without re-enabling", async () => {
  await run();
  vi.mocked(waitForStopped).mockImplementationOnce(async () => {
    const later = json(settings);
    later.model = "concurrent";
    save(later);
  });
  vi.mocked(ensure).mockClear();
  await expect(enable("/fake", [...args(), "--use-claude-subscription"], {})).rejects.toThrow();
  expect(loadConfig()).toBeUndefined();
  expect(loadConfig(home, true)?.useClaudeSubscription).toBe(true);
  expect(json(settings).model).toBe("concurrent");
  expect(ensure).not.toHaveBeenCalled();
});

describe.each(["global", "project"] as const)("same-session %s re-enable", (scope) => {
  it.each([undefined, "", "x-MiXeD:  keep : unusual  \n\nX-Other: two\n"])(
    "recreates exact transport with retained key and disk headers %j, without inferring live routing",
    async (headers) => {
      const cwd = realpathSync(home);
      const p = targetPaths(home, scope, cwd);
      const before = {
        model: "keep",
        permissions: { allow: ["Read"] },
        env: {
          KEEP: "original",
          ...(headers === undefined ? {} : { ANTHROPIC_CUSTOM_HEADERS: headers }),
        },
      };
      writeFileSync(p.settings, JSON.stringify(before), { mode: 0o600 });
      const args = ["--scope", scope];
      await enable(
        "/fake",
        [...args, "--cli", process.execPath, "--use-claude-subscription"],
        {},
        home,
        cwd,
      );
      const disabled = headers === "" ? { ...before, env: { KEEP: "original" } } : before;
      const config = loadConfig()!;
      const inherited = { ...json(p.settings).env };
      const after = json(p.settings);
      disable(args, inherited, home, cwd);
      expect(json(p.settings)).toEqual(disabled);
      expect(loadConfig(home, true)?.settingsTargets).toEqual([]);
      expect(configuredScope(home, cwd, config)).toBe(false);
      expect(loadConfig()).toBeUndefined();
      vi.clearAllMocks();
      const output = vi.fn();
      // Neither ordinary prompts nor lifecycle recovery can implicitly re-enable.
      for (const event of ["SessionStart", "UserPromptSubmit", "SessionEnd"]) {
        await handleGatewayInput(
          { hook_event_name: event, prompt: "hello", cwd, session_id: "same-session" },
          "/fake",
          inherited,
          home,
          output,
        );
      }
      expect(output).not.toHaveBeenCalled();
      expect(ensure).not.toHaveBeenCalled();
      expect(control).not.toHaveBeenCalled();
      expect(loadConfig()).toBeUndefined();
      vi.mocked(waitForStopped).mockImplementationOnce(async (old) => {
        expect(old).toEqual({ ...config, enabled: false, settingsTargets: [] });
        expect(loadConfig()).toBeUndefined();
        expect(json(p.settings)).toEqual(disabled);
      });
      // Omission is still explicit opt-out, even with a retained true config.
      await handleGatewayInput(
        {
          hook_event_name: "UserPromptSubmit",
          prompt: `/langsmith-gateway:setup --scope ${scope}`,
          cwd,
        },
        "/fake",
        inherited,
        home,
        output,
      );
      expect(output).toHaveBeenCalledExactlyOnceWith({
        decision: "block",
        reason: expect.stringContaining("Gateway settings saved for the selected scope"),
      });
      expect(output.mock.calls[0][0].reason).not.toMatch(/restart|live|next request/i);
      expect(output.mock.calls[0][0].reason).not.toContain(config.secret);
      expect(loadConfig()).toEqual({ ...config, useClaudeSubscription: false });
      expect(json(p.settings)).toEqual(after);
      expect(loadConfig()?.settingsTargets).toEqual([p.settings]);
      expect(configuredScope(home, cwd, loadConfig()!)).toBe(true);
      expect(waitForStopped).toHaveBeenCalledExactlyOnceWith({
        ...config,
        enabled: false,
        settingsTargets: [],
      });
      expect(ensure).toHaveBeenCalledTimes(1);
      expect(control).not.toHaveBeenCalled();
      disable(args, inherited, home, cwd);
      expect(json(p.settings)).toEqual(disabled);
      // Report disk changes without inferring the parent session's live transport.
      await expect(enable("/fake", args, inherited, home, cwd)).resolves.toMatchObject({
        settingsChanged: true,
      });
      disable(args, inherited, home, cwd);
      expect(json(p.settings)).toEqual(disabled);
    },
  );

  it.each([
    ["unknown key", (s: string) => s.replace(/Proxy-Key: .+/, `Proxy-Key: ${"a".repeat(64)}`)],
    ["added header", (s: string) => s + "\nX-Extra: secret"],
    ["altered header", (s: string) => s.replace("original", "edited")],
    ["reordered", (s: string) => s.split("\n").reverse().join("\n")],
    ["key case", (s: string) => s.replace("X-LangSmith-Proxy-Key", "x-langsmith-proxy-key")],
    ["key spacing", (s: string) => s.replace("Proxy-Key: ", "Proxy-Key:  ")],
    ["duplicate key", (s: string) => s + "\n" + s.split("\n")[1]],
    ["missing config"],
    ["different base"],
    ["changed port"],
    ["later disk edit"],
  ] as const)(
    "rejects stale transport with %s before persistent writes or daemon effects",
    async (change, headers) => {
      const cwd = realpathSync(home);
      const p = targetPaths(home, scope, cwd);
      writeFileSync(
        p.settings,
        JSON.stringify({ env: { ANTHROPIC_CUSTOM_HEADERS: "X-Keep: original" } }),
        { mode: 0o600 },
      );
      const args = ["--scope", scope];
      await enable("/fake", [...args, "--cli", process.execPath], {}, home, cwd);
      const inherited = { ...json(p.settings).env };
      disable(args, inherited, home, cwd);
      if (headers) inherited.ANTHROPIC_CUSTOM_HEADERS = headers(inherited.ANTHROPIC_CUSTOM_HEADERS);
      if (change === "missing config") rmSync(p.config);
      if (change === "different base") inherited.ANTHROPIC_BASE_URL = "https://other.invalid";
      if (change === "changed port") args.push("--port", "52508");
      if (change === "later disk edit")
        writeFileSync(
          p.settings,
          JSON.stringify({ env: { ANTHROPIC_CUSTOM_HEADERS: "X-Keep: edited" } }),
        );
      const paths = [p.settings, p.config];
      const before = paths.map((path) => snapshot(path));
      vi.clearAllMocks();
      await expect(enable("/fake", args, inherited, home, cwd)).rejects.toThrow(SetupError);
      expect(paths.map((path) => snapshot(path))).toEqual(before);
      expect(loadConfig()).toBeUndefined();
      expect(ensure).not.toHaveBeenCalled();
      expect(waitForStopped).not.toHaveBeenCalled();
      expect(control).not.toHaveBeenCalled();
    },
  );

  it("reports settings changes when only the inherited headers match", async () => {
    const cwd = realpathSync(home);
    const p = targetPaths(home, scope, cwd);
    const args = ["--scope", scope];
    await enable("/fake", [...args, "--cli", process.execPath], {}, home, cwd);
    const inherited = { ANTHROPIC_CUSTOM_HEADERS: json(p.settings).env.ANTHROPIC_CUSTOM_HEADERS };
    disable(args, {}, home, cwd);
    await expect(enable("/fake", args, inherited, home, cwd)).resolves.toMatchObject({
      settingsChanged: true,
    });
  });
});

it("re-enables a retired project while other scopes stay active, without trusting its headers in another target", async () => {
  const project = (name: string) => {
    const cwd = join(home, name);
    mkdirSync(cwd, { mode: 0o700 });
    return realpathSync(cwd);
  };
  const scoped = (scope: string) => ["--scope", scope];
  const a = project("retired"),
    b = project("other");
  const pa = targetPaths(home, "project", a),
    pb = targetPaths(home, "project", b);
  mkdirSync(join(a, ".claude"), { mode: 0o700 });
  writeFileSync(
    pa.settings,
    JSON.stringify({ env: { ANTHROPIC_CUSTOM_HEADERS: "X-Project: a" } }),
    { mode: 0o600 },
  );
  await run();
  await enable("/fake", scoped("project"), {}, home, a);
  const inherited = { ...json(pa.settings).env };
  disable(scoped("project"), inherited, home, a);
  const config = loadConfig()!;
  const global = targetPaths(home, "global", home);
  const before = [global.settings].map((path) => snapshot(path));
  expect(loadConfig()?.settingsTargets).toHaveLength(1);
  vi.clearAllMocks();
  await expect(enable("/fake", scoped("project"), inherited, home, b)).rejects.toThrow(
    "Inherited custom headers",
  );
  expect(snapshot(pb.settings)).toBeUndefined();
  expect(ensure).not.toHaveBeenCalled();
  await expect(enable("/fake", scoped("project"), inherited, home, a)).resolves.toMatchObject({
    settingsChanged: true,
  });
  expect(loadConfig()).toEqual({ ...config, settingsTargets: expect.any(Array) });
  expect([global.settings].map((path) => snapshot(path))).toEqual(before);
  expect(loadConfig()?.settingsTargets).toHaveLength(2);
  expect(waitForStopped).not.toHaveBeenCalled();
  disable(scoped("project"), inherited, home, a);
  expect(loadConfig()).toEqual({ ...config, settingsTargets: expect.any(Array) });
  disable(scoped("global"), {}, home);
  expect(loadConfig()).toBeUndefined();
});

describe("externally provisioned receipt-free routing", () => {
  async function provision() {
    setupModule.createConfig(process.execPath, "it-profile", 52507, home);
    const config = loadConfig()!;
    save({
      model: "keep",
      env: {
        ANTHROPIC_BASE_URL: `http://127.0.0.1:${config.port}`,
        ANTHROPIC_CUSTOM_HEADERS: `X-IT: keep\nX-LangSmith-Proxy-Key: ${config.secret}`,
      },
    });
    return config;
  }
  it("recognizes routing without setup, an index or receipts; ignores stale receipts", async () => {
    const config = await provision();
    const path = join(configDir(home), "settings-ownership.json");
    writeFileSync(path, "invalid synthetic-private", { mode: 0o600 });
    const before = [settings, join(configDir(home), "config.json"), path].map((p) => snapshot(p));
    expect(configuredScope(home, home, config)).toBe(true);
    expect([settings, join(configDir(home), "config.json"), path].map((p) => snapshot(p))).toEqual(
      before,
    );
    expect(loadConfig()?.settingsTargets).toBeUndefined();
  });
  it("adopts provisioned routing and ignores linked legacy records even with no private config", async () => {
    mkdirSync(configDir(home), { mode: 0o700 });
    const path = join(configDir(home), "settings-ownership.json");
    symlinkSync(join(home, "missing"), path);
    await run();
    expect(configuredScope(home, home, loadConfig()!)).toBe(true);
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual({});
    expect(loadConfig()).toBeUndefined();
  });
  it("unsets provisioned transport without restoring old base/header values", async () => {
    await provision();
    const path = join(configDir(home), "settings-ownership.json");
    writeFileSync(
      path,
      JSON.stringify({ beforeBase: "https://old.test", beforeHeaders: "X-Old: secret" }),
      { mode: 0o600 },
    );
    disable(["--scope", "global"], {});
    expect(json(settings)).toEqual({
      model: "keep",
      env: { ANTHROPIC_CUSTOM_HEADERS: "X-IT: keep" },
    });
    expect(loadConfig()).toBeUndefined();
    expect(loadConfig(home, true)?.settingsTargets).toEqual([]);
  });
  it("adopts provisioned matching settings without changing their bytes or rotating the key", async () => {
    const config = await provision();
    const bytes = readFileSync(settings, "utf8");
    await enable("/fake", ["--scope", "global"], {});
    expect(readFileSync(settings, "utf8")).toBe(bytes);
    expect(loadConfig()).toEqual({ ...config, settingsTargets: [settings] });
  });
  it("uses disk matches, not index membership, and never re-enables on disable", async () => {
    const config = await provision();
    const cwd = join(home, "external");
    mkdirSync(join(cwd, ".claude"), { recursive: true, mode: 0o700 });
    const local = targetPaths(home, "project", cwd).settings;
    writeFileSync(local, readFileSync(settings), { mode: 0o600 });
    const path = join(configDir(home), "config.json");
    writeFileSync(path, JSON.stringify({ ...config, settingsTargets: [local] }));
    disable(["--scope", "global"], {}, home, home);
    expect(loadConfig()?.settingsTargets).toEqual([local]);
    expect(configuredScope(home, cwd, loadConfig()!)).toBe(true);
    writeFileSync(path, JSON.stringify({ ...loadConfig()!, enabled: false }));
    disable(["--scope", "global"], {}, home, home);
    expect(loadConfig()).toBeUndefined();
    writeFileSync(path, JSON.stringify({ ...config, settingsTargets: [local] }));
    writeFileSync(local, JSON.stringify({ env: { ANTHROPIC_BASE_URL: "https://later.test" } }));
    disable(["--scope", "global"], {}, home, home);
    expect(loadConfig()).toBeUndefined();
    expect(json(local)).toEqual({ env: { ANTHROPIC_BASE_URL: "https://later.test" } });
  });
  it("observes project overrides without accepting project-selected endpoints or modes", async () => {
    const config = await provision();
    const local = targetPaths(home, "project", home).settings;
    writeFileSync(
      local,
      JSON.stringify({
        enabled: true,
        gatewayUrl: "https://arbitrary.test",
        env: { ANTHROPIC_BASE_URL: "https://other.test" },
      }),
      { mode: 0o600 },
    );
    expect(configuredScope(home, home, config)).toBe(false);
    writeFileSync(
      local,
      JSON.stringify({ env: { ANTHROPIC_BASE_URL: `http://127.0.0.1:${config.port}` } }),
    );
    expect(configuredScope(home, home, config)).toBe(true);
    expect(loadConfig()).toEqual(config);
  });
  it("preserves later settings on partial transaction failure and disables new config", async () => {
    // A concurrent creator blocks the settings write after readiness, without
    // requiring a persistent write-ahead record to clean up matching routing.
    vi.mocked(ensure).mockImplementationOnce(async () => save({ model: "later" }));
    await expect(run()).rejects.toThrow("Settings changed concurrently");
    expect(json(settings)).toEqual({ model: "later" });
    expect(loadConfig()).toBeUndefined();
  });
});

it("disable leaves empty unrelated env untouched when no routing matches", async () => {
  setupModule.createConfig(process.execPath, "it-profile", 52507, home);
  save({ env: {}, model: "keep" });
  const before = snapshot(settings);
  disable(["--scope", "global"], {});
  expect(snapshot(settings)).toEqual(before);
});

it.each([
  null,
  {},
  ["relative/.claude/settings.local.json"],
  ["/tmp/../tmp/.claude/settings.json"],
  ["/tmp/other.json"],
  Array(129).fill("/tmp/.claude/settings.local.json"),
])(
  "rejects invalid optional routing index %j without accepting it as config",
  (settingsTargets) => {
    setupModule.createConfig(process.execPath, "it-profile", 52507, home);
    const path = join(configDir(home), "config.json");
    writeFileSync(path, JSON.stringify({ ...loadConfig()!, settingsTargets }));
    expect(() => loadConfig()).toThrow("Invalid proxy configuration");
  },
);

it("index changes do not change daemon identity or require referenced files for hooks", async () => {
  await run();
  const config = loadConfig()!;
  const indexed = {
    ...config,
    settingsTargets: [join(home, "missing/.claude/settings.local.json")],
  };
  writeFileSync(join(configDir(home), "config.json"), JSON.stringify(indexed));
  expect(identity(indexed)).toBe(identity(config));
  expect(configuredScope(home, home, loadConfig()!)).toBe(true);
});

describe("saved routing diagnostics", () => {
  const config = {
    enabled: true,
    useClaudeSubscription: false,
    cli: "/unused-cli",
    profile: "unused-profile",
    port: 52507,
    secret: "synthetic-proxy-secret",
  };
  const base = `http://127.0.0.1:${config.port}`;
  const key = `X-LangSmith-Proxy-Key: ${config.secret}`;
  const unconfigured = "gateway routing is not configured in this settings file";
  const configured = "configured to use the local gateway proxy";
  const incomplete =
    "gateway routing is incomplete; local proxy authentication header is present but Claude’s saved API address is missing";
  const differentBase = "Claude’s saved API address differs from this proxy’s address";
  const missingKey = "local proxy authentication header is missing";
  const differentKey = "local proxy authentication header does not match";
  it.each([
    { name: "missing file", saved: undefined, diagnostic: unconfigured },
    { name: "missing env", saved: {}, diagnostic: unconfigured },
    { name: "empty env", saved: { env: {} }, diagnostic: unconfigured },
    {
      name: "unrelated headers only",
      headers: "X-Private: synthetic-header",
      diagnostic: unconfigured,
    },
    { name: "key without base", headers: key, diagnostic: incomplete },
    { name: "empty base with key", base: "", headers: key, diagnostic: incomplete },
    { name: "matching route", base, headers: key, diagnostic: configured },
    {
      name: "matching with unrelated headers and blank lines",
      base,
      headers: `X-Private: synthetic-header\n\n${key}\n`,
      diagnostic: configured,
    },
    {
      name: "different base",
      base: "https://synthetic-user:synthetic-password@example.test/private?key=synthetic-query",
      headers: key,
      diagnostic: differentBase,
    },
    {
      name: "non-string base",
      base: { secret: "synthetic-private-value" },
      headers: key,
      diagnostic: differentBase,
    },
    { name: "missing headers", base, diagnostic: missingKey },
    {
      name: "unrelated headers",
      base,
      headers: "X-Private: synthetic-header",
      diagnostic: missingKey,
    },
    {
      name: "non-string headers",
      base,
      headers: [key, "synthetic-private-value"],
      diagnostic: missingKey,
    },
    {
      name: "wrong key",
      base,
      headers: "X-LangSmith-Proxy-Key: synthetic-wrong-key",
      diagnostic: differentKey,
    },
    { name: "duplicate key", base, headers: `${key}\n${key}`, diagnostic: differentKey },
    { name: "differently cased key", base, headers: key.toLowerCase(), diagnostic: differentKey },
    { name: "extra key whitespace", base, headers: ` ${key}`, diagnostic: differentKey },
    {
      name: "mixed-case duplicate",
      base,
      headers: `${key}\n ${key.toLowerCase()}`,
      diagnostic: differentKey,
    },
  ])("$name", (test) => {
    const saved =
      "saved" in test ? test.saved : { env: { [BASE]: test.base, [HEADERS]: test.headers } };
    if (saved !== undefined) save(saved);
    const before = snapshot(settings);
    const result = routingStatus(targetPaths(home, "global", ""), config);
    expect(result).toBe(
      `settings ${saved === undefined ? "missing" : "present"}; ${test.diagnostic}`,
    );
    // Diagnostics must agree with the existing exact routing matcher, including
    // its case/spacing and duplicate-key rules, without changing those rules.
    expect(matchesRouting(saved && "env" in saved ? saved.env : {}, config)).toBe(
      test.diagnostic === configured,
    );
    expect(result).not.toMatch(/synthetic-|X-LangSmith|https?:/);
    expect(snapshot(settings)).toEqual(before);
    expect(ensure).not.toHaveBeenCalled();
  });
  it("reports missing setup even when settings contain proxy transport", () => {
    save({ env: { [BASE]: base, [HEADERS]: key } });
    expect(routingStatus(targetPaths(home, "global", ""))).toBe(
      "settings present; proxy setup is missing",
    );
  });
});

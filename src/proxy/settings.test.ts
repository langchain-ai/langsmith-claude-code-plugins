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
import { enable, disable, setupPlan, SetupError } from "./settings.js";
import { API_URL, UPSTREAM, configDir, loadConfig } from "./config.js";
import { atomic, snapshot, transaction } from "./files.js";
import { control, ensure, waitForStopped } from "./lifecycle.js";
import { targetPaths, authorizedScope } from "./scopes.js";
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
const args = () => ["--yes", "--scope", "global", process.execPath, "fake-profile", "43127"];
const run = () => enable("/fake/gateway.js", args(), {});
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "gateway-settings-"));
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
  it("requires explicit consent before any filesystem or daemon effects", async () => {
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
    expect(after.env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:43127");
    for (const key of ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"])
      expect(after.env[key]).toBeUndefined();
    expect(after.apiKeyHelper).toBeUndefined();
    expect(ensure).toHaveBeenCalledWith(config, "/fake/gateway.js");
    expect(control).not.toHaveBeenCalled();
    const bytes = readFileSync(settings, "utf8");
    const record = readFileSync(join(configDir(home), "settings-ownership.json"), "utf8");
    await expect(run()).resolves.toEqual({
      settingsChanged: false,
      useClaudeSubscription: false,
      modeChanged: false,
    });
    expect(readFileSync(settings, "utf8")).toBe(bytes);
    expect(readFileSync(join(configDir(home), "settings-ownership.json"), "utf8")).toBe(record);
    for (const file of [
      settings,
      join(configDir(home), "config.json"),
      join(configDir(home), "settings-ownership.json"),
    ])
      expect(statSync(file).mode & 0o777).toBe(0o600);
    disable(["--yes", "--scope", "global"], {});
    expect(json(settings)).toEqual(before);
    expect(loadConfig()).toBeUndefined();
    expect(loadConfig(home, true)).toEqual(config);
    disable(["--yes", "--scope", "global"], {});
    expect(json(settings)).toEqual(before);
    await expect(enable("/fake/gateway.js", ["--yes", "--scope", "global"], {})).resolves.toEqual({
      settingsChanged: true,
      useClaudeSubscription: false,
      modeChanged: false,
    });
    expect(loadConfig()).toEqual(config);
    disable(["--yes", "--scope", "global"], {});
    expect(json(settings)).toEqual(before);
  });
  it("requires disable before switching and replaces retained endpoints/profile without losing ownership", async () => {
    const before = { model: "keep", env: { ANTHROPIC_CUSTOM_HEADERS: "X-Keep: original" } };
    save(before);
    await run();
    const original = loadConfig()!;
    const preview = [
      "--yes",
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
    expect(loadConfig()).toEqual(original);
    disable(["--yes", "--scope", "global"], {});
    vi.mocked(waitForStopped).mockImplementationOnce(async (old) => {
      expect(old).toEqual(original);
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
    expect(ensure).toHaveBeenLastCalledWith(current, "/fake");
    expect(JSON.stringify(json(settings))).not.toContain("review.smith");
    disable(["--yes", "--scope", "global"], {});
    expect(json(settings)).toEqual(before);
    await enable(
      "/fake",
      [
        "--yes",
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
    expect(loadConfig()).toEqual(original);
    disable(["--yes", "--scope", "global"], {});
    expect(json(settings)).toEqual(before);
  });
  it("replaces a deleted disabled CLI without validating the old executable", async () => {
    const before = { model: "keep", env: { ANTHROPIC_CUSTOM_HEADERS: "X-Keep: original" } };
    save(before);
    const oldCLI = join(home, "old-langsmith");
    const newCLI = join(home, "new-langsmith");
    for (const cli of [oldCLI, newCLI]) writeFileSync(cli, "#!/bin/sh\nexit 1\n", { mode: 0o700 });
    await enable("/fake", ["--yes", "--scope", "global", oldCLI, "fake-profile", "43127"], {});
    const original = loadConfig()!;
    disable(["--yes", "--scope", "global"], {});
    rmSync(oldCLI);
    expect(existsSync(original.cli)).toBe(false);
    // Retaining the deleted executable must still fail validation.
    await expect(enable("/fake", ["--yes", "--scope", "global"], {})).rejects.toThrow();
    vi.clearAllMocks();
    const validate = vi.spyOn(setupModule, "validateCLI");
    try {
      vi.mocked(waitForStopped).mockImplementationOnce(async (old) => {
        expect(old).toEqual(original);
        expect(loadConfig()).toBeUndefined();
        expect(loadConfig(home, true)).toEqual(original);
        expect(json(settings)).toEqual(before);
        expect(ensure).not.toHaveBeenCalled();
        expect(control).not.toHaveBeenCalled();
      });
      await enable(
        "/fake",
        [
          "--yes",
          "--scope",
          "global",
          newCLI,
          "preview-42",
          "43128",
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
        port: 43128,
        apiUrl: "https://pr-42-api.review.smith.langchain.com",
        gatewayUrl: "https://pr-42-gateway.review.smith.langchain.com:8443",
      });
      expect(validate).toHaveBeenCalledWith(newCLI);
      expect(validate).not.toHaveBeenCalledWith(original.cli);
      expect(waitForStopped).toHaveBeenCalledExactlyOnceWith(original);
      expect(ensure).toHaveBeenCalledExactlyOnceWith(current, "/fake");
      expect(control).not.toHaveBeenCalled();
      expect(json(settings).env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:43128");
      expect(json(settings).env.ANTHROPIC_CUSTOM_HEADERS).toBe(
        before.env.ANTHROPIC_CUSTOM_HEADERS + "\nX-LangSmith-Proxy-Key: " + original.secret,
      );
      disable(["--yes", "--scope", "global"], {});
      expect(json(settings)).toEqual(before);
      expect(loadConfig()).toBeUndefined();
      expect(loadConfig(home, true)).toEqual(current);
    } finally {
      validate.mockRestore();
    }
  });
  it("leaves disabled config/settings untouched when the old listener has not drained", async () => {
    await run();
    disable(["--yes", "--scope", "global"], {});
    const before = loadConfig(home, true);
    const saved = readFileSync(settings, "utf8");
    vi.clearAllMocks();
    vi.mocked(waitForStopped).mockRejectedValueOnce(new Error("synthetic private details"));
    await expect(
      enable(
        "/fake",
        [
          "--yes",
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
        value: { env: { ANTHROPIC_CUSTOM_HEADERS: "HOST: 127.0.0.1:43127" } },
        message: "Custom Host headers are unsupported",
      },
    ])("rejects $message without writes or startup", async ({ value, message }) => {
      save({ model: "private-model", permissions: { allow: ["Read"] } });
      if (state !== "fresh") {
        await run();
        if (state === "disabled") disable(["--yes", "--scope", "global"], {});
      }
      const current = json(settings);
      save({ ...current, ...value, env: { ...current.env, ...value.env } });
      const paths = [
        settings,
        join(configDir(home), "config.json"),
        join(configDir(home), "settings-ownership.json"),
      ];
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
    disable(["--yes", "--scope", "global"], {});
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
    disable(["--yes", "--scope", "global"], {});
    expect(json(settings)).toEqual({
      disableAllHooks: true,
      env: { ANTHROPIC_CUSTOM_HEADERS: "X-Old: keep\nhOsT: private-host.invalid" },
    });
    expect(loadConfig()).toBeUndefined();
    expect(ensure).not.toHaveBeenCalled();
    expect(control).not.toHaveBeenCalled();
  });
  it("disable restores a legacy receipt containing a custom Host header", async () => {
    await run();
    const path = join(configDir(home), "settings-ownership.json");
    const record = json(path);
    // Model an installation created before enable rejected custom Host headers.
    record.beforeHeaders = "Host: private-host.invalid\nX-Old:  keep  ";
    record.afterHeaders = record.beforeHeaders + "\n" + record.afterHeaders;
    writeFileSync(path, JSON.stringify(record));
    const current = json(settings);
    current.env.ANTHROPIC_CUSTOM_HEADERS = record.afterHeaders;
    current.disableAllHooks = true;
    save(current);
    disable(["--yes", "--scope", "global"], {});
    expect(json(settings)).toEqual({
      disableAllHooks: true,
      env: { ANTHROPIC_CUSTOM_HEADERS: record.beforeHeaders },
    });
    expect(loadConfig()).toBeUndefined();
  });
  it.each([undefined, {}, { env: {} }, { env: { ANTHROPIC_CUSTOM_HEADERS: "" } }])(
    "restores absent/empty env distinctions: %j",
    async (before) => {
      if (before !== undefined) save(before);
      await run();
      disable(["--yes", "--scope", "global"], {});
      expect(json(settings)).toEqual(before ?? {});
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
    disable(["--yes", "--scope", "global"], {});
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
    disable(["--yes", "--scope", "global"], {});
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
      enable("/fake", ["--yes", "--scope", "global"], { PATH: "relative:/does-not-exist" }),
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
      enable("/fake", ["--yes", "--scope", "global", process.execPath, "other", "43127"], {}),
    ).rejects.toThrow("Existing pinned");
  });
  it.each(["settings", "claude", "config-dir", "config", "receipt"])(
    "refuses %s symlinks without changing targets",
    async (kind) => {
      const target = join(home, "target");
      writeFileSync(target, "untouched", { mode: 0o600 });
      if (kind === "settings") symlinkSync(target, settings);
      if (kind === "claude") {
        rmSync(join(home, ".claude"), { recursive: true });
        symlinkSync(home, join(home, ".claude"));
      }
      if (["config-dir", "config", "receipt"].includes(kind)) {
        if (kind === "config-dir") symlinkSync(home, configDir(home));
        else {
          mkdirSync(configDir(home), { mode: 0o700 });
          symlinkSync(
            target,
            join(configDir(home), kind === "config" ? "config.json" : "settings-ownership.json"),
          );
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
      if (state === "disabled") disable(["--yes", "--scope", "global"], {});
      const beforeConfig = readFileSync(join(configDir(home), "config.json"), "utf8");
      const beforeSettings = readFileSync(settings, "utf8");
      const beforeReceipt = readFileSync(join(configDir(home), "settings-ownership.json"), "utf8");
      vi.mocked(ensure).mockRejectedValueOnce(new Error("Local proxy unavailable"));
      await expect(run()).rejects.toThrow("Local proxy unavailable");
      expect(readFileSync(join(configDir(home), "config.json"), "utf8")).toBe(beforeConfig);
      expect(readFileSync(settings, "utf8")).toBe(beforeSettings);
      expect(readFileSync(join(configDir(home), "settings-ownership.json"), "utf8")).toBe(
        beforeReceipt,
      );
      expect(existsSync(join(configDir(home), "settings.lock"))).toBe(false);
    },
  );
  it("detects edits during readiness checks and serializes setup/disable", async () => {
    save({ model: "before" });
    vi.mocked(ensure).mockImplementation(async () => {
      expect(() => disable(["--yes", "--scope", "global"], {})).toThrow("Another setup/disable");
      save({ model: "concurrent" });
    });
    await expect(run()).rejects.toThrow("Settings changed concurrently");
    expect(json(settings)).toEqual({ model: "concurrent" });
    expect(loadConfig()).toBeUndefined();
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
    expect(() => disable(["--yes", "--scope", "global"], {})).toThrow();
    expect(readFileSync(target, "utf8")).toBe("untouched");
    expect(loadConfig()?.enabled).toBe(true);
    rmSync(settings);
    writeFileSync(settings, original, { mode: 0o600 });
    disable(["--yes", "--scope", "global"], {});
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
  it("write-ahead ownership recovers an interrupted settings write without restoring unrelated data", async () => {
    const before = { model: "keep", env: { OTHER: "keep" } };
    save(before);
    await run();
    // Simulate a crash after writing the receipt but before replacing settings.
    save({ ...before, model: "later" });
    disable(["--yes", "--scope", "global"], {});
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
  const scoped = (scope: string) => ["--yes", "--scope", scope];
  it("shares a singleton across global and two projects and disables by reference count", async () => {
    const a = project("a"),
      b = project("b");
    await run();
    const config = loadConfig()!;
    for (const cwd of [a, b]) {
      await enable("/fake", scoped("project"), {}, home, cwd);
      expect(loadConfig()).toEqual(config);
      const p = targetPaths(home, "project", cwd);
      expect(statSync(p.settings).mode & 0o777).toBe(0o600);
      expect(statSync(p.receipt).mode & 0o777).toBe(0o600);
      expect(json(p.settings).env.ANTHROPIC_CUSTOM_HEADERS).toContain(config.secret);
    }
    const bytes = snapshot(targetPaths(home, "project", b).settings);
    await expect(
      enable("/fake", [...scoped("project"), "--profile", "different"], {}, home, b),
    ).rejects.toThrow("Existing pinned");
    expect(snapshot(targetPaths(home, "project", b).settings)).toEqual(bytes);
    expect(loadConfig()).toEqual(config);
    disable(scoped("global"), {}, home);
    expect(loadConfig()).toEqual(config);
    expect(authorizedScope(home, a, config)).toBe(true);
    expect(authorizedScope(home, project("unapproved"), config)).toBe(false);
    disable(scoped("project"), {}, home, a);
    expect(loadConfig()).toEqual(config);
    expect(authorizedScope(home, a, config)).toBe(false);
    disable(scoped("project"), {}, home, a);
    expect(loadConfig()).toEqual(config);
    disable(scoped("project"), {}, home, b);
    expect(loadConfig()).toBeUndefined();
    expect(json(targetPaths(home, "project", a).settings)).toEqual({});
    expect(json(targetPaths(home, "project", b).settings)).toEqual({});
  });
  it("adopts legacy endpoint-less config and global v1 receipt without losing originals", async () => {
    save({ env: { ANTHROPIC_CUSTOM_HEADERS: "X-Old: keep" } });
    await run();
    const path = join(configDir(home), "config.json");
    const legacy = json(path);
    delete legacy.useClaudeSubscription;
    delete legacy.apiUrl;
    delete legacy.gatewayUrl;
    writeFileSync(path, JSON.stringify(legacy));
    expect(loadConfig()?.useClaudeSubscription).toBe(true);
    const originalReceipt = readFileSync(join(configDir(home), "settings-ownership.json"), "utf8");
    const cwd = project("migration");
    await enable("/fake", [...scoped("project"), "--use-claude-subscription"], {}, home, cwd);
    expect(readFileSync(join(configDir(home), "settings-ownership.json"), "utf8")).toBe(
      originalReceipt,
    );
    disable(scoped("global"), {}, home);
    expect(json(settings)).toEqual({ env: { ANTHROPIC_CUSTOM_HEADERS: "X-Old: keep" } });
    expect(loadConfig()).toBeDefined();
    disable(scoped("project"), {}, home, cwd);
    expect(loadConfig()).toBeUndefined();
  });
  it.each(["unignored", "tracked", "ignored", "missing"])(
    "protects project secrets in %s git files with an escaped destination diagnostic",
    async (state) => {
      const cwd = project('repo "quoted"\\\n\t\x1b');
      const git = (...args: string[]) => {
        const result = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
        expect(result.status, result.stderr).toBe(0);
      };
      git("init", "--quiet");
      mkdirSync(join(cwd, ".claude"), { mode: 0o700 });
      const file = join(cwd, ".claude/settings.local.json");
      const contents = JSON.stringify({
        env: { ANTHROPIC_CUSTOM_HEADERS: "X-Private: synthetic-secret-do-not-print" },
      });
      if (state !== "missing") writeFileSync(file, contents, { mode: 0o600 });
      const before = snapshot(file);
      if (state === "tracked") git("add", "-f", ".claude/settings.local.json");
      if (state === "tracked" || state === "ignored")
        writeFileSync(join(cwd, ".gitignore"), ".claude/settings.local.json\n");
      const invoke = () =>
        enable("/fake", ["--yes", "--scope", "project", "--cli", process.execPath], {}, home, cwd);
      if (state === "ignored") {
        await invoke();
        expect(json(file).env).toBeDefined();
      } else {
        // Exact output allows only the quoted path, never settings/env contents.
        await expect(invoke()).rejects.toMatchObject({
          message: `Secret destination ${JSON.stringify(file)} is tracked or not git-ignored. Untrack and privately ignore it before setup; nothing was written there.`,
        });
        expect(snapshot(file)).toEqual(before);
        const paths = targetPaths(home, "project", cwd);
        expect(existsSync(paths.config)).toBe(false);
        expect(existsSync(paths.receipt)).toBe(false);
        expect(ensure).not.toHaveBeenCalled();
        expect(loadConfig()).toBeUndefined();
      }
    },
  );
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
          `--scope global --cli ${process.execPath} --profile preview --port 43128 --api-url https://api.preview.test/ --gateway-url https://gateway.preview.test:8443/`,
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
        "Gateway settings saved for the selected scope; OAuth-only gateway auth; native credentials are not forwarded. Gateway provider keys and provider billing apply. local daemon healthy. Authentication is checked on the first model request, not setup. Restart Claude to apply the settings.",
    });
    expect(output).toHaveBeenCalledTimes(1);
    expect(loadConfig()).toMatchObject({
      cli: process.execPath,
      profile: "preview",
      port: 43128,
      apiUrl: "https://api.preview.test",
      gatewayUrl: "https://gateway.preview.test:8443",
    });
    expect(json(settings).env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:43128");
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

it("rolls back completed writes on a later transaction failure without leaking receipts", () => {
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

it("rejects project settings and receipt hardlinks/symlinks without changing other targets", async () => {
  const cwd = realpathSync(home);
  const p = targetPaths(home, "project", cwd);
  await enable("/fake", ["--yes", "--scope", "project", "--cli", process.execPath], {}, home, cwd);
  const config = loadConfig()!;
  const backup = join(home, "backup");
  linkSync(p.receipt, backup);
  expect(() => disable(["--yes", "--scope", "project"], {}, home, cwd)).toThrow(
    "Unsafe settings file",
  );
  rmSync(backup);
  const original = readFileSync(p.settings, "utf8");
  rmSync(p.settings);
  writeFileSync(backup, "untouched", { mode: 0o600 });
  symlinkSync(backup, p.settings);
  expect(() => disable(["--yes", "--scope", "project"], {}, home, cwd)).toThrow();
  expect(readFileSync(backup, "utf8")).toBe("untouched");
  expect(loadConfig()).toEqual(config);
  rmSync(p.settings);
  writeFileSync(p.settings, original, { mode: 0o600 });
  disable(["--yes", "--scope", "project"], {}, home, cwd);
  expect(loadConfig()).toBeUndefined();
});

it.each(["global", "project"] as const)(
  "switches only the active %s mode, preserving settings, key and ownership",
  async (scope) => {
    const cwd = realpathSync(home);
    const p = targetPaths(home, scope, cwd);
    const invoke = (...flags: string[]) =>
      enable("/fake", ["--yes", "--scope", scope, ...flags], {}, home, cwd);
    expect(setupPlan(["--scope", scope], {}, home).useClaudeSubscription).toBe(false);
    await invoke("--cli", process.execPath);
    const original = loadConfig()!;
    const bytes = readFileSync(p.settings, "utf8"),
      record = readFileSync(p.receipt, "utf8");
    for (const choice of [true, false]) {
      const old = loadConfig()!;
      vi.mocked(waitForStopped).mockImplementationOnce(async (config) => {
        expect(config).toEqual(old);
        expect(loadConfig()).toBeUndefined();
        expect(loadConfig(home, true)?.useClaudeSubscription).toBe(choice);
        expect(readFileSync(p.settings, "utf8")).toBe(bytes);
        expect(readFileSync(p.receipt, "utf8")).toBe(record);
      });
      const flags = choice ? ["--use-claude-subscription"] : [];
      await expect(invoke(...flags)).resolves.toEqual({
        settingsChanged: false,
        useClaudeSubscription: choice,
        modeChanged: true,
      });
      expect(loadConfig()).toEqual({ ...original, useClaudeSubscription: choice });
      expect(authorizedScope(home, cwd, loadConfig()!)).toBe(true);
      expect(ensure).toHaveBeenLastCalledWith(loadConfig(), "/fake");
      expect(readFileSync(p.settings, "utf8")).toBe(bytes);
      expect(readFileSync(p.receipt, "utf8")).toBe(record);
      expect(identity(loadConfig()!)).not.toBe(identity(old));
      await expect(invoke(...flags)).resolves.toMatchObject({
        useClaudeSubscription: choice,
        modeChanged: false,
      });
      expect(setupPlan(["--scope", scope], {}, home).useClaudeSubscription).toBe(false);
      expect(setupPlan(["--scope", scope, ...flags], {}, home).useClaudeSubscription).toBe(choice);
      expect(loadConfig()?.useClaudeSubscription).toBe(choice);
    }
    expect(control).not.toHaveBeenCalled();
  },
);

it("refuses shared mode changes and unowned targets without altering any active scope", async () => {
  await run();
  const cwd = realpathSync(home);
  const invoke = (scope: string, ...flags: string[]) =>
    enable("/fake", ["--yes", "--scope", scope, ...flags], {}, home, cwd);
  const original = loadConfig()!;
  await expect(invoke("project", "--use-claude-subscription")).rejects.toThrow(
    "Disable every other active scope",
  );
  await invoke("project");
  const paths = [
    settings,
    targetPaths(home, "project", cwd).settings,
    ...["config.json", "settings-ownership.json"].map((n) => join(configDir(home), n)),
  ];
  const saved = paths.map((path) => snapshot(path));
  await expect(invoke("global", "--use-claude-subscription")).rejects.toThrow(
    "Disable every other active scope",
  );
  expect(paths.map((path) => snapshot(path))).toEqual(saved);
  expect(loadConfig()).toEqual(original);
  disable(["--yes", "--scope", "project"], {}, home, cwd);
  await invoke("global", "--use-claude-subscription");
  expect(loadConfig()?.useClaudeSubscription).toBe(true);
});

it.each(["drain", "health"])(
  "retains requested opt-out disabled and transport intact on %s failure, then retries",
  async (failure) => {
    await enable("/fake", [...args(), "--use-claude-subscription"], {});
    const bytes = readFileSync(settings, "utf8");
    const record = readFileSync(join(configDir(home), "settings-ownership.json"), "utf8");
    if (failure === "drain") vi.mocked(waitForStopped).mockRejectedValueOnce(new Error("private"));
    else vi.mocked(ensure).mockRejectedValueOnce(new Error("private"));
    const optOut = () => enable("/fake", ["--yes", "--scope", "global"], {});
    await expect(optOut()).rejects.toThrow("Config remains disabled");
    expect(loadConfig()).toBeUndefined();
    expect(loadConfig(home, true)?.useClaudeSubscription).toBe(false);
    expect(readFileSync(settings, "utf8")).toBe(bytes);
    expect(readFileSync(join(configDir(home), "settings-ownership.json"), "utf8")).toBe(record);
    await optOut();
    expect(loadConfig()?.useClaudeSubscription).toBe(false);
  },
);

it.each([false, true])(
  "legacy reads preserve true until explicit setup omits the flag (disabled=%s)",
  async (disabled) => {
    await run();
    const path = join(configDir(home), "config.json");
    const legacy = json(path);
    delete legacy.useClaudeSubscription;
    writeFileSync(path, JSON.stringify(legacy));
    const before = readFileSync(path, "utf8");
    const old = loadConfig()!;
    expect(old.useClaudeSubscription).toBe(true);
    expect(setupPlan(["--scope", "global"], {}, home).useClaudeSubscription).toBe(false);
    expect(readFileSync(path, "utf8")).toBe(before);
    if (disabled) {
      disable(["--yes", "--scope", "global"], {});
      expect(loadConfig(home, true)?.useClaudeSubscription).toBe(true);
    }
    await expect(run()).resolves.toMatchObject({ useClaudeSubscription: false, modeChanged: true });
    expect(loadConfig()?.useClaudeSubscription).toBe(false);
    expect(json(path).useClaudeSubscription).toBe(false);
    expect(identity(loadConfig()!)).not.toBe(identity(old));
    expect(waitForStopped).toHaveBeenCalledWith(old);
  },
);

it("omitted setup refuses to switch multiple active true scopes without writes", async () => {
  const cwd = realpathSync(home);
  const invoke = (scope: string, ...flags: string[]) =>
    enable("/fake", ["--yes", "--scope", scope, ...flags], {}, home, cwd);
  await invoke("global", "--cli", process.execPath, "--use-claude-subscription");
  await invoke("project", "--use-claude-subscription");
  const global = targetPaths(home, "global", cwd);
  const project = targetPaths(home, "project", cwd);
  const paths = [global.config, global.settings, global.receipt, project.settings, project.receipt];
  const before = paths.map((path) => snapshot(path));
  for (const scope of ["global", "project"]) {
    expect(setupPlan(["--scope", scope], {}, home).useClaudeSubscription).toBe(false);
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
  expect(result.reason).not.toContain("Restart Claude");
  expect(control).not.toHaveBeenCalled();
});

it("mode exception cannot relax pinned endpoint changes or replace a corrupt receipt", async () => {
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
  const path = join(configDir(home), "settings-ownership.json");
  const record = json(path);
  record.identity = "unowned";
  writeFileSync(path, JSON.stringify(record));
  await expect(enable("/fake", [...args(), "--use-claude-subscription"], {})).rejects.toThrow(
    "recovery record",
  );
  expect(loadConfig()).toEqual(config);
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
  disable(["--yes", "--scope", "global"], {});
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

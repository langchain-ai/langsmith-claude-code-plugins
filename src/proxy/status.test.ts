import { describe, expect, it } from "vitest";
import { chmodSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { configDir, configStatus, loadConfig } from "./config.js";
import { API_URL, CONFIG_UPDATE_GUIDANCE, STATUS_GUIDANCE, UPSTREAM } from "./proxy-constants.js";
import { targetPaths } from "./scopes.js";
import { credentialSummary } from "./credential-report.js";
import { STATUS_ERROR } from "./status.js";
import { parseGatewayCommand } from "./options.js";
import {
  config,
  disclaimer,
  home,
  invoke,
  probe,
  project,
  provision,
  requests,
  root,
  save,
  saveConfig,
} from "./fixtures/status-sandbox.js";

describe("packaged read-only status", () => {
  it("reports both missing targets without creating .claude or checking a daemon", async () => {
    expect(await invoke()).toBe(
      [
        "Gateway status (read-only)",
        "Selected routing targets: global + current project",
        `  global ${JSON.stringify(join(home, ".claude/settings.json"))}: settings missing; proxy setup is missing.`,
        `  project ${JSON.stringify(join(project, ".claude/settings.local.json"))}: settings missing; proxy setup is missing.`,
        "Shared proxy configuration (applies to enabled scopes): not configured.",
        "How you sign in: not configured.",
        "Workspace sent with your requests: not configured.",
        "Shared daemon: not checked (proxy setup is missing).",
        "Your credential is unchecked, because proxy setup is missing.",
        disclaimer,
      ].join("\n"),
    );
    expect(requests).toEqual([]);
  });
  it.each([true, false])(
    "reports CLI default/current profile when enabled is %s",
    async (enabled) => {
      await probe("match");
      delete config.profile;
      config.enabled = enabled;
      saveConfig();
      expect(loadConfig(home, true)?.profile).toBeUndefined();
      const result = await invoke();
      expect(result).toContain("the LangSmith CLI with its default/current profile.");
      expect(result).not.toContain("undefined");
      expect(result).toContain("matching listener reachable");
      expect(requests).toEqual(["GET /_langsmith/health", "GET /_langsmith/credential"]);
    },
  );
  it.each([{ enabled: false }, { useClaudeSubscription: undefined }])(
    "rejects incomplete config %j without probes or effects",
    async (invalid) => {
      saveConfig("enabled" in invalid ? invalid : { ...config, ...invalid });
      expect(await invoke()).toContain("one-time private config update");
      expect(requests).toEqual([]);
      expect(() => configStatus(home)).toThrow("one-time private config update");
      for (const includeDisabled of [false, true])
        expect(() => loadConfig(home, includeDisabled)).toThrow("one-time private config update");
    },
  );
  it.each([true, false])(
    "reports shared saved mode %s from receipt-free provisioning without credential reads",
    async (mode) => {
      await probe("match");
      config.useClaudeSubscription = mode;
      saveConfig({
        ...config,
        useClaudeSubscription: mode,
        apiUrl: "https://API.preview.test:443/",
        gatewayUrl: "https://gateway.preview.test:8443/",
      });
      config.apiUrl = "https://api.preview.test";
      config.gatewayUrl = "https://gateway.preview.test:8443";
      const global = provision("global");
      const local = provision("project");
      const result = await invoke(undefined, project, {
        CLAUDE_CODE_OAUTH_TOKEN: "synthetic-native",
        LANGSMITH_API_KEY: "synthetic-ls",
      });
      expect(result).toBe(
        [
          "Gateway status (read-only)",
          "Selected routing targets: global + current project",
          `  global ${JSON.stringify(global.settings)}: settings present; configured to use the local gateway proxy.`,
          `  project ${JSON.stringify(local.settings)}: settings present; configured to use the local gateway proxy.`,
          `Shared proxy configuration (applies to enabled scopes): enabled; useClaudeSubscription ${mode === false ? "off" : "on"}; API https://api.preview.test; gateway https://gateway.preview.test:8443.`,
          'How you sign in: the LangSmith CLI with profile "preview".',
          "Workspace sent with your requests: none saved, so only a workspace sent with the request is forwarded.",
          "Shared daemon: matching listener reachable.",
          "Your credential is untried, because the daemon has not needed it yet.",
          disclaimer,
        ].join("\n"),
      );
      expect(requests).toEqual(["GET /_langsmith/health", "GET /_langsmith/credential"]);
    },
  );
  it.each(["mismatch", "offline", "timeout", "draining"] as const)(
    "does not claim stopped on %s health",
    async (kind) => {
      await probe(kind);
      saveConfig();
      provision("global");
      const start = performance.now();
      const result = await invoke();
      expect(performance.now() - start).toBeLessThan(2000);
      expect(result).toContain("Shared daemon: not reachable or incompatible.");
      expect(result).toContain("unchecked, because no matching daemon is running to ask.");
      expect(result).not.toContain("stopped");
      expect(requests).toEqual(kind === "offline" ? [] : ["GET /_langsmith/health"]);
    },
  );
  it("preserves disabled retained mode while checking a listener awaiting drain", async () => {
    await probe("match");
    saveConfig({ ...config, enabled: false });
    expect(loadConfig(home)).toBeUndefined();
    expect(loadConfig(home, true)?.enabled).toBe(false);
    const result = await invoke();
    expect(result).toContain(
      `disabled; useClaudeSubscription off; API ${API_URL}; gateway ${UPSTREAM}.`,
    );
    expect(result).toContain(
      "matching listener reachable (saved config disabled; may be awaiting drain)",
    );
    expect(requests).toEqual(["GET /_langsmith/health", "GET /_langsmith/credential"]);
  });
  it("shows a reachable daemon whose credential is broken, and names the command and workspace", async () => {
    await probe("match", { sinceFailureMs: 4000 });
    config.identityTokenCommand = "cat /var/run/acme/token.jwt";
    config.workspaceId = "f4c7e130-165b-471d-bdd3-5f0fc7a6a012";
    saveConfig();
    const result = await invoke();
    expect(result).toContain("Shared daemon: matching listener reachable.");
    expect(result).toContain(
      "Your credential is broken, and every attempt so far has failed, the most recent 4 seconds ago.",
    );
    expect(result).toContain(
      "the identity token command you configured; the LangSmith CLI is not used.",
    );
    expect(result).toContain(
      'Workspace sent with your requests: "f4c7e130-165b-471d-bdd3-5f0fc7a6a012".',
    );
    expect(result).not.toContain("profile");
  });
  it.each([
    [{ sinceSuccessMs: 2000 }, "working, and was last obtained 2 seconds ago"],
    [
      { sinceSuccessMs: 1000, sinceFailureMs: 60_000 },
      "working, and was last obtained 1 seconds ago",
    ],
    [
      { sinceSuccessMs: 90_000, sinceFailureMs: 3000 },
      "broken, because the last attempt failed 3 seconds ago and the last good one was 90 seconds ago",
    ],
  ])("summarises %j", (state, expected) => expect(credentialSummary(state)).toBe(expected));
  it.each([["not json"], [5], [{ sinceSuccessMs: "5" }], [{ sinceSuccessMs: -5 }], [[1, 2]]])(
    "refuses to read %j as a credential report",
    async (reported) => {
      await probe("match", reported);
      saveConfig();
      expect(await invoke()).toContain(
        "Your credential is unchecked, because the daemon did not answer.",
      );
    },
  );
  it.each([
    ["missing", "gateway routing is not configured in this settings file"],
    ["env", "gateway routing is not configured in this settings file"],
    ["base", "Claude’s saved API address differs from this proxy’s address"],
    ["headers", "local proxy authentication header is missing"],
  ])(
    "reports project %s settings separately from matching global routing",
    async (kind, diagnostic) => {
      await probe("match");
      saveConfig();
      provision("global");
      const paths = provision("project");
      if (kind === "missing") rmSync(paths.settings);
      else if (kind === "env") save(paths.settings, {});
      else {
        const disk = JSON.parse(readFileSync(paths.settings, "utf8"));
        disk.env[kind === "base" ? "ANTHROPIC_BASE_URL" : "ANTHROPIC_CUSTOM_HEADERS"] =
          "synthetic-private-response";
        save(paths.settings, disk);
      }
      const result = await invoke();
      expect(result).toContain(
        `project ${JSON.stringify(paths.settings)}: settings ${kind === "missing" ? "missing" : "present"}; ${diagnostic}.`,
      );
      expect(result).toContain(
        `global ${JSON.stringify(targetPaths(home, "global", project).settings)}: settings present; configured to use the local gateway proxy.`,
      );
    },
  );
  it.each(["malformed", "stale", "symlink"])(
    "ignores %s legacy receipts without reading them",
    async (kind) => {
      await probe("match");
      saveConfig();
      provision("global");
      const path = join(configDir(home), "settings-ownership.json");
      if (kind === "symlink") symlinkSync(join(root, "missing"), path);
      else
        writeFileSync(
          path,
          kind === "malformed"
            ? "synthetic-secret"
            : JSON.stringify({ identity: "old", beforeHeaders: "synthetic-secret" }),
          { mode: 0o600 },
        );
      expect(await invoke()).toContain("configured to use the local gateway proxy");
    },
  );
  it("can show a shared running daemon with neither current target configured", async () => {
    await probe("match");
    saveConfig();
    const other = join(root, "other-project");
    mkdirSync(other, { mode: 0o700 });
    provision("project", other);
    const result = await invoke();
    expect(result.match(/gateway routing is not configured in this settings file/g)).toHaveLength(
      2,
    );
    expect(result).toContain("Shared daemon: matching listener reachable.");
    expect(result).not.toContain(other);
  });
  it("escapes project paths rather than emitting terminal control characters", async () => {
    const escaped = join(root, 'project-"quoted"\nline');
    mkdirSync(escaped, { mode: 0o700 });
    expect(await invoke(undefined, escaped)).toContain(
      JSON.stringify(join(escaped, ".claude/settings.local.json")),
    );
  });
  it("scope selects routing only, and global scope needs no project cwd", async () => {
    await probe("offline");
    saveConfig({ ...config, enabled: false });
    const result = await invoke("/langsmith-gateway:status --scope global", null);
    expect(result).toContain("Selected routing targets: global\n");
    expect(result).not.toContain("  project ");
    expect(await invoke("/langsmith-gateway:status --scope project")).not.toContain("  global ");
    expect(parseGatewayCommand("/langsmith-gateway:status")).toEqual({
      command: "status",
      args: [],
    });
  });
  it.each([
    "malformed-config",
    "invalid-mode",
    "unsafe-config",
    "invalid-profile",
    "invalid-endpoints",
    "malformed-settings",
    "symlink-settings",
    "symlink-settings-dir",
    "symlink-cwd",
    "unknown-cwd",
    "missing-cwd",
    "relative-cwd",
    "custom-home",
  ])("sanitizes %s errors with no effects", async (kind) => {
    saveConfig();
    let cwd: unknown = project;
    let env = {};
    if (kind === "malformed-config")
      writeFileSync(join(configDir(home), "config.json"), "synthetic-native");
    if (kind === "invalid-mode")
      saveConfig({ ...config, useClaudeSubscription: "synthetic-native" });
    if (kind === "invalid-profile") saveConfig({ ...config, profile: "synthetic-native\n" });
    if (kind === "invalid-endpoints")
      saveConfig({ ...config, apiUrl: "https://synthetic-native@api.test", gatewayUrl: UPSTREAM });
    if (kind === "symlink-settings-dir")
      symlinkSync(join(home, ".claude"), join(project, ".claude"));
    if (kind === "missing-cwd") cwd = null;
    if (kind === "unsafe-config") chmodSync(join(configDir(home), "config.json"), 0o644);
    if (kind === "malformed-settings")
      writeFileSync(join(home, ".claude/settings.json"), "synthetic-native", { mode: 0o600 });
    if (kind === "symlink-settings")
      symlinkSync(join(configDir(home), "config.json"), join(home, ".claude/settings.json"));
    if (kind === "symlink-cwd") {
      cwd = join(root, "link");
      symlinkSync(project, cwd as string);
    }
    if (kind === "unknown-cwd") cwd = join(root, "missing");
    if (kind === "relative-cwd") cwd = "relative";
    if (kind === "custom-home") env = { CLAUDE_CONFIG_DIR: "/synthetic-native" };
    expect(await invoke(undefined, cwd, env)).toBe(
      ["invalid-mode", "invalid-profile", "invalid-endpoints"].includes(kind)
        ? CONFIG_UPDATE_GUIDANCE
        : STATUS_ERROR,
    );
    expect(requests).toEqual([]);
  });
  it.each([
    "--yes",
    "--scope",
    "--scope local",
    "--scope global --scope project",
    "--profile synthetic-native",
    "--use-claude-subscription",
    "--scope=project",
    "synthetic-native",
    "--scope global\n",
    "--scope 'global'",
  ])("strictly blocks invalid args %s", async (args) => {
    expect(await invoke(`/langsmith-gateway:status ${args}`, "missing-relative-cwd")).toBe(
      STATUS_GUIDANCE,
    );
    expect(requests).toEqual([]);
  });
});

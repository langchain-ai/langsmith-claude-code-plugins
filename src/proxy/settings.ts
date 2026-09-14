import { accessSync, constants, mkdirSync, rmdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import {
  configDir,
  endpoints,
  loadConfig,
  privatePath,
  userHome,
  type ProxyConfig,
} from "./config.js";
import {
  atomic,
  transaction,
  directory,
  directories,
  jsonText,
  snapshot,
  unchanged,
  type Snapshot,
} from "./files.js";
import { createConfig, validateCLI } from "./setup.js";
import { ensure, waitForStopped } from "./lifecycle.js";
import { createHash } from "node:crypto";
import { parseEnableArgs, parseSetupArgs, parseDisableArgs, SetupError } from "./options.js";
import { targetPaths, secretGitCheck, receiptSnapshots } from "./scopes.js";
export { SetupError } from "./options.js";

// Ownership must survive daemon protocol upgrades; it binds only the retained
// private config, not the forwarding protocol or upstream implementation version.
const ownershipIdentity = (config: ProxyConfig) =>
  createHash("sha256")
    .update(JSON.stringify([config.cli, config.profile, config.port, config.secret]))
    .digest("hex");

// Only fixed, non-sensitive diagnostics may reach the command's output.
const fail = (message: string): never => {
  throw new SetupError(message);
};
const BASE = "ANTHROPIC_BASE_URL";
const HEADERS = "ANTHROPIC_CUSTOM_HEADERS";
const AUTH = [
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_API_KEY",
  "CLAUDE_CODE_USE_BEDROCK",
  "CLAUDE_CODE_USE_VERTEX",
  "CLAUDE_CODE_USE_FOUNDRY",
  "ANTHROPIC_FOUNDRY_API_KEY",
  "ANTHROPIC_FOUNDRY_BASE_URL",
  "CLAUDE_CODE_API_KEY_HELPER",
];
type ObjectValue = Record<string, unknown>;
function object(value: unknown): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail("Expected a JSON object; settings were not replaced.");
  return value as ObjectValue;
}
function text(value: unknown): string | undefined {
  if (value === undefined) return;
  if (typeof value !== "string") return fail("Transport settings must be strings.");
  return value;
}
function lines(value: string | undefined): string[] {
  return value === undefined ? [] : value.split("\n");
}
function keyLine(line: string): boolean {
  return /^\s*x-langsmith-proxy-key\s*:/i.test(line);
}
function validateHeaders(value: string | undefined): void {
  for (const line of lines(value)) {
    if (!line) continue;
    const match = /^([!#$%&'*+.^_`|~0-9A-Za-z-]+):[^\r\n]*$/.exec(line);
    if (
      !match ||
      /^(authorization|proxy-authorization|x-api-key|x-langsmith-anthropic-passthrough)$/i.test(
        match[1],
      )
    )
      return fail("Conflicting or malformed custom headers; review them privately before setup.");
    // Enable-only preflight: let the client derive Host from the loopback URL.
    if (/^host$/i.test(match[1]))
      fail(
        "Custom Host headers are unsupported by persistent setup. Remove the Host header explicitly so the client uses the loopback target; review headers privately.",
      );
  }
}
interface Receipt {
  version: 1;
  identity: string;
  beforeBase: string | null;
  beforeHeaders: string | null;
  afterBase: string;
  afterHeaders: string;
  envExisted: boolean;
}
function receipt(s: Snapshot | undefined, config: ProxyConfig): Receipt | undefined {
  if (!s) return;
  const value = JSON.parse(s.text);
  if (value === null) return;
  const r = object(value);
  if (
    r.version !== 1 ||
    r.identity !== ownershipIdentity(config) ||
    !(r.beforeBase === null || typeof r.beforeBase === "string") ||
    !(r.beforeHeaders === null || typeof r.beforeHeaders === "string") ||
    typeof r.afterBase !== "string" ||
    typeof r.afterHeaders !== "string" ||
    typeof r.envExisted !== "boolean"
  )
    return fail(
      "Setup recovery record does not match the private config; resolve privately, do not overwrite it.",
    );
  return r as unknown as Receipt;
}
function assign(env: ObjectValue, key: string, value: string | null): void {
  if (value === null) delete env[key];
  else env[key] = value;
}
function settings(s: Snapshot | undefined): { value: ObjectValue; env: ObjectValue } {
  const value = s ? object(JSON.parse(s.text)) : {};
  const env = value.env === undefined ? {} : object(value.env);
  return { value, env };
}
function supportedHome(home: string, env: NodeJS.ProcessEnv): void {
  if (env.CLAUDE_CONFIG_DIR && env.CLAUDE_CONFIG_DIR !== join(home, ".claude"))
    fail(
      "Custom CLAUDE_CONFIG_DIR is unsupported. Restart Claude Code with its default configuration directory, then use /langsmith-gateway:setup or /langsmith-gateway:disable.",
    );
}
function lock(home: string): () => void {
  directories(home, true);
  const dir = configDir(home);
  try {
    mkdirSync(dir, { mode: 0o700 });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
  }
  privatePath(dir, true);
  const path = join(dir, "settings.lock");
  try {
    mkdirSync(path, { mode: 0o700 });
  } catch {
    return fail(
      "Another setup/disable is running or left settings.lock. Stop it before removing that lock directory and retrying.",
    );
  }
  return () => rmdirSync(path);
}
function discoverCLI(env: NodeJS.ProcessEnv): string {
  for (const dir of (env.PATH ?? "").split(":")) {
    if (!isAbsolute(dir)) continue;
    const path = join(dir, "langsmith");
    try {
      accessSync(path, constants.X_OK);
      return path;
    } catch {
      /* Try next absolute PATH entry. */
    }
  }
  return fail(
    "LangSmith CLI not found. Install it using the README, complete terminal login with your selected profile and API URL (review the saved OAuth issuer), then retry /langsmith-gateway:setup.",
  );
}
// Allowlisted metadata only: no settings/CLI-store reads, executable discovery,
// filesystem writes, auth, network, or daemon startup before consent.
export function setupPlan(args: string[], env = process.env, home = userHome()) {
  const requested = parseSetupArgs(args);
  supportedHome(home, env);
  const config = loadConfig(home, true);
  return {
    ...endpoints(requested.apiUrl === undefined ? (config ?? {}) : requested),
    useClaudeSubscription: requested.useClaudeSubscription,
    profile: requested.profile ?? config?.profile ?? "claude-gateway",
    port: requested.port ?? config?.port ?? 43127,
    status: config ? (loadConfig(home) ? "enabled" : "disabled") : "missing",
  };
}

export async function enable(
  entry: string,
  args: string[],
  env = process.env,
  home = userHome(),
  cwd = process.cwd(),
): Promise<{ settingsChanged: boolean; useClaudeSubscription: boolean; modeChanged: boolean }> {
  const requested = parseEnableArgs(args);
  supportedHome(home, env);
  const unlock = lock(home);
  try {
    const p = targetPaths(home, requested.scope, cwd);
    directory(dirname(p.settings), true);
    secretGitCheck(p.settings);
    secretGitCheck(p.config);
    secretGitCheck(p.receipt);
    const beforeSettings = snapshot(p.settings);
    const { value, env: savedEnv } = settings(beforeSettings);
    if (value.disableAllHooks === true)
      fail(
        "Persistent setup requires hooks to restart the daemon. Set disableAllHooks to false or remove it explicitly from user settings before retrying; it will not be overwritten.",
      );
    for (const key of AUTH) {
      if (savedEnv[key] !== undefined || env[key] !== undefined)
        fail(
          "Conflicting provider/auth environment setting. Remove it explicitly before setup; client auth overrides are not supported by this setup.",
        );
    }
    if (value.apiKeyHelper !== undefined)
      fail(
        "Conflicting apiKeyHelper. Remove it explicitly before setup; it will not be overwritten.",
      );
    const base = text(savedEnv[BASE]),
      headers = text(savedEnv[HEADERS]);
    validateHeaders(headers);
    let config = loadConfig(home, true);
    const oldReceipt = snapshot(p.receipt, true);
    if (!config && oldReceipt && JSON.parse(oldReceipt.text) !== null)
      fail(
        "Private config missing but a recovery record exists; restore the config privately before retrying.",
      );
    const initiallyEnabled = loadConfig(home) !== undefined;
    const allReceipts = receiptSnapshots(home);
    if (!config && allReceipts.length)
      fail("Private config missing but recovery records exist; restore privately.");
    if (config) for (const item of allReceipts) receipt(item.saved, config);
    const prior = config ? receipt(oldReceipt, config) : undefined;
    const port = requested.port ?? config?.port ?? 43127;
    const selected =
      requested.apiUrl === undefined ? endpoints(config ?? {}) : endpoints(requested);
    const useClaudeSubscription = requested.useClaudeSubscription;
    const next = config
      ? {
          ...config,
          ...selected,
          useClaudeSubscription,
          cli: requested.cli === undefined ? config.cli : validateCLI(requested.cli),
          profile: requested.profile ?? config.profile,
          port,
        }
      : undefined;
    const changing =
      config &&
      next &&
      (config.cli !== next.cli ||
        config.profile !== next.profile ||
        config.port !== next.port ||
        endpoints(config).apiUrl !== next.apiUrl ||
        endpoints(config).gatewayUrl !== next.gatewayUrl);
    if (changing && (initiallyEnabled || allReceipts.length))
      fail(
        "Existing pinned CLI/profile/port or endpoints differ. Run /langsmith-gateway:disable first for every active scope (use --scope global|project), stop all gateway sessions and CLI writers, then retry /langsmith-gateway:setup with the explicit options. Do not edit config or delete ownership records.",
      );
    const modeChanged = !!config && config.useClaudeSubscription !== useClaudeSubscription;
    const switching = initiallyEnabled && modeChanged;
    if (modeChanged && allReceipts.some((item) => item.path !== p.receipt))
      fail(
        "Subscription forwarding is shared. Disable every other active scope first, then retry setup for this scope; other scopes will not be silently switched.",
      );
    if (switching && !prior)
      fail(
        "Only the sole active owned target can switch subscription forwarding in place. Disable existing routing first, then retry setup.",
      );
    const target = `http://127.0.0.1:${port}`;
    if (
      (base !== undefined && base !== target) ||
      (env[BASE] !== undefined && env[BASE] !== target)
    )
      fail(
        "Conflicting ANTHROPIC_BASE_URL. Remove it explicitly before setup; it will not be overwritten.",
      );
    // Do not copy shell/project headers (potential secrets) into user settings.
    if (
      env[HEADERS] !== undefined &&
      env[HEADERS] !== headers &&
      !(
        config &&
        allReceipts.some(({ saved }) => receipt(saved, config!)?.afterHeaders === env[HEADERS])
      )
    )
      fail(
        "Inherited custom headers differ from user settings. Restart Claude without that override before setup.",
      );
    const owned = config ? `X-LangSmith-Proxy-Key: ${config.secret}` : undefined;
    const keys = lines(headers).filter(keyLine);
    if (keys.length && (!prior || keys.length !== 1 || keys[0] !== owned))
      fail("Conflicting local proxy header; no unowned header will be replaced.");
    if (switching && (base !== target || keys.length !== 1))
      fail(
        "Owned transport settings changed. Restore them privately or disable this scope before switching subscription forwarding.",
      );
    if (!config) {
      // A bare legacy disabled marker has no retained executable/profile/key.
      const old = snapshot(p.config, true);
      if (old) {
        if (
          old.text.trim() !== '{"enabled":false}' &&
          JSON.stringify(JSON.parse(old.text)) !== '{"enabled":false}'
        )
          fail("Invalid disabled config; resolve privately before retrying.");
        // Do not silently discard unknown or incomplete legacy configuration.
        fail(
          "Legacy disabled marker has no pinned CLI/profile. Remove only that marker, then retry /langsmith-gateway:setup.",
        );
      }
      createConfig(
        requested.cli ?? discoverCLI(env),
        requested.profile ?? "claude-gateway",
        port,
        home,
        selected,
        useClaudeSubscription,
      );
      config = loadConfig(home)!;
    }
    // Validate the selected executable; retain the old config for listener drain.
    const effective = next ?? config;
    if (validateCLI(effective.cli) !== effective.cli)
      fail("Pinned CLI path changed; resolve privately before retrying.");
    let configSnapshot = snapshot(p.config, true);
    if (switching) {
      unchanged(p.settings, beforeSettings);
      unchanged(p.receipt, oldReceipt, true);
      for (const item of allReceipts) unchanged(item.path, item.saved, true);
      // Persist the requested mode, disabled, before waiting. Old versions also
      // recognize disabled config. Keep transport/key/receipt untouched and never
      // restore subscription forwarding automatically after an opt-out failure.
      atomic(p.config, jsonText({ ...next!, enabled: false }), configSnapshot);
      configSnapshot = snapshot(p.config, true);
    }
    // A disabled old daemon must see disabled config before re-enable can erase
    // that signal. Wait before changing even the port/profile: never race refresh.
    if ((!initiallyEnabled || switching) && next) {
      await waitForStopped(config).catch(() =>
        fail(
          "Old proxy still draining or local port occupied. Config remains disabled; routing settings and requested mode are retained. Wait at least 35 seconds and retry the same setup options; resolve port conflicts privately without killing an unknown listener.",
        ),
      );
      unchanged(p.config, configSnapshot, true);
      unchanged(p.settings, beforeSettings);
      unchanged(p.receipt, oldReceipt, true);
      for (const item of allReceipts) unchanged(item.path, item.saved, true);
      config = next;
    }
    // Re-enable retained config without rotating the local key.
    if (!loadConfig(home)) atomic(p.config, jsonText(config), configSnapshot);
    const currentConfig = snapshot(p.config, true);
    try {
      await ensure(config, entry);
      directories(home);
      privatePath(configDir(home), true);
      unchanged(p.settings, beforeSettings);
      unchanged(p.config, currentConfig, true);
      unchanged(p.receipt, oldReceipt, true);
      for (const item of allReceipts) unchanged(item.path, item.saved, true);
      directory(dirname(p.settings));
      secretGitCheck(p.settings);
      secretGitCheck(p.config);
      secretGitCheck(p.receipt);
      const line = `X-LangSmith-Proxy-Key: ${config.secret}`;
      const afterHeaders = keys.length ? headers! : (headers ? headers + "\n" : "") + line;
      const record: Receipt = prior ?? {
        version: 1,
        identity: ownershipIdentity(config),
        beforeBase: base ?? null,
        beforeHeaders: headers ?? null,
        afterBase: target,
        afterHeaders,
        envExisted: value.env !== undefined,
      };
      // Write-ahead ownership record: interrupted operations can be disabled safely.

      savedEnv[BASE] = target;
      savedEnv[HEADERS] = afterHeaders;
      value.env = savedEnv;
      const settingsChanged = base !== target || headers !== afterHeaders;
      transaction([
        ...(!prior ? [{ path: p.receipt, text: jsonText(record), prior: oldReceipt }] : []),
        ...(settingsChanged
          ? [{ path: p.settings, text: jsonText(value), prior: beforeSettings }]
          : []),
      ]);
      return { settingsChanged, useClaudeSubscription: config.useClaudeSubscription, modeChanged };
    } catch (error) {
      // Leave settings untouched on readiness failure; a newly created/re-enabled
      // daemon sees disabled config and drains. Existing enabled installs stay enabled.
      if (!initiallyEnabled || switching) {
        unchanged(p.config, currentConfig, true);
        atomic(p.config, jsonText({ ...config, enabled: false }), currentConfig);
      }
      if (switching)
        fail(
          "Gateway mode switch did not complete. Config remains disabled with the requested mode; routing settings and ownership are retained. Retry the same setup options after resolving local daemon readiness privately. No client restart is needed if transport settings are unchanged.",
        );
      throw error;
    }
  } finally {
    unlock();
  }
}

export function modeSummary(useClaudeSubscription: boolean, modeChanged: boolean): string {
  return (
    (useClaudeSubscription
      ? "Claude subscription credential forwarding enabled (gateway/provider eligibility applies). "
      : "OAuth-only gateway auth; native credentials are not forwarded. Gateway provider keys and provider billing apply. ") +
    (modeChanged
      ? "Daemon mode changed after draining; routing settings retained, with brief local downtime. "
      : "")
  );
}

export function disable(
  args: string[],
  env = process.env,
  home = userHome(),
  cwd = process.cwd(),
): void {
  const requested = parseDisableArgs(args);
  supportedHome(home, env);
  // Missing installation is a true no-op.
  if (!loadConfig(home, true)) return;
  const unlock = lock(home);
  try {
    const config = loadConfig(home, true);
    if (!config) return;
    const p = targetPaths(home, requested.scope, cwd);
    const allReceipts = receiptSnapshots(home);
    for (const item of allReceipts) receipt(item.saved, config);
    const configSnapshot = snapshot(p.config, true);
    const recordSnapshot = snapshot(p.receipt, true);
    const r = receipt(recordSnapshot, config);
    if (!r) {
      // Legacy config-only installs have no owned settings to restore. Explicit
      // disable may stop them, but never stop a daemon with another active target.
      if (!allReceipts.length && loadConfig(home))
        atomic(p.config, jsonText({ ...config, enabled: false }), configSnapshot);
      return;
    }
    directory(dirname(p.settings));
    const before = snapshot(p.settings);
    const { value, env: savedEnv } = settings(before);
    const writes: { path: string; text: string; prior: Snapshot | undefined }[] = [];
    if (r) {
      if (savedEnv[BASE] === r.afterBase) assign(savedEnv, BASE, r.beforeBase);
      const current = text(savedEnv[HEADERS]);
      if (current === r.afterHeaders) assign(savedEnv, HEADERS, r.beforeHeaders);
      else if (current !== undefined) {
        // Remove only our exact line, retaining later user headers and changed keys.
        const line = `X-LangSmith-Proxy-Key: ${config.secret}`;
        const remaining = lines(current).filter((item) => item !== line);
        if (remaining.length !== lines(current).length)
          assign(
            savedEnv,
            HEADERS,
            remaining.length ? remaining.join("\n") : r.beforeHeaders === null ? null : "",
          );
      }
      if (!r.envExisted && Object.keys(savedEnv).length === 0) delete value.env;
      else if (value.env !== undefined) value.env = savedEnv;
      if (before && JSON.stringify(value) !== JSON.stringify(JSON.parse(before.text)))
        writes.push({ path: p.settings, text: jsonText(value), prior: before });
    }
    if (!allReceipts.some((item) => item.path !== p.receipt))
      writes.push({
        path: p.config,
        text: jsonText({ ...config, enabled: false }),
        prior: configSnapshot,
      });
    if (recordSnapshot) writes.push({ path: p.receipt, text: "null\n", prior: recordSnapshot });
    for (const item of allReceipts) unchanged(item.path, item.saved, true);
    transaction(writes);
    // Config watcher drains within five seconds; never kills a listener by PID/port.
  } finally {
    unlock();
  }
}

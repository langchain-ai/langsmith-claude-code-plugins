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
import { parseSetupArgs, parseDisableArgs, SetupError } from "./options.js";
import {
  targetPaths,
  secretGitCheck,
  routingTargets,
  routingSnapshot,
  unchangedRouting,
  routingEnv,
  matchesRouting,
  proxyKeyLine,
  BASE,
  HEADERS,
} from "./scopes.js";
export { SetupError } from "./options.js";

// Only fixed, non-sensitive diagnostics may reach the command's output.
const fail = (message: string): never => {
  throw new SetupError(message);
};
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
// Keep the exact generated representation, including blank lines and value spacing.
function withProxyKey(headers: string | undefined, config: ProxyConfig): string {
  return (headers ? headers + "\n" : "") + `X-LangSmith-Proxy-Key: ${config.secret}`;
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
export async function enable(
  entry: string,
  args: string[],
  env = process.env,
  home = userHome(),
  cwd = process.cwd(),
): Promise<{
  settingsChanged: boolean;
  useClaudeSubscription: boolean;
  modeChanged: boolean;
}> {
  const requested = parseSetupArgs(args);
  supportedHome(home, env);
  // Reject unsupported config before creating directories or a settings lock.
  loadConfig(home, true);
  const unlock = lock(home);
  try {
    const p = targetPaths(home, requested.scope, cwd);
    directory(dirname(p.settings), true);
    secretGitCheck(p.settings);
    secretGitCheck(p.config);
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
    const initiallyEnabled = loadConfig(home) !== undefined;
    const targets = routingTargets(home, cwd, config);
    const active = config
      ? targets.filter((item) => matchesRouting(routingEnv(item.saved), config!))
      : [];
    const settingsTargets = [...new Set([...active.map((item) => item.path), p.settings])];
    if (settingsTargets.length > 128)
      fail("Too many active routing targets; disable unused scopes before setup.");
    const prior = !!config && matchesRouting(savedEnv, config);
    const port = requested.port ?? config?.port ?? 43127;
    const selected =
      requested.apiUrl === undefined ? endpoints(config ?? {}) : endpoints(requested);
    const useClaudeSubscription = requested.useClaudeSubscription;
    const next = config
      ? {
          ...config,
          enabled: true,
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
    if (changing && (initiallyEnabled || active.length))
      fail(
        "Existing pinned CLI/profile/port or endpoints differ. Run /langsmith-gateway:disable first for every active scope (use --scope global|project), stop all gateway sessions and CLI writers, then retry /langsmith-gateway:setup with the explicit options. Do not edit the shared config while other scopes are active.",
      );
    const modeChanged = !!config && config.useClaudeSubscription !== useClaudeSubscription;
    const switching = initiallyEnabled && modeChanged;
    if (modeChanged && active.some((item) => item.path !== p.settings))
      fail(
        "Subscription forwarding is shared. Disable every other active scope first, then retry setup for this scope; other scopes will not be silently switched.",
      );
    if (switching && !prior)
      fail(
        "Only the sole active configured target can switch subscription forwarding in place. Disable existing routing first, then retry setup.",
      );
    const target = `http://127.0.0.1:${port}`;
    if (
      (base !== undefined && base !== target) ||
      (env[BASE] !== undefined && env[BASE] !== target)
    )
      fail(
        "Conflicting ANTHROPIC_BASE_URL. Remove it explicitly before setup; it will not be overwritten.",
      );
    // Retained local key recognizes same-session re-enable without importing
    // inherited headers into the selected settings file.
    const retainedHeaders = !!config && !prior && env[HEADERS] === withProxyKey(headers, config);
    // Do not copy shell/project headers (potential secrets) into user settings.
    if (
      env[HEADERS] !== undefined &&
      env[HEADERS] !== headers &&
      !retainedHeaders &&
      !(config && active.some(({ saved }) => routingEnv(saved)[HEADERS] === env[HEADERS]))
    )
      fail(
        "Inherited custom headers differ from the selected scope settings and do not match trusted local transport. Resolve the override privately before setup; it will not be copied into settings.",
      );
    const expectedKey = config ? `X-LangSmith-Proxy-Key: ${config.secret}` : undefined;
    const keys = lines(headers).filter(keyLine);
    if (keys.length && (!config || keys.length !== 1 || keys[0] !== expectedKey))
      fail("Conflicting local proxy header; no different header will be replaced.");
    if (switching && (base !== target || keys.length !== 1))
      fail(
        "Configured transport settings changed. Review them privately or disable this scope before switching subscription forwarding.",
      );
    if (!config) {
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
      for (const item of targets) unchangedRouting(item.path, item.saved);
      // Persist the requested mode, disabled, before waiting. Old versions also
      // recognize disabled config. Keep transport/key untouched and never
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
      for (const item of targets) unchangedRouting(item.path, item.saved);
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
      for (const item of targets) unchangedRouting(item.path, item.saved);
      directory(dirname(p.settings));
      secretGitCheck(p.settings);
      secretGitCheck(p.config);
      const afterHeaders = keys.length ? headers! : withProxyKey(headers, config);
      savedEnv[BASE] = target;
      savedEnv[HEADERS] = afterHeaders;
      value.env = savedEnv;
      const settingsChanged = base !== target || headers !== afterHeaders;
      transaction([
        {
          path: p.config,
          text: jsonText({
            ...config,
            settingsTargets,
          }),
          prior: currentConfig,
        },
        ...(settingsChanged
          ? [{ path: p.settings, text: jsonText(value), prior: beforeSettings }]
          : []),
      ]);
      return {
        settingsChanged,
        useClaudeSubscription: config.useClaudeSubscription,
        modeChanged,
      };
    } catch (error) {
      // Leave settings untouched on readiness failure; a newly created/re-enabled
      // daemon sees disabled config and drains. Existing enabled installs stay enabled.
      if (!initiallyEnabled || switching) {
        // A failed settings write may have rolled back the config transaction
        // with a new inode. Disable only if its exact pre-transaction text remains.
        const rolledBack = snapshot(p.config, true);
        if (rolledBack?.text !== currentConfig?.text) throw error;
        atomic(p.config, jsonText({ ...config, enabled: false }), rolledBack);
      }
      if (switching)
        fail(
          "Gateway mode switch did not complete. Config remains disabled with the requested mode; routing settings are retained. Retry the same setup options after resolving local daemon readiness privately.",
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
    const targets = routingTargets(home, cwd, config);
    const configSnapshot = snapshot(p.config, true);
    const before = targets.find((item) => item.path === p.settings)?.saved;
    const { value, env: savedEnv } = settings(before);
    let routingRemoved = false;
    if (savedEnv[BASE] === `http://127.0.0.1:${config.port}`) {
      delete savedEnv[BASE];
      routingRemoved = true;
    }
    const current = text(savedEnv[HEADERS]);
    if (current !== undefined) {
      const remaining = lines(current).filter((line) => line !== proxyKeyLine(config));
      if (remaining.length !== lines(current).length) {
        routingRemoved = true;
        if (remaining.length) savedEnv[HEADERS] = remaining.join("\n");
        else delete savedEnv[HEADERS];
      }
    }
    if (routingRemoved && Object.keys(savedEnv).length === 0) delete value.env;
    else if (value.env !== undefined) value.env = savedEnv;
    const remainingTargets = targets.filter(
      (item) => item.path !== p.settings && matchesRouting(routingEnv(item.saved), config),
    );
    if (remainingTargets.length > 128)
      fail("Too many active routing targets; review the private target index before disable.");
    const writes: { path: string; text: string; prior: Snapshot | undefined }[] = [];
    if (before && JSON.stringify(value) !== JSON.stringify(JSON.parse(before.text)))
      writes.push({ path: p.settings, text: jsonText(value), prior: before });
    writes.push({
      path: p.config,
      text: jsonText({
        ...config,
        enabled: loadConfig(home) !== undefined && remainingTargets.length > 0,
        settingsTargets: remainingTargets.map((item) => item.path),
      }),
      prior: configSnapshot,
    });
    for (const item of targets) unchangedRouting(item.path, item.saved);
    transaction(writes);
    // Config watcher drains within five seconds; never kills a listener by PID/port.
  } finally {
    unlock();
  }
}

// Status observes actual disk routing, never legacy receipts or list membership.
export function routingStatus(paths: ReturnType<typeof targetPaths>, config?: ProxyConfig): string {
  const current = routingSnapshot(paths.settings);
  const env = routingEnv(current);
  const prefix = `settings ${current ? "present" : "missing"}; `;
  if (!config) return prefix + "not configured (no retained config)";
  return (
    prefix +
    (matchesRouting(env, config)
      ? "configured; disk routing matches private config"
      : "not configured; disk routing does not match private config")
  );
}

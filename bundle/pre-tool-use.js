#!/usr/bin/env node

// dist/tracing-policy.js
import { randomUUID } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { mkdir, open, rename, rmdir, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
function isMode(value) {
  return value === "full" || value === "metadata";
}
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasCode(error2, code) {
  return isObject(error2) && error2.code === code;
}
function readPolicy(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error2) {
    if (hasCode(error2, "ENOENT")) {
      try {
        lstatSync(path);
      } catch (statError) {
        if (hasCode(statError, "ENOENT"))
          return { threads: {} };
        throw statError;
      }
    }
    throw error2;
  }
  const value = JSON.parse(raw);
  if (!isObject(value) || !isObject(value.threads) || Object.values(value.threads).some((mode) => !isMode(mode)) || Object.keys(value).some((key) => key !== "threads")) {
    throw new Error("Invalid tracing preference format");
  }
  return value;
}
function tracingPolicyPath(stateFilePath) {
  return `${stateFilePath.replace(/\.json$/, "")}.privacy.json`;
}
function getThreadTracingMode(stateFilePath, sessionId, defaultMuted = false) {
  try {
    const policy = readPolicy(tracingPolicyPath(stateFilePath));
    if (Object.hasOwn(policy.threads, sessionId))
      return policy.threads[sessionId];
    return defaultMuted ? "metadata" : "full";
  } catch {
    return "metadata";
  }
}

// dist/tracing-mode.js
function resolveTurnTracingMode(config, sessionId, ...snapshots) {
  const { stateFilePath, defaultMuted } = typeof config === "string" ? { stateFilePath: config } : config;
  return snapshots.find((mode) => mode !== void 0) ?? getThreadTracingMode(stateFilePath, sessionId, defaultMuted);
}

// dist/logger.js
import { appendFileSync, mkdirSync, statSync, renameSync } from "node:fs";
import { dirname as dirname2 } from "node:path";
var MAX_LOG_BYTES = 5 * 1024 * 1024;
var LOG_FILE = process.env.CC_LANGSMITH_LOG_FILE ?? `${process.env.HOME ?? ""}/.claude/state/hook.log`;
var debugEnabled = false;
function initLogger(debug2) {
  debugEnabled = debug2;
  mkdirSync(dirname2(LOG_FILE), { recursive: true });
}
function rotateIfNeeded() {
  try {
    if (statSync(LOG_FILE).size >= MAX_LOG_BYTES) {
      renameSync(LOG_FILE, `${LOG_FILE}.1`);
    }
  } catch {
  }
}
function write(level, message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").replace("Z", "");
  const line = `${timestamp} [${level}] ${message}
`;
  try {
    rotateIfNeeded();
    appendFileSync(LOG_FILE, line);
  } catch {
  }
}
function error(message) {
  write("ERROR", message);
}
function debug(message) {
  if (debugEnabled) {
    write("DEBUG", message);
  }
}

// dist/state.js
import { readFileSync as readFileSync2, writeFileSync, mkdirSync as mkdirSync2, openSync, closeSync, unlinkSync } from "node:fs";
import { dirname as dirname3 } from "node:path";
var LOCK_TIMEOUT_MS = 5e3;
var LOCK_RETRY_MS = 20;
function lockPath(stateFilePath) {
  return `${stateFilePath}.lock`;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function acquireLock(stateFilePath) {
  const lock = lockPath(stateFilePath);
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  mkdirSync2(dirname3(stateFilePath), { recursive: true });
  while (Date.now() < deadline) {
    try {
      const fd = openSync(lock, "wx");
      closeSync(fd);
      return;
    } catch {
      await sleep(LOCK_RETRY_MS);
    }
  }
  try {
    unlinkSync(lock);
  } catch {
  }
}
function releaseLock(stateFilePath) {
  try {
    unlinkSync(lockPath(stateFilePath));
  } catch {
  }
}
async function atomicUpdateState(stateFilePath, fn) {
  await acquireLock(stateFilePath);
  try {
    const state = loadState(stateFilePath);
    writeFileSync(stateFilePath, JSON.stringify(fn(state), null, 2));
  } finally {
    releaseLock(stateFilePath);
  }
}
function loadState(stateFilePath) {
  try {
    const raw = readFileSync2(stateFilePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function getSessionState(state, sessionId) {
  return state[sessionId] ?? {
    last_line: -1,
    turn_count: 0,
    updated: "",
    task_run_map: {}
  };
}
var SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1e3;

// dist/config.js
import { readFileSync as readFileSync4 } from "node:fs";

// dist/shared-config.js
import { lstatSync as lstatSync2, readFileSync as readFileSync3, statSync as statSync2 } from "node:fs";
var COMMON_BOOLEAN_SETTINGS = {
  enabled: { default: false, restrictive: false },
  defaultMuted: { default: false, restrictive: true }
};
function object(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function invalid(raw) {
  return {
    status: "invalid",
    common: { enabled: false, defaultMuted: true },
    ...raw === void 0 ? {} : { raw },
    diagnostics: [
      "Invalid or unreadable common config; ordinary fields discarded, privacy switches restricted."
    ]
  };
}
function parseReplica(value) {
  if (!object(value))
    return void 0;
  const replica = {};
  for (const [canonical, alias] of [
    ["api_url", "apiUrl"],
    ["api_key", "apiKey"],
    ["project", "projectName"]
  ]) {
    const selected = Object.hasOwn(value, canonical) ? canonical : alias;
    if (Object.hasOwn(value, selected)) {
      const entry = value[selected];
      if (typeof entry !== "string")
        return void 0;
      replica[canonical] = entry;
    }
  }
  if (Object.hasOwn(value, "updates")) {
    if (!object(value.updates))
      return void 0;
    replica.updates = value.updates;
  }
  return replica;
}
function parseCommonConfig(value) {
  if (!object(value))
    return invalid();
  const common = {};
  const diagnostics = [];
  for (const field of ["enabled", "defaultMuted"]) {
    if (!Object.hasOwn(value, field))
      continue;
    const entry = value[field];
    common[field] = typeof entry === "boolean" ? entry : COMMON_BOOLEAN_SETTINGS[field].restrictive;
    if (typeof entry !== "boolean")
      diagnostics.push(`Invalid ${field}; using restrictive value.`);
  }
  for (const field of ["api_key", "api_url", "project"]) {
    if (!Object.hasOwn(value, field))
      continue;
    if (typeof value[field] !== "string")
      return invalid(value);
    common[field] = value[field];
  }
  if (Object.hasOwn(value, "redact")) {
    if (typeof value.redact !== "boolean")
      return invalid(value);
    common.redact = value.redact;
  }
  if (Object.hasOwn(value, "metadata")) {
    if (!object(value.metadata))
      return invalid(value);
    common.metadata = value.metadata;
  }
  if (Object.hasOwn(value, "replicas")) {
    if (!Array.isArray(value.replicas))
      return invalid(value);
    const replicas = [];
    for (const entry of value.replicas) {
      const replica = parseReplica(entry);
      if (replica === void 0)
        return invalid(value);
      replicas.push(replica);
    }
    common.replicas = replicas;
  }
  if (Object.hasOwn(value, "redact_extra_rules")) {
    if (!Array.isArray(value.redact_extra_rules))
      return invalid(value);
    const rules = [];
    for (const rule of value.redact_extra_rules) {
      if (!object(rule) || typeof rule.pattern !== "string" || !Object.hasOwn(rule, "pattern")) {
        return invalid(value);
      }
      const hasReplace = Object.hasOwn(rule, "replace");
      if (hasReplace && typeof rule.replace !== "string")
        return invalid(value);
      try {
        new RegExp(rule.pattern, "g");
      } catch {
        return invalid(value);
      }
      rules.push({
        pattern: rule.pattern,
        ...hasReplace ? { replace: rule.replace } : {}
      });
    }
    common.redact_extra_rules = rules;
  }
  return { status: "valid", common, raw: value, diagnostics };
}
function readCommonConfigFile(path) {
  try {
    if (!statSync2(path).isFile())
      return invalid();
  } catch (error2) {
    if (error2.code === "ENOENT") {
      try {
        lstatSync2(path);
      } catch (lstatError) {
        if (lstatError.code === "ENOENT") {
          return { status: "absent", common: {}, diagnostics: [] };
        }
      }
    }
    return invalid();
  }
  try {
    return parseCommonConfig(JSON.parse(readFileSync3(path, "utf8")));
  } catch {
    return invalid();
  }
}
function resolveField(sources, field) {
  return sources.find((source) => source[field] !== void 0)?.[field];
}
function mergeCommonConfig(sources, options = {}) {
  const { harness = {}, root = {}, user = {}, userRoot = {}, env = {}, defaults = {} } = sources;
  const files = [harness, root, user, userRoot];
  const precedence = [env, ...files, defaults];
  const switches = options.envFirst ? precedence : [...files, env, defaults];
  const merged = { enabled: false, defaultMuted: false, redact: true };
  for (const field of ["enabled", "defaultMuted"]) {
    merged[field] = resolveField(switches, field) ?? COMMON_BOOLEAN_SETTINGS[field].default;
  }
  merged.api_key = resolveField(precedence, "api_key");
  merged.api_url = resolveField(precedence, "api_url");
  merged.project = resolveField(precedence, "project");
  merged.replicas = resolveField(precedence, "replicas");
  merged.redact = resolveField(precedence, "redact") ?? true;
  merged.redact_extra_rules = resolveField(precedence, "redact_extra_rules");
  if (precedence.some((source) => source.metadata !== void 0)) {
    merged.metadata = [...precedence].reverse().reduce((metadata, source) => ({ ...metadata, ...source.metadata }), {});
  }
  return merged;
}
function toSdkReplicas(replicas) {
  return replicas?.map((replica) => ({
    ...replica.api_url === void 0 ? {} : { apiUrl: replica.api_url },
    ...replica.api_key === void 0 ? {} : { apiKey: replica.api_key },
    ...replica.project === void 0 ? {} : { projectName: replica.project },
    ...replica.updates === void 0 ? {} : { updates: replica.updates }
  }));
}

// dist/config.js
import { homedir, userInfo } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
var LS_INTEGRATION_VERSION = true ? "0.3.1" : process.env.CC_LANGSMITH_INTEGRATION_VERSION || void 0;
var PROVIDER_HOSTS = {
  github: "github.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
  devAzure: "dev.azure.com"
};
function readAnthropicUserId() {
  const homeDir = process.env.HOME ?? process.env.USERPROFILE;
  if (!homeDir)
    return void 0;
  const configPath = join(homeDir, ".claude.json");
  try {
    const raw = readFileSync4(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    const userId = parsed?.userID;
    if (typeof userId === "string" && userId.length > 0) {
      return userId;
    }
  } catch (err) {
    debug(`Could not read Anthropic user ID from ${configPath}: ${err}`);
  }
  return void 0;
}
function readLocalUsername() {
  return userInfo().username;
}
var GIT_PROVIDERS = {
  "github.com": "github",
  "gitlab.com": "gitlab",
  "bitbucket.org": "bitbucket",
  "dev.azure.com": "devAzure"
};
function parseRepoName(remoteUrl) {
  const value = remoteUrl.trim();
  try {
    const url = new URL(value);
    const provider = GIT_PROVIDERS[url.hostname.toLowerCase()];
    const name = url.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "");
    if (provider && name)
      return { provider, name };
  } catch {
  }
  const scpMatch = value.match(/^(?:[^@]+@)?([^:]+):\/?(.+)$/);
  if (scpMatch) {
    const provider = GIT_PROVIDERS[scpMatch[1].toLowerCase()];
    const name = scpMatch[2].replace(/\/+$/, "").replace(/\.git$/, "");
    if (provider && name)
      return { provider, name };
  }
  return void 0;
}
function getRepoName(cwd) {
  try {
    const output = execSync("git remote -v", { cwd, encoding: "utf-8", timeout: 5e3 });
    const lines = output.trim().split("\n").filter(Boolean);
    const remotes = [];
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2 && line.includes("(fetch)")) {
        remotes.push({ name: parts[0], url: parts[1] });
      }
    }
    const origin = remotes.find((r) => r.name === "origin");
    if (origin) {
      const name = parseRepoName(origin.url + " ");
      if (name)
        return name;
    }
    for (const remote of remotes) {
      const name = parseRepoName(remote.url + " ");
      if (name)
        return name;
    }
  } catch {
  }
  return void 0;
}
function getGitInfo(cwd) {
  const result = {};
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      encoding: "utf-8",
      timeout: 5e3
    }).trim();
    if (branch && branch !== "HEAD")
      result.branch = branch;
  } catch {
  }
  try {
    const commit = execSync("git rev-parse HEAD", { cwd, encoding: "utf-8", timeout: 5e3 }).trim();
    if (commit)
      result.commit = commit;
  } catch {
  }
  return result;
}
var BOOLEAN_SETTINGS = {
  enabled: { env: "TRACE_TO_LANGSMITH", ...COMMON_BOOLEAN_SETTINGS.enabled },
  defaultMuted: { env: "CC_LANGSMITH_DEFAULT_MUTED", ...COMMON_BOOLEAN_SETTINGS.defaultMuted }
};
function envBoolean(field) {
  const setting = BOOLEAN_SETTINGS[field];
  const env = process.env[setting.env]?.toLowerCase();
  if (env === void 0)
    return void 0;
  if (env === "true")
    return true;
  if (env === "false")
    return false;
  return setting.restrictive;
}
function loadConfig(options) {
  const cwd = options?.cwd ?? process.cwd();
  const homeDir = homedir();
  const stateFilePath = process.env.STATE_FILE ?? `${homeDir}/.claude/state/langsmith_state.json`;
  const debug2 = (process.env.CC_LANGSMITH_DEBUG ?? "").toLowerCase() === "true";
  let replicas;
  const providedReplicas = process.env.CC_LANGSMITH_RUNS_ENDPOINTS;
  if (providedReplicas !== void 0) {
    try {
      replicas = JSON.parse(providedReplicas);
    } catch {
      error("Failed to parse provided CC_LANGSMITH_RUNS_ENDPOINTS. Please make sure they are valid JSON.");
    }
  }
  const parentDottedOrder = process.env.CC_LANGSMITH_PARENT_DOTTED_ORDER || void 0;
  let customMetadata;
  const providedMetadata = process.env.CC_LANGSMITH_METADATA;
  if (providedMetadata !== void 0) {
    try {
      const parsed = JSON.parse(providedMetadata);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        customMetadata = parsed;
      } else {
        error("CC_LANGSMITH_METADATA must be a JSON object (not an array or primitive).");
      }
    } catch {
      error("Failed to parse provided CC_LANGSMITH_METADATA. Please make sure it is valid JSON.");
    }
  }
  const redactEnv = (process.env.CC_LANGSMITH_REDACT ?? "").trim().toLowerCase();
  const redact = !["0", "false", "no", "off"].includes(redactEnv);
  let redactExtraRules;
  const providedExtra = process.env.CC_LANGSMITH_REDACT_EXTRA;
  if (providedExtra !== void 0) {
    try {
      const parsed = JSON.parse(providedExtra);
      if (!Array.isArray(parsed)) {
        error("CC_LANGSMITH_REDACT_EXTRA must be a JSON array of { pattern, replace }.");
      } else {
        const validRules = [];
        for (const rule of parsed) {
          if (typeof rule !== "object" || rule === null || typeof rule.pattern !== "string" || rule.replace !== void 0 && typeof rule.replace !== "string") {
            error(`Skipping invalid CC_LANGSMITH_REDACT_EXTRA rule (expected { pattern: string, replace?: string }): ${JSON.stringify(rule)}`);
            continue;
          }
          try {
            new RegExp(rule.pattern);
          } catch {
            error(`Skipping CC_LANGSMITH_REDACT_EXTRA rule with an invalid regex pattern: ${rule.pattern}`);
            continue;
          }
          validRules.push(rule);
        }
        if (validRules.length > 0 || parsed.length === 0)
          redactExtraRules = validRules;
      }
    } catch {
      error("Failed to parse CC_LANGSMITH_REDACT_EXTRA. Please make sure it is valid JSON.");
    }
  }
  const common = mergeCommonConfig({
    harness: readCommonConfigFile(join(cwd, ".claude", "langsmith.json")).common,
    root: readCommonConfigFile(join(cwd, "langsmith-plugins.json")).common,
    user: homeDir ? readCommonConfigFile(join(homeDir, ".claude", "langsmith.json")).common : void 0,
    userRoot: homeDir ? readCommonConfigFile(join(homeDir, ".langsmith-plugins.json")).common : void 0,
    env: {
      enabled: envBoolean("enabled"),
      defaultMuted: envBoolean("defaultMuted"),
      api_key: process.env.CC_LANGSMITH_API_KEY ?? process.env.LANGSMITH_API_KEY,
      api_url: process.env.LANGSMITH_ENDPOINT,
      project: process.env.CC_LANGSMITH_PROJECT,
      metadata: customMetadata,
      redact: process.env.CC_LANGSMITH_REDACT === void 0 ? void 0 : redact
      // Environment rules retain the existing tolerant parser.
    },
    defaults: { api_key: "", api_url: "https://api.smith.langchain.com", project: "claude-code" }
  }, { envFirst: true });
  if (replicas === void 0)
    replicas = toSdkReplicas(common.replicas);
  redactExtraRules ??= common.redact_extra_rules;
  customMetadata = common.metadata;
  const anthropicUserId = readAnthropicUserId();
  const localUsername = readLocalUsername();
  const identityMetadata = { local_username: localUsername };
  if (anthropicUserId) {
    identityMetadata.user_id = anthropicUserId;
    identityMetadata.anthropic_user_id = anthropicUserId;
  }
  const contractMetadata = {
    ls_agent_purpose: "coding",
    ls_integration: "claude-code",
    ls_agent_runtime: "Claude Code",
    ls_trace_schema_version: "coding-agent-v1",
    cwd
  };
  if (LS_INTEGRATION_VERSION) {
    contractMetadata.ls_integration_version = LS_INTEGRATION_VERSION;
  }
  const repoMetadata = {};
  const repoName = getRepoName(cwd);
  if (repoName != null) {
    repoMetadata.repository_name = repoName.name;
    repoMetadata.repository_provider = repoName.provider;
    const host = PROVIDER_HOSTS[repoName.provider];
    if (host)
      repoMetadata.repository_url = `https://${host}/${repoName.name}`;
  }
  const gitInfo = getGitInfo(cwd);
  if (gitInfo.branch)
    repoMetadata.git_branch = gitInfo.branch;
  if (gitInfo.commit)
    repoMetadata.git_commit_sha = gitInfo.commit;
  customMetadata = { ...contractMetadata, ...identityMetadata, ...repoMetadata, ...customMetadata };
  return {
    enabled: common.enabled,
    defaultMuted: common.defaultMuted,
    apiKey: common.api_key,
    project: common.project,
    apiBaseUrl: common.api_url,
    stateFilePath,
    debug: debug2,
    parentDottedOrder,
    replicas,
    customMetadata,
    redact: common.redact,
    redactExtraRules
  };
}

// dist/utils/hook-init.js
function initHook(cwd) {
  const config = loadConfig({ cwd });
  initLogger(config.debug);
  if (!config.enabled) {
    return null;
  }
  if (!config.apiKey && (!config.replicas || config.replicas.length === 0)) {
    error("No API key set (CC_LANGSMITH_API_KEY or LANGSMITH_API_KEY) and no replicas configured");
    return null;
  }
  return config;
}

// dist/utils/stdin.js
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => data += chunk);
    process.stdin.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error(`Failed to parse hook input: ${err}`));
      }
    });
    process.stdin.on("error", reject);
  });
}

// dist/hooks/pre-tool-use.js
async function main() {
  const input = await readStdin();
  const config = initHook(input.cwd);
  if (!config)
    return;
  const startTime = Date.now();
  debug(`PreToolUse hook: tool=${input.tool_name}, id=${input.tool_use_id}`);
  await atomicUpdateState(config.stateFilePath, (state) => {
    const ss = getSessionState(state, input.session_id);
    return {
      ...state,
      [input.session_id]: {
        ...ss,
        tool_tracing_modes: {
          ...ss.tool_tracing_modes,
          [input.tool_use_id]: resolveTurnTracingMode(config, input.session_id, ss.tool_tracing_modes?.[input.tool_use_id], ss.current_turn_tracing, ss.current_turn_run_id ? ss.open_turns?.[ss.current_turn_run_id]?.tracing : void 0)
        },
        tool_start_times: {
          ...ss.tool_start_times,
          [input.tool_use_id]: startTime
        }
      }
    };
  });
}
main().catch((err) => {
  try {
    error(`PreToolUse hook fatal error: ${err}`);
  } catch {
  }
  process.exit(0);
});

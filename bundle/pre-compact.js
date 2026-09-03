#!/usr/bin/env node

// dist/logger.js
import { appendFileSync, mkdirSync, statSync, renameSync } from "node:fs";
import { dirname } from "node:path";
var MAX_LOG_BYTES = 5 * 1024 * 1024;
var LOG_FILE = process.env.CC_LANGSMITH_LOG_FILE ?? `${process.env.HOME ?? ""}/.claude/state/hook.log`;
var debugEnabled = false;
function initLogger(debug2) {
  debugEnabled = debug2;
  mkdirSync(dirname(LOG_FILE), { recursive: true });
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
import { chmodSync, closeSync, existsSync, mkdirSync as mkdirSync2, openSync, readFileSync, renameSync as renameSync2, statSync as statSync2, unlinkSync, writeFileSync } from "node:fs";
import { dirname as dirname2 } from "node:path";
import { randomUUID } from "node:crypto";
var LOCK_TIMEOUT_MS = 5e3;
var LOCK_RETRY_MS = 20;
var LOCK_STALE_MS = 3e4;
var FAIL_CLOSED_KEY = "__langsmith_fail_closed";
function lockPath(stateFilePath) {
  return `${stateFilePath}.lock`;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function processAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error2) {
    return error2.code === "EPERM";
  }
}
function staleLock(path) {
  try {
    if (Date.now() - statSync2(path).mtimeMs <= LOCK_STALE_MS)
      return false;
    try {
      const record = JSON.parse(readFileSync(path, "utf-8"));
      return typeof record.pid !== "number" || !processAlive(record.pid);
    } catch {
      return true;
    }
  } catch {
    return false;
  }
}
async function acquireLock(stateFilePath) {
  const path = lockPath(stateFilePath);
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  const record = { owner: randomUUID(), pid: process.pid, created: Date.now() };
  mkdirSync2(dirname2(stateFilePath), { recursive: true });
  while (Date.now() < deadline) {
    try {
      const fd = openSync(path, "wx", 384);
      writeFileSync(fd, JSON.stringify(record));
      closeSync(fd);
      return record;
    } catch (error2) {
      if (error2.code !== "EEXIST")
        throw error2;
      if (staleLock(path)) {
        try {
          unlinkSync(path);
        } catch {
        }
        continue;
      }
      await sleep(LOCK_RETRY_MS);
    }
  }
  throw new Error(`Timed out acquiring state lock: ${path}`);
}
function releaseLock(stateFilePath, lock) {
  const path = lockPath(stateFilePath);
  try {
    const current = JSON.parse(readFileSync(path, "utf-8"));
    if (current.owner === lock.owner && current.pid === lock.pid)
      unlinkSync(path);
  } catch {
  }
}
async function atomicUpdateState(stateFilePath, fn) {
  const lock = await acquireLock(stateFilePath);
  try {
    const state = loadState(stateFilePath);
    writeStateFile(stateFilePath, fn(state));
  } finally {
    releaseLock(stateFilePath, lock);
  }
}
function validMode(value) {
  return value === "full" || value === "metadata";
}
function validSession(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return false;
  const session = value;
  if (typeof session.last_line !== "number" || typeof session.turn_count !== "number" || typeof session.updated !== "string")
    return false;
  for (const key of ["tracing", "current_turn_tracing", "compaction_tracing"]) {
    if (session[key] !== void 0 && !validMode(session[key]))
      return false;
  }
  if (session.open_turns !== void 0) {
    if (!session.open_turns || typeof session.open_turns !== "object" || Array.isArray(session.open_turns))
      return false;
    for (const turn of Object.values(session.open_turns)) {
      if (!turn || typeof turn !== "object" || Array.isArray(turn))
        return false;
      const mode = turn.tracing;
      if (mode !== void 0 && !validMode(mode))
        return false;
    }
  }
  return true;
}
function failClosedState() {
  return { [FAIL_CLOSED_KEY]: true };
}
function loadState(stateFilePath) {
  if (!existsSync(stateFilePath))
    return {};
  try {
    const parsed = JSON.parse(readFileSync(stateFilePath, "utf-8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return failClosedState();
    const quarantined = parsed[FAIL_CLOSED_KEY] === true;
    for (const [key, value] of Object.entries(parsed)) {
      if (key !== FAIL_CLOSED_KEY && !validSession(value))
        return failClosedState();
    }
    return quarantined ? parsed : { ...parsed };
  } catch {
    return failClosedState();
  }
}
function writeStateFile(stateFilePath, state) {
  mkdirSync2(dirname2(stateFilePath), { recursive: true });
  const tempPath = `${stateFilePath}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(tempPath, JSON.stringify(state, null, 2), { mode: 384 });
  renameSync2(tempPath, stateFilePath);
  chmodSync(stateFilePath, 384);
}
function getTracingMode(state, sessionId) {
  const stored = state;
  const session = stored[sessionId];
  if (stored[FAIL_CLOSED_KEY])
    return "metadata";
  if (!session)
    return "full";
  return session.tracing === "metadata" ? "metadata" : "full";
}
function getSessionState(state, sessionId) {
  const session = state[sessionId];
  return validSession(session) ? session : { last_line: -1, turn_count: 0, updated: "", task_run_map: {} };
}
var SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1e3;

// dist/config.js
import { readFileSync as readFileSync2 } from "node:fs";
import { userInfo } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
var LS_INTEGRATION_VERSION = true ? "0.3.0" : process.env.CC_LANGSMITH_INTEGRATION_VERSION || void 0;
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
    const raw = readFileSync2(configPath, "utf-8");
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
function readEnabled(path) {
  try {
    const parsed = JSON.parse(readFileSync2(path, "utf-8"));
    return { present: true, enabled: typeof parsed?.enabled === "boolean" && parsed.enabled };
  } catch (error2) {
    if (error2.code === "ENOENT")
      return { present: false, enabled: false };
    return { present: true, enabled: false };
  }
}
function parseExplicitBoolean(value) {
  if (value === void 0)
    return void 0;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true")
    return true;
  if (normalized === "false")
    return false;
  return void 0;
}
function resolveTracingEnabled(cwd, homeDir) {
  if (process.env.TRACE_TO_LANGSMITH !== void 0)
    return parseExplicitBoolean(process.env.TRACE_TO_LANGSMITH) ?? false;
  const project = readEnabled(join(cwd, ".claude", "langsmith.json"));
  if (project.present)
    return project.enabled;
  const user = readEnabled(join(homeDir, ".claude", "langsmith.json"));
  return user.present ? user.enabled : false;
}
function loadConfig(options) {
  const cwd = options?.cwd ?? process.cwd();
  const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
  const enabled = resolveTracingEnabled(cwd, homeDir);
  const apiKey = process.env.CC_LANGSMITH_API_KEY ?? process.env.LANGSMITH_API_KEY ?? "";
  const project = process.env.CC_LANGSMITH_PROJECT ?? "claude-code";
  const apiBaseUrl = process.env.LANGSMITH_ENDPOINT ?? "https://api.smith.langchain.com";
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
        if (validRules.length > 0)
          redactExtraRules = validRules;
      }
    } catch {
      error("Failed to parse CC_LANGSMITH_REDACT_EXTRA. Please make sure it is valid JSON.");
    }
  }
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
    enabled,
    apiKey,
    project,
    apiBaseUrl,
    stateFilePath,
    debug: debug2,
    parentDottedOrder,
    replicas,
    customMetadata,
    redact,
    redactExtraRules
  };
}

// dist/utils/hook-init.js
function initHook(cwd) {
  const config = loadConfig({ cwd });
  initLogger(config.debug);
  if (!config.enabled)
    return null;
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

// dist/hooks/pre-compact.js
async function main() {
  const input = await readStdin();
  const config = initHook(input.cwd);
  if (!config)
    return;
  debug(`PreCompact hook started, session=${input.session_id}, trigger=${input.trigger}`);
  await atomicUpdateState(config.stateFilePath, (state) => {
    const sessionState = getSessionState(state, input.session_id);
    return {
      ...state,
      [input.session_id]: {
        ...sessionState,
        compaction_start_time: Date.now(),
        compaction_tracing: sessionState.current_turn_tracing ?? getTracingMode(state, input.session_id)
      }
    };
  });
  debug(`Recorded compaction start time for session ${input.session_id}`);
}
main().catch((err) => {
  try {
    debug(`PreCompact hook error: ${err}`);
  } catch {
  }
  process.exit(0);
});

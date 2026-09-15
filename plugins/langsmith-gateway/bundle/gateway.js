#!/usr/bin/env node

// dist/hooks/gateway.js
import { fileURLToPath } from "node:url";

// dist/proxy/config.js
import { lstatSync as lstatSync2 } from "node:fs";
import { isAbsolute, join as join2, normalize } from "node:path";
import { userInfo } from "node:os";

// dist/proxy/files.js
import { constants, closeSync, fstatSync, fsyncSync, lstatSync, linkSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
function directory(path, create = false, privateMode = false) {
  if (create) {
    try {
      mkdirSync(path, { mode: 448 });
    } catch (e) {
      if (e.code !== "EEXIST")
        throw e;
    }
  }
  const s = lstatSync(path);
  if (!s.isDirectory() || s.uid !== process.getuid?.() || s.mode & (privateMode ? 63 : 18))
    throw new Error("Unsafe settings directory");
}
function directories(home, create = false) {
  directory(home);
  directory(join(home, ".claude"), create);
}
function snapshot(path, privateMode = false) {
  let fd;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (e) {
    if (e.code === "ENOENT")
      return;
    throw e;
  }
  try {
    const s = fstatSync(fd);
    if (!s.isFile() || s.nlink !== 1 || s.uid !== process.getuid?.() || s.mode & (privateMode ? 63 : 18) || s.size > 1024 * 1024)
      throw new Error("Unsafe settings file");
    return {
      text: readFileSync(fd, "utf8"),
      ino: s.ino,
      dev: s.dev,
      mtime: s.mtimeMs,
      mode: s.mode
    };
  } finally {
    closeSync(fd);
  }
}
function unchanged(path, prior, privateMode = false) {
  if (JSON.stringify(snapshot(path, privateMode)) !== JSON.stringify(prior))
    throw new Error("Settings changed concurrently; retry");
}
function atomic(path, text2, prior) {
  const temp = join(dirname(path), `.gateway-${randomBytes(16).toString("hex")}.tmp`);
  const fd = openSync(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 384);
  try {
    try {
      writeFileSync(fd, text2);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    unchanged(path, prior);
    if (prior === void 0) {
      linkSync(temp, path);
      unlinkSync(temp);
    } else
      renameSync(temp, path);
    const dir = openSync(dirname(path), constants.O_RDONLY);
    try {
      fsyncSync(dir);
    } finally {
      closeSync(dir);
    }
  } finally {
    try {
      unlinkSync(temp);
    } catch {
    }
  }
}
var jsonText = (value) => JSON.stringify(value, null, 2) + "\n";
function transaction(writes) {
  const completed = [];
  for (const item of writes)
    unchanged(item.path, item.prior);
  try {
    for (const item of writes) {
      atomic(item.path, item.text, item.prior);
      completed.push({ ...item, written: snapshot(item.path) });
    }
  } catch (error) {
    for (const item of completed.reverse()) {
      try {
        unchanged(item.path, item.written);
        if (item.prior)
          atomic(item.path, item.prior.text, item.written);
        else
          unlinkSync(item.path);
      } catch {
      }
    }
    throw error;
  }
}

// dist/proxy/config.js
var ConfigError = class extends Error {
};
var CONFIG_UPDATE_GUIDANCE = "Invalid proxy configuration. A one-time private config update is required: use the full current schema with explicit enabled and useClaudeSubscription booleans, including when disabled. Retain your existing local key, CLI, profile, port and endpoints. Do not paste secrets or delete/reset configuration.";
var API_URL = "https://api.smith.langchain.com";
var UPSTREAM = "https://gateway.smith.langchain.com";
var KEY_HEADER = "x-langsmith-proxy-key";
var userHome = () => userInfo().homedir;
var configDir = (home = userHome()) => join2(home, ".claude", "langsmith-proxy");
function httpsOrigin(value) {
  if (typeof value !== "string" || value.length > 2048 || /\s/.test(value) || !/^https:\/\/[a-zA-Z0-9.-]+(?::[0-9]{1,5})?\/?$/.test(value))
    throw new Error("Endpoints must be HTTPS DNS origins without credentials, path, query or fragment");
  const url = new URL(value);
  const host = url.hostname;
  const labels = host.split(".");
  if (host.length > 253 || labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) || !/^[a-z][a-z0-9-]*$/.test(labels.at(-1)) || /(?:^|\.)(?:localhost|local|internal|home|lan)$/.test(host) || url.port !== "" && (Number(url.port) < 1 || Number(url.port) > 65535))
    throw new Error("Endpoints must use public DNS names and HTTPS ports 1-65535");
  return url.origin;
}
function endpoints(c) {
  if (c.apiUrl === void 0 !== (c.gatewayUrl === void 0))
    throw new Error("Supply both --api-url and --gateway-url; no implicit production endpoint");
  return {
    apiUrl: httpsOrigin(c.apiUrl === void 0 ? API_URL : c.apiUrl),
    gatewayUrl: httpsOrigin(c.gatewayUrl === void 0 ? UPSTREAM : c.gatewayUrl)
  };
}
function privatePath(path, directory2 = false) {
  const s = lstatSync2(path);
  if (s.uid !== process.getuid?.() || (s.mode & 63) !== 0 || (directory2 ? !s.isDirectory() : !s.isFile()))
    throw new Error("Unsafe proxy configuration");
}
function loadConfig(home = userHome(), includeDisabled = false) {
  let saved;
  try {
    directories(home);
    privatePath(configDir(home), true);
    saved = snapshot(join2(configDir(home), "config.json"), true);
  } catch (e) {
    if (e.code === "ENOENT")
      return;
    if (e instanceof Error && e.message === "Unsafe settings file")
      throw new Error("Unsafe proxy configuration");
    throw e;
  }
  if (!saved)
    return;
  const c = JSON.parse(saved.text);
  if (!c || typeof c.enabled !== "boolean" || typeof c.useClaudeSubscription !== "boolean" || typeof c.cli !== "string" || !isAbsolute(c.cli) || typeof c.profile !== "string" || !/^[a-zA-Z0-9_.-]{1,128}$/.test(c.profile) || !Number.isInteger(c.port) || c.port < 1024 || c.port > 65535 || typeof c.secret !== "string" || !/^[a-f0-9]{64}$/.test(c.secret) || c.settingsTargets !== void 0 && (!Array.isArray(c.settingsTargets) || c.settingsTargets.length > 128 || c.settingsTargets.some((path) => typeof path !== "string" || path.length > 4096 || !isAbsolute(path) || normalize(path) !== path || path.includes("\0") || !/\/\.claude\/settings(?:\.local)?\.json$/.test(path))) || Object.keys(c).some((k) => ![
    "enabled",
    "settingsTargets",
    "cli",
    "profile",
    "port",
    "secret",
    "apiUrl",
    "gatewayUrl",
    "useClaudeSubscription"
  ].includes(k)))
    throw new ConfigError(CONFIG_UPDATE_GUIDANCE);
  let selected;
  try {
    selected = endpoints(c);
  } catch {
    throw new ConfigError(CONFIG_UPDATE_GUIDANCE);
  }
  if (!c.enabled && !includeDisabled)
    return;
  return { ...c, ...selected };
}
function configStatus(home = userHome()) {
  const config = loadConfig(home, true);
  return {
    state: config === void 0 ? "not configured" : config.enabled ? "enabled" : "disabled",
    config
  };
}

// dist/proxy/server.js
import http from "node:http";
import https from "node:https";
import { createHash, timingSafeEqual } from "node:crypto";

// dist/proxy/token.js
import { spawn } from "node:child_process";
function cliEnvironment() {
  return { HOME: userHome(), PATH: "/usr/bin:/bin:/usr/sbin:/sbin" };
}
function cliToken(config, timeoutMs = 1e4, signal) {
  return new Promise((resolve2, reject) => {
    if (signal?.aborted) {
      reject(new Error("LangSmith token unavailable"));
      return;
    }
    const child = spawn(config.cli, [
      "--profile",
      config.profile,
      "--api-url",
      endpoints(config).apiUrl,
      "--format=pretty",
      "auth",
      "token"
    ], { cwd: userHome(), env: cliEnvironment(), stdio: ["ignore", "pipe", "ignore"], shell: false });
    let output = "";
    let settled = false;
    const finish = (token) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      output = "";
      if (token)
        resolve2(token);
      else
        reject(new Error("LangSmith token unavailable"));
    };
    const cancel = () => {
      child.kill("SIGKILL");
    };
    signal?.addEventListener("abort", cancel, { once: true });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish();
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (output.length > 16384) {
        child.kill("SIGKILL");
        finish();
      }
    });
    child.on("error", () => finish());
    child.on("close", (code) => {
      const token = output.trim();
      finish(!signal?.aborted && code === 0 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ? token : void 0);
    });
  });
}
var TokenCache = class {
  load;
  now;
  cached;
  pending;
  retryAt = 0;
  constructor(load, now = Date.now) {
    this.load = load;
    this.now = now;
  }
  get loading() {
    return this.pending !== void 0;
  }
  get() {
    if (this.cached && this.now() < this.cached.until)
      return Promise.resolve(this.cached.token);
    if (this.pending)
      return this.pending;
    if (this.now() < this.retryAt)
      return Promise.reject(new Error("LangSmith token unavailable"));
    this.pending = this.load().then((token) => {
      const exp = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).exp;
      if (typeof exp !== "number" || !Number.isFinite(exp) || exp * 1e3 < this.now() + 5e3)
        throw new Error("Expired token");
      this.cached = { token, until: Math.min(this.now() + 6e4, exp * 1e3 - 6e4) };
      return token;
    }).catch(() => {
      this.cached = void 0;
      this.retryAt = this.now() + 2e3;
      throw new Error("LangSmith token unavailable");
    }).finally(() => {
      this.pending = void 0;
    });
    return this.pending;
  }
};
function loginGuidance(config) {
  return `LangSmith authentication unavailable. Stop gateway sessions and other CLI writers, then log in in a separate terminal using your pinned CLI executable with: --profile ${config.profile} --api-url ${endpoints(config).apiUrl} auth login. Use a dedicated profile matching the selected API: --api-url does not change an existing saved OAuth issuer. Review that issuer privately before login/refresh. Then retry the request; token lookup failures are cached for two seconds. Failed requests are not replayed automatically. Hooks never open a browser.
`;
}

// dist/proxy/server.js
var identity = (c) => createHash("sha256").update(JSON.stringify([
  8,
  c.useClaudeSubscription,
  c.cli,
  c.profile,
  c.port,
  c.secret,
  endpoints(c).apiUrl,
  endpoints(c).gatewayUrl
])).digest("hex");
function authenticated(req, secret) {
  const keys = req.rawHeaders.filter((_, i) => i % 2 === 0 && req.rawHeaders[i].toLowerCase() === KEY_HEADER);
  const value = req.headers[KEY_HEADER];
  if (keys.length !== 1 || typeof value !== "string")
    return false;
  const a = Buffer.from(value), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
function nativeToken(req) {
  const count = req.rawHeaders.filter((name, i) => i % 2 === 0 && name.toLowerCase() === "authorization").length;
  const value = req.headers.authorization;
  if (count !== 1 || typeof value !== "string")
    return;
  if (!/^Bearer /i.test(value))
    return;
  const token = value.slice(7);
  if (!token.startsWith("sk-ant-") || token.length <= 7 || /[\s\x00-\x1f\x7f-\x9f,]/.test(token))
    return;
  try {
    http.validateHeaderValue("x-langsmith-anthropic-passthrough", token);
  } catch {
    return;
  }
  return token;
}
var hop = /* @__PURE__ */ new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "proxy-connection"
]);
var routing = /* @__PURE__ */ new Set([
  "authorization",
  "x-auth-source",
  "x-gateway-key",
  "gateway-key",
  "x-api-key",
  "x-tenant-id",
  "x-workspace-id",
  "x-project-id",
  "x-auth-mode",
  "x-gateway-auth-mode",
  "x-service-key",
  "x-auth-token",
  "x-secret-token"
]);
function cleanHeaders(headers, request = true) {
  const blocked = /* @__PURE__ */ new Set([
    ...hop,
    ...(headers.connection ?? "").toLowerCase().split(",").map((s) => s.trim())
  ]);
  const result = {};
  for (const [name, value] of Object.entries(headers)) {
    if (blocked.has(name) || name === KEY_HEADER || name.startsWith("x-langsmith-") || routing.has(name) || request && (name === "host" || name === "expect"))
      continue;
    result[name] = value;
  }
  return result;
}
function upstreamPath(method, raw) {
  if (raw.length > 4096 || /[\\#\x00-\x20\x7f]/.test(raw))
    return;
  const [path, query] = raw.split("?", 2);
  if (!(method === "POST" && /^\/v1\/messages(?:\/count_tokens)?$/.test(path) || method === "GET" && /^\/v1\/models(?:\/[a-zA-Z0-9_-]+)?$/.test(path)))
    return;
  if (query !== void 0) {
    if (raw.indexOf("?", raw.indexOf("?") + 1) !== -1)
      return;
    const allowed = method === "POST" ? ["beta"] : ["beta", "limit", "before_id", "after_id"];
    const params = new URLSearchParams(query);
    for (const [key, value] of params)
      if (!allowed.includes(key) || !/^[a-zA-Z0-9_.-]{1,256}$/.test(value))
        return;
  }
  return method === "GET" && path.startsWith("/v1/models/") ? "/anthropic" + raw : raw;
}
var MAX_REQUEST_BYTES = 60 * 1024 * 1024;
var RequestError = class extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
function readBody(req) {
  return new Promise((resolve2, reject) => {
    const chunks = [];
    let size = 0;
    const cleanup = () => {
      req.off("data", data);
      req.off("end", done);
      req.off("error", failed);
      req.off("aborted", failed);
    };
    const failed = () => {
      cleanup();
      reject(new RequestError(400, "Invalid JSON request"));
    };
    const data = (chunk) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) {
        cleanup();
        req.pause();
        reject(new RequestError(413, "Request body exceeds 60 MiB"));
      } else
        chunks.push(chunk);
    };
    const done = () => {
      cleanup();
      resolve2(Buffer.concat(chunks, size));
    };
    req.on("data", data);
    req.on("end", done);
    req.on("error", failed);
    req.on("aborted", failed);
  });
}
async function prepareBody(req, path) {
  const encoding = req.headers["content-encoding"];
  if (encoding !== void 0 && encoding.toLowerCase() !== "identity")
    throw new RequestError(415, "Compressed request bodies are unsupported");
  const contentType = req.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase();
  if (contentType && contentType !== "application/json")
    throw new RequestError(415, "Request body must be application/json");
  if (Number(req.headers["content-length"]) > MAX_REQUEST_BYTES)
    throw new RequestError(413, "Request body exceeds 60 MiB");
  const bytes = await readBody(req);
  let body;
  try {
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new RequestError(400, "Invalid JSON request");
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new RequestError(400, "Request body must be a JSON object");
  const model = body.model;
  if (typeof model !== "string" || !model.trim())
    throw new RequestError(400, "model must be a non-empty string");
  const slash = model.indexOf("/");
  if (slash === 0 || slash === model.length - 1)
    throw new RequestError(400, "model must be a bare ID or provider/model");
  const normalized = slash === -1 ? `anthropic/${model}` : model;
  body.model = normalized;
  if (path.split("?", 1)[0] === "/v1/messages/count_tokens") {
    if (!normalized.startsWith("anthropic/"))
      throw new RequestError(501, "count_tokens is supported only for Anthropic models");
    path = "/anthropic" + path;
    body.model = normalized.slice("anthropic/".length);
  }
  const rewritten = Buffer.from(JSON.stringify(body));
  if (rewritten.length > MAX_REQUEST_BYTES)
    throw new RequestError(413, "Request body exceeds 60 MiB");
  return { body: rewritten, path };
}
var Sessions = class {
  now;
  leaseMs;
  idleMs;
  leases = /* @__PURE__ */ new Map();
  ended = /* @__PURE__ */ new Map();
  active = 0;
  lastActivity;
  constructor(now = Date.now, leaseMs = 30 * 6e4, idleMs = 6e4) {
    this.now = now;
    this.leaseMs = leaseMs;
    this.idleMs = idleMs;
    this.lastActivity = now();
  }
  prune() {
    const now = this.now();
    for (const [id, expiry] of this.leases)
      if (expiry <= now)
        this.leases.delete(id);
    for (const [id, expiry] of this.ended)
      if (expiry <= now)
        this.ended.delete(id);
  }
  register(id) {
    this.prune();
    if (this.ended.has(id))
      return false;
    if (!this.leases.has(id) && this.leases.size >= 512)
      return false;
    this.leases.set(id, this.now() + this.leaseMs);
    this.lastActivity = this.now();
    return true;
  }
  release(id) {
    this.prune();
    this.leases.delete(id);
    this.ended.delete(id);
    if (this.ended.size >= 512)
      this.ended.delete(this.ended.keys().next().value);
    this.ended.set(id, this.now() + this.leaseMs);
    this.lastActivity = this.now();
  }
  begin() {
    this.active++;
    this.lastActivity = this.now();
  }
  end() {
    this.active--;
    this.lastActivity = this.now();
  }
  idle() {
    this.prune();
    return this.active === 0 && this.leases.size === 0 && this.now() - this.lastActivity >= this.idleMs;
  }
};
function reply(res, status, message) {
  res.writeHead(status, {
    "content-type": "text/plain",
    "cache-control": "no-store",
    connection: "close"
  });
  res.end(message);
}
function createProxy(config, options = {}) {
  const upstreamOrigin = new URL(endpoints(config).gatewayUrl);
  const credentialAbort = new AbortController();
  const tokens = new TokenCache(options.token ?? (() => cliToken(config, 1e4, credentialAbort.signal)));
  const sessions = options.sessions ?? new Sessions();
  const transport = options.transport ?? https.request;
  let draining = false;
  const server = http.createServer({ maxHeaderSize: 32768 }, (req, res) => {
    if (!authenticated(req, config.secret)) {
      reply(res, 401, "Local proxy authentication required");
      return;
    }
    if (req.headers.origin || req.headers.host !== `127.0.0.1:${config.port}`) {
      reply(res, 403, "Local proxy request rejected");
      return;
    }
    if (draining) {
      reply(res, 503, "Local proxy draining");
      return;
    }
    if (req.method === "GET" && req.url === "/_langsmith/health") {
      reply(res, 200, identity(config));
      return;
    }
    const control2 = /^\/_langsmith\/sessions\/([a-zA-Z0-9_-]{1,128})$/.exec(req.url ?? "");
    if (control2 && (req.method === "PUT" || req.method === "DELETE")) {
      if (req.headers["transfer-encoding"] || req.headers["content-length"] && req.headers["content-length"] !== "0") {
        reply(res, 400, "Control requests must be empty");
        return;
      }
      if (req.method === "PUT" && !sessions.register(control2[1])) {
        reply(res, 429, "Session registration unavailable");
        return;
      }
      if (req.method === "DELETE")
        sessions.release(control2[1]);
      reply(res, 204, "");
      return;
    }
    const path = upstreamPath(req.method ?? "", req.url ?? "");
    if (!path) {
      reply(res, 404, "Unsupported proxy route");
      return;
    }
    const native = config.useClaudeSubscription ? nativeToken(req) : void 0;
    if (config.useClaudeSubscription && !native) {
      reply(res, 401, "Exactly one Authorization: Bearer sk-ant-... with a nonempty, header-safe suffix required");
      return;
    }
    const headers = cleanHeaders(req.headers);
    if (sessions.active >= 64) {
      reply(res, 503, "Local proxy busy");
      return;
    }
    sessions.begin();
    let ended = false;
    let outgoing;
    let incoming;
    let headerTimer;
    const end = () => {
      if (ended)
        return;
      ended = true;
      clearTimeout(headerTimer);
      outgoing?.destroy();
      incoming?.destroy();
      sessions.end();
    };
    req.on("aborted", end);
    req.on("error", end);
    res.on("close", end);
    const fail2 = () => {
      if (ended)
        return;
      if (!res.headersSent)
        reply(res, 502, "LangSmith proxy upstream unavailable");
      else
        res.destroy();
      end();
    };
    void (async () => {
      const prepared = req.method === "POST" ? await prepareBody(req, path) : void 0;
      if (ended || res.destroyed)
        return;
      if (prepared) {
        headers["content-type"] = "application/json";
        headers["content-length"] = String(prepared.body.length);
        delete headers["transfer-encoding"];
        delete headers["content-encoding"];
      }
      if (draining)
        throw new RequestError(503, "Local proxy draining");
      const token = await tokens.get().catch(() => {
        throw new RequestError(503, loginGuidance(config));
      });
      if (ended || res.destroyed)
        return;
      if (draining)
        throw new RequestError(503, "Local proxy draining");
      headers.authorization = `Bearer ${token}`;
      if (native)
        headers["x-langsmith-anthropic-passthrough"] = native;
      outgoing = transport({
        protocol: "https:",
        hostname: upstreamOrigin.hostname,
        port: Number(upstreamOrigin.port || 443),
        path: prepared?.path ?? path,
        method: req.method,
        headers,
        agent: false,
        rejectUnauthorized: true
      }, (upstream) => {
        clearTimeout(headerTimer);
        incoming = upstream;
        if (ended) {
          upstream.destroy();
          return;
        }
        if ((upstream.statusCode ?? 502) >= 300 && (upstream.statusCode ?? 502) < 400) {
          fail2();
          return;
        }
        const responseHeaders = cleanHeaders(upstream.headers, false);
        delete responseHeaders["location"];
        delete responseHeaders["set-cookie"];
        res.writeHead(upstream.statusCode ?? 502, responseHeaders);
        upstream.on("error", fail2);
        upstream.on("aborted", fail2);
        upstream.pipe(res);
      });
      headerTimer = setTimeout(fail2, 12e4);
      outgoing.setTimeout(12e4, fail2);
      outgoing.on("error", fail2);
      if (prepared)
        outgoing.end(prepared.body);
      else
        req.pipe(outgoing);
    })().catch((error) => {
      if (ended)
        return;
      if (error instanceof RequestError) {
        reply(res, error.status, error.message);
        end();
      } else
        fail2();
    });
  });
  server.headersTimeout = 15e3;
  server.requestTimeout = 12e4;
  server.keepAliveTimeout = 5e3;
  server.maxConnections = 128;
  server.on("connect", (_req, socket) => socket.destroy());
  server.on("upgrade", (_req, socket) => socket.destroy());
  server.on("clientError", (_err, socket) => socket.destroy());
  let drainTimer;
  const close = () => {
    clearInterval(sweep);
    clearTimeout(drainTimer);
    server.close();
    server.closeAllConnections();
  };
  const drain = () => {
    if (draining)
      return;
    draining = true;
    credentialAbort.abort();
    server.closeIdleConnections();
    if (sessions.active === 0 && !tokens.loading) {
      close();
      return;
    }
    drainTimer = setTimeout(close, 3e4);
    drainTimer.unref();
  };
  const sweep = setInterval(() => {
    if (draining && sessions.active === 0 && !tokens.loading)
      close();
    else if (sessions.idle())
      drain();
  }, 1e3);
  sweep.unref();
  server.on("close", () => {
    credentialAbort.abort();
    clearInterval(sweep);
    clearTimeout(drainTimer);
  });
  return { server, sessions, drain };
}

// dist/proxy/options.js
var SetupError = class extends Error {
};
var COMMAND_GUIDANCE = "Use /langsmith-gateway:setup --scope global|project or /langsmith-gateway:disable --scope global|project within Claude Code. Add a --use-claude-subscription flag to pass Claude subscription auth directly to Anthropic.";
function parseSetupArgs(rest) {
  const usage = COMMAND_GUIDANCE;
  if (rest.some((arg) => typeof arg !== "string" || !arg || [...arg].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)))
    throw new SetupError(usage);
  const flags = /* @__PURE__ */ new Map();
  let useClaudeSubscription = false;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--use-claude-subscription") {
      if (useClaudeSubscription)
        throw new SetupError(usage);
      useClaudeSubscription = true;
      continue;
    }
    if (!["--scope", "--cli", "--port", "--profile", "--api-url", "--gateway-url"].includes(arg) || flags.has(arg) || !rest[i + 1] || rest[i + 1].startsWith("--"))
      throw new SetupError(usage);
    flags.set(arg, rest[++i]);
  }
  const scope = flags.get("--scope");
  if (scope !== "global" && scope !== "project")
    throw new SetupError(usage);
  const result = { scope, useClaudeSubscription };
  result.cli = flags.get("--cli");
  if (result.cli !== void 0 && !result.cli.startsWith("/"))
    throw new SetupError(usage);
  if (flags.has("--port")) {
    const port = flags.get("--port");
    if (!/^[0-9]{4,5}$/.test(port) || Number(port) < 1024 || Number(port) > 65535)
      throw new SetupError(usage);
    result.port = Number(port);
  }
  result.profile = flags.get("--profile");
  if (result.profile !== void 0 && !/^[a-zA-Z0-9_.-]{1,128}$/.test(result.profile))
    throw new SetupError("Invalid CLI profile name");
  if (flags.has("--api-url") || flags.has("--gateway-url")) {
    try {
      Object.assign(result, endpoints({ apiUrl: flags.get("--api-url"), gatewayUrl: flags.get("--gateway-url") }));
    } catch {
      throw new SetupError("Supply both --api-url and --gateway-url as HTTPS public DNS origins (ports 1-65535), without credentials, paths, query or fragment. No implicit production endpoint.");
    }
  }
  return result;
}
function parseDisableArgs(args) {
  if (args.length !== 2 || args[0] !== "--scope")
    throw new SetupError(COMMAND_GUIDANCE);
  return parseSetupArgs(args);
}
var STATUS_GUIDANCE = "Use /langsmith-gateway:status [--scope global|project] within Claude Code.";
function parseStatusArgs(args) {
  if (args.length === 0)
    return {};
  if (args.length === 2 && args[0] === "--scope" && (args[1] === "global" || args[1] === "project"))
    return { scope: args[1] };
  throw new SetupError(STATUS_GUIDANCE);
}
function parseGatewayCommand(prompt) {
  if (typeof prompt !== "string")
    return;
  const match = /^\/langsmith-gateway:(setup|disable|status)(?=\s|$)/.exec(prompt);
  if (!match)
    return;
  const rest = prompt.slice(match[0].length);
  if (/[\r\n\x00-\x1f'"`$;&|<>\\]/.test(rest))
    throw new SetupError(match[1] === "status" ? STATUS_GUIDANCE : COMMAND_GUIDANCE);
  const args = rest.trim() ? rest.trim().split(/ +/) : [];
  const command = match[1];
  if (command === "setup")
    parseSetupArgs(args);
  else if (command === "disable")
    parseDisableArgs(args);
  else
    parseStatusArgs(args);
  return { command, args };
}

// dist/proxy/settings.js
import { accessSync as accessSync2, constants as constants3, mkdirSync as mkdirSync3, rmdirSync } from "node:fs";
import { dirname as dirname3, isAbsolute as isAbsolute3, join as join5 } from "node:path";

// dist/proxy/setup.js
import { constants as constants2, accessSync, mkdirSync as mkdirSync2, realpathSync, statSync } from "node:fs";
import { isAbsolute as isAbsolute2, join as join3 } from "node:path";
import { randomBytes as randomBytes2 } from "node:crypto";
function validateCLI(cli) {
  if (!isAbsolute2(cli))
    throw new Error("CLI path must be absolute");
  cli = realpathSync(cli);
  const stat = statSync(cli);
  if (!stat.isFile() || stat.mode & 18 || stat.uid !== 0 && stat.uid !== process.getuid?.())
    throw new Error("Unsafe CLI executable");
  accessSync(cli, constants2.X_OK);
  return cli;
}
function createConfig(cli, profile, port, home = userHome(), urls = {}, useClaudeSubscription = false) {
  if (typeof useClaudeSubscription !== "boolean" || !isAbsolute2(cli) || !/^[a-zA-Z0-9_.-]{1,128}$/.test(profile) || !Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Invalid setup arguments");
  const selected = endpoints(urls);
  cli = validateCLI(cli);
  directories(home, true);
  const dir = configDir(home);
  try {
    mkdirSync2(dir, { mode: 448 });
  } catch (e) {
    if (e.code !== "EEXIST")
      throw e;
  }
  privatePath(dir, true);
  const config = {
    enabled: true,
    useClaudeSubscription,
    ...selected,
    cli,
    profile,
    port,
    secret: randomBytes2(32).toString("hex")
  };
  const path = join3(dir, "config.json");
  if (snapshot(path, true))
    throw new Error("Proxy config already exists");
  atomic(path, jsonText(config), void 0);
}

// dist/proxy/lifecycle.js
import http2 from "node:http";
import { connect } from "node:net";
import { spawn as spawn2 } from "node:child_process";

// dist/proxy/scopes.js
import { realpathSync as realpathSync2 } from "node:fs";
import { dirname as dirname2, join as join4, resolve } from "node:path";
function targetPaths(home, scope, cwd) {
  if (scope === "global")
    return {
      settings: join4(home, ".claude/settings.json"),
      config: join4(configDir(home), "config.json")
    };
  if (!cwd || !cwd.startsWith("/"))
    throw new SetupError("Project scope requires an absolute hook cwd.");
  const root = realpathSync2(cwd);
  if (resolve(cwd) !== root)
    throw new SetupError("Project path must be canonical and not a symlink.");
  directory(root);
  const settings2 = join4(root, ".claude/settings.local.json");
  return {
    settings: settings2,
    config: join4(configDir(home), "config.json")
  };
}
var BASE = "ANTHROPIC_BASE_URL";
var HEADERS = "ANTHROPIC_CUSTOM_HEADERS";
var proxyKeyLine = (config) => `X-LangSmith-Proxy-Key: ${config.secret}`;
function routingSnapshot(path) {
  try {
    const root = dirname2(dirname2(path));
    if (realpathSync2(root) !== root)
      throw new Error("Noncanonical routing target");
    directory(root);
    directory(dirname2(path));
    return snapshot(path);
  } catch (error) {
    if (error.code !== "ENOENT")
      throw error;
  }
}
function unchangedRouting(path, saved) {
  if (JSON.stringify(routingSnapshot(path)) !== JSON.stringify(saved))
    throw new Error("Settings changed concurrently; retry");
}
function routingEnv(saved) {
  const value = saved ? JSON.parse(saved.text) : {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid settings");
  const env = value.env === void 0 ? {} : value.env;
  if (!env || typeof env !== "object" || Array.isArray(env))
    throw new Error("Invalid settings");
  return env;
}
function matchesRouting(env, config) {
  const headers = env[HEADERS];
  return env[BASE] === `http://127.0.0.1:${config.port}` && typeof headers === "string" && headers.split("\n").filter((line) => /^\s*x-langsmith-proxy-key\s*:/i.test(line)).length === 1 && headers.split("\n").includes(proxyKeyLine(config));
}
function routingTargets(home, cwd, config) {
  const paths = /* @__PURE__ */ new Set([
    targetPaths(home, "global", cwd).settings,
    ...config?.settingsTargets ?? []
  ]);
  if (cwd)
    paths.add(targetPaths(home, "project", cwd).settings);
  return [...paths].map((path) => ({ path, saved: routingSnapshot(path) }));
}
function configuredScope(home, cwd, config) {
  let env = routingEnv(routingSnapshot(targetPaths(home, "global", "").settings));
  if (cwd) {
    const local = targetPaths(home, "project", cwd).settings;
    env = {
      ...env,
      ...routingEnv(routingSnapshot(join4(dirname2(local), "settings.json"))),
      ...routingEnv(routingSnapshot(local))
    };
  }
  return matchesRouting(env, config);
}

// dist/proxy/lifecycle.js
function control(config, method, path, timeoutMs = 500) {
  return new Promise((resolve2, reject) => {
    const req = http2.request({
      hostname: "127.0.0.1",
      port: config.port,
      method,
      path,
      agent: false,
      headers: { [KEY_HEADER]: config.secret, "content-length": "0" }
    }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
        if (data.length > 1024)
          req.destroy();
      });
      res.on("error", () => reject(new Error("Local proxy unavailable")));
      res.on("end", () => res.statusCode === 200 || res.statusCode === 204 ? resolve2(data) : reject(new Error("Local proxy unavailable")));
    });
    const timer = setTimeout(() => req.destroy(new Error("Local proxy unavailable")), timeoutMs);
    req.on("close", () => clearTimeout(timer));
    req.on("error", () => reject(new Error("Local proxy unavailable")));
    req.end();
  });
}
async function healthy(config) {
  try {
    return await control(config, "GET", "/_langsmith/health") === identity(config);
  } catch {
    return false;
  }
}
async function ensure(config, entry2) {
  if (await healthy(config))
    return;
  const child = spawn2(process.execPath, [entry2, "daemon"], {
    detached: true,
    stdio: "ignore",
    cwd: userHome(),
    env: cliEnvironment()
  });
  child.on("error", () => {
  });
  child.unref();
  const deadline = Date.now() + 4e3;
  do {
    if (await healthy(config))
      return;
    await new Promise((resolve2) => setTimeout(resolve2, 100));
  } while (Date.now() < deadline);
  throw new Error("Local proxy unavailable");
}
async function gatewayHook(event, session, entry2, home = userHome(), cwd) {
  const config = loadConfig(home);
  if (!config)
    return;
  if (!["SessionStart", "UserPromptSubmit", "SessionEnd"].includes(String(event)) || typeof session !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(session))
    return;
  if (event === "SessionEnd") {
    await control(config, "DELETE", `/_langsmith/sessions/${session}`);
  } else {
    if (!configuredScope(home, cwd, config))
      return;
    await ensure(config, entry2);
    await control(config, "PUT", `/_langsmith/sessions/${session}`);
  }
}
async function waitForStopped(config, timeoutMs = 36e3) {
  const deadline = Date.now() + timeoutMs;
  do {
    const stopped = await new Promise((resolve2) => {
      const socket = connect({ host: "127.0.0.1", port: config.port });
      const finish = (free) => {
        socket.destroy();
        resolve2(free);
      };
      socket.once("connect", () => finish(false));
      socket.once("error", (error) => finish(error.code === "ECONNREFUSED"));
      socket.setTimeout(500, () => finish(false));
    });
    if (stopped)
      return;
    await new Promise((resolve2) => setTimeout(resolve2, 100));
  } while (Date.now() < deadline);
  throw new Error("Old proxy still draining or local port occupied");
}

// dist/proxy/settings.js
var fail = (message) => {
  throw new SetupError(message);
};
var AUTH = [
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_API_KEY",
  "CLAUDE_CODE_USE_BEDROCK",
  "CLAUDE_CODE_USE_VERTEX",
  "CLAUDE_CODE_USE_FOUNDRY",
  "ANTHROPIC_FOUNDRY_API_KEY",
  "ANTHROPIC_FOUNDRY_BASE_URL",
  "CLAUDE_CODE_API_KEY_HELPER"
];
function object(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail("Expected a JSON object; settings were not replaced.");
  return value;
}
function text(value) {
  if (value === void 0)
    return;
  if (typeof value !== "string")
    return fail("Transport settings must be strings.");
  return value;
}
function lines(value) {
  return value === void 0 ? [] : value.split("\n");
}
function withProxyKey(headers, config) {
  return (headers ? headers + "\n" : "") + `X-LangSmith-Proxy-Key: ${config.secret}`;
}
function keyLine(line) {
  return /^\s*x-langsmith-proxy-key\s*:/i.test(line);
}
function validateHeaders(value) {
  for (const line of lines(value)) {
    if (!line)
      continue;
    const match = /^([!#$%&'*+.^_`|~0-9A-Za-z-]+):[^\r\n]*$/.exec(line);
    if (!match || /^(authorization|proxy-authorization|x-api-key|x-langsmith-anthropic-passthrough)$/i.test(match[1]))
      return fail("Conflicting or malformed custom headers; review them privately before setup.");
    if (/^host$/i.test(match[1]))
      fail("Custom Host headers are unsupported by persistent setup. Remove the Host header explicitly so the client uses the loopback target; review headers privately.");
  }
}
function settings(s) {
  const value = s ? object(JSON.parse(s.text)) : {};
  const env = value.env === void 0 ? {} : object(value.env);
  return { value, env };
}
function supportedHome(home, env) {
  if (env.CLAUDE_CONFIG_DIR && env.CLAUDE_CONFIG_DIR !== join5(home, ".claude"))
    fail("Custom CLAUDE_CONFIG_DIR is unsupported. Restart Claude Code with its default configuration directory, then use /langsmith-gateway:setup or /langsmith-gateway:disable.");
}
function lock(home) {
  directories(home, true);
  const dir = configDir(home);
  try {
    mkdirSync3(dir, { mode: 448 });
  } catch (e) {
    if (e.code !== "EEXIST")
      throw e;
  }
  privatePath(dir, true);
  const path = join5(dir, "settings.lock");
  try {
    mkdirSync3(path, { mode: 448 });
  } catch {
    return fail("Another setup/disable is running or left settings.lock. Stop it before removing that lock directory and retrying.");
  }
  return () => rmdirSync(path);
}
function discoverCLI(env) {
  for (const dir of (env.PATH ?? "").split(":")) {
    if (!isAbsolute3(dir))
      continue;
    const path = join5(dir, "langsmith");
    try {
      accessSync2(path, constants3.X_OK);
      return path;
    } catch {
    }
  }
  return fail("LangSmith CLI not found. Install it using the README, complete terminal login with your selected profile and API URL (review the saved OAuth issuer), then retry /langsmith-gateway:setup.");
}
async function enable(entry2, args, env = process.env, home = userHome(), cwd = process.cwd()) {
  const requested = parseSetupArgs(args);
  supportedHome(home, env);
  loadConfig(home, true);
  const unlock = lock(home);
  try {
    const p = targetPaths(home, requested.scope, cwd);
    directory(dirname3(p.settings), true);
    const beforeSettings = snapshot(p.settings);
    const { value, env: savedEnv } = settings(beforeSettings);
    if (value.disableAllHooks === true)
      fail("Persistent setup requires hooks to restart the daemon. Set disableAllHooks to false or remove it explicitly from user settings before retrying; it will not be overwritten.");
    for (const key of AUTH) {
      if (savedEnv[key] !== void 0 || env[key] !== void 0)
        fail("Conflicting provider/auth environment setting. Remove it explicitly before setup; client auth overrides are not supported by this setup.");
    }
    if (value.apiKeyHelper !== void 0)
      fail("Conflicting apiKeyHelper. Remove it explicitly before setup; it will not be overwritten.");
    const base = text(savedEnv[BASE]), headers = text(savedEnv[HEADERS]);
    validateHeaders(headers);
    let config = loadConfig(home, true);
    const initiallyEnabled = loadConfig(home) !== void 0;
    const targets = routingTargets(home, cwd, config);
    const active = config ? targets.filter((item) => matchesRouting(routingEnv(item.saved), config)) : [];
    const settingsTargets = [.../* @__PURE__ */ new Set([...active.map((item) => item.path), p.settings])];
    if (settingsTargets.length > 128)
      fail("Too many active routing targets; disable unused scopes before setup.");
    const prior = !!config && matchesRouting(savedEnv, config);
    const port = requested.port ?? config?.port ?? 43127;
    const selected = requested.apiUrl === void 0 ? endpoints(config ?? {}) : endpoints(requested);
    const useClaudeSubscription = requested.useClaudeSubscription;
    const next = config ? {
      ...config,
      enabled: true,
      ...selected,
      useClaudeSubscription,
      cli: requested.cli === void 0 ? config.cli : validateCLI(requested.cli),
      profile: requested.profile ?? config.profile,
      port
    } : void 0;
    const changing = config && next && (config.cli !== next.cli || config.profile !== next.profile || config.port !== next.port || endpoints(config).apiUrl !== next.apiUrl || endpoints(config).gatewayUrl !== next.gatewayUrl);
    if (changing && (initiallyEnabled || active.length))
      fail("Existing pinned CLI/profile/port or endpoints differ. Run /langsmith-gateway:disable first for every active scope (use --scope global|project), stop all gateway sessions and CLI writers, then retry /langsmith-gateway:setup with the explicit options. Do not edit the shared config while other scopes are active.");
    const modeChanged = !!config && config.useClaudeSubscription !== useClaudeSubscription;
    const switching = initiallyEnabled && modeChanged;
    if (modeChanged && active.some((item) => item.path !== p.settings))
      fail("Subscription forwarding is shared. Disable every other active scope first, then retry setup for this scope; other scopes will not be silently switched.");
    if (switching && !prior)
      fail("Only the sole active configured target can switch subscription forwarding in place. Disable existing routing first, then retry setup.");
    const target = `http://127.0.0.1:${port}`;
    if (base !== void 0 && base !== target || env[BASE] !== void 0 && env[BASE] !== target)
      fail("Conflicting ANTHROPIC_BASE_URL. Remove it explicitly before setup; it will not be overwritten.");
    const retainedHeaders = !!config && !prior && env[HEADERS] === withProxyKey(headers, config);
    if (env[HEADERS] !== void 0 && env[HEADERS] !== headers && !retainedHeaders && !(config && active.some(({ saved }) => routingEnv(saved)[HEADERS] === env[HEADERS])))
      fail("Inherited custom headers differ from the selected scope settings and do not match trusted local transport. Resolve the override privately before setup; it will not be copied into settings.");
    const expectedKey = config ? `X-LangSmith-Proxy-Key: ${config.secret}` : void 0;
    const keys = lines(headers).filter(keyLine);
    if (keys.length && (!config || keys.length !== 1 || keys[0] !== expectedKey))
      fail("Conflicting local proxy header; no different header will be replaced.");
    if (switching && (base !== target || keys.length !== 1))
      fail("Configured transport settings changed. Review them privately or disable this scope before switching subscription forwarding.");
    if (!config) {
      createConfig(requested.cli ?? discoverCLI(env), requested.profile ?? "claude-gateway", port, home, selected, useClaudeSubscription);
      config = loadConfig(home);
    }
    const effective = next ?? config;
    if (validateCLI(effective.cli) !== effective.cli)
      fail("Pinned CLI path changed; resolve privately before retrying.");
    let configSnapshot = snapshot(p.config, true);
    if (switching) {
      unchanged(p.settings, beforeSettings);
      for (const item of targets)
        unchangedRouting(item.path, item.saved);
      atomic(p.config, jsonText({ ...next, enabled: false }), configSnapshot);
      configSnapshot = snapshot(p.config, true);
    }
    if ((!initiallyEnabled || switching) && next) {
      await waitForStopped(config).catch(() => fail("Old proxy still draining or local port occupied. Config remains disabled; routing settings and requested mode are retained. Wait at least 35 seconds and retry the same setup options; resolve port conflicts privately without killing an unknown listener."));
      unchanged(p.config, configSnapshot, true);
      unchanged(p.settings, beforeSettings);
      for (const item of targets)
        unchangedRouting(item.path, item.saved);
      config = next;
    }
    if (!loadConfig(home))
      atomic(p.config, jsonText(config), configSnapshot);
    const currentConfig = snapshot(p.config, true);
    try {
      await ensure(config, entry2);
      directories(home);
      privatePath(configDir(home), true);
      unchanged(p.settings, beforeSettings);
      unchanged(p.config, currentConfig, true);
      for (const item of targets)
        unchangedRouting(item.path, item.saved);
      directory(dirname3(p.settings));
      const afterHeaders = keys.length ? headers : withProxyKey(headers, config);
      savedEnv[BASE] = target;
      savedEnv[HEADERS] = afterHeaders;
      value.env = savedEnv;
      const settingsChanged = base !== target || headers !== afterHeaders;
      transaction([
        {
          path: p.config,
          text: jsonText({
            ...config,
            settingsTargets
          }),
          prior: currentConfig
        },
        ...settingsChanged ? [{ path: p.settings, text: jsonText(value), prior: beforeSettings }] : []
      ]);
      return {
        settingsChanged,
        useClaudeSubscription: config.useClaudeSubscription,
        modeChanged
      };
    } catch (error) {
      if (!initiallyEnabled || switching) {
        const rolledBack = snapshot(p.config, true);
        if (rolledBack?.text !== currentConfig?.text)
          throw error;
        atomic(p.config, jsonText({ ...config, enabled: false }), rolledBack);
      }
      if (switching)
        fail("Gateway mode switch did not complete. Config remains disabled with the requested mode; routing settings are retained. Retry the same setup options after resolving local daemon readiness privately.");
      throw error;
    }
  } finally {
    unlock();
  }
}
function modeSummary(useClaudeSubscription, modeChanged) {
  return (useClaudeSubscription ? "Claude subscription credential forwarding enabled (gateway/provider eligibility applies). " : "OAuth-only gateway auth; native credentials are not forwarded. Gateway provider keys and provider billing apply. ") + (modeChanged ? "Daemon mode changed after draining; routing settings retained, with brief local downtime. " : "");
}
function disable(args, env = process.env, home = userHome(), cwd = process.cwd()) {
  const requested = parseDisableArgs(args);
  supportedHome(home, env);
  if (!loadConfig(home, true))
    return;
  const unlock = lock(home);
  try {
    const config = loadConfig(home, true);
    if (!config)
      return;
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
    if (current !== void 0) {
      const remaining = lines(current).filter((line) => line !== proxyKeyLine(config));
      if (remaining.length !== lines(current).length) {
        routingRemoved = true;
        if (remaining.length)
          savedEnv[HEADERS] = remaining.join("\n");
        else
          delete savedEnv[HEADERS];
      }
    }
    if (routingRemoved && Object.keys(savedEnv).length === 0)
      delete value.env;
    else if (value.env !== void 0)
      value.env = savedEnv;
    const remainingTargets = targets.filter((item) => item.path !== p.settings && matchesRouting(routingEnv(item.saved), config));
    if (remainingTargets.length > 128)
      fail("Too many active routing targets; review the private target index before disable.");
    const writes = [];
    if (before && JSON.stringify(value) !== JSON.stringify(JSON.parse(before.text)))
      writes.push({ path: p.settings, text: jsonText(value), prior: before });
    writes.push({
      path: p.config,
      text: jsonText({
        ...config,
        enabled: loadConfig(home) !== void 0 && remainingTargets.length > 0,
        settingsTargets: remainingTargets.map((item) => item.path)
      }),
      prior: configSnapshot
    });
    for (const item of targets)
      unchangedRouting(item.path, item.saved);
    transaction(writes);
  } finally {
    unlock();
  }
}
function routingStatus(paths, config) {
  const current = routingSnapshot(paths.settings);
  const env = routingEnv(current);
  const prefix = `settings ${current ? "present" : "missing"}; `;
  if (!config)
    return prefix + "proxy setup is missing";
  if (matchesRouting(env, config))
    return prefix + "configured to use the local gateway proxy";
  const headers = env[HEADERS];
  const keys = typeof headers === "string" ? lines(headers).filter(keyLine) : [];
  if (env[BASE] === void 0 || env[BASE] === "")
    return prefix + (keys.length ? "gateway routing is incomplete; local proxy authentication header is present but Claude\u2019s saved API address is missing" : "gateway routing is not configured in this settings file");
  if (env[BASE] !== `http://127.0.0.1:${config.port}`)
    return prefix + "Claude\u2019s saved API address differs from this proxy\u2019s address";
  return prefix + (keys.length === 0 ? "local proxy authentication header is missing" : "local proxy authentication header does not match");
}

// dist/proxy/status.js
import { join as join6 } from "node:path";
var STATUS_ERROR = "Gateway status unavailable; review config, settings, permissions and canonical project path privately. No changes made.";
async function gatewayStatus(args, env, home, cwd) {
  const { scope } = parseStatusArgs(args);
  try {
    if (env.CLAUDE_CONFIG_DIR && env.CLAUDE_CONFIG_DIR !== join6(home, ".claude"))
      throw new Error("Unsupported configuration directory");
    const scopes = scope ? [scope] : ["global", "project"];
    const targets = scopes.map((selected) => ({
      selected,
      paths: targetPaths(home, selected, cwd)
    }));
    const { state, config } = configStatus(home);
    const routes = targets.map(({ selected, paths }) => `  ${selected} ${JSON.stringify(paths.settings)}: ${routingStatus(paths, config)}.`);
    const shared = config ? `${state}; useClaudeSubscription ${config.useClaudeSubscription ? "on" : "off"}; profile ${JSON.stringify(config.profile)}; API ${config.apiUrl}; gateway ${config.gatewayUrl}.` : "not configured.";
    const daemon = !config ? "not checked (proxy setup is missing)" : await healthy(config) ? `matching listener reachable${state === "disabled" ? " (saved config disabled; may be awaiting drain)" : ""}` : "not reachable or incompatible";
    return [
      "Gateway status (read-only)",
      `Selected routing targets: ${scope ?? "global + current project"}`,
      ...routes,
      `Shared proxy configuration (applies to enabled scopes): ${shared}`,
      `Shared daemon: ${daemon}.`,
      "This shows saved settings. Your current Claude session may still be using earlier settings. Configured forwarding mode does not verify actual Anthropic usage, authentication or subscription validity. Other projects may use the shared daemon."
    ].join("\n");
  } catch (error) {
    throw new SetupError(error instanceof ConfigError ? error.message : STATUS_ERROR);
  }
}

// dist/proxy/commands.js
async function handleGatewayInput(input, entry2, env = process.env, home = userHome(), output = (value) => process.stdout.write(JSON.stringify(value) + "\n")) {
  if (input.hook_event_name === "UserPromptSubmit" && typeof input.prompt === "string" && /^\/langsmith-gateway:(setup|disable|status)(?=\s|$)/.test(input.prompt)) {
    let reason;
    try {
      const command = parseGatewayCommand(input.prompt);
      if (!command)
        return;
      if (command.command === "setup") {
        const { settingsChanged, useClaudeSubscription, modeChanged } = await enable(entry2, command.args, env, home, input.cwd ?? "");
        reason = (settingsChanged ? "Gateway settings saved for the selected scope; " : "Gateway settings already configured for the selected scope; ") + modeSummary(useClaudeSubscription, modeChanged) + "local daemon healthy. Authentication is checked on the first model request, not setup.";
      } else if (command.command === "status") {
        reason = await gatewayStatus(command.args, env, home, input.cwd ?? "");
      } else {
        disable(command.args, env, home, input.cwd ?? "");
        reason = "Gateway disabled for the selected scope; matching gateway routing settings removed (no previous values restored) and later edits preserved. Restart affected Claude sessions to stop using the proxy. Other known matching scopes remain active. After the last known active scope is disabled, the daemon drains (up to 5 seconds to notice, then up to 30 seconds for active work).";
      }
    } catch (error) {
      reason = error instanceof SetupError || error instanceof ConfigError ? error.message : "Gateway command failed; check private config, CLI installation, permissions, links, concurrent edits and port conflicts privately. " + COMMAND_GUIDANCE;
    }
    try {
      output({ decision: "block", reason });
    } catch {
      process.exitCode = 2;
    }
    return;
  }
  await gatewayHook(input.hook_event_name, input.session_id, entry2, home, input.cwd);
}

// dist/utils/stdin.js
function readStdin() {
  return new Promise((resolve2, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => data += chunk);
    process.stdin.on("end", () => {
      try {
        resolve2(JSON.parse(data));
      } catch (err) {
        reject(new Error(`Failed to parse hook input: ${err}`));
      }
    });
    process.stdin.on("error", reject);
  });
}

// dist/hooks/gateway.js
var entry = fileURLToPath(import.meta.url);
async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command !== void 0 && (command !== "daemon" || args.length !== 0))
    throw new SetupError(COMMAND_GUIDANCE);
  if (command === void 0) {
    const input = await readStdin();
    await handleGatewayInput(input, entry);
    return;
  }
  const config = loadConfig();
  if (!config)
    return;
  if (command === "daemon") {
    const { server, drain } = createProxy(config);
    const watch = setInterval(() => {
      try {
        const current = loadConfig();
        if (!current || identity(current) !== identity(config))
          drain();
      } catch {
        drain();
      }
    }, 5e3);
    watch.unref();
    server.on("close", () => clearInterval(watch));
    process.on("SIGTERM", drain);
    process.on("SIGINT", drain);
    server.once("error", () => process.exit(1));
    server.listen({ host: "127.0.0.1", port: config.port, exclusive: true });
  }
}
void main().catch((error) => {
  process.stderr.write(error instanceof SetupError || error instanceof ConfigError ? error.message + "\n" : "Experimental LangSmith proxy unavailable; check private config, CLI executable, settings permissions/symlinks, and local port conflicts. No sensitive error details are printed. " + COMMAND_GUIDANCE + "\n");
  if (process.argv.length > 2)
    process.exitCode = 1;
});

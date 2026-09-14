#!/usr/bin/env node

// dist/hooks/gateway.js
import { fileURLToPath } from "node:url";

// dist/proxy/config.js
import { constants as constants2, openSync as openSync2, closeSync as closeSync2, fstatSync as fstatSync2, readFileSync as readFileSync2, lstatSync as lstatSync2 } from "node:fs";
import { isAbsolute, join as join2 } from "node:path";
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
  const dir = configDir(home);
  try {
    directories(home);
    privatePath(dir, true);
  } catch (e) {
    if (e.code === "ENOENT")
      return;
    throw e;
  }
  const path = join2(dir, "config.json");
  let fd;
  try {
    fd = openSync2(path, constants2.O_RDONLY | constants2.O_NOFOLLOW | constants2.O_NONBLOCK);
  } catch (e) {
    if (e.code === "ENOENT")
      return;
    throw e;
  }
  let c;
  try {
    const s = fstatSync2(fd);
    if (!s.isFile() || s.nlink !== 1 || s.uid !== process.getuid?.() || s.mode & 63 || s.size > 8192)
      throw new Error("Unsafe proxy configuration");
    c = JSON.parse(readFileSync2(fd, "utf8"));
  } finally {
    closeSync2(fd);
  }
  if (c && c.enabled === false) {
    if (!includeDisabled || Object.keys(c).length === 1)
      return;
    c = { ...c, enabled: true };
  }
  if (!c || c.enabled !== true || c.useClaudeSubscription !== void 0 && typeof c.useClaudeSubscription !== "boolean" || typeof c.cli !== "string" || !isAbsolute(c.cli) || typeof c.profile !== "string" || !/^[a-zA-Z0-9_.-]{1,128}$/.test(c.profile) || !Number.isInteger(c.port) || c.port < 1024 || c.port > 65535 || typeof c.secret !== "string" || !/^[a-f0-9]{64}$/.test(c.secret) || Object.keys(c).some((k) => ![
    "enabled",
    "cli",
    "profile",
    "port",
    "secret",
    "apiUrl",
    "gatewayUrl",
    "useClaudeSubscription"
  ].includes(k)))
    throw new Error("Invalid proxy configuration");
  return { ...c, ...endpoints(c), useClaudeSubscription: c.useClaudeSubscription ?? true };
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
  return `LangSmith authentication unavailable. Stop gateway sessions and other CLI writers, then log in in a separate terminal using your pinned CLI executable with: --profile ${config.profile} --api-url ${endpoints(config).apiUrl} auth login. Use a dedicated profile matching the selected API: --api-url does not change an existing saved OAuth issuer. Review that issuer privately before login/refresh. Then restart Claude with the plugin enabled and retry the request. Hooks never open a browser.
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
var COMMAND_GUIDANCE = "Use /langsmith-gateway:setup --scope global|project or /langsmith-gateway:disable --scope global|project within Claude Code.";
function parseEnableArgs(args) {
  const usage = COMMAND_GUIDANCE;
  if (args[0] !== "--yes")
    throw new SetupError("Explicit invocation required. " + usage);
  return parseSetupArgs(args.slice(1));
}
function parseSetupArgs(rest) {
  const usage = COMMAND_GUIDANCE;
  if (rest.some((arg) => typeof arg !== "string" || !arg || [...arg].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)))
    throw new SetupError(usage);
  const positional = [];
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
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    if (!["--scope", "--cli", "--port", "--profile", "--api-url", "--gateway-url"].includes(arg) || flags.has(arg) || !rest[i + 1] || rest[i + 1].startsWith("--"))
      throw new SetupError(usage);
    flags.set(arg, rest[++i]);
  }
  if (![0, 3].includes(positional.length) || positional.length && flags.has("--profile"))
    throw new SetupError(usage);
  const scope = flags.get("--scope");
  if (scope !== "global" && scope !== "project")
    throw new SetupError(usage);
  const result = { scope, useClaudeSubscription };
  if (positional.length && (flags.has("--cli") || flags.has("--port")))
    throw new SetupError(usage);
  result.cli = flags.get("--cli");
  if (result.cli !== void 0 && !result.cli.startsWith("/"))
    throw new SetupError(usage);
  if (flags.has("--port")) {
    const port = flags.get("--port");
    if (!/^[0-9]{4,5}$/.test(port) || Number(port) < 1024 || Number(port) > 65535)
      throw new SetupError(usage);
    result.port = Number(port);
  }
  if (positional.length) {
    [result.cli, result.profile] = positional;
    if (!/^[0-9]{4,5}$/.test(positional[2]) || !result.cli.startsWith("/"))
      throw new SetupError(usage);
    result.port = Number(positional[2]);
    if (!Number.isInteger(result.port) || result.port < 1024 || result.port > 65535)
      throw new SetupError("Local port must be 1024-65535");
  } else
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
  if (args.length !== 3 || args[0] !== "--yes" || args[1] !== "--scope")
    throw new SetupError(COMMAND_GUIDANCE);
  return parseSetupArgs(args.slice(1));
}
function parseGatewayCommand(prompt) {
  if (typeof prompt !== "string")
    return;
  const match = /^\/langsmith-gateway:(setup|disable)(?=\s|$)/.exec(prompt);
  if (!match)
    return;
  const rest = prompt.slice(match[0].length);
  if (/[\r\n\x00-\x1f'"`$;&|<>\\]/.test(rest))
    throw new SetupError(COMMAND_GUIDANCE);
  const args = rest.trim() ? rest.trim().split(/ +/) : [];
  const command = match[1];
  if (command === "setup")
    parseSetupArgs(args);
  else
    parseDisableArgs(["--yes", ...args]);
  return { command, args };
}

// dist/proxy/settings.js
import { accessSync as accessSync2, constants as constants4, mkdirSync as mkdirSync3, rmdirSync } from "node:fs";
import { dirname as dirname3, isAbsolute as isAbsolute3, join as join5 } from "node:path";

// dist/proxy/setup.js
import { constants as constants3, accessSync, mkdirSync as mkdirSync2, realpathSync, statSync } from "node:fs";
import { isAbsolute as isAbsolute2, join as join3 } from "node:path";
import { randomBytes as randomBytes2 } from "node:crypto";
function validateCLI(cli) {
  if (!isAbsolute2(cli))
    throw new Error("CLI path must be absolute");
  cli = realpathSync(cli);
  const stat = statSync(cli);
  if (!stat.isFile() || stat.mode & 18 || stat.uid !== 0 && stat.uid !== process.getuid?.())
    throw new Error("Unsafe CLI executable");
  accessSync(cli, constants3.X_OK);
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
import { readdirSync, realpathSync as realpathSync2 } from "node:fs";
import { dirname as dirname2, join as join4, resolve } from "node:path";
import { createHash as createHash2 } from "node:crypto";
import { spawnSync } from "node:child_process";
function targetPaths(home, scope, cwd) {
  if (scope === "global")
    return {
      settings: join4(home, ".claude/settings.json"),
      config: join4(configDir(home), "config.json"),
      receipt: join4(configDir(home), "settings-ownership.json")
    };
  if (!cwd || !cwd.startsWith("/"))
    throw new SetupError("Project scope requires an absolute hook cwd.");
  const root = realpathSync2(cwd);
  if (resolve(cwd) !== root)
    throw new SetupError("Project path must be canonical and not a symlink.");
  directory(root);
  const settings2 = join4(root, ".claude/settings.local.json");
  const id = createHash2("sha256").update(settings2).digest("hex");
  return {
    settings: settings2,
    config: join4(configDir(home), "config.json"),
    receipt: join4(configDir(home), `settings-ownership-${id}.json`)
  };
}
function secretGitCheck(path) {
  const cwd = dirname2(path);
  const run = (args) => spawnSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    timeout: 5e3,
    env: {
      PATH: process.env.PATH,
      HOME: "/dev/null",
      LC_ALL: "C",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_OPTIONAL_LOCKS: "0"
    }
  });
  const repo = run(["rev-parse", "--is-inside-work-tree"]);
  if (repo.error)
    throw new SetupError("Cannot verify secrets are outside version control; git is required.");
  if (repo.status !== 0) {
    if (repo.status === 128 && repo.stderr.includes("not a git repository"))
      return;
    throw new SetupError("Cannot verify secret destination repository safety.");
  }
  const tracked = run(["ls-files", "--cached", "--", path]);
  const ignored = run(["check-ignore", "--no-index", "--quiet", "--", path]);
  if (tracked.status !== 0 || tracked.stdout.trim() || ignored.status !== 0)
    throw new SetupError(`Secret destination ${JSON.stringify(path)} is tracked or not git-ignored. Untrack and privately ignore it before setup; nothing was written there.`);
}
function receiptSnapshots(home) {
  return readdirSync(configDir(home)).filter((name) => /^settings-ownership(?:-[a-f0-9]{64})?\.json$/.test(name)).map((name) => ({
    path: join4(configDir(home), name),
    saved: snapshot(join4(configDir(home), name), true)
  })).filter(({ saved }) => JSON.parse(saved.text) !== null);
}
function authorizedScope(home, cwd, config) {
  const valid = (saved2) => {
    if (!saved2)
      return false;
    const r = JSON.parse(saved2.text);
    return r?.version === 1 && r.identity === createHash2("sha256").update(JSON.stringify([config.cli, config.profile, config.port, config.secret])).digest("hex") && typeof r.afterHeaders === "string" && r.afterBase === `http://127.0.0.1:${config.port}`;
  };
  const global = snapshot(join4(configDir(home), "settings-ownership.json"), true);
  if (valid(global))
    return true;
  if (!cwd)
    return false;
  const p = targetPaths(home, "project", cwd);
  const saved = snapshot(p.receipt, true);
  return valid(saved);
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
  if (!config || !authorizedScope(home, cwd, config))
    return;
  if (!["SessionStart", "UserPromptSubmit", "SessionEnd"].includes(String(event)) || typeof session !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(session))
    return;
  if (event === "SessionEnd") {
    await control(config, "DELETE", `/_langsmith/sessions/${session}`);
  } else {
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
import { createHash as createHash3 } from "node:crypto";
var ownershipIdentity = (config) => createHash3("sha256").update(JSON.stringify([config.cli, config.profile, config.port, config.secret])).digest("hex");
var fail = (message) => {
  throw new SetupError(message);
};
var BASE = "ANTHROPIC_BASE_URL";
var HEADERS = "ANTHROPIC_CUSTOM_HEADERS";
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
function receipt(s, config) {
  if (!s)
    return;
  const value = JSON.parse(s.text);
  if (value === null)
    return;
  const r = object(value);
  if (r.version !== 1 || r.identity !== ownershipIdentity(config) || !(r.beforeBase === null || typeof r.beforeBase === "string") || !(r.beforeHeaders === null || typeof r.beforeHeaders === "string") || typeof r.afterBase !== "string" || typeof r.afterHeaders !== "string" || typeof r.envExisted !== "boolean")
    return fail("Setup recovery record does not match the private config; resolve privately, do not overwrite it.");
  return r;
}
function assign(env, key, value) {
  if (value === null)
    delete env[key];
  else
    env[key] = value;
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
      accessSync2(path, constants4.X_OK);
      return path;
    } catch {
    }
  }
  return fail("LangSmith CLI not found. Install it using the README, complete terminal login with your selected profile and API URL (review the saved OAuth issuer), then retry /langsmith-gateway:setup.");
}
function setupPlan(args, env = process.env, home = userHome()) {
  const requested = parseSetupArgs(args);
  supportedHome(home, env);
  const config = loadConfig(home, true);
  return {
    ...endpoints(requested.apiUrl === void 0 ? config ?? {} : requested),
    useClaudeSubscription: requested.useClaudeSubscription,
    profile: requested.profile ?? config?.profile ?? "claude-gateway",
    port: requested.port ?? config?.port ?? 43127,
    status: config ? loadConfig(home) ? "enabled" : "disabled" : "missing"
  };
}
async function enable(entry2, args, env = process.env, home = userHome(), cwd = process.cwd()) {
  const requested = parseEnableArgs(args);
  supportedHome(home, env);
  const unlock = lock(home);
  try {
    const p = targetPaths(home, requested.scope, cwd);
    directory(dirname3(p.settings), true);
    secretGitCheck(p.settings);
    secretGitCheck(p.config);
    secretGitCheck(p.receipt);
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
    const oldReceipt = snapshot(p.receipt, true);
    if (!config && oldReceipt && JSON.parse(oldReceipt.text) !== null)
      fail("Private config missing but a recovery record exists; restore the config privately before retrying.");
    const initiallyEnabled = loadConfig(home) !== void 0;
    const allReceipts = receiptSnapshots(home);
    if (!config && allReceipts.length)
      fail("Private config missing but recovery records exist; restore privately.");
    if (config)
      for (const item of allReceipts)
        receipt(item.saved, config);
    const prior = config ? receipt(oldReceipt, config) : void 0;
    const port = requested.port ?? config?.port ?? 43127;
    const selected = requested.apiUrl === void 0 ? endpoints(config ?? {}) : endpoints(requested);
    const useClaudeSubscription = requested.useClaudeSubscription;
    const next = config ? {
      ...config,
      ...selected,
      useClaudeSubscription,
      cli: requested.cli === void 0 ? config.cli : validateCLI(requested.cli),
      profile: requested.profile ?? config.profile,
      port
    } : void 0;
    const changing = config && next && (config.cli !== next.cli || config.profile !== next.profile || config.port !== next.port || endpoints(config).apiUrl !== next.apiUrl || endpoints(config).gatewayUrl !== next.gatewayUrl);
    if (changing && (initiallyEnabled || allReceipts.length))
      fail("Existing pinned CLI/profile/port or endpoints differ. Run /langsmith-gateway:disable first for every active scope (use --scope global|project), stop all gateway sessions and CLI writers, then retry /langsmith-gateway:setup with the explicit options. Do not edit config or delete ownership records.");
    const modeChanged = !!config && config.useClaudeSubscription !== useClaudeSubscription;
    const switching = initiallyEnabled && modeChanged;
    if (modeChanged && allReceipts.some((item) => item.path !== p.receipt))
      fail("Subscription forwarding is shared. Disable every other active scope first, then retry setup for this scope; other scopes will not be silently switched.");
    if (switching && !prior)
      fail("Only the sole active owned target can switch subscription forwarding in place. Disable existing routing first, then retry setup.");
    const target = `http://127.0.0.1:${port}`;
    if (base !== void 0 && base !== target || env[BASE] !== void 0 && env[BASE] !== target)
      fail("Conflicting ANTHROPIC_BASE_URL. Remove it explicitly before setup; it will not be overwritten.");
    if (env[HEADERS] !== void 0 && env[HEADERS] !== headers && !(config && allReceipts.some(({ saved }) => receipt(saved, config)?.afterHeaders === env[HEADERS])))
      fail("Inherited custom headers differ from user settings. Restart Claude without that override before setup.");
    const owned = config ? `X-LangSmith-Proxy-Key: ${config.secret}` : void 0;
    const keys = lines(headers).filter(keyLine);
    if (keys.length && (!prior || keys.length !== 1 || keys[0] !== owned))
      fail("Conflicting local proxy header; no unowned header will be replaced.");
    if (switching && (base !== target || keys.length !== 1))
      fail("Owned transport settings changed. Restore them privately or disable this scope before switching subscription forwarding.");
    if (!config) {
      const old = snapshot(p.config, true);
      if (old) {
        if (old.text.trim() !== '{"enabled":false}' && JSON.stringify(JSON.parse(old.text)) !== '{"enabled":false}')
          fail("Invalid disabled config; resolve privately before retrying.");
        fail("Legacy disabled marker has no pinned CLI/profile. Remove only that marker, then retry /langsmith-gateway:setup.");
      }
      createConfig(requested.cli ?? discoverCLI(env), requested.profile ?? "claude-gateway", port, home, selected, useClaudeSubscription);
      config = loadConfig(home);
    }
    const effective = next ?? config;
    if (validateCLI(effective.cli) !== effective.cli)
      fail("Pinned CLI path changed; resolve privately before retrying.");
    let configSnapshot = snapshot(p.config, true);
    if (switching) {
      unchanged(p.settings, beforeSettings);
      unchanged(p.receipt, oldReceipt, true);
      for (const item of allReceipts)
        unchanged(item.path, item.saved, true);
      atomic(p.config, jsonText({ ...next, enabled: false }), configSnapshot);
      configSnapshot = snapshot(p.config, true);
    }
    if ((!initiallyEnabled || switching) && next) {
      await waitForStopped(config).catch(() => fail("Old proxy still draining or local port occupied. Config remains disabled; routing settings and requested mode are retained. Wait at least 35 seconds and retry the same setup options; resolve port conflicts privately without killing an unknown listener."));
      unchanged(p.config, configSnapshot, true);
      unchanged(p.settings, beforeSettings);
      unchanged(p.receipt, oldReceipt, true);
      for (const item of allReceipts)
        unchanged(item.path, item.saved, true);
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
      unchanged(p.receipt, oldReceipt, true);
      for (const item of allReceipts)
        unchanged(item.path, item.saved, true);
      directory(dirname3(p.settings));
      secretGitCheck(p.settings);
      secretGitCheck(p.config);
      secretGitCheck(p.receipt);
      const line = `X-LangSmith-Proxy-Key: ${config.secret}`;
      const afterHeaders = keys.length ? headers : (headers ? headers + "\n" : "") + line;
      const record = prior ?? {
        version: 1,
        identity: ownershipIdentity(config),
        beforeBase: base ?? null,
        beforeHeaders: headers ?? null,
        afterBase: target,
        afterHeaders,
        envExisted: value.env !== void 0
      };
      savedEnv[BASE] = target;
      savedEnv[HEADERS] = afterHeaders;
      value.env = savedEnv;
      const settingsChanged = base !== target || headers !== afterHeaders;
      transaction([
        ...!prior ? [{ path: p.receipt, text: jsonText(record), prior: oldReceipt }] : [],
        ...settingsChanged ? [{ path: p.settings, text: jsonText(value), prior: beforeSettings }] : []
      ]);
      return { settingsChanged, useClaudeSubscription: config.useClaudeSubscription, modeChanged };
    } catch (error) {
      if (!initiallyEnabled || switching) {
        unchanged(p.config, currentConfig, true);
        atomic(p.config, jsonText({ ...config, enabled: false }), currentConfig);
      }
      if (switching)
        fail("Gateway mode switch did not complete. Config remains disabled with the requested mode; routing settings and ownership are retained. Retry the same setup options after resolving local daemon readiness privately. No client restart is needed if transport settings are unchanged.");
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
    const allReceipts = receiptSnapshots(home);
    for (const item of allReceipts)
      receipt(item.saved, config);
    const configSnapshot = snapshot(p.config, true);
    const recordSnapshot = snapshot(p.receipt, true);
    const r = receipt(recordSnapshot, config);
    if (!r) {
      if (!allReceipts.length && loadConfig(home))
        atomic(p.config, jsonText({ ...config, enabled: false }), configSnapshot);
      return;
    }
    directory(dirname3(p.settings));
    const before = snapshot(p.settings);
    const { value, env: savedEnv } = settings(before);
    const writes = [];
    if (r) {
      if (savedEnv[BASE] === r.afterBase)
        assign(savedEnv, BASE, r.beforeBase);
      const current = text(savedEnv[HEADERS]);
      if (current === r.afterHeaders)
        assign(savedEnv, HEADERS, r.beforeHeaders);
      else if (current !== void 0) {
        const line = `X-LangSmith-Proxy-Key: ${config.secret}`;
        const remaining = lines(current).filter((item) => item !== line);
        if (remaining.length !== lines(current).length)
          assign(savedEnv, HEADERS, remaining.length ? remaining.join("\n") : r.beforeHeaders === null ? null : "");
      }
      if (!r.envExisted && Object.keys(savedEnv).length === 0)
        delete value.env;
      else if (value.env !== void 0)
        value.env = savedEnv;
      if (before && JSON.stringify(value) !== JSON.stringify(JSON.parse(before.text)))
        writes.push({ path: p.settings, text: jsonText(value), prior: before });
    }
    if (!allReceipts.some((item) => item.path !== p.receipt))
      writes.push({
        path: p.config,
        text: jsonText({ ...config, enabled: false }),
        prior: configSnapshot
      });
    if (recordSnapshot)
      writes.push({ path: p.receipt, text: "null\n", prior: recordSnapshot });
    for (const item of allReceipts)
      unchanged(item.path, item.saved, true);
    transaction(writes);
  } finally {
    unlock();
  }
}

// dist/proxy/commands.js
async function handleGatewayInput(input, entry2, env = process.env, home = userHome(), output = (value) => process.stdout.write(JSON.stringify(value) + "\n")) {
  if (input.hook_event_name === "UserPromptSubmit" && typeof input.prompt === "string" && /^\/langsmith-gateway:(setup|disable)(?=\s|$)/.test(input.prompt)) {
    let reason;
    try {
      const command = parseGatewayCommand(input.prompt);
      if (!command)
        return;
      if (command.command === "setup") {
        const { settingsChanged, useClaudeSubscription, modeChanged } = await enable(entry2, ["--yes", ...command.args], env, home, input.cwd ?? "");
        reason = (settingsChanged ? "Gateway settings saved for the selected scope; " : "Gateway settings already configured for the selected scope; ") + modeSummary(useClaudeSubscription, modeChanged) + "local daemon healthy. Authentication is checked on the first model request, not setup." + (settingsChanged ? " Restart Claude to apply the settings." : "");
      } else {
        disable(["--yes", ...command.args], env, home, input.cwd ?? "");
        reason = "Gateway disabled for the selected scope; owned settings restored and later edits preserved. The last active scope disables the daemon (up to 5 seconds to notice, then up to 30 seconds to drain). Restart affected Claude sessions.";
      }
    } catch (error) {
      reason = error instanceof SetupError ? error.message : "Gateway command failed; check private config, CLI installation, permissions, links, concurrent edits and port conflicts privately. " + COMMAND_GUIDANCE;
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

// dist/hooks/gateway.js
var entry = fileURLToPath(import.meta.url);
async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "plan") {
    process.stdout.write(JSON.stringify(setupPlan(args)) + "\n");
    return;
  }
  if (command === "enable") {
    const { settingsChanged, useClaudeSubscription, modeChanged } = await enable(entry, args);
    process.stderr.write((settingsChanged ? "Gateway settings saved for the selected scope; " : "Gateway settings already configured for the selected scope; ") + modeSummary(useClaudeSubscription, modeChanged) + "local proxy healthy. Authentication is checked on the first model request, not during setup; deployment compatibility is not verified." + (settingsChanged ? " Restart Claude to apply the settings." : "") + " Use /langsmith-gateway:disable --scope global|project to undo owned settings.\n");
    return;
  }
  if (command === "disable") {
    disable(args);
    process.stderr.write("Gateway disabled for the selected scope; only owned transport values were undone and later edits preserved. After the last active scope is disabled, the daemon drains after its next config check (within 5 seconds, up to 30 seconds for active work). Restart all Claude sessions without local proxy shell overrides. Keep private config for re-enable.\n");
    return;
  }
  if (command !== void 0 && command !== "daemon")
    throw new SetupError(COMMAND_GUIDANCE);
  if (command === void 0) {
    let data = "";
    const timer = setTimeout(() => process.stdin.destroy(), 1e3);
    try {
      for await (const chunk of process.stdin) {
        data += chunk;
        if (data.length > 65536) {
          process.stdout.write(JSON.stringify({
            decision: "block",
            reason: "Gateway hook input too large; no changes made."
          }) + "\n");
          return;
        }
      }
      await handleGatewayInput(JSON.parse(data), entry);
    } finally {
      clearTimeout(timer);
    }
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
  process.stderr.write(error instanceof SetupError ? error.message + "\n" : "Experimental LangSmith proxy unavailable; check private config, CLI executable, settings ownership/permissions/symlinks, and local port conflicts. No sensitive error details are printed. " + COMMAND_GUIDANCE + "\n");
  if (process.argv[2])
    process.exitCode = 1;
});

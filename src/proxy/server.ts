import http, {
  type IncomingHttpHeaders,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import https from "node:https";
import { createHash, timingSafeEqual } from "node:crypto";
import { KEY_HEADER, endpoints, type ProxyConfig } from "./config.js";
import { TokenCache, cliToken, loginGuidance } from "./token.js";

// Bump the protocol identity when forwarding or validation changes so an older
// daemon cannot silently retain the previous contract. Conflicts fail closed.
export const identity = (c: ProxyConfig) =>
  createHash("sha256")
    .update(
      JSON.stringify([
        8,
        c.useClaudeSubscription,
        c.cli,
        c.profile,
        c.port,
        c.secret,
        endpoints(c).apiUrl,
        endpoints(c).gatewayUrl,
      ]),
    )
    .digest("hex");

export function authenticated(req: IncomingMessage, secret: string): boolean {
  const keys = req.rawHeaders.filter(
    (_, i) => i % 2 === 0 && req.rawHeaders[i].toLowerCase() === KEY_HEADER,
  );
  const value = req.headers[KEY_HEADER];
  if (keys.length !== 1 || typeof value !== "string") return false;
  const a = Buffer.from(value),
    b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Node may discard duplicate Authorization values in req.headers; inspect the wire
// header count before extracting a single raw token. Never echo credentials.
// This is transport validation, not proof of OAuth validity; the provider decides.
export function nativeToken(req: IncomingMessage): string | undefined {
  const count = req.rawHeaders.filter(
    (name, i) => i % 2 === 0 && name.toLowerCase() === "authorization",
  ).length;
  const value = req.headers.authorization;
  if (count !== 1 || typeof value !== "string") return;
  if (!/^Bearer /i.test(value)) return;
  const token = value.slice(7);
  // No subtype/suffix grammar. Reject whitespace, controls and comma ambiguity
  // without trimming or changing the raw credential, and ensure Node can send it.
  // eslint-disable-next-line no-control-regex
  if (!token.startsWith("sk-ant-") || token.length <= 7 || /[\s\x00-\x1f\x7f-\x9f,]/.test(token))
    return;
  try {
    http.validateHeaderValue("x-langsmith-anthropic-passthrough", token);
  } catch {
    return;
  }
  return token;
}

const hop = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "proxy-connection",
]);
const routing = new Set([
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
  "x-secret-token",
]);
export function cleanHeaders(headers: IncomingHttpHeaders, request = true): IncomingHttpHeaders {
  const blocked = new Set([
    ...hop,
    ...(headers.connection ?? "")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim()),
  ]);
  const result: IncomingHttpHeaders = {};
  for (const [name, value] of Object.entries(headers)) {
    if (
      blocked.has(name) ||
      name === KEY_HEADER ||
      name.startsWith("x-langsmith-") ||
      routing.has(name) ||
      (request && (name === "host" || name === "expect"))
    )
      continue;
    result[name] = value;
  }
  return result;
}

// Never resolve an untrusted URL against the upstream. Restrict the raw origin-form
// path first, then append it to the fixed prefix. No escapes, traversal, or authority.
export function upstreamPath(method: string, raw: string): string | undefined {
  // Reject control bytes deliberately at the raw request-target boundary.
  // eslint-disable-next-line no-control-regex
  if (raw.length > 4096 || /[\\#\x00-\x20\x7f]/.test(raw)) return;
  const [path, query] = raw.split("?", 2);
  if (
    !(
      (method === "POST" && /^\/v1\/messages(?:\/count_tokens)?$/.test(path)) ||
      (method === "GET" && /^\/v1\/models(?:\/[a-zA-Z0-9_-]+)?$/.test(path))
    )
  )
    return;
  // Query values are data, never used to select an upstream. Limit SDK query keys.
  if (query !== undefined) {
    if (raw.indexOf("?", raw.indexOf("?") + 1) !== -1) return;
    const allowed = method === "POST" ? ["beta"] : ["beta", "limit", "before_id", "after_id"];
    const params = new URLSearchParams(query);
    for (const [key, value] of params)
      if (!allowed.includes(key) || !/^[a-zA-Z0-9_.-]{1,256}$/.test(value)) return;
  }
  // The unified catalog has no get-model route; retain native model lookup.
  return method === "GET" && path.startsWith("/v1/models/") ? "/anthropic" + raw : raw;
}

// Match smith-go/gateway's buffered request limit, including large image/context
// payloads. Enforce it on both the uploaded and rewritten UTF-8 bytes.
export const MAX_REQUEST_BYTES = 60 * 1024 * 1024;

class RequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
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
    const data = (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) {
        cleanup();
        req.pause(); // Keep the socket writable long enough to send the 413.
        reject(new RequestError(413, "Request body exceeds 60 MiB"));
      } else chunks.push(chunk);
    };
    const done = () => {
      cleanup();
      resolve(Buffer.concat(chunks, size));
    };
    req.on("data", data);
    req.on("end", done);
    req.on("error", failed);
    req.on("aborted", failed);
  });
}

async function prepareBody(req: IncomingMessage, path: string) {
  const encoding = req.headers["content-encoding"];
  if (encoding !== undefined && encoding.toLowerCase() !== "identity")
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
  // Only the first slash separates provider and model; no provider-name inference.
  const slash = model.indexOf("/");
  if (slash === 0 || slash === model.length - 1)
    throw new RequestError(400, "model must be a bare ID or provider/model");
  const normalized = slash === -1 ? `anthropic/${model}` : model;
  body.model = normalized;
  if (path.split("?", 1)[0] === "/v1/messages/count_tokens") {
    // The gateway has no unified count_tokens route. Do not guess a provider's
    // native protocol from its name (custom providers may use any protocol).
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

export class Sessions {
  readonly leases = new Map<string, number>();
  private readonly ended = new Map<string, number>();
  active = 0;
  lastActivity: number;
  constructor(
    private readonly now = Date.now,
    readonly leaseMs = 30 * 60_000,
    readonly idleMs = 60_000,
  ) {
    this.lastActivity = now();
  }
  prune(): void {
    const now = this.now();
    for (const [id, expiry] of this.leases) if (expiry <= now) this.leases.delete(id);
    for (const [id, expiry] of this.ended) if (expiry <= now) this.ended.delete(id);
  }
  register(id: string): boolean {
    this.prune();
    if (this.ended.has(id)) return false;
    if (!this.leases.has(id) && this.leases.size >= 512) return false;
    this.leases.set(id, this.now() + this.leaseMs);
    this.lastActivity = this.now();
    return true;
  }
  release(id: string): void {
    this.prune();
    this.leases.delete(id);
    // Even an unknown session can have a delayed registration in flight. Retain
    // ends for one lease duration, capped at the 512 most recently ended IDs.
    this.ended.delete(id);
    if (this.ended.size >= 512) this.ended.delete(this.ended.keys().next().value!);
    this.ended.set(id, this.now() + this.leaseMs);
    this.lastActivity = this.now();
  }
  begin(): void {
    this.active++;
    this.lastActivity = this.now();
  }
  end(): void {
    this.active--;
    this.lastActivity = this.now();
  }
  idle(): boolean {
    this.prune();
    return (
      this.active === 0 && this.leases.size === 0 && this.now() - this.lastActivity >= this.idleMs
    );
  }
}

function reply(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, {
    "content-type": "text/plain",
    "cache-control": "no-store",
    connection: "close",
  });
  res.end(message);
}

// Inject only the transport/token source in tests; production always uses HTTPS,
// the configured origin/allowlisted paths, system TLS validation, and never follows redirects.
export function createProxy(
  config: ProxyConfig,
  options: {
    token?: () => Promise<string>;
    transport?: typeof https.request;
    sessions?: Sessions;
  } = {},
) {
  const upstreamOrigin = new URL(endpoints(config).gatewayUrl);
  const credentialAbort = new AbortController();
  const tokens = new TokenCache(
    options.token ?? (() => cliToken(config, 10_000, credentialAbort.signal)),
  );
  const sessions = options.sessions ?? new Sessions();
  const transport = options.transport ?? https.request;
  let draining = false;
  const server = http.createServer({ maxHeaderSize: 32768 }, (req, res) => {
    if (!authenticated(req, config.secret)) {
      reply(res, 401, "Local proxy authentication required");
      return;
    }
    // Browser/CORS and DNS-rebinding defense in addition to the mandatory secret.
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
    const control = /^\/_langsmith\/sessions\/([a-zA-Z0-9_-]{1,128})$/.exec(req.url ?? "");
    if (control && (req.method === "PUT" || req.method === "DELETE")) {
      if (
        req.headers["transfer-encoding"] ||
        (req.headers["content-length"] && req.headers["content-length"] !== "0")
      ) {
        reply(res, 400, "Control requests must be empty");
        return;
      }
      if (req.method === "PUT" && !sessions.register(control[1])) {
        reply(res, 429, "Session registration unavailable");
        return;
      }
      if (req.method === "DELETE") sessions.release(control[1]);
      reply(res, 204, "");
      return;
    }
    const path = upstreamPath(req.method ?? "", req.url ?? "");
    if (!path) {
      reply(res, 404, "Unsupported proxy route");
      return;
    }
    const native = config.useClaudeSubscription ? nativeToken(req) : undefined;
    if (config.useClaudeSubscription && !native) {
      reply(
        res,
        401,
        "Exactly one Authorization: Bearer sk-ant-... with a nonempty, header-safe suffix required",
      );
      return;
    }
    // Strip client credentials/routing before adding trusted gateway credentials.
    const headers = cleanHeaders(req.headers);
    if (sessions.active >= 64) {
      reply(res, 503, "Local proxy busy");
      return;
    }
    sessions.begin();
    let ended = false;
    let outgoing: http.ClientRequest | undefined;
    let incoming: IncomingMessage | undefined;
    let headerTimer: NodeJS.Timeout | undefined;
    const end = () => {
      if (ended) return;
      ended = true;
      clearTimeout(headerTimer);
      outgoing?.destroy();
      incoming?.destroy();
      sessions.end();
    };
    req.on("aborted", end);
    req.on("error", end);
    res.on("close", end);
    const fail = () => {
      if (ended) return;
      if (!res.headersSent) reply(res, 502, "LangSmith proxy upstream unavailable");
      else res.destroy();
      end();
    };
    // Validate/transform before CLI acquisition: rejected JSON must not refresh
    // credentials. GET bodies retain their existing streaming behavior.
    void (async () => {
      const prepared = req.method === "POST" ? await prepareBody(req, path) : undefined;
      if (ended || res.destroyed) return;
      if (prepared) {
        headers["content-type"] = "application/json";
        headers["content-length"] = String(prepared.body.length);
        delete headers["transfer-encoding"];
        delete headers["content-encoding"];
      }
      if (draining) throw new RequestError(503, "Local proxy draining");
      const token = await tokens.get().catch(() => {
        throw new RequestError(503, loginGuidance(config));
      });
      if (ended || res.destroyed) return;
      if (draining) throw new RequestError(503, "Local proxy draining");
      // The native token goes only to the configured gateway, never directly to an
      // overridden provider. Gateway selection activates it only for built-in
      // Anthropic (including fallback legs); other destinations ignore it.
      headers.authorization = `Bearer ${token}`;
      if (native) headers["x-langsmith-anthropic-passthrough"] = native;
      outgoing = transport(
        {
          protocol: "https:",
          hostname: upstreamOrigin.hostname,
          port: Number(upstreamOrigin.port || 443),
          path: prepared?.path ?? path,
          method: req.method,
          headers,
          agent: false,
          rejectUnauthorized: true,
        },
        (upstream) => {
          clearTimeout(headerTimer);
          incoming = upstream;
          if (ended) {
            upstream.destroy();
            return;
          }
          // Never relay a redirect to Claude (which might forward native credentials).
          if ((upstream.statusCode ?? 502) >= 300 && (upstream.statusCode ?? 502) < 400) {
            fail();
            return;
          }
          const responseHeaders = cleanHeaders(upstream.headers, false);
          delete responseHeaders["location"];
          delete responseHeaders["set-cookie"];
          res.writeHead(upstream.statusCode ?? 502, responseHeaders);
          upstream.on("error", fail);
          upstream.on("aborted", fail);
          upstream.pipe(res);
        },
      );
      // Also bound DNS/connect/TLS and waiting for headers, not just an
      // established socket's inactivity. Streaming has no total-duration cap.
      headerTimer = setTimeout(fail, 120_000);
      outgoing.setTimeout(120_000, fail);
      outgoing.on("error", fail);
      if (prepared) outgoing.end(prepared.body);
      else req.pipe(outgoing);
    })().catch((error) => {
      if (ended) return;
      if (error instanceof RequestError) {
        reply(res, error.status, error.message);
        end();
      } else fail();
    });
  });
  server.headersTimeout = 15_000;
  server.requestTimeout = 120_000;
  server.keepAliveTimeout = 5000;
  server.maxConnections = 128;
  server.on("connect", (_req, socket) => socket.destroy());
  server.on("upgrade", (_req, socket) => socket.destroy());
  server.on("clientError", (_err, socket) => socket.destroy());
  let drainTimer: NodeJS.Timeout | undefined;
  const close = () => {
    clearInterval(sweep);
    clearTimeout(drainTimer);
    server.close();
    server.closeAllConnections();
  };
  const drain = () => {
    if (draining) return;
    draining = true;
    credentialAbort.abort();
    // Retain the OS startup lock while draining: releasing the listening socket
    // early could start a second daemon/CLI refresh while old requests still run.
    // New requests get 503; existing active requests have up to 30s to finish.
    server.closeIdleConnections();
    if (sessions.active === 0 && !tokens.loading) {
      close();
      return;
    }
    drainTimer = setTimeout(close, 30_000);
    drainTimer.unref();
  };
  const sweep = setInterval(() => {
    if (draining && sessions.active === 0 && !tokens.loading) close();
    else if (sessions.idle()) drain();
  }, 1000);
  sweep.unref();
  server.on("close", () => {
    credentialAbort.abort();
    clearInterval(sweep);
    clearTimeout(drainTimer);
  });
  return { server, sessions, drain };
}

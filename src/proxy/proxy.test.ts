import { afterEach, describe, expect, it, vi } from "vitest";
import http from "node:http";
import * as childProcess from "node:child_process";
import { handleGatewayInput } from "./commands.js";
import { connect } from "node:net";
import { createHash } from "node:crypto";
import type https from "node:https";
import { once } from "node:events";
import {
  mkdtempSync,
  realpathSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  chmodSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createProxy,
  cleanHeaders,
  upstreamPath,
  Sessions,
  identity,
  nativeToken,
  MAX_REQUEST_BYTES,
} from "./server.js";
import {
  API_URL,
  endpoints,
  KEY_HEADER,
  UPSTREAM,
  configDir,
  loadConfig,
  type ProxyConfig,
} from "./config.js";
import { cliToken, loginGuidance, TokenCache } from "./token.js";
import { control, ensure, gatewayHook, waitForStopped } from "./lifecycle.js";
import { createConfig } from "./setup.js";

vi.mock("node:child_process", async (original) => ({
  ...(await original<typeof import("node:child_process")>()),
}));

// Synthetic native token; never read actual Claude or CLI credentials in tests.
const native = `sk-ant-oat01-${"test_native-".repeat(8)}`;
const nativeAuthorization = `Bearer ${native}`;
const jwt = (exp = Date.now() / 1000 + 300) =>
  `e30.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.signature`;
const base: ProxyConfig = {
  enabled: true,
  useClaudeSubscription: true,
  cli: "/unused/langsmith",
  profile: "test",
  port: 19991,
  secret: "a".repeat(64),
};
const cleanup: (() => void)[] = [];
afterEach(() => {
  for (const f of cleanup.splice(0).reverse()) f();
});
function temporary() {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "ls-proxy-test-")));
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
async function listen(server: http.Server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  cleanup.push(() => {
    server.closeAllConnections();
    server.close();
  });
  return (server.address() as { port: number }).port;
}
async function fixture(
  handler: http.RequestListener = (_req, res) => res.end("ok"),
  token = vi.fn(async () => jwt()),
  urls: { apiUrl?: string; gatewayUrl?: string; useClaudeSubscription?: boolean } = {},
) {
  const upstream = http.createServer(handler);
  const upstreamPort = await listen(upstream);
  const targets: https.RequestOptions[] = [];
  const transport = ((options: https.RequestOptions, cb: (r: http.IncomingMessage) => void) => {
    targets.push(options);
    return http.request(
      { ...options, protocol: "http:", hostname: "127.0.0.1", port: upstreamPort },
      cb,
    );
  }) as typeof https.request;
  const config = { ...base, ...urls };
  const proxy = createProxy(config, { transport, token });
  config.port = await listen(proxy.server);
  return { ...proxy, config, targets, token };
}
function request(
  c: ProxyConfig,
  path = "/v1/messages",
  opts: {
    method?: string;
    headers?: http.OutgoingHttpHeaders | string[];
    body?: string | Buffer;
  } = {},
) {
  return new Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }>(
    (resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: c.port,
          path,
          method: opts.method ?? "POST",
          headers: Array.isArray(opts.headers)
            ? [KEY_HEADER, c.secret, "Host", `127.0.0.1:${c.port}`, ...opts.headers]
            : Object.fromEntries(
                Object.entries({
                  [KEY_HEADER]: c.secret,
                  authorization: nativeAuthorization,
                  ...opts.headers,
                }).filter(([, value]) => value !== undefined),
              ),
        },
        (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (c) => (body += c));
          res.on("end", () => resolve({ status: res.statusCode!, body, headers: res.headers }));
          res.on("error", reject);
        },
      );
      req.on("error", reject);
      req.end(
        opts.body ?? ((opts.method ?? "POST") === "POST" ? '{"model":"claude-test"}' : undefined),
      );
    },
  );
}

describe("raw Bearer parsing", () => {
  it("rejects whitespace, controls, comma ambiguity and unsafe header characters without normalization", () => {
    const forbidden = [
      ...Array.from({ length: 33 }, (_, i) => String.fromCharCode(i)),
      ...Array.from({ length: 33 }, (_, i) => String.fromCharCode(0x7f + i)),
      "\u00a0",
      "\u1680",
      "\u2003",
      "\u2028",
      "\u2029",
      "\ufeff",
      ",",
      "\u0100",
    ];
    for (const char of forbidden) {
      for (const value of [
        `Bearer sk-ant-${char}suffix`,
        `Bearer sk-ant-suffix${char}`,
        `${char}${nativeAuthorization}`,
        ...(char === " " ? [] : [`Bearer${char}${native}`]),
      ]) {
        expect(
          nativeToken({
            headers: { authorization: value },
            rawHeaders: ["Authorization", value],
          } as http.IncomingMessage),
        ).toBeUndefined();
      }
    }
  });
});

describe("local boundary and upstream targeting", () => {
  it.each([
    "sk-ant-x",
    "sk-ant-oat01-",
    native,
    "sk-ant-api03-test",
    "sk-ant-future-subtype-test",
    "sk-ant-!#$%&'()*+-./:;<=>?@[\\]^_`{|}~\"",
  ])("forwards a header-safe raw prefix variant unchanged: %s", async (raw) => {
    let received: http.IncomingHttpHeaders = {};
    const lsToken = jwt();
    const f = await fixture(
      (req, res) => {
        received = req.headers;
        res.end("ok");
      },
      vi.fn(async () => lsToken),
    );
    const result = await request(f.config, undefined, {
      headers: { authorization: `bEaReR ${raw}` },
    });
    expect(result.status).toBe(200);
    expect(f.token).toHaveBeenCalledTimes(1);
    expect(f.targets).toHaveLength(1);
    expect(received["x-langsmith-anthropic-passthrough"]).toBe(raw);
    expect(received.authorization).toBe(`Bearer ${lsToken}`);
    expect(received["x-api-key"]).toBeUndefined();
  });
  it("rejects control bytes on the wire before CLI refresh or forwarding", async () => {
    const f = await fixture();
    // http.request rejects most of these itself; bypass that client-side check.
    for (const code of [0, 1, 9, 10, 13, 31, 127, 128, 159]) {
      const response = await new Promise<string>((resolve, reject) => {
        const socket = connect(f.config.port, "127.0.0.1");
        let data = "";
        socket.setTimeout(2000, () => socket.destroy(new Error("Socket test timed out")));
        socket.on("error", reject);
        socket.on("data", (chunk) => {
          data += chunk.toString();
        });
        socket.on("close", () => resolve(data));
        socket.on("connect", () =>
          socket.end(
            Buffer.from(
              `POST /v1/messages HTTP/1.1\r\nHost: 127.0.0.1:${f.config.port}\r\n${KEY_HEADER}: ${f.config.secret}\r\nAuthorization: Bearer sk-ant-test${String.fromCharCode(code)}suffix\r\nContent-Length: 0\r\nConnection: close\r\n\r\n`,
              "latin1",
            ),
          ),
        );
      });
      // Node drops invalid HTTP; parseable but unsafe tokens get the proxy's 401.
      expect(response === "" || response.startsWith("HTTP/1.1 401 ")).toBe(true);
      expect(response).not.toContain("sk-ant-test");
    }
    expect(f.token).not.toHaveBeenCalled();
    expect(f.targets).toHaveLength(0);
    expect(f.sessions.active).toBe(0);
  });
  it("requires exactly one local key, does not use Authorization as local auth", async () => {
    const f = await fixture();
    for (const headers of [
      { [KEY_HEADER]: "" },
      { [KEY_HEADER]: "b".repeat(64) },
      { [KEY_HEADER]: [base.secret, base.secret] },
      { [KEY_HEADER]: "", authorization: `Bearer ${base.secret}` },
    ]) {
      expect((await request(f.config, undefined, { headers })).status).toBe(401);
    }
    expect(f.token).not.toHaveBeenCalled();
    expect(f.targets).toHaveLength(0);
  });
  it("rejects missing, malformed, API-key-only and multiple native auth before CLI refresh", async () => {
    const f = await fixture();
    const logs = ["log", "warn", "error", "debug", "info"].map((method) =>
      vi.spyOn(console, method as "log").mockImplementation(() => {}),
    );
    try {
      for (const authorization of [
        undefined,
        "",
        native,
        `Basic ${native}`,
        `Bearer ${jwt()}`,
        "Bearer sk-ant-",
        "Bearer sk-ant",
        "Bearer SK-ANT-test",
        `Bearer  ${native}`,
        `Bearer\t${native}`,
        `Bearer ${native} extra`,
        `Bearer ${native}\textra`,
        `Bearer ${native}\u00a0extra`,
        `Bearer ${native},extra`,
        `${nativeAuthorization}, ${nativeAuthorization}`,
        [nativeAuthorization, nativeAuthorization],
        [nativeAuthorization, "Bearer invalid"],
        ["Bearer invalid", nativeAuthorization],
      ]) {
        const r = await request(f.config, undefined, {
          headers: {
            authorization,
            "x-api-key": "sk-ant-api03-test",
            "x-langsmith-anthropic-passthrough": native,
          },
        });
        expect(r.status).toBe(401);
        expect(r.body).toBe(
          "Exactly one Authorization: Bearer sk-ant-... with a nonempty, header-safe suffix required",
        );
        expect(r.body).not.toContain(native);
      }
      // Differently cased duplicate field names must not evade raw-header counting.
      expect(
        (
          await request(f.config, undefined, {
            headers: ["authorization", nativeAuthorization, "Authorization", nativeAuthorization],
          })
        ).status,
      ).toBe(401);
      expect(f.token).not.toHaveBeenCalled();
      expect(f.targets).toHaveLength(0);
      expect(f.sessions.active).toBe(0);
      for (const log of logs) expect(log).not.toHaveBeenCalled();
    } finally {
      for (const log of logs) log.mockRestore();
    }
  });
  it("rejects origins and wrong host", async () => {
    const f = await fixture();
    expect(
      (await request(f.config, undefined, { headers: { origin: "https://evil.test" } })).status,
    ).toBe(403);
    expect((await request(f.config, undefined, { headers: { host: "evil.test" } })).status).toBe(
      403,
    );
  });
  it.each([
    "https://evil.test/v1/messages",
    "//evil.test/v1/messages",
    "/v1/../messages",
    "/v1/%6dessages",
    "/v1/messages/",
    "/v1/messages#x",
    "/v1/messages?url=https://evil.test",
    "/v1/messages?beta=true?x=y",
    "/v1/messages\\evil",
    "/_langsmith/health",
    "/v1/models/..",
    "/v1/messages?beta=%0a",
  ])("rejects %s", (path) => {
    expect(upstreamPath("POST", path)).toBeUndefined();
  });
  it("targets unified messages/catalog and native count_tokens/model lookup", async () => {
    const f = await fixture();
    for (const [method, path] of [
      ["POST", "/v1/messages?beta=true"],
      ["POST", "/v1/messages/count_tokens"],
      ["GET", "/v1/models?limit=10&after_id=model-1"],
      ["GET", "/v1/models/claude-sonnet-4-5"],
    ]) {
      expect((await request(f.config, path, { method })).status).toBe(200);
      expect(f.targets.at(-1)).toMatchObject({
        protocol: "https:",
        hostname: "gateway.smith.langchain.com",
        port: 443,
        path:
          path.includes("count_tokens") || path.startsWith("/v1/models/")
            ? "/anthropic" + path
            : path,
        rejectUnauthorized: true,
      });
    }
    expect((await request(f.config, "/v1/messages", { method: "GET" })).status).toBe(404);
    expect((await request(f.config, "/v1/models", { method: "DELETE" })).status).toBe(404);
  });
  it("selects preview host/port for every route with TLS and no redirect or production fallback", async () => {
    const urls = {
      apiUrl: "https://pr-42-api.review.smith.langchain.com",
      gatewayUrl: "https://pr-42-gateway.review.smith.langchain.com:8443/",
    };
    const f = await fixture(
      (_req, res) => {
        res.writeHead(307, { location: UPSTREAM });
        res.end();
      },
      vi.fn(async () => jwt()),
      urls,
    );
    for (const [method, path, target] of [
      ["POST", "/v1/messages", "/v1/messages"],
      ["POST", "/v1/messages/count_tokens", "/anthropic/v1/messages/count_tokens"],
      ["GET", "/v1/models", "/v1/models"],
      ["GET", "/v1/models/claude-test", "/anthropic/v1/models/claude-test"],
    ]) {
      const result = await request(f.config, path, { method });
      expect(result.status).toBe(502);
      expect(result.headers.location).toBeUndefined();
      expect(f.targets.at(-1)).toMatchObject({
        protocol: "https:",
        hostname: "pr-42-gateway.review.smith.langchain.com",
        port: 8443,
        path: target,
        rejectUnauthorized: true,
        agent: false,
      });
    }
    expect(f.targets).toHaveLength(4);
  });
  it("moves raw native auth to passthrough and injects LS Bearer after stripping spoofed credentials", async () => {
    let received: http.IncomingHttpHeaders = {},
      body = "";
    const token = jwt();
    const f = await fixture(
      (req, res) => {
        received = req.headers;
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => res.end("ok"));
      },
      vi.fn(async () => token),
    );
    await request(f.config, undefined, {
      body: '{"model":"claude-test","stream":true}',
      headers: {
        authorization: nativeAuthorization,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "oauth-2025-04-20",
        "x-api-key": "client-key",
        "X-LangSmith-Anthropic-Passthrough": "spoofed-native-token",
        "x-auth-source": "evil",
        "x-gateway-key": "evil",
        "gateway-key": "evil",
        "x-langsmith-auth-mode": "malicious",
        "x-langsmith-project": "evil",
        "x-tenant-id": "evil",
        "proxy-authorization": "secret",
        connection: "x-remove, authorization, x-langsmith-anthropic-passthrough",
        "x-remove": "secret",
      },
    });
    expect(received.authorization).toBe(`Bearer ${token}`);
    expect(received["x-langsmith-anthropic-passthrough"]).toBe(native);
    expect(received["anthropic-beta"]).toBe("oauth-2025-04-20");
    expect(received["anthropic-version"]).toBe("2023-06-01");
    expect(received["x-api-key"]).toBeUndefined();
    expect(JSON.parse(body)).toEqual({ model: "anthropic/claude-test", stream: true });
    for (const k of [
      KEY_HEADER,
      "x-auth-source",
      "x-gateway-key",
      "gateway-key",
      "x-langsmith-auth-mode",
      "x-langsmith-project",
      "x-tenant-id",
      "proxy-authorization",
      "x-remove",
    ])
      expect(received[k]).toBeUndefined();
    expect(
      cleanHeaders({
        connection: "x-secret",
        "x-secret": "hidden",
        te: "trailers",
        "transfer-encoding": "chunked",
      }),
    ).toEqual({});
  });
  it("blocks redirects without following or relaying Location", async () => {
    const f = await fixture((_req, res) => {
      res.writeHead(307, { location: "https://evil.test" });
      res.end();
    });
    const r = await request(f.config);
    expect(r.status).toBe(502);
    expect(r.headers.location).toBeUndefined();
    expect(f.targets).toHaveLength(1);
  });
  it("sanitizes token failures with selected profile/API terminal login guidance", async () => {
    const f = await fixture(
      undefined,
      vi.fn(async () => {
        throw new Error("secret-output");
      }),
      { apiUrl: "https://api.preview.test", gatewayUrl: "https://gateway.preview.test" },
    );
    const r = await request(f.config);
    expect(r.status).toBe(503);
    expect(r.body).not.toContain("secret");
    expect(r.body).toContain("--profile test --api-url https://api.preview.test auth login");
    expect(r.body).not.toMatch(/restart/i);
    expect(r.body).toContain("token lookup failures are cached for two seconds");
    expect(r.body).toContain("Failed requests are not replayed automatically");
    expect(r.body).toContain("saved OAuth issuer");
    expect(r.body).not.toContain("api.smith.langchain.com");
    expect(f.targets).toHaveLength(0);
  });
});

describe("unified JSON contract", () => {
  it.each([
    ["claude-sonnet-4-5", "anthropic/claude-sonnet-4-5"],
    ["gpt-bare", "anthropic/gpt-bare"],
    ["anthropic/claude-test", "anthropic/claude-test"],
    ["openai/gpt-test", "openai/gpt-test"],
    ["custom/saved-model", "custom/saved-model"],
    ["some-provider/nested/model", "some-provider/nested/model"],
  ])("normalizes %s without changing other JSON fields", async (model, expected) => {
    let received = "";
    let headers: http.IncomingHttpHeaders = {};
    const f = await fixture((req, res) => {
      headers = req.headers;
      req.on("data", (chunk) => (received += chunk));
      req.on("end", () => res.end("ok"));
    });
    const body = {
      model,
      stream: true,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "héllo" },
            {
              type: "image",
              source: { type: "base64", data: "ZmFrZQ==", media_type: "image/png" },
            },
          ],
        },
      ],
      system: [{ type: "text", text: "instructions", cache_control: { type: "ephemeral" } }],
      tools: [{ name: "test", input_schema: { type: "object", properties: {} } }],
      thinking: { type: "enabled", budget_tokens: 1000 },
      metadata: { user_id: "test" },
      unknown: { nullable: null, items: [1, false] },
    };
    const raw = JSON.stringify(body, null, 2);
    expect(
      (
        await request(f.config, "/v1/messages?beta=true", {
          body: raw,
          headers: {
            "content-length": Buffer.byteLength(raw),
            "content-encoding": "identity",
            "content-type": "application/json; charset=utf-8",
          },
        })
      ).status,
    ).toBe(200);
    expect(JSON.parse(received)).toEqual({ ...body, model: expected });
    expect(headers["content-length"]).toBe(String(Buffer.byteLength(received)));
    expect(headers["transfer-encoding"]).toBeUndefined();
    expect(headers["content-encoding"]).toBeUndefined();
    expect(headers["content-type"]).toBe("application/json");
    expect(headers["x-langsmith-anthropic-passthrough"]).toBe(native);
    expect(f.targets[0].path).toBe("/v1/messages?beta=true");
    expect(UPSTREAM).toBe("https://gateway.smith.langchain.com");
  });

  it.each([
    "",
    "{",
    "null",
    "[]",
    "42",
    "{}",
    '{"model":""}',
    '{"model":"   "}',
    '{"model":null}',
    '{"model":1}',
    '{"model":{}}',
    '{"model":[]}',
    '{"model":false}',
    '{"model":"/x"}',
    '{"model":"openai/"}',
    '{"model":"/"}',
  ])("rejects invalid JSON/model locally: %s", async (body) => {
    const f = await fixture();
    for (const path of ["/v1/messages", "/v1/messages/count_tokens"]) {
      const result = await request(f.config, path, { body });
      expect(result.status).toBe(400);
      expect(result.headers["cache-control"]).toBe("no-store");
    }
    expect(f.token).not.toHaveBeenCalled();
    expect(f.targets).toHaveLength(0);
    expect(f.sessions.active).toBe(0);
  });

  it.each(["gzip", "br", "deflate", "identity, gzip"])(
    "rejects %s encoding before token refresh",
    async (encoding) => {
      const f = await fixture();
      expect(
        (await request(f.config, undefined, { headers: { "content-encoding": encoding } })).status,
      ).toBe(415);
      expect(f.token).not.toHaveBeenCalled();
      expect(f.targets).toHaveLength(0);
    },
  );

  it("rejects invalid UTF-8 and explicit non-JSON content types before refresh", async () => {
    const f = await fixture();
    const invalid = Buffer.concat([
      Buffer.from('{"model":"claude-'),
      Buffer.from([0xff]),
      Buffer.from('"}'),
    ]);
    expect((await request(f.config, undefined, { body: invalid })).status).toBe(400);
    expect(
      (await request(f.config, undefined, { headers: { "content-type": "text/plain" } })).status,
    ).toBe(415);
    expect(f.token).not.toHaveBeenCalled();
    expect(f.targets).toHaveLength(0);
  });

  it("replaces chunked upload framing with the rewritten byte length", async () => {
    let headers: http.IncomingHttpHeaders = {};
    const f = await fixture((req, res) => {
      headers = req.headers;
      req.resume();
      req.on("end", () => res.end());
    });
    expect(
      (await request(f.config, undefined, { headers: { "transfer-encoding": "chunked" } })).status,
    ).toBe(200);
    expect(headers["transfer-encoding"]).toBeUndefined();
    expect(headers["content-length"]).toBe(
      String(Buffer.byteLength('{"model":"anthropic/claude-test"}')),
    );
  });

  it("rejects declared oversize without waiting for the upload or refreshing", async () => {
    const f = await fixture();
    expect(
      (
        await request(f.config, undefined, {
          body: "",
          headers: { "content-length": MAX_REQUEST_BYTES + 1 },
        })
      ).status,
    ).toBe(413);
    expect(f.token).not.toHaveBeenCalled();
    expect(f.targets).toHaveLength(0);
  });

  it("allows large contexts up to the limit and rejects chunked/rewrite overflow", async () => {
    const f = await fixture((req, res) => {
      req.resume();
      req.on("end", () => res.end());
    });
    const json = JSON.stringify({ model: "anthropic/x", context: "" });
    const atLimit = json.replace(
      '"context":""',
      '"context":"' + "x".repeat(MAX_REQUEST_BYTES - Buffer.byteLength(json)) + '"',
    );
    expect((await request(f.config, undefined, { body: atLimit })).status).toBe(200);
    const rejected = await fixture();
    expect(
      (
        await request(rejected.config, undefined, {
          body: atLimit + " ",
          headers: { "transfer-encoding": "chunked" },
        })
      ).status,
    ).toBe(413);
    // Upload fits, but adding anthropic/ to the bare model would exceed the limit.
    const bare = atLimit.replace('"anthropic/x"', '"xxxxxxxxxxx"');
    expect((await request(rejected.config, undefined, { body: bare })).status).toBe(413);
    expect(rejected.token).not.toHaveBeenCalled();
    expect(rejected.targets).toHaveLength(0);
  });

  it.each(["claude-test", "anthropic/claude-test"])(
    "counts %s via native Anthropic with an unprefixed model",
    async (model) => {
      let body = "";
      const f = await fixture((req, res) => {
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => res.end('{"input_tokens":42}'));
      });
      const input = { model, messages: [{ role: "user", content: "hi" }], tools: [] };
      const result = await request(f.config, "/v1/messages/count_tokens?beta=true", {
        body: JSON.stringify(input),
      });
      expect(result.status).toBe(200);
      expect(result.body).toBe('{"input_tokens":42}');
      expect(f.targets[0].path).toBe("/anthropic/v1/messages/count_tokens?beta=true");
      expect(JSON.parse(body)).toEqual({ ...input, model: "claude-test" });
    },
  );

  it.each(["openai/gpt-test", "custom/saved", "bedrock/model", "Anthropic/model"])(
    "does not invent a count_tokens route for %s",
    async (model) => {
      const f = await fixture();
      const result = await request(f.config, "/v1/messages/count_tokens", {
        body: JSON.stringify({ model }),
      });
      expect(result.status).toBe(501);
      expect(result.body).toBe("count_tokens is supported only for Anthropic models");
      expect(f.token).not.toHaveBeenCalled();
      expect(f.targets).toHaveLength(0);
    },
  );
});

describe("streaming and cancellation", () => {
  it.each([true, false])(
    "buffers JSON and preserves SSE in subscription mode %s",
    async (useClaudeSubscription) => {
      let finish!: () => void;
      const first = 'event: message_start\ndata: {"type":"message_start"}\n\n';
      const last = 'event: message_stop\ndata: {"type":"message_stop"}\n\n';
      const f = await fixture(
        (req, res) => {
          req.resume();
          req.on("end", () => {
            finish = () => res.end(last);
            res.writeHead(200, { "content-type": "text/event-stream" });
            res.write(first);
          });
        },
        undefined,
        { useClaudeSubscription },
      );
      const req = http.request({
        hostname: "127.0.0.1",
        port: f.config.port,
        path: "/v1/messages",
        method: "POST",
        headers: {
          [KEY_HEADER]: base.secret,
          ...(useClaudeSubscription ? { authorization: nativeAuthorization } : {}),
        },
      });
      req.write('{"model":');
      await vi.waitFor(() => expect(f.sessions.active).toBe(1));
      expect(f.token).not.toHaveBeenCalled();
      expect(f.targets).toHaveLength(0);
      const response = once(req, "response");
      req.end('"claude-test","stream":true}');
      const [res] = (await response) as [http.IncomingMessage];
      const [chunk] = await once(res, "data");
      expect(String(chunk)).toBe(first);
      expect(res.headers["content-type"]).toBe("text/event-stream");
      let rest = "";
      res.on("data", (chunk) => (rest += chunk));
      const ended = once(res, "end");
      finish();
      await ended;
      expect(rest).toBe(last);
    },
  );
  it("releases a cancelled partial JSON upload without acquiring a token", async () => {
    const f = await fixture();
    const req = http.request({
      hostname: "127.0.0.1",
      port: f.config.port,
      path: "/v1/messages",
      method: "POST",
      headers: { [KEY_HEADER]: base.secret, authorization: nativeAuthorization },
    });
    req.on("error", () => {});
    req.write('{"model":"claude-test","messages":[');
    await vi.waitFor(() => expect(f.sessions.active).toBe(1));
    req.destroy();
    await vi.waitFor(() => expect(f.sessions.active).toBe(0));
    expect(f.token).not.toHaveBeenCalled();
    expect(f.targets).toHaveLength(0);
  });

  it("cancels upstream on downstream disconnect and releases active tracking", async () => {
    let resolveClosed!: () => void;
    const closed = new Promise<void>((r) => (resolveClosed = r));
    const f = await fixture((_req, res) => {
      res.on("close", resolveClosed);
      res.writeHead(200);
      res.write("first");
    });
    const req = http.request({
      hostname: "127.0.0.1",
      port: f.config.port,
      path: "/v1/messages",
      method: "POST",
      headers: { [KEY_HEADER]: base.secret, authorization: nativeAuthorization },
    });
    req.end('{"model":"claude-test"}');
    const [res] = (await once(req, "response")) as [http.IncomingMessage];
    expect(f.sessions.active).toBe(1);
    res.destroy();
    await closed;
    expect(f.sessions.active).toBe(0);
  });
  it("does not forward a request cancelled while waiting for token", async () => {
    let resolveToken!: (s: string) => void, started!: () => void;
    const loading = new Promise<void>((r) => (started = r));
    const f = await fixture(
      undefined,
      vi.fn(() => {
        started();
        return new Promise<string>((r) => (resolveToken = r));
      }),
    );
    const req = http.request({
      hostname: "127.0.0.1",
      port: f.config.port,
      path: "/v1/messages",
      method: "POST",
      headers: { [KEY_HEADER]: base.secret, authorization: nativeAuthorization },
    });
    req.on("error", () => {});
    req.end('{"model":"claude-test"}');
    await loading;
    req.destroy();
    await vi.waitFor(() => expect(f.sessions.active).toBe(0));
    resolveToken(jwt());
    await new Promise((r) => setTimeout(r, 20));
    expect(f.targets).toHaveLength(0);
  });
  it("drains an active response gracefully without cutting it off", async () => {
    let finish!: () => void;
    const f = await fixture((_req, res) => {
      finish = () => res.end("last");
      res.write("first");
    });
    const result = request(f.config);
    await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
    f.drain();
    expect(f.sessions.active).toBe(1);
    finish();
    expect((await result).body).toBe("firstlast");
  });
});

describe("tokens (only fake executables; no credentials or gateway traffic)", () => {
  it("singleflights and expires its single bounded cache entry", async () => {
    let now = 100_000,
      resolve!: (s: string) => void;
    const load = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const cache = new TokenCache(load, () => now);
    const pending = Array.from({ length: 20 }, () => cache.get());
    expect(load).toHaveBeenCalledTimes(1);
    resolve(jwt(400));
    await Promise.all(pending);
    await cache.get();
    expect(load).toHaveBeenCalledTimes(1);
    now += 60_001;
    const next = cache.get();
    expect(load).toHaveBeenCalledTimes(2);
    resolve(jwt(500));
    await next;
  });
  it("negative caches failure and rejects expired/malformed tokens", async () => {
    let now = 100_000;
    const load = vi.fn(async () => jwt(99));
    const cache = new TokenCache(load, () => now);
    await expect(cache.get()).rejects.toThrow("LangSmith token unavailable");
    await expect(cache.get()).rejects.toThrow("LangSmith token unavailable");
    expect(load).toHaveBeenCalledTimes(1);
    now += 2001;
    await expect(cache.get()).rejects.toThrow();
    expect(load).toHaveBeenCalledTimes(2);
    await expect(new TokenCache(async () => "invalid").get()).rejects.toThrow(
      "LangSmith token unavailable",
    );
  });
  it("reads updated credentials on a new lookup after the negative cache expires", async () => {
    let now = 100_000;
    const token = jwt(400);
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("Login required"))
      .mockResolvedValue(token);
    const cache = new TokenCache(load, () => now);
    await expect(cache.get()).rejects.toThrow("LangSmith token unavailable");
    now += 1999;
    await expect(cache.get()).rejects.toThrow("LangSmith token unavailable");
    expect(load).toHaveBeenCalledTimes(1);
    now += 1;
    expect(load).toHaveBeenCalledTimes(1); // No automatic retry of failed work.
    await expect(cache.get()).resolves.toBe(token);
    expect(load).toHaveBeenCalledTimes(2);
  });
  it("pins executable/arguments and sanitizes environment and stdout", async () => {
    const dir = temporary(),
      cli = join(dir, "fake-cli"),
      args = join(dir, "args.json"),
      token = jwt();
    writeFileSync(
      cli,
      `#!${process.execPath}\nrequire('fs').writeFileSync(${JSON.stringify(args)},JSON.stringify({args:process.argv.slice(2),env:process.env}));process.stdout.write(${JSON.stringify(token + "\n")});`,
      { mode: 0o700 },
    );
    const urls = { apiUrl: "https://api.preview.test", gatewayUrl: "https://gateway.preview.test" };
    expect(await cliToken({ ...base, cli, ...urls })).toBe(token);
    const captured = JSON.parse(readFileSync(args, "utf8"));
    expect(captured.args).toEqual([
      "--profile",
      "test",
      "--api-url",
      urls.apiUrl,
      "--format=pretty",
      "auth",
      "token",
    ]);
    expect(captured.env.ANTHROPIC_CUSTOM_HEADERS).toBeUndefined();
    expect(captured.env.LANGSMITH_API_KEY).toBeUndefined();
    expect(captured.env.NODE_OPTIONS).toBeUndefined();
  });
  it("hard kills a hung CLI and hides stderr/nonzero output", async () => {
    const cli = join(temporary(), "fake-cli");
    writeFileSync(
      cli,
      `#!${process.execPath}\nprocess.stderr.write('private-secret');setInterval(()=>{},1000);`,
      { mode: 0o700 },
    );
    const start = Date.now();
    await expect(cliToken({ ...base, cli }, 100)).rejects.toThrow(/^LangSmith token unavailable$/);
    expect(Date.now() - start).toBeLessThan(2000);
    writeFileSync(
      cli,
      `#!${process.execPath}\nprocess.stdout.write('private-secret');process.exit(1);`,
    );
    await expect(cliToken({ ...base, cli })).rejects.toThrow(/^LangSmith token unavailable$/);
  });
});

function provisionGlobal(home: string, config: ProxyConfig) {
  writeFileSync(
    join(home, ".claude/settings.json"),
    JSON.stringify({
      env: {
        ANTHROPIC_BASE_URL: `http://127.0.0.1:${config.port}`,
        ANTHROPIC_CUSTOM_HEADERS: `X-LangSmith-Proxy-Key: ${config.secret}`,
      },
    }),
    { mode: 0o600 },
  );
}

describe("shared lifecycle and explicit configuration", () => {
  it("health and session registration stay fast without authentication; removed auth-check is inert", async () => {
    const token = vi.fn(async (): Promise<string> => {
      throw new Error("Must not acquire tokens");
    });
    const f = await fixture(undefined, token);
    const started = performance.now();
    await ensure(f.config, "/must-not-spawn");
    await control(f.config, "PUT", "/_langsmith/sessions/no-login");
    expect(performance.now() - started).toBeLessThan(1000);
    expect((await request(f.config, "/_langsmith/auth-check", { body: "" })).status).toBe(404);
    expect(token).not.toHaveBeenCalled();
    expect(f.targets).toHaveLength(0);
  });
  it("registers idempotently, releases only one session, authenticates controls", async () => {
    const f = await fixture();
    expect(await control(f.config, "GET", "/_langsmith/health")).toBe(identity(f.config));
    await control(f.config, "PUT", "/_langsmith/sessions/one");
    await control(f.config, "PUT", "/_langsmith/sessions/two");
    await control(f.config, "PUT", "/_langsmith/sessions/two");
    await control(f.config, "DELETE", "/_langsmith/sessions/one");
    expect([...f.sessions.leases.keys()]).toEqual(["two"]);
    expect(f.sessions.idle()).toBe(false);
    expect(
      (
        await request({ ...f.config, secret: "bad" }, "/_langsmith/sessions/two", {
          method: "DELETE",
        })
      ).status,
    ).toBe(401);
    expect([...f.sessions.leases.keys()]).toEqual(["two"]);
    expect(f.token).not.toHaveBeenCalled();
  });
  it.each([true, false])(
    "private-config-only hooks preserve saved mode %s, with auth deferred to requests",
    async (savedMode) => {
      const f = await fixture(undefined, undefined, { useClaudeSubscription: savedMode });
      const controls: string[] = [];
      f.server.on("request", (req) => controls.push(`${req.method} ${req.url}`));
      const home = temporary();
      mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
      const path = join(configDir(home), "config.json");
      const before = JSON.stringify({ ...f.config, useClaudeSubscription: savedMode });
      writeFileSync(path, before, { mode: 0o600 });
      // No ordinary routing files: routing may be supplied by Claude managed settings.
      writeFileSync(
        join(configDir(home), "settings-ownership.json"),
        "malformed synthetic-private",
        { mode: 0o600 },
      );
      await gatewayHook("SessionStart", "one", "/must-not-spawn", home);
      await gatewayHook("SessionStart", "two", "/must-not-spawn", home);
      await gatewayHook("UserPromptSubmit", "two", "/must-not-spawn", home);
      await gatewayHook("SessionEnd", "one", "/must-not-spawn", home);
      expect([...f.sessions.leases.keys()]).toEqual(["two"]);
      expect(controls).toEqual([
        "GET /_langsmith/health",
        "PUT /_langsmith/sessions/one",
        "GET /_langsmith/health",
        "PUT /_langsmith/sessions/two",
        "GET /_langsmith/health",
        "PUT /_langsmith/sessions/two",
        "DELETE /_langsmith/sessions/one",
      ]);
      expect(loadConfig(home)?.useClaudeSubscription).toBe(savedMode);
      expect(readFileSync(path, "utf8")).toBe(before);
      expect(f.token).not.toHaveBeenCalled();
      await request(f.config);
      await request(f.config);
      expect(f.token).toHaveBeenCalledTimes(1);
    },
  );
  describe.each(["SessionStart", "UserPromptSubmit"])("%s startup", (event) => {
    it.each(["absent", "malformed", "conflicting"])(
      "starts from enabled private config with %s ordinary routing, without settings precedence",
      async (routing) => {
        const f = await fixture();
        const closed = once(f.server, "close");
        f.drain();
        await closed;
        const home = temporary();
        mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
        const path = join(configDir(home), "config.json");
        const before = JSON.stringify(f.config);
        writeFileSync(path, before, { mode: 0o600 });
        const cwd = join(home, "project");
        mkdirSync(join(cwd, ".claude"), { recursive: true, mode: 0o700 });
        const paths = [
          join(home, ".claude/settings.json"),
          join(cwd, ".claude/settings.json"),
          join(cwd, ".claude/settings.local.json"),
        ];
        const text =
          routing === "malformed"
            ? "{"
            : JSON.stringify({
                enabled: false,
                useClaudeSubscription: !f.config.useClaudeSubscription,
                gatewayUrl: "https://project-selected.invalid",
                env: { ANTHROPIC_BASE_URL: "https://other.invalid" },
              });
        if (routing !== "absent")
          for (const target of paths) writeFileSync(target, text, { mode: 0o600 });
        // The absent case represents managed-only routing. No managed policy fixture
        // or parser is needed: hooks only consume the enabled private config.
        const daemon = createProxy(f.config, { token: f.token });
        cleanup.push(() => daemon.drain());
        const unref = vi.fn();
        const spawn = vi.spyOn(childProcess, "spawn").mockImplementation(() => {
          daemon.server.listen({ host: "127.0.0.1", port: f.config.port, exclusive: true });
          return { on: vi.fn(), unref } as unknown as childProcess.ChildProcess;
        });
        const output = vi.fn();
        try {
          await handleGatewayInput(
            { hook_event_name: event, session_id: "managed-only", cwd, prompt: "hello" },
            "/fake/gateway.js",
            {},
            home,
            output,
          );
          expect(spawn).toHaveBeenCalledExactlyOnceWith(
            process.execPath,
            ["/fake/gateway.js", "daemon"],
            expect.objectContaining({ detached: true, stdio: "ignore" }),
          );
          expect(unref).toHaveBeenCalledOnce();
          expect([...daemon.sessions.leases.keys()]).toEqual(["managed-only"]);
          expect(f.token).not.toHaveBeenCalled();
          expect(output).not.toHaveBeenCalled();
          expect(readFileSync(path, "utf8")).toBe(before);
          for (const target of paths) {
            if (routing === "absent") expect(() => readFileSync(target)).toThrow();
            else expect(readFileSync(target, "utf8")).toBe(text);
          }
        } finally {
          spawn.mockRestore();
        }
      },
    );
  });
  it("rejects delayed PUT after DELETE, including an end before registration", async () => {
    const f = await fixture();
    await control(f.config, "PUT", "/_langsmith/sessions/existing");
    for (const id of ["existing", "not-yet-registered"]) {
      await control(f.config, "DELETE", `/_langsmith/sessions/${id}`);
      await control(f.config, "DELETE", `/_langsmith/sessions/${id}`);
      await expect(control(f.config, "PUT", `/_langsmith/sessions/${id}`)).rejects.toThrow();
    }
    expect(f.sessions.leases.size).toBe(0);
    await control(f.config, "PUT", "/_langsmith/sessions/other");
    expect([...f.sessions.leases.keys()]).toEqual(["other"]);
    expect(f.token).not.toHaveBeenCalled();
  });
  it("sends SessionEnd DELETE without a health precondition or spawning", async () => {
    const methods: string[] = [];
    const config = { ...base };
    const server = http.createServer((req, res) => {
      methods.push(req.method!);
      // A health gate would fail, even though DELETE can be accepted.
      res.writeHead(req.method === "DELETE" ? 204 : 503);
      res.end();
    });
    config.port = await listen(server);
    const home = temporary();
    mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
    writeFileSync(join(configDir(home), "config.json"), JSON.stringify(config), { mode: 0o600 });
    // End still releases a lease after routing settings have been removed.
    await gatewayHook("SessionEnd", "one", "/must-not-spawn", home);
    expect(methods).toEqual(["DELETE"]);
  });
  it("expires end markers without letting rejected registrations defer idle cleanup", () => {
    let now = 0;
    const s = new Sessions(() => now, 100, 10);
    s.release("one");
    now = 11;
    expect(s.register("one")).toBe(false);
    expect(s.idle()).toBe(true);
    now = 99;
    expect(s.register("one")).toBe(false);
    now = 100;
    expect(s.register("one")).toBe(true);
  });
  it("bounds end markers to 512 most recently ended IDs, including repeated ends", () => {
    const s = new Sessions(() => 0);
    for (let i = 0; i < 512; i++) s.release(String(i));
    for (let i = 0; i < 512; i++) expect(s.register(String(i))).toBe(false);
    s.release("0"); // Refresh its position without consuming another slot.
    s.release("extra");
    expect(s.register("0")).toBe(false);
    expect(s.register("extra")).toBe(false);
    expect(s.register("1")).toBe(true); // Oldest end evicted to keep the map bounded.
    expect(s.register("2")).toBe(false);
  });
  it("leases expire after crashes, activity prevents idle cleanup, and sessions are bounded", () => {
    let now = 0;
    const s = new Sessions(() => now, 100, 10);
    s.register("one");
    now = 50;
    expect(s.idle()).toBe(false);
    s.begin();
    now = 200;
    expect(s.idle()).toBe(false);
    s.end();
    expect(s.idle()).toBe(false);
    now += 11;
    expect(s.idle()).toBe(true);
    for (let i = 0; i < 512; i++) expect(s.register(String(i))).toBe(true);
    expect(s.register("extra")).toBe(false);
    expect(s.register("0")).toBe(true);
  });
  it("uses OS exclusive bind as a race-safe startup lock and can recover after close", async () => {
    const f = await fixture();
    const competing = createProxy(f.config);
    competing.server.listen({ host: "127.0.0.1", port: f.config.port, exclusive: true });
    const [err] = await once(competing.server, "error");
    expect(err.code).toBe("EADDRINUSE");
    competing.drain();
    const closed = once(f.server, "close");
    f.drain();
    await closed;
    const recovered = createProxy(f.config);
    recovered.server.listen({ host: "127.0.0.1", port: f.config.port, exclusive: true });
    await once(recovered.server, "listening");
    cleanup.push(() => recovered.drain());
    expect(await control(f.config, "GET", "/_langsmith/health")).toBe(identity(f.config));
  });
  it("refuses to reuse an older forwarding daemon without killing its listener", async () => {
    const config = { ...base };
    const oldIdentity = () =>
      createHash("sha256")
        .update(
          JSON.stringify([
            3,
            config.cli,
            config.profile,
            config.port,
            config.secret,
            "https://gateway.smith.langchain.com/anthropic",
          ]),
        )
        .digest("hex");
    const server = http.createServer((_req, res) => res.end(oldIdentity()));
    config.port = await listen(server);
    expect(await control(config, "GET", "/_langsmith/health")).not.toBe(identity(config));
    // Candidate exits without touching real config or credentials; the foreign
    // listener must remain alive and never count as a compatible daemon.
    const entry = join(temporary(), "candidate.cjs");
    writeFileSync(entry, "process.exit(0)");
    await expect(ensure(config, entry)).rejects.toThrow("Local proxy unavailable");
    expect(await control(config, "GET", "/_langsmith/health")).toBe(oldIdentity());
  }, 10_000);

  it("waits for old active work to drain and leaves an occupied listener alone", async () => {
    let finish!: () => void;
    const f = await fixture((_req, res) => {
      finish = () => res.end("last");
      res.write("first");
    });
    const result = request(f.config);
    await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
    f.drain();
    await expect(waitForStopped(f.config, 100)).rejects.toThrow("still draining");
    expect(f.server.listening).toBe(true);
    expect((await request(f.config)).status).toBe(503);
    finish();
    expect((await result).body).toBe("firstlast");
    await waitForStopped(f.config, 2000);
    const next = {
      ...f.config,
      apiUrl: "https://api.preview.test",
      gatewayUrl: "https://gateway.preview.test",
    };
    const replacement = createProxy(next, { token: async () => jwt() });
    replacement.server.listen({ host: "127.0.0.1", port: next.port, exclusive: true });
    await once(replacement.server, "listening");
    cleanup.push(() => replacement.drain());
    expect(await control(next, "GET", "/_langsmith/health")).toBe(identity(next));
    expect(identity(next)).not.toBe(identity(f.config));
  });
  it("loads production endpoint defaults and invalidates identity on either normalized endpoint change", () => {
    const home = temporary();
    mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
    const file = join(configDir(home), "config.json");
    const save = (c: unknown) => writeFileSync(file, JSON.stringify(c), { mode: 0o600 });
    save(base);
    expect(loadConfig(home)).toEqual({ ...base, apiUrl: API_URL, gatewayUrl: UPSTREAM });
    expect(identity(loadConfig(home)!)).toBe(identity(base));
    const urls = { apiUrl: "https://api.preview.test", gatewayUrl: "https://gateway.preview.test" };
    save({ ...base, ...urls });
    const preview = loadConfig(home)!;
    expect(identity(preview)).not.toBe(identity(base));
    expect(identity({ ...preview, apiUrl: "https://another.preview.test" })).not.toBe(
      identity(preview),
    );
    expect(identity({ ...preview, gatewayUrl: "https://another.preview.test" })).not.toBe(
      identity(preview),
    );
    expect(identity({ ...preview, gatewayUrl: "https://GATEWAY.preview.test:443/" })).toBe(
      identity(preview),
    );
    for (const invalid of [
      { apiUrl: urls.apiUrl },
      { gatewayUrl: urls.gatewayUrl },
      { ...urls, apiUrl: "http://api.preview.test" },
      { ...urls, gatewayUrl: "https://gateway.preview.test/gateway" },
      { ...urls, apiUrl: "https://user:secret@api.preview.test" },
      { ...urls, gatewayUrl: "https://gateway.preview.test?x=y" },
    ]) {
      save({ ...base, ...invalid });
      expect(() => loadConfig(home)).toThrow();
    }
    expect(endpoints(base)).toEqual({ apiUrl: API_URL, gatewayUrl: UPSTREAM });
  });
  it.each(["absent", "matching"])(
    "no-ops missing/disabled private config with %s routing and arbitrary tracing files",
    async (routing) => {
      const f = await fixture();
      const controls: string[] = [];
      f.server.on("request", (req) => controls.push(`${req.method} ${req.url}`));
      const home = temporary();
      writeFileSync(
        join(home, ".langsmith-plugins.json"),
        '{"enabled":true,"proxy":{"enabled":true}}',
      );
      mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
      if (routing === "matching") provisionGlobal(home, f.config);
      const spawn = vi.spyOn(childProcess, "spawn").mockImplementation(() => {
        throw new Error("Must not spawn");
      });
      try {
        for (const state of ["missing", "disabled"]) {
          if (state === "disabled")
            writeFileSync(
              join(configDir(home), "config.json"),
              JSON.stringify({ ...f.config, enabled: false }),
              { mode: 0o600 },
            );
          for (const event of ["SessionStart", "UserPromptSubmit", "SessionEnd"])
            await gatewayHook(event, "one", "/not-an-entry", home);
          expect(loadConfig(home)).toBeUndefined();
        }
        expect(loadConfig(home, true)?.enabled).toBe(false);
        expect(spawn).not.toHaveBeenCalled();
        expect(controls).toEqual([]);
        expect(f.sessions.leases.size).toBe(0);
        expect(f.token).not.toHaveBeenCalled();
      } finally {
        spawn.mockRestore();
      }
    },
  );
  it("ignores unsupported events and invalid sessions with enabled private config", async () => {
    const f = await fixture();
    const controls: string[] = [];
    f.server.on("request", (req) => controls.push(`${req.method} ${req.url}`));
    const home = temporary();
    mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
    writeFileSync(join(configDir(home), "config.json"), JSON.stringify(f.config), { mode: 0o600 });
    const spawn = vi.spyOn(childProcess, "spawn").mockImplementation(() => {
      throw new Error("Must not spawn");
    });
    try {
      for (const event of [undefined, "Stop", "PreToolUse"])
        await gatewayHook(event, "valid", "/not-an-entry", home);
      for (const event of ["SessionStart", "UserPromptSubmit", "SessionEnd"])
        for (const session of [undefined, null, 1, "", "../invalid", "a".repeat(129)])
          await gatewayHook(event, session, "/not-an-entry", home);
      expect(spawn).not.toHaveBeenCalled();
      expect(controls).toEqual([]);
      expect(f.sessions.leases.size).toBe(0);
    } finally {
      spawn.mockRestore();
    }
  });
  it.each([null, "", 1, true, {}, [], "bad profile", "a".repeat(129)])(
    "rejects invalid optional profiles %j during creation and loading, even disabled",
    (profile) => {
      const home = temporary();
      expect(() => createConfig(process.execPath, profile as string, 19991, home)).toThrow(
        "Invalid setup arguments",
      );
      mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
      for (const enabled of [true, false]) {
        writeFileSync(
          join(configDir(home), "config.json"),
          JSON.stringify({ ...base, enabled, profile }),
          { mode: 0o600 },
        );
        for (const includeDisabled of [true, false])
          expect(() => loadConfig(home, includeDisabled)).toThrow("Invalid proxy configuration");
      }
    },
  );
  it("fingerprints omitted profiles consistently without reusing explicit-profile daemons", () => {
    const { profile: _profile, ...config } = base;
    expect(identity(config)).toBe(identity({ ...config, profile: undefined }));
    expect(identity(config)).toBe(identity(JSON.parse(JSON.stringify(config))));
    expect(identity(config)).not.toBe(identity(base));
    expect(identity(config)).not.toBe(identity({ ...base, profile: "claude-gateway" }));
  });
  it("omits the profile flag from default-profile login diagnostics", () => {
    const guidance = loginGuidance({ ...base, profile: undefined });
    expect(guidance).toContain(`with: --api-url ${API_URL} auth login.`);
    expect(guidance).not.toContain("undefined");
    expect(guidance).not.toContain("--profile undefined");
    expect(guidance).toContain("saved OAuth issuer");
  });
  it("internal config creation produces private explicit config without overwriting or exposing secrets", () => {
    const home = temporary();
    createConfig(process.execPath, "test", 19991, home);
    const path = join(configDir(home), "config.json"),
      config = loadConfig(home)!;
    expect(statSync(path).mode & 0o777).toBe(0o600);
    expect(config.secret).toHaveLength(64);
    expect(config.useClaudeSubscription).toBe(false);
    expect(JSON.parse(readFileSync(path, "utf8")).useClaudeSubscription).toBe(false);
    expect(() => createConfig(process.execPath, "test", 19991, home)).toThrow();
    chmodSync(path, 0o644);
    expect(() => loadConfig(home)).toThrow("Unsafe proxy configuration");
  });
  it("does not accept arbitrary upstream configuration", () => {
    const home = temporary();
    mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
    writeFileSync(
      join(configDir(home), "config.json"),
      JSON.stringify({ ...base, upstream: "https://evil.test" }),
      { mode: 0o600 },
    );
    expect(() => loadConfig(home)).toThrow("Invalid proxy configuration");
  });
});

it.each([
  undefined,
  "Basic arbitrary",
  nativeAuthorization,
  ["Bearer arbitrary", nativeAuthorization],
])(
  "OAuth-only accepts no native auth or adversarial auth %j and strips it",
  async (authorization) => {
    let received: http.IncomingHttpHeaders = {},
      body = "";
    const token = jwt();
    const f = await fixture(
      (req, res) => {
        received = req.headers;
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => res.end("ok"));
      },
      vi.fn(async () => token),
      { useClaudeSubscription: false },
    );
    expect(
      (
        await request(f.config, undefined, {
          headers: {
            authorization,
            "x-api-key": "evil",
            "x-langsmith-anthropic-passthrough": native,
            "proxy-authorization": "evil",
            "x-auth-source": "evil",
            "x-auth-token": "evil",
            "gateway-key": "evil",
            "x-langsmith-auth-mode": "evil",
            "anthropic-version": "2023-06-01",
            connection: "authorization, x-langsmith-anthropic-passthrough",
          },
        })
      ).status,
    ).toBe(200);
    expect(received.authorization).toBe(`Bearer ${token}`);
    for (const key of [
      KEY_HEADER,
      "x-api-key",
      "x-langsmith-anthropic-passthrough",
      "proxy-authorization",
      "x-auth-source",
      "x-auth-token",
      "gateway-key",
      "x-langsmith-auth-mode",
    ])
      expect(received[key]).toBeUndefined();
    expect(received["anthropic-version"]).toBe("2023-06-01");
    expect(JSON.parse(body).model).toBe("anthropic/claude-test");
    expect(f.token).toHaveBeenCalledTimes(1);
  },
);

it("OAuth-only still enforces local key, Host, Origin and JSON before CLI acquisition", async () => {
  const f = await fixture(undefined, undefined, { useClaudeSubscription: false });
  for (const [headers, status] of [
    [{ [KEY_HEADER]: "" }, 401],
    [{ host: "evil.test" }, 403],
    [{ origin: "https://evil.test" }, 403],
  ] as const)
    expect(
      (await request(f.config, undefined, { headers: { ...headers, authorization: undefined } }))
        .status,
    ).toBe(status);
  expect(
    (await request(f.config, undefined, { body: "invalid", headers: { authorization: undefined } }))
      .status,
  ).toBe(400);
  expect(f.token).not.toHaveBeenCalled();
});

it("validates the private boolean and fingerprints the mode", () => {
  const home = temporary();
  mkdirSync(configDir(home), { recursive: true, mode: 0o700 });
  const path = join(configDir(home), "config.json");
  for (const value of [undefined, null, "false", 0, 1, {}, []]) {
    writeFileSync(path, JSON.stringify({ ...base, useClaudeSubscription: value }), { mode: 0o600 });
    expect(() => loadConfig(home)).toThrow("Invalid proxy configuration");
  }
  expect(identity({ ...base, useClaudeSubscription: false })).not.toBe(identity(base));
});

it("cancels an in-flight fake credential child on daemon drain before releasing its port", async () => {
  const home = temporary();
  const marker = join(home, "started"),
    cli = join(home, "cli");
  writeFileSync(
    cli,
    `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)}, String(process.pid)); setInterval(() => {}, 1000);`,
    { mode: 0o700 },
  );
  const config = { ...base, cli, useClaudeSubscription: false };
  const proxy = createProxy(config);
  config.port = await listen(proxy.server);
  const response = request(config, undefined, { headers: { authorization: undefined } });
  const deadline = Date.now() + 3000;
  while (
    !(() => {
      try {
        return readFileSync(marker, "utf8");
      } catch {
        return false;
      }
    })()
  ) {
    if (Date.now() > deadline) throw new Error("Fake CLI did not start");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  const pid = Number(readFileSync(marker, "utf8"));
  const closed = once(proxy.server, "close");
  proxy.drain();
  expect((await response).status).toBe(503);
  await closed;
  expect(() => process.kill(pid, 0)).toThrow();
});

import { vi } from "vitest";
import http from "node:http";
import type https from "node:https";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProxy } from "../server.js";
import { KEY_HEADER } from "../proxy-constants.js";
import type { ProxyConfig } from "../proxy-models.js";
import { cleanup, listen } from "./server-sandbox.js";

export const native = `sk-ant-oat01-${"test_native-".repeat(8)}`;
export const nativeAuthorization = `Bearer ${native}`;
export const jwt = (exp = Date.now() / 1000 + 300) =>
  `e30.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.signature`;
export const base: ProxyConfig = {
  enabled: true,
  useClaudeSubscription: true,
  profile: "test",
  port: 19991,
  secret: "a".repeat(64),
};
export function temporary() {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "ls-proxy-test-")));
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
export function saveLogin(home: string, profile: Record<string, unknown>) {
  mkdirSync(join(home, ".langsmith"), { mode: 0o700 });
  writeFileSync(
    join(home, ".langsmith", "config.json"),
    JSON.stringify({ profiles: { [base.profile!]: profile } }),
    { mode: 0o600 },
  );
}
export async function tokenServer(respond = true) {
  const refreshes: string[] = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      if (req.method !== "POST") return void res.writeHead(404).end();
      refreshes.push(new URLSearchParams(body).get("refresh_token") ?? "");
      if (respond)
        res.end(
          JSON.stringify({
            access_token: jwt(Date.now() / 1000 + 3600),
            refresh_token: `rotated-${refreshes.length}`,
            expires_in: 3600,
          }),
        );
    });
  });
  return { url: `http://127.0.0.1:${await listen(server)}`, refreshes };
}
export async function fixture(
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
export function request(
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

export function provisionGlobal(home: string, config: ProxyConfig) {
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

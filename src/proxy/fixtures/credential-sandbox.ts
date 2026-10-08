import http from "node:http";
import type https from "node:https";
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProxy, identity } from "../server.js";
import { KEY_HEADER } from "../proxy-constants.js";
import type { ProxyConfig } from "../proxy-models.js";
import { parseSetupArgs } from "../options.js";
import { enable } from "../settings.js";
import { cleanup, listen } from "./server-sandbox.js";

export const WORKSPACE = "f4c7e130-165b-471d-bdd3-5f0fc7a6a012";
const EXPIRY = Math.floor(Date.now() / 1000) + 3600;
export const unexpiredToken = (suffix: string) =>
  `e30.${Buffer.from(JSON.stringify({ exp: EXPIRY, suffix })).toString("base64url")}.sig`;
export const base: ProxyConfig = {
  enabled: true,
  useClaudeSubscription: false,
  cli: "/unused/langsmith",
  port: 19991,
  secret: "a".repeat(64),
};
export function temporary() {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "ls-credential-test-")));
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
export function tokenFile(contents: string) {
  const path = join(temporary(), "identity.jwt");
  writeFileSync(path, contents, { mode: 0o600 });
  return path;
}
export async function fixture(extra: Partial<ProxyConfig> = {}) {
  const seen: http.IncomingHttpHeaders[] = [];
  const upstream = http.createServer((req, res) => {
    seen.push(req.headers);
    res.end("ok");
  });
  const upstreamPort = await listen(upstream);
  const transport = ((options: https.RequestOptions, cb: (r: http.IncomingMessage) => void) =>
    http.request(
      { ...options, protocol: "http:", hostname: "127.0.0.1", port: upstreamPort },
      cb,
    )) as typeof https.request;
  const config = { ...base, ...extra };
  const neverTheCli = async () => unexpiredToken("from-cli");
  const proxy = createProxy(config, { transport, token: neverTheCli });
  config.port = await listen(proxy.server);
  return { config, seen };
}
export function send(c: ProxyConfig, headers: http.OutgoingHttpHeaders = {}) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: c.port,
        path: "/v1/models",
        method: "GET",
        headers: { [KEY_HEADER]: c.secret, host: `127.0.0.1:${c.port}`, ...headers },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}
export function savedConfig(extra: Record<string, unknown>) {
  const dir = temporary();
  const directory = join(dir, ".claude", "langsmith-proxy");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(join(dir, ".claude"), 0o700);
  chmodSync(directory, 0o700);
  const path = join(directory, "config.json");
  writeFileSync(path, JSON.stringify({ ...base, cli: "/bin/sh", ...extra }), { mode: 0o600 });
  chmodSync(path, 0o600);
  return dir;
}
export const setup = (args: string) => parseSetupArgs(["--scope", "global", ...args.split(" ")]);
export const SAVED_COMMAND = "cat /tmp/t.jwt";
// A listener answering health lets enable() finish without waiting on a real daemon.
export async function existingInstall(extra: Record<string, unknown> = {}) {
  let config = base;
  const health = http.createServer((_req, res) => res.end(identity(config)));
  const port = await listen(health);
  config = {
    ...base,
    cli: "/bin/sh",
    port,
    credentialCommand: SAVED_COMMAND,
    workspaceId: WORKSPACE,
    ...extra,
  } as ProxyConfig;
  const home = temporary();
  const directory = join(home, ".claude", "langsmith-proxy");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(join(home, ".claude"), 0o700);
  chmodSync(directory, 0o700);
  const path = join(directory, "config.json");
  writeFileSync(path, JSON.stringify(config), { mode: 0o600 });
  chmodSync(path, 0o600);
  const entry = join(home, "entry.mjs");
  writeFileSync(entry, "", { mode: 0o600 });
  const run = (args: string) =>
    enable(entry, `--scope global --port ${port} ${args}`.trim().split(/ +/), {}, home, home);
  return { home, path, run };
}

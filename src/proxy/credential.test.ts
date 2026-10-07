import { afterEach, describe, expect, it } from "vitest";
import http from "node:http";
import type https from "node:https";
import { once } from "node:events";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProxy, identity } from "./server.js";
import { configDir, loadConfig } from "./config.js";
import { KEY_HEADER } from "./proxy-constants.js";
import type { ProxyConfig } from "./proxy-models.js";
import { parseSetupArgs } from "./options.js";
import { enable } from "./settings.js";
import { createConfig } from "./setup.js";

const WORKSPACE = "f4c7e130-165b-471d-bdd3-5f0fc7a6a012";
const EXPIRY = Math.floor(Date.now() / 1000) + 3600;
const unexpiredToken = (suffix: string) =>
  `e30.${Buffer.from(JSON.stringify({ exp: EXPIRY, suffix })).toString("base64url")}.sig`;
const base: ProxyConfig = {
  enabled: true,
  useClaudeSubscription: false,
  cli: "/unused/langsmith",
  port: 19991,
  secret: "a".repeat(64),
};
const cleanup: (() => void)[] = [];
afterEach(() => {
  for (const f of cleanup.splice(0).reverse()) f();
});
function temporary() {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "ls-credential-test-")));
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function tokenFile(contents: string) {
  const path = join(temporary(), "identity.jwt");
  writeFileSync(path, contents, { mode: 0o600 });
  return path;
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
async function fixture(extra: Partial<ProxyConfig> = {}) {
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
function send(c: ProxyConfig, headers: http.OutgoingHttpHeaders = {}) {
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
function savedConfig(extra: Record<string, unknown>) {
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
const setup = (args: string) => parseSetupArgs(["--scope", "global", ...args.split(" ")]);
const SAVED_COMMAND = "cat /tmp/t.jwt";
// A listener answering health lets enable() finish without waiting on a real daemon.
async function existingInstall(extra: Record<string, unknown> = {}) {
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

describe("credential command", () => {
  it("sends the configured workspace id", async () => {
    const { config, seen } = await fixture({
      credentialCommand: `cat ${tokenFile(unexpiredToken("x"))}`,
      workspaceId: WORKSPACE,
    });
    expect((await send(config)).status).toBe(200);
    expect(seen[0]["x-tenant-id"]).toBe(WORKSPACE);
  });

  it("re-runs the command once the cache window passes", async () => {
    const path = tokenFile(unexpiredToken("first"));
    const { config, seen } = await fixture({
      credentialCommand: `cat ${path}`,
      credentialTtlMs: 1000,
    });
    expect((await send(config)).status).toBe(200);
    writeFileSync(path, unexpiredToken("second"), { mode: 0o600 });
    await new Promise((r) => setTimeout(r, 1100));
    expect((await send(config)).status).toBe(200);
    expect(seen[1].authorization).toBe(`Bearer ${unexpiredToken("second")}`);
  });

  it.each([
    ["a non-zero exit even when a token was printed", `echo ${unexpiredToken("ignored")}; exit 7`],
    ["output that is not shaped like a bearer token", `echo ${unexpiredToken("ignored")}.extra`],
    [
      "a token that already expired",
      `echo e30.${Buffer.from('{"exp":1}').toString("base64url")}.s`,
    ],
  ])("reports %s", async (_name, command) => {
    const { config } = await fixture({ credentialCommand: command });
    const { status, body } = await send(config);
    expect(status).toBe(503);
    expect(body).toContain("Your configured credential command");
  });

  it("runs the command without the caller's environment", async () => {
    const { config, seen } = await fixture({
      credentialCommand: `test -z "$ANTHROPIC_API_KEY" && cat ${tokenFile(unexpiredToken("clean"))}`,
    });
    process.env.ANTHROPIC_API_KEY = "must-not-reach-the-helper";
    cleanup.push(() => delete process.env.ANTHROPIC_API_KEY);
    expect((await send(config)).status).toBe(200);
    expect(seen[0].authorization).toBe(`Bearer ${unexpiredToken("clean")}`);
  });
});

describe("credential configuration", () => {
  it.each([
    ["blank command", "credentialCommand", "   "],
    ["command carrying a newline", "credentialCommand", "cat /tmp/a\nrm -rf /"],
    ["command past the length limit", "credentialCommand", `cat ${"a".repeat(4097)}`],
    ["window under one second", "credentialTtlMs", 10],
    ["window over one hour", "credentialTtlMs", 3_600_001],
    ["workspace that is not a UUID", "workspaceId", "not-a-uuid"],
  ])("rejects a saved %s", (_name, key, value) => {
    expect(() => loadConfig(savedConfig({ [key]: value }), true)).toThrow();
  });

  it("accepts a saved command, window and workspace", () => {
    expect(
      loadConfig(
        savedConfig({ credentialCommand: "cat /t", credentialTtlMs: 5000, workspaceId: WORKSPACE }),
        true,
      ),
    ).toMatchObject({ credentialCommand: "cat /t", credentialTtlMs: 5000, workspaceId: WORKSPACE });
  });

  it("changes the daemon identity when any new field changes", () => {
    const original = identity(base);
    expect(identity({ ...base, credentialCommand: "cat /t" })).not.toBe(original);
    expect(identity({ ...base, credentialTtlMs: 5000 })).not.toBe(original);
    expect(identity({ ...base, workspaceId: WORKSPACE })).not.toBe(original);
  });

  it.each([
    ["a command without a workspace", "--credential-command cat /t"],
    [
      "a window of zero",
      `--credential-ttl 0 --workspace-id ${WORKSPACE} --credential-command cat /t`,
    ],
    ["a window without a command", `--credential-ttl 60 --workspace-id ${WORKSPACE}`],
    ["an empty command", `--workspace-id ${WORKSPACE} --credential-command`],
    ["a workspace that is not a UUID", "--workspace-id not-a-uuid --credential-command cat /t"],
    [
      "a window written as an exponent",
      `--credential-ttl 6e2 --workspace-id ${WORKSPACE} --credential-command cat /t`,
    ],
  ])("rejects setup given %s", (_name, args) => {
    expect(() => setup(args)).toThrow();
  });

  it("saves the command, window and workspace that setup was given", async () => {
    const home = temporary();
    mkdirSync(join(home, ".claude"), { mode: 0o700 });
    const entry = join(home, "entry.mjs");
    writeFileSync(entry, "", { mode: 0o600 });
    await enable(
      entry,
      `--scope global --cli /bin/sh --port 52599 --credential-ttl 60 --workspace-id ${WORKSPACE} --credential-command cat /tmp/t.jwt`.split(
        " ",
      ),
      {},
      home,
      home,
    ).catch(() => undefined);
    expect(JSON.parse(readFileSync(join(configDir(home), "config.json"), "utf8"))).toMatchObject({
      credentialCommand: "cat /tmp/t.jwt",
      credentialTtlMs: 60_000,
      workspaceId: WORKSPACE,
    });
  });

  it.each([
    ["command", `--workspace-id ${WORKSPACE} --credential-command cat /tmp/different.jwt`],
    [
      "window",
      `--credential-ttl 120 --workspace-id ${WORKSPACE} --credential-command ${SAVED_COMMAND}`,
    ],
    [
      "workspace",
      `--workspace-id 11111111-2222-3333-4444-555555555555 --credential-command ${SAVED_COMMAND}`,
    ],
  ])("refuses to change a saved %s while a scope is active", async (_name, args) => {
    const { run } = await existingInstall();
    await expect(run(args)).rejects.toThrow(/disable first/);
  });

  it("keeps saved credentials when setup runs again without them", async () => {
    const { run } = await existingInstall();
    const failure = await run("").then(
      () => undefined,
      (e: Error) => e.message,
    );
    expect(failure ?? "").not.toMatch(/disable first/);
  });

  it("refuses to write an invalid workspace id", () => {
    expect(() =>
      createConfig("/bin/sh", undefined, 52598, temporary(), {}, false, { workspaceId: "nope" }),
    ).toThrow();
  });
});

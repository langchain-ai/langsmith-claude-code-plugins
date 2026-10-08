import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { credentialSummary } from "./credential-report.js";
import { identity } from "./server.js";
import { configDir, loadConfig } from "./config.js";
import { enable } from "./settings.js";
import { parseGatewayCommand } from "./options.js";
import { createConfig } from "./setup.js";
import { cleanup } from "./fixtures/server-sandbox.js";
import {
  base,
  CALLER_WORKSPACE,
  countingCommand,
  credentialReport,
  existingInstall,
  fixture,
  refuse,
  savedConfig,
  SAVED_COMMAND,
  send,
  setup,
  temporary,
  tokenFile,
  unexpiredToken,
  WORKSPACE,
} from "./fixtures/identity-token-sandbox.js";

describe("identity token command", () => {
  it("sends the configured workspace id", async () => {
    const { config, seen } = await fixture({
      identityTokenCommand: `cat ${tokenFile(unexpiredToken("x"))}`,
      workspaceId: WORKSPACE,
    });
    expect((await send(config)).status).toBe(200);
    expect(seen[0]["x-tenant-id"]).toBe(WORKSPACE);
  });

  it("re-runs the command once the cache window passes", async () => {
    const path = tokenFile(unexpiredToken("first"));
    const { config, seen } = await fixture({
      identityTokenCommand: `cat ${path}`,
      identityTokenTtlMs: 1000,
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
    const { config } = await fixture({ identityTokenCommand: command });
    const { status, body } = await send(config);
    expect(status).toBe(503);
    expect(body).toContain("Your configured identity token command");
  });

  it("records whether the credential was obtained, and never reports the credential itself", async () => {
    const broken = await fixture({ identityTokenCommand: "exit 1" });
    expect(await credentialReport(broken.config)).toEqual({});
    expect((await send(broken.config)).status).toBe(503);
    expect(await credentialReport(broken.config)).toEqual({ sinceFailureMs: expect.any(Number) });
    const token = unexpiredToken("recorded");
    const working = await fixture({ identityTokenCommand: `cat ${tokenFile(token)}` });
    expect((await send(working.config)).status).toBe(200);
    const report = await credentialReport(working.config);
    expect(report).toEqual({ sinceSuccessMs: expect.any(Number) });
    expect(JSON.stringify(report)).not.toContain(token.split(".")[1]);
  });

  it("records a credential the gateway refused, so status cannot still call it working", async () => {
    const { command } = countingCommand(unexpiredToken("good"));
    const { config } = await fixture({ identityTokenCommand: command }, refuse(401));
    expect((await send(config)).status).toBe(401);
    const report = await credentialReport(config);
    expect(report.sinceSuccessMs).toBeGreaterThanOrEqual(0);
    expect(credentialSummary(report)).toContain("broken, because the gateway refused it");
  });

  it("runs the command without the caller's environment", async () => {
    const { config, seen } = await fixture({
      identityTokenCommand: `test -z "$ANTHROPIC_API_KEY" && cat ${tokenFile(unexpiredToken("clean"))}`,
    });
    process.env.ANTHROPIC_API_KEY = "must-not-reach-the-helper";
    cleanup.push(() => delete process.env.ANTHROPIC_API_KEY);
    expect((await send(config)).status).toBe(200);
    expect(seen[0].authorization).toBe(`Bearer ${unexpiredToken("clean")}`);
  });
});

describe("a credential the gateway refuses", () => {
  it("stops resending a refused token and carries the rotated one instead", async () => {
    const path = tokenFile(unexpiredToken("revoked"));
    const { config, seen } = await fixture(
      { identityTokenCommand: `cat ${path}` },
      refuse((count) => (count === 0 ? 401 : 200)),
    );
    expect((await send(config)).status).toBe(401);
    expect(seen[0].authorization).toBe(`Bearer ${unexpiredToken("revoked")}`);
    writeFileSync(path, unexpiredToken("rotated"), { mode: 0o600 });
    expect((await send(config)).status).toBe(200);
    expect(seen[1].authorization).toBe(`Bearer ${unexpiredToken("rotated")}`);
  });

  it.each([
    [401, 2],
    [403, 1],
  ])("re-runs the command at most once while the gateway answers %i", async (status, expected) => {
    const { counter, command } = countingCommand(unexpiredToken("good"));
    const { config, seen } = await fixture({ identityTokenCommand: command }, refuse(status));
    for (let i = 0; i < 6; i++) expect((await send(config)).status).toBe(status);
    expect(readFileSync(counter, "utf8")).toHaveLength(expected);
    for (const headers of seen)
      expect(headers.authorization).toBe(`Bearer ${unexpiredToken("good")}`);
  });

  it("does not re-run a command that mints a different token every time", async () => {
    const minted = Array.from({ length: 6 }, (_, i) => unexpiredToken(`minted-${i}`));
    const { counter, command } = countingCommand(...minted);
    const { config, seen } = await fixture({ identityTokenCommand: command }, refuse(401));
    for (let i = 0; i < 6; i++) expect((await send(config)).status).toBe(401);
    expect(readFileSync(counter, "utf8")).toHaveLength(2);
    expect(seen[0].authorization).toBe(`Bearer ${minted[0]}`);
  });
});

describe("caller supplied workspace", () => {
  it("routes to the workspace the caller sends when none is configured", async () => {
    const { config, seen } = await fixture({
      identityTokenCommand: `cat ${tokenFile(unexpiredToken("x"))}`,
    });
    expect((await send(config, { "x-tenant-id": CALLER_WORKSPACE })).status).toBe(200);
    expect(seen[0]["x-tenant-id"]).toBe(CALLER_WORKSPACE);
  });

  it("prefers the workspace the caller sends over the configured one", async () => {
    const { config, seen } = await fixture({
      identityTokenCommand: `cat ${tokenFile(unexpiredToken("x"))}`,
      workspaceId: WORKSPACE,
    });
    expect((await send(config, { "x-tenant-id": CALLER_WORKSPACE })).status).toBe(200);
    expect(seen[0]["x-tenant-id"]).toBe(CALLER_WORKSPACE);
  });

  it("sends no workspace when neither the caller nor the configuration names one", async () => {
    const { config, seen } = await fixture({
      identityTokenCommand: `cat ${tokenFile(unexpiredToken("x"))}`,
    });
    expect((await send(config)).status).toBe(200);
    expect(seen[0]["x-tenant-id"]).toBeUndefined();
  });

  it.each([
    ["empty", ""],
    ["not a UUID", "acme-production"],
    ["sent twice", [CALLER_WORKSPACE, WORKSPACE]],
  ])("refuses a workspace header that is %s", async (_name, value) => {
    const { config, seen } = await fixture({
      identityTokenCommand: `cat ${tokenFile(unexpiredToken("x"))}`,
      workspaceId: WORKSPACE,
    });
    const { status, body } = await send(config, { "x-tenant-id": value });
    expect(status).toBe(400);
    expect(body).toContain("at most once and as a workspace UUID");
    expect(seen).toHaveLength(0);
  });
});

describe("identity token configuration", () => {
  it.each([
    ["blank command", "identityTokenCommand", "   "],
    ["command carrying a newline", "identityTokenCommand", "cat /tmp/a\nrm -rf /"],
    ["command past the length limit", "identityTokenCommand", `cat ${"a".repeat(4097)}`],
    ["window under one second", "identityTokenTtlMs", 10],
    ["window over one hour", "identityTokenTtlMs", 3_600_001],
    ["workspace that is not a UUID", "workspaceId", "not-a-uuid"],
  ])("rejects a saved %s", (_name, key, value) => {
    expect(() => loadConfig(savedConfig({ [key]: value }), true)).toThrow();
  });

  it("accepts a saved command, window and workspace", () => {
    expect(
      loadConfig(
        savedConfig({
          identityTokenCommand: "cat /t",
          identityTokenTtlMs: 5000,
          workspaceId: WORKSPACE,
        }),
        true,
      ),
    ).toMatchObject({
      identityTokenCommand: "cat /t",
      identityTokenTtlMs: 5000,
      workspaceId: WORKSPACE,
    });
  });

  it("changes the daemon identity when any new field changes", () => {
    const original = identity(base);
    expect(identity({ ...base, identityTokenCommand: "cat /t" })).not.toBe(original);
    expect(identity({ ...base, identityTokenTtlMs: 5000 })).not.toBe(original);
    expect(identity({ ...base, workspaceId: WORKSPACE })).not.toBe(original);
  });

  it.each([
    ["a command without a workspace", "--identity-token-command cat /t"],
    [
      "a window of zero",
      `--identity-token-ttl 0 --workspace-id ${WORKSPACE} --identity-token-command cat /t`,
    ],
    ["a window without a command", `--identity-token-ttl 60 --workspace-id ${WORKSPACE}`],
    ["an empty command", `--workspace-id ${WORKSPACE} --identity-token-command`],
    ["a workspace that is not a UUID", "--workspace-id not-a-uuid --identity-token-command cat /t"],
    [
      "a window written as an exponent",
      `--identity-token-ttl 6e2 --workspace-id ${WORKSPACE} --identity-token-command cat /t`,
    ],
  ])("rejects setup given %s", (_name, args) => {
    expect(() => setup(args)).toThrow();
  });

  it("keeps reading an unquoted command to the end of the line", () => {
    expect(
      setup(
        `--workspace-id ${WORKSPACE} --identity-token-command cat /tmp/t.jwt --identity-token-ttl 60`,
      ),
    ).toMatchObject({
      identityTokenCommand: "cat /tmp/t.jwt --identity-token-ttl 60",
      identityTokenTtlMs: undefined,
    });
  });

  it.each(["'", '"'])("strips one surrounding %s and reads the flags after it", (quote) => {
    expect(
      setup(
        `--identity-token-command ${quote}cat /tmp/t.jwt${quote} --workspace-id ${WORKSPACE} --identity-token-ttl 60`,
      ),
    ).toMatchObject({
      identityTokenCommand: "cat /tmp/t.jwt",
      workspaceId: WORKSPACE,
      identityTokenTtlMs: 60_000,
    });
  });

  it("keeps quotes that belong to the command itself", () => {
    expect(
      setup(`--identity-token-command "sh -c 'cat /tmp/t.jwt'" --workspace-id ${WORKSPACE}`),
    ).toMatchObject({ identityTokenCommand: "sh -c 'cat /tmp/t.jwt'" });
  });

  it("lets a quoted command through the slash command filter", () => {
    expect(
      parseGatewayCommand(
        `/langsmith-gateway:setup --scope global --identity-token-command "cat /tmp/t.jwt" --workspace-id ${WORKSPACE}`,
      ),
    ).toMatchObject({ command: "setup" });
  });

  it("refuses an unterminated quote instead of swallowing the rest of the line", () => {
    expect(() =>
      setup(`--identity-token-command "cat /tmp/t.jwt --workspace-id ${WORKSPACE}`),
    ).toThrow("Unterminated quote");
  });

  it("saves the command, window and workspace that setup was given", async () => {
    const home = temporary();
    mkdirSync(join(home, ".claude"), { mode: 0o700 });
    const entry = join(home, "entry.mjs");
    writeFileSync(entry, "", { mode: 0o600 });
    await enable(
      entry,
      `--scope global --cli /bin/sh --port 52599 --identity-token-ttl 60 --workspace-id ${WORKSPACE} --identity-token-command cat /tmp/t.jwt`.split(
        " ",
      ),
      {},
      home,
      home,
    ).catch(() => undefined);
    expect(JSON.parse(readFileSync(join(configDir(home), "config.json"), "utf8"))).toMatchObject({
      identityTokenCommand: "cat /tmp/t.jwt",
      identityTokenTtlMs: 60_000,
      workspaceId: WORKSPACE,
    });
  });

  it.each([
    ["command", `--workspace-id ${WORKSPACE} --identity-token-command cat /tmp/different.jwt`],
    [
      "window",
      `--identity-token-ttl 120 --workspace-id ${WORKSPACE} --identity-token-command ${SAVED_COMMAND}`,
    ],
    [
      "workspace",
      `--workspace-id 11111111-2222-3333-4444-555555555555 --identity-token-command ${SAVED_COMMAND}`,
    ],
  ])("refuses to change a saved %s while a scope is active", async (_name, args) => {
    const { run } = await existingInstall();
    await expect(run(args)).rejects.toThrow(/disable first/);
  });

  it("keeps the saved identity token settings when setup runs again without them", async () => {
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

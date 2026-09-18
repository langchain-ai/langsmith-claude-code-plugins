import { execFile, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, beforeEach, expect, it, onTestFinished, vi } from "vitest";

import { HOOK_EVENT_NAMES } from "./constants.js";
import { install } from "./installer.js";
import type { InstallOptions } from "./sea-models.js";
import { releaseAssetName } from "./updater-utils.js";

vi.mock("node:fs/promises", { spy: true });

const root = new URL("../", import.meta.url);
const EXECUTABLE = "langsmith-claude-code-tracing";
const DARWIN = { runtimePlatform: "darwin", runtimeArch: "arm64" } as const;
const ORIGIN = "http://127.0.0.1:1";
const hooksManifest = JSON.parse(
  fs.readFileSync(new URL("hooks/hooks.sea.json", root), "utf8"),
).hooks;
const hookCommand = (event: string) => `"\${HOME}/.langsmith/${EXECUTABLE}" ${event}`;
const fakeBinary = (version: string) => Buffer.from(`#!/bin/sh\necho ${version}\n`);

const { version: packageVersion } = JSON.parse(
  fs.readFileSync(new URL("package.json", root), "utf8"),
);
const seaConfig = JSON.parse(fs.readFileSync(new URL("sea-config.json", root), "utf8"));
const realBinary = fileURLToPath(new URL(seaConfig.output, root));
const built = fs.existsSync(realBinary);
if (!built && process.env.CI && process.platform === "darwin" && process.arch === "arm64") {
  throw new Error(`Expected 'pnpm build:sea' to have produced ${realBinary}`);
}

let home: string;
let project: string;
let source: string;
const printed: string[] = [];

beforeEach(() => {
  home = fs.mkdtempSync(join(tmpdir(), "ls-install-home-"));
  project = fs.mkdtempSync(join(tmpdir(), "ls-install-project-"));
  source = join(project, "langsmith-claude-code-tracing-darwin-arm64-0.4.0-unsigned");
  fs.writeFileSync(source, fakeBinary("0.4.0"), { mode: 0o755 });
  printed.length = 0;
});

afterEach(() => {
  for (const directory of [home, project]) fs.rmSync(directory, { recursive: true, force: true });
});

const settingsFile = () => join(home, ".claude", "settings.json");
const installDir = () => join(home, ".langsmith");
const installedBinary = () => join(installDir(), EXECUTABLE);
const installedFiles = () => (fs.existsSync(installDir()) ? fs.readdirSync(installDir()) : []);
const settings = (path = settingsFile()) => JSON.parse(fs.readFileSync(path, "utf8"));
const commandsIn = (path?: string) =>
  Object.entries(settings(path).hooks as Record<string, { hooks: { command: string }[] }[]>).map(
    ([event, groups]) => [event, groups.flatMap((group) => group.hooks.map((h) => h.command))],
  );

function releaseJson(version: string, body: Buffer, extra: Record<string, unknown> = {}) {
  const asset = {
    name: releaseAssetName("darwin", "arm64", version),
    browser_download_url: `${ORIGIN}/download/${version}`,
    size: body.byteLength,
    digest: `sha256:${createHash("sha256").update(body).digest("hex")}`,
    ...extra,
  };
  return { tag_name: version, assets: [asset] };
}

const serving = (listed: unknown, body: Buffer) =>
  vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json(listed))
    .mockResolvedValueOnce(new Response(body));

const run = (extra: InstallOptions = {}) =>
  install({
    ...DARWIN,
    home,
    cwd: project,
    currentVersion: "0.4.0",
    executablePath: source,
    compiledBinary: true,
    releasesApi: `${ORIGIN}/releases`,
    hooksManifest,
    out: (line: string) => printed.push(line),
    ...extra,
  });

it("copies the running binary without a download, and writes only where it is told", async () => {
  const untouched = vi.fn<typeof fetch>();

  await run({ args: ["--print"], fetchImpl: untouched });
  expect(Object.keys(JSON.parse(printed.join("")).hooks)).toEqual([...HOOK_EVENT_NAMES]);
  expect(fs.existsSync(settingsFile())).toBe(false);
  expect(installedFiles()).toEqual([]);

  await run({ args: ["--project"], fetchImpl: untouched });
  expect(fs.existsSync(settingsFile())).toBe(false);
  expect(commandsIn(join(project, ".claude", "settings.json"))).toHaveLength(
    HOOK_EVENT_NAMES.length,
  );

  printed.length = 0;
  await run({ fetchImpl: untouched });
  expect(untouched).not.toHaveBeenCalled();
  expect(fs.readFileSync(installedBinary())).toEqual(fakeBinary("0.4.0"));
  expect(fs.statSync(installedBinary()).mode & 0o777).toBe(0o755);
  expect(printed[0]).toBe(`Installed ${installedBinary()} (0.4.0)`);
  expect(installedFiles()).toEqual([EXECUTABLE]);
  expect(commandsIn()).toEqual(HOOK_EVENT_NAMES.map((event) => [event, [hookCommand(event)]]));
});

it("downloads a release for a pinned tag, and when it is not the compiled binary", async () => {
  const newest = fakeBinary("0.4.0");
  const listed = [
    { ...releaseJson("0.9.0", newest), assets: [] },
    { ...releaseJson("0.5.0", newest), draft: true },
    { ...releaseJson("0.4.1", newest), prerelease: true },
    releaseJson("0.3.9", fakeBinary("0.3.9")),
    releaseJson("0.4.0", newest),
  ];

  const pinned = fakeBinary("0.3.9");
  const tagged = serving(releaseJson("0.3.9", pinned), pinned);
  await run({ args: ["--tag", "0.3.9"], fetchImpl: tagged });
  expect(tagged.mock.calls[0][0]).toBe(`${ORIGIN}/releases/tags/0.3.9`);
  expect(fs.readFileSync(installedBinary())).toEqual(pinned);
  expect(printed[0]).toBe(`Installed ${installedBinary()} (0.3.9)`);

  printed.length = 0;
  await run({ compiledBinary: false, fetchImpl: serving(listed, newest) });
  expect(fs.readFileSync(installedBinary())).toEqual(newest);
  expect(printed[0]).toBe(`Installed ${installedBinary()} (0.4.0)`);

  printed.length = 0;
  const beta = fakeBinary("0.5.0-beta.1");
  const betaJson = { ...releaseJson("0.5.0-beta.1", beta), prerelease: true };
  await run({ args: ["--tag", "0.5.0-beta.1"], fetchImpl: serving(betaJson, beta) });
  expect(fs.readFileSync(installedBinary())).toEqual(beta);
  expect(printed[0]).toBe(`Installed ${installedBinary()} (0.5.0-beta.1)`);

  printed.length = 0;
  await run({ compiledBinary: false, fetchImpl: serving([...listed, betaJson], newest) });
  expect(printed[0]).toBe(`Installed ${installedBinary()} (0.4.0)`);
});

it("keeps unrelated settings and adds the hooks only once", async () => {
  fs.mkdirSync(join(home, ".claude"), { recursive: true });
  fs.writeFileSync(
    settingsFile(),
    JSON.stringify({
      model: "keep-me",
      hooks: { PreToolUse: [{ hooks: [{ type: "command", command: "echo unrelated" }] }] },
    }),
  );

  await run();
  await run();

  expect(settings().model).toBe("keep-me");
  expect(commandsIn()).toContainEqual([
    "PreToolUse",
    ["echo unrelated", hookCommand("PreToolUse")],
  ]);
  expect(settings().hooks.Stop).toHaveLength(1);
});

it("keeps the settings the user already had when the write dies partway", async () => {
  const own = {
    env: { LANGSMITH_API_KEY: "keep-me" },
    hooks: { PreToolUse: [{ hooks: [{ type: "command", command: "echo mine" }] }] },
  };
  fs.mkdirSync(join(home, ".claude"), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(own, null, 2), { mode: 0o640 });

  let wrote = "";
  vi.mocked(writeFile).mockImplementationOnce(async (...args: Parameters<typeof writeFile>) => {
    wrote = args[0] as string;
    fs.writeFileSync(wrote, `${args[1]}`.slice(0, 12));
    throw Object.assign(new Error("ENOSPC: no space left on device"), { code: "ENOSPC" });
  });

  await expect(run()).rejects.toThrow("no space left on device");
  expect(dirname(wrote)).toBe(join(home, ".claude"));
  expect(wrote).not.toBe(settingsFile());
  expect(settings()).toEqual(own);
  expect(fs.readdirSync(join(home, ".claude"))).toEqual(["settings.json"]);

  const replaced = fs.statSync(settingsFile()).ino;
  await run();
  expect(fs.statSync(settingsFile()).ino).not.toBe(replaced);
  expect(settings().env).toEqual(own.env);
  expect(commandsIn()).toContainEqual(["PreToolUse", ["echo mine", hookCommand("PreToolUse")]]);
  expect(fs.statSync(settingsFile()).mode & 0o777).toBe(0o640);
  expect(fs.readdirSync(join(home, ".claude"))).toEqual(["settings.json"]);
});

it("installs nothing it cannot fully trust", async () => {
  const body = fakeBinary("0.4.0");
  const mislabelled = fakeBinary("0.1.0");
  await expect(
    run({
      args: ["--tag", "0.4.0"],
      fetchImpl: serving(releaseJson("0.4.0", mislabelled), mislabelled),
    }),
  ).rejects.toThrow("reports version 0.1.0");

  fs.writeFileSync(source, mislabelled, { mode: 0o755 });
  await expect(run()).rejects.toThrow("reports version 0.1.0");
  await expect(run({ hooksManifest: undefined })).rejects.toThrow("carries no hooks manifest");

  const assetless = [{ ...releaseJson("0.4.0", body), assets: [] }];
  await expect(run({ compiledBinary: false, fetchImpl: serving(assetless, body) })).rejects.toThrow(
    "no published release carries a darwin-arm64 binary for this plugin yet",
  );
  await expect(run({ runtimeArch: "x64" })).rejects.toThrow(
    "no binary is published for darwin-x64",
  );
  await expect(run({ args: ["--tag"] })).rejects.toThrow("needs a release tag");
  expect(installedFiles()).toEqual([]);
  expect(fs.existsSync(settingsFile())).toBe(false);
});

const hookInput = (prompt?: string) =>
  JSON.stringify({ session_id: "sea", transcript_path: join(home, "gone"), cwd: home, prompt });

const dispatch = (binary: string, args: string[], prompt = "ordinary prompt") =>
  spawnSync(binary, args, {
    cwd: home,
    env: {
      HOME: home,
      PATH: "",
      TRACE_TO_LANGSMITH: "false",
      STATE_FILE: join(home, "state.json"),
      CC_LANGSMITH_RELEASES_API: `${ORIGIN}/releases`,
    },
    input: hookInput(prompt),
    encoding: "utf8",
    timeout: 20000,
  });

const installFromBinary = (args: string[], releasesApi: string) =>
  promisify(execFile)(realBinary, ["--install", ...args], {
    cwd: home,
    env: { HOME: home, PATH: "", CC_LANGSMITH_RELEASES_API: releasesApi },
  });

it.skipIf(!built)("installs itself without a download, then runs every hook event", async () => {
  const installed = await installFromBinary([], `${ORIGIN}/releases`);
  expect(installed.stdout).toContain(`Installed ${installedBinary()} (${packageVersion})`);
  expect(commandsIn()).toEqual(HOOK_EVENT_NAMES.map((event) => [event, [hookCommand(event)]]));

  const binary = installedBinary();
  expect(fs.statSync(binary).size).toBe(fs.statSync(realBinary).size);
  expect(dispatch(binary, ["--version"]).stdout.trim()).toBe(packageVersion);

  for (const event of HOOK_EVENT_NAMES) {
    const plain = dispatch(binary, [event]);
    expect(plain.status, `${event}: ${plain.stderr}`).toBe(0);
    expect(plain.stdout, event).toBe("");
    expect(fs.existsSync(join(home, ".claude", "state")), event).toBe(true);

    const command = dispatch(binary, [event], "/langsmith-tracing:trace");
    expect(command.status, `${event}: ${command.stderr}`).toBe(0);
    const decision = command.stdout === "" ? undefined : JSON.parse(command.stdout).decision;
    expect(decision, event).toBe(event === "UserPromptSubmit" ? "block" : undefined);
  }

  const shell = spawnSync("/bin/sh", ["-c", settings().hooks.Stop.at(-1).hooks[0].command], {
    cwd: home,
    env: { HOME: home, PATH: "", TRACE_TO_LANGSMITH: "false", STATE_FILE: join(home, "s.json") },
    input: hookInput(),
    encoding: "utf8",
    timeout: 20000,
  });
  expect(shell.status, shell.stderr).toBe(0);

  expect(dispatch(binary, ["--update"]).status).toBe(0);
  expect(fs.readFileSync(join(home, ".claude", "state", "hook.log"), "utf8")).toContain(
    "Update check failed",
  );
});

it.skipIf(!built)("downloads the release a pinned tag names", async () => {
  const body = fs.readFileSync(realBinary);
  let origin = "";
  const server = createServer((request, response) => {
    if (request.url?.startsWith("/download/")) return void response.writeHead(200).end(body);
    const download = { browser_download_url: `${origin}/download/${packageVersion}` };
    const tagged = JSON.stringify(releaseJson(packageVersion, body, download));
    response.writeHead(200, { "content-type": "application/json" }).end(tagged);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  onTestFinished(() => new Promise<void>((resolve) => server.close(() => resolve())));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

  const installed = await installFromBinary(["--tag", packageVersion], `${origin}/releases`);
  expect(installed.stdout).toContain(`Installed ${installedBinary()} (${packageVersion})`);
  expect(fs.statSync(installedBinary()).size).toBe(fs.statSync(realBinary).size);
  expect(dispatch(installedBinary(), ["--version"]).stdout.trim()).toBe(packageVersion);
});

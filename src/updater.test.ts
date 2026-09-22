import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { EXECUTABLE_NAME, LOCK_FILE } from "./binary-constants.js";
import type { UpdateOptions } from "./binary-models.js";
import * as utils from "./updater-utils.js";
import { updateFromGitHub } from "./updater.js";

const DOWNLOADS = "https://github.com/langchain-ai/langsmith-claude-code-plugins/releases/download";
const NEWER = new TextEncoder().encode("#!/bin/sh\necho 0.4.0\n");
const DIGEST = `sha256:${createHash("sha256").update(NEWER).digest("hex")}`;
const DARWIN = { runtimePlatform: "darwin", runtimeArch: "arm64" } as const;

let dir: string;
beforeEach(() => (dir = fs.mkdtempSync(join(tmpdir(), "ls-updater-"))));
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

function release(version: string, extra: Record<string, unknown> = {}) {
  const name = utils.releaseAssetName("darwin", "arm64", version);
  const url = `${DOWNLOADS}/${version}/${name}`;
  const asset = { name, browser_download_url: url, size: NEWER.length, digest: DIGEST, ...extra };
  return { tag_name: version, assets: [asset] };
}

function installed(directory = dir, contents = "old binary") {
  const target = join(directory, EXECUTABLE_NAME);
  fs.writeFileSync(target, contents);
  return target;
}

function aged(path: string, msAgo: number) {
  const when = new Date(Date.now() - msAgo);
  fs.writeFileSync(path, "");
  fs.utimesSync(path, when, when);
}

function serving(tag: string, extra: Record<string, unknown> = {}) {
  const listed = [
    { tag_name: "0.9.0", assets: [{ ...release("0.9.0").assets[0], name: EXECUTABLE_NAME }] },
    { ...release("0.8.0"), draft: true },
    { ...release("0.7.0"), prerelease: true },
    release("v0.6.0"),
    release(tag, extra),
  ];
  const impl = vi.fn<typeof fetch>();
  impl.mockResolvedValueOnce(Response.json(listed)).mockResolvedValueOnce(new Response(NEWER));
  return impl;
}

function freshInstallDir() {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir);
}

const update = (options: UpdateOptions) =>
  updateFromGitHub({ ...DARWIN, currentVersion: "0.3.1", installDir: dir, ...options });

const files = (directory = dir) => fs.readdirSync(directory).sort();

it("compares tags, targets and hosts the way the update flow relies on", () => {
  expect(utils.isPublishedTarget("darwin", "arm64")).toBe(true);
  expect(utils.isPublishedTarget("darwin", "x64")).toBe(true);
  expect(utils.isPublishedTarget("darwin", "ia32")).toBe(false);
  expect(utils.isPublishedTarget("win32", "x64")).toBe(false);
  expect(utils.isPublishedTarget("linux", "arm64")).toBe(false);
  const newerThanInstalled = (tag: string) => utils.isVersionNewer(tag, "0.3.1");
  expect(["0.4.0", "0.3.2", "0.4.0-beta.1", "0.4.0-beta"].every(newerThanInstalled)).toBe(true);
  expect(["0.3.1", "0.3.0", "v0.4.0", "0.4.0-Beta.1"].some(newerThanInstalled)).toBe(false);
  expect(utils.isVersionNewer("1.0.0", "0.99.99")).toBe(true);

  const loopback = ["http://127.0.0.1:1234/releases", "http://localhost:9/r"];
  expect(loopback.map(utils.configuredReleasesApi)).toEqual(loopback);
  const others = ["https://evil.test/r", "not a url", undefined].map(utils.configuredReleasesApi);
  expect(others.every((api) => api.includes("api.github.com"))).toBe(true);
});

it("orders a prerelease below the release it leads to", () => {
  const newer = utils.isVersionNewer;
  expect(newer("0.5.0", "0.5.0-beta.1")).toBe(true);
  expect(newer("0.5.0-beta.1", "0.5.0")).toBe(false);
  expect(newer("0.5.0-beta.1", "0.4.9")).toBe(true);
  expect(newer("0.4.9", "0.5.0-beta.1")).toBe(false);
  expect(newer("0.5.0-beta.10", "0.5.0-beta.2")).toBe(true);
  expect(newer("0.5.0-beta.2", "0.5.0-beta.10")).toBe(false);
  expect(newer("0.5.0-beta.1", "0.5.0-alpha.99")).toBe(true);
  expect(newer("0.5.0-alpha.99", "0.5.0-beta.1")).toBe(false);
  expect(newer("0.5.0-beta.1", "0.5.0-beta.1")).toBe(false);
  expect(newer("0.6.0-beta.1", "0.5.0")).toBe(true);
});

it("parses a bare prerelease and sorts it as the first iteration of its label", () => {
  expect(utils.parseVersion("0.4.0-beta")).toEqual({
    numbers: [0, 4, 0],
    final: 0,
    label: "beta",
    iteration: 0,
  });

  const newer = utils.isVersionNewer;
  expect(newer("0.4.0-beta.1", "0.4.0-beta")).toBe(true);
  expect(newer("0.4.0-beta", "0.4.0-beta.1")).toBe(false);
  expect(newer("0.4.0", "0.4.0-beta")).toBe(true);
  expect(newer("0.4.0-beta", "0.4.0")).toBe(false);
  expect(newer("0.4.0-beta", "0.4.0-alpha")).toBe(true);
  expect(newer("0.4.0-alpha", "0.4.0-beta")).toBe(false);
  expect(newer("0.4.0-beta", "0.4.0-beta")).toBe(false);
});

async function expectReplaces(installDir: string, target: string) {
  const fetchImpl = serving("0.4.0");
  const result = await update({ installDir, executablePath: target, fetchImpl });
  expect(result).toEqual({ status: "updated", version: "0.4.0" });
  expect(fs.readFileSync(target)).toEqual(Buffer.from(NEWER));
  expect(fs.statSync(target).mode & 0o777).toBe(0o755);
  expect(files(installDir)).toEqual([EXECUTABLE_NAME]);
}

it("replaces the installed binary, and only with an asset it can verify", async () => {
  await expectReplaces(dir, installed());

  freshInstallDir();
  const actual = join(dir, "actual");
  fs.mkdirSync(actual);
  const target = installed(actual);
  fs.symlinkSync(actual, join(dir, "linked"), "dir");
  await expectReplaces(join(dir, "linked"), target);

  for (const [extra, message] of [
    [{ digest: `sha256:${"0".repeat(64)}` }, "SHA-256 mismatch"],
    [{ digest: null }, "no SHA-256 digest"],
    [{ size: 9999 }, "size mismatch"],
    [{ size: 4 }, "exceeds its declared size"],
    [{ browser_download_url: "https://example.invalid/binary" }, "unexpected download URL"],
  ] as const) {
    freshInstallDir();
    const kept = installed();
    const fetchImpl = serving("0.4.0", extra);

    await expect(update({ executablePath: kept, fetchImpl }), message).rejects.toThrow(message);
    expect(fs.readFileSync(kept, "utf8"), message).toBe("old binary");
    expect(files(), message).toEqual([EXECUTABLE_NAME]);
  }
});

it("reaches the network only from the installed binary, and leaves it alone on a failure", async () => {
  const target = installed(dir, "installed binary");
  aged(join(dir, LOCK_FILE), 60 * 60_000);
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockRejectedValueOnce(new Error("getaddrinfo ENOTFOUND"))
    .mockResolvedValueOnce(new Response("not json at all"))
    .mockResolvedValueOnce(Response.json([release("0.3.1")]));
  const check = () => update({ executablePath: target, fetchImpl });

  await expect(check()).rejects.toThrow("ENOTFOUND");
  await expect(check()).rejects.toThrow();
  await expect(check()).resolves.toEqual({ status: "current" });
  expect(files()).toEqual([EXECUTABLE_NAME]);
  expect(fs.readFileSync(target, "utf8")).toBe("installed binary");

  const unreached = async (status: string, overrides: UpdateOptions) => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(update({ fetchImpl, ...overrides }), status).resolves.toEqual({ status });
    expect(fetchImpl, status).not.toHaveBeenCalled();
    freshInstallDir();
  };

  aged(join(dir, LOCK_FILE), 0);
  await unreached("busy", { executablePath: installed() });
  installed();
  fs.writeFileSync(join(dir, "development-build"), "development binary");
  await unreached("not-installed", { executablePath: join(dir, "development-build") });
  await unreached("unsupported", { runtimePlatform: "win32", runtimeArch: "x64" });
  await unreached("unsupported", { runtimePlatform: "linux", runtimeArch: "arm64" });
  await unreached("unsupported", { currentVersion: "" });
});

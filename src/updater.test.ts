import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { binary } from "./binary-target.js";
import { updateFromGitHub } from "./updater.js";

const EXECUTABLE_NAME = binary.target.executableName;
const ORIGIN = "http://127.0.0.1:1";
const NEWER = Buffer.from("#!/bin/sh\necho 0.4.0\n");
const DARWIN = { runtimePlatform: "darwin", runtimeArch: "arm64" } as const;

let home: string;
beforeEach(() => {
  home = fs.mkdtempSync(join(tmpdir(), "ls-updater-"));
  fs.mkdirSync(binary.installDirectory(home), { recursive: true });
  fs.writeFileSync(binary.installedBinaryPath(home), "installed binary", { mode: 0o755 });
});
afterEach(() => fs.rmSync(home, { recursive: true, force: true }));

function serving(version: string) {
  const asset = {
    name: binary.assetName("darwin", "arm64", version),
    browser_download_url: `${ORIGIN}/download/${version}`,
    size: NEWER.byteLength,
    digest: `sha256:${createHash("sha256").update(NEWER).digest("hex")}`,
  };
  return vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json([{ tag_name: version, assets: [asset] }]))
    .mockResolvedValueOnce(new Response(NEWER));
}

const update = (executablePath: string, fetchImpl: ReturnType<typeof serving>) =>
  updateFromGitHub({
    ...DARWIN,
    home,
    currentVersion: "0.3.1",
    executablePath,
    fetchImpl,
    releasesApi: `${ORIGIN}/releases`,
    verifySignature: async () => {},
  });

it("replaces the installed binary when that is the one running", async () => {
  const installed = binary.installedBinaryPath(home);

  await expect(update(installed, serving("0.4.0"))).resolves.toEqual({
    status: "updated",
    version: "0.4.0",
  });
  expect(fs.readFileSync(installed)).toEqual(NEWER);
  expect(fs.readdirSync(binary.installDirectory(home))).toEqual([EXECUTABLE_NAME]);
});

it("leaves the installed binary alone when a stray copy asks for the update", async () => {
  const stray = join(home, EXECUTABLE_NAME);
  fs.copyFileSync(binary.installedBinaryPath(home), stray);
  const fetchImpl = serving("0.4.0");

  await expect(update(stray, fetchImpl)).resolves.toEqual({ status: "not-installed" });
  expect(fetchImpl).not.toHaveBeenCalled();
  expect(fs.readFileSync(binary.installedBinaryPath(home), "utf8")).toBe("installed binary");
});

it("refuses to update a build that does not know its own version", async () => {
  const fetchImpl = serving("0.4.0");

  await expect(
    updateFromGitHub({
      ...DARWIN,
      home,
      executablePath: binary.installedBinaryPath(home),
      fetchImpl,
      releasesApi: `${ORIGIN}/releases`,
    }),
  ).resolves.toEqual({ status: "unsupported" });
  expect(fetchImpl).not.toHaveBeenCalled();
});

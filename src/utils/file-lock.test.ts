import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { releaseLock, tryAcquireLock } from "./file-lock.js";

describe("the legacy flusher lock", () => {
  let dir: string;
  let guarded: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ls-lock-"));
    guarded = join(dir, "state.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  // Catches the same gap on the one-shot path the flusher takes, which writes its
  // pid into the lock and so leaks more than the waiting path does.
  it.skipIf(process.platform === "win32")("keeps a claimed lock readable only by its owner", () => {
    expect(tryAcquireLock(guarded)).toBe(true);
    try {
      expect(statSync(`${guarded}.lock`).isFile()).toBe(true);
      expect(statSync(`${guarded}.lock`).mode & 0o777).toBe(0o600);
    } finally {
      releaseLock(guarded);
    }
  });
});

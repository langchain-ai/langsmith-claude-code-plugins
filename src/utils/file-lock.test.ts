import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { releaseLock, tryAcquireLock, withFileLock } from "./file-lock.js";

describe("the cross-process lock", () => {
  let dir: string;
  let guarded: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ls-lock-"));
    guarded = join(dir, "state.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  // Catches a lock left group and world readable in a shared temp directory, where
  // anyone on the machine can read who holds it or sit on the path before we do.
  it("keeps a waiting lock readable only by its owner", async () => {
    let mode = 0;
    await withFileLock(guarded, () => {
      mode = statSync(`${guarded}.lock`).mode & 0o777;
    });
    expect(mode).toBe(0o600);
  });

  // Catches the same gap on the one-shot path the flusher takes, which writes its
  // pid into the lock and so leaks more than the waiting path does.
  it("keeps a claimed lock readable only by its owner", () => {
    expect(tryAcquireLock(guarded)).toBe(true);
    try {
      expect(statSync(`${guarded}.lock`).mode & 0o777).toBe(0o600);
    } finally {
      releaseLock(guarded);
    }
  });
});

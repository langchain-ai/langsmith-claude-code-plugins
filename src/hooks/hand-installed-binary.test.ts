import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { binary } from "../binary-target.js";
import { HOOK_EVENT_NAMES } from "../constants.js";
import { warnAboutHandInstalledBinary } from "./hand-installed-binary.js";

type Installed = false | "registered" | "left on disk" | "is this process";

function withHome(installed: Installed, run: (home: string) => void): void {
  const home = mkdtempSync(join(tmpdir(), "langsmith-hand-installed-"));
  try {
    if (installed) {
      const path = binary.installedBinaryPath(home);
      mkdirSync(dirname(path), { recursive: true });
      if (installed === "is this process") symlinkSync(process.execPath, path);
      else writeFileSync(path, "");
      if (installed !== "left on disk") registerTheBinary(home, path);
    }
    run(home);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

function registerTheBinary(home: string, path: string): void {
  mkdirSync(join(home, ".claude"), { recursive: true });
  writeFileSync(
    join(home, ".claude", "settings.json"),
    JSON.stringify({
      hooks: { Stop: [{ hooks: [{ type: "command", command: `"${path}" Stop` }] }] },
    }),
  );
}

function collect(event: (typeof HOOK_EVENT_NAMES)[number], home: string): string[] {
  const lines: string[] = [];
  warnAboutHandInstalledBinary(event, (line) => lines.push(line), home);
  return lines;
}

describe("the hand-installed binary warning", () => {
  it("names the file to delete in a message Claude Code shows the person", () => {
    withHome("registered", (home) => {
      const lines = collect("Stop", home);
      expect(lines).toHaveLength(1);
      const message = JSON.parse(lines[0]).systemMessage;
      expect(message).toContain(binary.installedBinaryPath(home));
      expect(message).toContain("standing aside");
    });
  });

  it("says it once, then leaves the person alone on every later turn", () => {
    withHome("registered", (home) => {
      expect(collect("Stop", home)).toHaveLength(1);
      expect(collect("Stop", home)).toEqual([]);
      expect(existsSync(`${binary.installedBinaryPath(home)}.warned`)).toBe(true);
    });
  });

  it("speaks again for someone who removes the old binary and later puts it back", () => {
    withHome("registered", (home) => {
      const path = binary.installedBinaryPath(home);
      expect(collect("Stop", home)).toHaveLength(1);
      rmSync(path);
      expect(collect("Stop", home)).toEqual([]);
      writeFileSync(path, "");
      expect(collect("Stop", home)).toHaveLength(1);
    });
  });

  it("speaks only at the end of a turn, never partway through one", () => {
    withHome("registered", (home) => {
      for (const event of HOOK_EVENT_NAMES) {
        if (event === "Stop") continue;
        expect(collect(event, home)).toEqual([]);
      }
    });
  });

  it("never asks the standalone binary to delete itself", () => {
    withHome("is this process", (home) => {
      for (const event of HOOK_EVENT_NAMES) expect(collect(event, home)).toEqual([]);
    });
  });

  it("says nothing about a leftover file that no longer runs on any hook", () => {
    withHome("left on disk", (home) => {
      for (const event of HOOK_EVENT_NAMES) expect(collect(event, home)).toEqual([]);
    });
  });

  it("says nothing when no hand-installed binary is there", () => {
    withHome(false, (home) => {
      for (const event of HOOK_EVENT_NAMES) expect(collect(event, home)).toEqual([]);
    });
  });
});

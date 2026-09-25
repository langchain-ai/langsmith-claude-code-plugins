import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { binary } from "../binary-target.js";
import { pluginShouldStandDown } from "./stand-down.js";

type Host = { Bun?: { main?: string } };
const host = globalThis as Host;
const saved = host.Bun;

afterEach(() => {
  if (saved === undefined) delete host.Bun;
  else host.Bun = saved;
});

function withHome(run: (home: string, installed: string) => void): void {
  const home = mkdtempSync(join(tmpdir(), "langsmith-stand-down-"));
  try {
    const installed = binary.installedBinaryPath(home);
    mkdirSync(dirname(installed), { recursive: true });
    mkdirSync(join(home, ".claude"), { recursive: true });
    writeFileSync(
      join(home, ".claude", "settings.json"),
      JSON.stringify({
        hooks: { Stop: [{ hooks: [{ type: "command", command: `"${installed}" Stop` }] }] },
      }),
    );
    run(home, installed);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

describe("standing down for the hand-installed binary", () => {
  it("stands down while the plugin runs the build it carries", () => {
    withHome((home, installed) => {
      writeFileSync(installed, "");
      host.Bun = { main: "/$bunfs/root/langsmith-claude-code-tracing-darwin-arm64" };
      expect(pluginShouldStandDown(home, home)).toBe(true);
    });
  });

  it("keeps tracing when the registered binary is this process", () => {
    withHome((home, installed) => {
      symlinkSync(process.execPath, installed);
      host.Bun = { main: "/$bunfs/root/langsmith-claude-code-tracing" };
      expect(pluginShouldStandDown(home, home)).toBe(false);
    });
  });
});

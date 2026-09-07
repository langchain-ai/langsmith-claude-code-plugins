import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTracingMode, loadState, saveState } from "../state.js";

const mocks = vi.hoisted(() => ({ readStdin: vi.fn(), loadConfig: vi.fn() }));
vi.mock("../utils/stdin.js", () => ({ readStdin: mocks.readStdin }));
vi.mock("../config.js", () => ({ loadConfig: mocks.loadConfig }));
vi.mock("../logger.js", () => ({
  initLogger: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
}));

let directory: string;
let stateFilePath: string;
const sessionId = "trace-command-privacy";

beforeEach(() => {
  vi.clearAllMocks();
  directory = mkdtempSync(join(tmpdir(), "trace-command-privacy-"));
  stateFilePath = join(directory, "state.json");
  mocks.loadConfig.mockReturnValue({ enabled: true, stateFilePath, debug: false });
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});

async function command(value: "on" | "off" | "status"): Promise<string> {
  vi.resetModules();
  mocks.readStdin.mockResolvedValue({
    session_id: sessionId,
    cwd: directory,
    prompt: `/trace ${value}`,
    transcript_path: "",
  });
  const stdout = vi.spyOn(process.stdout, "write").mockReturnValue(true);
  try {
    await import("./user-prompt-submit.js");
    await vi.waitFor(() => expect(stdout).toHaveBeenCalled());
    const response = JSON.parse(String(stdout.mock.calls[0][0]));
    expect(response.decision).toBe("block");
    return response.reason;
  } finally {
    stdout.mockRestore();
  }
}

describe("trace status is read-only", () => {
  it.each(["not json", JSON.stringify({ __langsmith_fail_closed: true })])(
    "preserves fail-closed protection for %s",
    async (raw) => {
      writeFileSync(stateFilePath, raw);
      expect(await command("status")).toContain("metadata only");
      expect(readFileSync(stateFilePath, "utf8")).toBe(raw);
      expect(readdirSync(directory)).toEqual(["state.json"]);
      expect(getTracingMode(loadState(stateFilePath), sessionId)).toBe("metadata");
    },
  );

  it("does not create state when none exists", async () => {
    expect(await command("status")).toContain("on for this thread");
    expect(existsSync(stateFilePath)).toBe(false);
  });

  it.each(["full", "metadata"] as const)("does not modify a %s thread", async (tracing) => {
    saveState(stateFilePath, {
      [sessionId]: { last_line: 5, turn_count: 2, updated: "old timestamp", tracing },
      other: { last_line: 1, turn_count: 1, updated: "old timestamp", tracing: "metadata" },
    });
    const raw = readFileSync(stateFilePath, "utf8");
    expect(await command("status")).toContain(
      tracing === "full" ? "on for this thread" : "metadata only",
    );
    expect(readFileSync(stateFilePath, "utf8")).toBe(raw);
  });

  it("does not clear fail-closed state while the master switch is disabled", async () => {
    mocks.loadConfig.mockReturnValue({ enabled: false, stateFilePath, debug: false });
    writeFileSync(stateFilePath, "not json");
    expect(await command("status")).toContain("master switch is disabled");
    expect(readFileSync(stateFilePath, "utf8")).toBe("not json");
    expect(getTracingMode(loadState(stateFilePath), sessionId)).toBe("metadata");
  });

  it.each(["on", "off"] as const)(
    "still allows explicit /trace %s to recover corrupt state",
    async (value) => {
      writeFileSync(stateFilePath, "not json");
      await command(value);
      expect(getTracingMode(loadState(stateFilePath), sessionId)).toBe(
        value === "on" ? "full" : "metadata",
      );
      expect(readdirSync(directory).some((name) => name.startsWith("state.json.corrupt."))).toBe(
        true,
      );
    },
  );
});

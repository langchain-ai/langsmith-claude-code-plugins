import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTracingMode, loadState, saveState } from "../state.js";

const mocks = vi.hoisted(() => ({
  readStdin: vi.fn(),
  loadConfig: vi.fn(),
  initLogger: vi.fn(),
  error: vi.fn(),
}));
vi.mock("../utils/stdin.js", () => ({ readStdin: mocks.readStdin }));
vi.mock("../config.js", () => ({ loadConfig: mocks.loadConfig }));
vi.mock("../logger.js", () => ({
  initLogger: mocks.initLogger,
  debug: vi.fn(),
  error: mocks.error,
}));

let directory: string;
let stateFilePath: string;
const sessionId = "trace-command-privacy";

beforeEach(() => {
  vi.resetAllMocks();
  directory = mkdtempSync(join(tmpdir(), "trace-command-privacy-"));
  stateFilePath = join(directory, "state.json");
  mocks.loadConfig.mockReturnValue({ enabled: true, stateFilePath, debug: false });
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});

async function command(value: "on" | "off" | "status", timeout = 1000): Promise<string> {
  vi.resetModules();
  mocks.readStdin.mockResolvedValue({
    session_id: sessionId,
    cwd: directory,
    prompt: `/ls-trace ${value}`,
    transcript_path: "",
  });
  const stdout = vi.spyOn(process.stdout, "write").mockReturnValue(true);
  try {
    await import("./user-prompt-submit.js");
    await vi.waitFor(() => expect(stdout).toHaveBeenCalledTimes(1), { timeout });
    const response = JSON.parse(String(stdout.mock.calls[0][0]));
    expect(response.decision).toBe("block");
    return response.reason;
  } finally {
    stdout.mockRestore();
  }
}

describe("trace command failures are blocked and visible", () => {
  it("reports a lock timeout without changing the preference", async () => {
    saveState(stateFilePath, {
      [sessionId]: { last_line: 0, turn_count: 1, updated: "", tracing: "full" },
    });
    const original = readFileSync(stateFilePath, "utf8");
    writeFileSync(`${stateFilePath}.lock`, JSON.stringify({ pid: process.pid, owner: "held" }));
    const reason = await command("off", 7000);
    expect(reason).toContain("Could not save");
    expect(reason).toContain("Tracing may still be enabled");
    expect(reason).toContain("Please retry /ls-trace off");
    expect(reason).not.toContain(stateFilePath);
    expect(readFileSync(stateFilePath, "utf8")).toBe(original);
    expect(mocks.error).toHaveBeenCalled();
  }, 10000);

  it.each(["on", "off"] as const)("blocks /ls-trace %s on a filesystem failure", async (value) => {
    // An ordinary file cannot be used as the parent directory for state/lock files.
    const parent = join(directory, "not-a-directory");
    writeFileSync(parent, "unchanged");
    mocks.loadConfig.mockReturnValue({ enabled: true, stateFilePath: join(parent, "state.json") });
    const reason = await command(value);
    expect(reason).toContain("Could not save");
    expect(reason).toContain(`Please retry /ls-trace ${value}`);
    expect(readFileSync(parent, "utf8")).toBe("unchanged");
    expect(reason).not.toContain(parent);
  });

  it.each(["on", "off", "status"] as const)(
    "blocks /ls-trace %s even if config and logging fail",
    async (value) => {
      mocks.loadConfig.mockImplementation(() => {
        throw new Error("PRIVATE CONFIG DETAIL");
      });
      mocks.error.mockImplementation(() => {
        throw new Error("logging failed");
      });
      const reason = await command(value);
      expect(reason).toContain(value === "status" ? "Could not determine" : "Could not save");
      expect(reason).toContain(`Please retry /ls-trace ${value}`);
      expect(reason).not.toContain("PRIVATE CONFIG DETAIL");
      expect(existsSync(stateFilePath)).toBe(false);
    },
  );

  it("blocks the command if logger initialization fails", async () => {
    mocks.initLogger.mockImplementation(() => {
      throw new Error("PRIVATE LOG PATH");
    });
    expect(await command("off")).toContain("Could not save");
    expect(existsSync(stateFilePath)).toBe(false);
  });
});

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
    "still allows explicit /ls-trace %s to recover corrupt state",
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

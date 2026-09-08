import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveTurnTracingMode } from "./tracing-mode.js";
import { setThreadTracingMode, tracingPolicyPath } from "./tracing-policy.js";

let dir: string;
let state: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "tracing-mode-"));
  state = join(dir, "state.json");
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("resolveTurnTracingMode", () => {
  it("consults configured default only after all snapshots and explicit preferences", async () => {
    const config = { stateFilePath: state, defaultMuted: true };
    expect(resolveTurnTracingMode(config, "new", undefined)).toBe("metadata");
    expect(resolveTurnTracingMode(config, "new", undefined, "full", "metadata")).toBe("full");
    await setThreadTracingMode(state, "new", "full");
    expect(resolveTurnTracingMode(config, "new")).toBe("full");
    expect(resolveTurnTracingMode(config, "new", "metadata")).toBe("metadata");
    config.defaultMuted = false;
    expect(resolveTurnTracingMode(config, "other", undefined, "metadata")).toBe("metadata");
    await setThreadTracingMode(state, "new", "metadata");
    expect(resolveTurnTracingMode(config, "new")).toBe("metadata");
    writeFileSync(tracingPolicyPath(state), "{broken");
    expect(resolveTurnTracingMode(config, "new")).toBe("metadata");
    expect(resolveTurnTracingMode(config, "new", "full")).toBe("full");
  });

  it("uses sticky policy only when no snapshot exists, with full for a healthy new thread", async () => {
    expect(resolveTurnTracingMode(state, "session", undefined)).toBe("full");
    await setThreadTracingMode(state, "session", "metadata");
    expect(resolveTurnTracingMode(state, "session", undefined, undefined)).toBe("metadata");
    expect(resolveTurnTracingMode(state, "other")).toBe("full");
    expect(resolveTurnTracingMode(state, "session", undefined, "full", "metadata")).toBe("full");
    await setThreadTracingMode(state, "session", "full");
    expect(resolveTurnTracingMode(state, "session", "metadata", "full")).toBe("metadata");
  });

  it("fails closed for corrupt policy without changing an existing snapshot", () => {
    writeFileSync(tracingPolicyPath(state), "{broken");
    expect(resolveTurnTracingMode(state, "session")).toBe("metadata");
    expect(resolveTurnTracingMode(state, "session", "full")).toBe("full");
  });
});

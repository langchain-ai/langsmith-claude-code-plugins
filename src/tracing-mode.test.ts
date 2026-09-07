import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveTurnTracingMode } from "./tracing-mode.js";
import { setThreadTracingMode } from "./tracing-policy.js";

let dir: string;
let state: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "tracing-mode-"));
  state = join(dir, "state.json");
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("resolveTurnTracingMode", () => {
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
    writeFileSync(`${state}.privacy.json`, "{broken");
    expect(resolveTurnTracingMode(state, "session")).toBe("metadata");
    expect(resolveTurnTracingMode(state, "session", "full")).toBe("full");
  });
});

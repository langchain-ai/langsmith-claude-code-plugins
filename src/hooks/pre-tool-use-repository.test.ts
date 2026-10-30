import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { createGitSandbox } from "../fixtures/git-sandbox.js";
import type { Config } from "../types.js";

const payload: { current?: Record<string, unknown> } = {};

vi.mock("../utils/stdin.js", () => ({ readStdin: async () => payload.current }));

vi.mock("../logger.js", () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  initLogger: vi.fn(),
}));

const sandbox = createGitSandbox("ls pre tool cwd ");
const stateFilePath = join(sandbox.root, "state.json");

vi.mock("../utils/hook-init.js", () => ({
  initHook: () =>
    ({
      enabled: true,
      defaultMuted: false,
      stateFilePath,
      customMetadata: {},
    }) as unknown as Config,
}));

import { main } from "./pre-tool-use.js";

afterAll(() => sandbox.remove());

describe("PreToolUse", () => {
  it("records the folder each tool starts in", async () => {
    writeFileSync(stateFilePath, "{}");
    payload.current = {
      session_id: "pre-tool-cwd",
      transcript_path: join(sandbox.root, "transcript.jsonl"),
      cwd: sandbox.root,
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command: "ls" },
      tool_use_id: "t1",
    };

    await main();

    const state = JSON.parse(readFileSync(stateFilePath, "utf-8"));
    expect(state["pre-tool-cwd"].tool_cwds).toEqual({ t1: sandbox.root });
  });
});

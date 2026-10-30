import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createGitSandbox } from "../fixtures/git-sandbox.js";
import type { Config } from "../types.js";

const captureToolRun = vi.fn().mockResolvedValue(undefined);
const payload: { current?: Record<string, unknown> } = {};

vi.mock("../tracing-engine.js", () => ({
  initTracing: vi.fn(),
  captureToolRun: (...args: unknown[]) => captureToolRun(...args),
}));

vi.mock("../utils/stdin.js", () => ({ readStdin: async () => payload.current }));

vi.mock("../logger.js", () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  initLogger: vi.fn(),
}));

const sandbox = createGitSandbox("ls post tool repos ");
const beta = sandbox.makeRepo(
  "beta repo",
  "trunk-beta",
  "Beta Owner",
  "git@github.com:acme/beta.git",
);
const stateFilePath = join(sandbox.root, "state.json");

vi.mock("../utils/hook-init.js", () => ({
  expandHome: (path: string) => path,
  initHook: () =>
    ({
      enabled: true,
      defaultMuted: false,
      stateFilePath,
      customMetadata: {},
    }) as unknown as Config,
}));

import { main } from "./post-tool-use.js";

afterAll(() => sandbox.remove());
beforeEach(() => {
  captureToolRun.mockClear();
  writeFileSync(
    stateFilePath,
    JSON.stringify({
      "post-tool-repos": {
        last_line: -1,
        turn_count: 1,
        updated: "",
        task_run_map: {},
        current_turn_run_id: "turn-1",
        current_trace_id: "turn-1",
        current_dotted_order: "20250101T000000000000Zturn-1",
      },
    }),
  );
});

describe("PostToolUse", () => {
  it("reads a Glob pattern as the folder searched, but a Grep pattern as text", async () => {
    const pattern = join(beta, "**", "*.txt");
    const hookInput = (tool_name: string, tool_use_id: string) => ({
      session_id: "post-tool-repos",
      transcript_path: join(sandbox.root, "transcript.jsonl"),
      cwd: sandbox.root,
      hook_event_name: "PostToolUse",
      tool_name,
      tool_input: { pattern },
      tool_response: {},
      tool_use_id,
    });

    payload.current = hookInput("Glob", "t1");
    await main();
    payload.current = hookInput("Grep", "t2");
    await main();

    const origins = captureToolRun.mock.calls.map(([, , , origin]) => origin.path);
    expect(origins).toEqual([pattern, undefined]);
  });
});

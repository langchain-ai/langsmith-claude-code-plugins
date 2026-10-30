import { readFileSync, writeFileSync } from "node:fs";
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

const sandbox = createGitSandbox("ls-post-tool-repos-");
const beta = sandbox.makeRepo("beta-repo", "trunk-beta", "Beta", "git@github.com:acme/beta.git");
const plain = sandbox.makeDir(sandbox.root, "plain-folder");
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

import { main as postToolUse } from "./post-tool-use.js";
import { main as preToolUse } from "./pre-tool-use.js";

afterAll(() => sandbox.remove());
function writeState(toolCwds: Record<string, string> = {}, tool_start_times = {}): void {
  writeFileSync(
    stateFilePath,
    JSON.stringify({
      "post-tool-repos": {
        current_turn_run_id: "turn-1",
        current_trace_id: "turn-1",
        current_dotted_order: "20250101T000000000000Zturn-1",
        tool_cwds: toolCwds,
        tool_start_times,
      },
    }),
  );
}

beforeEach(() => {
  captureToolRun.mockClear();
  writeState();
});

const hookInput = (
  tool_name: string,
  tool_input: unknown,
  tool_use_id: string,
  cwd = sandbox.root,
) => ({
  session_id: "post-tool-repos",
  transcript_path: join(sandbox.root, "transcript.jsonl"),
  cwd,
  hook_event_name: "PostToolUse",
  tool_name,
  tool_input,
  tool_response: {},
  tool_use_id,
});

const lastOrigin = () => captureToolRun.mock.calls.at(-1)?.[3];

describe("PostToolUse", () => {
  it("reads a Glob pattern as the folder searched, but a Grep pattern as text", async () => {
    const pattern = join(beta, "**", "*.txt");

    payload.current = hookInput("Glob", { pattern }, "t1");
    await postToolUse();
    payload.current = hookInput("Grep", { pattern }, "t2");
    await postToolUse();

    const origins = captureToolRun.mock.calls.map(([, , , origin]) => origin.path);
    expect(origins).toEqual([pattern, undefined]);
  });

  it.each<[name: string, command: string, started: string | undefined, want: object]>([
    ["the folder a shell command enters", `cd ${beta} && ls`, undefined, { path: beta }],
    ["the folder the tool started in", "echo hi", beta, { cwd: beta }],
    ["the hook's folder when none was recorded", "ls", undefined, { cwd: plain }],
    ["no folder when the command may leave it", `cd ${plain}; git status`, beta, {}],
  ])("reads %s", async (_name, command, started, want) => {
    writeState(started ? { t1: started } : {});
    payload.current = hookInput("Bash", { command }, "t1", plain);
    await postToolUse();

    const { path, cwd } = lastOrigin();
    expect({ path, cwd }).toEqual(want);
  });
});

const preHookInput = (tool_use_id: string, extra: Record<string, unknown> = {}) => ({
  ...hookInput("Bash", { command: "ls" }, tool_use_id),
  hook_event_name: "PreToolUse",
  ...extra,
});

const savedToolCwds = () =>
  JSON.parse(readFileSync(stateFilePath, "utf-8"))["post-tool-repos"].tool_cwds;

describe("PreToolUse", () => {
  it("records the folder each main-agent tool starts in and none for a subagent's", async () => {
    payload.current = preHookInput("t1");
    await preToolUse();
    payload.current = preHookInput("t2", { agent_id: "agent-1" });
    await preToolUse();

    expect(savedToolCwds()).toEqual({ t1: sandbox.root });
  });

  it("forgets folders of tools from before the last reset of the start times", async () => {
    writeState({ kept: "/a", stale: "/b" }, { kept: 1 });
    payload.current = preHookInput("t3");
    await preToolUse();

    expect(savedToolCwds()).toEqual({ kept: "/a", t3: sandbox.root });
  });
});

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

const sandbox = createGitSandbox("ls post tool repos ");
const beta = sandbox.makeRepo(
  "beta repo",
  "trunk-beta",
  "Beta Owner",
  "git@github.com:acme/beta.git",
);
const plain = sandbox.makeDir(sandbox.root, "plain folder");
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
function writeState(toolCwds: Record<string, string> = {}): void {
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
        tool_cwds: toolCwds,
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

  it("reads the folder a shell command enters", async () => {
    payload.current = hookInput("Bash", { command: `cd "${beta}" && ls` }, "t1");
    await postToolUse();

    expect(lastOrigin().path).toBe(beta);
  });

  it("uses the folder the tool started in when a command names no folder", async () => {
    writeState({ t1: beta });
    payload.current = hookInput("Bash", { command: "echo hi" }, "t1", plain);
    await postToolUse();

    expect(lastOrigin()).toMatchObject({ cwd: beta, namedAPath: false });
    expect(lastOrigin().path).toBeUndefined();
  });

  it("uses the hook's folder when no start folder was recorded", async () => {
    payload.current = hookInput("Bash", { command: "ls" }, "t1", plain);
    await postToolUse();

    expect(lastOrigin().cwd).toBe(plain);
  });

  it("names no folder when a command with an unknown folder leaves it", async () => {
    writeState({ t1: beta });
    payload.current = hookInput("Bash", { command: `cd "${plain}"; git status` }, "t1", plain);
    await postToolUse();

    expect(lastOrigin().cwd).toBeUndefined();
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
    writeState({ kept: "/a", stale: "/b" });
    const state = JSON.parse(readFileSync(stateFilePath, "utf-8"));
    state["post-tool-repos"].tool_start_times = { kept: 1 };
    writeFileSync(stateFilePath, JSON.stringify(state));
    payload.current = preHookInput("t3");
    await preToolUse();

    expect(savedToolCwds()).toEqual({ kept: "/a", t3: sandbox.root });
  });
});

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createGitSandbox } from "../fixtures/git-sandbox.js";
import type { Config, QueuedClosing } from "../types.js";

const completeTurnRun = vi.fn().mockResolvedValue(undefined);

vi.mock("../langsmith.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../langsmith.js")>()),
  traceTurn: vi.fn().mockResolvedValue({}),
  completeTurnRun: (options: unknown) => completeTurnRun(options),
}));

vi.mock("../tracing-engine.js", () => ({
  initTracing: vi.fn(),
  settledFromTurn: async (base: unknown) => base,
}));

vi.mock("../logger.js", () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  initLogger: vi.fn(),
}));

import { closeStoppedTurn } from "./stop.js";

const sandbox = createGitSandbox("ls stop repos ");
const beta = sandbox.makeRepo(
  "beta repo",
  "trunk-beta",
  "Beta Owner",
  "git@github.com:acme/beta.git",
);
const plain = sandbox.makeDir(sandbox.root, "plain folder");

afterAll(() => sandbox.remove());
beforeEach(() => completeTurnRun.mockClear());

function transcriptWith(call: Record<string, unknown>, cwd?: string): string {
  const path = join(sandbox.root, "transcript.jsonl");
  writeFileSync(
    path,
    [
      { type: "user", message: { role: "user", content: "go" }, timestamp: "2025-01-01T00:00:00Z" },
      {
        type: "assistant",
        cwd,
        timestamp: "2025-01-01T00:00:01Z",
        message: {
          id: "msg_1",
          role: "assistant",
          model: "claude-sonnet-4-5",
          content: [call],
          usage: { input_tokens: 1, output_tokens: 1 },
        },
      },
      {
        type: "user",
        timestamp: "2025-01-01T00:00:02Z",
        message: {
          role: "user",
          content: [{ type: "tool_result", tool_use_id: "t1", content: "ok" }],
        },
      },
    ]
      .map((line) => JSON.stringify(line))
      .join("\n"),
  );
  return path;
}

async function closingRunMetadata(
  call: Record<string, unknown>,
  lineCwd?: string,
): Promise<Record<string, unknown>> {
  const input = {
    session_id: "stop-repos",
    transcript_path: transcriptWith(call, lineCwd),
    cwd: plain,
    hook_event_name: "Stop",
    stop_hook_active: false,
    last_assistant_message: "done",
  };
  const closing = {
    kind: "stop",
    at: 0,
    input,
    session: {
      last_line: -1,
      turn_count: 0,
      updated: "",
      task_run_map: {},
      current_turn_run_id: "turn-1",
      current_trace_id: "turn-1",
      current_dotted_order: "20250101T000000000000Zturn-1",
    },
  } as unknown as QueuedClosing;
  const config = {
    stateFilePath: join(sandbox.root, "state.json"),
    customMetadata: { cwd: plain },
  } as unknown as Config;

  await closeStoppedTurn("stop-repos", closing, config);

  expect(completeTurnRun).toHaveBeenCalledOnce();
  return completeTurnRun.mock.calls[0][0].customMetadata;
}

describe("closeStoppedTurn", () => {
  it("labels the turn's closing run with the repository its tools touched", async () => {
    const read = {
      type: "tool_use",
      id: "t1",
      name: "Read",
      input: { file_path: join(beta, "seed.txt") },
    };

    expect(await closingRunMetadata(read)).toMatchObject({
      ls_git_repo: "acme/beta",
      ls_git_branch: "trunk-beta",
    });
  });

  it("labels the turn's closing run from the folder its first call started in", async () => {
    const shell = { type: "tool_use", id: "t1", name: "Bash", input: { command: "ls" } };

    expect(await closingRunMetadata(shell, beta)).toMatchObject({ ls_git_repo: "acme/beta" });
  });
});

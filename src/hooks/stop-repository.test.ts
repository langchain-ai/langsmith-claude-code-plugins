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

vi.mock("../logger.js");

import { closeStoppedTurn } from "./stop.js";

const sandbox = createGitSandbox("ls-stop-repos-");
const beta = sandbox.makeRepo("beta-repo", "trunk-beta", "Beta", "git@github.com:acme/beta.git");
const plain = sandbox.makeDir(sandbox.root, "plain-folder");

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
    ]
      .map((line) => JSON.stringify(line))
      .join("\n"),
  );
  return path;
}

async function closingRunMetadata(
  tool: { name: string; input: object },
  lineCwd: string | undefined,
  hookCwd: string,
): Promise<Record<string, unknown>> {
  const input = {
    session_id: "stop-repos",
    transcript_path: transcriptWith({ type: "tool_use", id: "t1", ...tool }, lineCwd),
    cwd: hookCwd,
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
  const read = (file_path: string) => ({ name: "Read", input: { file_path } });

  it.each<[name: string, tool: { name: string; input: object }, line?: string, hook?: string]>([
    ["the repository its tools touched", read(`${beta}/seed.txt`), undefined, plain],
    [
      "the folder its first call started in",
      { name: "Bash", input: { command: "ls" } },
      beta,
      plain,
    ],
    ["the hook's folder when the transcript records none", read("seed.txt"), undefined, beta],
  ])("labels the turn's closing run from %s", async (_name, tool, line, hook = plain) => {
    expect(await closingRunMetadata(tool, line, hook)).toMatchObject({
      ls_git_repo: "acme/beta",
      ls_git_branch: "trunk-beta",
    });
  });
});

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSessionState, loadState, saveState } from "../state.js";
import type { SessionState } from "../types.js";

const mocks = vi.hoisted(() => ({
  readStdin: vi.fn(),
  config: vi.fn(),
  postRun: vi.fn(),
  patchRun: vi.fn(),
  flush: vi.fn(),
  log: vi.fn(),
  error: vi.fn(),
}));

// Exercise the real hook, transcript parser, state, tracing and privacy boundary.
// Only the SDK transport and hook environment are replaced; no network calls.
vi.mock("langsmith", async (importOriginal) => {
  const actual = await importOriginal<typeof import("langsmith")>();
  class MockClient {
    awaitPendingTraceBatches = mocks.flush;
  }
  return {
    ...actual,
    Client: MockClient,
    RunTree: class {
      static getSharedClient() {
        return new MockClient();
      }
      constructor(private config: Record<string, unknown>) {}
      async postRun() {
        await mocks.postRun(this.config);
      }
      async patchRun() {
        await mocks.patchRun(this.config);
      }
    },
  };
});
vi.mock("../utils/stdin.js", () => ({ readStdin: mocks.readStdin }));
vi.mock("../utils/hook-init.js", () => ({
  initHook: mocks.config,
  expandHome: (path: string) => path,
}));
vi.mock("../logger.js", () => ({
  debug: vi.fn(),
  error: mocks.error,
  warn: vi.fn(),
  log: mocks.log,
}));

const sessionId = "stop-privacy";
const runId = "01941f29-7c00-7000-8000-000000000001";
const secrets = {
  prompt: "PRIVATE USER PROMPT",
  assistant: "PRIVATE ASSISTANT RESPONSE",
  thinking: "PRIVATE THINKING",
  toolInput: "PRIVATE TOOL INPUT",
  toolOutput: "PRIVATE TOOL OUTPUT",
  metadata: "PRIVATE CUSTOM METADATA",
};
let directory: string;
let stateFilePath: string;
let transcriptPath: string;

function session(): SessionState {
  return getSessionState(loadState(stateFilePath), sessionId);
}

function seed(overrides: Partial<SessionState> = {}): void {
  saveState(stateFilePath, {
    [sessionId]: {
      last_line: -1,
      turn_count: 0,
      updated: new Date().toISOString(),
      tracing: "metadata",
      current_turn_run_id: runId,
      current_trace_id: runId,
      current_dotted_order: `20250101T000000000000Z${runId}`,
      current_turn_start: Date.parse("2025-01-01T00:00:00Z"),
      ...overrides,
    },
  });
}

function writeTranscript(): void {
  const messages = [
    {
      type: "user",
      promptId: "prompt-1",
      timestamp: "2025-01-01T00:00:00Z",
      message: { role: "user", content: secrets.prompt },
    },
    {
      type: "assistant",
      timestamp: "2025-01-01T00:00:01Z",
      message: {
        id: "msg-1",
        role: "assistant",
        model: "claude-sonnet-4-5",
        content: [
          { type: "thinking", thinking: secrets.thinking },
          { type: "tool_use", id: "tool-1", name: "Bash", input: { command: secrets.toolInput } },
        ],
        usage: { input_tokens: 10, output_tokens: 5 },
      },
    },
    {
      type: "user",
      timestamp: "2025-01-01T00:00:02Z",
      message: {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: "tool-1", content: secrets.toolOutput }],
      },
    },
    {
      type: "assistant",
      timestamp: "2025-01-01T00:00:03Z",
      message: {
        id: "msg-2",
        role: "assistant",
        model: "claude-sonnet-4-5",
        content: [{ type: "text", text: secrets.assistant }],
        usage: { input_tokens: 20, output_tokens: 8 },
        stop_reason: "end_turn",
      },
    },
  ];
  writeFileSync(
    transcriptPath,
    messages.map((message) => JSON.stringify(message)).join("\n") + "\n",
  );
}

async function runHook(empty = false): Promise<void> {
  vi.resetModules();
  await import("./stop.js");
  // main() is invoked on import but its promise is not exported. For traced
  // turns wait past the final flush; for empty input wait for atomic cleanup.
  await vi.waitFor(() => {
    if (empty) {
      expect(session().current_turn_run_id).toBeUndefined();
      expect(session().current_turn_tracing).toBeUndefined();
    } else {
      expect(mocks.log).toHaveBeenCalledWith(expect.stringMatching(/^Processed 1 turns in /));
    }
  });
  expect(mocks.error).not.toHaveBeenCalled();
}

function payloads() {
  return [...mocks.postRun.mock.calls, ...mocks.patchRun.mock.calls].map(([payload]) => payload);
}

function expectMetadataOnly(): void {
  const runs = payloads();
  expect(runs.length).toBeGreaterThan(0);
  expect(new Set(runs.map((run) => run.run_type))).toEqual(new Set(["chain", "llm", "tool"]));
  for (const run of runs) {
    expect(run.inputs).toEqual({});
    expect(run.outputs).toEqual({});
    expect(run.extra.metadata).toMatchObject({
      thread_id: sessionId,
      ls_tracing_mode: "metadata",
    });
  }
  const serialized = JSON.stringify(runs);
  for (const secret of Object.values(secrets)) expect(serialized).not.toContain(secret);
  expect(session().last_line).toBe(3);
  expect(session().turn_count).toBe(1);
}

beforeEach(() => {
  vi.clearAllMocks();
  directory = mkdtempSync(join(tmpdir(), "stop-privacy-"));
  stateFilePath = join(directory, "state.json");
  transcriptPath = join(directory, "transcript.jsonl");
  mocks.config.mockReturnValue({
    enabled: true,
    apiKey: "test-key",
    project: "test-project",
    stateFilePath,
    customMetadata: { private: secrets.metadata },
  });
  mocks.readStdin.mockResolvedValue({
    session_id: sessionId,
    transcript_path: transcriptPath,
    cwd: directory,
    stop_hook_active: false,
    last_assistant_message: secrets.assistant,
  });
  mocks.postRun.mockResolvedValue(undefined);
  mocks.patchRun.mockResolvedValue(undefined);
  mocks.flush.mockResolvedValue(undefined);
  writeTranscript();
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});

describe("Stop privacy snapshot", () => {
  it.each(["{broken json", JSON.stringify({ [sessionId]: { tracing: "metadata" } })])(
    "fails closed with malformed state: %s",
    async (state) => {
      writeFileSync(stateFilePath, state);
      await runHook();
      expectMetadataOnly();
    },
  );

  it.each(["metadata", "full"] as const)(
    "fails closed without a turn snapshot even when thread policy is %s",
    async (tracing) => {
      seed({ tracing });
      await runHook();
      expectMetadataOnly();
      expect(mocks.patchRun).toHaveBeenCalledWith(
        expect.objectContaining({ id: runId, run_type: "chain" }),
      );
      expect(session().current_turn_run_id).toBeUndefined();
    },
  );

  it("fails closed when the state file is missing", async () => {
    await runHook();
    expectMetadataOnly();
  });

  it("preserves a known full snapshot despite metadata thread policy", async () => {
    seed({ tracing: "metadata", current_turn_tracing: "full" });
    await runHook();
    const serialized = JSON.stringify(payloads());
    for (const secret of Object.values(secrets)) expect(serialized).toContain(secret);
    expect(mocks.patchRun).toHaveBeenCalledWith(
      expect.objectContaining({
        id: runId,
        outputs: { messages: [{ role: "assistant", content: secrets.assistant }] },
      }),
    );
    expect(session().current_turn_tracing).toBeUndefined();
    expect(session().current_turn_run_id).toBeUndefined();
  });

  it.each([runId, undefined])(
    "clears the privacy snapshot on an empty transcript (turn identity: %s)",
    async (currentTurnRunId) => {
      seed({ current_turn_run_id: currentTurnRunId, current_turn_tracing: "full" });
      writeFileSync(transcriptPath, "");
      await runHook(true);
      expect(payloads()).toEqual([]);
      expect(session().tracing).toBe("metadata");
      expect(session().last_line).toBe(-1);
      expect(session().turn_count).toBe(0);
    },
  );
});

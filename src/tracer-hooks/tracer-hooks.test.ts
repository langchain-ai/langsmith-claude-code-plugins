import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HookNote } from "@langchain/plugins-base/tracer";

vi.mock("../utils/stdin.js", () => ({ readStdin: vi.fn() }));
vi.mock("../engine-worker.js", () => ({ runEngineWorker: vi.fn() }));
vi.mock("@langchain/plugins-base/plugin", async (original) => ({
  ...(await original<typeof import("@langchain/plugins-base/plugin")>()),
  launchDetachedWorker: vi.fn(async () => 1),
}));

import {
  assistant,
  prompt,
  recordingSink,
  toolResult,
  toolUse,
} from "../fixtures/tracer-builder-lines.js";
import { createGitSandbox } from "../fixtures/git-sandbox.js";
import { runEngineWorker } from "../engine-worker.js";
import { createTranscriptBuilder } from "../tracer-builder/tracer-builder.js";
import { setThreadTracingMode } from "../tracing-policy.js";
import { readStdin } from "../utils/stdin.js";
import { readLegacySessions } from "./legacy-sessions.js";
import { NOTE_HANDLERS } from "./tracer-hooks.js";

let home: string;
let stateFile: string;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "tracer hooks "));
  stateFile = join(home, ".claude", "state", "langsmith_state.json");
  vi.stubEnv("HOME", home);
  vi.stubEnv("STATE_FILE", stateFile);
  vi.stubEnv("TRACE_TO_LANGSMITH", "true");
  vi.stubEnv("CC_LANGSMITH_API_KEY", "test-key");
});
afterEach(() => vi.unstubAllEnvs());

async function runHook(event: keyof typeof NOTE_HANDLERS, payload: Record<string, unknown>) {
  vi.mocked(readStdin).mockResolvedValue({ session_id: "s1", cwd: home, ...payload });
  await NOTE_HANDLERS[event]();
  const notes = join(home, ".claude", "state", "langsmith_plugins_base", "notes.jsonl");
  const lines = readFileSync(notes, "utf8").trim().split("\n");
  return lines.map((line) => JSON.parse(line) as HookNote);
}

describe("hook notes", () => {
  it("sends a tool note with the thread's mode, a pinned repository and the sign-in folder", async () => {
    vi.stubEnv("CC_LANGSMITH_METADATA", '{"ls_git_repo":"acme/pinned"}');
    await setThreadTracingMode(stateFile, "s1", "metadata");
    const [note] = await runHook("PreToolUse", { tool_use_id: "t1", transcript_path: "~/t.jsonl" });
    const transcript = join(home, "t.jsonl");
    expect(note).toMatchObject({ tracingMode: "metadata", transcriptPath: transcript });
    expect(note.details).toMatchObject({ toolUseId: "t1", cwd: home });
    expect(note.writer.storageRoot).toBe(join(home, ".claude", "state", "langsmith_plugins_base"));

    const { posts, sink } = recordingSink();
    const builder = createTranscriptBuilder({ sessionId: "s1", savedState: undefined, sink });
    const sandbox = createGitSandbox("tracer hooks repo ");
    const actual = sandbox.makeRepo("actual", "main", "Owner", "git@github.com:acme/actual.git");
    const read = toolUse("t1", "Read", { file_path: join(actual, "seed.txt") });
    builder.receiveNote({ ...note, event: "UserPromptSubmit" });
    builder.readLine(transcript, prompt("p1", 0, "hi"));
    builder.readLine(transcript, assistant("a1", 1, [read]));
    builder.receiveNote(note);
    builder.readLine(transcript, toolResult("r1", 2, "t1"));
    const base = posts.find((r) => r.name === "Read")?.metadata.base;
    expect(base).toMatchObject({ ls_git_repo: "acme/pinned" });
    sandbox.remove();
  });

  it("gives a mute command's own turn the mode from before the command", async () => {
    const [note] = await runHook("UserPromptSubmit", { prompt: "/langsmith-tracing:mute" });
    expect(note).toMatchObject({ event: "UserPromptSubmit", tracingMode: "full" });
    const [, next] = await runHook("UserPromptSubmit", { prompt: "next" });
    expect(next.tracingMode).toBe("metadata");
  });
});

describe("old state import", () => {
  it("finds each session's transcript, upload settings, old drain and open turn", async () => {
    const project = join(home, ".claude", "projects", "-repo");
    const repo = join(home, "repo");
    const folders = [project, join(repo, ".claude"), join(home, ".claude", "state")];
    for (const folder of folders) mkdirSync(folder, { recursive: true });
    writeFileSync(join(repo, ".claude", "langsmith.json"), JSON.stringify({ project: "alpha" }));
    const lines = [{ type: "queue" }, { cwd: repo }, prompt("p1", 0, "hi")];
    const text = lines.map((line) => JSON.stringify(line)).join("\n");
    writeFileSync(join(project, "s1.jsonl"), `${text}\n`);
    writeFileSync(join(project, "s2.jsonl"), "");
    mkdirSync(join(project, "s3.jsonl"));
    const updated = "2026-11-13T12:00:00.000Z";
    const session = { last_line: 3, turn_count: 1, updated, current_turn_tracing: "metadata" };
    const root = { current_turn_run_id: "r", current_trace_id: "r", current_dotted_order: "1" };
    const openTurn = { ...root, current_turn_start: updated };
    const sessions = { s1: { ...session, ...openTurn }, s2: session, s3: session, gone: session };
    writeFileSync(stateFile, JSON.stringify(sessions));

    const storageRoot = join(home, ".claude", "state", "langsmith_plugins_base");
    const [first, second, unreadable, ...rest] = readLegacySessions(stateFile);
    expect(first).toMatchObject({
      sessionId: "s1",
      transcriptPath: join(project, "s1.jsonl"),
      updatedAt: Date.parse(updated),
      tracingMode: "metadata",
      writer: { destinations: [{ projectName: "alpha" }], storageRoot },
      openTurn: { rootRunId: "r", fromStart: true },
    });
    await first.recover?.();
    expect(runEngineWorker).toHaveBeenCalledWith(repo, "s1");
    expect([second.writer, unreadable.writer, rest]).toEqual([undefined, undefined, []]);
  });
});

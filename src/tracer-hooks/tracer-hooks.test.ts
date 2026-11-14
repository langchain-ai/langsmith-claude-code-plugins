import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HookNote } from "@langchain/plugins-base/tracer";

vi.mock("../utils/stdin.js", () => ({ readStdin: vi.fn() }));
vi.mock("@langchain/plugins-base/plugin", async (original) => ({
  ...(await original<typeof import("@langchain/plugins-base/plugin")>()),
  launchDetachedWorker: vi.fn(async () => 1),
}));

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
afterEach(() => {
  vi.unstubAllEnvs();
});

async function runHook(event: keyof typeof NOTE_HANDLERS, payload: Record<string, unknown>) {
  vi.mocked(readStdin).mockResolvedValue({ session_id: "s1", cwd: home, ...payload });
  await NOTE_HANDLERS[event]();
  const notes = join(home, ".claude", "state", "langsmith_plugins_base", "notes.jsonl");
  return readFileSync(notes, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as HookNote);
}

describe("hook notes", () => {
  it("carries the thread's muted mode and the expanded transcript path on a tool note", async () => {
    await setThreadTracingMode(stateFile, "s1", "metadata");
    const [note] = await runHook("PreToolUse", {
      tool_use_id: "t1",
      transcript_path: "~/s1.jsonl",
    });
    expect(note).toMatchObject({ event: "PreToolUse", tracingMode: "metadata" });
    expect(note.details).toMatchObject({ toolUseId: "t1", cwd: home });
    expect(note.transcriptPath).toBe(join(home, "s1.jsonl"));
  });

  it("gives a mute command's own turn the mode from before the command", async () => {
    const [note] = await runHook("UserPromptSubmit", { prompt: "/langsmith-tracing:mute" });
    expect(note).toMatchObject({ event: "UserPromptSubmit", tracingMode: "full" });
    const [, next] = await runHook("UserPromptSubmit", { prompt: "next" });
    expect(next.tracingMode).toBe("metadata");
  });
});

describe("old state import", () => {
  it("finds each session's transcript under the projects folder", () => {
    const project = join(home, ".claude", "projects", "-repo");
    mkdirSync(project, { recursive: true });
    writeFileSync(join(project, "s1.jsonl"), "");
    mkdirSync(join(home, ".claude", "state"), { recursive: true });
    const updated = "2026-11-13T12:00:00.000Z";
    const session = { last_line: 3, turn_count: 1, updated, current_turn_tracing: "metadata" };
    writeFileSync(stateFile, JSON.stringify({ s1: session, gone: { ...session } }));

    expect(readLegacySessions(stateFile)).toEqual([
      {
        sessionId: "s1",
        transcriptPath: join(project, "s1.jsonl"),
        updatedAt: Date.parse(updated),
        tracingMode: "metadata",
      },
    ]);
  });
});

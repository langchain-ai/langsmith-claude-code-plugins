import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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
import type { HookContent } from "../tracer-builder/tracer-builder-models.js";
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
    vi.stubEnv("CC_LANGSMITH_CAPTURE_HOOK_OUTPUTS", "true");
    await setThreadTracingMode(stateFile, "s1", "metadata");
    const [note] = await runHook("PreToolUse", { tool_use_id: "t1", transcript_path: "~/t.jsonl" });
    const transcript = join(home, "t.jsonl");
    expect(note).toMatchObject({ tracingMode: "metadata", transcriptPath: transcript });
    expect(note.details).toMatchObject({ toolUseId: "t1", cwd: home, captureHookOutputs: true });
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

describe("sessions without a transcript", () => {
  const payload = { tool_use_id: "t1", tool_name: "Bash", tool_input: { command: "ls" } };
  const lastNote = async (extra: Record<string, unknown>) =>
    (await runHook("PreToolUse", { ...payload, ...extra })).at(-1)!;

  it("attaches the hook's content to the note only when the switch is on and the path is empty", async () => {
    expect((await lastNote({ transcript_path: "" })).details).not.toHaveProperty("hookContent");
    vi.stubEnv("CC_LANGSMITH_TRACE_WITHOUT_TRANSCRIPT", "true");
    expect((await lastNote({ transcript_path: "~/t.jsonl" })).details).not.toHaveProperty(
      "hookContent",
    );
    expect((await lastNote({ transcript_path: "" })).details).toMatchObject({
      hookContent: { toolName: "Bash", toolInput: { command: "ls" } },
    });
  });

  it("sends no note for a hook that only counts without a transcript, unless the path is empty and the switch is on", async () => {
    const send = async (switchValue: string, transcript_path: string) => {
      vi.stubEnv("CC_LANGSMITH_TRACE_WITHOUT_TRANSCRIPT", switchValue);
      vi.mocked(readStdin).mockResolvedValue({ session_id: "s1", cwd: home, transcript_path });
      await NOTE_HANDLERS.MessageDisplay();
    };
    await send("true", "~/t.jsonl");
    await send("false", "~/t.jsonl");
    await send("false", "");
    expect(
      existsSync(join(home, ".claude", "state", "langsmith_plugins_base", "notes.jsonl")),
    ).toBe(false);
    vi.stubEnv("CC_LANGSMITH_TRACE_WITHOUT_TRANSCRIPT", "true");
    const [note] = await runHook("MessageDisplay", { transcript_path: "", delta: "hi" });
    expect(note.details).toMatchObject({ hookContent: { text: "hi" } });
  });

  it("sends a subagent start note only when the path is empty and the switch is on", async () => {
    const payload = { agent_id: "a1", agent_type: "Explore", transcript_path: "" };
    vi.stubEnv("CC_LANGSMITH_TRACE_WITHOUT_TRANSCRIPT", "true");
    vi.mocked(readStdin).mockResolvedValue({
      session_id: "s1",
      cwd: home,
      ...payload,
      transcript_path: "~/t.jsonl",
    });
    await NOTE_HANDLERS.SubagentStart();
    vi.stubEnv("CC_LANGSMITH_TRACE_WITHOUT_TRANSCRIPT", "false");
    vi.mocked(readStdin).mockResolvedValue({ session_id: "s1", cwd: home, ...payload });
    await NOTE_HANDLERS.SubagentStart();
    expect(
      existsSync(join(home, ".claude", "state", "langsmith_plugins_base", "notes.jsonl")),
    ).toBe(false);
    vi.stubEnv("CC_LANGSMITH_TRACE_WITHOUT_TRANSCRIPT", "true");
    const [note] = await runHook("SubagentStart", payload);
    expect(note).toMatchObject({ event: "SubagentStart", agentId: "a1" });
    expect(note.details).toMatchObject({ hookContent: { agentType: "Explore" } });
  });

  describe("with a large tool value", () => {
    const LIMIT = 1024 * 1024;
    const sentHookContent = async (extra: Record<string, unknown>) => {
      vi.stubEnv("CC_LANGSMITH_TRACE_WITHOUT_TRANSCRIPT", "true");
      const note = await lastNote({ transcript_path: "", ...extra });
      return (note.details as { hookContent: { toolInput: unknown; toolResponse: unknown } })
        .hookContent;
    };
    const sentContent = async (response: unknown) =>
      (await sentHookContent({ tool_response: response })).toolResponse;

    it("attaches a value at the limit unchanged", async () => {
      const text = "a".repeat(LIMIT);
      expect(await sentContent(text)).toBe(text);
      const object = { out: "a".repeat(LIMIT - 10) };
      expect(await sentContent(object)).toEqual(object);
    });

    it("cuts a response or an input over the limit to 1 MB plus a marker with the original size", async () => {
      const { toolInput } = await sentHookContent({ tool_input: "b".repeat(LIMIT + 1) });
      expect(toolInput).toBe(
        `${"b".repeat(LIMIT)}\n[Cut to 1 MB, original size ${LIMIT + 1} bytes]`,
      );
      const cut = await sentContent("a".repeat(LIMIT + 5));
      expect(cut).toBe(`${"a".repeat(LIMIT)}\n[Cut to 1 MB, original size ${LIMIT + 5} bytes]`);
      const objectCut = await sentContent({ out: "a".repeat(LIMIT) });
      const json = JSON.stringify({ out: "a".repeat(LIMIT) });
      expect(objectCut).toBe(
        `${json.slice(0, LIMIT)}\n[Cut to 1 MB, original size ${json.length} bytes]`,
      );
    });

    it("attaches each batched tool's response, cut the same way, without its input", async () => {
      vi.stubEnv("CC_LANGSMITH_TRACE_WITHOUT_TRANSCRIPT", "true");
      const call = {
        tool_use_id: "t1",
        tool_input: { command: "ls" },
        tool_response: "c".repeat(LIMIT + 1),
      };
      const [note] = await runHook("PostToolBatch", { transcript_path: "", tool_calls: [call] });
      expect((note.details as { hookContent: HookContent }).hookContent.toolCalls).toEqual([
        {
          toolUseId: "t1",
          toolResponse: `${"c".repeat(LIMIT)}\n[Cut to 1 MB, original size ${LIMIT + 1} bytes]`,
        },
      ]);
    });

    it("cuts a subagent's tool value the same way", async () => {
      vi.stubEnv("CC_LANGSMITH_TRACE_WITHOUT_TRANSCRIPT", "true");
      const sent = await lastNote({
        transcript_path: "",
        agent_id: "a1",
        tool_response: "c".repeat(LIMIT + 2),
      });
      expect(sent.agentId).toBe("a1");
      expect(sent.details).toMatchObject({
        hookContent: {
          toolResponse: `${"c".repeat(LIMIT)}\n[Cut to 1 MB, original size ${LIMIT + 2} bytes]`,
        },
      });
    });

    it("does not split a multi-byte character at the cut", async () => {
      const text = `${"a".repeat(LIMIT - 1)}\u20ac\u20ac`;
      const cut = await sentContent(text);
      const size = LIMIT - 1 + 6;
      expect(cut).toBe(`${"a".repeat(LIMIT - 1)}\n[Cut to 1 MB, original size ${size} bytes]`);
    });
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

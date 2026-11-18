import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assistant,
  at,
  note,
  prompt,
  recordingSink,
  toolResult,
  toolUse,
} from "../fixtures/tracer-builder-lines.js";
import { stableRunId } from "../utils/ids/run-id.js";
import type { SessionState } from "../types.js";
import { createTranscriptBuilder, legacyOpenTurn } from "./tracer-builder.js";
import type { NoteDetails } from "./tracer-builder-models.js";
import type { HookNote, TracingMode, TranscriptLine } from "@langchain/plugins-base/tracer";

function fakeSession(tracingMode?: TracingMode, savedState?: unknown) {
  const mainPath = "/transcripts/session.jsonl";
  const { posts, patches, sink } = recordingSink();
  const builder = createTranscriptBuilder({ sessionId: "session", savedState, sink, tracingMode });
  builder.receiveNote(note("SessionStart", { transcriptPath: mainPath }));
  const main = (...lines: object[]) =>
    lines.forEach((line) => builder.readLine(mainPath, line as TranscriptLine));
  const send = (event: string, fields: Partial<HookNote> = {}, details: NoteDetails = {}) =>
    builder.receiveNote(note(event, { sessionId: "session", ...fields, details: { ...details } }));
  const run = (name: string) => posts.find((post) => post.name === name)!;
  return { builder, posts, patches, main, send, run };
}

const ms = (second: number) => Date.parse(at(second));

describe("hook notes", () => {
  it("keeps a muted turn's runs muted and a muted tool muted after an unmute", () => {
    const { posts, patches, main, send, run } = fakeSession();
    send("UserPromptSubmit", { tracingMode: "metadata" }, { time: ms(0) });
    main(prompt("p1", 1, "secret"), assistant("a1", 2, [toolUse("t1")]));
    send("PreToolUse", { tracingMode: "full" }, { time: ms(3), toolUseId: "t1" });
    main(toolResult("r1", 4, "t1"), assistant("a2", 5, [{ type: "text", text: "ok" }], "end_turn"));
    send("Stop");
    send("UserPromptSubmit", { tracingMode: "full" }, { time: ms(10) });
    main(prompt("p2", 11, "public"), assistant("a3", 12, [toolUse("t2", "Read")]));
    send("PreToolUse", { tracingMode: "metadata" }, { time: ms(13), toolUseId: "t2" });
    send("UserPromptSubmit", { tracingMode: "full" }, { time: ms(14) });
    main(toolResult("r2", 15, "t2"));

    const firstTurn = stableRunId(at(0), "session", 1);
    expect(run("Claude Code Turn").id).toBe(firstTurn);
    expect(run("Bash").id).toBe(stableRunId(ms(3), "session", "t1"));
    const runs = [...posts, ...patches];
    const muted = runs.filter((r) => r.trace_id === firstTurn || r.name === "Read");
    expect(muted.length).toBe(8);
    expect(muted.every((r) => r.tracingMode === "metadata")).toBe(true);

    send("Stop");
    send("UserPromptSubmit", { tracingMode: "off" }, { time: ms(20) });
    main(prompt("p3", 21, "hidden"), assistant("a4", 22, [toolUse("t3", "Grep")]));
    send("PreToolUse", { tracingMode: "full" }, { time: ms(23), toolUseId: "t3" });
    expect(run("Grep").tracingMode).toBe("off");
  });

  it("starts a compaction no later than its boundary line when the hook clock runs ahead", () => {
    const { builder, main, send } = fakeSession();
    send("PreCompact", {}, { time: ms(30) });
    main({ type: "system", subtype: "compact_boundary", timestamp: at(5) });
    expect(builder.state()).toMatchObject({ compaction: { start: at(5) } });
  });

  it("closes a failed turn with the API error", () => {
    const { posts, patches, main, send } = fakeSession();
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 0, "hi"), assistant("a1", 1, [toolUse("t1")]));
    send("UserPromptSubmit", {}, { time: ms(2) });
    send("StopFailure", {}, { error: "rate_limit", errorDetails: "429 Too Many Requests" });
    main(assistant("a2", 9, [{ type: "text", text: "later" }], "end_turn"));

    const turn = patches.find((r) => r.name === "Claude Code Turn");
    expect(turn?.error).toBe("rate_limit: 429 Too Many Requests");
    expect(posts.filter((r) => r.name === "Claude Code Turn")[1].start_time).toBe(at(9));
  });

  it("gives each model call its turn's conversation and each turn its whole reply", () => {
    const { builder, posts, patches, main, send } = fakeSession();
    const text = (said: string) => [{ type: "text", text: said }];
    const notice = { ...prompt("n1", 2, "<task-notification/>"), queueTranscriptOnly: true };
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 0, "list files"), assistant("a1", 1, [toolUse("t1")]));
    const sameCall = { ...assistant("a1", 2, text("checking")), uuid: "a1-more" };
    const rest = { ...assistant("a2", 3, text("world"), "end_turn"), uuid: "a2-more" };
    main(toolResult("r1", 2, "t1"), notice, sameCall, assistant("a2", 3, text("Hello ")), rest);
    expect(builder.turnOpen()).toBe(true);
    send("UserPromptSubmit", {}, { time: ms(4) });
    send("Stop");
    main(prompt("i1", 5, "[Request interrupted by user]", "p1"));
    main(notice, assistant("a3", 8, text("agent finished"), "end_turn"));
    send("Stop");
    expect(builder.turnOpen()).toBe(false);

    const turns = posts.filter((r) => r.name === "Claude Code Turn");
    const calls = posts.filter((r) => r.name === "Claude");
    const roles = (input: unknown) =>
      (input as { messages: { role: string }[] }).messages.map((m) => m.role);
    expect(calls.map((r) => roles(r.inputs))).toEqual([
      ["user"],
      ["user", "assistant", "tool"],
      [],
    ]);
    expect(turns.map((r) => r.start_time)).toEqual([at(0), at(8)]);
    expect(calls[2].parent_run_id).toBe(turns[1].id);
    const reply = { messages: [{ role: "assistant", content: "Hello world" }] };
    expect(patches.find((r) => r.name === "Claude Code Turn")?.outputs).toEqual(reply);
  });

  it("keeps a big tool output on its own run and a stub in the model history", () => {
    const { posts, patches, main, send } = fakeSession();
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 0, "read it"), assistant("a1", 1, [toolUse("t1")]));
    main(toolResult("r1", 2, "t1", undefined, "x".repeat(9000)));
    main(assistant("a2", 3, [{ type: "text", text: "ok" }], "end_turn"));
    send("Stop");

    expect(patches.find((r) => r.name === "Bash")?.outputs).toEqual({ output: "x".repeat(9000) });
    const inputs = posts.filter((r) => r.name === "Claude")[1].inputs as { messages: unknown[] };
    const stub = "[9027 bytes left out here, the full content is on the run that made it]";
    expect(inputs.messages[2]).toEqual({ role: "tool", tool_call_id: "t1", content: stub });
  });

  it("stubs a turn's oldest model history past the cap, even from a snapshot without a total", () => {
    const first = fakeSession();
    const ask = "y".repeat(1000);
    const uses = Array.from({ length: 523 }, (_, i) => toolUse(`t${i}`));
    const results = uses.map((use, i) =>
      toolResult(`r${i}`, 2, use.id, undefined, i === 0 ? "done" : "x".repeat(8000)),
    );
    first.send("UserPromptSubmit", {}, { time: ms(0) });
    first.main(prompt("p1", 0, ask), assistant("a1", 1, uses), ...results.slice(0, 500));
    const saved = JSON.parse(JSON.stringify(first.builder.state()));
    delete saved.threads.main.historyBytes;

    const { builder, posts, main, send } = fakeSession(undefined, saved);
    main(...results.slice(500), assistant("a2", 3, [{ type: "text", text: "ok" }], "end_turn"));
    send("Stop");

    const inputs = posts.find((r) => r.name === "Claude" && r.start_time === at(3))!.inputs;
    const contents = (inputs as { messages: { content: unknown }[] }).messages.map(
      (m) => m.content,
    );
    const stub = (bytes: number) =>
      `[${bytes} bytes left out here, the full content is on the run that made it]`;
    expect(contents.slice(0, 7)).toEqual([
      [{ type: "text", text: ask }],
      stub(37024),
      [{ type: "text", text: "done" }],
      stub(8027),
      stub(8027),
      stub(8027),
      [{ type: "text", text: "x".repeat(8000) }],
    ]);
    expect(builder.state()).toMatchObject({ threads: { main: { messages: [], historyBytes: 0 } } });
  });

  it("puts a turn that has no prompt hook on the hook clock in the saved mode", () => {
    const { posts, main, send } = fakeSession("metadata");
    const replayShift = 86_400_000;
    send("UserPromptSubmit", {}, { time: ms(0) + replayShift });
    main(prompt("p1", 0, "hi"), assistant("a1", 1, [{ type: "text", text: "hey" }], "end_turn"));
    send("Stop");
    main(prompt("p2", 30, "from a peer"), assistant("a2", 31, [{ type: "text", text: "ok" }]));

    const turns = posts.filter((r) => r.name === "Claude Code Turn");
    const starts = [ms(0), ms(30)].map((t) => t + replayShift);
    expect(turns.map((r) => Date.parse(r.start_time))).toEqual(starts);
    expect(posts.every((r) => r.tracingMode === "metadata")).toBe(true);
  });

  it("continues an old engine's open turn from its prompt under the old root", () => {
    const transcript = join(mkdtempSync(join(tmpdir(), "open turn ")), "session.jsonl");
    const done = [prompt("p1", 0, "hi"), assistant("a1", 1, [], "end_turn")];
    const open = [prompt("p2", 10, "go"), assistant("a2", 11, [toolUse("t1")])];
    const next = prompt("p3", 20, "next");
    const text = [...done, ...open, next].map((line) => JSON.stringify(line));
    writeFileSync(transcript, `${text.join("\n")}\n{"type":"us`);
    const root = { current_turn_run_id: "root", current_trace_id: "t", current_dotted_order: "1" };
    const session = { ...root, current_turn_number: 2, current_turn_tracing: "metadata" };
    const openTurn = (start: number, path = transcript) =>
      legacyOpenTurn({ ...session, current_turn_start: at(start) } as SessionState, path);
    expect(openTurn(0)).toMatchObject({ fromStart: true });
    expect(openTurn(10, join(tmpdir(), "missing.jsonl"))).toBeUndefined();
    const turn = openTurn(10);
    expect(turn).toMatchObject({ rootRunId: "root", afterLineId: "a1" });

    const { posts, main } = fakeSession(undefined, turn?.builderState);
    main(...open, assistant("a3", 12, [], "end_turn"), next, assistant("a4", 21, []));
    const id = stableRunId(at(11), "root", "p2", 0);
    const call = { id, parent_run_id: "root", trace_id: "t", tracingMode: "metadata" };
    expect(posts[0]).toMatchObject({ ...call, metadata: { turnNumber: 2 } });
    const turns = posts.filter((r) => r.name === "Claude Code Turn");
    expect(turns).toMatchObject([{ start_time: at(20) }]);
  });
});

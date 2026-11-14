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
import { createTranscriptBuilder } from "./tracer-builder.js";
import type { NoteDetails } from "./tracer-builder-models.js";
import type { HookNote, TranscriptLine } from "@langchain/plugins-base/tracer";

function fakeSession() {
  const mainPath = "/transcripts/session.jsonl";
  const { posts, patches, sink } = recordingSink();
  const builder = createTranscriptBuilder({ sessionId: "session", savedState: undefined, sink });
  builder.receiveNote(note("SessionStart", { transcriptPath: mainPath }));
  const main = (...lines: object[]) =>
    lines.forEach((line) => builder.readLine(mainPath, line as TranscriptLine));
  const send = (event: string, fields: Partial<HookNote> = {}, details: NoteDetails = {}) =>
    builder.receiveNote(note(event, { sessionId: "session", ...fields, details: { ...details } }));
  const run = (name: string) => posts.find((post) => post.name === name)!;
  return { posts, patches, main, send, run };
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
    const muted = [...posts, ...patches].filter(
      (r) => r.trace_id === firstTurn || r.name === "Read",
    );
    expect(muted.length).toBe(8);
    expect(muted.every((r) => r.tracingMode === "metadata")).toBe(true);

    send("Stop");
    send("UserPromptSubmit", { tracingMode: "off" }, { time: ms(20) });
    main(prompt("p3", 21, "hidden"), assistant("a4", 22, [toolUse("t3", "Grep")]));
    send("PreToolUse", { tracingMode: "full" }, { time: ms(23), toolUseId: "t3" });
    expect(run("Grep").tracingMode).toBe("off");
  });

  it("opens a turn for work that follows a Stop with no prompt line", () => {
    const { posts, main, send } = fakeSession();
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 0, "hi"), assistant("a1", 2, [{ type: "text", text: "hey" }], "end_turn"));
    send("Stop");
    main(assistant("a2", 8, [{ type: "text", text: "agent finished" }], "end_turn"));
    send("Stop");

    const turns = posts.filter((r) => r.name === "Claude Code Turn");
    const model = posts.find((r) => r.name === "Claude" && r.start_time === at(8));
    expect(turns.map((r) => r.start_time)).toEqual([at(0), at(8)]);
    expect(model?.parent_run_id).toBe(turns[1].id);
  });

  it("closes a failed turn with the API error", () => {
    const { patches, main, send } = fakeSession();
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 0, "hi"), assistant("a1", 1, [toolUse("t1")]));
    send("StopFailure", {}, { error: "rate_limit", errorDetails: "429 Too Many Requests" });

    const turn = patches.find((r) => r.name === "Claude Code Turn");
    expect(turn?.error).toBe("rate_limit: 429 Too Many Requests");
  });

  it("puts a turn that has no prompt hook on the hook clock", () => {
    const { posts, main, send } = fakeSession();
    const replayShift = 86_400_000;
    send("UserPromptSubmit", {}, { time: ms(0) + replayShift });
    main(prompt("p1", 0, "hi"), assistant("a1", 1, [{ type: "text", text: "hey" }], "end_turn"));
    send("Stop");
    main(prompt("p2", 30, "from a peer"), assistant("a2", 31, [{ type: "text", text: "ok" }]));

    const turns = posts.filter((r) => r.name === "Claude Code Turn");
    expect(turns.map((r) => Date.parse(r.start_time))).toEqual(
      [ms(0), ms(30)].map((t) => t + replayShift),
    );
  });
});

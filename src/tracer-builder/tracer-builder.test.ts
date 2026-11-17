import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { createGitSandbox } from "../fixtures/git-sandbox.js";
import {
  assistant,
  at,
  note,
  prompt,
  recordingSink,
  toolResult,
  toolUse,
} from "../fixtures/tracer-builder-lines.js";
import { generateDottedOrderSegment } from "../langsmith.js";
import { stableRunId } from "../utils/ids/run-id.js";
import type { SessionState } from "../types.js";
import { lastLineUuid, subagentTranscriptPath } from "./subagent-files.js";
import { createTranscriptBuilder, legacyOpenTurn } from "./tracer-builder.js";
import type { BuilderState, NoteDetails } from "./tracer-builder-models.js";
import type { HookNote, TracingMode, TranscriptLine } from "@langchain/plugins-base/tracer";

function fakeSession(tracingMode?: TracingMode, savedState?: unknown) {
  const dir = mkdtempSync(join(tmpdir(), "tracer-builder-"));
  const mainPath = join(dir, "session.jsonl");
  const { posts, patches, sink } = recordingSink();
  const builder = createTranscriptBuilder({ sessionId: "session", savedState, sink, tracingMode });
  builder.receiveNote(note("SessionStart", { transcriptPath: mainPath }));
  const subagent = (agentId: string, lines: object[]) => {
    const path = subagentTranscriptPath(mainPath, "session", agentId);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, lines.map((line) => JSON.stringify(line)).join("\n") + "\n");
    return () => {
      expect(builder.transcripts()).toContain(path);
      for (const line of lines) builder.readLine(path, line as TranscriptLine);
    };
  };
  const meta = (agentId: string, toolUseId: string) =>
    writeFileSync(
      join(dir, "session", "subagents", `agent-${agentId}.meta.json`),
      JSON.stringify({ toolUseId }),
    );
  const main = (...lines: object[]) =>
    lines.forEach((line) => builder.readLine(mainPath, line as TranscriptLine));
  const send = (event: string, fields: Partial<HookNote> = {}, details: NoteDetails = {}) =>
    builder.receiveNote(note(event, { sessionId: "session", ...fields, details: { ...details } }));
  const run = (name: string) => posts.find((post) => post.name === name)!;
  return { posts, patches, builder, main, subagent, meta, send, run };
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
    const { main, send, run } = fakeSession();
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 1, "hi"));
    send("PreCompact", {}, { time: ms(30) });
    const boundary = { type: "system", subtype: "compact_boundary", uuid: "c1", timestamp: at(5) };
    main(boundary, prompt("s1", 6, "summary"));
    const compaction = run("Context Compaction (auto)");
    expect(compaction.start_time).toBe(at(5));
  });

  it("reports a turn open from its prompt until it stops", () => {
    const { builder, main, send } = fakeSession();
    expect(builder.turnOpen()).toBe(false);
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 1, "hi"), assistant("a1", 2, [{ type: "text", text: "ok" }], "end_turn"));
    expect(builder.turnOpen()).toBe(true);
    send("Stop");
    expect(builder.turnOpen()).toBe(false);
  });

  it("leaves a transcript-only notice out of turn prompts and model inputs", () => {
    const { posts, main, send } = fakeSession();
    const said = (text: string) => [{ type: "text", text }];
    const notice = prompt("n1", 3, "<task-notification>bg1</task-notification>");
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 1, "first"), assistant("a1", 2, [toolUse("t1")]));
    main({ ...notice, queueTranscriptOnly: true }, toolResult("r1", 4, "t1"));
    main(assistant("a2", 5, said("ok"), "end_turn"));
    send("Stop");
    main({ ...notice, uuid: "n2", queueTranscriptOnly: true });
    send("UserPromptSubmit", {}, { time: ms(11) });
    main({ ...prompt("p2", 12, "from a peer"), isMeta: true });
    main(assistant("a3", 13, said("done"), "end_turn"));
    send("Stop");

    const turns = posts.filter((r) => r.name === "Claude Code Turn");
    expect(JSON.stringify(turns[1]?.inputs)).toContain("from a peer");
    expect(JSON.stringify(posts)).not.toContain("bg1");
  });

  it("keeps a stopped turn's late interrupt notice out of the next turn's prompt", () => {
    const { posts, main, send } = fakeSession();
    const said = (text: string) => [{ type: "text", text }];
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 1, "first"), assistant("a1", 2, said("ok"), "end_turn"));
    send("Stop");
    main(prompt("i1", 3, "[Request interrupted by user]", "p1"));
    send("UserPromptSubmit", {}, { time: ms(4) });
    main({ ...prompt("p2", 5, "from a peer"), isMeta: true });
    main(assistant("a2", 6, said("done"), "end_turn"));
    send("Stop");

    const turns = posts.filter((r) => r.name === "Claude Code Turn");
    expect(JSON.stringify(turns[1]?.inputs)).toContain("from a peer");
  });

  it("keeps the prompt of a turn that reuses the previous turn's prompt id", () => {
    const { posts, main, send } = fakeSession();
    const said = (text: string) => [{ type: "text", text }];
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 1, "first"), assistant("a1", 2, said("ok"), "end_turn"));
    send("Stop");
    send("UserPromptSubmit", {}, { time: ms(3) });
    main(prompt("p2", 4, "second", "p1"), assistant("a2", 5, said("done"), "end_turn"));
    send("Stop");

    const turns = posts.filter((r) => r.name === "Claude Code Turn");
    expect(JSON.stringify(turns[1]?.inputs)).toContain("second");
  });

  it("keeps a blocked Stop's continuation in the same turn and closes it at the final Stop", () => {
    const { posts, patches, main, send } = fakeSession();
    const said = (text: string) => [{ type: "text", text }];
    const blocked = { hookEvent: "Stop", type: "hook_blocking_error" };
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 1, "first"), assistant("a1", 2, said("draft"), "end_turn"));
    send("Stop", {}, { lastAssistantMessage: "draft" });
    main({ ...prompt("f1", 3, "Stop hook feedback: retry", "p1"), isMeta: true });
    main({ type: "attachment", uuid: "b1", timestamp: at(3), attachment: blocked });
    main(assistant("a2", 4, said("final"), "end_turn"));
    send("Stop", {}, { lastAssistantMessage: "final" });
    main({ ...prompt("c1", 5, "<system-reminder>x</system-reminder>", "p2"), turnCompanion: true });
    send("UserPromptSubmit", {}, { time: ms(6) });
    main(prompt("p2", 6, "<task-notification>done</task-notification>"));
    main(assistant("a3", 7, said("noted"), "end_turn"));

    const turns = posts.filter((r) => r.name === "Claude Code Turn");
    expect(turns.length).toBe(2);
    const closes = patches.filter((r) => r.id === turns[0]?.id);
    expect(JSON.stringify(closes.at(-1)?.outputs)).toContain("final");
    expect(JSON.stringify(turns[1]?.inputs)).toContain("task-notification");
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
    const { posts, patches, main, send } = fakeSession();
    const text = (said: string) => [{ type: "text", text: said }];
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 0, "list files"), assistant("a1", 1, [toolUse("t1")]));
    const sameCall = { ...assistant("a1", 2, text("checking")), uuid: "a1-more" };
    const rest = { ...assistant("a2", 3, text("world"), "end_turn"), uuid: "a2-more" };
    main(toolResult("r1", 2, "t1"), sameCall, assistant("a2", 3, text("Hello ")), rest);
    send("UserPromptSubmit", {}, { time: ms(4) });
    send("Stop");
    main(assistant("a3", 8, text("agent finished"), "end_turn"));
    send("Stop");

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

describe("subagents", () => {
  it("nests a muted background agent and its notification turn, closing the launching turn last", () => {
    const { posts, patches, main, subagent, send, run } = fakeSession();
    const outside = generateDottedOrderSegment(at(0), "01a183b1-e99b-70a0-a3a6-a3dedc3ce970");
    const outsideStart = { time: ms(0), parentDottedOrder: outside };
    send("UserPromptSubmit", { tracingMode: "metadata" }, outsideStart);
    const agent = toolUse("t1", "Agent", { subagent_type: "Explore" });
    main(prompt("p1", 1, "go"), assistant("a1", 2, [agent]));
    send("PreToolUse", {}, { time: ms(3), toolUseId: "t1" });
    main(toolResult("r1", 4, "t1", { status: "async_launched", agentId: "bg1" }));
    main(assistant("a2", 5, [{ type: "text", text: "launched" }], "end_turn"));
    send("Stop");
    const found = assistant("s2", 9, [{ type: "text", text: "found" }], "end_turn");
    subagent("bg1", [prompt("s1", 6, "explore"), found])();
    send("SubagentStop", { agentId: "bg1" });
    send("UserPromptSubmit", { tracingMode: "full" }, { time: ms(20) });
    main(prompt("p2", 20, "<task-notification><task-id>bg1</task-id></task-notification>"));
    main(assistant("a3", 21, [{ type: "text", text: "noted" }], "end_turn"));
    const closedBeforeNotification = patches.map((r) => r.name);
    send("Stop");

    const [tool, chain] = [run("Agent"), run("Explore Subagent")];
    const [launching, notification] = posts.filter((r) => r.name === "Claude Code Turn");
    expect(chain.id).toBe(stableRunId(at(3), tool.id, "bg1"));
    expect(chain.parent_run_id).toBe(tool.id);
    expect(posts.find((r) => r.start_time === at(9))?.parent_run_id).toBe(chain.id);
    expect(notification.parent_run_id).toBe(tool.id);
    expect(closedBeforeNotification).toEqual(["Explore Subagent"]);
    expect(patches.slice(1).map((r) => r.id)).toEqual([notification.id, tool.id, launching.id]);
    expect(notification.tracingMode).toBe("metadata");
    expect(launching.dotted_order.startsWith(`${outside}.`)).toBe(true);
  });

  it("closes a turn whose background agent never reports back once the wait limit passes", () => {
    const { patches, main } = fakeSession();
    main(prompt("p1", 1, "go"), assistant("a1", 2, [toolUse("t1", "Agent")]));
    main(toolResult("r1", 3, "t1", { status: "async_launched", agentId: "lost" }));
    main(prompt("p2", 4 + 4 * 60 * 60, "later"));
    expect(patches.slice(1)).toMatchObject([
      { name: "Agent", end_time: at(3), outputs: { output: "No result" } },
      { name: "Claude Code Turn", end_time: at(3) },
    ]);
  });

  it("closes a subagent at its last line's own id even past a long line", () => {
    const path = join(mkdtempSync(join(tmpdir(), "tracer-builder-")), "agent.jsonl");
    const nested = { message: { content: [{ input: { uuid: "inner" } }] }, uuid: "outer" };
    writeFileSync(path, `${JSON.stringify({ uuid: "first" })}\n${JSON.stringify(nested)}\n`);
    expect(lastLineUuid(path)).toBe("outer");
    writeFileSync(path, `${JSON.stringify({ text: "x".repeat(100_000), uuid: "long" })}\n`);
    expect(lastLineUuid(path)).toBe("long");
  });

  it("nests an agent launched by a subagent, posting the outer one once when it stops early", () => {
    const { posts, patches, builder, main, subagent, meta, send, run } = fakeSession();
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 1, "go"), assistant("a1", 2, [toolUse("t1", "Agent")]));
    send("PreToolUse", {}, { time: ms(3), toolUseId: "t1" });
    const outer = subagent("outer", [
      prompt("o1", 4, "outer task"),
      assistant("o2", 5, [toolUse("t2", "Agent", { subagent_type: "inner" })]),
      toolResult("o3", 20, "t2", { status: "completed", agentId: "inner" }),
      assistant("o4", 21, [{ type: "text", text: "outer done" }], "end_turn"),
    ]);
    const inner = subagent("inner", [
      prompt("i1", 6, "inner task"),
      assistant("i2", 7, [{ type: "text", text: "x" }], "end_turn"),
    ]);
    meta("outer", "t1");
    send("SubagentStop", { agentId: "outer" });
    outer();
    main(toolResult("r1", 30, "t1", { status: "completed", agentId: "outer" }));
    inner();
    main(assistant("a2", 31, [{ type: "text", text: "all done" }], "end_turn"));
    send("Stop");

    const outerTool = posts.find((r) => r.name === "Agent" && r.start_time === at(3))!;
    const outerChain = run("general-purpose Subagent");
    const innerTool = posts.find((r) => r.name === "Agent" && r.parent_run_id === outerChain.id)!;
    const innerChain = run("inner Subagent");
    expect(outerChain.parent_run_id).toBe(outerTool.id);
    expect(innerChain.parent_run_id).toBe(innerTool.id);
    expect(innerChain.id).toBe(stableRunId(at(5), innerTool.id, "inner"));
    expect(posts.find((r) => r.start_time === at(7))?.parent_run_id).toBe(innerChain.id);
    expect(posts.filter((r) => r.name === "general-purpose Subagent")).toHaveLength(1);
    const ended = new Set([...posts.filter((r) => r.end_time), ...patches].map((r) => r.id));
    expect(posts.filter((r) => !ended.has(r.id)).map((r) => r.name)).toEqual([]);
    expect(Object.keys((builder.state() as BuilderState).threads)).toEqual(["main"]);
  });
});

describe("repositories", () => {
  it("tags each tool with the repository it reached and reads the branch per turn and Stop", () => {
    const sandbox = createGitSandbox("tracer builder ");
    const repo = sandbox.makeRepo("repo", "first", "Dev");
    const other = sandbox.makeRepo("other", "elsewhere", "Other Dev");
    const { posts, patches, main, send, run } = fakeSession();
    const read = toolUse("t0", "Read", { file_path: join(other, "seed.txt") });
    const turn = (n: number, beforeStop = () => {}) => {
      send("UserPromptSubmit", {}, { time: ms(n * 10) });
      const bash = toolUse(`t${n}`, "Bash", { command: "ls" });
      const tools = n === 1 ? [read, bash] : [bash];
      main(prompt(`p${n}`, n * 10, "go"), { ...assistant(`a${n}`, n * 10 + 1, tools), cwd: repo });
      send("PreToolUse", {}, { time: ms(n * 10 + 1), toolUseId: `t${n}` });
      main(toolResult(`r${n}`, n * 10 + 2, `t${n}`));
      if (n === 1) main(toolResult("r0", 12, "t0"));
      beforeStop();
      send("Stop");
    };
    turn(1);
    sandbox.git(repo, "checkout", "-b", "second");
    turn(2, () => sandbox.git(repo, "checkout", "-b", "third"));
    sandbox.remove();

    const branches = (runs: { name: string; metadata: { base?: Record<string, unknown> } }[]) =>
      runs.map((r) => r.metadata.base?.ls_git_branch);
    expect(branches(posts.filter((r) => r.name === "Bash"))).toEqual(["first", "second"]);
    expect(run("Read").metadata.base).toMatchObject({ ls_git_branch: "elsewhere" });
    const turns = patches.filter((r) => r.name === "Claude Code Turn");
    expect(branches(turns)).toEqual(["first", "third"]);
  });
});

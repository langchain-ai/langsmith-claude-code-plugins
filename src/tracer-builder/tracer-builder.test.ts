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
import { lastLineUuid, subagentTranscriptPath } from "./subagent-files.js";
import { createTranscriptBuilder } from "./tracer-builder.js";
import type { BuilderState, NoteDetails } from "./tracer-builder-models.js";
import type { HookNote, RunPatch, RunPost, TranscriptLine } from "@langchain/plugins-base/tracer";

function unfinished(posts: RunPost[], patches: RunPatch[]) {
  const ended = new Set([
    ...posts.filter((run) => run.end_time).map((run) => run.id),
    ...patches.map((run) => run.id),
  ]);
  return posts.filter((run) => !ended.has(run.id)).map((run) => `${run.name} ${run.id}`);
}

function fakeSession() {
  const dir = mkdtempSync(join(tmpdir(), "tracer-builder-"));
  const mainPath = join(dir, "session.jsonl");
  const { posts, patches, sink } = recordingSink();
  const builder = createTranscriptBuilder({ sessionId: "session", savedState: undefined, sink });
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
  const meta = (agentId: string, toolUseId: string) => {
    const path = join(dir, "session", "subagents", `agent-${agentId}.meta.json`);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify({ toolUseId }));
  };
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
    send("UserPromptSubmit", {}, { time: ms(1) });
    send("Stop");
    main(assistant("a2", 8, [{ type: "text", text: "agent finished" }], "end_turn"));
    send("Stop");

    const turns = posts.filter((r) => r.name === "Claude Code Turn");
    const model = posts.find((r) => r.name === "Claude" && r.start_time === at(8));
    expect(turns.map((r) => r.start_time)).toEqual([at(0), at(8)]);
    expect(model?.parent_run_id).toBe(turns[1].id);
  });

  it("nests a prompted turn under the parent run it was given", () => {
    const { main, send, run } = fakeSession();
    const parent = generateDottedOrderSegment(at(0), "01a183b1-e99b-70a0-a3a6-a3dedc3ce970");
    send("UserPromptSubmit", {}, { time: ms(1), parentDottedOrder: parent });
    main(prompt("p1", 1, "hi"), assistant("a1", 2, [{ type: "text", text: "ok" }], "end_turn"));

    const turn = run("Claude Code Turn");
    expect(turn.parent_run_id).toBe("01a183b1-e99b-70a0-a3a6-a3dedc3ce970");
    expect(turn.dotted_order.startsWith(`${parent}.`)).toBe(true);
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

describe("subagents", () => {
  it("nests a background agent and its notification turn, closing the launching turn last", () => {
    const { posts, patches, main, subagent, send, run } = fakeSession();
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(
      prompt("p1", 1, "go"),
      assistant("a1", 2, [toolUse("t1", "Agent", { subagent_type: "Explore" })]),
    );
    send("PreToolUse", {}, { time: ms(3), toolUseId: "t1" });
    main(toolResult("r1", 4, "t1", { status: "async_launched", agentId: "bg1" }));
    main(assistant("a2", 5, [{ type: "text", text: "launched" }], "end_turn"));
    send("Stop");
    subagent("bg1", [
      prompt("s1", 6, "explore"),
      assistant("s2", 9, [{ type: "text", text: "found" }], "end_turn"),
    ])();
    send("SubagentStop", { agentId: "bg1" });
    send("UserPromptSubmit", {}, { time: ms(20) });
    main(prompt("p2", 20, "<task-notification><task-id>bg1</task-id></task-notification>"));
    main(assistant("a3", 21, [{ type: "text", text: "noted" }], "end_turn"));
    const closedBeforeNotification = patches.map((r) => r.name);
    send("Stop");

    const tool = run("Agent");
    const chain = run("Explore Subagent");
    const [launching, notification] = posts.filter((r) => r.name === "Claude Code Turn");
    expect(chain.id).toBe(stableRunId(at(3), tool.id, "bg1"));
    expect(chain.parent_run_id).toBe(tool.id);
    expect(posts.find((r) => r.start_time === at(9))?.parent_run_id).toBe(chain.id);
    expect(notification.parent_run_id).toBe(tool.id);
    expect(closedBeforeNotification).toEqual(["Explore Subagent"]);
    expect(patches.slice(1).map((r) => r.id)).toEqual([notification.id, tool.id, launching.id]);
  });

  it("keeps a muted background agent's notification turn muted after an unmute", () => {
    const { posts, main, send } = fakeSession();
    send("UserPromptSubmit", { tracingMode: "metadata" }, { time: ms(0) });
    main(prompt("p1", 0, "go"), assistant("a1", 1, [toolUse("t1", "Agent")]));
    main(toolResult("r1", 2, "t1", { status: "async_launched", agentId: "bg1" }));
    send("Stop");
    send("UserPromptSubmit", { tracingMode: "full" }, { time: ms(10) });
    main(prompt("p2", 10, "<task-notification><task-id>bg1</task-id></task-notification>"));

    const turns = posts.filter((r) => r.name === "Claude Code Turn");
    expect(turns.map((r) => r.tracingMode)).toEqual(["metadata", "metadata"]);
  });

  it("closes a subagent at its last line's own id even past a long line", () => {
    const path = join(mkdtempSync(join(tmpdir(), "tracer-builder-")), "agent.jsonl");
    const nested = { message: { content: [{ input: { uuid: "inner" } }] }, uuid: "outer" };
    writeFileSync(path, `${JSON.stringify({ uuid: "first" })}\n${JSON.stringify(nested)}\n`);
    expect(lastLineUuid(path)).toBe("outer");
    writeFileSync(path, `${JSON.stringify({ text: "x".repeat(100_000), uuid: "long" })}\n`);
    expect(lastLineUuid(path)).toBe("long");
  });

  it("posts a sync agent once when its SubagentStop arrives before the tool result", () => {
    const { posts, patches, builder, main, subagent, meta, send } = fakeSession();
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 1, "go"), assistant("a1", 2, [toolUse("t1", "Agent")]));
    send("PreToolUse", {}, { time: ms(3), toolUseId: "t1" });
    meta("sync1", "t1");
    const lines = subagent("sync1", [
      prompt("s1", 4, "task"),
      assistant("s2", 5, [{ type: "text", text: "x" }], "end_turn"),
    ]);
    send("SubagentStop", { agentId: "sync1" });
    lines();
    main(toolResult("r1", 6, "t1", { status: "completed", agentId: "sync1" }));
    main(assistant("a2", 7, [{ type: "text", text: "done" }], "end_turn"));
    send("Stop");

    expect(posts.filter((r) => r.name === "general-purpose Subagent")).toHaveLength(1);
    expect(unfinished(posts, patches)).toEqual([]);
    expect(Object.keys((builder.state() as BuilderState).threads)).toEqual(["main"]);
  });

  it("nests an agent launched by a subagent under that subagent's Agent tool", () => {
    const { posts, patches, main, subagent, send, run } = fakeSession();
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
    main(toolResult("r1", 30, "t1", { status: "completed", agentId: "outer" }));
    outer();
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
    expect(unfinished(posts, patches)).toEqual([]);
  });
});

describe("repositories", () => {
  it("tags each tool with the repository it reached into", () => {
    const sandbox = createGitSandbox("tracer builder ");
    const alpha = sandbox.makeRepo("alpha", "trunk-a", "Alpha Owner");
    const beta = sandbox.makeRepo("beta", "trunk-b", "Beta Owner");
    const { main, send, run } = fakeSession();
    const read = toolUse("t1", "Read", { file_path: join(beta, "seed.txt") });
    const edit = toolUse("t2", "Edit", { file_path: "seed.txt" });
    send("UserPromptSubmit", {}, { time: ms(0) });
    main(prompt("p1", 0, "hi"), { ...assistant("a1", 1, [read, edit]), cwd: alpha });
    main(toolResult("r1", 2, "t1"), toolResult("r2", 2, "t2"));
    send("Stop");
    sandbox.remove();

    expect(run("Read").metadata.base).toMatchObject({ ls_git_branch: "trunk-b" });
    expect(run("Edit").metadata.base).toMatchObject({ ls_git_branch: "trunk-a" });
  });

  it("reads the branch again for each turn and each Stop", () => {
    const sandbox = createGitSandbox("tracer builder ");
    const repo = sandbox.makeRepo("repo", "first", "Dev");
    const { posts, patches, main, send } = fakeSession();
    const turn = (n: number, beforeStop = () => {}) => {
      send("UserPromptSubmit", {}, { time: ms(n * 10) });
      main(prompt(`p${n}`, n * 10, "go"), {
        ...assistant(`a${n}`, n * 10 + 1, [toolUse(`t${n}`, "Bash", { command: "ls" })]),
        cwd: repo,
      });
      send("PreToolUse", {}, { time: ms(n * 10 + 1), toolUseId: `t${n}` });
      main(toolResult(`r${n}`, n * 10 + 2, `t${n}`));
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
    const turns = patches.filter((r) => r.name === "Claude Code Turn");
    expect(branches(turns)).toEqual(["first", "third"]);
  });
});

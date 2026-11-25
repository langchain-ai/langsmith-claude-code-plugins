import { describe, expect, it } from "vitest";
import { at, note, recordingSink } from "../fixtures/tracer-builder-lines.js";
import { createTranscriptBuilder } from "./tracer-builder.js";
import type { HookContent, NoteDetails } from "./tracer-builder-models.js";
import type { HookNote, RunPatch } from "@langchain/plugins-base/tracer";

const ms = (second: number) => Date.parse(at(second));

function hookSession() {
  const { posts, patches, sink } = recordingSink();
  const builder = createTranscriptBuilder({ sessionId: "session", savedState: undefined, sink });
  let second = 0;
  const send = (
    event: string,
    hookContent: HookContent = {},
    details: NoteDetails = {},
    fields: Partial<HookNote> = {},
  ) =>
    builder.receiveNote(
      note(event, {
        ...fields,
        details: { time: ms(second++), hookContent, ...details },
      }),
    );
  const run = (name: string) => posts.filter((post) => post.name === name);
  const go = (details: NoteDetails = {}) =>
    send("UserPromptSubmit", { prompt: "go", promptId: "p1" }, details);
  const tool = (toolUseId: string, toolName = "Bash") =>
    send("PreToolUse", { toolName, toolInput: {} }, { toolUseId });
  const stop = (text = "done") => send("Stop", {}, { lastAssistantMessage: text });
  const toolMessages = (call: number) =>
    (run("Claude")[call].inputs as { messages: { role: string }[] }).messages.filter(
      (message) => message.role === "tool",
    );
  return { posts, patches, send, run, go, tool, stop, toolMessages };
}

describe("sessions without a transcript", () => {
  it("builds one model call per round with its text joined in index order and parallel tools, then a final reply", () => {
    const { posts, patches, send, run } = hookSession();
    send("UserPromptSubmit", { prompt: "list files", promptId: "p1" });
    send("MessageDisplay", { messageId: "m1", index: 1, text: "look." });
    send("MessageDisplay", { messageId: "m1", index: 0, text: "Let me " });
    send("PreToolUse", { toolName: "Bash", toolInput: { command: "ls" } }, { toolUseId: "t1" });
    send("PreToolUse", { toolName: "Read", toolInput: { file_path: "/a" } }, { toolUseId: "t2" });
    send("PostToolUse", { toolResponse: { stdout: "a b" } }, { toolUseId: "t1" });
    send("PostToolUse", { toolResponse: "file text" }, { toolUseId: "t2" });
    send("PostToolBatch");
    send("MessageDisplay", { messageId: "m2", index: 0, text: "Two files." });
    send("Stop", {}, { lastAssistantMessage: "Two files." });

    const models = run("Claude");
    expect(models.map((model) => (model.outputs as { messages: unknown[] }).messages)).toEqual([
      [
        {
          role: "assistant",
          content: [
            { type: "text", text: "Let me look." },
            { type: "tool_call", id: "t1", name: "Bash", args: { command: "ls" } },
            { type: "tool_call", id: "t2", name: "Read", args: { file_path: "/a" } },
          ],
        },
      ],
      [{ role: "assistant", content: [{ type: "text", text: "Two files." }] }],
    ]);
    const turn = run("Claude Code Turn")[0];
    expect(models.every((model) => model.parent_run_id === turn.id)).toBe(true);
    expect(run("Bash")[0].parent_run_id).toBe(turn.id);
    expect(patches.find((patch) => patch.name === "Bash")?.outputs).toEqual({
      output: { stdout: "a b" },
    });
    expect(patches.find((patch) => patch.name === "Read")?.outputs).toEqual({
      output: "file text",
    });
    expect(patches.find((patch) => patch.id === turn.id)?.outputs).toEqual({
      messages: [{ role: "assistant", content: "Two files." }],
    });
    expect(posts.filter((post) => post.name === "Claude Code Turn")).toHaveLength(1);
  });

  it("puts text that arrives after its round's tool call on that round's model run whatever its time stamp", () => {
    const { send, run, go, stop } = hookSession();
    go();
    send("PreToolUse", { toolName: "Bash", toolInput: {} }, { toolUseId: "t1", time: ms(10) });
    send("MessageDisplay", { messageId: "m1", index: 0, text: "Running it." }, { time: ms(20) });
    send("PostToolUse", { toolResponse: "ok" }, { toolUseId: "t1" });
    send("PostToolBatch");
    stop();
    expect(run("Claude")).toHaveLength(2);
    expect((run("Claude")[0].outputs as { messages: unknown[] }).messages).toEqual([
      {
        role: "assistant",
        content: [
          { type: "tool_call", id: "t1", name: "Bash", args: {} },
          { type: "text", text: "Running it." },
        ],
      },
    ]);
  });

  it("holds text that arrives after the batch ended for the next round's model run", () => {
    const { send, run, go, tool, stop } = hookSession();
    go();
    tool("t1");
    send("PostToolUse", { toolResponse: "ok" }, { toolUseId: "t1" });
    send("PostToolBatch");
    send("MessageDisplay", { messageId: "m2", index: 0, text: "Next." });
    tool("t2", "Read");
    stop("Bye.");
    const [first, second] = run("Claude").map(
      (model) => (model.outputs as { messages: { content: unknown[] }[] }).messages[0].content,
    );
    expect(first).toEqual([{ type: "tool_call", id: "t1", name: "Bash", args: {} }]);
    expect(second).toEqual([
      { type: "text", text: "Next." },
      { type: "tool_call", id: "t2", name: "Read", args: {} },
      { type: "text", text: "Bye." },
    ]);
  });

  it("holds the text of a new prompt's reply when the previous round never ended", () => {
    const { patches, send, run, go, tool, stop } = hookSession();
    go();
    tool("t1");
    send("UserPromptSubmit", { prompt: "two", promptId: "p2" });
    send("MessageDisplay", { messageId: "m1", index: 0, text: "Fresh." });
    stop("");
    const turn = run("Claude Code Turn")[1];
    expect(patches.find((patch) => patch.id === turn.id)?.outputs).toEqual({
      messages: [{ role: "assistant", content: "Fresh." }],
    });
  });

  it("drops text left over after a stop so it never starts the next turn", () => {
    const { send, run, go, tool, stop } = hookSession();
    go();
    stop("first answer");
    send("MessageDisplay", { messageId: "m1", index: 0, text: "stale text" });
    send("UserPromptSubmit", { prompt: "two", promptId: "p2" });
    tool("t1");
    stop("second answer");
    const texts = run("Claude").flatMap((model) =>
      JSON.stringify((model.outputs as { messages: unknown[] }).messages),
    );
    expect(texts.join("")).not.toContain("stale text");
  });

  it("ends a failed tool with its error", () => {
    const { patches, send, go, tool, stop } = hookSession();
    go();
    tool("t1");
    send("PostToolUseFailure", {}, { toolUseId: "t1", error: "exit 2" });
    stop("failed");
    expect(patches.find((patch) => patch.name === "Bash")?.error).toBe("exit 2");
  });

  it("keeps a report that reuses the open turn's prompt id inside that turn", () => {
    const { posts, patches, send, run, go, tool, stop } = hookSession();
    go();
    tool("t1");
    send("PostToolUse", { toolResponse: "ok" }, { toolUseId: "t1" });
    send("UserPromptSubmit", { prompt: "the helper says done", promptId: "p1" });
    tool("t2", "Read");
    send("PostToolUse", { toolResponse: "ok" }, { toolUseId: "t2" });
    stop("all done");
    const [turn] = run("Claude Code Turn");
    expect(posts.filter((post) => post.name === "Claude Code Turn")).toHaveLength(1);
    expect(run("Read")[0].parent_run_id).toBe(turn.id);
    expect(patches.filter((patch) => patch.id === turn.id)).toHaveLength(1);
  });

  it("uses the text streamed this round when the stop hook's reply is empty", () => {
    const { patches, send, run, go, stop } = hookSession();
    go();
    send("MessageDisplay", { messageId: "m1", index: 0, text: "Finished." });
    stop("");
    const [turn] = run("Claude Code Turn");
    expect(patches.find((patch) => patch.id === turn.id)?.outputs).toEqual({
      messages: [{ role: "assistant", content: "Finished." }],
    });
    expect((run("Claude")[0].outputs as { messages: unknown[] }).messages).toEqual([
      { role: "assistant", content: [{ type: "text", text: "Finished." }] },
    ]);
  });

  it("does not open a turn for a prompt from a subagent or a stop with no turn", () => {
    const { posts, send, stop } = hookSession();
    send("UserPromptSubmit", { prompt: "helper task", promptId: "p1" }, {}, { agentId: "a1" });
    send("PreToolUse", { toolName: "Bash" }, { toolUseId: "t1" }, { agentId: "a1" });
    stop("stray");
    expect(posts).toEqual([]);
  });

  it("closes an Agent tool like any other tool, with its result as output", () => {
    const { patches, posts, send, run, go, tool, stop } = hookSession();
    const response = { status: "async_launched", agentId: "agent-9", agentType: "general" };
    go();
    tool("t1", "Agent");
    send("PostToolUse", { toolResponse: response }, { toolUseId: "t1" });
    stop("started");
    expect(patches.find((patch) => patch.id === run("Agent")[0].id)?.outputs).toEqual({
      output: response,
    });
    const turn = run("Claude Code Turn")[0];
    expect(patches.filter((patch) => patch.id === turn.id)).toHaveLength(1);
    expect(posts.filter((post) => post.name.endsWith("subagent"))).toEqual([]);
  });

  describe("tool results reported by the batch", () => {
    const batch = (toolResponse?: unknown) => ({ toolCalls: [{ toolUseId: "t1", toolResponse }] });
    const bashOutputs = (patches: RunPatch[]) =>
      patches.filter((patch) => patch.name === "Bash").map((patch) => patch.outputs);

    it("keeps a result that reaches the worker after the stop, without an error", () => {
      const { patches, send, go, tool, stop } = hookSession();
      go();
      tool("t1");
      send("PostToolBatch", batch("real output"));
      stop();
      send("PostToolUse", { toolResponse: "real output" }, { toolUseId: "t1" });
      expect(bashOutputs(patches)).toEqual([{ output: "real output" }]);
      expect(patches.find((patch) => patch.name === "Bash")?.error).toBeUndefined();
    });

    it("does not post a result twice when the tool already finished", () => {
      const { patches, send, go, tool, stop } = hookSession();
      go();
      tool("t1");
      send("PostToolUse", { toolResponse: "first" }, { toolUseId: "t1" });
      send("PostToolBatch", batch("second"));
      stop();
      expect(bashOutputs(patches)).toEqual([{ output: "first" }]);
    });

    it("does not feed a held result a second time", () => {
      const { send, go, tool, stop, toolMessages } = hookSession();
      go({ captureHookOutputs: true });
      tool("t1");
      send("PostToolUse", { toolResponse: "first" }, { toolUseId: "t1" });
      send("PostToolBatch", batch("first"));
      tool("t2", "Read");
      stop();
      expect(toolMessages(1)).toHaveLength(1);
    });

    it("leaves the tool waiting when the batch has no response for it", () => {
      const { patches, send, go, tool, stop } = hookSession();
      go();
      tool("t1");
      send("PostToolBatch", batch());
      send("PostToolUse", { toolResponse: "late output" }, { toolUseId: "t1" });
      stop();
      expect(bashOutputs(patches)).toEqual([{ output: "late output" }]);
    });

    it("keeps the error of a failed tool whose failure note came before the batch", () => {
      const { patches, send, go, tool, stop } = hookSession();
      go();
      tool("t1");
      send("PostToolUseFailure", {}, { toolUseId: "t1", error: "exit 2" });
      send("PostToolBatch", batch("exit 2 text"));
      stop();
      const bash = patches.filter((patch) => patch.name === "Bash");
      expect(bash.map((patch) => patch.error)).toEqual(["exit 2"]);
    });

    it("closes a tool the batch settled as a success and ignores its failure note arriving after", () => {
      const { patches, send, go, tool, stop, toolMessages } = hookSession();
      go();
      tool("t1");
      send("PostToolBatch", batch("exit 2 text"));
      send("PostToolUseFailure", {}, { toolUseId: "t1", error: "exit 2" });
      tool("t2", "Read");
      stop();
      const bash = patches.filter((patch) => patch.name === "Bash");
      expect(bash.map((patch) => [patch.outputs, patch.error])).toEqual([
        [{ output: "exit 2 text" }, undefined],
      ]);
      expect(toolMessages(1)).toHaveLength(1);
    });

    it("adds a result to the history once when the batch settled it before its own hook arrived", () => {
      const { send, go, tool, stop, toolMessages } = hookSession();
      go();
      tool("t1");
      send("PostToolBatch", batch("out"));
      send("PostToolUse", { toolResponse: "out" }, { toolUseId: "t1" });
      tool("t2", "Read");
      stop();
      expect(toolMessages(1)).toHaveLength(1);
    });
  });

  describe("text buffered when a turn ends without a normal stop", () => {
    it.each([
      [
        "a new prompt replaces the turn",
        "UserPromptSubmit",
        { prompt: "two", promptId: "p2" },
        {},
        "User interrupt",
      ],
      ["the turn fails", "StopFailure", {}, { error: "overloaded" }, "overloaded"],
      ["the session ends", "SessionEnd", {}, {}, "Session ended before turn completed"],
    ])(
      "puts it on the turn when %s, keeping the close error",
      (_, event, content, details, error) => {
        const { patches, send, run, go } = hookSession();
        go();
        send("MessageDisplay", { messageId: "m1", index: 0, text: "Half an answer" });
        send(event, content, details);
        const [turn] = run("Claude Code Turn");
        const model = run("Claude").find((call) => call.parent_run_id === turn.id);
        expect(JSON.stringify(model?.outputs)).toContain("Half an answer");
        expect(patches.find((patch) => patch.id === turn.id)?.error).toBe(error);
      },
    );
  });
});

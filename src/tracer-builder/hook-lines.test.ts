import { describe, expect, it } from "vitest";
import { at, note, recordingSink } from "../fixtures/tracer-builder-lines.js";
import { createTranscriptBuilder } from "./tracer-builder.js";
import type { HookContent, NoteDetails } from "./tracer-builder-models.js";
import type { HookNote } from "@langchain/plugins-base/tracer";

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
  return { posts, patches, builder, send, run };
}

describe("sessions without a transcript", () => {
  it("builds one model call per round with its text and parallel tools, then a final reply", () => {
    const { posts, patches, send, run } = hookSession();
    send("UserPromptSubmit", { prompt: "list files", promptId: "p1" });
    send("MessageDisplay", { messageId: "m1", index: 0, text: "Let me " });
    send("MessageDisplay", { messageId: "m1", index: 1, text: "look." });
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

  it("joins the streamed text of a message in index order whatever order the hooks arrived in", () => {
    const { send, run } = hookSession();
    send("UserPromptSubmit", { prompt: "hi", promptId: "p1" });
    send("MessageDisplay", { messageId: "m1", index: 1, text: "world" });
    send("MessageDisplay", { messageId: "m1", index: 0, text: "hello " });
    send("PreToolUse", { toolName: "Bash" }, { toolUseId: "t1" });
    send("Stop", {}, { lastAssistantMessage: "done" });
    const [model] = run("Claude");
    expect(
      (model.outputs as { messages: { content: unknown[] }[] }).messages[0].content[0],
    ).toEqual({
      type: "text",
      text: "hello world",
    });
  });

  it("keeps a second round's tool call out of the first round's model run once the batch has ended", () => {
    const { send, run } = hookSession();
    send("UserPromptSubmit", { prompt: "go", promptId: "p1" });
    send("PreToolUse", { toolName: "Bash", toolInput: {} }, { toolUseId: "t1" });
    send("PostToolUse", { toolResponse: "ok" }, { toolUseId: "t1" });
    send("PostToolBatch");
    send("PreToolUse", { toolName: "Read", toolInput: {} }, { toolUseId: "t2" });
    send("Stop", {}, { lastAssistantMessage: "done" });
    const calls = run("Claude").map((model) =>
      (model.outputs as { messages: { content: { id?: string }[] }[] }).messages[0].content
        .filter((block) => "id" in block)
        .map((block) => block.id),
    );
    expect(calls).toEqual([["t1"], ["t2"]]);
  });

  it("puts text that arrives after its round's tool call on that round's model run", () => {
    const { send, run } = hookSession();
    send("UserPromptSubmit", { prompt: "go", promptId: "p1" });
    send("PreToolUse", { toolName: "Bash", toolInput: {} }, { toolUseId: "t1", time: ms(10) });
    send("MessageDisplay", { messageId: "m1", index: 0, text: "Running it." }, { time: ms(5) });
    send("PostToolUse", { toolResponse: "ok" }, { toolUseId: "t1" });
    send("PostToolBatch");
    send("Stop", {}, { lastAssistantMessage: "done" });
    const models = run("Claude");
    expect(models).toHaveLength(2);
    const [first] = models.map((model) => (model.outputs as { messages: unknown[] }).messages);
    expect(first).toEqual([
      {
        role: "assistant",
        content: [
          { type: "tool_call", id: "t1", name: "Bash", args: {} },
          { type: "text", text: "Running it." },
        ],
      },
    ]);
  });

  it("drops text left over after a stop so it never starts the next turn", () => {
    const { send, run } = hookSession();
    send("UserPromptSubmit", { prompt: "one", promptId: "p1" });
    send("Stop", {}, { lastAssistantMessage: "first answer" });
    send("MessageDisplay", { messageId: "m1", index: 0, text: "stale text" });
    send("UserPromptSubmit", { prompt: "two", promptId: "p2" });
    send("PreToolUse", { toolName: "Bash", toolInput: {} }, { toolUseId: "t1" });
    send("Stop", {}, { lastAssistantMessage: "second answer" });
    const texts = run("Claude").flatMap((model) =>
      JSON.stringify((model.outputs as { messages: unknown[] }).messages),
    );
    expect(texts.join("")).not.toContain("stale text");
  });

  it("ends a failed tool with its error", () => {
    const { patches, send } = hookSession();
    send("UserPromptSubmit", { prompt: "go", promptId: "p1" });
    send("PreToolUse", { toolName: "Bash" }, { toolUseId: "t1" });
    send("PostToolUseFailure", {}, { toolUseId: "t1", error: "exit 2" });
    send("Stop", {}, { lastAssistantMessage: "failed" });
    expect(patches.find((patch) => patch.name === "Bash")?.error).toBe("exit 2");
  });

  it("keeps a report that reuses the open turn's prompt id inside that turn", () => {
    const { posts, patches, send, run } = hookSession();
    send("UserPromptSubmit", { prompt: "go", promptId: "p1" });
    send("PreToolUse", { toolName: "Bash" }, { toolUseId: "t1" });
    send("PostToolUse", { toolResponse: "ok" }, { toolUseId: "t1" });
    send("UserPromptSubmit", { prompt: "the helper says done", promptId: "p1" });
    send("PreToolUse", { toolName: "Read" }, { toolUseId: "t2" });
    send("PostToolUse", { toolResponse: "ok" }, { toolUseId: "t2" });
    send("Stop", {}, { lastAssistantMessage: "all done" });
    const [turn] = run("Claude Code Turn");
    expect(posts.filter((post) => post.name === "Claude Code Turn")).toHaveLength(1);
    expect(run("Read")[0].parent_run_id).toBe(turn.id);
    expect(patches.filter((patch) => patch.id === turn.id)).toHaveLength(1);
  });

  it("uses the text streamed this round when the stop hook's reply is empty", () => {
    const { patches, send, run } = hookSession();
    send("UserPromptSubmit", { prompt: "go", promptId: "p1" });
    send("MessageDisplay", { messageId: "m1", index: 0, text: "Finished." });
    send("Stop", {}, { lastAssistantMessage: "" });
    const [turn] = run("Claude Code Turn");
    expect(patches.find((patch) => patch.id === turn.id)?.outputs).toEqual({
      messages: [{ role: "assistant", content: "Finished." }],
    });
    expect((run("Claude")[0].outputs as { messages: unknown[] }).messages).toEqual([
      { role: "assistant", content: [{ type: "text", text: "Finished." }] },
    ]);
  });

  it("does not open a turn for a prompt from a subagent or a stop with no turn", () => {
    const { posts, send } = hookSession();
    send("UserPromptSubmit", { prompt: "helper task", promptId: "p1" }, {}, { agentId: "a1" });
    send("PreToolUse", { toolName: "Bash" }, { toolUseId: "t1" }, { agentId: "a1" });
    send("Stop", {}, { lastAssistantMessage: "stray" });
    expect(posts).toEqual([]);
  });

  it("nests the turn started by a background agent's notification under that agent's run", () => {
    const { send, run } = hookSession();
    send("UserPromptSubmit", { prompt: "start a helper", promptId: "p1" });
    send("PreToolUse", { toolName: "Agent", toolInput: { prompt: "work" } }, { toolUseId: "t1" });
    send(
      "PostToolUse",
      { toolResponse: { status: "async_launched", agentId: "agent-9", agentType: "general" } },
      { toolUseId: "t1" },
    );
    send("Stop", {}, { lastAssistantMessage: "started" });
    send("UserPromptSubmit", {
      prompt:
        "<task-notification><task-id>agent-9</task-id><result>done</result></task-notification>",
      promptId: "p2",
    });
    const turns = run("Claude Code Turn");
    expect(turns).toHaveLength(2);
    expect(turns[1].parent_run_id).toBe(run("Agent")[0].id);
  });
});

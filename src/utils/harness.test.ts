import { describe, it, expect } from "vitest";

import {
  isCursorPayload,
  isPayloadForHook,
  slashSkillOf,
  stripContentMarkup,
  stripHarnessMarkup,
} from "./harness.js";
import type { Turn } from "../types.js";
import cursorHooks from "../fixtures/cursor-hooks.json" with { type: "json" };

const CLAUDE_PAYLOAD = {
  session_id: "11111111-2222-3333-4444-555555555555",
  transcript_path: "/tmp/transcript.jsonl",
  cwd: "/tmp/project",
  permission_mode: "default",
  hook_event_name: "PreToolUse",
  tool_name: "Bash",
  tool_use_id: "tu_1",
};

const { cursor_version: _version, ...CURSOR_STOP_WITHOUT_MARKER } = cursorHooks.stop;

describe("isCursorPayload", () => {
  it("spots the version field on a recorded Cursor payload", () => {
    expect(isCursorPayload(cursorHooks.stop)).toBe(true);
  });

  it("ignores the marker nested inside traced tool content", () => {
    const payload = {
      ...CLAUDE_PAYLOAD,
      tool_input: { command: "grep cursor_version ." },
      tool_response: { cursor_version: "3.7.19" },
    };
    expect(isCursorPayload(payload)).toBe(false);
  });

  // Cursor documents no value for the field, so an empty one must still count.
  it("counts the field when its value is empty", () => {
    expect(isCursorPayload({ ...CLAUDE_PAYLOAD, cursor_version: "" })).toBe(true);
  });
});

describe("isPayloadForHook", () => {
  it("stands down on the event name alone once Cursor drops its version field", () => {
    expect(isPayloadForHook(CURSOR_STOP_WITHOUT_MARKER, "Stop")).toBe(false);
  });

  it("stands down on the version field alone when the event names agree", () => {
    expect(isPayloadForHook({ ...cursorHooks.stop, hook_event_name: "Stop" }, "Stop")).toBe(false);
  });

  it("runs when a payload names no event at all", () => {
    expect(isPayloadForHook({}, "Stop")).toBe(true);
  });
});

describe("stripHarnessMarkup", () => {
  it.each([
    [
      "shows a slash command as typed",
      "<command-message>review is running…</command-message>\n<command-name>/review</command-name>\n<command-args>src/app.ts</command-args>",
      "/review src/app.ts",
    ],
    ["unwraps bash mode input", "<bash-input>git status</bash-input>", "git status"],
    ["drops a paste marker", '<pasted_content id="1">\nlog line', "log line"],
    [
      "leaves a notification tag the person typed",
      "<task-notification>my log</task-notification>",
      "<task-notification>my log</task-notification>",
    ],
    [
      "leaves a full notification the person typed inside a question",
      "Explain <task-notification><task-id>b1</task-id><summary>Exited</summary></task-notification>",
      "Explain <task-notification><task-id>b1</task-id><summary>Exited</summary></task-notification>",
    ],
  ])("%s", (_, text, shown) => {
    expect(stripHarnessMarkup(text)).toBe(shown);
  });

  it("stays fast on a prompt built to make the notification match backtrack", () => {
    const unit = "</task-notification><task-notification><task-id>";
    const text = `<task-notification><task-id>${unit.repeat(26)}x`;
    const start = performance.now();
    stripHarnessMarkup(text);
    expect(performance.now() - start).toBeLessThan(200);
  });
});

describe("stripContentMarkup", () => {
  it("drops text blocks that were only scaffolding and keeps the rest", () => {
    const content = [
      { type: "text", text: "<ide_opened_file>The user opened a.ts</ide_opened_file>" },
      { type: "text", text: "what does this do" },
    ];
    expect(stripContentMarkup(content)).toEqual([{ type: "text", text: "what does this do" }]);
    expect(stripContentMarkup("<system-reminder>x</system-reminder>")).toBeUndefined();
  });
});

describe("slashSkillOf", () => {
  const SKILL_BODY =
    "Base directory for this skill: /home/me/.claude/skills/plain-terms\n\n## The rule";
  const turnOf = (userContent: Turn["userContent"], before: Turn["userContent"][] = []): Turn => ({
    userContent,
    userTimestamp: "2025-01-01T00:00:00Z",
    llmCalls: [
      {
        content: [],
        model: "claude-sonnet-4-5",
        usage: { input_tokens: 1, output_tokens: 1 },
        startTime: "2025-01-01T00:00:01Z",
        endTime: "2025-01-01T00:00:02Z",
        toolCalls: [],
        userMessagesBefore: before,
      },
    ],
    isComplete: true,
  });

  it("names a skill typed as a slash command once its body reached the model", () => {
    const turn = turnOf(
      "<command-name>/plain-terms</command-name>\n<command-args>shorten this</command-args>",
      [[{ type: "text", text: SKILL_BODY }]],
    );
    expect(slashSkillOf(turn)).toEqual({ name: "plain-terms", args: "shorten this" });
  });

  it("reads a command sent as content blocks and keeps a plugin namespace", () => {
    const turn = turnOf(
      [{ type: "text", text: "<command-name>/myplugin:deploy</command-name>" }],
      [SKILL_BODY],
    );
    expect(slashSkillOf(turn)).toEqual({ name: "myplugin:deploy" });
  });

  it("ignores a built-in command that loads no skill body", () => {
    expect(slashSkillOf(turnOf("<command-name>/plugin</command-name>"))).toBeUndefined();
    expect(
      slashSkillOf(
        turnOf("<command-name>/model</command-name>", [
          [{ type: "text", text: "Set model to opus" }],
        ]),
      ),
    ).toBeUndefined();
  });

  it("ignores a skill body that no slash command started", () => {
    expect(slashSkillOf(turnOf("review this", [SKILL_BODY]))).toBeUndefined();
  });
});

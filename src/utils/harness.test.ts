import { describe, it, expect } from "vitest";

import { isCursorPayload, isPayloadForHook } from "./harness.js";
import cursorHooks from "../fixtures/cursor-hooks.json" with { type: "json" };

const CLAUDE_PAYLOAD = {
  session_id: "11111111-2222-3333-4444-555555555555",
  transcript_path: "/tmp/transcript.jsonl",
  cwd: "/tmp/project",
  permission_mode: "default",
  hook_event_name: "PreToolUse",
  tool_name: "Bash",
  tool_use_id: "tu_1",
} as const;

const RECORDED_SHAPES = ["beforeSubmitPrompt", "preToolUse", "stop"] as const;

const { cursor_version: _version, ...RENAMED_CURSOR_STOP } = cursorHooks.stop;

describe("isCursorPayload", () => {
  it.each(RECORDED_SHAPES)("spots the version field on the recorded %s payload", (event) => {
    expect(isCursorPayload(cursorHooks[event])).toBe(true);
  });

  it("leaves an ordinary Claude Code payload alone", () => {
    expect(isCursorPayload(CLAUDE_PAYLOAD)).toBe(false);
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
  it("runs the handler for the event it was dispatched for", () => {
    expect(isPayloadForHook(CLAUDE_PAYLOAD, "PreToolUse")).toBe(true);
  });

  it("stands down when the payload names a different event", () => {
    const stopPayload = { ...CLAUDE_PAYLOAD, hook_event_name: "Stop" } as never;
    expect(isPayloadForHook(stopPayload, "PreToolUse")).toBe(false);
  });

  it("stands down on the event name alone once Cursor renames its version field", () => {
    expect(isPayloadForHook(RENAMED_CURSOR_STOP as never, "Stop")).toBe(false);
  });

  it("stands down on the version field alone when the event names agree", () => {
    expect(
      isPayloadForHook({ ...cursorHooks.stop, hook_event_name: "Stop" } as never, "Stop"),
    ).toBe(false);
  });

  it("runs when a payload names no event at all", () => {
    expect(isPayloadForHook({} as never, "Stop")).toBe(true);
  });
});

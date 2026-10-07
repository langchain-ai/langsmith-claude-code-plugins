import { describe, it, expect } from "vitest";

import { isForeignHarnessPayload } from "./harness.js";
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

describe("isForeignHarnessPayload", () => {
  it.each(Object.keys(cursorHooks))("detects the recorded Cursor %s payload", (event) => {
    expect(isForeignHarnessPayload(cursorHooks[event as keyof typeof cursorHooks])).toBe(true);
  });

  it("leaves an ordinary Claude Code payload alone", () => {
    expect(isForeignHarnessPayload(CLAUDE_PAYLOAD)).toBe(false);
  });

  it("ignores the marker nested inside traced tool content", () => {
    const payload = {
      ...CLAUDE_PAYLOAD,
      tool_input: { command: "grep cursor_version ." },
      tool_response: { cursor_version: "3.7.19" },
    };
    expect(isForeignHarnessPayload(payload)).toBe(false);
  });
});

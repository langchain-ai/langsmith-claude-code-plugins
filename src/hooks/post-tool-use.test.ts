import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildCodingAgentMetadata } from "@langchain/plugins-base/metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";

const captured: Array<{ name: string; metadata: Parameters<typeof buildCodingAgentMetadata>[0] }> =
  [];
let payload: Record<string, unknown> = {};
const stateFilePath = join(mkdtempSync(join(tmpdir(), "post-tool-use-")), "state.json");

vi.mock("../utils/stdin.js", () => ({ readStdin: async () => payload }));
vi.mock("../utils/hook-init.js", () => ({
  initHook: () => ({ stateFilePath, customMetadata: {} }),
  expandHome: (path: string) => path,
}));
vi.mock("../tracing-mode.js", () => ({
  resolveTurnTracingMode: () => "full",
  toolTracingMode: () => "full",
}));
vi.mock("../tracing-engine.js", () => ({
  initTracing: () => undefined,
  captureToolRun: async (run: (typeof captured)[number]) => {
    captured.push(run);
  },
}));
vi.mock("../logger.js", () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn(), log: vi.fn() }));

import { main } from "./post-tool-use.js";

const skillCall = (skill: string) => ({
  session_id: "s1",
  hook_event_name: "PostToolUse",
  transcript_path: "/t.jsonl",
  cwd: "/work",
  tool_name: "Skill",
  tool_input: { skill },
  tool_response: { success: true },
  tool_use_id: "tool-1",
});

describe("PostToolUse for the Skill tool", () => {
  beforeEach(() => {
    captured.length = 0;
    writeFileSync(
      stateFilePath,
      JSON.stringify({
        s1: {
          current_turn_run_id: "turn-1",
          current_trace_id: "trace-1",
          current_dotted_order: "20250101T000000000000Zturn-1",
          current_turn_number: 1,
        },
      }),
    );
  });

  it("tags the run with the skill name, trimmed and without a leading slash", async () => {
    payload = skillCall(" /review-pr ");
    await main();

    expect(captured).toHaveLength(1);
    expect(buildCodingAgentMetadata(captured[0].metadata).ls_skill_name).toBe("review-pr");
  });
});

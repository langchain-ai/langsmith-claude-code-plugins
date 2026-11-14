export const BUILDER_STATE_VERSION = 1;
export const MAIN_THREAD = "main";
export const AGENT_RUN_NAME = "Agent";
export const AGENT_NATIVE_TOOL_NAME = "Task";
export const AGENT_TOOL_NAMES: ReadonlySet<string> = new Set(["Agent", "Task"]);
export const NO_MESSAGE_ID = "__no_id__";
export const NO_TOOL_RESULT = "No result";
export const END_TURN = "end_turn";
export const COMPACT_BOUNDARY_SUBTYPE = "compact_boundary";
export const DEFAULT_COMPACT_TRIGGER = "auto";
export const COMPACTION_RUN_NAME = (trigger: string) => `Context Compaction (${trigger})`;

export const USER_INTERRUPT_ERROR = "User interrupt";
export const TOOL_INTERRUPTED_ERROR = "Interrupted";
export const SESSION_ENDED_ERROR = "Session ended before turn completed";

export const TRANSCRIPT_EXTENSION = ".jsonl";

export const HOOK_EVENTS = {
  userPromptSubmit: "UserPromptSubmit",
  preToolUse: "PreToolUse",
  stop: "Stop",
  stopFailure: "StopFailure",
  preCompact: "PreCompact",
  sessionEnd: "SessionEnd",
} as const;

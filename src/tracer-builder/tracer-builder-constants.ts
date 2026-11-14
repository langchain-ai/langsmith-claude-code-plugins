export const BUILDER_STATE_VERSION = 1;
export const MAIN_THREAD = "main";
export const AGENT_RUN_NAME = "Agent";
export const AGENT_NATIVE_TOOL_NAME = "Task";
export const AGENT_TOOL_NAMES: ReadonlySet<string> = new Set(["Agent", "Task"]);
export const ASYNC_LAUNCHED_STATUS = "async_launched";
export const DEFAULT_SUBAGENT_TYPE = "general-purpose";
export const SUBAGENT_CHAIN_SUFFIX = " Subagent";
export const NO_MESSAGE_ID = "__no_id__";
export const NO_TOOL_RESULT = "No result";
export const END_TURN = "end_turn";
export const COMPACT_BOUNDARY_SUBTYPE = "compact_boundary";
export const DEFAULT_COMPACT_TRIGGER = "auto";
export const COMPACTION_RUN_NAME = (trigger: string) => `Context Compaction (${trigger})`;

export const USER_INTERRUPT_ERROR = "User interrupt";
export const TOOL_INTERRUPTED_ERROR = "Interrupted";
export const SESSION_ENDED_ERROR = "Session ended before turn completed";

export const SUBAGENTS_FOLDER = "subagents";
export const SUBAGENT_FILE = /^agent-(.+)\.jsonl$/;
export const subagentFileName = (agentId: string) => `agent-${agentId}.jsonl`;
export const subagentMetaFileName = (agentId: string) => `agent-${agentId}.meta.json`;
export const TRANSCRIPT_EXTENSION = ".jsonl";
export const TAIL_READ_BYTES = 65_536;
export const TRACING_MODE_STRICTNESS = ["full", "metadata", "off"];

export const HOOK_EVENTS = {
  userPromptSubmit: "UserPromptSubmit",
  preToolUse: "PreToolUse",
  stop: "Stop",
  stopFailure: "StopFailure",
  subagentStop: "SubagentStop",
  preCompact: "PreCompact",
  sessionEnd: "SessionEnd",
} as const;

/**
 * Types for Claude Code hook inputs and JSONL transcript messages.
 */

// ─── Hook Input Types ───────────────────────────────────────────────────────

/** Common fields present in all hook inputs (delivered via stdin JSON). */
export interface HookInputBase {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  hook_event_name: string;
  agent_id?: string;
  agent_type?: string;
}

/** Input for the Stop hook. */
export interface StopHookInput extends HookInputBase {
  hook_event_name: "Stop";
  stop_hook_active: boolean;
  last_assistant_message: string;
}

/** Input for the SubagentStop hook. */
export interface SubagentStopHookInput extends HookInputBase {
  hook_event_name: "SubagentStop";
  stop_hook_active: boolean;
  agent_id: string;
  agent_type: string;
  agent_transcript_path: string;
  last_assistant_message: string;
}

// ─── Transcript Message Types ───────────────────────────────────────────────

/** A text content block in an assistant message. */
export interface TextBlock {
  type: "text";
  text: string;
}

/** A thinking content block in an assistant message. */
export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

/** A tool_use content block in an assistant message. */
export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** A tool_result content block in a tool result message. */
export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string | Array<{ type: "text"; text: string }>;
}

export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock;

/** Token usage data from an assistant message. */
export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

/** A user message (human input) in the transcript. */
export interface UserMessage {
  type: "user";
  message: {
    role: "user";
    content: string;
  };
  timestamp: string;
  promptId?: string;
}

/** A tool result message in the transcript (also role: "user"). */
export interface ToolResultMessage {
  type: "user";
  message: {
    role: "user";
    content: ToolResultBlock[];
  };
  timestamp: string;
  promptId?: string;
  /** Present on Task tool results — links to subagent transcript. */
  toolUseResult?: {
    agentId: string;
  };
}

/** An assistant message in the transcript. */
export interface AssistantMessage {
  type: "assistant";
  message: {
    id: string;
    role: "assistant";
    model: string;
    content: ContentBlock[];
    usage: Usage;
    stop_reason?: string | null;
  };
  timestamp: string;
  promptId?: string;
}

export type TranscriptMessage = UserMessage | ToolResultMessage | AssistantMessage;

// ─── Parsed Turn (grouped messages) ────────────────────────────────────────

/** A tool invocation paired with its result. */
export interface ToolCall {
  tool_use: ToolUseBlock;
  result?: {
    content: string;
    timestamp: string;
  };
  /** If this was a Task tool, the agent ID for subagent tracing. */
  agentId?: string;
}

/** A single LLM response, possibly with tool calls. */
export interface LLMCall {
  /** Merged content from all streaming chunks. */
  content: ContentBlock[];
  /** Model name (date suffix stripped). */
  model: string;
  /** Final cumulative usage. */
  usage: Usage;
  /** Timestamp of first chunk (start time). */
  startTime: string;
  /** Timestamp of last chunk (end time). */
  endTime: string;
  /** Tool calls made in this response. */
  toolCalls: ToolCall[];
}

/** A complete turn: one user prompt → one or more LLM calls. */
export interface Turn {
  userContent: string;
  userTimestamp: string;
  llmCalls: LLMCall[];
  /** Whether the turn is complete (has stop_reason: "end_turn"). If false, the assistant is still responding. */
  isComplete: boolean;
}

// ─── LangSmith Run Types ───────────────────────────────────────────────────

export interface RunCreate {
  id: string;
  trace_id: string;
  parent_run_id?: string;
  name: string;
  run_type: "chain" | "llm" | "tool";
  inputs: Record<string, unknown>;
  start_time: string;
  dotted_order: string;
  session_name: string;
  extra?: Record<string, unknown>;
  tags?: string[];
}

export interface RunUpdate {
  id: string;
  trace_id: string;
  parent_run_id?: string;
  dotted_order: string;
  outputs: Record<string, unknown>;
  end_time: string;
}

// ─── Tracing State ─────────────────────────────────────────────────────────

export interface SessionState {
  last_line: number;
  turn_count: number;
  updated: string;
  /** Current turn's run ID, set by UserPromptSubmit hook */
  current_turn_run_id?: string;
  /** Current turn's trace ID */
  current_trace_id?: string;
  /** Current turn's dotted order prefix for child runs */
  current_dotted_order?: string;
  /** Current turn start time for duration calculation */
  current_turn_start?: number;
  /** Maps agent_id -> parent tool run info (ID and dotted_order) for linking subagent traces */
  task_run_map?: Record<string, { run_id: string; dotted_order: string }>;
  /** Pending subagent traces to process (set by SubagentStop, processed by Stop) */
  pending_subagent_traces?: Array<{
    agent_id: string;
    agent_type: string;
    agent_transcript_path: string;
    session_id: string;
  }>;
}

export interface TracingState {
  [sessionId: string]: SessionState;
}

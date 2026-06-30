/**
 * Types for Claude Code hook inputs and JSONL transcript messages.
 */

import type { RunTree } from "langsmith";

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
  /** True if this LLM call was synthesized (not from the transcript). */
  synthetic?: boolean;
}

/** A complete turn: one user prompt → one or more LLM calls. */
export interface Turn {
  userContent: string | Array<Record<string, unknown>>;
  userTimestamp: string;
  llmCalls: LLMCall[];
  /** Whether the turn is complete (has stop_reason: "end_turn"). If false, the assistant is still responding. */
  isComplete: boolean;
  /** Claude Code prompt id for this turn → coding-agent-v1 `turn_id`. */
  promptId?: string;
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
  /** Current turn's parent run ID (set when nesting under an external parent) */
  current_parent_run_id?: string;
  /** Current turn number (1-based), set by UserPromptSubmit for Stop to use */
  current_turn_number?: number;
  /** Current turn start time (ISO string) for duration calculation */
  current_turn_start?: string;
  /** Permission mode for the current turn → coding-agent-v1 `approval_policy` (root/interrupted). */
  approval_policy?: string;
  /** Claude Code CLI version → coding-agent-v1 `ls_agent_runtime_version`. */
  runtime_version?: string;
  /** Wall-clock time (ms) when the last tool finished, set by PostToolUse */
  last_tool_end_time?: number;
  /** Maps tool_use_id -> wall-clock start time (ms), set by PreToolUse */
  tool_start_times?: Record<string, number>;
  /** Maps agent_id -> parent tool run info for linking subagent traces.
   *  For Agent tools, also stores deferred creation info so the Stop hook
   *  can create the run with the correct subagent name. */
  task_run_map?: Record<
    string,
    {
      run_id: string;
      dotted_order: string;
      /** Deferred Agent tool creation info (set by PostToolUse, used by Stop) */
      deferred?: Partial<RunTree>;
    }
  >;
  /** tool_use_ids of regular tools already traced by PostToolUse (prevents double-tracing in traceTurn) */
  traced_tool_use_ids?: string[];
  /** Wall-clock time (ms) when the last PreCompact hook fired */
  compaction_start_time?: number;
  /** Pending subagent traces to process (set by SubagentStop, processed by Stop).
   *  Only used for synchronous subagents, whose SubagentStop fires before
   *  PostToolUse has recorded the Agent tool run. */
  pending_subagent_traces?: Array<{
    agent_id: string;
    agent_type: string;
    agent_transcript_path: string;
    session_id: string;
  }>;
  /** Turns that launched background subagents which may outlive the Stop hook,
   *  keyed by turn run_id. Background subagents run concurrently with the main
   *  loop, so a later turn can start (and launch its own subagents) before an
   *  earlier turn's subagents finish — hence a map, not a single value. The last
   *  SubagentStop to drain a turn's `agent_ids` completes that turn's root run. */
  open_turns?: Record<string, OpenTurn>;
}

/**
 * Completion context for a turn whose background subagents are still in flight.
 * Holds everything needed to complete (patch) the turn's root run independently
 * of the session's "current turn", since later turns overwrite the `current_*`
 * fields while this turn's subagents are still running.
 */
export interface OpenTurn {
  run_id: string;
  trace_id?: string;
  dotted_order?: string;
  parent_run_id?: string;
  start_time?: string;
  turn_number?: number;
  turn_id?: string;
  runtime_version?: string;
  approval_policy?: string;
  /** Final assistant message → root run outputs; set by Stop when the main turn ends. */
  last_assistant_message?: string;
  /** True once the Stop hook finished the main turn. Gates completion: a subagent
   *  that finishes before Stop must not complete the turn prematurely. */
  stop_seen: boolean;
  /** Background subagents launched by this turn that haven't been traced yet. */
  agent_ids: string[];
}

export interface TracingState {
  [sessionId: string]: SessionState;
}

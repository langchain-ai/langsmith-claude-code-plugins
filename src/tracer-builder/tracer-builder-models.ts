import type { CodingAgentMetadataOptions } from "@langchain/plugins-base/metadata";
import type { ContentBlock, Usage } from "../types.js";
import type { TracingMode } from "@langchain/plugins-base/tracer";

export type Message = Record<string, unknown>;

export interface NoteDetails {
  time?: number;
  toolUseId?: string;
  permissionMode?: string;
  lastAssistantMessage?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  errorDetails?: string;
}

export interface RunPlace {
  id: string;
  traceId: string;
  dottedOrder: string;
}

export interface OpenRun extends RunPlace {
  name: string;
  runType: string;
  start: string;
  end?: string;
  mode: TracingMode;
  metadata: CodingAgentMetadataOptions;
  parentId?: string;
}

export interface ModelCall {
  messageId: string;
  index: number;
  start: string;
  end: string;
  toolEnd?: string;
  content: ContentBlock[];
  model: string;
  usage: Usage;
  effort?: string;
  inputs: Message[];
}

export interface ToolResult {
  time: string;
  output: unknown;
  error?: string;
}

export interface OpenTool {
  toolUseId: string;
  toolName: string;
  thread: string;
  turnId?: string;
  input?: unknown;
  callMessageId: string;
  callEnd?: string;
  hookMode?: TracingMode;
  result?: ToolResult;
  run?: OpenRun;
}

export interface Thread {
  parent?: RunPlace;
  ownerId?: string;
  mode: TracingMode;
  agentType: "root";
  promptId?: string;
  turnNumber?: number;
  llmIndex: number;
  endTurnSeen: boolean;
  call?: ModelCall;
  pendingInputs: Message[];
  lastText: string;
  lastTime?: string;
}

export interface OpenTurn {
  run: OpenRun;
  promptId?: string;
  turnNumber: number;
  approvalPolicy?: string;
  typedSkill?: string;
  stopped: boolean;
  error?: string;
  text?: string;
}

export interface PendingStart {
  time: string;
  mode: TracingMode;
  approvalPolicy?: string;
}

export interface PendingPrompt {
  time: string;
  promptId?: string;
  content: string | Message[];
  approvalPolicy?: string;
}

export interface PendingCompaction {
  start: string;
  end: string;
  trigger: string;
  mode?: TracingMode;
}

export interface BuilderState {
  version: number;
  mainPath?: string;
  sessionMode: TracingMode;
  baseMetadata?: Record<string, unknown>;
  runtimeVersion?: string;
  turnCount: number;
  currentTurn?: string;
  lastTurnPlace?: RunPlace;
  pendingStart?: PendingStart;
  pendingPrompt?: PendingPrompt;
  preCompact?: { time: string; mode?: TracingMode };
  compaction?: PendingCompaction;
  lastTime?: string;
  hookClockOffset?: number;
  turns: Record<string, OpenTurn>;
  threads: Record<string, Thread>;
  tools: Record<string, OpenTool>;
  hookTimes: Record<string, { time: number; mode?: TracingMode }>;
}

export interface ToolCloseOutcome {
  output: unknown;
  error?: string;
  end: string;
}

export interface ClaudeLine {
  type?: string;
  subtype?: string;
  uuid?: string;
  timestamp?: string;
  promptId?: string;
  isMeta?: boolean;
  isCompactSummary?: boolean;
  isSidechain?: boolean;
  version?: string;
  permissionMode?: string;
  effort?: string;
  toolUseResult?: Record<string, unknown>;
  compactMetadata?: { trigger?: string };
  message?: {
    id?: string;
    model?: string;
    content?: unknown;
    usage?: Usage;
    stop_reason?: string | null;
  };
}

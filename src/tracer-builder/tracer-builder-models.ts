import type { CodingAgentMetadataOptions } from "@langchain/plugins-base/metadata";
import type { ContentBlock, ToolOrigin, Usage } from "../types.js";
import type { TracingMode } from "@langchain/plugins-base/tracer";

export type Message = Record<string, unknown>;

export interface NoteDetails {
  time?: number;
  toolUseId?: string;
  permissionMode?: string;
  lastAssistantMessage?: string;
  metadata?: Record<string, unknown>;
  pinnedRepositoryKeys?: string[];
  error?: string;
  errorDetails?: string;
  parentDottedOrder?: string;
  cwd?: string;
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

export interface PatchContent {
  outputs?: unknown;
  error?: string;
  metadata?: CodingAgentMetadataOptions;
}

export type RunFields = Pick<OpenRun, "name" | "runType" | "start" | "mode" | "metadata">;

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
  historyIndex: number;
}

export interface ToolResult {
  time: string;
  output: unknown;
  error?: string;
  agentId?: string;
  agentType?: string;
  launched: boolean;
}

export interface BackgroundLaunch {
  output: unknown;
  chainClosed: boolean;
  notified: boolean;
  notificationTurn?: string;
}

export interface OpenTool {
  toolUseId: string;
  toolName: string;
  thread: string;
  turnId?: string;
  input?: unknown;
  cwd?: string;
  callMessageId: string;
  callEnd?: string;
  hookMode?: TracingMode;
  result?: ToolResult;
  run?: OpenRun;
  agentId?: string;
  subagentType?: string;
  launch?: BackgroundLaunch;
}

export interface Thread {
  parent?: RunPlace;
  ownerId?: string;
  mode: TracingMode;
  agentType: "root" | "subagent";
  promptId?: string;
  prompted?: boolean;
  turnNumber?: number;
  llmIndex: number;
  endTurnSeen: boolean;
  call?: ModelCall;
  messages: Message[];
  historyBytes?: number;
  lastText: string;
  lastTime?: string;
  lastLineId?: string;
  closeAtLineId?: string;
  chain?: OpenRun;
  toolUseId?: string;
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
  toolOrigins: ToolOrigin[];
  gitMetadata?: Record<string, unknown>;
}

export interface PendingStart {
  time: string;
  mode: TracingMode;
  approvalPolicy?: string;
  parentDottedOrder?: string;
}

export interface PendingPrompt {
  time: string;
  promptId?: string;
  content: string | Message[];
  approvalPolicy?: string;
  notificationOf?: string;
}

export interface BuilderState {
  version: number;
  mainPath?: string;
  sessionMode: TracingMode;
  baseMetadata?: Record<string, unknown>;
  pinnedRepositoryKeys?: string[];
  runtimeVersion?: string;
  turnCount: number;
  currentTurn?: string;
  stoppedTurn?: OpenTurn;
  lastTurnPlace?: RunPlace;
  seededRoot?: RunPlace;
  pendingStart?: PendingStart;
  pendingPrompt?: PendingPrompt;
  preCompact?: { time: string; mode?: TracingMode };
  compaction?: { start: string; end: string; trigger: string; mode?: TracingMode };
  lastTime?: string;
  hookClockOffset?: number;
  cwd?: string;
  turns: Record<string, OpenTurn>;
  threads: Record<string, Thread>;
  tools: Record<string, OpenTool>;
  hookTimes: Record<string, { time: number; mode?: TracingMode }>;
}

export interface ClaudeLine {
  type?: string;
  subtype?: string;
  uuid?: string;
  timestamp?: string;
  cwd?: string;
  promptId?: string;
  isCompactSummary?: boolean;
  isSidechain?: boolean;
  queueTranscriptOnly?: boolean;
  turnCompanion?: boolean;
  version?: string;
  permissionMode?: string;
  effort?: string;
  toolUseResult?: Record<string, unknown>;
  compactMetadata?: { trigger?: string };
  attachment?: { type?: string; hookEvent?: string };
  message?: {
    id?: string;
    model?: string;
    content?: unknown;
    usage?: Usage;
    stop_reason?: string | null;
  };
}

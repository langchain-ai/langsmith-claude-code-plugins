import type { CaptureStore } from "@langchain/plugins-base/storage/capture";
import type { TracingEngineSession } from "@langchain/plugins-base/tracing";
import type { LifecycleCaptureInput } from "@langchain/plugins-base/tracing/lifecycle";
import type { UploadDestination } from "@langchain/plugins-base/tracing/upload";
import type { NormalizedRunSnapshot } from "@langchain/plugins-base/tracing/upload";
import type { ReconstructionTurnEvidence } from "@langchain/plugins-base/tracing/reconstruction";
import type { ToolOrigin, TracingMode } from "../types.js";

export interface ClaudeToolMetadataSnapshot {
  turnNumber?: number;
  runtimeVersion?: string;
  toolName: string;
  skillName?: string;
  base?: Record<string, unknown>;
  turnAttributionFallback?: Record<string, unknown>;
}

export interface ClaudeToolReconstructionInput {
  turnId: string;
  privacyMode: TracingMode;
  run: NormalizedRunSnapshot;
  origin: ToolOrigin;
  pinnedRepositoryKeys?: readonly string[];
  metadata: ClaudeToolMetadataSnapshot;
  turnEvidence: ReconstructionTurnEvidence;
}

export interface ClaudeRecordedToolOrigin {
  toolUseId: string;
  toolName: string;
  order: number;
  origin: ToolOrigin;
  pinnedRepositoryKeys?: string[];
  resolvedMetadata?: Record<string, string>;
}

export interface ClaudeRunReconstructionContext {
  project: string;
  recordOrigin: string;
  sessionId: string;
  stateFilePath: string;
}

export interface ClaudeTracingEngineContext {
  accountFingerprint: string;
  captureStore: CaptureStore;
  destinations: readonly UploadDestination[];
  project: string;
  recordOrigin: string;
  stateFilePath: string;
  session: TracingEngineSession;
  sessionId: string;
  storageRoot: string;
}

export type ClaudeSharedRunCapture = (
  input: LifecycleCaptureInput,
  nativeTurnRecordRunId?: string,
) => Promise<boolean>;

export type ClaudeSharedChildRunIds = (
  turnId: string,
  rootRunId: string,
  recordedSharedChildRunIds?: readonly string[],
) => Promise<string[]>;

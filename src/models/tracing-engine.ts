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

export interface ClaudeTracingEngineContext {
  accountFingerprint: string;
  captureStore: CaptureStore;
  destinations: readonly UploadDestination[];
  session: TracingEngineSession;
  sessionId: string;
  storageRoot: string;
}

export type ClaudeSharedRunCapture = (input: LifecycleCaptureInput) => Promise<boolean>;

export type ClaudeSharedChildRunIds = (
  turnId: string,
  rootRunId: string,
  recordedSharedChildRunIds?: readonly string[],
) => Promise<string[]>;

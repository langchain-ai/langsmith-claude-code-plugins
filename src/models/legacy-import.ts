import type { LifecycleSnapshotCaptureInput } from "@langchain/plugins-base/tracing/lifecycle";
import type { ClaudeTracingEngineContext } from "./tracing-engine.js";
import type { Config } from "../config.js";

export type { LegacySessionRoute } from "./native-routing.js";

export interface LegacyQueueCapturePlan {
  cwd: string;
  sessionId: string;
  projectName: string;
  turnId: string;
  recordPath: string;
  run: Record<string, unknown>;
  open: boolean;
  input: LifecycleSnapshotCaptureInput;
}

export type LegacyQueueCapturePlanResult = { plan: LegacyQueueCapturePlan } | { reason: string };

export interface LegacyQueueImportOptions {
  config: Config;
  dir: string;
  origin: string;
  createContext: LegacyTracingContextFactory;
}

export type LegacyTracingContextFactory = (
  config: Config,
  cwd: string,
  sessionId: string,
  projectName: string,
) => ClaudeTracingEngineContext | undefined;

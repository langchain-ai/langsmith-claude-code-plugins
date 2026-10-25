import { getThreadTracingMode } from "./tracing-policy.js";
import { turnOwnsToolUse } from "./transcript.js";
import type { Config, SessionState, TracingMode } from "./types.js";

/** Saved launch snapshots win; only unsnapshotted work consults policy + config. */
export function resolveTurnTracingMode(
  config: string | { stateFilePath: string; defaultMuted?: boolean; mutedLocked?: boolean },
  sessionId: string,
  ...snapshots: (TracingMode | undefined)[]
): TracingMode {
  // Retain the path-only API for callers with no configured default.
  const { stateFilePath, defaultMuted, mutedLocked } =
    typeof config === "string" ? { stateFilePath: config } : config;
  return (
    snapshots.find((mode) => mode !== undefined) ??
    (mutedLocked ? "metadata" : getThreadTracingMode(stateFilePath, sessionId, defaultMuted))
  );
}

export function toolTracingMode(
  config: Config,
  sessionId: string,
  session: SessionState,
  transcriptPath: string | undefined,
  toolUseId: string,
  mode: TracingMode,
): TracingMode {
  if (mode === "metadata") return mode;
  if (getThreadTracingMode(config.stateFilePath, sessionId, config.defaultMuted) === "full") {
    return mode;
  }
  return transcriptPath && turnOwnsToolUse(transcriptPath, session, toolUseId) ? mode : "metadata";
}

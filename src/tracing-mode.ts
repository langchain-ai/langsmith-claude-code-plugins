import { getThreadTracingMode } from "./tracing-policy.js";
import type { TracingMode } from "./types.js";

/** Saved launch snapshots win; only unsnapshotted work consults policy + config. */
export function resolveTurnTracingMode(
  config: string | { stateFilePath: string; defaultMuted?: boolean },
  sessionId: string,
  ...snapshots: (TracingMode | undefined)[]
): TracingMode {
  // Retain the path-only API for callers with no configured default.
  const { stateFilePath, defaultMuted } =
    typeof config === "string" ? { stateFilePath: config } : config;
  return (
    snapshots.find((mode) => mode !== undefined) ??
    getThreadTracingMode(stateFilePath, sessionId, defaultMuted)
  );
}

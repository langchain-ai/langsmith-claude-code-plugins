import { getThreadTracingMode } from "./tracing-policy.js";
import type { TracingMode } from "./types.js";

/** Saved launch snapshots win; only unsnapshotted work consults the sticky policy. */
export function resolveTurnTracingMode(
  stateFilePath: string,
  sessionId: string,
  ...snapshots: (TracingMode | undefined)[]
): TracingMode {
  return (
    snapshots.find((mode) => mode !== undefined) ?? getThreadTracingMode(stateFilePath, sessionId)
  );
}

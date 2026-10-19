import { LEGACY_SWEEP_WARNING } from "./constants.js";
import { captureInto } from "./engine-capture.js";
import { openSession } from "./engine-session.js";
import { legacyRuns } from "./legacy-import.js";
import { sweepLegacyLeftovers } from "./legacy-sweep.js";
import { warn } from "./logger.js";
import { removeFile } from "./utils/files.js";
import type { ClaudeTracingSession, Config } from "./types.js";

export async function importLegacyRuns(config: Config, cwd: string): Promise<void> {
  const sessions = new Map<string, ClaudeTracingSession>();
  const failed = new Set<string>();
  const { runs, settled, unreadable } = legacyRuns(config);
  for (const { sessionId, file, mode, operation, run } of runs) {
    try {
      const context = sessions.get(sessionId) ?? openSession(config, cwd, sessionId);
      sessions.set(sessionId, context);
      await captureInto(context, run, mode, run.id, operation);
    } catch (err) {
      failed.add(file);
      warn(`Could not move ${file} to the new uploader: ${err}`);
    }
  }
  for (const file of new Set([...settled, ...runs.map((legacy) => legacy.file)])) {
    if (!failed.has(file)) removeFile(file);
  }
  const aged = sweepLegacyLeftovers(config.stateFilePath, new Set(unreadable));
  if (aged > 0) {
    warn(`Removed ${aged} ${LEGACY_SWEEP_WARNING}`);
  }
}

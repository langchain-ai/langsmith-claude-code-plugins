import { WORKER_STOP_STATUSES } from "./constants.js";
import { importLegacyRuns } from "./engine-legacy.js";
import { openSession } from "./engine-session.js";
import { warn } from "./logger.js";
import { initHook } from "./utils/hook-init.js";

export async function runEngineWorker(cwd: string, sessionId: string | undefined): Promise<void> {
  const config = initHook(cwd, { deferGit: true });
  if (!config || !sessionId) return;
  const result = await openSession(config, cwd, sessionId).session.drain();
  if (WORKER_STOP_STATUSES.includes(result)) {
    warn(`The uploader for ${sessionId} stopped with ${result}`);
  }
  await importLegacyRuns(config, cwd);
}

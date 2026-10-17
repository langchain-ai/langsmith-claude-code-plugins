import type {
  ReconstructionJob,
  ReconstructionResult,
} from "@langchain/plugins-base/tracing/reconstruction";
import { CLOSING_EVENT_PREFIX } from "./constants.js";
import { settleToolRuns } from "./engine-tool-settlement.js";
import { error } from "./logger.js";
import { atomicUpdateState, getSessionState, loadState } from "./state.js";
import { CLOSING_HANDLERS } from "./engine-closings-constants.js";
import type { Config } from "./types.js";
import { sessionScopedMetadata } from "./repo-attribution.js";
import { initHook } from "./utils/hook-init.js";

export function reconstructJob(config: Config) {
  return (job: ReconstructionJob): Promise<ReconstructionResult> =>
    job.eventId.startsWith(CLOSING_EVENT_PREFIX)
      ? runQueuedClosings(config, job.sessionId)
      : settleToolRuns(job);
}

export async function runQueuedClosings(
  workerConfig: Config,
  sessionId: string,
): Promise<ReconstructionResult> {
  for (;;) {
    const queued = getSessionState(
      loadState(workerConfig.stateFilePath),
      sessionId,
    ).queued_closings;
    const next = Object.entries(queued ?? {}).sort(([, a], [, b]) => a.at - b.at)[0];
    if (!next) return { status: "ready", outputs: [] };
    const [id, closing] = next;
    const config = initHook(closing.input.cwd);
    if (config) {
      config.customMetadata = sessionScopedMetadata(config.customMetadata, closing.input.cwd);
    }
    try {
      if (config) await CLOSING_HANDLERS[closing.kind](id, closing, config);
    } catch (err) {
      error(`Failed to finish the ${closing.kind} hook's work: ${err}`);
    }
    await atomicUpdateState(workerConfig.stateFilePath, (state) => {
      const session = getSessionState(state, sessionId);
      const { [id]: _done, ...rest } = session.queued_closings ?? {};
      return { ...state, [sessionId]: { ...session, queued_closings: rest } };
    });
  }
}

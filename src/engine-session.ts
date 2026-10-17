import { dirname, join } from "node:path";
import type { PluginSessionOptions } from "@langchain/plugins-base/plugin";
import { launchDetachedWorker, openPluginSession } from "@langchain/plugins-base/plugin";
import { createLangSmithUploadWriter } from "@langchain/plugins-base/tracing/upload";
import { loadConfig } from "./config.js";
import {
  ENGINE_STORAGE_DIR_NAME,
  ENGINE_WORKER_ARG,
  LS_INTEGRATION,
  RECOVERY_REPORT_PROBLEM_STATUSES,
} from "./constants.js";
import { writerOptions } from "./engine-writer.js";
import { settleToolRuns } from "./engine-tool-settlement.js";
import { warn } from "./logger.js";
import type { ClaudeTracingSession, Config } from "./types.js";

export function openSession(
  config: Config,
  cwd: string,
  sessionId: string,
  reconstruct: PluginSessionOptions["reconstruct"] = settleToolRuns,
): ClaudeTracingSession {
  const writer = writerOptions(config);
  const storageRoot = join(dirname(config.stateFilePath), ENGINE_STORAGE_DIR_NAME);
  const context = openPluginSession({
    storageRoot,
    integration: LS_INTEGRATION,
    sessionId,
    writer,
    currentWriter: () => writerOptions(loadConfig({ cwd })),
    scheduleWake: (id) => launchDetachedWorker([ENGINE_WORKER_ARG, cwd, id], { storageRoot }),
    reconstruct,
    onRecoveryReport: (report) => {
      if (RECOVERY_REPORT_PROBLEM_STATUSES.includes(report.status)) {
        warn(`Could not upload every older session: ${JSON.stringify(report)}`);
      }
    },
  });
  return { ...context, destinations: createLangSmithUploadWriter(writer).destinations };
}

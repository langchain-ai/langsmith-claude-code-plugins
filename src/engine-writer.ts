import { RunTree } from "langsmith";
import type {
  LangSmithUploadReplicaConfig,
  LangSmithUploadWriterOptions,
} from "@langchain/plugins-base/tracing/upload";
import { dirname, join } from "node:path";
import { ENGINE_STORAGE_DIR_NAME, SDK_REPLICA_PROBE } from "./constants.js";
import type { Config } from "./types.js";
import { cloneJson } from "./utils/clone.js";

export function writerOptions(config: Config): LangSmithUploadWriterOptions {
  const replicas = config.replicas ?? replicasFromEnvironment();
  return {
    destinations: [
      {
        ...(config.login ? { login: config.login } : { apiKey: config.apiKey }),
        apiUrl: config.apiBaseUrl,
        projectName: config.project,
      },
    ],
    ...(replicas?.length ? { replicas: replicas.map(writerReplica) } : {}),
    redact: config.redact,
    ...(config.loginBrowser === undefined ? {} : { loginBrowser: config.loginBrowser }),
    ...(config.projectLocked ? { projectLocked: true } : {}),
    ...(config.redactExtraRules
      ? {
          redactExtraRules:
            config.redactExtraRules as LangSmithUploadWriterOptions["redactExtraRules"],
        }
      : {}),
  };
}

export function engineStorageRoot(stateFilePath: string): string {
  return join(dirname(stateFilePath), ENGINE_STORAGE_DIR_NAME);
}

function replicasFromEnvironment(): RunTree["replicas"] {
  return new RunTree(SDK_REPLICA_PROBE).replicas;
}

export function writerReplica(
  replica: NonNullable<Config["replicas"]>[number],
): LangSmithUploadReplicaConfig {
  const source = Array.isArray(replica)
    ? { projectName: replica[0], updates: replica[1] }
    : (replica as LangSmithUploadReplicaConfig);
  return cloneJson(source);
}

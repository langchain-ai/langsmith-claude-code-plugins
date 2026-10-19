import { RunTree } from "langsmith";
import type {
  LangSmithUploadReplicaConfig,
  LangSmithUploadWriterOptions,
} from "@langchain/plugins-base/tracing/upload";
import { SDK_REPLICA_PROBE } from "./constants.js";
import type { Config } from "./types.js";
import { cloneJson } from "./utils/clone.js";

export function writerOptions(config: Config): LangSmithUploadWriterOptions {
  const replicas = config.replicas ?? replicasFromEnvironment();
  return {
    destinations: [
      { apiKey: config.apiKey, apiUrl: config.apiBaseUrl, projectName: config.project },
    ],
    ...(replicas?.length ? { replicas: replicas.map(writerReplica) } : {}),
    redact: config.redact,
    ...(config.redactExtraRules
      ? {
          redactExtraRules:
            config.redactExtraRules as LangSmithUploadWriterOptions["redactExtraRules"],
        }
      : {}),
  };
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

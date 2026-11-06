import { RunTree } from "langsmith";
import { readLoginNotice, refusedLoginReplicas, sdkSetting } from "@langchain/plugins-base/auth";
import type {
  LangSmithUploadReplicaConfig,
  LangSmithUploadWriterOptions,
} from "@langchain/plugins-base/tracing/upload";
import { dirname, join } from "node:path";
import { ENGINE_STORAGE_DIR_NAME, SDK_REPLICA_PROBE } from "./constants.js";
import type { Config, UploadNotices } from "./types.js";
import { cloneJson } from "./utils/clone.js";

export function writerOptions(config: Config): LangSmithUploadWriterOptions {
  const replicas = uploadReplicas(config.replicas);
  return {
    destinations: [
      {
        ...(config.login ? { login: config.login } : { apiKey: config.apiKey }),
        apiUrl: config.apiBaseUrl,
        projectName: config.project,
        ...(config.agentId === undefined ? {} : { agentId: config.agentId }),
      },
    ],
    ...(replicas.length ? { replicas } : {}),
    redact: config.redact,
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

export function uploadReplicas(replicas: Config["replicas"]): LangSmithUploadReplicaConfig[] {
  return (replicas ?? replicasFromEnvironment() ?? []).map(writerReplica);
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

export function readUploadNotices(config: Config): UploadNotices {
  const apiKey = sdkSetting(config.apiKey);
  const loginNotice = readLoginNotice(
    engineStorageRoot(config.stateFilePath),
    process.env,
    config.login || apiKey === undefined ? undefined : { apiKey, apiUrl: config.apiBaseUrl },
    config.profile,
  );
  const credentialNotice = config.login
    ? refusedLoginReplicas(writerOptions(config).replicas, config.apiBaseUrl)
    : undefined;
  return { loginNotice, credentialNotice };
}

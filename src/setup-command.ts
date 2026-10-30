import { homedir } from "node:os";
import { refusedLoginReplicas, sdkSetting } from "@langchain/plugins-base/auth";
import {
  describeSetup,
  parseSetupArguments,
  writeSetupConfig,
} from "@langchain/plugins-base/settings";
import type { SetupOutcome } from "@langchain/plugins-base/settings";
import { loadConfig } from "./config.js";
import { HARNESS_DIRECTORY } from "./constants.js";
import { readUploadNotices, uploadReplicas } from "./engine-writer.js";
import { resolveTurnTracingMode } from "./tracing-mode.js";
import { hasUsableDestination } from "./utils/replicas.js";
import type { Config } from "./types.js";

function signInState(config: Config): Pick<SetupOutcome, "signIn" | "credentialProblem"> {
  if (config.managedConfigProblem) {
    return { signIn: "none", credentialProblem: config.managedConfigProblem };
  }
  if (!hasUsableDestination(config)) {
    return { signIn: "none", credentialProblem: config.credentialProblem };
  }
  const { loginNotice, credentialNotice } = readUploadNotices(config);
  return {
    signIn: config.login ? "login" : "api-key",
    credentialProblem: loginNotice ?? credentialNotice,
  };
}

function uploadedReplicaCount(config: Config): number {
  const replicas = uploadReplicas(config.replicas);
  if (!config.login && sdkSetting(config.apiKey) !== undefined) return replicas.length;
  return replicas.filter(
    (replica) =>
      sdkSetting(replica.apiKey) !== undefined ||
      (config.login !== undefined &&
        refusedLoginReplicas([replica], config.apiBaseUrl) === undefined),
  ).length;
}

function destinationState(
  config: Config,
): Pick<SetupOutcome, "replicaCount" | "credentialProblem"> {
  if (!hasUsableDestination(config)) return {};
  try {
    return { replicaCount: uploadedReplicaCount(config) };
  } catch (error) {
    return { credentialProblem: error instanceof Error ? error.message : String(error) };
  }
}

export function runSetupCommand(argumentText: string, cwd: string, sessionId: string): string {
  const requested = parseSetupArguments(argumentText);
  const path = writeSetupConfig(homedir(), HARNESS_DIRECTORY, requested);
  const config = loadConfig({ cwd });
  const destination = destinationState(config);
  const signIn = signInState(config);
  return describeSetup({
    path,
    requested,
    enabled: config.enabled,
    project: config.project,
    ...(config.agentId === undefined ? {} : { agentId: config.agentId }),
    apiUrl: config.apiBaseUrl,
    replicaCount: destination.replicaCount,
    muted: resolveTurnTracingMode(config, sessionId) === "metadata",
    signIn: signIn.signIn,
    credentialProblem: signIn.credentialProblem ?? destination.credentialProblem,
  });
}

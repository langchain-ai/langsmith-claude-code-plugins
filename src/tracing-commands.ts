import { homedir } from "node:os";
import { sdkSetting, uploadingReplicaCount } from "@langchain/plugins-base/auth";
import type { UploadCredential } from "@langchain/plugins-base/auth";
import type { PromptCommandHandler } from "@langchain/plugins-base/plugin";
import { applySetup } from "@langchain/plugins-base/settings";
import type { SetupState } from "@langchain/plugins-base/settings";
import { loadConfig } from "./config.js";
import {
  HARNESS_DIRECTORY,
  MASTER_DISABLED_NOTE,
  MUTE_FAILED,
  MUTE_LOCKED_REPLY,
  NO_CREDENTIALS_NOTE,
  THREAD_MODE_REPLIES,
  TRACE_FAILED,
} from "./constants.js";
import { readUploadNotices, uploadReplicas } from "./engine-writer.js";
import { resolveTurnTracingMode } from "./tracing-mode.js";
import { describeThreadLinks } from "./thread-link.js";
import { setThreadTracingMode } from "./tracing-policy.js";
import { hasUsableDestination } from "./utils/replicas.js";
import type { Config, TracingCommand, TracingMode, UserPromptSubmitHookInput } from "./types.js";

function signInState(config: Config): Pick<SetupState, "signIn" | "credentialProblem"> {
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

function uploadCredential(config: Config): UploadCredential {
  const apiKey = sdkSetting(config.apiKey);
  if (config.login) return { kind: "login", login: config.login, apiUrl: config.apiBaseUrl };
  if (apiKey !== undefined) return { kind: "api-key", apiKey, apiUrl: config.apiBaseUrl };
  return { kind: "none", reason: config.credentialProblem ?? "" };
}

function destinationState(config: Config): Pick<SetupState, "replicaCount" | "credentialProblem"> {
  if (!hasUsableDestination(config)) return {};
  try {
    return {
      replicaCount: uploadingReplicaCount(
        uploadReplicas(config.replicas),
        uploadCredential(config),
      ),
    };
  } catch (error) {
    return { credentialProblem: error instanceof Error ? error.message : String(error) };
  }
}

function setupState(input: UserPromptSubmitHookInput): SetupState {
  const config = loadConfig({ cwd: input.cwd });
  const destination = destinationState(config);
  const signIn = signInState(config);
  return {
    enabled: config.enabled,
    project: config.project,
    ...(config.agentId === undefined ? {} : { agentId: config.agentId }),
    apiUrl: config.apiBaseUrl,
    replicaCount: destination.replicaCount,
    muted: resolveTurnTracingMode(config, input.session_id) === "metadata",
    signIn: signIn.signIn,
    credentialProblem: signIn.credentialProblem ?? destination.credentialProblem,
  };
}

function setUpTracing(argumentText: string, input: UserPromptSubmitHookInput): Promise<string> {
  return applySetup(argumentText, {
    home: homedir(),
    harnessDirectory: HARNESS_DIRECTORY,
    readState: () => setupState(input),
  });
}

async function replyWithThreadLinks(
  _argumentText: string,
  input: UserPromptSubmitHookInput,
): Promise<string> {
  try {
    return await describeThreadLinks(loadConfig({ cwd: input.cwd }), input.session_id);
  } catch {
    return TRACE_FAILED.replace("{sessionId}", () => input.session_id);
  }
}

async function saveThreadMode(
  input: UserPromptSubmitHookInput,
  mode: TracingMode,
): Promise<string> {
  const replies = THREAD_MODE_REPLIES[mode];
  try {
    const config = loadConfig({ cwd: input.cwd });
    if (mode === "full" && config.mutedLocked) return MUTE_LOCKED_REPLY;
    const result = await setThreadTracingMode(config.stateFilePath, input.session_id, mode);
    let reply: string = replies.saved;
    if (result?.warning) reply += ` Warning: ${result.warning}.`;
    if (config.managedConfigProblem) {
      reply += ` ${config.managedConfigProblem}`;
    } else if (!config.enabled) {
      reply += MASTER_DISABLED_NOTE;
    } else if (!hasUsableDestination(config)) {
      reply += NO_CREDENTIALS_NOTE;
    }
    return reply;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return MUTE_FAILED.replace("{verb}", () => replies.verb).replace("{error}", () => message);
  }
}

export const COMMAND_HANDLERS: Record<
  TracingCommand,
  PromptCommandHandler<UserPromptSubmitHookInput>
> = {
  setup: setUpTracing,
  trace: replyWithThreadLinks,
  mute: (_argumentText, input) => saveThreadMode(input, "metadata"),
  unmute: (_argumentText, input) => saveThreadMode(input, "full"),
};

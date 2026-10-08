import { isCredentialState } from "./config-validation.js";
import { control } from "./lifecycle.js";
import {
  CREDENTIAL_COMMAND_FAILING,
  CREDENTIAL_NEVER_OBTAINED,
  CREDENTIAL_NO_ANSWER,
  CREDENTIAL_NO_DAEMON,
  CREDENTIAL_STATE_PATH,
  CREDENTIAL_UNTRIED,
  CREDENTIAL_WORKING,
  SECONDS_AGO,
  SIGN_IN_CLI_DEFAULT,
  SIGN_IN_CLI_PROFILE,
  SIGN_IN_COMMAND,
  WORKSPACE_UNSET,
} from "./proxy-constants.js";
import type { CredentialState, ProxyConfig } from "./proxy-models.js";

export function signInSummary(config: ProxyConfig): string {
  if (config.identityTokenCommand !== undefined) return SIGN_IN_COMMAND;
  return config.profile === undefined ? SIGN_IN_CLI_DEFAULT : SIGN_IN_CLI_PROFILE(config.profile);
}

export function workspaceSummary(config: ProxyConfig): string {
  return config.workspaceId === undefined ? WORKSPACE_UNSET : JSON.stringify(config.workspaceId);
}

export function credentialSummary(state: CredentialState): string {
  const { sinceSuccessMs, sinceFailureMs } = state;
  if (sinceSuccessMs === undefined && sinceFailureMs === undefined) return CREDENTIAL_UNTRIED;
  if (sinceSuccessMs === undefined) return CREDENTIAL_NEVER_OBTAINED(SECONDS_AGO(sinceFailureMs!));
  if (sinceFailureMs === undefined || sinceFailureMs > sinceSuccessMs)
    return CREDENTIAL_WORKING(SECONDS_AGO(sinceSuccessMs));
  return CREDENTIAL_COMMAND_FAILING(SECONDS_AGO(sinceFailureMs), SECONDS_AGO(sinceSuccessMs));
}

export async function credentialStatus(config: ProxyConfig, reachable: boolean): Promise<string> {
  if (!reachable) return CREDENTIAL_NO_DAEMON;
  try {
    const reported: unknown = JSON.parse(await control(config, "GET", CREDENTIAL_STATE_PATH));
    return isCredentialState(reported) ? credentialSummary(reported) : CREDENTIAL_NO_ANSWER;
  } catch {
    return CREDENTIAL_NO_ANSWER;
  }
}

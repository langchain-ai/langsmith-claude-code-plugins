import {
  refusedLoginReplicas,
  sdkSetting,
  type UploadLogin,
} from "@langchain/plugins-base/auth";
import { Client } from "langsmith";
import type { Config, SdkClientKey } from "./types.js";
import {
  AGENT_ADDRESS_ENVIRONMENT,
  AGENT_ADDRESS_KIND,
  LOOKUP_TIMEOUT_MS,
  WORKSPACE_ID_VARIABLE,
} from "./constants.js";

/**
 * OSC 8 hyperlink keeping a wrapped URL clickable. The URL is its own label, so
 * terminals without OSC 8 ignore the escape and still show the full link.
 */
function terminalLink(url: string): string {
  const OSC8 = "\u001b]8;;";
  const BEL = "\u0007";
  return `${OSC8}${url}${BEL}${url}${OSC8}${BEL}`;
}

function lookupOptions(apiUrl: string) {
  return {
    apiUrl,
    timeout_ms: LOOKUP_TIMEOUT_MS,
    callerOptions: {
      // The SDK ignores maxRetries on reads. Throwing here is what stops the retries.
      onFailedResponseHook: async () => {
        throw new Error("Thread link lookup failed");
      },
    },
  };
}

function keyClient(apiKey: string | undefined, apiUrl: string, workspaceId?: string): Client {
  const fallback = sdkSetting(process.env[WORKSPACE_ID_VARIABLE]) ?? "";
  return new Client({ ...lookupOptions(apiUrl), apiKey, workspaceId: workspaceId ?? fallback });
}

function loginClient(login: UploadLogin, apiUrl: string, workspaceId?: string): Client {
  return new Client({
    ...lookupOptions(apiUrl),
    profile: login.profile,
    profileConfigPath: login.configPath,
    preferProfileAuth: true,
    workspaceId: workspaceId ?? login.workspaceId,
  });
}

/**
 * Builds the message shown to the user: one link per destination, plus any
 * failures. Looks up every time from the hook's session ID, so nothing is cached.
 */
export async function describeThreadLinks(config: Config, sessionId: string): Promise<string> {
  if (!config.enabled) {
    return (
      config.managedConfigProblem ??
      "LangSmith tracing is disabled. Enable it and send a prompt first."
    );
  }

  // Replicas replace the main project rather than adding to it, matching RunTree.postRun.
  const destinations = config.replicas?.length ? config.replicas : [{}];
  const results = await Promise.all(
    destinations.map(async (replica) => {
      const destination = Array.isArray(replica) ? { projectName: replica[0] } : replica;
      const projectName = destination.projectName ?? config.project;
      const apiKey = destination.apiKey ?? config.apiKey;
      const keyed = sdkSetting(apiKey) !== undefined;
      const missingKey = {
        resolved: false,
        line: `${projectName}: No LangSmith API key configured for this destination.`,
      };
      const otherServer =
        destination.apiUrl !== undefined &&
        refusedLoginReplicas([{ apiUrl: destination.apiUrl }], config.apiBaseUrl) !== undefined;
      if (!keyed && (otherServer || !config.login)) return missingKey;

      try {
        const apiUrl = destination.apiUrl ?? config.apiBaseUrl;
        const client = keyed
          ? keyClient(apiKey, apiUrl, destination.workspaceId)
          : loginClient(config.login!, apiUrl, destination.workspaceId);
        if (keyed && !(client as unknown as SdkClientKey).apiKey) return missingKey;
        const agentId = destination.projectName === undefined ? config.agentId : undefined;
        const project = await client.readProject(
          agentId === undefined
            ? { projectName }
            : {
                projectId: (
                  await client.sessions.resolve({
                    kind: AGENT_ADDRESS_KIND,
                    id: agentId,
                    environment: AGENT_ADDRESS_ENVIRONMENT,
                  })
                ).session_id,
              },
        );
        const url = new URL(client.getHostUrl());
        const path = ["o", project.tenant_id, "projects", "p", project.id, "t", sessionId];
        url.pathname = `${url.pathname.replace(/\/$/, "")}/${path.map(encodeURIComponent).join("/")}`;
        return { resolved: true, line: `${projectName}: ${terminalLink(url.href)}` };
      } catch {
        // Drop the error: SDK messages can carry request details the user should not see.
        return {
          resolved: false,
          line: `${projectName}: Could not resolve the thread link. Check access and connectivity, then retry.`,
        };
      }
    }),
  );

  const lines = results.map((result) => result.line);
  // A resolved link already ends in the session ID.
  if (results.some((result) => !result.resolved)) lines.push(`Session ID: ${sessionId}`);
  return lines.join("\n");
}

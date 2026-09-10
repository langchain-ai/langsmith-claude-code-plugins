import { Client } from "langsmith";
import type { Config } from "./config.js";

/** Stops a slow destination from hanging the command. */
export const LOOKUP_TIMEOUT_MS = 4_000;

/**
 * OSC 8 hyperlink keeping a wrapped URL clickable. The URL is its own label, so
 * terminals without OSC 8 ignore the escape and still show the full link.
 */
function terminalLink(url: string): string {
  const OSC8 = "\u001b]8;;";
  const BEL = "\u0007";
  return `${OSC8}${url}${BEL}${url}${OSC8}${BEL}`;
}

/**
 * Builds the message shown to the user: one link per destination, plus any
 * failures. Looks up every time from the hook's session ID, so nothing is cached.
 */
export async function describeThreadLinks(config: Config, sessionId: string): Promise<string> {
  if (!config.enabled) {
    return "LangSmith tracing is disabled. Enable it and send a prompt first.";
  }

  // Replicas replace the main project rather than adding to it, matching RunTree.postRun.
  const destinations = config.replicas?.length ? config.replicas : [{}];
  const results = await Promise.all(
    destinations.map(async (replica) => {
      const destination = Array.isArray(replica) ? { projectName: replica[0] } : replica;
      const projectName = destination.projectName ?? config.project;
      const apiKey = destination.apiKey ?? config.apiKey;
      if (!apiKey) {
        return {
          resolved: false,
          line: `${projectName}: No LangSmith API key configured for this destination.`,
        };
      }

      try {
        const client = new Client({
          apiKey,
          apiUrl: destination.apiUrl ?? config.apiBaseUrl,
          workspaceId: destination.workspaceId,
          timeout_ms: LOOKUP_TIMEOUT_MS,
          callerOptions: {
            // The SDK ignores maxRetries on reads. Throwing here is what stops the retries.
            onFailedResponseHook: async () => {
              throw new Error("Thread link lookup failed");
            },
          },
        });
        const project = await client.readProject({ projectName });
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

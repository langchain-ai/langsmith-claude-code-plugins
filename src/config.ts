/**
 * Configuration — reads from environment variables.
 */

export interface Config {
  apiKey: string;
  project: string;
  apiBaseUrl: string;
  stateFilePath: string;
  debug: boolean;
}

export function loadConfig(): Config {
  const apiKey = process.env.CC_LANGSMITH_API_KEY ?? process.env.LANGSMITH_API_KEY ?? "";

  const project = process.env.CC_LANGSMITH_PROJECT ?? "claude-code";

  const apiBaseUrl = process.env.LANGSMITH_ENDPOINT ?? "https://api.smith.langchain.com";

  const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
  const stateFilePath = process.env.STATE_FILE ?? `${homeDir}/.claude/state/langsmith_state.json`;

  const debug = (process.env.CC_LANGSMITH_DEBUG ?? "").toLowerCase() === "true";

  return { apiKey, project, apiBaseUrl, stateFilePath, debug };
}

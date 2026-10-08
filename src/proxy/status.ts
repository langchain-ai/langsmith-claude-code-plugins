import { join } from "node:path";
import { ConfigError, configStatus } from "./config.js";
import { credentialStatus, signInSummary, workspaceSummary } from "./credential-report.js";
import { healthy } from "./lifecycle.js";
import { parseStatusArgs, SetupError } from "./options.js";
import { CREDENTIAL_UNCONFIGURED } from "./proxy-constants.js";
import { targetPaths } from "./scopes.js";
import { routingStatus } from "./settings.js";

export const STATUS_ERROR =
  "Gateway status unavailable; review config, settings, permissions and canonical project path privately. No changes made.";

export async function gatewayStatus(
  args: string[],
  env: NodeJS.ProcessEnv,
  home: string,
  cwd: string,
): Promise<string> {
  // Validate before any I/O. Status never uses setup or the ordinary hook.
  const { scope } = parseStatusArgs(args);
  try {
    if (env.CLAUDE_CONFIG_DIR && env.CLAUDE_CONFIG_DIR !== join(home, ".claude"))
      throw new Error("Unsupported configuration directory");
    const scopes = scope ? [scope] : (["global", "project"] as const);
    const targets = scopes.map((selected) => ({
      selected,
      paths: targetPaths(home, selected, cwd),
    }));
    const { state, config } = configStatus(home);
    const routes = targets.map(
      ({ selected, paths }) =>
        `  ${selected} ${JSON.stringify(paths.settings)}: ${routingStatus(paths, config)}.`,
    );
    const shared = config
      ? `${state}; useClaudeSubscription ${config.useClaudeSubscription ? "on" : "off"}; API ${config.apiUrl}; gateway ${config.gatewayUrl}.`
      : "not configured.";
    // Two authenticated, identity-matching loopback reads (500 ms wall-clock each):
    // the health probe and the daemon's own credential record. No startup, leases,
    // CLI, auth checks or token refresh, and the credential itself is never read.
    const reachable = config !== undefined && (await healthy(config));
    const daemon = !config
      ? "not checked (proxy setup is missing)"
      : reachable
        ? `matching listener reachable${state === "disabled" ? " (saved config disabled; may be awaiting drain)" : ""}`
        : "not reachable or incompatible";
    const credential = config ? await credentialStatus(config, reachable) : CREDENTIAL_UNCONFIGURED;
    return [
      "Gateway status (read-only)",
      `Selected routing targets: ${scope ?? "global + current project"}`,
      ...routes,
      `Shared proxy configuration (applies to enabled scopes): ${shared}`,
      `How you sign in: ${config ? signInSummary(config) : "not configured"}.`,
      `Workspace sent with your requests: ${config ? workspaceSummary(config) : "not configured"}.`,
      `Shared daemon: ${daemon}.`,
      `Your credential is ${credential}.`,
      "This shows saved settings. Your current Claude session may still be using earlier settings. Configured forwarding mode does not verify actual Anthropic usage, authentication or subscription validity. Other projects may use the shared daemon.",
    ].join("\n");
  } catch (error) {
    throw new SetupError(error instanceof ConfigError ? error.message : STATUS_ERROR);
  }
}

import { endpoints } from "./config.js";

// Diagnostics contain no supplied values (arguments may contain accidental secrets).
export class SetupError extends Error {}
export interface SetupOptions {
  scope: "global" | "project";
  // Explicit setup only: omission selects OAuth-only, never the saved mode.
  useClaudeSubscription: boolean;
  cli?: string;
  profile?: string;
  port?: number;
  apiUrl?: string;
  gatewayUrl?: string;
}
export const COMMAND_GUIDANCE =
  "Use /langsmith-gateway:setup --scope global|project or /langsmith-gateway:disable --scope global|project within Claude Code.";

export function parseEnableArgs(args: string[]): SetupOptions {
  const usage = COMMAND_GUIDANCE;
  if (args[0] !== "--yes") throw new SetupError("Explicit invocation required. " + usage);
  return parseSetupArgs(args.slice(1));
}

// Shared validation for the read-only plan and consented enable.
export function parseSetupArgs(rest: string[]): SetupOptions {
  const usage = COMMAND_GUIDANCE;
  if (
    rest.some(
      (arg) =>
        typeof arg !== "string" ||
        !arg ||
        [...arg].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127),
    )
  )
    throw new SetupError(usage);
  const positional: string[] = [];
  const flags = new Map<string, string>();
  let useClaudeSubscription = false;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--use-claude-subscription") {
      if (useClaudeSubscription) throw new SetupError(usage);
      useClaudeSubscription = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    if (
      !["--scope", "--cli", "--port", "--profile", "--api-url", "--gateway-url"].includes(arg) ||
      flags.has(arg) ||
      !rest[i + 1] ||
      rest[i + 1].startsWith("--")
    )
      throw new SetupError(usage);
    flags.set(arg, rest[++i]);
  }
  if (![0, 3].includes(positional.length) || (positional.length && flags.has("--profile")))
    throw new SetupError(usage);
  const scope = flags.get("--scope");
  if (scope !== "global" && scope !== "project") throw new SetupError(usage);
  const result: SetupOptions = { scope, useClaudeSubscription };
  if (positional.length && (flags.has("--cli") || flags.has("--port"))) throw new SetupError(usage);
  result.cli = flags.get("--cli");
  if (result.cli !== undefined && !result.cli.startsWith("/")) throw new SetupError(usage);
  if (flags.has("--port")) {
    const port = flags.get("--port")!;
    if (!/^[0-9]{4,5}$/.test(port) || Number(port) < 1024 || Number(port) > 65535)
      throw new SetupError(usage);
    result.port = Number(port);
  }
  if (positional.length) {
    [result.cli, result.profile] = positional;
    if (!/^[0-9]{4,5}$/.test(positional[2]) || !result.cli!.startsWith("/"))
      throw new SetupError(usage);
    result.port = Number(positional[2]);
    if (!Number.isInteger(result.port) || result.port < 1024 || result.port > 65535)
      throw new SetupError("Local port must be 1024-65535");
  } else result.profile = flags.get("--profile");
  if (result.profile !== undefined && !/^[a-zA-Z0-9_.-]{1,128}$/.test(result.profile))
    throw new SetupError("Invalid CLI profile name");
  if (flags.has("--api-url") || flags.has("--gateway-url")) {
    try {
      Object.assign(
        result,
        endpoints({ apiUrl: flags.get("--api-url"), gatewayUrl: flags.get("--gateway-url") }),
      );
    } catch {
      throw new SetupError(
        "Supply both --api-url and --gateway-url as HTTPS public DNS origins (ports 1-65535), without credentials, paths, query or fragment. No implicit production endpoint.",
      );
    }
  }
  return result;
}

export function parseDisableArgs(args: string[]): SetupOptions {
  if (args.length !== 3 || args[0] !== "--yes" || args[1] !== "--scope")
    throw new SetupError(COMMAND_GUIDANCE);
  return parseSetupArgs(args.slice(1));
}

// No shell, expansion, quoting interpretation or command-markup parsing. Only
// exact standalone slash commands are authorized; malformed arguments still block.
export function parseGatewayCommand(
  prompt: unknown,
): { command: "setup" | "disable"; args: string[] } | undefined {
  if (typeof prompt !== "string") return;
  const match = /^\/langsmith-gateway:(setup|disable)(?=\s|$)/.exec(prompt);
  if (!match) return;
  const rest = prompt.slice(match[0].length);
  // Control bytes must never be normalized into an authorized invocation.
  // eslint-disable-next-line no-control-regex
  if (/[\r\n\x00-\x1f'"`$;&|<>\\]/.test(rest)) throw new SetupError(COMMAND_GUIDANCE);
  const args = rest.trim() ? rest.trim().split(/ +/) : [];
  const command = match[1] as "setup" | "disable";
  if (command === "setup") parseSetupArgs(args);
  else parseDisableArgs(["--yes", ...args]);
  return { command, args };
}

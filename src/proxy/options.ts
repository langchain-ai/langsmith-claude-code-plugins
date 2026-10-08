import { endpoints } from "./config.js";
import {
  isIdentityTokenCommand,
  isIdentityTokenTtlMs,
  isWorkspaceId,
} from "./config-validation.js";
import {
  COMMAND_GUIDANCE,
  PROFILE_NAME,
  SETUP_FLAGS,
  STATUS_GUIDANCE,
  TTL_RANGE_GUIDANCE,
  TTL_SECONDS,
} from "./proxy-constants.js";
import type { SetupOptions } from "./proxy-models.js";

// Diagnostics contain no supplied values (arguments may contain accidental secrets).
export class SetupError extends Error {}

function identityTokenTtl(seconds: string | undefined): number | undefined {
  if (seconds === undefined) return undefined;
  const ms = Number(seconds) * 1000;
  if (!TTL_SECONDS.test(seconds) || !isIdentityTokenTtlMs(ms))
    throw new SetupError(TTL_RANGE_GUIDANCE);
  return ms;
}

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
  const flags = new Map<string, string>();
  let useClaudeSubscription = false;
  let command: string | undefined;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--use-claude-subscription") {
      if (useClaudeSubscription) throw new SetupError(usage);
      useClaudeSubscription = true;
      continue;
    }
    if (arg === "--identity-token-command") {
      const tail = rest.slice(i + 1).join(" ");
      if (!isIdentityTokenCommand(tail)) throw new SetupError(usage);
      command = tail;
      break;
    }
    if (
      !SETUP_FLAGS.includes(arg) ||
      flags.has(arg) ||
      !rest[i + 1] ||
      rest[i + 1].startsWith("--")
    )
      throw new SetupError(usage);
    flags.set(arg, rest[++i]);
  }
  const scope = flags.get("--scope");
  if (scope !== "global" && scope !== "project") throw new SetupError(usage);
  const result: SetupOptions = { scope, useClaudeSubscription };
  result.cli = flags.get("--cli");
  if (result.cli !== undefined && !result.cli.startsWith("/")) throw new SetupError(usage);
  if (flags.has("--port")) {
    const port = flags.get("--port")!;
    if (!/^[0-9]{4,5}$/.test(port) || Number(port) < 1024 || Number(port) > 65535)
      throw new SetupError(usage);
    result.port = Number(port);
  }
  result.profile = flags.get("--profile");
  if (result.profile !== undefined && !PROFILE_NAME.test(result.profile))
    throw new SetupError("Invalid CLI profile name");
  result.identityTokenCommand = command;
  result.identityTokenTtlMs = identityTokenTtl(flags.get("--identity-token-ttl"));
  result.workspaceId = flags.get("--workspace-id");
  if (result.workspaceId !== undefined && !isWorkspaceId(result.workspaceId))
    throw new SetupError("Workspace id must be a UUID");
  if (command !== undefined && result.workspaceId === undefined)
    throw new SetupError("An identity token command also requires --workspace-id");
  if (command === undefined && result.identityTokenTtlMs !== undefined)
    throw new SetupError("Identity token cache seconds apply only with an identity token command");
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
  if (args.length !== 2 || args[0] !== "--scope") throw new SetupError(COMMAND_GUIDANCE);
  return parseSetupArgs(args);
}

export function parseStatusArgs(args: string[]): { scope?: SetupOptions["scope"] } {
  if (args.length === 0) return {};
  if (args.length === 2 && args[0] === "--scope" && (args[1] === "global" || args[1] === "project"))
    return { scope: args[1] };
  throw new SetupError(STATUS_GUIDANCE);
}

export function parseGatewayCommand(
  prompt: unknown,
): { command: "setup" | "disable" | "status"; args: string[] } | undefined {
  if (typeof prompt !== "string") return;
  const match = /^\/langsmith-gateway:(setup|disable|status)(?=\s|$)/.exec(prompt);
  if (!match) return;
  const rest = prompt.slice(match[0].length);
  // eslint-disable-next-line no-control-regex
  if (/[\r\n\x00-\x1f'"`$;&|<>\\]/.test(rest))
    throw new SetupError(match[1] === "status" ? STATUS_GUIDANCE : COMMAND_GUIDANCE);
  const args = rest.trim() ? rest.trim().split(/ +/) : [];
  const command = match[1] as "setup" | "disable" | "status";
  if (command === "setup") parseSetupArgs(args);
  else if (command === "disable") parseDisableArgs(args);
  else parseStatusArgs(args);
  return { command, args };
}

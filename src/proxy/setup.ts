import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { atomic, directories, jsonText, snapshot } from "./files.js";
import { configDir, endpoints, privatePath, userHome } from "./config.js";
import {
  absent,
  isIdentityTokenCommand,
  isIdentityTokenTtlMs,
  isPort,
  isProfile,
  isWorkspaceId,
} from "./config-validation.js";
import type { CredentialIdentity, ProxyConfig } from "./proxy-models.js";

export function createConfig(
  profile: string | undefined,
  port: number,
  home = userHome(),
  urls: { apiUrl?: string; gatewayUrl?: string } = {},
  useClaudeSubscription = false,
  credentials: CredentialIdentity = {},
): void {
  const valid =
    typeof useClaudeSubscription === "boolean" &&
    absent(profile, isProfile) &&
    isPort(port) &&
    absent(credentials.identityTokenCommand, isIdentityTokenCommand) &&
    absent(credentials.identityTokenTtlMs, isIdentityTokenTtlMs) &&
    absent(credentials.workspaceId, isWorkspaceId);
  if (!valid) throw new Error("Invalid setup arguments");
  const selected = endpoints(urls);
  directories(home, true);
  const dir = configDir(home);
  try {
    mkdirSync(dir, { mode: 0o700 });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
  }
  privatePath(dir, true);
  const config: ProxyConfig = {
    enabled: true,
    useClaudeSubscription,
    ...selected,
    ...credentials,
    profile,
    port,
    secret: randomBytes(32).toString("hex"),
  };
  const path = join(dir, "config.json");
  if (snapshot(path, true)) throw new Error("Proxy config already exists");
  atomic(path, jsonText(config), undefined);
}

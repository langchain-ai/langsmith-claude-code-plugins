import { constants, accessSync, mkdirSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { randomBytes } from "node:crypto";
import { atomic, directories, jsonText, snapshot } from "./files.js";
import { configDir, endpoints, privatePath, userHome, type ProxyConfig } from "./config.js";

export function validateCLI(cli: string): string {
  if (!isAbsolute(cli)) throw new Error("CLI path must be absolute");
  cli = realpathSync(cli);
  const stat = statSync(cli);
  if (!stat.isFile() || stat.mode & 0o022 || (stat.uid !== 0 && stat.uid !== process.getuid?.()))
    throw new Error("Unsafe CLI executable");
  accessSync(cli, constants.X_OK);
  return cli;
}

// Internal config creation for consented enable; not a runtime subcommand.
export function createConfig(
  cli: string,
  profile: string | undefined,
  port: number,
  home = userHome(),
  urls: { apiUrl?: string; gatewayUrl?: string } = {},
  useClaudeSubscription = false,
): void {
  if (
    typeof useClaudeSubscription !== "boolean" ||
    !isAbsolute(cli) ||
    (profile !== undefined &&
      (typeof profile !== "string" || !/^[a-zA-Z0-9_.-]{1,128}$/.test(profile))) ||
    !Number.isInteger(port) ||
    port < 1024 ||
    port > 65535
  )
    throw new Error("Invalid setup arguments");
  const selected = endpoints(urls);
  cli = validateCLI(cli);
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
    cli,
    profile,
    port,
    secret: randomBytes(32).toString("hex"),
  };
  const path = join(dir, "config.json");
  if (snapshot(path, true)) throw new Error("Proxy config already exists");
  atomic(path, jsonText(config), undefined);
}

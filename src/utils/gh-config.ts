import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  GH_CONFIG_DIR_ENV,
  GH_DEFAULT_CONFIG_DIR,
  GH_HOSTS_FILE,
  GH_HOSTS_HOST_LINE,
  GH_HOSTS_USER_LINE,
  GITHUB_DOT_COM,
} from "../constants.js";

export function githubLoginFromHostsFile(): string | undefined {
  try {
    const configured = process.env[GH_CONFIG_DIR_ENV]?.trim();
    const dir = configured || join(homedir(), ...GH_DEFAULT_CONFIG_DIR);
    const logins = new Map<string, string>();
    let host: string | undefined;
    for (const line of readFileSync(join(dir, GH_HOSTS_FILE), "utf-8").split(/\r?\n/)) {
      const hostLine = GH_HOSTS_HOST_LINE.exec(line);
      if (hostLine) {
        host = hostLine[1];
        continue;
      }
      if (!host) continue;
      const userLine = GH_HOSTS_USER_LINE.exec(line);
      if (userLine && !logins.has(host)) logins.set(host, userLine[1]);
    }
    return logins.get(GITHUB_DOT_COM) ?? logins.values().next().value;
  } catch {
    return undefined;
  }
}

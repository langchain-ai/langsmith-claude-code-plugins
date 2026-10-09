import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  GH_LOGIN_ARGUMENTS,
  GH_LOGIN_COMMAND,
  GH_LOGIN_MARKER_FILE,
  GH_LOGIN_PATTERN,
  GH_LOGIN_RETRY_AFTER_MS,
  GH_LOGIN_TIMEOUT_MS,
  JQ_NULL_OUTPUT,
  STATE_FILE_DEFAULT,
} from "../constants.js";
import type { GhLoginMarker } from "../types.js";

function isLogin(printed: string): boolean {
  return printed !== JQ_NULL_OUTPUT && GH_LOGIN_PATTERN.test(printed);
}

function markerPath(): string {
  const stateFile = process.env.STATE_FILE ?? join(homedir(), ...STATE_FILE_DEFAULT);
  return join(dirname(stateFile), GH_LOGIN_MARKER_FILE);
}

function failedRecently(): boolean {
  try {
    const marker = JSON.parse(readFileSync(markerPath(), "utf-8")) as GhLoginMarker;
    const failed = new Date(marker.failed).getTime();
    const since = Date.now() - failed;
    return since >= 0 && since < GH_LOGIN_RETRY_AFTER_MS;
  } catch {
    return false;
  }
}

function recordFailure(): void {
  try {
    const path = markerPath();
    mkdirSync(dirname(path), { recursive: true });
    const partial = `${path}.${process.pid}`;
    const marker: GhLoginMarker = { failed: new Date().toISOString() };
    writeFileSync(partial, JSON.stringify(marker));
    renameSync(partial, path);
  } catch {}
}

let alreadyTried = false;
let login: string | undefined;

export function githubLogin(): string | undefined {
  if (alreadyTried) return login;
  alreadyTried = true;
  if (failedRecently()) return undefined;
  try {
    const printed = execFileSync(GH_LOGIN_COMMAND, GH_LOGIN_ARGUMENTS, {
      encoding: "utf-8",
      timeout: GH_LOGIN_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (isLogin(printed)) login = printed;
  } catch {}
  if (login === undefined) recordFailure();
  return login;
}

export function clearGithubLoginCache(): void {
  alreadyTried = false;
  login = undefined;
}

import { appendFileSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";
import { GATEWAY_LOG_FILE, MAX_GATEWAY_LOG_BYTES } from "./proxy-constants.js";

let path: string | undefined;

export function startLog(directory: string): void {
  path = join(directory, GATEWAY_LOG_FILE);
}

export function logFailure(message: string): void {
  if (path === undefined) return;
  try {
    if ((statSync(path, { throwIfNoEntry: false })?.size ?? 0) >= MAX_GATEWAY_LOG_BYTES)
      renameSync(path, `${path}.1`);
    appendFileSync(path, `${new Date().toISOString()} ${message}\n`, { mode: 0o600 });
  } catch {
    // Logging must never break a request.
  }
}

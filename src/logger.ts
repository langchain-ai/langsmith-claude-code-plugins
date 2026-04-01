/**
 * Simple file logger.
 */

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const LOG_FILE =
  process.env.CC_LANGSMITH_LOG_FILE ?? `${process.env.HOME ?? ""}/.claude/state/hook.log`;

let debugEnabled = false;

export function initLogger(debug: boolean): void {
  debugEnabled = debug;
  mkdirSync(dirname(LOG_FILE), { recursive: true });
}

function write(level: string, message: string): void {
  const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
  const line = `${timestamp} [${level}] ${message}\n`;
  try {
    appendFileSync(LOG_FILE, line);
  } catch {
    // Best-effort logging — don't crash the hook.
  }
}

export function log(message: string): void {
  write("INFO", message);
}

export function warn(message: string): void {
  write("WARN", message);
}

export function error(message: string): void {
  write("ERROR", message);
}

export function debug(message: string): void {
  if (debugEnabled) {
    write("DEBUG", message);
  }
}

/**
 * Simple file logger with size-based rotation.
 */

import { appendFileSync, mkdirSync, statSync, renameSync } from "node:fs";
import { dirname } from "node:path";

const MAX_LOG_BYTES = 5 * 1024 * 1024; // 5 MB

const LOG_FILE =
  process.env.CC_LANGSMITH_LOG_FILE ?? `${process.env.HOME ?? ""}/.claude/state/hook.log`;

let debugEnabled = false;

export function initLogger(debug: boolean): void {
  debugEnabled = debug;
  mkdirSync(dirname(LOG_FILE), { recursive: true });
}

function rotateIfNeeded(): void {
  try {
    if (statSync(LOG_FILE).size >= MAX_LOG_BYTES) {
      renameSync(LOG_FILE, `${LOG_FILE}.1`);
    }
  } catch {
    // File doesn't exist yet or stat failed — nothing to rotate.
  }
}

function write(level: string, message: string): void {
  const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
  const line = `${timestamp} [${level}] ${message}\n`;
  try {
    rotateIfNeeded();
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

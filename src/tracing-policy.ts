import { randomUUID } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { mkdir, open, rename, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import type { TracingMode } from "./types.js";

interface TracingPolicy {
  default: TracingMode;
  threads: Record<string, TracingMode>;
}

function isMode(value: unknown): value is TracingMode {
  return value === "full" || value === "metadata";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasCode(error: unknown, code: string): boolean {
  return isObject(error) && error.code === code;
}

/** Missing policy is opt-out (full); every other read failure is fail-closed. */
function readPolicy(path: string): TracingPolicy {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    if (hasCode(error, "ENOENT")) {
      // A dangling symlink is an unreadable policy, not an absent preference.
      try {
        lstatSync(path);
      } catch (statError) {
        if (hasCode(statError, "ENOENT")) return { default: "full", threads: {} };
        throw statError;
      }
    }
    throw error;
  }
  const value: unknown = JSON.parse(raw);
  if (
    !isObject(value) ||
    !isMode(value.default) ||
    !isObject(value.threads) ||
    Object.values(value.threads).some((mode) => !isMode(mode)) ||
    Object.keys(value).some((key) => key !== "default" && key !== "threads")
  ) {
    throw new Error("Invalid tracing preference format");
  }
  return value as unknown as TracingPolicy;
}

export function getThreadTracingMode(stateFilePath: string, sessionId: string): TracingMode {
  try {
    const policy = readPolicy(`${stateFilePath}.privacy.json`);
    return Object.hasOwn(policy.threads, sessionId) ? policy.threads[sessionId] : policy.default;
  } catch {
    return "metadata";
  }
}

/** Exact, argument-free commands only; ordinary prompts are never interpreted. */
export function parseTracingCommand(prompt: string): "mute" | "unmute" | undefined {
  if (prompt === "/langsmith-tracing:mute") return "mute";
  if (prompt === "/langsmith-tracing:unmute") return "unmute";
  return undefined;
}

/**
 * Independent of tracing state and its pruning. Writers serialize through an
 * exclusive lock; no age/PID-based stealing (even a slow live writer is safe).
 * A crashed writer's lock requires explicit removal after confirming it is idle.
 * Rename commits the effective preference. Later durability/cleanup failures are
 * returned as local warnings, not thrown as if the preference were unchanged.
 */
export async function setThreadTracingMode(
  stateFilePath: string,
  sessionId: string,
  mode: TracingMode,
): Promise<{ warning?: string }> {
  if (typeof sessionId !== "string" || !sessionId || !isMode(mode)) {
    throw new Error("A nonempty session ID and a full/metadata tracing mode are required");
  }
  const path = `${stateFilePath}.privacy.json`;
  const lockPath = `${path}.lock`;
  await mkdir(dirname(path), { recursive: true });
  const deadline = performance.now() + 2000;
  let lock;
  while (!lock) {
    try {
      lock = await open(lockPath, "wx", 0o600);
    } catch (error) {
      if (!hasCode(error, "EEXIST")) throw error;
      if (performance.now() >= deadline) {
        throw new Error(
          `Timed out waiting for tracing preference lock ${lockPath}. Retry; if it persists, remove the lock only after confirming no preference writer is running.`,
        );
      }
      await delay(20);
    }
  }

  const warnings: string[] = [];
  // Cleanup attempts are independent and must never replace a precommit error.
  // These filesystem details are for local command output only, never tracing.
  async function bestEffort(action: () => Promise<unknown>, message: string): Promise<void> {
    try {
      await action();
    } catch (error) {
      warnings.push(`${message}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  let tempPath: string | undefined;
  try {
    // For manual diagnosis only; never used to decide to steal a lock.
    await lock.writeFile(`${process.pid}\n`);
    let policy: TracingPolicy;
    try {
      policy = readPolicy(path);
    } catch (error) {
      throw new Error(
        `Cannot read tracing preferences at ${path}. Refusing to overwrite them; repair the file or its permissions before retrying. No preferences were changed.`,
        { cause: error },
      );
    }
    // Computed property + spread handle session IDs such as "__proto__" safely.
    policy.threads = { ...policy.threads, [sessionId]: mode };
    tempPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
    const temp = await open(tempPath, "wx", 0o600);
    try {
      await temp.writeFile(`${JSON.stringify(policy)}\n`, "utf8");
      await temp.sync();
    } catch (error) {
      await bestEffort(() => temp.close(), "Temporary file close failed");
      throw error;
    }
    await temp.close();
    await rename(tempPath, path);
    // Commit point: readers now see the requested mode, even if fsync fails.
    tempPath = undefined;
    await bestEffort(async () => {
      const directory = await open(dirname(path), "r");
      try {
        await directory.sync();
      } finally {
        await bestEffort(() => directory.close(), "Directory close cleanup failed");
      }
    }, "Preference is effective, but crash durability could not be confirmed; retry saving");
  } finally {
    if (tempPath) {
      await bestEffort(() => unlink(tempPath!), "Temporary file cleanup failed");
    }
    await bestEffort(() => lock.close(), "Preference lock close cleanup failed");
    await bestEffort(
      () => unlink(lockPath),
      `Preference lock cleanup failed at ${lockPath}. Before retrying, remove the lock only after confirming no preference writer is running`,
    );
  }
  return warnings.length ? { warning: warnings.join("; ") } : {};
}

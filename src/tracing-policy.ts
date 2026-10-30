import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { readPolicyFile, updatePolicyFile } from "@langchain/plugins-base/plugin";
import type { PolicyFileOptions } from "@langchain/plugins-base/plugin";
import { SETUP_COMMAND_PATTERN } from "./constants.js";
import type { TracingCommand, TracingMode, TracingPolicy } from "./types.js";
import { isRecord } from "./utils/records.js";

function isMode(value: unknown): value is TracingMode {
  return value === "full" || value === "metadata";
}

function parsePolicy(value: unknown): TracingPolicy {
  if (
    !isRecord(value) ||
    !isRecord(value.threads) ||
    Object.values(value.threads).some((mode) => !isMode(mode)) ||
    Object.keys(value).some((key) => key !== "threads")
  ) {
    throw new Error("Invalid tracing preference format");
  }
  return value as unknown as TracingPolicy;
}

const POLICY_FILE: PolicyFileOptions<TracingPolicy> = {
  empty: () => ({ threads: {} }),
  parse: parsePolicy,
};

export function tracingPolicyPath(stateFilePath: string): string {
  return `${stateFilePath.replace(/\.json$/, "")}.privacy.json`;
}

export function getThreadTracingMode(
  stateFilePath: string,
  sessionId: string,
  defaultMuted = false,
): TracingMode {
  try {
    const policy = readPolicyFile(tracingPolicyPath(stateFilePath), POLICY_FILE);
    if (Object.hasOwn(policy.threads, sessionId)) return policy.threads[sessionId];
    return defaultMuted ? "metadata" : "full";
  } catch {
    return "metadata";
  }
}

/** Exact commands only, and only setup takes arguments; ordinary prompts are never interpreted. */
export function parseTracingCommand(prompt: string): TracingCommand | undefined {
  if (prompt === "/langsmith-tracing:mute") return "mute";
  if (prompt === "/langsmith-tracing:unmute") return "unmute";
  if (prompt === "/langsmith-tracing:trace") return "trace";
  if (SETUP_COMMAND_PATTERN.test(prompt)) return "setup";
  return undefined;
}

export async function setThreadTracingMode(
  stateFilePath: string,
  sessionId: string,
  mode: TracingMode,
): Promise<{ warning?: string }> {
  if (typeof sessionId !== "string" || !sessionId || !isMode(mode)) {
    throw new Error("A nonempty session ID and a full/metadata tracing mode are required");
  }
  const path = tracingPolicyPath(stateFilePath);
  await mkdir(dirname(path), { recursive: true });
  return updatePolicyFile(path, POLICY_FILE, (policy) => {
    // Computed property + spread handle session IDs such as "__proto__" safely.
    policy.threads = { ...policy.threads, [sessionId]: mode };
  });
}

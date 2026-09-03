import { RunTree, type RunTreeConfig } from "langsmith";
import type { TracingMode } from "./types.js";

const METADATA_KEYS = new Set([
  "thread_id",
  "turn_number",
  "turn_id",
  "status",
  "ls_tracing_mode",
  "ls_agent_purpose",
  "ls_agent_type",
  "ls_agent_runtime",
  "ls_agent_runtime_version",
  "ls_integration",
  "ls_integration_version",
  "ls_trace_schema_version",
  "ls_model_name",
  "ls_tool_name",
  "usage_metadata",
  "ls_subagent_id",
  "ls_subagent_type",
]);

export function metadataForMode(
  metadata: Record<string, unknown> | undefined,
  mode: TracingMode = "full",
  status?: string,
): Record<string, unknown> | undefined {
  if (mode === "full") return metadata;
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (METADATA_KEYS.has(key)) safe[key] = value;
  }
  safe.status = status ?? "running";
  safe.ls_tracing_mode = "metadata";
  return safe;
}

function sanitizeReplica(replica: unknown, mode: TracingMode): unknown {
  if (mode === "full" || !replica || typeof replica !== "object" || Array.isArray(replica)) {
    return replica;
  }
  const { updates: _updates, ...safe } = replica as Record<string, unknown>;
  return safe;
}

export function runConfigForMode<T extends Record<string, unknown>>(
  config: T,
  mode: TracingMode = "full",
): T {
  if (mode === "full") return config;
  const status = config.error ? "error" : config.end_time ? "completed" : "running";
  const extra = config.extra as { metadata?: Record<string, unknown> } | undefined;
  const safe: Record<string, unknown> = {};
  for (const key of [
    "client",
    "id",
    "name",
    "run_type",
    "project_name",
    "start_time",
    "end_time",
    "parent_run_id",
    "trace_id",
    "dotted_order",
  ]) {
    if (key in config && config[key] !== undefined) safe[key] = config[key];
  }
  if (Array.isArray(config.replicas)) {
    safe.replicas = config.replicas.map((replica) => sanitizeReplica(replica, mode));
  }
  safe.inputs = {};
  safe.outputs = {};
  safe.extra = { metadata: metadataForMode(extra?.metadata, mode, status) };
  return safe as T;
}

export function createRunTree(config: RunTreeConfig, mode: TracingMode = "full"): RunTree {
  return new RunTree(runConfigForMode(config as RunTreeConfig & Record<string, unknown>, mode));
}

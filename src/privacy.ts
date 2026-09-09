import { RunTree, type RunTreeConfig } from "langsmith";
import type { TracingMode } from "./types.js";
import { trustedCodingAgentMetadata } from "./metadata.js";

export const MUTED_TRACE_CONTENT =
  "[LangSmith system notice: content omitted because tracing is muted.]";

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

/** Preserve all usage fields, including provider-specific and nested values. */
function usageForMetadata(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

// Also used at the wire boundary, on CURRENT (possibly anonymized) metadata.
// It must not retrieve provenance there and restore pre-anonymization values.
function projectMetadata(
  metadata: Record<string, unknown> | undefined,
  status?: string,
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (!METADATA_KEYS.has(key)) continue;
    if (key === "usage_metadata") {
      const usage = usageForMetadata(value);
      if (usage) safe[key] = usage;
    } else if (key === "turn_number") {
      if (typeof value === "number" && Number.isSafeInteger(value) && value >= 1) safe[key] = value;
    } else if (typeof value === "string" && value.length) {
      safe[key] = value;
    }
  }
  safe.status = status === "error" || status === "completed" ? status : "running";
  safe.ls_tracing_mode = "metadata";
  return safe;
}

export function metadataForMode(
  metadata: Record<string, unknown> | undefined,
  mode: TracingMode = "full",
  status?: string,
): Record<string, unknown> | undefined {
  if (mode === "full") return metadata;
  // Builder provenance wins over ALL merged fields. Plain direct RunTree
  // configs remain supported as explicitly supplied metadata, schema-filtered
  // below; plugin callsites must use the builder, not clone its merged result.
  return projectMetadata(trustedCodingAgentMetadata(metadata) ?? metadata, status);
}

function sanitizeReplica(replica: unknown, mode: TracingMode): unknown {
  if (mode === "full" || !replica || typeof replica !== "object") return replica;
  // The SDK also accepts [projectName, updates] tuples.
  if (Array.isArray(replica)) return { projectName: replica[0] };
  const { updates: _updates, ...safe } = replica as Record<string, unknown>;
  return safe;
}

export function runConfigForMode<T extends Record<string, unknown>>(
  config: T,
  mode: TracingMode = "full",
): T {
  if (mode === "full") return config;
  const status = config.error ? "error" : config.end_time != null ? "completed" : "running";
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
  safe.inputs = { messages: [{ role: "user", content: MUTED_TRACE_CONTENT }] };
  safe.outputs = { messages: [{ role: "assistant", content: MUTED_TRACE_CONTENT }] };
  safe.extra = {
    metadata: metadataForMode(extra?.metadata, mode, status),
    // RunTree and Client both enrich extra AFTER construction. A client-level
    // omitTracedRuntimeInfo flag alone does not suppress RunTree's additions,
    // and replicas may use their own clients. Keep this method enumerable so it
    // survives SDK object spreads and filters at the REST serialization boundary
    // (including multipart .extra parts). Wire-payload tests guard this SDK behavior.
    toJSON(this: { metadata?: Record<string, unknown> }) {
      return {
        // Read the current metadata, not the constructor's copy: the client may
        // have anonymized allowlisted values, which must not be restored here.
        metadata: projectMetadata(
          this.metadata,
          typeof this.metadata?.status === "string" ? this.metadata.status : status,
        ),
      };
    },
  };
  return safe as T;
}

/**
 * Payload boundary only: callers retain control of posting, patching, timing and
 * parentage. Reconstruct updates through this wrapper too; do not mutate a muted
 * RunTree with raw payloads after construction. No shared client or mode state is
 * changed, so full and metadata runs can safely share a client.
 */
export function createRunTree(config: RunTreeConfig, mode: TracingMode = "full"): RunTree {
  const run = new RunTree(
    runConfigForMode(config as RunTreeConfig & Record<string, unknown>, mode),
  );
  // The constructor can resolve additional replicas from the SDK environment.
  // Filter their patch overrides too, without changing destination or auth.
  if (mode === "metadata" && run.replicas) {
    run.replicas = run.replicas.map((replica) =>
      sanitizeReplica(replica, mode),
    ) as typeof run.replicas;
  }
  if (typeof run.patchRun === "function") {
    const patchRun = run.patchRun.bind(run);
    run.patchRun = (options) => patchRun({ excludeInputs: false, ...options });
  }
  return run;
}

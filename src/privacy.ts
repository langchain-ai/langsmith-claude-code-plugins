import { RunTree, type RunTreeConfig } from "langsmith";
import {
  metadataForMode as sharedMetadataForMode,
  projectCodingAgentMetadata,
} from "@langchain/plugins-base/metadata";
import { CLAUDE_CODE_INTEGRATION } from "./constants.js";
import type { TracingMode } from "./types.js";

export const MUTED_TRACE_CONTENT =
  "[LangSmith system notice: content omitted because tracing is muted.]";

export function metadataForMode(
  metadata: Record<string, unknown> | undefined,
  mode: TracingMode = "full",
  status?: string,
): Record<string, unknown> | undefined {
  return sharedMetadataForMode(metadata, CLAUDE_CODE_INTEGRATION, mode, status);
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
        metadata: projectCodingAgentMetadata(
          this.metadata,
          CLAUDE_CODE_INTEGRATION,
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

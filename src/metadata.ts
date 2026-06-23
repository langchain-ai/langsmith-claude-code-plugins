/**
 * coding-agent-v1 trace metadata contract. One shared helper, stamped on every
 * run (children don't inherit parent `extra.metadata`). See validator.json.
 */

// ─── Frozen literals (identity block) ────────────────────────────────────────

export const LS_AGENT_KIND = "coding_agent";
export const LS_INTEGRATION = "claude-code";
export const LS_AGENT_RUNTIME = "Claude Code";
export const LS_TRACE_SCHEMA_VERSION = "coding-agent-v1";

// ─── Helper input ─────────────────────────────────────────────────────────────

export interface CodingAgentMetadataOptions {
  /** Stable conversation/session id → `thread_id`. Required on every run. */
  sessionId: string;

  /** Static config base + user env metadata. Spread LAST so user keys win. */
  base?: Record<string, unknown>;

  /** Per-turn id (`turn_id`) — Claude Code transcript `promptId`. */
  turnId?: string;
  /** 1-based turn index (`turn_number`). */
  turnNumber?: number;
  /** Claude Code CLI version (`ls_agent_runtime_version`), from transcript `version`. */
  runtimeVersion?: string;

  /** Permission mode for the turn (`approval_policy`). Root + interrupted only. */
  approvalPolicy?: string;

  /** DEPRECATED `ls_agent_type` compat alias. Distinct from `ls_subagent_type`. */
  legacyRole?: "root" | "subagent";

  /** Subagent identity (subagent runs only) → `ls_subagent_id` / `ls_subagent_type`. */
  subagentId?: string;
  subagentType?: string;

  /** Native tool name (tool runs). Emits `ls_tool_name` only when it differs from `runName`. */
  toolName?: string;
  /** Run `name` used to decide whether `ls_tool_name` is needed. */
  runName?: string;

  /** Preserved run-type keys (ls_provider, usage_metadata, …) and compat aliases. */
  runSpecific?: Record<string, unknown>;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Build the metadata for one run. Merge order (later wins): identity → dynamic
 * → runSpecific → base. Unknown values are omitted (never null/empty).
 */
export function codingAgentMetadata(
  opts: CodingAgentMetadataOptions,
): Record<string, unknown> {
  const {
    sessionId,
    base,
    turnId,
    turnNumber,
    runtimeVersion,
    approvalPolicy,
    legacyRole,
    subagentId,
    subagentType,
    toolName,
    runName,
    runSpecific,
  } = opts;

  const meta: Record<string, unknown> = {
    // Identity & grouping — always present.
    ls_agent_kind: LS_AGENT_KIND,
    ls_integration: LS_INTEGRATION,
    ls_agent_runtime: LS_AGENT_RUNTIME,
    ls_trace_schema_version: LS_TRACE_SCHEMA_VERSION,
    thread_id: sessionId,
  };

  // Turn — emit whichever is known (at least one required where turns exist).
  if (turnId) meta.turn_id = turnId;
  if (typeof turnNumber === "number") meta.turn_number = turnNumber;

  // Versions — runtime (CLI) version where known. Integration version lives in `base`.
  if (runtimeVersion) meta.ls_agent_runtime_version = runtimeVersion;

  // Approval policy — root + interrupted turns only.
  if (approvalPolicy) meta.approval_policy = approvalPolicy;

  // DEPRECATED compat alias for the old root/subagent role marker.
  if (legacyRole) meta.ls_agent_type = legacyRole;

  // Subagent identity (subagent runs only).
  if (subagentId) {
    meta.ls_subagent_id = subagentId;
    meta.agent_id = subagentId; // DEPRECATED compat alias.
  }
  if (subagentType) {
    meta.ls_subagent_type = subagentType;
    meta.agent_type = subagentType; // DEPRECATED compat alias.
  }

  // Tool runs: ls_tool_name only when the native name differs from the run name.
  if (toolName) {
    meta.tool_name = toolName; // DEPRECATED compat alias.
    if (runName && toolName !== runName) meta.ls_tool_name = toolName;
  }

  return {
    ...meta,
    ...runSpecific,
    ...base,
  };
}

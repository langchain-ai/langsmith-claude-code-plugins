/**
 * coding-agent-v1 trace metadata contract. One shared helper, stamped on every
 * run (children don't inherit parent `extra.metadata`). See validator.json.
 */

// Same build-time source as config.ts, read independently of its custom base.
// Keep this helper independent of config I/O (and hook configuration mocks).
declare const __LS_INTEGRATION_VERSION__: string;
const TRUSTED_INTEGRATION_VERSION =
  typeof __LS_INTEGRATION_VERSION__ !== "undefined"
    ? __LS_INTEGRATION_VERSION__
    : process.env.CC_LANGSMITH_INTEGRATION_VERSION || undefined;

// Private, non-serializable provenance: custom base/runSpecific values never
// become trusted merely by colliding with an allowed metadata key. Pass the
// builder result directly to privacy helpers; spreading/JSON-cloning metadata
// itself loses provenance (spreading the containing run config is fine).
const TRUSTED_METADATA = Symbol("coding-agent trusted metadata");

export function trustedCodingAgentMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  return (metadata as { [TRUSTED_METADATA]?: Record<string, unknown> } | undefined)?.[
    TRUSTED_METADATA
  ];
}

// ─── Frozen literals (identity block) ────────────────────────────────────────

export const LS_AGENT_PURPOSE = "coding";
export const LS_INTEGRATION = "claude-code";
export const LS_AGENT_RUNTIME = "Claude Code";
export const LS_TRACE_SCHEMA_VERSION = "coding-agent-v1";

/** The role a run plays within a coding-agent trace. */
export type LSAgentType = "root" | "subagent" | "middleware" | "compaction";

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

  /** Role of this run within the coding agent trace → `ls_agent_type`. */
  agentType: LSAgentType;

  /** Subagent identity (subagent runs only) → `ls_subagent_id` / `ls_subagent_type`. */
  subagentId?: string;
  subagentType?: string;

  /** Native tool name (tool runs). Emits `ls_tool_name` only when it differs from `runName`. */
  toolName?: string;
  /** Run `name` used to decide whether `ls_tool_name` is needed. */
  runName?: string;

  /** Invoked skill name (Skill tool runs) → `ls_skill_name`, read from the
   * Skill tool's `skill` input arg. */
  skillName?: string;

  /** Plugin-derived model and token counts, before any custom metadata merge.
   * Do not populate these from base/runSpecific or CC_LANGSMITH_METADATA.
   * Values still undergo schema validation in metadata-only mode. */
  modelName?: string;
  usageMetadata?: Record<string, unknown>;

  /** Full-mode run-type keys and compat aliases. Not trusted in metadata mode. */
  runSpecific?: Record<string, unknown>;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Build the metadata for one run. Merge order (later wins): identity → dynamic
 * → runSpecific → base. Unknown values are omitted (never null/empty).
 */

export function codingAgentMetadata(opts: CodingAgentMetadataOptions): Record<string, unknown> {
  const {
    sessionId,
    base,
    turnId,
    turnNumber,
    runtimeVersion,
    approvalPolicy,
    agentType,
    subagentId,
    subagentType,
    toolName,
    runName,
    skillName,
    runSpecific,
  } = opts;

  const meta: Record<string, unknown> = {
    // Identity & grouping — always present.
    ls_agent_purpose: LS_AGENT_PURPOSE,
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

  // Agent role — required on every coding-agent run.
  meta.ls_agent_type = agentType;

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

  // Skill tool runs: surface the invoked skill so usage is queryable via
  // RunQueryStats (group_by metadata path=ls_skill_name).
  if (skillName) meta.ls_skill_name = skillName;

  // Integration version is independently sourced, never recovered from the
  // config's already-merged custom base. Runtime/session/tool identity comes
  // from explicit plugin context above. Project routing is a separate run
  // config field, not custom metadata; user/repository attribution is excluded.
  const trusted = { ...meta };
  if (TRUSTED_INTEGRATION_VERSION) trusted.ls_integration_version = TRUSTED_INTEGRATION_VERSION;
  if (opts.modelName !== undefined) trusted.ls_model_name = opts.modelName;
  if (opts.usageMetadata !== undefined) trusted.usage_metadata = opts.usageMetadata;

  const result = {
    ...meta,
    ...(opts.modelName !== undefined ? { ls_model_name: opts.modelName } : {}),
    ...(opts.usageMetadata !== undefined ? { usage_metadata: opts.usageMetadata } : {}),
    ...runSpecific,
    ...base,
  };
  Object.defineProperty(result, TRUSTED_METADATA, { value: trusted });
  return result;
}

/**
 * Extract the invoked skill name from a tool call, for `ls_skill_name`.
 * Centralizes the one "Skill" special-case so both trace paths stay one-liners.
 * Returns undefined for non-Skill tools; the name lives in the Skill tool's
 * `skill` input arg (`{ skill, args }`).
 */
export function skillNameFromTool(
  toolName: string | undefined,
  toolInput: unknown,
): string | undefined {
  if (toolName !== "Skill") return undefined;
  const skill = (toolInput as { skill?: unknown } | null | undefined)?.skill;
  return typeof skill === "string" ? skill : undefined;
}

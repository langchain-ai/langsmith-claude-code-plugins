import type { LifecycleSnapshotCaptureInput } from "@langchain/plugins-base/tracing/lifecycle";
import type { CodingAgentMetadataOptions } from "@langchain/plugins-base/metadata";
import {
  LEGACY_PROVIDER_METADATA_KEYS,
  LEGACY_RUN_OBJECT_FIELDS,
  LEGACY_RUN_STRING_FIELDS,
  CLAUDE_CODE_INTEGRATION,
} from "../constants.js";
import { runConfigForMode } from "../privacy.js";
import type { QueuedRun, ToolOrigin } from "../types.js";
import {
  integerValue,
  isRecord,
  nonBlank,
  stringValue,
  timestamp,
} from "../utils/validation/values.js";

export function legacyMetadataOptions(
  source: Record<string, unknown> | undefined,
  sessionId: string,
  runName: string,
): CodingAgentMetadataOptions {
  const base = source === undefined ? undefined : { ...source };
  if (base) delete base.cwd;
  const provider = Object.fromEntries(
    LEGACY_PROVIDER_METADATA_KEYS.flatMap((key) =>
      source?.[key] === undefined ? [] : [[key, source[key]]],
    ),
  );
  return {
    integration: CLAUDE_CODE_INTEGRATION,
    threadId: sessionId,
    agentType: "root",
    runType: "tool",
    runName,
    toolName: stringValue(source?.ls_tool_name) ?? stringValue(source?.tool_name) ?? runName,
    ...(stringValue(source?.ls_integration_version) === undefined
      ? {}
      : { integrationVersion: stringValue(source?.ls_integration_version) }),
    ...(stringValue(source?.ls_agent_runtime_version) === undefined
      ? {}
      : { runtimeVersion: stringValue(source?.ls_agent_runtime_version) }),
    ...(stringValue(source?.turn_id) === undefined ? {} : { turnId: stringValue(source?.turn_id) }),
    ...(integerValue(source?.turn_number) === undefined
      ? {}
      : { turnNumber: integerValue(source?.turn_number) }),
    ...(stringValue(source?.approval_policy) === undefined
      ? {}
      : { approvalPolicy: stringValue(source?.approval_policy) }),
    ...(stringValue(source?.ls_subagent_id) === undefined
      ? {}
      : { subagentId: stringValue(source?.ls_subagent_id) }),
    ...(stringValue(source?.ls_subagent_type) === undefined
      ? {}
      : { subagentType: stringValue(source?.ls_subagent_type) }),
    ...(stringValue(source?.ls_skill_name) === undefined
      ? {}
      : { skillName: stringValue(source?.ls_skill_name) }),
    ...(stringValue(source?.ls_model_name) === undefined
      ? {}
      : { modelName: stringValue(source?.ls_model_name) }),
    ...(isRecord(source?.usage_metadata) ? { usageMetadata: source?.usage_metadata } : {}),
    ...(Object.keys(provider).length === 0 ? {} : { providerMetadata: provider }),
    ...(base === undefined ? {} : { base }),
  };
}

export function normalizedRunSnapshot(
  source: Record<string, unknown>,
  tracing: QueuedRun["tracing"],
  sourceAgeStartedAtMs: number,
): LifecycleSnapshotCaptureInput["submission"]["run"] | undefined {
  const safe = runConfigForMode(source, tracing);
  const id = nonBlank(safe.id);
  const name = nonBlank(safe.name);
  const runType = nonBlank(safe.run_type);
  if (!id || !name || runType !== "tool" || !isRecord(safe.inputs)) return undefined;
  const run: Record<string, unknown> = {
    id,
    name,
    run_type: runType,
    inputs: safe.inputs,
    start_time: timestamp(safe.start_time) === undefined ? sourceAgeStartedAtMs : safe.start_time,
  };
  for (const key of LEGACY_RUN_STRING_FIELDS) {
    const value = safe[key];
    if (value === undefined) continue;
    if (key === "end_time") {
      if (timestamp(value) === undefined) return undefined;
    } else if (typeof value !== "string") {
      return undefined;
    }
    run[key] = value;
  }
  for (const key of LEGACY_RUN_OBJECT_FIELDS) {
    const value = safe[key];
    if (value === undefined) continue;
    if (!isRecord(value)) return undefined;
    run[key] = value;
  }
  if (safe.tags !== undefined) {
    if (!Array.isArray(safe.tags) || safe.tags.some((tag) => typeof tag !== "string"))
      return undefined;
    run.tags = safe.tags;
  }
  if (safe.events !== undefined) {
    if (!Array.isArray(safe.events)) return undefined;
    run.events = safe.events;
  }
  return run as unknown as LifecycleSnapshotCaptureInput["submission"]["run"];
}

export function runMetadata(run: Record<string, unknown>): Record<string, unknown> | undefined {
  const extra = run.extra;
  return isRecord(extra) && isRecord(extra.metadata) ? extra.metadata : undefined;
}

export function normalizedToolOrigin(value: ToolOrigin | undefined, cwd: string): ToolOrigin {
  const path = nonBlank(value?.path);
  return { ...(path === undefined ? {} : { path }), cwd, namedAPath: value?.namedAPath === true };
}

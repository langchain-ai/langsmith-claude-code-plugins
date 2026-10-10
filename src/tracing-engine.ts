import { createCaptureStore } from "@langchain/plugins-base/storage/capture";
import { CaptureWakeError, createTracingEngine } from "@langchain/plugins-base/tracing";
import { buildCodingAgentMetadata } from "@langchain/plugins-base/metadata";
import type {
  ReconstructionJob,
  ReconstructionJobInput,
  ReconstructionResult,
} from "@langchain/plugins-base/tracing/reconstruction";
import type { LifecycleCaptureInput } from "@langchain/plugins-base/tracing/lifecycle";
import { createLangSmithUploadWriter } from "@langchain/plugins-base/tracing/upload";
import type {
  LangSmithUploadReplicaConfig,
  LangSmithUploadWriterOptions,
  NormalizedRunSnapshot,
  PreparedRunSubmission,
} from "@langchain/plugins-base/tracing/upload";
import type { CodingAgentMetadataOptions } from "@langchain/plugins-base/metadata";
import { basename, dirname, join } from "node:path";
import {
  CLAUDE_CODE_INTEGRATION,
  CLAUDE_SETTLEMENT_EVENT_KIND,
  CLAUDE_TOOL_RECONSTRUCTION_EVENT_SUFFIX,
  CLAUDE_TOOL_SNAPSHOT_EVENT_SUFFIX,
  PINNED_REPOSITORY_KEYS,
  REPOSITORY_METADATA_KEYS,
  SHARED_ENGINE_STORAGE_DIRECTORY,
  TRUSTED_INTEGRATION_VERSION,
  TURN_RECORD_SUFFIX,
} from "./constants.js";
import type { Config } from "./config.js";
import { queueOrigin } from "./queue.js";
import { runConfigForMode } from "./privacy.js";
import { launchQueueFlusher } from "./utils/detach.js";
import {
  listTurnRecords,
  readTurnRecord,
  recordDelivered,
  recordResolvedMetadata,
  turnRecordDir,
} from "./turn-record.js";
import { loadConfig } from "./config.js";
import type {
  ClaudeToolReconstructionInput,
  ClaudeTracingEngineContext,
} from "./models/tracing-engine.js";
import { warn } from "./logger.js";
import { settledRepositoryMetadata } from "./repo-attribution.js";
import type { TracingMode } from "./types.js";

export function createClaudeTracingSession(
  config: Config,
  cwd: string,
  sessionId: string,
): ClaudeTracingEngineContext | undefined {
  const writerOptions = writerOptionsForConfig(config);
  if (!writerOptions) return undefined;
  const writer = createLangSmithUploadWriter(writerOptions);
  const storageRoot = join(dirname(config.stateFilePath), SHARED_ENGINE_STORAGE_DIRECTORY);
  const captureStore = createCaptureStore(storageRoot);
  const engine = createTracingEngine({
    storageRoot,
    integration: CLAUDE_CODE_INTEGRATION,
    writer: writerOptions,
  });
  const session = engine.forSession({
    sessionId,
    resolveScope: () => {
      const current = loadConfig({ cwd, deferGit: true });
      const options = writerOptionsForConfig(current);
      if (!options)
        return {
          integration: CLAUDE_CODE_INTEGRATION,
          sessionId,
          accountFingerprint: "unavailable",
        };
      try {
        return {
          integration: CLAUDE_CODE_INTEGRATION,
          sessionId,
          accountFingerprint: createLangSmithUploadWriter(options).accountFingerprint,
        };
      } catch {
        return {
          integration: CLAUDE_CODE_INTEGRATION,
          sessionId,
          accountFingerprint: "unavailable",
        };
      }
    },
    scheduleWake: () => launchQueueFlusher(cwd, sessionId),
    reconstruct: reconstructClaudeTool,
  });
  return {
    accountFingerprint: writer.accountFingerprint,
    captureStore,
    destinations: writer.destinations,
    session,
    sessionId,
    storageRoot,
  };
}

export async function captureClaudeRun(
  context: ClaudeTracingEngineContext,
  input: LifecycleCaptureInput,
): Promise<boolean> {
  try {
    const result = await context.session.capture(input);
    return result.status === "published" || result.status === "duplicate";
  } catch (err) {
    if (!(err instanceof CaptureWakeError)) throw err;
    const record = err.captureResult.record;
    if (
      record.integration === CLAUDE_CODE_INTEGRATION &&
      record.sessionId === context.sessionId &&
      record.turnId === input.turnId &&
      record.eventId === input.eventId &&
      record.runId === input.submission.run.id &&
      record.destinationFingerprint === context.accountFingerprint
    ) {
      warn(`Shared capture was saved but its worker wake failed: ${err}`);
      return true;
    }
    throw err;
  }
}

export async function sharedClaudeChildRunIds(
  context: ClaudeTracingEngineContext,
  turnId: string,
  rootRunId: string,
  recordedSharedChildRunIds: readonly string[] = [],
): Promise<string[]> {
  const shared = new Set(recordedSharedChildRunIds.filter((runId) => runId !== rootRunId));
  const lifecycle = await context.captureStore.enumerate(
    CLAUDE_CODE_INTEGRATION,
    context.sessionId,
  );
  for (const { record } of lifecycle) {
    if (
      record.turnId === turnId &&
      record.runId !== rootRunId &&
      record.eventId === record.runId &&
      record.destinationFingerprint === context.accountFingerprint
    ) {
      shared.add(record.runId);
    }
  }
  return [...shared].sort();
}

export async function queueClaudeToolReconstruction(
  context: ClaudeTracingEngineContext,
  input: ClaudeToolReconstructionInput,
): Promise<void> {
  const sourceRef = `${input.run.id}${CLAUDE_TOOL_SNAPSHOT_EVENT_SUFFIX}`;
  const startTime =
    typeof input.run.start_time === "number"
      ? input.run.start_time
      : typeof input.run.start_time === "string"
        ? Date.parse(input.run.start_time)
        : Number.NaN;
  if (!Number.isSafeInteger(startTime) || startTime < 0)
    throw new TypeError(`Completed tool ${input.run.id} has an invalid start time`);
  const submission: PreparedRunSubmission = {
    operation: "post",
    integration: CLAUDE_CODE_INTEGRATION,
    privacyMode: input.privacyMode,
    metadata: {
      integration: CLAUDE_CODE_INTEGRATION,
      ...(TRUSTED_INTEGRATION_VERSION === undefined
        ? {}
        : { integrationVersion: TRUSTED_INTEGRATION_VERSION }),
      threadId: context.sessionId,
      agentType: "root",
      runType: "tool",
      toolName: input.metadata.toolName,
      runName: input.run.name,
      ...(input.metadata.turnNumber === undefined ? {} : { turnNumber: input.metadata.turnNumber }),
      ...(input.metadata.runtimeVersion === undefined
        ? {}
        : { runtimeVersion: input.metadata.runtimeVersion }),
      ...(input.metadata.skillName === undefined ? {} : { skillName: input.metadata.skillName }),
      ...(input.privacyMode === "full" && input.metadata.base !== undefined
        ? { base: { ...input.metadata.base } }
        : {}),
      ...(input.privacyMode === "full" && input.metadata.turnAttributionFallback !== undefined
        ? { runSpecific: { ...input.metadata.turnAttributionFallback } }
        : {}),
    },
    privacyContext: { status: "completed" },
    run: runSnapshotForMode(
      input.run as unknown as Record<string, unknown>,
      input.privacyMode,
    ) as unknown as NormalizedRunSnapshot,
  };
  const reconstruction: ReconstructionJobInput = {
    turnId: input.turnId,
    eventId: `${input.run.id}${CLAUDE_TOOL_RECONSTRUCTION_EVENT_SUFFIX}`,
    sourceRefs: [sourceRef],
    privacyMode: input.privacyMode,
    turnEvidence: input.turnEvidence,
    sourceSnapshots: [
      {
        sourceRef,
        sourceAgeStartedAtMs: startTime,
        submission,
        attributionContext: {
          toolOrigin: {
            ...(input.origin.path === undefined ? {} : { path: input.origin.path }),
            ...(input.origin.cwd === undefined ? {} : { cwd: input.origin.cwd }),
            namedAPath: input.origin.namedAPath,
          },
          ...(input.privacyMode === "full" && input.pinnedRepositoryKeys !== undefined
            ? { pinnedRepositoryKeys: [...input.pinnedRepositoryKeys] }
            : {}),
        },
      },
    ],
  };
  try {
    const queued = await context.session.queueReconstruction(reconstruction);
    if (queued.status !== "published" && queued.status !== "duplicate") {
      throw new Error(`Could not queue completed tool ${input.run.id}: ${queued.status}`);
    }
  } catch (err) {
    if (!isSavedReconstructionWake(err, context, reconstruction)) throw err;
    warn(`Completed tool ${input.run.id} was saved but its worker wake failed: ${err}`);
  }
}

function runSnapshotForMode(
  run: Record<string, unknown>,
  mode: TracingMode,
): Record<string, unknown> {
  const projected = runConfigForMode(run, mode);
  if (mode === "full") return projected;
  const metadata = (projected.extra as { metadata?: Record<string, unknown> } | undefined)
    ?.metadata;
  return { ...projected, extra: metadata === undefined ? {} : { metadata } };
}

export async function acknowledgeClaudeSharedDeliveries(
  context: ClaudeTracingEngineContext,
  config: Config,
  sessionId: string,
): Promise<void> {
  const recordDirectory = turnRecordDir(config.stateFilePath, sessionId);
  const origin = queueOrigin(config);
  for (const path of listTurnRecords(recordDirectory)) {
    const turn = readTurnRecord(path);
    if (!turn || turn.origin !== origin) continue;
    const turnId = turn.root?.run_id ?? basename(path).slice(0, -TURN_RECORD_SUFFIX.length);
    const recordedRuns = [...(turn.root ? [turn.root] : []), ...turn.children];
    const captures = await context.captureStore.enumerate(CLAUDE_CODE_INTEGRATION, sessionId);
    for (const run of recordedRuns) {
      if (!run.shared) continue;
      const matching = captures
        .filter(
          ({ record }) =>
            record.turnId === turnId &&
            record.runId === run.run_id &&
            record.destinationFingerprint === context.accountFingerprint &&
            (record.eventId === run.run_id || record.eventKind === CLAUDE_SETTLEMENT_EVENT_KIND),
        )
        .sort((left, right) => left.capturedAtMs - right.capturedAtMs);
      for (const { record } of matching) {
        const scope = {
          integration: CLAUDE_CODE_INTEGRATION,
          sessionId,
          turnId,
          eventId: record.eventId,
        };
        const outcomes = await Promise.all(
          context.destinations.map((destination) =>
            context.captureStore.readOutcome(scope, destination.id),
          ),
        );
        if (
          outcomes.length === 0 ||
          !outcomes.every(
            (outcome) => outcome.status === "settled" && outcome.receipt.outcome === "delivered",
          )
        )
          continue;
        const attribution = repositoryMetadataFromCapture(record.metadataProvenance);
        if (
          Object.keys(attribution).length > 0 &&
          !recordResolvedMetadata(turn.path, run.run_id, attribution)
        ) {
          warn(`Could not save resolved repository metadata for run ${run.run_id}`);
          break;
        }
      }
      if (
        turn.root?.run_id !== run.run_id &&
        !turn.delivered.has(run.run_id) &&
        matching.some(({ record }) => record.eventId === run.run_id)
      ) {
        const scope = {
          integration: CLAUDE_CODE_INTEGRATION,
          sessionId,
          turnId,
          eventId: run.run_id,
        };
        const outcomes = await Promise.all(
          context.destinations.map((destination) =>
            context.captureStore.readOutcome(scope, destination.id),
          ),
        );
        if (
          outcomes.length > 0 &&
          outcomes.every(
            (outcome) => outcome.status === "settled" && outcome.receipt.outcome === "delivered",
          )
        ) {
          recordDelivered(turn.path, run.run_id);
        }
      }
    }
  }
}

function repositoryMetadataFromCapture(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  const metadata = buildCodingAgentMetadata(value as unknown as CodingAgentMetadataOptions);
  return Object.fromEntries(
    REPOSITORY_METADATA_KEYS.flatMap((key) =>
      typeof metadata[key] === "string" ? [[key, metadata[key]]] : [],
    ),
  );
}

export async function drainClaudeSession(
  context: ClaudeTracingEngineContext,
  config: Config,
  sessionId: string,
): Promise<void> {
  const result = await context.session.drain();
  if (result !== "scope-mismatch")
    await acknowledgeClaudeSharedDeliveries(context, config, sessionId);
}

function writerOptionsForConfig(config: Config): LangSmithUploadWriterOptions | undefined {
  const replicas = (config.replicas ?? []).map(replicaConfig);
  if (replicas.some((replica) => replica === undefined)) {
    throw new TypeError("LangSmith replica configuration is invalid");
  }
  if (!config.apiKey.trim() && replicas.length === 0) return undefined;
  return {
    destinations: [
      {
        apiKey: config.apiKey,
        apiUrl: config.apiBaseUrl,
        projectName: config.project,
      },
    ],
    ...(replicas.length === 0 ? {} : { replicas: replicas as LangSmithUploadReplicaConfig[] }),
    redact: config.redact,
    ...(config.redactExtraRules === undefined ? {} : { redactExtraRules: config.redactExtraRules }),
  };
}

function replicaConfig(candidate: unknown): LangSmithUploadReplicaConfig | undefined {
  let source: Record<string, unknown>;
  if (Array.isArray(candidate)) {
    if (typeof candidate[0] !== "string" || !candidate[0].trim()) return undefined;
    source = isRecord(candidate[1]) ? candidate[1] : {};
    return {
      projectName: candidate[0],
      ...(Object.keys(source).length === 0 ? {} : { updates: source }),
    };
  } else if (isRecord(candidate)) {
    source = candidate;
  } else {
    return undefined;
  }
  const apiKey = source.apiKey ?? source.api_key;
  const apiUrl = source.apiUrl ?? source.api_url;
  const projectName = source.projectName ?? source.project_name ?? source.project;
  const workspaceId = source.workspaceId ?? source.workspace_id;
  if (apiKey !== undefined && (typeof apiKey !== "string" || !apiKey.trim())) return undefined;
  if (apiUrl !== undefined && (typeof apiUrl !== "string" || !apiUrl.trim())) return undefined;
  if (projectName !== undefined && (typeof projectName !== "string" || !projectName.trim()))
    return undefined;
  if (workspaceId !== undefined && (typeof workspaceId !== "string" || !workspaceId.trim()))
    return undefined;
  if (source.updates !== undefined && !isRecord(source.updates)) return undefined;
  const allowed = new Set([
    "apiKey",
    "api_key",
    "apiUrl",
    "api_url",
    "projectName",
    "project_name",
    "project",
    "workspaceId",
    "workspace_id",
    "updates",
  ]);
  if (Object.keys(source).some((key) => !allowed.has(key))) return undefined;
  return {
    ...(typeof apiKey === "string" ? { apiKey } : {}),
    ...(typeof apiUrl === "string" ? { apiUrl } : {}),
    ...(typeof projectName === "string" ? { projectName } : {}),
    ...(workspaceId === undefined ? {} : { workspaceId }),
    ...(isRecord(source.updates) ? { updates: source.updates } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function reconstructClaudeTool(job: ReconstructionJob): Promise<ReconstructionResult> {
  if (job.sourceRefs.length !== 1 || job.sourceSnapshots?.length !== 1)
    throw new Error("Claude tool reconstruction needs one source snapshot");
  const [sourceRef] = job.sourceRefs;
  const snapshot = job.sourceSnapshots[0]!;
  const source = snapshot.submission;
  if (source.operation !== "post") throw new Error("Claude tool source snapshots must be posts");
  const run = source.run;
  if (
    snapshot.sourceRef !== sourceRef ||
    source.privacyMode !== job.privacyMode ||
    run.run_type !== "tool" ||
    sourceRef !== `${run.id}${CLAUDE_TOOL_SNAPSHOT_EVENT_SUFFIX}` ||
    job.eventId !== `${run.id}${CLAUDE_TOOL_RECONSTRUCTION_EVENT_SUFFIX}` ||
    (job.turnEvidence.rootRunId !== undefined &&
      run.parent_run_id !== job.turnEvidence.rootRunId) ||
    !job.turnEvidence.childRunIds.includes(run.id)
  ) {
    throw new Error("Claude tool snapshot does not match its reconstruction job");
  }
  const attributionContext = snapshot.attributionContext;
  if (!attributionContext) throw new Error("Claude tool attribution context is missing");
  const baseWithPins = withPinnedRepositoryKeys(
    source.metadata.base,
    attributionContext.pinnedRepositoryKeys,
  );
  const base =
    job.privacyMode === "full"
      ? settledRepositoryMetadata(
          baseWithPins,
          attributionContext.toolOrigin,
          source.metadata.runSpecific,
        )
      : undefined;
  const metadata: CodingAgentMetadataOptions = {
    ...source.metadata,
    ...(base === undefined ? {} : { base }),
  };
  const submission: PreparedRunSubmission = {
    ...source,
    metadata,
  };
  return {
    status: "ready",
    outputs: [{ eventId: run.id, sourceRef, submission }],
  };
}

function withPinnedRepositoryKeys(
  base: Record<string, unknown> | undefined,
  keys: readonly string[] | undefined,
): Record<string, unknown> | undefined {
  if (base === undefined || keys === undefined) return base;
  const result = { ...base };
  Object.defineProperty(result, PINNED_REPOSITORY_KEYS, { value: new Set(keys) });
  return result;
}

function isSavedReconstructionWake(
  error: unknown,
  context: ClaudeTracingEngineContext,
  input: ReconstructionJobInput,
): error is CaptureWakeError {
  if (!(error instanceof CaptureWakeError)) return false;
  const record = error.captureResult.record;
  const payload = isRecord(record.normalizedPayload) ? record.normalizedPayload : undefined;
  const sourceRefs = payload?.sourceRefs;
  return (
    record.integration === CLAUDE_CODE_INTEGRATION &&
    record.sessionId === context.sessionId &&
    record.turnId === input.turnId &&
    record.eventId === input.eventId &&
    record.destinationFingerprint === context.accountFingerprint &&
    payload?.privacyMode === input.privacyMode &&
    Array.isArray(sourceRefs) &&
    sourceRefs.length === input.sourceRefs.length &&
    sourceRefs.every((reference, index) => reference === input.sourceRefs[index])
  );
}

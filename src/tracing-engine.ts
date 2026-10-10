import { createCaptureStore } from "@langchain/plugins-base/storage/capture";
import { createTracingEngine, readSavedCaptureWake } from "@langchain/plugins-base/tracing";
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
import { dirname, join } from "node:path";
import {
  CLAUDE_CODE_INTEGRATION,
  CLAUDE_RUN_RECONSTRUCTION_EVENT_SUFFIX,
  CLAUDE_RUN_SNAPSHOT_EVENT_SUFFIX,
  CLAUDE_RUN_SNAPSHOT_SOURCE_SEPARATOR,
  CLAUDE_SETTLEMENT_EVENT_KIND,
  CLAUDE_TOOL_RECONSTRUCTION_EVENT_SUFFIX,
  CLAUDE_TOOL_SNAPSHOT_EVENT_SUFFIX,
  REPOSITORY_NAME_KEY,
  PINNED_REPOSITORY_KEYS,
  REPOSITORY_METADATA_KEYS,
  SHARED_ENGINE_STORAGE_DIRECTORY,
  TRUSTED_INTEGRATION_VERSION,
} from "./constants.js";
import type { Config } from "./config.js";
import { queueOrigin } from "./queue.js";
import { runConfigForMode } from "./privacy.js";
import { launchQueueFlusher } from "./utils/detach.js";
import {
  listTurnRecords,
  readTurnRecord,
  recordDelivered,
  recordRun,
  recordResolvedMetadata,
  recordResolvedToolOriginMetadata,
  turnRecordDir,
  turnRecordPath,
} from "./turn-record.js";
import { metadataAfterFill, turnAttributionFromOrderedChildren } from "./reconcile.js";
import { loadConfig } from "./config.js";
import { legacyRouteForSession } from "./legacy-import.js";
import type {
  ClaudeRunReconstructionContext,
  ClaudeToolReconstructionInput,
  ClaudeTracingEngineContext,
} from "./models/tracing-engine.js";
import { warn } from "./logger.js";
import { settledRepositoryMetadata } from "./repo-attribution.js";
import { recordRepoAttributionDiagnostic } from "./repo-attribution-diagnostics.js";
import type { RecordedRun, TracingMode, TurnRecord } from "./types.js";

export function createClaudeTracingSession(
  config: Config,
  cwd: string,
  sessionId: string,
  projectName?: string,
): ClaudeTracingEngineContext | undefined {
  const projectConfig = projectName === undefined ? config : { ...config, project: projectName };
  const writerOptions = writerOptionsForConfig(projectConfig);
  if (!writerOptions) return undefined;
  const writer = createLangSmithUploadWriter(writerOptions);
  const runReconstructionContext = {
    project: projectConfig.project,
    recordOrigin: queueOrigin(projectConfig),
    stateFilePath: projectConfig.stateFilePath,
    sessionId,
  };
  const storageRoot = join(dirname(config.stateFilePath), SHARED_ENGINE_STORAGE_DIRECTORY);
  const captureStore = createCaptureStore(storageRoot);
  const engine = createTracingEngine({
    storageRoot,
    integration: CLAUDE_CODE_INTEGRATION,
    writer: writerOptions,
  });
  const session = engine.forSession({
    sessionId,
    resolveScope: () => resolveClaudeScope(cwd, sessionId, projectName),
    scheduleWake: () => launchQueueFlusher(cwd, sessionId, projectName),
    reconstruct: (job) => reconstructClaudeJob(job, runReconstructionContext),
    backgroundRecovery: {
      optionsForSession: (recoveredSessionId) => {
        const current = loadConfig({ cwd, deferGit: true });
        const origin = queueOrigin(current);
        const route = legacyRouteForSession(current.stateFilePath, recoveredSessionId, origin);
        if (!route) throw new Error(`Could not find a saved route for ${recoveredSessionId}`);
        const recovered = loadConfig({ cwd: route.cwd, deferGit: true });
        if (queueOrigin(recovered) !== origin)
          throw new Error(
            `Saved route for ${recoveredSessionId} belongs to another LangSmith account`,
          );
        return {
          resolveScope: () => resolveClaudeScope(route.cwd, recoveredSessionId, route.projectName),
          scheduleWake: () => launchQueueFlusher(route.cwd, recoveredSessionId, route.projectName),
          reconstruct: (job) =>
            reconstructClaudeJob(job, {
              project: route.projectName,
              recordOrigin: queueOrigin(recovered),
              stateFilePath: recovered.stateFilePath,
              sessionId: recoveredSessionId,
            }),
        };
      },
      onReport: (result) => {
        if (result.status === "partial" || result.status === "failed") {
          warn(`Shared session recovery was incomplete: ${JSON.stringify(result)}`);
        }
      },
    },
  });
  return {
    accountFingerprint: writer.accountFingerprint,
    captureStore,
    destinations: writer.destinations,
    project: projectConfig.project,
    recordOrigin: queueOrigin(projectConfig),
    stateFilePath: projectConfig.stateFilePath,
    session,
    sessionId,
    storageRoot,
  };
}

async function reconstructClaudeJob(
  job: ReconstructionJob,
  context: ClaudeRunReconstructionContext,
): Promise<ReconstructionResult> {
  return job.eventId.endsWith(CLAUDE_RUN_RECONSTRUCTION_EVENT_SUFFIX)
    ? reconstructClaudeRun(job, context)
    : reconstructClaudeTool(job);
}

function resolveClaudeScope(cwd: string, sessionId: string, projectName?: string) {
  const current = loadConfig({ cwd, deferGit: true });
  const scoped = projectName === undefined ? current : { ...current, project: projectName };
  const options = writerOptionsForConfig(scoped);
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
}

export async function captureClaudeRun(
  context: ClaudeTracingEngineContext,
  input: LifecycleCaptureInput,
): Promise<boolean> {
  try {
    const result = await context.session.capture(input);
    return result.status === "published" || result.status === "duplicate";
  } catch (err) {
    if (
      await readSavedCaptureWake(err, {
        store: context.captureStore,
        integration: CLAUDE_CODE_INTEGRATION,
        sessionId: context.sessionId,
        turnId: input.turnId,
        eventId: input.eventId,
        runId: input.submission.run.id,
        destinationFingerprint: context.accountFingerprint,
      })
    ) {
      warn(`Shared capture was saved but its worker wake failed: ${err}`);
      return true;
    }
    throw err;
  }
}

export async function captureClaudeRunWithReconstruction(
  context: ClaudeTracingEngineContext,
  input: LifecycleCaptureInput,
  nativeTurnRecordRunId?: string,
): Promise<boolean> {
  const source = input.submission;
  const run = source.run;
  if (
    source.operation === "post" &&
    source.privacyMode === "full" &&
    (run.run_type === "llm" || (run.run_type === "tool" && run.name === "Agent"))
  ) {
    return queueClaudeRunReconstruction(context, input, nativeTurnRecordRunId);
  }
  return captureClaudeRun(context, input);
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
          toolOrigin:
            input.privacyMode === "full"
              ? {
                  ...(input.origin.path === undefined ? {} : { path: input.origin.path }),
                  ...(input.origin.cwd === undefined ? {} : { cwd: input.origin.cwd }),
                  namedAPath: input.origin.namedAPath,
                }
              : { namedAPath: false },
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
    if (!(await context.session.readSavedReconstructionWake(err, reconstruction))) throw err;
    warn(`Completed tool ${input.run.id} was saved but its worker wake failed: ${err}`);
  }
}

export async function queueClaudeRunReconstruction(
  context: ClaudeTracingEngineContext,
  input: LifecycleCaptureInput,
  nativeTurnRecordRunId?: string,
): Promise<boolean> {
  const source = input.submission;
  if (
    source.operation !== "post" ||
    source.privacyMode !== "full" ||
    (source.run.run_type !== "llm" &&
      !(source.run.run_type === "tool" && source.run.name === "Agent"))
  ) {
    return false;
  }
  const run = source.run;
  const rootRunId = input.turnEvidence.rootRunId;
  if (
    typeof nativeTurnRecordRunId !== "string" ||
    nativeTurnRecordRunId.length === 0 ||
    typeof rootRunId !== "string" ||
    typeof run.trace_id !== "string" ||
    typeof run.dotted_order !== "string" ||
    run.trace_id !== rootRunId ||
    !input.turnEvidence.childRunIds.includes(run.id) ||
    typeof run.parent_run_id !== "string"
  ) {
    return false;
  }
  const turnPath = turnRecordPath(context.stateFilePath, context.sessionId, nativeTurnRecordRunId);
  const turn = readTurnRecord(turnPath);
  if (!turn || turn.origin !== context.recordOrigin || turn.root?.run_id !== nativeTurnRecordRunId)
    return false;

  const sourceRef = claudeRunSnapshotSourceRef(nativeTurnRecordRunId, run.id);
  const reconstruction: ReconstructionJobInput = {
    turnId: input.turnId,
    eventId: `${run.id}${CLAUDE_RUN_RECONSTRUCTION_EVENT_SUFFIX}`,
    sourceRefs: [sourceRef],
    privacyMode: "full",
    turnEvidence: input.turnEvidence,
    sourceSnapshots: [
      {
        sourceRef,
        sourceAgeStartedAtMs: runStartTime(run.start_time, run.id),
        submission: source,
      },
    ],
  };
  const metadata = buildCodingAgentMetadata(source.metadata);
  if (
    !recordRun({
      path: turnPath,
      run: { ...run, project_name: context.project, extra: { metadata } },
      tracing: "full",
      origin: context.recordOrigin,
      shared: true,
    })
  ) {
    return false;
  }

  try {
    const queued = await context.session.queueReconstruction(reconstruction);
    if (queued.status !== "published" && queued.status !== "duplicate") {
      throw new Error(`Could not queue run ${run.id}: ${queued.status}`);
    }
  } catch (err) {
    if (!(await context.session.readSavedReconstructionWake(err, reconstruction))) throw err;
    warn(`Run ${run.id} was saved but its worker wake failed: ${err}`);
  }
  return true;
}

function runStartTime(value: unknown, runId: string): number {
  const startTime =
    typeof value === "number" ? value : typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (!Number.isSafeInteger(startTime) || startTime < 0)
    throw new TypeError(`Run ${runId} has an invalid start time`);
  return startTime;
}

function claudeRunSnapshotSourceRef(nativeTurnRecordRunId: string, runId: string): string {
  return `${nativeTurnRecordRunId}${CLAUDE_RUN_SNAPSHOT_SOURCE_SEPARATOR}${runId}${CLAUDE_RUN_SNAPSHOT_EVENT_SUFFIX}`;
}

function nativeTurnRecordRunIdFromSourceRef(sourceRef: string): string | undefined {
  if (!sourceRef.endsWith(CLAUDE_RUN_SNAPSHOT_EVENT_SUFFIX)) return undefined;
  const identity = sourceRef.slice(0, -CLAUDE_RUN_SNAPSHOT_EVENT_SUFFIX.length);
  const separator = identity.indexOf(CLAUDE_RUN_SNAPSHOT_SOURCE_SEPARATOR);
  if (separator <= 0 || separator === identity.length - 1) return undefined;
  return identity.slice(0, separator);
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
  const paths = listTurnRecords(recordDirectory);
  if (paths.length === 0) return;
  const captures = await context.captureStore.enumerate(CLAUDE_CODE_INTEGRATION, sessionId);
  for (const path of paths) {
    const turn = readTurnRecord(path);
    if (!turn || turn.origin !== origin) continue;
    const recordedRuns = [...(turn.root ? [turn.root] : []), ...turn.children];
    for (const run of recordedRuns) {
      if (!run.shared) continue;
      const matching = captures
        .filter(
          ({ record }) =>
            record.integration === CLAUDE_CODE_INTEGRATION &&
            record.sessionId === sessionId &&
            record.runId === run.run_id &&
            record.destinationFingerprint === context.accountFingerprint &&
            (record.eventId === run.run_id || record.eventKind === CLAUDE_SETTLEMENT_EVENT_KIND),
        )
        .sort((left, right) => left.capturedAtMs - right.capturedAtMs);
      for (const { record } of matching) {
        const scope = {
          integration: record.integration,
          sessionId: record.sessionId,
          turnId: record.turnId,
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
      if (turn.root?.run_id !== run.run_id && !turn.delivered.has(run.run_id)) {
        const postedCapture = matching.find(
          ({ record }) => record.eventId === run.run_id && record.runId === run.run_id,
        );
        if (postedCapture) {
          const { record } = postedCapture;
          const scope = {
            integration: record.integration,
            sessionId: record.sessionId,
            turnId: record.turnId,
            eventId: record.eventId,
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
  if (job.privacyMode === "metadata") {
    return { status: "ready", outputs: [{ eventId: run.id, sourceRef, submission: source }] };
  }
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

function reconstructClaudeRun(
  job: ReconstructionJob,
  context: ClaudeRunReconstructionContext,
): ReconstructionResult {
  if (job.sourceRefs.length !== 1 || job.sourceSnapshots?.length !== 1)
    throw new Error("Claude run reconstruction needs one source snapshot");
  const [sourceRef] = job.sourceRefs;
  const nativeTurnRecordRunId = nativeTurnRecordRunIdFromSourceRef(sourceRef!);
  const snapshot = job.sourceSnapshots[0]!;
  const source = snapshot.submission;
  if (source.operation !== "post") throw new Error("Claude run source snapshots must be posts");
  const run = source.run;
  if (
    job.privacyMode !== "full" ||
    source.privacyMode !== "full" ||
    nativeTurnRecordRunId === undefined ||
    snapshot.sourceRef !== sourceRef ||
    sourceRef !== claudeRunSnapshotSourceRef(nativeTurnRecordRunId, run.id) ||
    job.eventId !== `${run.id}${CLAUDE_RUN_RECONSTRUCTION_EVENT_SUFFIX}` ||
    (run.run_type !== "llm" && !(run.run_type === "tool" && run.name === "Agent")) ||
    typeof run.trace_id !== "string" ||
    typeof run.dotted_order !== "string" ||
    run.trace_id !== job.turnEvidence.rootRunId ||
    !job.turnEvidence.childRunIds.includes(run.id)
  ) {
    throw new Error("Claude run snapshot does not match its reconstruction job");
  }
  const turn = readTurnRecord(
    turnRecordPath(context.stateFilePath, context.sessionId, nativeTurnRecordRunId),
  );
  if (
    !turn ||
    turn.origin !== context.recordOrigin ||
    turn.root?.run_id !== nativeTurnRecordRunId
  ) {
    throw new Error("Claude native turn record is missing or invalid");
  }
  recordRepoAttributionDiagnostic("run-reconstruction-input", {
    run: { runId: run.id, name: run.name, runType: run.run_type, parentRunId: run.parent_run_id },
    turn: attributionDiagnosticRecord(turn),
  });
  const attribution = turnAttributionWithToolOrigins(turn);
  const sourceMetadata = buildCodingAgentMetadata(source.metadata);
  const recorded: RecordedRun = {
    run_id: run.id,
    ...(run.parent_run_id === undefined ? {} : { parent_run_id: run.parent_run_id }),
    trace_id: run.trace_id,
    dotted_order: run.dotted_order,
    name: run.name,
    run_type: run.run_type,
    tracing: "full",
    metadata: sourceMetadata,
  };
  const filled = attribution ? metadataAfterFill(recorded, attribution) : undefined;
  const additions = Object.fromEntries(
    REPOSITORY_METADATA_KEYS.flatMap((key) =>
      sourceMetadata[key] === undefined && typeof filled?.[key] === "string"
        ? [[key, filled[key]]]
        : [],
    ),
  );
  const submission: PreparedRunSubmission =
    Object.keys(additions).length === 0
      ? source
      : {
          ...source,
          metadata: {
            ...source.metadata,
            base: { ...source.metadata.base, ...additions },
          },
        };
  recordRepoAttributionDiagnostic("run-reconstruction-output", {
    run: { runId: run.id, name: run.name, runType: run.run_type, parentRunId: run.parent_run_id },
    attribution: repositoryMetadata(attribution),
    sourceMetadata: repositoryMetadata(sourceMetadata),
    additions,
    submittedMetadata: repositoryMetadata(submission.metadata.base),
    turn: attributionDiagnosticRecord(readTurnRecord(turn.path) ?? turn),
  });
  return {
    status: "ready",
    outputs: [
      {
        eventId: run.id,
        sourceRef,
        submission,
      },
    ],
  };
}

export function turnAttributionWithToolOrigins(
  record: TurnRecord,
  resolveOrigin: typeof settledRepositoryMetadata = settledRepositoryMetadata,
) {
  const matched = new Set<string>();
  const toolChildren = [];
  const missingToolRuns = [];
  for (const toolOrigin of record.toolOrigins) {
    const captured = recordedToolForOrigin(record, toolOrigin, matched);
    if (captured) matched.add(captured.run_id);
    const capturedMetadata = repositoryMetadata(captured?.metadata);
    if (capturedMetadata[REPOSITORY_NAME_KEY] !== undefined) {
      if (captured) toolChildren.push(captured);
      continue;
    }
    let resolvedMetadata = toolOrigin.resolvedMetadata;
    if (resolvedMetadata === undefined) {
      const base = withPinnedRepositoryKeys(record.root?.metadata, toolOrigin.pinnedRepositoryKeys);
      recordRepoAttributionDiagnostic("tool-origin-resolution-input", {
        toolUseId: toolOrigin.toolUseId,
        toolName: toolOrigin.toolName,
        order: toolOrigin.order,
        origin: toolOrigin.origin,
        pinnedRepositoryKeys: toolOrigin.pinnedRepositoryKeys,
        base: repositoryMetadata(base),
        turn: attributionDiagnosticRecord(record),
      });
      const resolved = resolveOrigin(base, toolOrigin.origin);
      resolvedMetadata = repositoryMetadata(resolved);
      recordRepoAttributionDiagnostic("tool-origin-resolution-output", {
        toolUseId: toolOrigin.toolUseId,
        returned: resolved === undefined ? "undefined" : "metadata",
        resolvedMetadata,
        turn: attributionDiagnosticRecord(record),
      });
      const saved = recordResolvedToolOriginMetadata(
        record.path,
        record.origin,
        toolOrigin.toolUseId,
        resolvedMetadata,
      );
      recordRepoAttributionDiagnostic("tool-origin-resolution-saved", {
        toolUseId: toolOrigin.toolUseId,
        saved,
        turn: attributionDiagnosticRecord(readTurnRecord(record.path) ?? record),
      });
      if (!saved) {
        throw new Error(`Could not save the resolved origin for tool ${toolOrigin.toolUseId}`);
      }
    }
    const metadata = { ...resolvedMetadata, ...capturedMetadata };
    if (captured) {
      toolChildren.push({
        ...captured,
        metadata: { ...captured.metadata, ...metadata },
      });
    } else if (Object.keys(metadata).length > 0) {
      missingToolRuns.push({
        run_id: `origin-${toolOrigin.toolUseId}`,
        parent_run_id: record.root?.run_id,
        trace_id: record.root?.trace_id ?? record.root?.run_id ?? "",
        dotted_order: `${record.root?.dotted_order ?? "0"}.${String(toolOrigin.order).padStart(12, "0")}`,
        name: toolOrigin.toolName,
        run_type: "tool",
        tracing: "full" as const,
        metadata,
      });
    }
  }
  const remainingChildren = record.children
    .filter((child) => !matched.has(child.run_id))
    .sort((left, right) => (left.dotted_order < right.dotted_order ? -1 : 1));
  return turnAttributionFromOrderedChildren(record, [
    ...toolChildren,
    ...remainingChildren,
    ...missingToolRuns,
  ]);
}

function repositoryMetadata(metadata: Record<string, unknown> | undefined): Record<string, string> {
  return Object.fromEntries(
    REPOSITORY_METADATA_KEYS.flatMap((key) =>
      typeof metadata?.[key] === "string" && metadata[key].length > 0
        ? [[key, metadata[key] as string]]
        : [],
    ),
  );
}

function attributionDiagnosticRecord(record: TurnRecord) {
  return {
    closed: record.closed,
    delivered: [...record.delivered],
    fixed: [...record.fixed],
    root: record.root
      ? {
          runId: record.root.run_id,
          metadata: repositoryMetadata(record.root.metadata),
        }
      : undefined,
    children: record.children.map((child) => ({
      runId: child.run_id,
      name: child.name,
      runType: child.run_type,
      toolUseId: child.toolUseId,
      metadata: repositoryMetadata(child.metadata),
    })),
    toolOrigins: record.toolOrigins.map((origin) => ({
      toolUseId: origin.toolUseId,
      toolName: origin.toolName,
      order: origin.order,
      origin: origin.origin,
      pinnedRepositoryKeys: origin.pinnedRepositoryKeys,
      resolvedMetadata: origin.resolvedMetadata,
    })),
  };
}

function recordedToolForOrigin(
  record: TurnRecord,
  origin: TurnRecord["toolOrigins"][number],
  alreadyMatched: ReadonlySet<string>,
): RecordedRun | undefined {
  const byId = record.children.find(
    (child) => child.run_type === "tool" && child.toolUseId === origin.toolUseId,
  );
  if (byId && !alreadyMatched.has(byId.run_id)) return byId;
  return record.children
    .filter(
      (child) =>
        child.run_type === "tool" &&
        child.toolUseId === undefined &&
        !alreadyMatched.has(child.run_id) &&
        (child.name === origin.toolName || child.metadata.ls_tool_name === origin.toolName),
    )
    .sort((left, right) => (left.dotted_order < right.dotted_order ? -1 : 1))[0];
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

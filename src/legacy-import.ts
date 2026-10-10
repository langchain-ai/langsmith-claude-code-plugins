import { readSavedCaptureWake } from "@langchain/plugins-base/tracing";
import type { LifecycleSnapshotCaptureInput } from "@langchain/plugins-base/tracing/lifecycle";
import { isAbsolute } from "node:path";
import { CLAUDE_CODE_INTEGRATION } from "./constants.js";
import {
  queuedAtMs,
  readQueue,
  removeQueued,
  runIsTooOldToUpload,
  abandonQueued,
} from "./queue.js";
import {
  listRecordedSessions,
  listTurnRecords,
  readTurnRecord,
  recordRun,
  turnRecordDir,
} from "./turn-record.js";
import { settledRunConfig } from "./repo-attribution.js";
import { warn } from "./logger.js";
import type {
  LegacyQueueCapturePlanResult,
  LegacyQueueImportOptions,
  LegacySessionRoute,
} from "./models/legacy-import.js";
import {
  legacyMetadataOptions,
  normalizedRunSnapshot,
  normalizedToolOrigin,
  runMetadata,
} from "./legacy-import/normalizers.js";
import type { QueuedRun } from "./types.js";
import { nonBlank, timestamp } from "./utils/validation/values.js";

export async function importLegacyQueueEntries(options: LegacyQueueImportOptions): Promise<void> {
  const entries = readQueue(options.dir);
  for (const entry of entries) {
    if (entry.origin !== options.origin) {
      warn(
        `Leaving queued run ${entry.queue_id} in place because it belongs to a different LangSmith account`,
      );
      return;
    }
    if (runIsTooOldToUpload(entry)) {
      const record = entry.record ? readTurnRecord(entry.record) : undefined;
      if (entry.record && (!record || record.origin !== entry.origin)) {
        warn(
          `Leaving expired queue entry ${entry.queue_id} in place because its turn record account cannot be verified`,
        );
        return;
      }
      abandonQueued(entry);
      removeQueued(options.dir, entry.queue_id);
      continue;
    }
    const result = legacyQueueCapturePlan(entry);
    if ("reason" in result) {
      warn(`Leaving queued run ${entry.queue_id} in place: ${result.reason}`);
      return;
    }
    const { plan } = result;
    const projectConfig = { ...options.config, project: plan.projectName };
    const context = options.createContext(
      projectConfig,
      plan.cwd,
      plan.sessionId,
      plan.projectName,
    );
    if (!context) {
      warn(
        `Leaving queued run ${entry.queue_id} in place because its saved project route is unavailable`,
      );
      return;
    }
    let accepted = false;
    let failure: string | undefined;
    try {
      const result = await context.session.captureSnapshot(plan.input);
      accepted = result.status === "published" || result.status === "duplicate";
      if (!accepted) failure = `shared capture returned ${result.status}`;
    } catch (err) {
      accepted =
        (await readSavedCaptureWake(err, {
          store: context.captureStore,
          integration: CLAUDE_CODE_INTEGRATION,
          sessionId: plan.sessionId,
          turnId: plan.turnId,
          runId: plan.input.submission.run.id,
          destinationFingerprint: context.accountFingerprint,
        })) !== undefined;
      if (!accepted) failure = `shared capture failed: ${err}`;
    }
    if (!accepted) {
      warn(
        `Leaving queued run ${entry.queue_id} in place because ${failure ?? "shared capture was not confirmed"}`,
      );
      return;
    }
    const wroteRecord = recordRun({
      path: plan.recordPath,
      run: plan.run,
      tracing: entry.tracing,
      origin: entry.origin,
      shared: true,
      closesAt: plan.open ? (entry.run.end_time as string | undefined) : undefined,
      routing: { cwd: plan.cwd },
    });
    if (!wroteRecord) {
      warn(
        `Leaving queued run ${entry.queue_id} in place because its local turn record could not be updated`,
      );
      return;
    }
    removeQueued(options.dir, entry.queue_id);
  }
}

export function legacyQueueCapturePlan(entry: QueuedRun): LegacyQueueCapturePlanResult {
  if (!entry.record) return { reason: "the queue entry has no turn record" };
  if (entry.tracing !== "full" && entry.tracing !== "metadata")
    return { reason: "the queue entry has an unknown privacy mode" };
  const runId = nonBlank(entry.run.id);
  const turnId = nonBlank(entry.run.parent_run_id);
  const sourceMetadata = runMetadata(entry.run);
  if (!runId || !turnId) return { reason: "the queued run has no stable run or turn ID" };
  const record = readTurnRecord(entry.record);
  if (!record || record.origin !== entry.origin)
    return { reason: "the turn record is missing or belongs to a different account" };
  if (record.root?.run_id !== turnId)
    return { reason: "the queued run parent does not match its saved turn root" };
  const recorded = record.children.find((child) => child.run_id === runId);
  if (!recorded) return { reason: "the queued run is missing from its turn record" };
  const sessionId = nonBlank(recorded.metadata.thread_id);
  const queuedSessionId = nonBlank(sourceMetadata?.thread_id);
  if (!sessionId || queuedSessionId !== sessionId)
    return { reason: "the original Claude session ID cannot be verified" };
  const recordedProject = nonBlank(recorded.project_name);
  const queuedProject = nonBlank(entry.run.project_name);
  if (!recordedProject && !queuedProject)
    return { reason: "the original LangSmith project cannot be verified" };
  if (recordedProject && queuedProject && recordedProject !== queuedProject)
    return { reason: "the queue and turn record disagree about the original LangSmith project" };
  const projectName = recordedProject ?? queuedProject!;
  const recordedCwd = nonBlank(recorded.routing?.cwd);
  const queuedCwd = nonBlank(entry.where?.cwd);
  if (!recordedCwd && !queuedCwd)
    return { reason: "the original working directory cannot be verified" };
  if ((recordedCwd && !isAbsolute(recordedCwd)) || (queuedCwd && !isAbsolute(queuedCwd)))
    return { reason: "the saved working directory is not absolute" };
  if (recordedCwd && queuedCwd && recordedCwd !== queuedCwd)
    return { reason: "the queue and turn record disagree about the original working directory" };
  const cwd = recordedCwd ?? queuedCwd!;
  const toolOrigin = normalizedToolOrigin(entry.where, cwd);
  const settled = entry.where
    ? settledRunConfig(entry.run, toolOrigin)
    : { run: entry.run, open: false };
  const sourceAgeStartedAtMs = timestamp(settled.run.start_time) ?? queuedAtMs(entry.queue_id);
  if (sourceAgeStartedAtMs === undefined)
    return { reason: "the original run age cannot be verified" };
  const attempts = entry.attempts;
  if (!Number.isSafeInteger(attempts) || attempts < 0)
    return { reason: "the prior delivery attempt count is invalid" };
  const run = normalizedRunSnapshot(settled.run, entry.tracing, sourceAgeStartedAtMs);
  if (!run || run.id !== runId)
    return { reason: "the queued run cannot be converted to a safe shared snapshot" };
  const children = record.children
    .filter((child) => child.shared || !record.delivered.has(child.run_id))
    .map((child) => child.run_id);
  if (!children.includes(runId)) children.push(runId);
  const input: LifecycleSnapshotCaptureInput = {
    turnId,
    eventId: runId,
    sourceAgeStartedAtMs,
    priorDeliveryAttempts: attempts,
    submission: {
      operation: "post",
      integration: CLAUDE_CODE_INTEGRATION,
      privacyMode: entry.tracing,
      metadata: legacyMetadataOptions(runMetadata(settled.run), sessionId, run.name),
      privacyContext: { status: settled.open ? "running" : run.error ? "error" : "completed" },
      run,
    },
    turnEvidence: {
      rootRunId: turnId,
      childRunIds: [...new Set(children.filter((child) => child !== turnId))],
      closureState: record.closed ? "authoritative" : "open",
    },
  };
  return {
    plan: {
      cwd,
      sessionId,
      projectName,
      turnId,
      recordPath: entry.record,
      run: settled.run,
      open: settled.open,
      input,
    },
  };
}

export function listLegacySessionRoutes(
  stateFilePath: string,
  origin: string,
  storedSession?: string,
): LegacySessionRoute[] {
  const routes = new Map<string, LegacySessionRoute>();
  const storedSessions =
    storedSession === undefined ? listRecordedSessions(stateFilePath) : [storedSession];
  for (const recordedSession of storedSessions) {
    const directory = turnRecordDir(stateFilePath, recordedSession);
    for (const path of listTurnRecords(directory)) {
      const record = readTurnRecord(path);
      if (!record || record.origin !== origin) continue;
      for (const run of [...(record.root ? [record.root] : []), ...record.children]) {
        if (!run.shared) continue;
        const sessionId = nonBlank(run.metadata.thread_id);
        const projectName = nonBlank(run.project_name);
        const cwd = nonBlank(run.routing?.cwd);
        if (!sessionId || !projectName || !cwd || !isAbsolute(cwd)) continue;
        const route = { cwd, projectName, sessionId };
        routes.set(`${sessionId}\0${projectName}\0${cwd}`, route);
      }
    }
  }
  return [...routes.values()];
}

export function legacyRouteForSession(
  stateFilePath: string,
  sessionId: string,
  origin: string,
): LegacySessionRoute | undefined {
  const routes = new Map<string, LegacySessionRoute>();
  for (const path of listTurnRecords(turnRecordDir(stateFilePath, sessionId))) {
    const record = readTurnRecord(path);
    if (!record || record.origin !== origin) continue;
    for (const run of [...(record.root ? [record.root] : []), ...record.children]) {
      if (!run.shared || nonBlank(run.metadata.thread_id) !== sessionId) continue;
      const projectName = nonBlank(run.project_name);
      const cwd = nonBlank(run.routing?.cwd);
      if (!projectName || !cwd || !isAbsolute(cwd)) continue;
      const route = { cwd, projectName, sessionId };
      routes.set(`${sessionId}\0${projectName}\0${cwd}`, route);
    }
  }
  const matchingRoutes = [...routes.values()];
  if (matchingRoutes.length !== 1) return undefined;
  return matchingRoutes[0];
}

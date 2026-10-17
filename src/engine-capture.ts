import {
  ATTRIBUTION_IDENTIFIER_KEY,
  buildCodingAgentMetadata,
  GIT_METADATA_KEYS,
} from "@langchain/plugins-base/metadata";
import { readSavedCaptureWake } from "@langchain/plugins-base/tracing";
import type { LifecycleCaptureInput } from "@langchain/plugins-base/tracing/lifecycle";
import type {
  NormalizedRunSnapshot,
  PreparedRunPatchSubmission,
  PreparedRunSubmission,
} from "@langchain/plugins-base/tracing/upload";
import {
  CAPTURE_SAVED_STATUSES,
  LS_INTEGRATION,
  POST_EVENT_PREFIX,
  RUN_CONTEXT_FIELDS,
  RUN_EVENT_PREFIXES,
  RUN_PATCH_FIELDS,
  RUN_SNAPSHOT_FIELDS,
} from "./constants.js";
import { warn } from "./logger.js";
import type {
  CaptureDependency,
  ClaudeRun,
  ClaudeTracingSession,
  RunOperation,
  TracingMode,
} from "./types.js";
import { cloneJson } from "./utils/clone.js";

export async function saveOrWarn(
  runId: string,
  save: () => Promise<{ status: string }>,
  savedDespite: (error: unknown) => Promise<unknown>,
): Promise<void> {
  try {
    const result = await save();
    if (!CAPTURE_SAVED_STATUSES.includes(result.status)) {
      warn(`Could not save run ${runId} for upload: ${result.status}`);
    }
  } catch (err) {
    if (!(await savedDespite(err))) throw err;
    warn(`Saved run ${runId} for upload, but its uploader did not start: ${err}`);
  }
}

export async function captureInto(
  context: ClaudeTracingSession,
  run: ClaudeRun,
  mode: TracingMode,
  rootRunId: string,
  operation: RunOperation,
): Promise<void> {
  const { session, sessionId, store, fingerprint } = context;
  const turnRunId =
    run.id === rootRunId || (await posted(context, rootRunId, rootRunId)) ? rootRunId : run.id;
  const afterPost = operation === "patch" && (await posted(context, turnRunId, run.id));
  const input = captureInput(run, mode, turnRunId, operation, sessionId, afterPost);
  await saveOrWarn(
    run.id,
    () => session.capture(input),
    (err) =>
      readSavedCaptureWake(err, {
        store,
        integration: LS_INTEGRATION,
        sessionId,
        turnId: turnRunId,
        eventId: input.eventId,
        destinationFingerprint: fingerprint,
      }),
  );
}

export function captureInput(
  run: ClaudeRun,
  mode: TracingMode,
  rootRunId: string,
  operation: RunOperation,
  sessionId: string,
  afterPost: boolean,
): LifecycleCaptureInput {
  const after = [
    ...(afterPost ? [run.id] : []),
    ...(namesItsTurn(run, rootRunId, operation) ? [rootRunId] : []),
  ];
  return {
    turnId: rootRunId,
    eventId: `${RUN_EVENT_PREFIXES[operation]}${run.id}`,
    submission: runSubmission(run, mode, operation),
    turnEvidence: runTurnEvidence(run, rootRunId),
    ...(after.length > 0
      ? { dependencies: after.map((runId) => postScope(sessionId, rootRunId, runId)) }
      : {}),
  };
}

export function namesItsTurn(run: ClaudeRun, rootRunId: string, operation: RunOperation): boolean {
  return operation === "post" && run.id !== rootRunId && run.parent_run_id === rootRunId;
}

export function postScope(sessionId: string, turnId: string, runId: string): CaptureDependency {
  return {
    integration: LS_INTEGRATION,
    sessionId,
    turnId,
    eventId: `${POST_EVENT_PREFIX}${runId}`,
  };
}

export function runSubmission(
  run: ClaudeRun,
  mode: TracingMode,
  operation: RunOperation,
): PreparedRunSubmission {
  const data = cloneJson(run);
  const pick = (fields: readonly string[]): Record<string, unknown> =>
    Object.fromEntries(fields.filter((key) => key in data).map((key) => [key, data[key as never]]));
  const status = data.error !== undefined ? "error" : data.end_time ? "completed" : "running";
  const base = { integration: LS_INTEGRATION, privacyMode: mode, metadata: data.metadata };
  return operation === "post"
    ? {
        ...base,
        operation,
        run: { inputs: {}, ...pick(RUN_SNAPSHOT_FIELDS) } as NormalizedRunSnapshot,
      }
    : {
        ...base,
        operation,
        run: pick(RUN_CONTEXT_FIELDS) as unknown as PreparedRunPatchSubmission["run"],
        privacyContext: { status },
        patch: {
          fields: RUN_PATCH_FIELDS.filter((key) => key in data),
          values: pick(RUN_PATCH_FIELDS),
        },
      };
}

export function runTurnEvidence(
  run: ClaudeRun,
  rootRunId: string,
): LifecycleCaptureInput["turnEvidence"] {
  return run.id === rootRunId
    ? { rootRunId, childRunIds: [], closureState: run.end_time ? "authoritative" : "open" }
    : { childRunIds: attributionReady(run.metadata) ? [] : [run.id], closureState: "open" };
}

export async function posted(
  context: ClaudeTracingSession,
  turnId: string,
  runId: string,
): Promise<boolean> {
  const scope = { integration: LS_INTEGRATION, sessionId: context.sessionId, turnId };
  return (
    (await context.store.read({ ...scope, eventId: `${POST_EVENT_PREFIX}${runId}` })) !== undefined
  );
}

export function attributionReady(metadata: ClaudeRun["metadata"]): boolean {
  const built = buildCodingAgentMetadata(metadata);
  return Boolean(built[GIT_METADATA_KEYS.repository] && built[ATTRIBUTION_IDENTIFIER_KEY]);
}

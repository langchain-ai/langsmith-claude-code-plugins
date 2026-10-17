import type {
  ReconstructionJob,
  ReconstructionJobInput,
  ReconstructionResult,
} from "@langchain/plugins-base/tracing/reconstruction";
import { POST_EVENT_PREFIX, TOOL_SETTLEMENT_EVENT_PREFIX } from "./constants.js";
import {
  captureInto,
  posted,
  postScope,
  runSubmission,
  runTurnEvidence,
  saveOrWarn,
} from "./engine-capture.js";
import { settledRepositoryMetadata } from "./repo-attribution.js";
import type { ClaudeRun, ClaudeTracingSession, ToolOrigin, TracingMode } from "./types.js";
import { cloneJson } from "./utils/clone.js";

export async function captureToolRun(
  context: ClaudeTracingSession,
  run: ClaudeRun,
  mode: TracingMode,
  rootRunId: string,
  origin: ToolOrigin,
): Promise<void> {
  if (mode !== "full") return captureInto(context, run, mode, rootRunId, "post");
  const turnRunId = (await posted(context, rootRunId, rootRunId)) ? rootRunId : run.id;
  const input = {
    turnId: turnRunId,
    eventId: `${TOOL_SETTLEMENT_EVENT_PREFIX}${run.id}`,
    sourceRefs: [run.id],
    privacyMode: mode,
    turnEvidence:
      turnRunId === rootRunId
        ? { childRunIds: [run.id], closureState: "open" as const }
        : (runTurnEvidence(run, turnRunId) as ReconstructionJobInput["turnEvidence"]),
    sourceSnapshots: [
      {
        sourceRef: run.id,
        submission: runSubmission(run, mode, "post"),
        sourceAgeStartedAtMs: Date.now(),
        attributionContext: { toolOrigin: cloneJson(origin) },
      },
    ],
  };
  await saveOrWarn(
    run.id,
    () => context.session.queueReconstruction(input),
    (err) => context.session.readSavedReconstructionWake(err, input),
  );
}

export async function settleToolRuns(job: ReconstructionJob): Promise<ReconstructionResult> {
  return {
    status: "ready",
    outputs: (job.sourceSnapshots ?? []).map(({ sourceRef, submission, attributionContext }) => ({
      eventId: `${POST_EVENT_PREFIX}${submission.run.id}`,
      sourceRef,
      ...(submission.run.parent_run_id === job.turnId
        ? { dependencies: [postScope(job.sessionId, job.turnId, job.turnId)] }
        : {}),
      submission: {
        ...submission,
        metadata: {
          ...submission.metadata,
          base:
            settledRepositoryMetadata(
              submission.metadata.base,
              attributionContext?.toolOrigin ?? { namedAPath: false },
            ) ?? submission.metadata.base,
        },
      },
    })),
  };
}

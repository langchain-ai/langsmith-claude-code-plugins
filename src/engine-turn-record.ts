import { buildCodingAgentMetadata } from "@langchain/plugins-base/metadata";
import type { CodingAgentMetadataOptions } from "@langchain/plugins-base/metadata";
import type { StoredCapture } from "@langchain/plugins-base/storage/capture";
import type { RecordedRun, TurnRecord } from "@langchain/plugins-base/tracing/settlement";
import {
  LS_INTEGRATION,
  RUN_CAPTURE_EVENT_KINDS,
  TOOL_SETTLEMENT_EVENT_PREFIX,
} from "./constants.js";
import type {
  ClaudeTracingSession,
  EngineRunPayload,
  EngineTurnRecord,
  TurnEvidenceChildren,
} from "./types.js";

export async function readEngineTurn(
  context: ClaudeTracingSession,
  turnRunId: string,
): Promise<EngineTurnRecord | undefined> {
  const captures = (await context.store.enumerateTurn(LS_INTEGRATION, context.sessionId, turnRunId))
    .map(({ record }) => record)
    .filter((record) => record.destinationFingerprint === context.fingerprint)
    .sort((left, right) => left.capturedAtMs - right.capturedAtMs);
  const latest = new Map<string, StoredCapture>();
  const children = new Set<string>();
  const tools = new Set<string>();
  for (const capture of captures) {
    if (capture.eventId.startsWith(TOOL_SETTLEMENT_EVENT_PREFIX)) {
      const toolRunId = capture.eventId.slice(TOOL_SETTLEMENT_EVENT_PREFIX.length);
      tools.add(toolRunId);
      children.add(toolRunId);
    }
    if (!RUN_CAPTURE_EVENT_KINDS.includes(capture.eventKind)) continue;
    latest.set(capture.runId, capture);
    const evidence = capture.turnEvidence as TurnEvidenceChildren;
    for (const runId of evidence.childRunIds ?? []) children.add(runId);
  }
  const root = latest.get(turnRunId);
  if (!root) return undefined;
  const record: TurnRecord = {
    path: `${LS_INTEGRATION}/${context.sessionId}/${turnRunId}`,
    origin: context.fingerprint,
    root: recordedRun(root),
    children: [],
    closed: true,
    delivered: new Set(),
    fixed: new Set(),
  };
  for (const runId of children) {
    const capture = latest.get(runId);
    if (!capture) continue;
    record.children.push(recordedRun(capture));
    if (!tools.has(runId) || (await delivered(context, capture))) record.delivered.add(runId);
  }
  return { record, landed: [...children].every((runId) => record.delivered.has(runId)) };
}

function recordedRun(capture: StoredCapture): RecordedRun {
  const { privacyMode, run } = capture.normalizedPayload as unknown as EngineRunPayload;
  return {
    run_id: capture.runId,
    parent_run_id: run.parent_run_id,
    trace_id: run.trace_id,
    dotted_order: run.dotted_order,
    name: run.name,
    run_type: run.run_type,
    tracing: privacyMode,
    metadata: buildCodingAgentMetadata(
      capture.metadataProvenance as unknown as CodingAgentMetadataOptions,
    ),
  };
}

async function delivered(context: ClaudeTracingSession, capture: StoredCapture): Promise<boolean> {
  for (const { id } of context.destinations) {
    const outcome = await context.store.readOutcome(capture, id);
    if (outcome.status !== "settled" || outcome.receipt.outcome !== "delivered") return false;
  }
  return true;
}

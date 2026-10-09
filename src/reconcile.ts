/**
 * Settling a turn's repository and author once the turn is over.
 *
 * A tool call is uploaded the moment it finishes, long before the turn knows
 * which repository it worked in. This fills that gap afterwards: it reads the
 * plugin's own record of the turn, picks one unambiguous source of truth, and
 * patches the runs that are still missing it.
 */

import type { Client, RunTreeConfig } from "langsmith";
import {
  ATTRIBUTION_IDENTIFIER_KEY,
  QUEUE_RUN_MAX_AGE_MS,
  REPOSITORY_METADATA_KEYS,
  REPOSITORY_NAME_KEY,
  UPDATE_ALREADY_RECEIVED_STATUS,
} from "./constants.js";
import { createRunTree } from "./privacy.js";
import { debug, warn } from "./logger.js";
import { discardTurnRecord, readTurnRecord, recordReconciled } from "./turn-record.js";
import type { UploadWatch } from "./upload-confirm.js";
import type { RecordedRun, TurnRecord, TurnRecordTarget } from "./types.js";

type Attribution = Record<string, string>;

function attributionOf(metadata: Record<string, unknown> | undefined): Attribution {
  const carried: Attribution = {};
  for (const key of REPOSITORY_METADATA_KEYS) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.length > 0) carried[key] = value;
  }
  return carried;
}

const namesARepository = (carried: Attribution): boolean =>
  carried[REPOSITORY_NAME_KEY] !== undefined;

export const everyChildLanded = (record: TurnRecord): boolean =>
  record.children.every((child) => record.delivered.has(child.run_id));

export function turnAttribution(record: TurnRecord): Attribution | undefined {
  const root = attributionOf(record.root?.metadata);
  const inToolCallOrder = [...record.children]
    .sort((left, right) => (left.dotted_order < right.dotted_order ? -1 : 1))
    .map((child) => attributionOf(child.metadata));
  const source = namesARepository(root)
    ? root
    : inToolCallOrder.find((carried) => namesARepository(carried));

  const knowsWhoWorkedInSource = (carried: Attribution): boolean =>
    carried[ATTRIBUTION_IDENTIFIER_KEY] !== undefined &&
    carried[REPOSITORY_NAME_KEY] === source?.[REPOSITORY_NAME_KEY];
  const author =
    root[ATTRIBUTION_IDENTIFIER_KEY] ??
    source?.[ATTRIBUTION_IDENTIFIER_KEY] ??
    inToolCallOrder.find(knowsWhoWorkedInSource)?.[ATTRIBUTION_IDENTIFIER_KEY];

  const filled: Attribution = { ...source };
  if (author !== undefined) filled[ATTRIBUTION_IDENTIFIER_KEY] = author;
  return Object.keys(filled).length > 0 ? filled : undefined;
}

export function metadataAfterFill(
  run: RecordedRun,
  filled: Attribution,
): Record<string, unknown> | undefined {
  const carried = attributionOf(run.metadata);
  const workedOutItsOwn =
    namesARepository(carried) && carried[REPOSITORY_NAME_KEY] !== filled[REPOSITORY_NAME_KEY];
  if (workedOutItsOwn) return undefined;

  const missing = Object.entries(filled).filter(([key]) => carried[key] === undefined);
  if (missing.length === 0) return undefined;
  return { ...run.metadata, ...Object.fromEntries(missing) };
}

export function settledTurnMetadata(
  base: Record<string, unknown> | undefined,
  record: TurnRecord | undefined,
): Record<string, unknown> | undefined {
  if (!record?.root) return base;
  const filled = turnAttribution({ ...record, root: { ...record.root, metadata: base ?? {} } });
  if (!filled) return base;
  const missing = Object.entries(filled).filter(([key]) => base?.[key] === undefined);
  return missing.length === 0 ? base : { ...base, ...Object.fromEntries(missing) };
}

export function attributionFiller(
  target: TurnRecordTarget | undefined,
): (metadata: Record<string, unknown>) => Record<string, unknown> {
  const record = target ? readTurnRecord(target.path) : undefined;
  return (metadata) => settledTurnMetadata(metadata, record) ?? metadata;
}

function runConfig(
  run: RecordedRun,
  metadata: Record<string, unknown>,
  client: Client,
  replicas: RunTreeConfig["replicas"],
): RunTreeConfig {
  return {
    client,
    replicas,
    id: run.run_id,
    name: run.name,
    run_type: run.run_type as RunTreeConfig["run_type"],
    project_name: run.project_name,
    start_time: run.start_time,
    end_time: run.end_time,
    parent_run_id: run.parent_run_id,
    trace_id: run.trace_id,
    dotted_order: run.dotted_order,
    extra: { metadata },
  };
}

function alreadyUpdated(failure: unknown): boolean {
  const status = (failure as { status?: unknown } | undefined)?.status;
  return status === UPDATE_ALREADY_RECEIVED_STATUS;
}

function tooOldToUpload(record: TurnRecord, now: number): boolean {
  const started = new Date(record.root?.start_time ?? "").getTime();
  return Number.isFinite(started) && now - started >= QUEUE_RUN_MAX_AGE_MS;
}

export async function reconcileTurn(options: {
  record: TurnRecord;
  client: Client;
  replicas: RunTreeConfig["replicas"];
  watch: UploadWatch;
  now?: number;
}): Promise<boolean> {
  const { record, client, replicas, watch } = options;
  const now = options.now ?? Date.now();

  if (!record.root) return true;
  if (tooOldToUpload(record, now)) {
    warn(`Dropping a turn record LangSmith will no longer accept: ${record.path}`);
    return true;
  }
  if (!record.closed) return false;
  if (!everyChildLanded(record)) {
    debug(`Waiting for the rest of ${record.path} to land before settling it`);
    return false;
  }

  const filled = turnAttribution(record) ?? {};

  const stillOpen = record.children.filter(
    (child) => child.open && record.delivered.has(child.run_id),
  );
  let settled = true;
  for (const run of [record.root, ...stillOpen]) {
    if (record.fixed.has(run.run_id)) continue;
    const metadata = metadataAfterFill(run, filled) ?? run.metadata;
    const runTree = createRunTree(runConfig(run, metadata, client, replicas), run.tracing);
    await runTree.patchRun({ excludeInputs: true });
    const failure = watch.failure();
    if (failure && !alreadyUpdated(failure)) {
      warn(`Could not settle the repository on run ${run.run_id}: ${failure}`);
      settled = false;
      continue;
    }
    recordReconciled(record.path, run.run_id);
    debug(`Settled the repository and author on run ${run.run_id}`);
  }
  return settled;
}

export async function reconcileAndClear(options: {
  record: TurnRecord;
  client: Client;
  replicas: RunTreeConfig["replicas"];
  watch: UploadWatch;
}): Promise<void> {
  if (await reconcileTurn(options)) discardTurnRecord(options.record.path);
}

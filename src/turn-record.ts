/**
 * The plugin's own record of a turn, kept beside the upload queue.
 *
 * A hook appends one line per thing it did; nothing is ever rewritten in place,
 * so parallel tool handlers and a detached uploader can all write to it safely.
 * Claude Code's own transcript is never read from here and never touched.
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";
import {
  PRIVATE_DIR_MODE,
  PRIVATE_FILE_MODE,
  RECORDED_RUN_FALLBACK_TYPE,
  TURN_RECORD_DIR_NAME,
  TURN_RECORD_LINE,
  TURN_RECORD_MAX_BYTES,
  TURN_RECORD_SUFFIX,
} from "./constants.js";
import { listStoredSessions, safeName, storeDir, storeRoot } from "./utils/session-store.js";
import { runConfigForMode } from "./privacy.js";
import { debug, warn } from "./logger.js";
import type { RecordedRun, TracingMode, TurnRecord, TurnRecordLine } from "./types.js";

export const turnRecordRoot = (stateFilePath: string): string =>
  storeRoot(stateFilePath, TURN_RECORD_DIR_NAME);

export const turnRecordDir = (stateFilePath: string, sessionId: string): string =>
  storeDir(stateFilePath, TURN_RECORD_DIR_NAME, sessionId);

export function turnRecordPath(stateFilePath: string, sessionId: string, turnKey: string): string {
  return join(turnRecordDir(stateFilePath, sessionId), `${safeName(turnKey)}${TURN_RECORD_SUFFIX}`);
}

function entriesIn(dir: string, suffix: string): string[] {
  try {
    return readdirSync(dir)
      .filter((name) => name.endsWith(suffix))
      .sort()
      .map((name) => join(dir, name));
  } catch {
    return [];
  }
}

export const listRecordedSessions = (stateFilePath: string): string[] =>
  listStoredSessions(stateFilePath, TURN_RECORD_DIR_NAME);

export const listTurnRecords = (dir: string): string[] => entriesIn(dir, TURN_RECORD_SUFFIX);

export function recordsIdleMs(dir: string, now: number = Date.now()): number {
  let newest = 0;
  for (const path of listTurnRecords(dir)) {
    try {
      newest = Math.max(newest, statSync(path).mtimeMs);
    } catch {}
  }
  return newest === 0 ? Number.POSITIVE_INFINITY : now - newest;
}

function append(path: string, line: TurnRecordLine): void {
  try {
    mkdirSync(dirname(path), { recursive: true, mode: PRIVATE_DIR_MODE });
    appendFileSync(path, `${JSON.stringify(line)}\n`, { mode: PRIVATE_FILE_MODE });
  } catch (err) {
    warn(`Could not add to the turn record: ${err}`);
  }
}

function recordedRun(run: Record<string, unknown>, tracing: TracingMode): RecordedRun | undefined {
  const safe = runConfigForMode(run, tracing);
  const extra = safe.extra as { metadata?: Record<string, unknown> } | undefined;
  if (typeof safe.id !== "string" || typeof safe.dotted_order !== "string") return undefined;
  return {
    run_id: safe.id,
    parent_run_id: typeof safe.parent_run_id === "string" ? safe.parent_run_id : undefined,
    trace_id: typeof safe.trace_id === "string" ? safe.trace_id : safe.id,
    dotted_order: safe.dotted_order,
    name: typeof safe.name === "string" ? safe.name : "",
    run_type: typeof safe.run_type === "string" ? safe.run_type : RECORDED_RUN_FALLBACK_TYPE,
    project_name: typeof safe.project_name === "string" ? safe.project_name : undefined,
    start_time: typeof safe.start_time === "string" ? safe.start_time : undefined,
    end_time: typeof safe.end_time === "string" ? safe.end_time : undefined,
    tracing,
    metadata: JSON.parse(JSON.stringify(extra?.metadata ?? {})) as Record<string, unknown>,
  };
}

export function recordRun(options: {
  path: string;
  run: Record<string, unknown>;
  tracing: TracingMode;
  origin: string;
  root?: boolean;
  closesAt?: string;
}): void {
  const run = recordedRun(options.run, options.tracing);
  if (!run) return;
  if (options.closesAt) {
    run.open = true;
    run.end_time = options.closesAt;
  }
  append(options.path, {
    k: TURN_RECORD_LINE.run,
    root: options.root,
    origin: options.origin,
    run,
  });
}

export function recordTurnClosed(path: string, turnId: string | undefined): void {
  append(path, { k: TURN_RECORD_LINE.closed, turn_id: turnId });
}

export function closeTurnRecord(options: {
  stateFilePath: string;
  sessionId: string;
  turnRunId: string;
  turnId?: string;
}): void {
  const path = turnRecordPath(options.stateFilePath, options.sessionId, options.turnRunId);
  if (!existsSync(path)) return;
  recordTurnClosed(path, options.turnId);
}

export function recordDelivered(path: string, runId: string): void {
  append(path, { k: TURN_RECORD_LINE.delivered, id: runId });
}

export function readTurnRecord(path: string): TurnRecord | undefined {
  let contents: string;
  try {
    if (statSync(path).size > TURN_RECORD_MAX_BYTES) {
      warn(`Dropping a turn record too large to be real: ${path}`);
      discardTurnRecord(path);
      return undefined;
    }
    contents = readFileSync(path, "utf-8");
  } catch {
    return undefined;
  }

  const record: TurnRecord = {
    path,
    origin: "",
    children: [],
    closed: false,
    delivered: new Set(),
  };
  const byId = new Map<string, RecordedRun>();
  for (const line of contents.split("\n")) {
    if (!line) continue;
    let parsed: TurnRecordLine;
    try {
      parsed = JSON.parse(line) as TurnRecordLine;
    } catch {
      continue;
    }
    if (parsed.k === TURN_RECORD_LINE.run && typeof parsed.run?.run_id === "string") {
      if (parsed.root) record.root = parsed.run;
      else byId.set(parsed.run.run_id, parsed.run);
      if (parsed.origin) record.origin = parsed.origin;
    } else if (parsed.k === TURN_RECORD_LINE.closed) {
      record.closed = true;
      record.turnId = parsed.turn_id;
    } else if (parsed.k === TURN_RECORD_LINE.delivered && typeof parsed.id === "string") {
      record.delivered.add(parsed.id);
    }
  }
  record.children = [...byId.values()];
  return record;
}

export function discardTurnRecord(path: string): void {
  try {
    unlinkSync(path);
    debug(`Removed the turn record ${path}`);
  } catch {}
}

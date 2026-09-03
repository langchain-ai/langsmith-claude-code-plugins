import {
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { TracingState, SessionState, TracingMode } from "./types.js";

const LOCK_TIMEOUT_MS = 5_000;
const LOCK_RETRY_MS = 20;
const LOCK_STALE_MS = 30_000;
const FAIL_CLOSED_KEY = "__langsmith_fail_closed";

type StoredState = TracingState & { [FAIL_CLOSED_KEY]?: true };
type LockRecord = { owner: string; pid: number; created: number };

function lockPath(stateFilePath: string): string {
  return `${stateFilePath}.lock`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function staleLock(path: string): boolean {
  try {
    if (Date.now() - statSync(path).mtimeMs <= LOCK_STALE_MS) return false;
    try {
      const record = JSON.parse(readFileSync(path, "utf-8")) as Partial<LockRecord>;
      return typeof record.pid !== "number" || !processAlive(record.pid);
    } catch {
      return true;
    }
  } catch {
    return false;
  }
}

async function acquireLock(stateFilePath: string): Promise<LockRecord> {
  const path = lockPath(stateFilePath);
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  const record = { owner: randomUUID(), pid: process.pid, created: Date.now() };
  mkdirSync(dirname(stateFilePath), { recursive: true });
  while (Date.now() < deadline) {
    try {
      const fd = openSync(path, "wx", 0o600);
      writeFileSync(fd, JSON.stringify(record));
      closeSync(fd);
      return record;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (staleLock(path)) {
        try {
          unlinkSync(path);
        } catch {}
        continue;
      }
      await sleep(LOCK_RETRY_MS);
    }
  }
  throw new Error(`Timed out acquiring state lock: ${path}`);
}

function releaseLock(stateFilePath: string, lock: LockRecord): void {
  const path = lockPath(stateFilePath);
  try {
    const current = JSON.parse(readFileSync(path, "utf-8")) as Partial<LockRecord>;
    if (current.owner === lock.owner && current.pid === lock.pid) unlinkSync(path);
  } catch {}
}

export async function atomicUpdateState(
  stateFilePath: string,
  fn: (state: TracingState) => TracingState,
): Promise<void> {
  const lock = await acquireLock(stateFilePath);
  try {
    const state = loadState(stateFilePath);
    writeStateFile(stateFilePath, fn(state));
  } finally {
    releaseLock(stateFilePath, lock);
  }
}

export async function recoverAndUpdateState(
  stateFilePath: string,
  fn: (state: TracingState) => TracingState,
): Promise<TracingState> {
  const lock = await acquireLock(stateFilePath);
  try {
    let state = loadState(stateFilePath);
    if ((state as StoredState)[FAIL_CLOSED_KEY]) {
      if (existsSync(stateFilePath)) {
        renameSync(stateFilePath, `${stateFilePath}.corrupt.${Date.now()}.${randomUUID()}`);
      }
      state = {};
    }
    const updated = fn(state);
    delete (updated as StoredState)[FAIL_CLOSED_KEY];
    writeStateFile(stateFilePath, updated);
    return updated;
  } finally {
    releaseLock(stateFilePath, lock);
  }
}

function validMode(value: unknown): value is TracingMode {
  return value === "full" || value === "metadata";
}

function validSession(value: unknown): value is SessionState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const session = value as Record<string, unknown>;
  if (
    typeof session.last_line !== "number" ||
    typeof session.turn_count !== "number" ||
    typeof session.updated !== "string"
  )
    return false;
  for (const key of ["tracing", "current_turn_tracing", "compaction_tracing"]) {
    if (session[key] !== undefined && !validMode(session[key])) return false;
  }
  if (session.open_turns !== undefined) {
    if (
      !session.open_turns ||
      typeof session.open_turns !== "object" ||
      Array.isArray(session.open_turns)
    )
      return false;
    for (const turn of Object.values(session.open_turns as Record<string, unknown>)) {
      if (!turn || typeof turn !== "object" || Array.isArray(turn)) return false;
      const mode = (turn as Record<string, unknown>).tracing;
      if (mode !== undefined && !validMode(mode)) return false;
    }
  }
  return true;
}

function failClosedState(): TracingState {
  return { [FAIL_CLOSED_KEY]: true } as unknown as TracingState;
}

export function loadState(stateFilePath: string): TracingState {
  if (!existsSync(stateFilePath)) return {};
  try {
    const parsed = JSON.parse(readFileSync(stateFilePath, "utf-8")) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return failClosedState();
    const quarantined = parsed[FAIL_CLOSED_KEY] === true;
    for (const [key, value] of Object.entries(parsed)) {
      if (key !== FAIL_CLOSED_KEY && !validSession(value)) return failClosedState();
    }
    return (quarantined ? parsed : { ...parsed }) as TracingState;
  } catch {
    return failClosedState();
  }
}

function writeStateFile(stateFilePath: string, state: TracingState): void {
  mkdirSync(dirname(stateFilePath), { recursive: true });
  const tempPath = `${stateFilePath}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(tempPath, JSON.stringify(state, null, 2), { mode: 0o600 });
  renameSync(tempPath, stateFilePath);
  chmodSync(stateFilePath, 0o600);
}

export function saveState(stateFilePath: string, state: TracingState): void {
  writeStateFile(stateFilePath, state);
}

export function getTracingMode(state: TracingState, sessionId: string): TracingMode {
  const stored = state as StoredState;
  const session = stored[sessionId];
  if (stored[FAIL_CLOSED_KEY]) return "metadata";
  if (!session) return "full";
  return session.tracing === "metadata" ? "metadata" : "full";
}

export function parseTraceCommand(prompt: string): "on" | "off" | "status" | undefined {
  const match = /^\/trace (on|off|status)$/.exec(prompt);
  return match?.[1] as "on" | "off" | "status" | undefined;
}

export function traceCommandResponse(mode: TracingMode, masterEnabled = true): string {
  let reason: string;
  if (!masterEnabled) reason = "LangSmith tracing is off because the master switch is disabled.";
  else if (mode === "full") reason = "LangSmith tracing is on for this thread.";
  else reason = "LangSmith tracing is off for this thread (metadata only).";
  return JSON.stringify({ decision: "block", reason });
}

export function getSessionState(state: TracingState, sessionId: string): SessionState {
  const session = state[sessionId];
  return validSession(session)
    ? session
    : { last_line: -1, turn_count: 0, updated: "", task_run_map: {} };
}

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function pruneOldSessions(state: TracingState, now: number = Date.now()): TracingState {
  const cutoff = now - SESSION_MAX_AGE_MS;
  const pruned: TracingState = {};
  for (const [sessionId, session] of Object.entries(state)) {
    if (sessionId === FAIL_CLOSED_KEY) {
      (pruned as unknown as StoredState)[FAIL_CLOSED_KEY] = true;
      continue;
    }
    const updatedMs = session.updated ? new Date(session.updated).getTime() : 0;
    if (updatedMs >= cutoff || session.tracing === "metadata") pruned[sessionId] = session;
  }
  return pruned;
}

export function updateSessionState(
  state: TracingState,
  sessionId: string,
  lastLine: number,
  turnCount: number,
  taskRunMap?: Record<string, { run_id: string; dotted_order: string }>,
  currentTurnRunId?: string,
): TracingState {
  const existingSession = getSessionState(state, sessionId);
  return {
    ...state,
    [sessionId]: {
      ...existingSession,
      last_line: lastLine,
      turn_count: turnCount,
      updated: new Date().toISOString(),
      task_run_map: taskRunMap ?? existingSession.task_run_map,
      current_turn_run_id:
        currentTurnRunId !== undefined ? currentTurnRunId : existingSession.current_turn_run_id,
    },
  };
}

import {
  chmodSync,
  closeSync,
  constants,
  copyFileSync,
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
// A stored `tracing: "full"` may predate corruption and is NOT renewed consent.
// Only an explicit /ls-trace on for this session can set this recovery exception.
const CONSENT_KEY = "__langsmith_explicit_consent";

type StoredSession = SessionState & { [CONSENT_KEY]?: true };
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
    const { state } = readStateFile(stateFilePath);
    const failClosed = (state as StoredState)[FAIL_CLOSED_KEY];
    const consented = new Set(
      Object.keys(state).filter((id) => getTracingMode(state, id) === "full"),
    );
    const updated = fn(state);
    // Ordinary updates cannot lift the global privacy default or mint consent.
    if (failClosed) {
      (updated as StoredState)[FAIL_CLOSED_KEY] = true;
      for (const [id, session] of Object.entries(updated)) {
        if (id !== FAIL_CLOSED_KEY && validSession(session) && !consented.has(id)) {
          delete (session as StoredSession)[CONSENT_KEY];
        }
      }
    }
    writeStateFile(stateFilePath, updated);
  } finally {
    releaseLock(stateFilePath, lock);
  }
}

/**
 * For explicit /ls-trace on/off ONLY. The callback must return a valid session with
 * an explicit tracing mode for sessionId. Only that session is committed; other
 * sessions and the global metadata default are preserved, even if fn mutates its
 * input or returns a replacement object. /ls-trace status must use loadState.
 *
 * After corruption, `full` renews consent for this session alone; `metadata`
 * revokes it. A pre-existing full preference never bypasses the global marker.
 */
export async function recoverAndUpdateState(
  stateFilePath: string,
  sessionId: string,
  fn: (state: TracingState) => TracingState,
): Promise<TracingState> {
  if (sessionId === FAIL_CLOSED_KEY) throw new Error("Reserved state session id");
  const lock = await acquireLock(stateFilePath);
  try {
    // Unlike a policy read, a write must not replace a file we cannot read.
    const { state, corrupt } = readStateFile(stateFilePath);
    if (corrupt) {
      const quarantinePath = `${stateFilePath}.corrupt.${Date.now()}.${randomUUID()}`;
      copyFileSync(stateFilePath, quarantinePath, constants.COPYFILE_EXCL);
      chmodSync(quarantinePath, 0o600);
    }
    const result = fn(structuredClone(state));
    const session = result[sessionId];
    if (!validSession(session) || !validMode(session.tracing)) {
      throw new Error("Explicit trace command must supply a valid session and tracing mode");
    }
    const selected: StoredSession = { ...session };
    delete selected[CONSENT_KEY];
    if ((state as StoredState)[FAIL_CLOSED_KEY] && selected.tracing === "full") {
      selected[CONSENT_KEY] = true;
    }
    const updated = { ...state, [sessionId]: selected };
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
  if (session[CONSENT_KEY] !== undefined && session[CONSENT_KEY] !== true) return false;
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

function readStateFile(stateFilePath: string): { state: TracingState; corrupt: boolean } {
  let contents: string;
  try {
    contents = readFileSync(stateFilePath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { state: {}, corrupt: false };
    throw error;
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(contents);
  } catch {
    return { state: failClosedState(), corrupt: true };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { state: failClosedState(), corrupt: true };
  }
  let corrupt = parsed[FAIL_CLOSED_KEY] !== undefined && parsed[FAIL_CLOSED_KEY] !== true;
  const state: TracingState = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (key === FAIL_CLOSED_KEY) continue;
    if (validSession(value)) {
      // Define own properties so unusual ids such as __proto__ stay ordinary data.
      Object.defineProperty(state, key, {
        value: { ...value },
        enumerable: true,
        writable: true,
        configurable: true,
      });
    } else {
      corrupt = true;
    }
  }
  if (corrupt || parsed[FAIL_CLOSED_KEY] === true) {
    (state as StoredState)[FAIL_CLOSED_KEY] = true;
  }
  // A new corruption invalidates all old recovery exceptions, but retains valid
  // records. Completion hooks consume snapshots without consulting getTracingMode.
  if (corrupt) {
    for (const [key, session] of Object.entries(state)) {
      if (key !== FAIL_CLOSED_KEY) delete (session as StoredSession)[CONSENT_KEY];
    }
  }
  if ((state as StoredState)[FAIL_CLOSED_KEY]) {
    for (const id of Object.keys(state)) {
      if (id !== FAIL_CLOSED_KEY) state[id] = getSessionState(state, id);
    }
  }
  return { state, corrupt };
}

export function loadState(stateFilePath: string): TracingState {
  try {
    return readStateFile(stateFilePath).state;
  } catch {
    // EACCES, EPERM, EIO, ENOTDIR, etc. are not evidence of a fresh install.
    return failClosedState();
  }
}

function writeStateFile(stateFilePath: string, state: TracingState): void {
  mkdirSync(dirname(stateFilePath), { recursive: true });
  const tempPath = `${stateFilePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(tempPath, JSON.stringify(state, null, 2), { mode: 0o600, flag: "wx" });
    // All fallible preparation happens before replacing the authoritative file.
    chmodSync(tempPath, 0o600);
    renameSync(tempPath, stateFilePath);
  } finally {
    try {
      unlinkSync(tempPath);
    } catch {}
  }
}

export function saveState(stateFilePath: string, state: TracingState): void {
  writeStateFile(stateFilePath, state);
}

export function getTracingMode(state: TracingState, sessionId: string): TracingMode {
  const stored = state as StoredState;
  const session = stored[sessionId] as StoredSession | undefined;
  if (stored[FAIL_CLOSED_KEY]) {
    return validSession(session) && session.tracing === "full" && session[CONSENT_KEY] === true
      ? "full"
      : "metadata";
  }
  if (!session) return "full";
  return session.tracing === "metadata" ? "metadata" : "full";
}

export function parseTraceCommand(prompt: string): "on" | "off" | "status" | undefined {
  const match = /^\/ls-trace (on|off|status)$/.exec(prompt);
  return match?.[1] as "on" | "off" | "status" | undefined;
}

export function traceCommandResponse(mode: TracingMode, masterEnabled = true): string {
  let reason: string;
  if (!masterEnabled) reason = "LangSmith tracing is off because the master switch is disabled.";
  else if (mode === "full") reason = "LangSmith tracing is on for this thread.";
  else reason = "LangSmith tracing is off for this thread (metadata only).";
  return JSON.stringify({ decision: "block", reason });
}

function failClosedSnapshots(session: SessionState): SessionState {
  const downgrade = <T extends { tracing?: TracingMode }>(entries: Record<string, T>) =>
    Object.fromEntries(
      Object.entries(entries).map(([id, entry]) => [
        id,
        entry?.tracing === "full" ? { ...entry, tracing: "metadata" as const } : entry,
      ]),
    );
  return {
    ...session,
    ...(session.current_turn_tracing === "full" && { current_turn_tracing: "metadata" }),
    ...(session.compaction_tracing === "full" && { compaction_tracing: "metadata" }),
    ...(session.open_turns && { open_turns: downgrade(session.open_turns) }),
    ...(session.task_run_map && { task_run_map: downgrade(session.task_run_map) }),
    ...(session.tool_launch_contexts && {
      tool_launch_contexts: downgrade(session.tool_launch_contexts),
    }),
  };
}

export function getSessionState(state: TracingState, sessionId: string): SessionState {
  const session = state[sessionId];
  if (!validSession(session)) {
    return { last_line: -1, turn_count: 0, updated: "", task_run_map: {} };
  }
  // Also protect callers supplying a sentinel-bearing state directly. Ordinary
  // /ls-trace off must retain launch-time consent; only global fail-closed recovery
  // overrides snapshots, and explicit renewed consent permits newly full ones.
  return (state as StoredState)[FAIL_CLOSED_KEY] && getTracingMode(state, sessionId) !== "full"
    ? failClosedSnapshots(session)
    : session;
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

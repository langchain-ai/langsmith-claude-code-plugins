import { mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  PENDING_STATE_ABANDONED_MS,
  PENDING_STATE_DIR_SUFFIX,
  PENDING_STATE_FILE_SUFFIX,
  PENDING_STATE_SEQUENCE_WIDTH,
  PENDING_STATE_TIME_WIDTH,
  PENDING_STATE_WRITE_ATTEMPTS,
  PENDING_STATE_TEMP_SUFFIX,
  PRIVATE_DIR_MODE,
  PRIVATE_FILE_MODE,
  STATE_LOCK_BUSY_MEMORY_MS,
} from "./constants.js";
import type {
  PendingStatePatches,
  SessionState,
  StatePatch,
  StatePatchOperation,
  TracingState,
} from "./types.js";
import { publishByRename } from "./utils/atomic-file.js";
import { isRecord } from "./utils/records.js";

let sequence = 0;

const same = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

function diffValue(
  path: string[],
  before: unknown,
  after: unknown,
  operations: StatePatchOperation[],
): void {
  if (same(before, after)) return;
  if (isRecord(before) && isRecord(after)) {
    for (const key of Object.keys(before)) {
      if (before[key] !== undefined && after[key] === undefined) {
        operations.push({ path: [...path, key], unset: true });
      }
    }
    for (const [key, value] of Object.entries(after)) {
      if (value !== undefined) diffValue([...path, key], before[key], value, operations);
    }
  } else if (Array.isArray(before) && Array.isArray(after)) {
    const kept = new Set(after.map((item) => JSON.stringify(item)));
    const known = new Set(before.map((item) => JSON.stringify(item)));
    const add = after.filter((item) => !known.has(JSON.stringify(item)));
    const remove = before.filter((item) => !kept.has(JSON.stringify(item)));
    operations.push({ path, add, remove });
  } else {
    operations.push({ path, set: after });
  }
}

export function diffState(before: TracingState, after: TracingState): StatePatch {
  const patch: StatePatch = [];
  for (const session of Object.keys(before)) {
    if (!Object.hasOwn(after, session)) patch.push({ session, removed: true });
  }
  for (const [session, next] of Object.entries(after)) {
    const operations: StatePatchOperation[] = [];
    if (Object.hasOwn(before, session)) diffValue([], before[session], next, operations);
    else operations.push({ path: [], set: next });
    if (operations.length > 0) patch.push({ session, operations });
  }
  return patch;
}

function applyOperation(root: unknown, operation: StatePatchOperation): unknown {
  const { path } = operation;
  if (path.length === 0) return operation.set;
  const [key, ...rest] = path;
  const node: Record<string, unknown> = isRecord(root) ? { ...root } : {};
  if (rest.length > 0) {
    node[key] = applyOperation(node[key], { ...operation, path: rest });
  } else if (operation.unset) {
    delete node[key];
  } else if (operation.add || operation.remove) {
    node[key] = mergeList(node[key], operation);
  } else {
    node[key] = operation.set;
  }
  return node;
}

function mergeList(current: unknown, operation: StatePatchOperation): unknown[] {
  const removed = new Set((operation.remove ?? []).map((item) => JSON.stringify(item)));
  const list = (Array.isArray(current) ? current : []).filter(
    (item) => !removed.has(JSON.stringify(item)),
  );
  const present = new Set(list.map((item) => JSON.stringify(item)));
  for (const item of operation.add ?? []) {
    if (!present.has(JSON.stringify(item))) list.push(item);
  }
  return list;
}

export function applyPatches(state: TracingState, patches: readonly StatePatch[]): TracingState {
  let result = state;
  for (const patch of patches) {
    for (const entry of patch) {
      if (entry.removed) {
        result = Object.fromEntries(Object.entries(result).filter(([id]) => id !== entry.session));
        continue;
      }
      let session: unknown = result[entry.session];
      for (const operation of entry.operations ?? []) session = applyOperation(session, operation);
      result = { ...result, [entry.session]: session as SessionState };
    }
  }
  return result;
}

const pendingDirectory = (stateFilePath: string): string =>
  `${stateFilePath}${PENDING_STATE_DIR_SUFFIX}`;

function names(directory: string): string[] {
  try {
    return readdirSync(directory);
  } catch {
    return [];
  }
}

export function writePending(stateFilePath: string, patch: StatePatch): void {
  if (patch.length === 0) return;
  const directory = pendingDirectory(stateFilePath);
  const time = String(Date.now()).padStart(PENDING_STATE_TIME_WIDTH, "0");
  const order = String(sequence++).padStart(PENDING_STATE_SEQUENCE_WIDTH, "0");
  const file = join(directory, `${time}-${order}-${process.pid}${PENDING_STATE_FILE_SUFFIX}`);
  for (let attempt = 1; ; attempt++) {
    try {
      mkdirSync(directory, { recursive: true, mode: PRIVATE_DIR_MODE });
      publishByRename(file, JSON.stringify(patch), PENDING_STATE_TEMP_SUFFIX, PRIVATE_FILE_MODE);
      return;
    } catch (error) {
      if (attempt >= PENDING_STATE_WRITE_ATTEMPTS) throw error;
    }
  }
}

export function readPending(stateFilePath: string): PendingStatePatches {
  const directory = pendingDirectory(stateFilePath);
  const files: string[] = [];
  const patches: StatePatch[] = [];
  for (const name of names(directory)
    .filter((n) => n.endsWith(PENDING_STATE_FILE_SUFFIX))
    .sort()) {
    const file = join(directory, name);
    files.push(file);
    try {
      patches.push(JSON.parse(readFileSync(file, "utf-8")) as StatePatch);
    } catch {
      continue;
    }
  }
  return { files, patches };
}

export function hasRecentPending(stateFilePath: string): boolean {
  const directory = pendingDirectory(stateFilePath);
  return names(directory).some((name) => {
    try {
      return (
        name.endsWith(PENDING_STATE_FILE_SUFFIX) &&
        Date.now() - statSync(join(directory, name)).mtimeMs < STATE_LOCK_BUSY_MEMORY_MS
      );
    } catch {
      return false;
    }
  });
}

export function removePending(stateFilePath: string, files: readonly string[]): void {
  const directory = pendingDirectory(stateFilePath);
  for (const file of files) rmSync(file, { force: true });
  for (const name of names(directory)) {
    if (name.endsWith(PENDING_STATE_FILE_SUFFIX)) continue;
    const file = join(directory, name);
    try {
      if (Date.now() - statSync(file).mtimeMs > PENDING_STATE_ABANDONED_MS)
        rmSync(file, { force: true });
    } catch {
      continue;
    }
  }
  if (names(directory).length > 0) return;
  try {
    rmdirSync(directory);
  } catch {
    return;
  }
}

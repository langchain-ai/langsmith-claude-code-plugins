/**
 * Sandbox for the upload-queue tests: a throwaway home, a fake LangSmith, and
 * the hook invocations that fill and drain a queue inside them.
 */

import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect } from "vitest";
import { waitFor } from "./wait-for.js";

import { QUEUE_DIR_NAME, QUEUE_FILE_SUFFIX, QUEUE_ID_TIME_WIDTH } from "../constants.js";
import { queueOrigin } from "../queue.js";
import { fakeLangSmith, readLog, spawnHook, turnLines } from "./hook-sandbox.js";

let home: string;

const DAY_MS = 24 * 60 * 60 * 1000;

/** What the fake LangSmith has accepted, and whether it is currently refusing uploads. */
export const uploads = {
  /** Names of the tool runs created, in the order the service accepted them. */
  get received(): string[] {
    return service.created.map((run) => String(run.name)).filter((name) => /^Tool\d+$/.test(name));
  },
  get fail(): boolean {
    return service.fail;
  },
  set fail(value: boolean) {
    service.fail = value;
  },
  get delayMs(): number {
    return service.delayMs;
  },
  set delayMs(value: number) {
    service.delayMs = value;
  },
};

// LangSmith rejects a run that started over a day ago, and everything sent with it.
const service = fakeLangSmith({
  rejects: (body) =>
    [...body.matchAll(/"start_time":"([^"]+)"/g)].some(
      (match) => Date.now() - new Date(match[1]).getTime() >= DAY_MS,
    ),
});

/** Registers the throwaway home and the fake LangSmith for every test in the calling suite. */
export function useQueueSandbox(): void {
  beforeEach(async () => {
    home = mkdtempSync(join(tmpdir(), "ls-queue-"));
    service.reset();
    await service.listen();
  });

  afterEach(async () => {
    const pids = [
      ...readLog(join(home, "hook.log")).matchAll(/Started detached queue flusher \(pid (\d+)\)/g),
    ].map((match) => Number(match[1]));
    expect(await waitFor(() => pids.every((pid) => !processIsRunning(pid)))).toBe(true);
    await service.close();
    rmSync(home, { recursive: true, force: true });
  });
}

function processIsRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function env() {
  return {
    PATH: process.env.PATH ?? "",
    HOME: home,
    TRACE_TO_LANGSMITH: "true",
    CC_LANGSMITH_DEBUG: "true",
    CC_LANGSMITH_API_KEY: "test-key",
    LANGSMITH_API_KEY: "test-key",
    LANGSMITH_ENDPOINT: service.endpoint,
    CC_LANGSMITH_PROJECT: "queue-test",
    STATE_FILE: join(home, "state.json"),
    CC_LANGSMITH_LOG_FILE: join(home, "hook.log"),
    CLAUDE_PROJECT_DIR: home,
    CLAUDE_PLUGIN_ROOT: home,
  };
}

export const sandboxHome = () => home;

export const transcript = () => join(home, "transcript.jsonl");

const lines = (turn: number) =>
  turnLines({ turn, model: "claude-opus-4", prompt: "hi", reply: "ok" });

export function writeTranscript() {
  writeFileSync(transcript(), lines(1));
}

export function appendTurnToTranscript(turn: number) {
  const existing = existsSync(transcript()) ? readFileSync(transcript(), "utf8") : "";
  writeFileSync(transcript(), existing + lines(turn));
}

/** Rewrites an entry's name so the queue reads it as queued `ms` ago. */
export function ageOldestRecord(sessionId: string, ms: number) {
  const dir = queueDirFor(sessionId);
  const [oldest] = readdirSync(dir)
    .filter((name) => name.endsWith(QUEUE_FILE_SUFFIX))
    .sort();
  const aged = String(Date.now() - ms).padStart(QUEUE_ID_TIME_WIDTH, "0");
  renameSync(join(dir, oldest), join(dir, `${aged}${oldest.slice(QUEUE_ID_TIME_WIDTH)}`));
}

/** The hook log for the sandbox home, which is where a warning about a dropped run lands. */
export const hookLog = () => readLog(join(home, "hook.log"));

export function hook(
  event: string,
  payload: Record<string, unknown>,
  overrides: Record<string, string> = {},
): Promise<void> {
  return spawnHook({
    event,
    payload: { session_id: "s1", transcript_path: transcript(), cwd: home, ...payload },
    cwd: home,
    env: { ...env(), ...overrides },
  });
}

export async function startTurn(): Promise<void> {
  writeTranscript();
  await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
}

export const newSession = (sessionId: string) =>
  hook("UserPromptSubmit", {
    session_id: sessionId,
    hook_event_name: "UserPromptSubmit",
    prompt: "hi",
  });

export const stopTurn = (sessionId = "s1") =>
  hook("Stop", { session_id: sessionId, hook_event_name: "Stop", stop_hook_active: false });

export function ageQueueDir(sessionId: string, ms: number) {
  const aged = new Date(Date.now() - ms);
  utimesSync(queueDirFor(sessionId), aged, aged);
}

export function toolCall(index: number, sessionId = "s1") {
  return hook("PostToolUse", {
    session_id: sessionId,
    hook_event_name: "PostToolUse",
    tool_name: `Tool${index}`,
    tool_use_id: `t${index}`,
    tool_input: { index },
    tool_response: { out: index },
  });
}

export const queueRoot = () => join(home, QUEUE_DIR_NAME);

export const queueDirFor = (sessionId = "s1") => join(queueRoot(), sessionId);

export function currentQueueOrigin(): string {
  return queueOrigin({ apiKey: "test-key", apiBaseUrl: service.endpoint, redact: true });
}

export function entryFiles(sessionId = "s1"): string[] {
  const dir = queueDirFor(sessionId);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(QUEUE_FILE_SUFFIX))
    .sort()
    .map((name) => join(dir, name));
}

export function sandboxFiles(): string[] {
  const pending = [home];
  const files: string[] = [];
  while (pending.length > 0) {
    const directory = pending.pop();
    if (!directory) continue;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) pending.push(path);
      else files.push(path);
    }
  }
  return files;
}

export function queued(
  sessionId = "s1",
): Array<{ attempts: number; origin: string; run: { name: string } }> {
  return entryFiles(sessionId).map((path) => JSON.parse(readFileSync(path, "utf8")));
}

/** A record written straight to disk, so no hook runs and no uploader is started for it. */
export function queueRunByHand(
  name: string,
  options: {
    sessionId?: string;
    queuedAgoMs?: number;
    startedAgoMs?: number;
    origin?: string;
  } = {},
): string {
  const {
    sessionId = "s1",
    queuedAgoMs = 0,
    startedAgoMs = 0,
    origin = "another-account",
  } = options;
  const dir = queueDirFor(sessionId);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const queuedAt = Date.now() - queuedAgoMs;
  const queueId = `${String(queuedAt).padStart(QUEUE_ID_TIME_WIDTH, "0")}-${randomUUID()}`;
  const path = join(dir, `${queueId}${QUEUE_FILE_SUFFIX}`);
  writeFileSync(
    path,
    JSON.stringify({
      tracing: "full",
      attempts: 0,
      origin,
      run: {
        id: randomUUID(),
        name,
        run_type: "tool",
        project_name: "queue-test",
        start_time: new Date(Date.now() - startedAgoMs).toISOString(),
        end_time: new Date().toISOString(),
        trace_id: randomUUID(),
        dotted_order: "20250101T000000000000Z00000000-0000-0000-0000-000000000000",
      },
    }),
    { mode: 0o600 },
  );
  return path;
}

export { waitFor } from "./wait-for.js";

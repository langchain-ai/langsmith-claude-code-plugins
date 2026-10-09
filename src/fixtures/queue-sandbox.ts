/**
 * Sandbox for the upload-queue tests: a throwaway home, a fake LangSmith, and
 * the hook invocations that fill and drain a queue inside them.
 */

import {
  existsSync,
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
import { afterEach, beforeEach } from "vitest";

import { QUEUE_DIR_NAME, QUEUE_FILE_SUFFIX, QUEUE_ID_TIME_WIDTH } from "../constants.js";
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
    await service.close();
    rmSync(home, { recursive: true, force: true });
  });
}

function env() {
  return {
    PATH: process.env.PATH ?? "",
    HOME: home,
    TRACE_TO_LANGSMITH: "true",
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

/** Backdates the oldest record's run so the queue reads it as started `ms` ago. */
export function ageOldestRun(ms: number, sessionId = "s1") {
  const oldest = entryFiles(sessionId)[0];
  const entry = JSON.parse(readFileSync(oldest, "utf8"));
  entry.run.start_time = new Date(Date.now() - ms).toISOString();
  writeFileSync(oldest, JSON.stringify(entry));
}

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

export function entryFiles(sessionId = "s1"): string[] {
  const dir = queueDirFor(sessionId);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(QUEUE_FILE_SUFFIX))
    .sort()
    .map((name) => join(dir, name));
}

export function queued(sessionId = "s1"): Array<{ attempts: number; run: { name: string } }> {
  return entryFiles(sessionId).map((path) => JSON.parse(readFileSync(path, "utf8")));
}

export { waitFor } from "./wait-for.js";

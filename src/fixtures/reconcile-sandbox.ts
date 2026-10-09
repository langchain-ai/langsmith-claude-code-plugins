/**
 * Setup for the end-of-turn reconcile tests: two real repositories, a folder in
 * neither, and the hooks that drive the built plugin against them.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { QUEUE_DIR_NAME, TURN_RECORD_DIR_NAME, TURN_RECORD_SUFFIX } from "../constants.js";
import { createGitSandbox } from "./git-sandbox.js";
import { fakeLangSmith, readLog, spawnHook, turnLines } from "./hook-sandbox.js";
import { waitFor } from "./wait-for.js";

export const sandbox = createGitSandbox("ls reconcile e2e ");
export const alpha = sandbox.makeRepo(
  "alpha repo",
  "trunk-a",
  "Alpha Owner",
  "git@github.com:acme/a.git",
);
export const plain = sandbox.makeDir(sandbox.root, "plain folder");

/** Runs the service has seen finish, which it will accept no further update for. */
const finished = new Set<string>();

export const service = fakeLangSmith({
  rejectsRun({ action, run }) {
    if (action === "post") {
      if (run.end_time) finished.add(run.id);
      return undefined;
    }
    // A finished run takes no further update: a turn's own run is refused outright,
    // and a call below it is accepted and then quietly dropped.
    if (finished.has(run.id)) {
      if (!run.parent_run_id) {
        return { status: 409, body: '{"error":"Run update payload already received."}' };
      }
      return "ignore";
    }
    if (run.end_time) finished.add(run.id);
    return undefined;
  },
});

export function useReconcileSandbox(): void {
  beforeAll(() => service.listen(), 60_000);

  beforeEach(() => {
    service.reset();
    finished.clear();
  });

  afterEach(async () => {
    await waitFor(() => !existsSync(join(sandbox.root, QUEUE_DIR_NAME)), 5_000);
  });

  afterAll(async () => {
    await service.close();
    sandbox.remove();
  });
}

export function hook(
  event: string,
  payload: Record<string, unknown>,
  overrides: Record<string, string> = {},
): Promise<void> {
  return spawnHook({
    event,
    payload,
    cwd: String(payload.cwd ?? plain),
    env: {
      ...sandbox.env,
      PATH: process.env.PATH ?? "",
      TRACE_TO_LANGSMITH: "true",
      LANGSMITH_API_KEY: "lsv2_pt_fake_key_for_tests",
      LANGSMITH_ENDPOINT: service.endpoint,
      CC_LANGSMITH_PROJECT: "reconcile-e2e",
      CC_LANGSMITH_LOG_FILE: join(sandbox.root, "hook.log"),
      STATE_FILE: join(sandbox.root, "state.json"),
      ...overrides,
    },
  });
}

/**
 * The reply Claude Code writes down once a turn is over. It must arrive after the
 * prompt hook, which skips to the end of whatever the transcript already holds.
 */
export function reply(base: { transcript_path: string }, turn = 1): void {
  writeFileSync(
    base.transcript_path,
    turnLines({ turn, model: "claude-sonnet-4-5-20250929", prompt: "go", reply: "done" }),
  );
}

export const prompt = (base: Record<string, unknown>) =>
  hook("UserPromptSubmit", { ...base, hook_event_name: "UserPromptSubmit", prompt: "go" });

export const stop = (base: Record<string, unknown>) =>
  hook("Stop", { ...base, hook_event_name: "Stop", last_assistant_message: "done" });

export const tool = (base: Record<string, unknown>, name: string, input: Record<string, unknown>) =>
  hook("PostToolUse", {
    ...base,
    hook_event_name: "PostToolUse",
    tool_name: name,
    tool_use_id: `use-${name}`,
    tool_input: input,
    tool_response: { ok: true },
  });

/** The metadata each named run ended up with, the newest write for that run winning. */
export function metadataOf(name: string): Record<string, unknown> {
  const writes = [...service.created, ...service.updated].filter((run) => run.name === name);
  return writes.at(-1)?.extra?.metadata ?? {};
}

export function createdMetadataOf(sessionId: string, name: string): Record<string, unknown> {
  const run = service.created.find(
    (candidate) => candidate.name === name && candidate.extra?.metadata?.thread_id === sessionId,
  );
  return run?.extra?.metadata ?? {};
}

export const recordDir = (sessionId: string) => join(sandbox.root, TURN_RECORD_DIR_NAME, sessionId);

export function recordFiles(sessionId: string): string[] {
  const dir = recordDir(sessionId);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith(TURN_RECORD_SUFFIX));
}

export function recordLines(sessionId: string): Array<Record<string, any>> {
  const [only] = recordFiles(sessionId);
  if (!only) return [];
  return readFileSync(join(recordDir(sessionId), only), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/** What the hooks and the detached uploader have written down. */
export const hookLog = () => readLog(join(sandbox.root, "hook.log"));

export { waitFor };

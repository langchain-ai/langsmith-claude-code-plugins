/**
 * Setup for the end-of-turn reconcile tests: two real repositories, a folder in
 * neither, and the hooks that drive the built plugin against them.
 */

import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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
export const beta = sandbox.makeRepo(
  "beta repo",
  "trunk-b",
  "Beta Owner",
  "https://gitlab.com/acme/b",
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

export function appendReply(base: { transcript_path: string }, turn: number): void {
  appendFileSync(
    base.transcript_path,
    turnLines({ turn, model: "claude-sonnet-4-5-20250929", prompt: "go", reply: "done" }),
  );
}

export const prompt = (base: Record<string, unknown>) =>
  hook("UserPromptSubmit", { ...base, hook_event_name: "UserPromptSubmit", prompt: "go" });

export const stop = (base: Record<string, unknown>) =>
  hook("Stop", { ...base, hook_event_name: "Stop", last_assistant_message: "done" });

export const notification = (base: Record<string, unknown>, agentId: string, status?: string) =>
  hook("UserPromptSubmit", {
    ...base,
    hook_event_name: "UserPromptSubmit",
    prompt: `<task-notification>${agentId}${status ? `<status>${status}</status>` : ""}</task-notification>`,
  });

export const task = (base: Record<string, unknown>, agentId: string) =>
  hook("PostToolUse", {
    ...base,
    hook_event_name: "PostToolUse",
    tool_name: "Task",
    tool_use_id: `use-${agentId}`,
    tool_input: { prompt: "go and look" },
    tool_response: { agentId },
  });

export function subagent(base: Record<string, unknown>, agentId: string): Promise<void> {
  const path = join(plain, `${agentId}.jsonl`);
  writeFileSync(
    path,
    turnLines({ turn: 1, model: "claude-sonnet-4-5-20250929", prompt: "look", reply: "looked" }),
  );
  return hook("SubagentStop", {
    ...base,
    hook_event_name: "SubagentStop",
    agent_id: agentId,
    agent_type: "Explore",
    agent_transcript_path: path,
  });
}

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
  const created = service.created.filter((run) => run.name === name).at(-1);
  if (!created) return {};
  const metadata = { ...created.extra?.metadata };
  for (const update of service.updated.filter((run) => run.id === created.id)) {
    Object.assign(metadata, update.extra?.metadata);
  }
  return metadata;
}

export function createdMetadataAll(
  sessionId: string,
  name: string,
): Array<Record<string, unknown>> {
  return service.created
    .filter((candidate) => candidate.name === name)
    .map((candidate) => candidate.extra?.metadata ?? {})
    .filter((metadata) => metadata.thread_id === sessionId);
}

export function createdMetadataOf(sessionId: string, name: string): Record<string, unknown> {
  return createdMetadataAll(sessionId, name)[0] ?? {};
}

export const recordDir = (sessionId: string) => join(sandbox.root, TURN_RECORD_DIR_NAME, sessionId);

export function recordFiles(sessionId: string): string[] {
  try {
    return readdirSync(recordDir(sessionId)).filter((name) => name.endsWith(TURN_RECORD_SUFFIX));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
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

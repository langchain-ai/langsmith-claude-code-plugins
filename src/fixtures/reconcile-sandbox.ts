/**
 * Setup for the end-of-turn reconcile tests: two real repositories, a folder in
 * neither, a fake LangSmith that can be made slow or unavailable, and the hooks
 * that drive the built plugin against them.
 */

import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { QUEUE_DIR_NAME, TURN_RECORD_DIR_NAME, TURN_RECORD_SUFFIX } from "../constants.js";
import { createGitSandbox } from "./git-sandbox.js";
import { wireRuns } from "./langsmith-wire.js";
import { waitFor } from "./wait-for.js";

const bundle = fileURLToPath(new URL("../../bundle/dispatch.js", import.meta.url));

/** What the fake LangSmith has seen, and how it is behaving. */
export const service = {
  created: [] as Array<Record<string, any>>,
  updated: [] as Array<Record<string, any>>,
  fail: false,
  delayMs: 0,
  /** Refuse only the requests whose body mentions this, so one run can fail on its own. */
  refuse: "",
};

const INFO = {
  version: "0.0.0",
  instance_flags: {},
  batch_ingest_config: { use_multipart_endpoint: true, size_limit: 100 },
};

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

let server: Server;
let endpoint: string;
/** Runs the service has seen finish, which it will accept no further update for. */
const finished = new Set<string>();

export function useReconcileSandbox(): void {
  beforeAll(async () => {
    server = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk) => chunks.push(chunk as Buffer));
      const answer = () => {
        response.setHeader("content-type", "application/json");
        if (request.url?.includes("/info")) {
          response.end(JSON.stringify(INFO));
          return;
        }
        const body = Buffer.concat(chunks).toString("utf8");
        if (service.fail || (service.refuse && body.includes(service.refuse))) {
          response.writeHead(400);
          response.end("{}");
          return;
        }
        for (const { action, run } of wireRuns(request.url ?? "", request.method ?? "POST", body)) {
          if (action === "post") {
            service.created.push(run);
            if (run.end_time) finished.add(run.id);
            continue;
          }
          // A finished run takes no further update: a turn's own run is refused outright,
          // and a call below it is accepted and then quietly dropped.
          if (finished.has(run.id)) {
            if (!run.parent_run_id) {
              response.writeHead(409);
              response.end('{"error":"Run update payload already received."}');
              return;
            }
            continue;
          }
          if (run.end_time) finished.add(run.id);
          service.updated.push(run);
        }
        response.writeHead(202);
        response.end("{}");
      };
      request.on("end", () => {
        if (service.delayMs > 0) setTimeout(answer, service.delayMs);
        else answer();
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    endpoint = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
  }, 60_000);

  beforeEach(() => {
    service.created = [];
    service.updated = [];
    service.fail = false;
    service.delayMs = 0;
    service.refuse = "";
    finished.clear();
  });

  afterEach(async () => {
    await waitFor(() => !existsSync(join(sandbox.root, QUEUE_DIR_NAME)), 5_000);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    sandbox.remove();
  });
}

export function hook(
  event: string,
  payload: Record<string, unknown>,
  overrides: Record<string, string> = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bundle, event], {
      cwd: String(payload.cwd ?? plain),
      env: {
        ...sandbox.env,
        PATH: process.env.PATH ?? "",
        TRACE_TO_LANGSMITH: "true",
        LANGSMITH_API_KEY: "lsv2_pt_fake_key_for_tests",
        LANGSMITH_ENDPOINT: endpoint,
        CC_LANGSMITH_PROJECT: "reconcile-e2e",
        CC_LANGSMITH_LOG_FILE: join(sandbox.root, "hook.log"),
        STATE_FILE: join(sandbox.root, "state.json"),
        ...overrides,
      },
    });
    let stderr = "";
    child.stderr.setEncoding("utf-8");
    child.stderr.on("data", (chunk: string) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${event}: ${stderr}`)),
    );
    child.stdin.end(JSON.stringify(payload));
  });
}

/**
 * The reply Claude Code writes down once a turn is over. It must arrive after the
 * prompt hook, which skips to the end of whatever the transcript already holds.
 */
export function reply(base: { transcript_path: string }, turn = 1): void {
  const path = base.transcript_path;
  writeFileSync(
    path,
    [
      {
        type: "user",
        promptId: `p${turn}`,
        timestamp: new Date().toISOString(),
        message: { role: "user", content: "go" },
      },
      {
        type: "assistant",
        promptId: `p${turn}`,
        timestamp: new Date().toISOString(),
        message: {
          id: `m${turn}`,
          role: "assistant",
          model: "claude-sonnet-4-5-20250929",
          stop_reason: "end_turn",
          usage: { input_tokens: 1, output_tokens: 1 },
          content: [{ type: "text", text: "done" }],
        },
      },
    ]
      .map((message) => JSON.stringify(message))
      .join("\n") + "\n",
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
export function hookLog(): string {
  try {
    return readFileSync(join(sandbox.root, "hook.log"), "utf8");
  } catch {
    return "";
  }
}

export { waitFor };

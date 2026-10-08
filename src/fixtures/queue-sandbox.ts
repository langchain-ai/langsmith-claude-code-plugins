/**
 * Sandbox for the upload-queue tests: a throwaway home, a fake LangSmith, and
 * the hook invocations that fill and drain a queue inside them.
 */

import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach } from "vitest";

import { QUEUE_DIR_NAME, QUEUE_FILE_SUFFIX, QUEUE_ID_TIME_WIDTH } from "../constants.js";

const bundle = fileURLToPath(new URL("../../bundle/dispatch.js", import.meta.url));

let home: string;
let server: Server;
let endpoint: string;

/** What the fake LangSmith has accepted, and whether it is currently refusing uploads. */
export const uploads = { received: [] as string[], fail: false };

const INFO = {
  version: "0.0.0",
  instance_flags: {},
  batch_ingest_config: { use_multipart_endpoint: true, size_limit: 100 },
};

/** Registers the throwaway home and the fake LangSmith for every test in the calling suite. */
export function useQueueSandbox(): void {
  beforeEach(async () => {
    home = mkdtempSync(join(tmpdir(), "ls-queue-"));
    uploads.received = [];
    uploads.fail = false;
    server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c as Buffer));
      req.on("end", () => {
        if (req.url?.startsWith("/info")) {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(INFO));
          return;
        }
        if (uploads.fail) {
          // 400, not 500: the SDK retries a 5xx with backoff and slows the test down.
          res.writeHead(400);
          res.end("{}");
          return;
        }
        const body = Buffer.concat(chunks).toString("utf8");
        // LangSmith rejects a run that started over a day ago, and everything sent with it.
        for (const match of body.matchAll(/"start_time":"([^"]+)"/g)) {
          if (Date.now() - new Date(match[1]).getTime() < 24 * 60 * 60 * 1000) continue;
          res.writeHead(400);
          res.end("{}");
          return;
        }
        for (const match of body.matchAll(/"name":"(Tool\d+)"/g)) uploads.received.push(match[1]);
        res.writeHead(202, { "content-type": "application/json" });
        res.end("{}");
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    endpoint = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
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
    LANGSMITH_ENDPOINT: endpoint,
    CC_LANGSMITH_PROJECT: "queue-test",
    STATE_FILE: join(home, "state.json"),
    CC_LANGSMITH_LOG_FILE: join(home, "hook.log"),
    CLAUDE_PROJECT_DIR: home,
    CLAUDE_PLUGIN_ROOT: home,
  };
}

export const transcript = () => join(home, "transcript.jsonl");

export function writeTranscript() {
  const now = new Date().toISOString();
  writeFileSync(
    transcript(),
    [
      JSON.stringify({
        type: "user",
        promptId: "p1",
        timestamp: now,
        message: { role: "user", content: "hi" },
      }),
      JSON.stringify({
        type: "assistant",
        promptId: "p1",
        timestamp: now,
        message: {
          id: "m1",
          role: "assistant",
          model: "claude-opus-4",
          stop_reason: "end_turn",
          usage: { input_tokens: 1, output_tokens: 1 },
          content: [{ type: "text", text: "ok" }],
        },
      }),
    ].join("\n") + "\n",
  );
}

export function appendTurnToTranscript(turn: number) {
  const now = new Date().toISOString();
  const lines = [
    JSON.stringify({
      type: "user",
      promptId: `p${turn}`,
      timestamp: now,
      message: { role: "user", content: "hi" },
    }),
    JSON.stringify({
      type: "assistant",
      promptId: `p${turn}`,
      timestamp: now,
      message: {
        id: `m${turn}`,
        role: "assistant",
        model: "claude-opus-4",
        stop_reason: "end_turn",
        usage: { input_tokens: 1, output_tokens: 1 },
        content: [{ type: "text", text: "ok" }],
      },
    }),
  ];
  const existing = existsSync(transcript()) ? readFileSync(transcript(), "utf8") : "";
  writeFileSync(transcript(), existing + lines.join("\n") + "\n");
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
export function hookLog(): string {
  try {
    return readFileSync(join(home, "hook.log"), "utf8");
  } catch {
    return "";
  }
}

/** Backdates the oldest record's run so the queue reads it as started `ms` ago. */
export function ageOldestRun(ms: number, sessionId = "s1") {
  const oldest = entryFiles(sessionId)[0];
  const entry = JSON.parse(readFileSync(oldest, "utf8"));
  entry.run.start_time = new Date(Date.now() - ms).toISOString();
  writeFileSync(oldest, JSON.stringify(entry));
}

// spawnSync would block this process's event loop, and the fake server lives in it.
export function hook(
  event: string,
  payload: Record<string, unknown>,
  overrides: Record<string, string> = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bundle, event], {
      cwd: home,
      env: { ...env(), ...overrides },
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${event} exited ${code}: ${stderr}`));
    });
    child.stdin.end(
      JSON.stringify({ session_id: "s1", transcript_path: transcript(), cwd: home, ...payload }),
    );
  });
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

export async function waitFor(predicate: () => boolean, ms = 20_000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return predicate();
}

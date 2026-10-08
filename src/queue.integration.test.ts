import { spawn, spawnSync } from "node:child_process";
import { createServer, type Server } from "node:http";
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
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { QUEUE_DIR_NAME, QUEUE_FILE_SUFFIX, QUEUE_ID_TIME_WIDTH } from "./constants.js";

const bundle = fileURLToPath(new URL("../bundle/dispatch.js", import.meta.url));

let home: string;
let server: Server;
let endpoint: string;
let received: string[];
let failUploads: boolean;

const INFO = {
  version: "0.0.0",
  instance_flags: {},
  batch_ingest_config: { use_multipart_endpoint: true, size_limit: 100 },
};

beforeEach(async () => {
  home = mkdtempSync(join(tmpdir(), "ls-queue-"));
  received = [];
  failUploads = false;
  server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => {
      if (req.url?.startsWith("/info")) {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(INFO));
        return;
      }
      if (failUploads) {
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
      for (const match of body.matchAll(/"name":"(Tool\d+)"/g)) received.push(match[1]);
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

const transcript = () => join(home, "transcript.jsonl");

function writeTranscript() {
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

function appendTurnToTranscript(turn: number) {
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
function ageOldestRecord(sessionId: string, ms: number) {
  const dir = queueDirFor(sessionId);
  const [oldest] = readdirSync(dir)
    .filter((name) => name.endsWith(QUEUE_FILE_SUFFIX))
    .sort();
  const aged = String(Date.now() - ms).padStart(QUEUE_ID_TIME_WIDTH, "0");
  renameSync(join(dir, oldest), join(dir, `${aged}${oldest.slice(QUEUE_ID_TIME_WIDTH)}`));
}

// spawnSync would block this process's event loop, and the fake server lives in it.
function hook(event: string, payload: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bundle, event], { cwd: home, env: env() });
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

function toolCall(index: number, sessionId = "s1") {
  return hook("PostToolUse", {
    session_id: sessionId,
    hook_event_name: "PostToolUse",
    tool_name: `Tool${index}`,
    tool_use_id: `t${index}`,
    tool_input: { index },
    tool_response: { out: index },
  });
}

const queueDirFor = (sessionId = "s1") => join(home, QUEUE_DIR_NAME, sessionId);

function entryFiles(sessionId = "s1"): string[] {
  const dir = queueDirFor(sessionId);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(QUEUE_FILE_SUFFIX))
    .sort()
    .map((name) => join(dir, name));
}

function queued(sessionId = "s1"): Array<{ attempts: number; run: { name: string } }> {
  return entryFiles(sessionId).map((path) => JSON.parse(readFileSync(path, "utf8")));
}

async function waitFor(predicate: () => boolean, ms = 20_000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return predicate();
}

describe("the detached upload queue", { timeout: 60_000 }, () => {
  // Catches a PostToolUse that uploads inline again (no saving), and a queued run
  // that never reaches LangSmith at all. No other test drives an upload end to end.
  it("uploads a run the tool hook queued without waiting on the network", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);

    expect(received).toEqual([]);
    expect(queued()).toHaveLength(1);

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => received.includes("Tool0"))).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
  });

  // Catches a flusher that uploads newest-first or concurrently, which would break
  // the ordering the old one-hook-at-a-time upload gave for free.
  it("uploads several queued tool calls in the order they ran", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    for (let index = 0; index < 5; index++) await toolCall(index);

    expect(queued().map((entry) => entry.run.name)).toEqual([
      "Tool0",
      "Tool1",
      "Tool2",
      "Tool3",
      "Tool4",
    ]);

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => received.length >= 5)).toBe(true);
    expect(received).toEqual(["Tool0", "Tool1", "Tool2", "Tool3", "Tool4"]);
  });

  // Catches an entry deleted before its upload was confirmed, which loses the run
  // silently because nothing is left to notice a detached failure.
  it("keeps a run whose upload failed and uploads it on the next flush", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);

    failUploads = true;
    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(
      await waitFor(() => {
        const entries = queued();
        return entries.length === 1 && entries[0].attempts === 1;
      }),
    ).toBe(true);
    expect(received).toEqual([]);

    failUploads = false;
    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => received.includes("Tool0"))).toBe(true);
  });

  // Catches a queue that serialises appends behind a lock, where one hook giving up on
  // a lock a dead hook left behind silently overwrites every run queued beside it.
  it("uploads every parallel tool call when a dead hook left a lock behind", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });

    mkdirSync(join(home, QUEUE_DIR_NAME), { recursive: true });
    writeFileSync(join(home, QUEUE_DIR_NAME, `s1${QUEUE_FILE_SUFFIX}.lock`), "");

    const names = Array.from({ length: 12 }, (_, index) => `Tool${index}`);
    await Promise.all(names.map((_, index) => toolCall(index)));

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => received.length >= names.length)).toBe(true);
    expect([...received].sort()).toEqual([...names].sort());
  });

  // Catches a sweep that never runs, or one that throws leftovers away the way
  // pruneOldSessions throws away stale state.
  it("flushes a queue left behind by a session whose records went stale", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);
    expect(queued()).toHaveLength(1);

    ageOldestRecord("s1", 3 * 60 * 60 * 1000);

    await hook("UserPromptSubmit", {
      session_id: "s2",
      hook_event_name: "UserPromptSubmit",
      prompt: "a new session",
    });

    expect(await waitFor(() => received.includes("Tool0"))).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
  });

  // Catches a flush that helps itself to a folder still being written by a live
  // session elsewhere, which is how two uploaders end up on one folder.
  it("leaves another session's recent folder completely alone", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);
    await hook("UserPromptSubmit", {
      session_id: "s2",
      hook_event_name: "UserPromptSubmit",
      prompt: "a second live session",
    });
    await toolCall(1, "s2");

    // s2 takes a turn. s1's folder was written moments ago, so it is not s2's to touch.
    await hook("Stop", { session_id: "s2", hook_event_name: "Stop", stop_hook_active: false });

    expect(await waitFor(() => received.includes("Tool1"))).toBe(true);
    expect(queued("s1")).toHaveLength(1);
    expect(existsSync(queueDirFor("s1"))).toBe(true);
    expect(received).not.toContain("Tool0");
  });

  // Catches a sweep that bins the folder its own session is still filling, so a run
  // queued while the flusher was running disappears.
  it("flushes its own folder every turn, however fresh the records in it are", async () => {
    const turn = async (index: number) => {
      appendTurnToTranscript(index);
      await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
      await toolCall(index);
      await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    };

    await turn(0);
    expect(await waitFor(() => received.includes("Tool0"))).toBe(true);

    // The service is briefly unreachable, so this turn's run has to wait on disk.
    failUploads = true;
    await turn(1);
    expect(await waitFor(() => queued().length === 1)).toBe(true);

    failUploads = false;
    await turn(2);
    expect(await waitFor(() => received.length >= 3)).toBe(true);
    expect([...received].sort()).toEqual(["Tool0", "Tool1", "Tool2"]);
  });

  // Catches two flushers draining one old folder at once, which uploads a run twice
  // and lets one delete the entry the other is still working on.
  it("lets only one of two flushers drain the same old folder", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    for (let index = 0; index < 6; index++) await toolCall(index);

    ageOldestRecord("s1", 3 * 60 * 60 * 1000);

    await Promise.all([
      hook("Stop", { session_id: "s2", hook_event_name: "Stop", stop_hook_active: false }),
      hook("Stop", { session_id: "s3", hook_event_name: "Stop", stop_hook_active: false }),
    ]);

    expect(await waitFor(() => received.length >= 6)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect([...received].sort()).toEqual([0, 1, 2, 3, 4, 5].map((index) => `Tool${index}`));
  });

  // Catches a flusher lock that outlives the flusher, which stops that session
  // uploading for good. No other test leaves a flusher lock behind.
  it("flushes a queue whose previous flusher died still holding the lock", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);

    const dead = spawnSync(process.execPath, ["-e", "process.exit(0)"]);
    writeFileSync(`${queueDirFor()}.flush.lock`, String(dead.pid));

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => received.includes("Tool0"))).toBe(true);
  });

  // Catches a drained folder that outlives its session for good, which only the next
  // session on that machine would ever clear, and never if the plugin is removed.
  it("removes a drained folder nothing has touched for two hours", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);
    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => queued().length === 0)).toBe(true);

    const aged = new Date(Date.now() - 3 * 60 * 60 * 1000);
    utimesSync(queueDirFor(), aged, aged);

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => !existsSync(queueDirFor()))).toBe(true);
  });

  // Catches an empty folder removed in the gap between a session creating it and
  // writing its first record, which loses that record to a vanished directory.
  it("leaves an empty folder created moments ago alone", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);
    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => queued().length === 0)).toBe(true);

    // Drained seconds ago, so another session may still be about to write to it.
    await hook("UserPromptSubmit", {
      session_id: "s2",
      hook_event_name: "UserPromptSubmit",
      prompt: "a new session",
    });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(existsSync(queueDirFor())).toBe(true);
  });

  // Catches a run LangSmith will reject for age being retried forever, and taking
  // every run batched with it down too.
  it("drops a run too old to accept and uploads the ones queued around it", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    for (let index = 0; index < 3; index++) await toolCall(index);

    const middle = entryFiles()[1];
    const entry = JSON.parse(readFileSync(middle, "utf8"));
    entry.run.start_time = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    writeFileSync(middle, JSON.stringify(entry));

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => received.length >= 2)).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
    expect(received).toEqual(["Tool0", "Tool2"]);
  });
});

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { QUEUE_FILE_SUFFIX } from "./constants.js";
import {
  ageOldestRecord,
  appendTurnToTranscript,
  entryFiles,
  hook,
  queueDirFor,
  queueRoot,
  queued,
  toolCall,
  uploads,
  useQueueSandbox,
  waitFor,
  writeTranscript,
} from "./fixtures/queue-sandbox.js";

describe("the detached upload queue", { timeout: 60_000 }, () => {
  useQueueSandbox();

  // Catches a PostToolUse that uploads inline again (no saving), and a queued run
  // that never reaches LangSmith at all. No other test drives an upload end to end.
  it("uploads a run the tool hook queued without waiting on the network", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);

    expect(uploads.received).toEqual([]);
    expect(queued()).toHaveLength(1);

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
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
    expect(await waitFor(() => uploads.received.length >= 5)).toBe(true);
    expect(uploads.received).toEqual(["Tool0", "Tool1", "Tool2", "Tool3", "Tool4"]);
  });

  // Catches an entry deleted before its upload was confirmed, which loses the run
  // silently because nothing is left to notice a detached failure.
  it("keeps a run whose upload failed and uploads it on the next flush", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);

    uploads.fail = true;
    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(
      await waitFor(() => {
        const entries = queued();
        return entries.length === 1 && entries[0].attempts === 1;
      }),
    ).toBe(true);
    expect(uploads.received).toEqual([]);

    uploads.fail = false;
    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
  });

  // Catches a queue that serialises appends behind a lock, where one hook giving up on
  // a lock a dead hook left behind silently overwrites every run queued beside it.
  it("uploads every parallel tool call when a dead hook left a lock behind", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });

    mkdirSync(queueRoot(), { recursive: true });
    writeFileSync(join(queueRoot(), `s1${QUEUE_FILE_SUFFIX}.lock`), "");

    const names = Array.from({ length: 12 }, (_, index) => `Tool${index}`);
    await Promise.all(names.map((_, index) => toolCall(index)));

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => uploads.received.length >= names.length)).toBe(true);
    expect([...uploads.received].sort()).toEqual([...names].sort());
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

    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
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

    expect(await waitFor(() => uploads.received.includes("Tool1"))).toBe(true);
    expect(queued("s1")).toHaveLength(1);
    expect(existsSync(queueDirFor("s1"))).toBe(true);
    expect(uploads.received).not.toContain("Tool0");
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
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);

    // The service is briefly unreachable, so this turn's run has to wait on disk.
    uploads.fail = true;
    await turn(1);
    expect(await waitFor(() => queued().length === 1)).toBe(true);

    uploads.fail = false;
    await turn(2);
    expect(await waitFor(() => uploads.received.length >= 3)).toBe(true);
    expect([...uploads.received].sort()).toEqual(["Tool0", "Tool1", "Tool2"]);
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

    expect(await waitFor(() => uploads.received.length >= 6)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect([...uploads.received].sort()).toEqual([0, 1, 2, 3, 4, 5].map((index) => `Tool${index}`));
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
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
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
    expect(await waitFor(() => uploads.received.length >= 2)).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
    expect(uploads.received).toEqual(["Tool0", "Tool2"]);
  });
});

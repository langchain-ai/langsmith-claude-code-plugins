import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { QUEUE_FILE_SUFFIX, QUEUE_TEMP_SUFFIX } from "./constants.js";
import {
  ageOldestRecord,
  ageOldestRun,
  appendTurnToTranscript,
  entryFiles,
  hook,
  hookLog,
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

  // Catches a folder a dead session drained being left on disk for good, since the
  // session that would have removed it is gone. No other test has a stranger remove one.
  it("removes an abandoned folder another session drained hours ago", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);
    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => queued().length === 0)).toBe(true);

    const aged = new Date(Date.now() - 3 * 60 * 60 * 1000);
    utimesSync(queueDirFor("s1"), aged, aged);

    await hook("Stop", { session_id: "s2", hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => !existsSync(queueDirFor("s1")))).toBe(true);
  });

  // Catches a queue every other account on the machine can read, since a queued run
  // holds the tool input and output verbatim. No other test looks at file permissions.
  it.skipIf(process.platform === "win32")(
    "keeps the queue readable only by its owner",
    async () => {
      writeTranscript();
      await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
      await toolCall(0);

      expect(statSync(queueDirFor("s1")).mode & 0o777).toBe(0o700);
      expect(statSync(entryFiles("s1")[0]).mode & 0o777).toBe(0o600);
    },
  );

  // Catches an account check that reads one record and then uploads the rest anyway, which
  // sends a run to the wrong workspace, and a held-back run going unmentioned in the log.
  it("uploads only the records queued for the account doing the flushing", async () => {
    const otherAccount = { CC_LANGSMITH_API_KEY: "other-key", LANGSMITH_API_KEY: "other-key" };
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);
    await hook(
      "PostToolUse",
      {
        hook_event_name: "PostToolUse",
        tool_name: "Tool1",
        tool_use_id: "t1",
        tool_input: {},
        tool_response: {},
      },
      otherAccount,
    );

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(uploads.received).toEqual(["Tool0"]);
    expect(queued().map((entry) => entry.run.name)).toEqual(["Tool1"]);
    expect(hookLog()).toContain("queued for a different LangSmith account");
  });

  // Catches a run for an account nobody has sitting in front of the queue for good, which
  // strands every run behind it. No other test puts a run too old to accept out of reach.
  it("drops a run for another account once it is too old to accept", async () => {
    const otherAccount = { CC_LANGSMITH_API_KEY: "other-key", LANGSMITH_API_KEY: "other-key" };
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await hook(
      "PostToolUse",
      {
        hook_event_name: "PostToolUse",
        tool_name: "Tool0",
        tool_use_id: "t0",
        tool_input: {},
        tool_response: {},
      },
      otherAccount,
    );
    await toolCall(1);
    ageOldestRun(2 * 24 * 60 * 60 * 1000);

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => uploads.received.includes("Tool1"))).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
  });

  // Catches an age limit that bins every run it cannot date, rather than falling back to
  // when the run was written down. No other test keeps a run with no start time.
  it("keeps a fresh run that never recorded when it started", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);

    const only = entryFiles("s1")[0];
    const entry = JSON.parse(readFileSync(only, "utf8"));
    delete entry.run.start_time;
    writeFileSync(only, JSON.stringify(entry));

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
  });

  // Catches an uploader that re-reads the run it cannot send instead of standing down,
  // which spins forever holding the lock and stops that folder uploading ever again.
  it("stands down and releases the lock when the next run is not its own", async () => {
    const otherAccount = { CC_LANGSMITH_API_KEY: "other-key", LANGSMITH_API_KEY: "other-key" };
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await hook(
      "PostToolUse",
      {
        hook_event_name: "PostToolUse",
        tool_name: "Tool0",
        tool_use_id: "t0",
        tool_input: {},
        tool_response: {},
      },
      otherAccount,
    );
    await toolCall(1);

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => !existsSync(`${queueDirFor("s1")}.flush.lock`), 10_000)).toBe(true);
    expect(queued().map((entry) => entry.run.name)).toEqual(["Tool0", "Tool1"]);
  });

  // Catches an unreadable start time slipping past the age limit, which leaves a run
  // nobody can route in front of the queue for good. No other test corrupts a start time.
  it("drops a run for another account whose start time cannot be read", async () => {
    const otherAccount = { CC_LANGSMITH_API_KEY: "other-key", LANGSMITH_API_KEY: "other-key" };
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await hook(
      "PostToolUse",
      {
        hook_event_name: "PostToolUse",
        tool_name: "Tool0",
        tool_use_id: "t0",
        tool_input: {},
        tool_response: {},
      },
      otherAccount,
    );
    await toolCall(1);

    const oldest = entryFiles("s1")[0];
    const entry = JSON.parse(readFileSync(oldest, "utf8"));
    entry.run.start_time = "not a date";
    writeFileSync(oldest, JSON.stringify(entry));
    ageOldestRecord("s1", 2 * 24 * 60 * 60 * 1000);

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => uploads.received.includes("Tool1"))).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
  });

  // Catches one unreadable record stranding every good record queued behind it, which
  // loses a whole session's traces without anything saying so.
  it("uploads the records queued behind one that cannot be read", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);
    await toolCall(1);
    writeFileSync(entryFiles("s1")[0], "{ truncated");

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => uploads.received.includes("Tool1"))).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
  });

  // Catches a run that keeps failing being binned with nothing written down, so the
  // person has no way to tell a lost trace from one that was never made.
  it("says so in the log when it gives up on a run that keeps failing", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);

    uploads.fail = true;
    for (let attempt = 0; attempt < 5; attempt++) {
      await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
      await waitFor(() => queued().length === 0 || queued()[0].attempts === attempt + 1);
    }

    expect(await waitFor(() => queued().length === 0)).toBe(true);
    expect(hookLog()).toContain("Dropping a queued run after 5 failed uploads");
  });

  // Catches a folder left on disk for good by a hook killed mid-write, since the
  // staged file it leaves behind is invisible to the queue but blocks the removal.
  it("removes an idle folder holding nothing but a half-written record", async () => {
    writeTranscript();
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" });
    await toolCall(0);
    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => queued().length === 0)).toBe(true);

    writeFileSync(join(queueDirFor("s1"), `half-written${QUEUE_TEMP_SUFFIX}`), "{");
    const aged = new Date(Date.now() - 3 * 60 * 60 * 1000);
    utimesSync(queueDirFor("s1"), aged, aged);

    await hook("Stop", { hook_event_name: "Stop", stop_hook_active: false });
    expect(await waitFor(() => !existsSync(queueDirFor("s1")))).toBe(true);
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

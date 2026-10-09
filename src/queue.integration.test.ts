import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { QUEUE_FILE_SUFFIX } from "./constants.js";
import {
  ageOldestRecord,
  ageQueueDir,
  appendTurnToTranscript,
  entryFiles,
  hook,
  hookLog,
  newSession,
  queueDirFor,
  queueRoot,
  queued,
  queueRunByHand,
  startTurn,
  stopTurn,
  toolCall,
  uploads,
  useQueueSandbox,
  waitFor,
} from "./fixtures/queue-sandbox.js";

describe("the detached upload queue", { timeout: 60_000 }, () => {
  useQueueSandbox();

  // Catches a PostToolUse that uploads inline again (no saving), and a queued run
  // that never reaches LangSmith at all. No other test drives an upload end to end.
  it("uploads a run the tool hook queued without waiting on the network", async () => {
    await startTurn();
    await toolCall(0);

    expect(uploads.received).toEqual([]);
    expect(queued()).toHaveLength(1);

    await stopTurn();
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
  });

  // Catches a flusher that uploads newest-first or concurrently, which would break
  // the ordering the old one-hook-at-a-time upload gave for free.
  it("uploads several queued tool calls in the order they ran", async () => {
    await startTurn();
    // A service that answers slowly makes the later calls queue behind the first upload.
    uploads.delayMs = 50;
    for (let index = 0; index < 5; index++) await toolCall(index);
    uploads.delayMs = 0;

    await stopTurn();
    expect(await waitFor(() => uploads.received.length >= 5)).toBe(true);
    expect(uploads.received).toEqual(["Tool0", "Tool1", "Tool2", "Tool3", "Tool4"]);
  });

  // Catches an entry deleted before its upload was confirmed, which loses the run
  // silently because nothing is left to notice a detached failure.
  it("keeps a run whose upload failed and uploads it on the next flush", async () => {
    await startTurn();
    uploads.fail = true;
    await toolCall(0);
    expect(
      await waitFor(() => {
        const entries = queued();
        return entries.length === 1 && entries[0].attempts >= 1;
      }),
    ).toBe(true);
    expect(uploads.received).toEqual([]);

    uploads.fail = false;
    await stopTurn();
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
  });

  // Catches a queue that serialises appends behind a lock, where one hook giving up on
  // a lock a dead hook left behind silently overwrites every run queued beside it.
  it("uploads every parallel tool call when a dead hook left a lock behind", async () => {
    await startTurn();

    mkdirSync(queueRoot(), { recursive: true });
    writeFileSync(join(queueRoot(), `s1${QUEUE_FILE_SUFFIX}.lock`), "");

    const names = Array.from({ length: 12 }, (_, index) => `Tool${index}`);
    await Promise.all(names.map((_, index) => toolCall(index)));

    await stopTurn();
    expect(await waitFor(() => uploads.received.length >= names.length)).toBe(true);
    expect([...uploads.received].sort()).toEqual([...names].sort());
  });

  // Catches a sweep that never runs, or one that throws leftovers away the way
  // pruneOldSessions throws away stale state.
  it("flushes a queue left behind by a session whose records went stale", async () => {
    await startTurn();
    await toolCall(0);
    expect(queued()).toHaveLength(1);

    ageOldestRecord("s1", 3 * 60 * 60 * 1000);

    await newSession("s2");

    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
  });

  // Catches a flush that helps itself to a folder still being written by a live
  // session elsewhere, which is how two uploaders end up on one folder.
  it("leaves another session's recent folder completely alone", async () => {
    await startTurn();
    // The service is briefly down, so this session's own run has to stay on disk.
    uploads.fail = true;
    await toolCall(0);
    expect(await waitFor(() => (queued("s1")[0]?.attempts ?? 0) >= 1)).toBe(true);
    uploads.fail = false;
    await newSession("s2");
    await toolCall(1, "s2");

    // s2 takes a turn. s1's folder was written moments ago, so it is not s2's to touch.
    await stopTurn("s2");

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
      await stopTurn();
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
    await startTurn();
    // One real call, for the account fingerprint; the rest go straight to disk so no
    // uploader of this session's own is ever running while the folder is aged.
    uploads.fail = true;
    await toolCall(0);
    expect(await waitFor(() => (queued("s1")[0]?.attempts ?? 0) >= 1)).toBe(true);
    const { origin } = queued("s1")[0];
    for (let index = 1; index < 6; index++) {
      queueRunByHand(`Tool${index}`, { origin, queuedAgoMs: 60_000 - index });
    }
    ageOldestRecord("s1", 3 * 60 * 60 * 1000);
    uploads.fail = false;

    await Promise.all([stopTurn("s2"), stopTurn("s3")]);

    expect(await waitFor(() => uploads.received.length >= 6)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect([...uploads.received].sort()).toEqual([0, 1, 2, 3, 4, 5].map((index) => `Tool${index}`));
  });

  // Catches a flusher lock that outlives the flusher, which stops that session
  // uploading for good. No other test leaves a flusher lock behind.
  it("flushes a queue whose previous flusher died still holding the lock", async () => {
    await startTurn();
    await toolCall(0);

    const dead = spawnSync(process.execPath, ["-e", "process.exit(0)"]);
    writeFileSync(`${queueDirFor()}.flush.lock`, String(dead.pid));

    await stopTurn();
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
  });

  // Catches a drained folder that outlives its session for good, which only the next
  // session on that machine would ever clear, and never if the plugin is removed.
  it("removes a drained folder nothing has touched for two hours", async () => {
    await startTurn();
    await toolCall(0);
    await stopTurn();
    expect(await waitFor(() => queued().length === 0)).toBe(true);

    ageQueueDir("s1", 3 * 60 * 60 * 1000);

    await stopTurn();
    expect(await waitFor(() => !existsSync(queueDirFor()))).toBe(true);
  });

  // Catches a folder a dead session drained being left on disk for good, since the
  // session that would have removed it is gone. No other test has a stranger remove one.
  it("removes an abandoned folder another session drained hours ago", async () => {
    await startTurn();
    await toolCall(0);
    await stopTurn();
    expect(await waitFor(() => queued().length === 0)).toBe(true);

    ageQueueDir("s1", 3 * 60 * 60 * 1000);

    await stopTurn("s2");
    expect(await waitFor(() => !existsSync(queueDirFor("s1")))).toBe(true);
  });

  // Catches a queue every other account on the machine can read, since a queued run
  // holds the tool input and output verbatim. No other test looks at file permissions.
  it.skipIf(process.platform === "win32")(
    "keeps the queue readable only by its owner",
    async () => {
      await startTurn();
      await toolCall(0);

      expect(statSync(queueDirFor("s1")).mode & 0o777).toBe(0o700);
      expect(statSync(entryFiles("s1")[0]).mode & 0o777).toBe(0o600);
    },
  );

  // Catches an account check that reads one record and then uploads the rest anyway, which
  // sends a run to the wrong workspace, and a held-back run going unmentioned in the log.
  it("uploads only the records queued for the account doing the flushing", async () => {
    await startTurn();
    uploads.fail = true;
    await toolCall(0);
    expect(await waitFor(() => (queued()[0]?.attempts ?? 0) >= 1)).toBe(true);
    uploads.fail = false;
    queueRunByHand("Tool1");

    await stopTurn();
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(uploads.received).toEqual(["Tool0"]);
    expect(queued().map((entry) => entry.run.name)).toEqual(["Tool1"]);
    expect(hookLog()).toContain("queued for a different LangSmith account");
  });

  // Catches a run for an account nobody has sitting in front of the queue for good, which
  // strands every run behind it. No other test puts a run too old to accept out of reach.
  it("drops a run for another account once it is too old to accept", async () => {
    await startTurn();
    queueRunByHand("Tool0", { queuedAgoMs: 1000, startedAgoMs: 2 * 24 * 60 * 60 * 1000 });
    await toolCall(1);

    await stopTurn();
    expect(await waitFor(() => uploads.received.includes("Tool1"))).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
  });

  // Catches an uploader that re-reads the run it cannot send instead of standing down,
  // which spins forever holding the lock and stops that folder uploading ever again.
  it("stands down and releases the lock when the next run is not its own", async () => {
    await startTurn();
    queueRunByHand("Tool0", { queuedAgoMs: 1000 });
    await toolCall(1);

    await stopTurn();
    expect(await waitFor(() => !existsSync(`${queueDirFor("s1")}.flush.lock`), 10_000)).toBe(true);
    expect(queued().map((entry) => entry.run.name)).toEqual(["Tool0", "Tool1"]);
  });

  // Catches a run LangSmith will reject for age being retried forever, and taking
  // every run batched with it down too.
  it("drops a run too old to accept and uploads the ones queued around it", async () => {
    await startTurn();
    uploads.fail = true;
    for (let index = 0; index < 3; index++) await toolCall(index);
    expect(await waitFor(() => (queued()[0]?.attempts ?? 0) >= 1)).toBe(true);

    const middle = entryFiles()[1];
    const entry = JSON.parse(readFileSync(middle, "utf8"));
    entry.run.start_time = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    writeFileSync(middle, JSON.stringify(entry));
    uploads.fail = false;

    await stopTurn();
    expect(await waitFor(() => uploads.received.length >= 2)).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
    expect(uploads.received).toEqual(["Tool0", "Tool2"]);
  });
});

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ageOldestRecord,
  ageQueueDir,
  appendTurnToTranscript,
  entryFiles,
  currentQueueOrigin,
  hook,
  hookLog,
  newSession,
  queueDirFor,
  queued,
  queueRunByHand,
  sandboxFiles,
  sandboxHome,
  startTurn,
  stopTurn,
  toolCall,
  uploads,
  useQueueSandbox,
  waitFor,
} from "./fixtures/queue-sandbox.js";

describe("the detached upload queue", { timeout: 60_000 }, () => {
  useQueueSandbox();

  // Catches a PostToolUse that uploads inline or a saved run that never reaches LangSmith.
  it("uploads a run the tool hook captured without waiting on the network", async () => {
    await startTurn();
    await toolCall(0);

    expect(uploads.received).toEqual([]);
    expect(queued()).toHaveLength(0);

    await stopTurn();
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
  });

  // Catches a flusher that uploads newest-first or concurrently, which would break
  // the ordering the old one-hook-at-a-time upload gave for free.
  it("uploads several queued tool calls in the order they ran", async () => {
    await startTurn();
    uploads.delayMs = 50;
    const origin = currentQueueOrigin();
    for (let index = 0; index < 5; index++) {
      queueRunByHand(`Tool${index}`, { origin, queuedAgoMs: 100 - index });
    }

    await stopTurn();
    expect(await waitFor(() => uploads.received.length >= 5)).toBe(true);
    expect(uploads.received).toEqual(["Tool0", "Tool1", "Tool2", "Tool3", "Tool4"]);
    uploads.delayMs = 0;
  });

  // Catches an entry deleted before its upload was confirmed, which loses the run
  // silently because nothing is left to notice a detached failure.
  it("keeps a run whose upload failed and uploads it on the next flush", async () => {
    await startTurn();
    uploads.fail = true;
    queueRunByHand("Tool0", { origin: currentQueueOrigin() });
    await stopTurn();
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

  it("uploads every parallel tool capture", async () => {
    await startTurn();

    const names = Array.from({ length: 12 }, (_, index) => `Tool${index}`);
    await Promise.all(names.map((_, index) => toolCall(index)));

    await stopTurn();
    expect(await waitFor(() => uploads.received.length >= names.length)).toBe(true);
    expect([...uploads.received].sort()).toEqual([...names].sort());
    expect(await waitFor(() => !existsSync(`${queueDirFor("s1")}.flush.lock`))).toBe(true);
  });

  it("writes no file path for a muted tool call", async () => {
    const muted = { CC_LANGSMITH_DEFAULT_MUTED: "true" };
    const secret = join(sandboxHome(), "secret folder", "notes.txt");
    await hook("UserPromptSubmit", { hook_event_name: "UserPromptSubmit", prompt: "hi" }, muted);
    // The service is down, so the entry stays on disk for this test to read.
    uploads.fail = true;
    await hook(
      "PostToolUse",
      {
        hook_event_name: "PostToolUse",
        tool_name: "Tool0",
        tool_use_id: "t0",
        tool_input: { file_path: secret },
        tool_response: { out: 0 },
      },
      muted,
    );

    const raw = sandboxFiles()
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    expect(raw).not.toContain("secret folder");
  });

  // Catches a sweep that never runs, or one that throws leftovers away the way
  // pruneOldSessions throws away stale state.
  it("flushes a queue left behind by a session whose records went stale", async () => {
    queueRunByHand("Tool0", { origin: currentQueueOrigin() });
    expect(queued()).toHaveLength(1);

    ageOldestRecord("s1", 3 * 60 * 60 * 1000);

    await newSession("s2");

    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
  });

  // Catches a flush that helps itself to a folder still being written by a live
  // session elsewhere, which is how two uploaders end up on one folder.
  it("leaves another session's recent folder completely alone", async () => {
    // The service is briefly down, so this session's own run has to stay on disk.
    await startTurn();
    uploads.fail = true;
    queueRunByHand("Tool0", { origin: currentQueueOrigin() });
    await stopTurn("s1");
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
      queueRunByHand(`Tool${index}`, { origin: currentQueueOrigin() });
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
    expect(await waitFor(() => !existsSync(`${queueDirFor("s1")}.flush.lock`))).toBe(true);
  });

  // Catches two flushers draining one old folder at once, which uploads a run twice
  // and lets one delete the entry the other is still working on.
  it("lets only one of two flushers drain the same old folder", async () => {
    const origin = currentQueueOrigin();
    for (let index = 0; index < 6; index++) {
      queueRunByHand(`Tool${index}`, { origin, queuedAgoMs: 60_000 - index });
    }
    ageOldestRecord("s1", 3 * 60 * 60 * 1000);

    await Promise.all([stopTurn("s2"), stopTurn("s3")]);

    expect(await waitFor(() => uploads.received.length >= 6)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect([...uploads.received].sort()).toEqual([0, 1, 2, 3, 4, 5].map((index) => `Tool${index}`));
  });

  // Catches a flusher lock that outlives the flusher, which stops that session
  // uploading for good. No other test leaves a flusher lock behind.
  it("flushes a queue whose previous flusher died still holding the lock", async () => {
    queueRunByHand("Tool0", { origin: currentQueueOrigin() });

    const dead = spawnSync(process.execPath, ["-e", "process.exit(0)"]);
    writeFileSync(`${queueDirFor()}.flush.lock`, String(dead.pid));

    await stopTurn();
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
  });

  // Catches a drained folder that outlives its session for good, which only the next
  // session on that machine would ever clear, and never if the plugin is removed.
  it("removes a drained folder nothing has touched for two hours", async () => {
    queueRunByHand("Tool0", { origin: currentQueueOrigin() });
    await stopTurn();
    expect(await waitFor(() => queued().length === 0)).toBe(true);

    ageQueueDir("s1", 3 * 60 * 60 * 1000);

    await stopTurn();
    expect(await waitFor(() => !existsSync(queueDirFor()))).toBe(true);
  });

  // Catches a folder a dead session drained being left on disk for good, since the
  // session that would have removed it is gone. No other test has a stranger remove one.
  it("removes an abandoned folder another session drained hours ago", async () => {
    queueRunByHand("Tool0", { origin: currentQueueOrigin() });
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
      queueRunByHand("Tool0", { origin: currentQueueOrigin() });

      expect(statSync(queueDirFor("s1")).mode & 0o777).toBe(0o700);
      expect(statSync(entryFiles("s1")[0]).mode & 0o777).toBe(0o600);
    },
  );

  // Catches an account check that reads one record and then uploads the rest anyway, which
  // sends a run to the wrong workspace, and a held-back run going unmentioned in the log.
  it("uploads only the records queued for the account doing the flushing", async () => {
    uploads.fail = true;
    queueRunByHand("Tool0", { origin: currentQueueOrigin() });
    await stopTurn();
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
    queueRunByHand("Tool0", { queuedAgoMs: 1000, startedAgoMs: 2 * 24 * 60 * 60 * 1000 });
    queueRunByHand("Tool1", { origin: currentQueueOrigin() });

    await stopTurn();
    expect(await waitFor(() => uploads.received.includes("Tool1"))).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
  });

  // Catches an uploader that re-reads the run it cannot send instead of standing down,
  // which spins forever holding the lock and stops that folder uploading ever again.
  it("stands down and releases the lock when the next run is not its own", async () => {
    queueRunByHand("Tool0", { queuedAgoMs: 1000 });
    queueRunByHand("Tool1", { origin: currentQueueOrigin() });

    await stopTurn();
    expect(await waitFor(() => !existsSync(`${queueDirFor("s1")}.flush.lock`), 10_000)).toBe(true);
    expect(queued().map((entry) => entry.run.name)).toEqual(["Tool0", "Tool1"]);
  });

  // Catches a run LangSmith will reject for age being retried forever, and taking
  // every run batched with it down too.
  it("drops a run too old to accept and uploads the ones queued around it", async () => {
    uploads.fail = true;
    const origin = currentQueueOrigin();
    for (let index = 0; index < 3; index++) {
      queueRunByHand(`Tool${index}`, { origin, queuedAgoMs: 100 - index });
    }
    await stopTurn();
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

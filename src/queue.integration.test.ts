import { spawn, spawnSync } from "node:child_process";
import { existsSync, statSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";
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
  sandboxHome,
  sandboxFiles,
  readSandboxFile,
  startTurn,
  stopTurn,
  toolCall,
  uploads,
  useQueueSandbox,
  waitFor,
  waitForUploaders,
} from "./fixtures/queue-sandbox.js";
import { SHARED_ENGINE_STORAGE_DIRECTORY } from "./constants.js";

function savedRun(name: string): boolean {
  const captureDirectory = `${join(sandboxHome(), SHARED_ENGINE_STORAGE_DIRECTORY, "capture-v1")}${sep}`;
  return sandboxFiles()
    .filter((path) => path.startsWith(captureDirectory) && path.endsWith(".json"))
    .map(readSandboxFile)
    .some((capture) => capture.includes(`"name":"${name}"`));
}

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
  it("retries an imported run after its first upload fails", async () => {
    await startTurn();
    const path = queueRunByHand("Tool0", { origin: currentQueueOrigin() });
    const runId = JSON.parse(readSandboxFile(path)).run.id as string;
    uploads.failNextPost(runId);
    const failedAttempt = uploads.waitForFailure(runId);
    await stopTurn();
    await failedAttempt;
    expect(uploads.didFail(runId)).toBe(true);
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
    expect(await waitForUploaders()).toBe(true);
    expect(uploads.attempted.filter((name) => name === "Tool0").length).toBeGreaterThan(1);
    expect(uploads.received).toEqual(["Tool0"]);
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

    const raw = sandboxFiles().map(readSandboxFile).join("\n");
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
    await startTurn();
    const heldUpload = uploads.holdNextUploadNamed("Tool0");
    queueRunByHand("Tool0", { origin: currentQueueOrigin() });
    await stopTurn("s1");
    try {
      await heldUpload.entered;
      expect(savedRun("Tool0")).toBe(true);
      expect(uploads.started.filter((name) => name === "Tool0")).toHaveLength(1);
      await newSession("s2");
      await toolCall(1, "s2");
      await stopTurn("s2");

      expect(await waitFor(() => uploads.received.includes("Tool1"))).toBe(true);
      expect(uploads.started.filter((name) => name === "Tool0")).toHaveLength(1);
      expect(savedRun("Tool0")).toBe(true);
    } finally {
      heldUpload.release();
    }

    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
    expect(await waitForUploaders()).toBe(true);
    expect([...uploads.received].sort()).toEqual(["Tool0", "Tool1"]);
    expect(uploads.attempted.filter((name) => name === "Tool0")).toHaveLength(1);
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

    const heldUpload = uploads.holdNextUploadNamed("Tool1");
    try {
      await turn(1);
      await heldUpload.entered;
      expect(savedRun("Tool1")).toBe(true);
      expect(uploads.started.filter((name) => name === "Tool1")).toHaveLength(1);

      await turn(2);
      expect(queued().map((entry) => entry.run.name)).toEqual(["Tool2"]);
      expect(uploads.started.filter((name) => name === "Tool1")).toHaveLength(1);
    } finally {
      heldUpload.release();
    }

    expect(await waitFor(() => uploads.received.includes("Tool1"))).toBe(true);
    expect(await waitForUploaders()).toBe(true);
    expect(await waitFor(() => uploads.received.length >= 3)).toBe(true);
    expect(await waitForUploaders()).toBe(true);
    expect([...uploads.received].sort()).toEqual(["Tool0", "Tool1", "Tool2"]);
    expect(uploads.started.sort()).toEqual(["Tool0", "Tool1", "Tool2"]);
    expect(uploads.attempted.sort()).toEqual(["Tool0", "Tool1", "Tool2"]);
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
    const paths = entryFiles("s1");
    const entriesBefore = paths.map(readSandboxFile);
    const runIds = paths.map((path) => JSON.parse(readSandboxFile(path)).run.id as string);
    const holder = spawn(process.execPath, ["-e", "process.stdin.resume()"], {
      stdio: ["pipe", "ignore", "ignore"],
    });
    await new Promise<void>((resolve, reject) => {
      holder.once("spawn", resolve);
      holder.once("error", reject);
    });
    if (!holder.pid) throw new Error("The queue lock holder did not start");
    writeFileSync(`${queueDirFor("s1")}.flush.lock`, String(holder.pid));

    try {
      await stopTurn("s2");
      expect(await waitForUploaders()).toBe(true);
      expect(paths.map(readSandboxFile)).toEqual(entriesBefore);
      expect(uploads.attempted).toEqual([]);
      expect(uploads.received).toEqual([]);
      const captureDirectory = `${join(sandboxHome(), SHARED_ENGINE_STORAGE_DIRECTORY, "capture-v1")}${sep}`;
      const captureRunIds = new Set(
        sandboxFiles()
          .filter((path) => path.startsWith(captureDirectory) && path.endsWith(".json"))
          .map(readSandboxFile)
          .map((contents) => JSON.parse(contents) as { runId?: string })
          .map((capture) => capture.runId),
      );
      expect(runIds.some((runId) => captureRunIds.has(runId))).toBe(false);
      await startTurn();
      await toolCall(99);
      expect(await waitFor(() => uploads.received.includes("Tool99"))).toBe(true);
      expect(paths.map(readSandboxFile)).toEqual(entriesBefore);
    } finally {
      const holderExited = new Promise<void>((resolve) => holder.once("exit", () => resolve()));
      holder.stdin?.end();
      await holderExited;
    }

    await Promise.all([stopTurn("s2"), stopTurn("s3")]);

    expect(await waitFor(() => uploads.received.length >= 7)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect([...uploads.received].sort()).toEqual(
      [0, 1, 2, 3, 4, 5, 99].map((index) => `Tool${index}`),
    );
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
    expect(await waitFor(() => uploads.attempted.includes("Tool0"))).toBe(true);
    expect(queued()).toHaveLength(0);
    uploads.fail = false;
    queueRunByHand("Tool1");

    await stopTurn();
    expect(await waitFor(() => uploads.received.includes("Tool0"))).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(uploads.received).toEqual(["Tool0"]);
    expect(queued().map((entry) => entry.run.name)).toEqual(["Tool1"]);
    expect(hookLog()).toContain("different LangSmith account");
  });

  it("leaves another account's stale run ahead of the current account's queued work", async () => {
    const foreignPath = queueRunByHand("Tool0", {
      queuedAgoMs: 1000,
      startedAgoMs: 2 * 24 * 60 * 60 * 1000,
    });
    const foreignEntry = readSandboxFile(foreignPath);
    const origin = currentQueueOrigin();
    queueRunByHand("Tool1", { origin });

    await stopTurn();
    expect(readSandboxFile(foreignPath)).toBe(foreignEntry);
    expect(queued().map(({ origin: entryOrigin, run }) => [run.name, entryOrigin])).toEqual([
      ["Tool0", "another-account"],
      ["Tool1", origin],
    ]);
    expect(uploads.received).toEqual([]);
    expect(await waitFor(() => !existsSync(`${queueDirFor()}.flush.lock`))).toBe(true);
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
    const origin = currentQueueOrigin();
    queueRunByHand("Tool0", { origin, queuedAgoMs: 100 });
    queueRunByHand("Tool1", { origin, startedAgoMs: 48 * 60 * 60 * 1000 });
    queueRunByHand("Tool2", { origin, queuedAgoMs: 98 });

    await stopTurn();
    expect(await waitFor(() => uploads.received.length === 2)).toBe(true);
    expect(await waitFor(() => queued().length === 0)).toBe(true);
    expect(uploads.received).toEqual(["Tool0", "Tool2"]);
  });
});

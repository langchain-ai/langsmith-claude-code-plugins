import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  EMPTY_QUEUE_MIN_IDLE_MS,
  FOREIGN_QUEUE_MIN_RECORD_AGE_MS,
  QUEUE_FILE_SUFFIX,
  QUEUE_ID_TIME_WIDTH,
  QUEUE_MAX_ATTEMPTS,
  QUEUE_RUN_MAX_AGE_MS,
  QUEUE_TEMP_SUFFIX,
} from "./constants.js";

vi.mock("./logger.js", () => ({ debug: vi.fn(), warn: vi.fn() }));

import { warn } from "./logger.js";
import {
  discardEmptyQueue,
  foreignQueueLooksAbandoned,
  nextQueued,
  queueOrigin,
  readQueue,
  recordFailure,
  runIsTooOldToUpload,
} from "./queue.js";
import type { QueuedRun } from "./types.js";

const STALE = QUEUE_RUN_MAX_AGE_MS + 1000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const idFor = (queuedAgoMs: number, tail: string) =>
  `${String(Date.now() - queuedAgoMs).padStart(QUEUE_ID_TIME_WIDTH, "0")}-${tail}`;
const record = (run: Record<string, unknown> = { name: "Tool0" }) => ({
  tracing: "full",
  attempts: 0,
  origin: "account",
  run,
});

describe("the account fingerprint on a queued run", () => {
  // Catches a fingerprint that only notices the key, which lets one project upload
  // another's runs to extra endpoints or with the wrong redaction applied.
  it("changes when anything deciding where or how the run is sent changes", () => {
    const account = { apiBaseUrl: "https://api.smith.langchain.com", apiKey: "key-a" };
    const fingerprints = new Set([
      queueOrigin(account),
      queueOrigin({ ...account, apiBaseUrl: "https://eu.api.smith.langchain.com" }),
      queueOrigin({ ...account, apiKey: "key-b" }),
      queueOrigin({ ...account, replicas: [{ apiUrl: "https://elsewhere" }] }),
      queueOrigin({ ...account, redact: true }),
      queueOrigin({ ...account, redact: true, redactExtraRules: [{ pattern: "secret" }] }),
    ]);

    expect(fingerprints.size).toBe(6);
  });
});

// Each row catches its own break: a limit read off the wrong clock, a run binned because
// it cannot be dated rather than aged by when it was written down, and a start time that
// cannot be read being taken at face value.
describe("whether a queued run is still worth sending", () => {
  const entry = (run: Record<string, unknown>, queuedAgoMs: number): QueuedRun =>
    ({ queue_id: idFor(queuedAgoMs, "a"), ...record(run) }) as QueuedRun;

  it.each([
    [
      "one that started a moment ago, however long it has waited",
      { start_time: ago(1000) },
      STALE,
      false,
    ],
    [
      "one that started longer ago than the service will accept",
      { start_time: ago(STALE) },
      0,
      true,
    ],
    ["a fresh one that never said when it started", {}, 1000, false],
    ["an old one that never said when it started", {}, STALE, true],
    ["a fresh one whose start time cannot be read", { start_time: "not a date" }, 1000, false],
    ["an old one whose start time cannot be read", { start_time: "not a date" }, STALE, true],
  ])("decides on %s", (_case, run, queuedAgoMs, dropped) => {
    expect(runIsTooOldToUpload(entry(run, queuedAgoMs))).toBe(dropped);
  });
});

describe("a queue folder on disk", () => {
  let root: string;
  let dir: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "ls-queue-unit-"));
    dir = join(root, "s1");
    mkdirSync(dir, { recursive: true });
    vi.mocked(warn).mockClear();
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const write = (tail: string, body: unknown, queuedAgoMs = 0) => {
    const id = idFor(queuedAgoMs, tail);
    writeFileSync(
      join(dir, `${id}${QUEUE_FILE_SUFFIX}`),
      typeof body === "string" ? body : JSON.stringify(body),
    );
    return id;
  };

  // Catches an empty folder removed in the gap between a session creating it and writing
  // its first record, which loses that record to a vanished directory.
  it("leaves an empty folder created moments ago alone", () => {
    discardEmptyQueue(dir, Date.now() + EMPTY_QUEUE_MIN_IDLE_MS - 1000);

    expect(readdirSync(root)).toEqual(["s1"]);
  });

  // Catches a folder left on disk for good by a hook killed mid-write, since the staged
  // file it leaves behind is invisible to the queue but blocks the removal.
  it("removes an idle folder holding nothing but a half-written record", () => {
    writeFileSync(join(dir, `half-written${QUEUE_TEMP_SUFFIX}`), "{");

    discardEmptyQueue(dir, Date.now() + EMPTY_QUEUE_MIN_IDLE_MS + 1000);

    expect(readdirSync(root)).toEqual([]);
  });

  // Catches a flush that helps itself to a folder still being written by a live session
  // elsewhere, which is how two uploaders end up on one folder.
  it.each([
    [1000, false],
    [FOREIGN_QUEUE_MIN_RECORD_AGE_MS + 1000, true],
  ])("calls a stranger's folder abandoned %i ms after its oldest record: %s", (age, abandoned) => {
    write("a", record(), age);

    expect(foreignQueueLooksAbandoned(dir)).toBe(abandoned);
  });

  // Catches one unreadable record stranding every good record queued behind it, which
  // loses a whole session's traces without anything saying so.
  it("drops a record it cannot read and hands back the next one", () => {
    write("a", "{ truncated", 2000);
    write("b", record({ name: "Tool1" }), 1000);

    expect(nextQueued(dir)?.run.name).toBe("Tool1");
    expect(readdirSync(dir)).toHaveLength(1);
  });

  // Catches a run that keeps failing being binned with nothing written down, so the
  // person has no way to tell a lost trace from one that was never made.
  it("gives up on a run that keeps failing and says so", () => {
    const id = write("a", record());

    for (let attempt = 0; attempt < QUEUE_MAX_ATTEMPTS; attempt++) recordFailure(dir, id);

    expect(readQueue(dir)).toEqual([]);
    expect(vi.mocked(warn).mock.calls.flat().join("\n")).toContain(
      `Dropping a queued run after ${QUEUE_MAX_ATTEMPTS} failed uploads`,
    );
  });
});

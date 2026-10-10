import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  readFileSync,
  rmdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { readSavedCaptureWakeMock } = vi.hoisted(() => ({
  readSavedCaptureWakeMock: vi.fn(),
}));

vi.mock("@langchain/plugins-base/tracing", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@langchain/plugins-base/tracing")>()),
  readSavedCaptureWake: readSavedCaptureWakeMock,
}));

import { readSavedCaptureWake } from "@langchain/plugins-base/tracing";
import { QUEUE_FILE_SUFFIX, QUEUE_ID_TIME_WIDTH, TURN_RECORD_LINE } from "./constants.js";
import {
  importLegacyQueueEntries,
  legacyQueueCapturePlan,
  legacyRouteForSession,
  listLegacySessionRoutes,
} from "./legacy-import.js";
import { queueSessionDir, readQueue } from "./queue.js";
import { recordRun, turnRecordPath } from "./turn-record.js";
import type { Config } from "./config.js";
import type { QueuedRun } from "./types.js";

const startTime = "2026-10-10T17:00:00.000Z";
const sessionId = "raw/session-id";
const turnId = "turn-run-id";
const runId = "tool-run-id";

describe("legacy queue handoff", () => {
  let root: string;
  let stateFilePath: string;
  let queueDir: string;
  let recordPath: string;
  let originalCwd: string;
  let entry: QueuedRun;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "claude-legacy-handoff-"));
    stateFilePath = join(root, "state.json");
    queueDir = queueSessionDir(stateFilePath, "safe-session-folder");
    recordPath = turnRecordPath(stateFilePath, sessionId, turnId);
    originalCwd = join(root, "original-project");
    mkdirSync(queueDir, { recursive: true });
    recordRun({
      path: recordPath,
      run: rootRun(),
      tracing: "metadata",
      origin: "saved-account",
      root: true,
    });
    recordRun({
      path: recordPath,
      run: queuedRun(),
      tracing: "metadata",
      origin: "saved-account",
    });
    entry = {
      queue_id: `${String(Date.now()).padStart(QUEUE_ID_TIME_WIDTH, "0")}-legacy`,
      tracing: "metadata",
      attempts: 3,
      origin: "saved-account",
      record: recordPath,
      where: { cwd: originalCwd, namedAPath: false },
      run: queuedRun(),
    };
    writeFileSync(join(queueDir, `${entry.queue_id}${QUEUE_FILE_SUFFIX}`), JSON.stringify(entry));
    readSavedCaptureWakeMock.mockReset();
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("preserves source age and attempts without putting cwd in metadata", () => {
    const result = legacyQueueCapturePlan(entry);
    expect("plan" in result).toBe(true);
    if (!("plan" in result)) return;

    expect(result.plan.cwd).toBe(originalCwd);
    expect(result.plan.sessionId).toBe(sessionId);
    expect(result.plan.projectName).toBe("saved-project");
    expect(result.plan.input).toMatchObject({
      turnId,
      eventId: runId,
      sourceAgeStartedAtMs: Date.parse(startTime),
      priorDeliveryAttempts: 3,
      submission: { privacyMode: "metadata" },
    });
    expect(result.plan.input.submission.metadata.base).not.toHaveProperty("cwd");
    expect(result.plan.input.submission.run.inputs).not.toHaveProperty("input");
  });

  it("requires a queued tool to point directly at its saved turn root", () => {
    expect(
      legacyQueueCapturePlan({
        ...entry,
        run: { ...entry.run, parent_run_id: "nested-agent-run-id" },
      }),
    ).toEqual({ reason: "the queued run parent does not match its saved turn root" });
  });

  it("keeps an old queue entry untouched when its account does not match", async () => {
    entry = {
      ...entry,
      origin: "different-account",
      run: { ...entry.run, start_time: "2000-01-01T00:00:00.000Z" },
    };
    writeFileSync(join(queueDir, `${entry.queue_id}${QUEUE_FILE_SUFFIX}`), JSON.stringify(entry));
    recordRun({
      path: recordPath,
      run: queuedRun(),
      tracing: "metadata",
      origin: "different-account",
    });
    const createContext = vi.fn();

    await importLegacyQueueEntries({
      config: testConfig(stateFilePath),
      dir: queueDir,
      origin: "saved-account",
      createContext,
    });

    expect(readQueue(queueDir)).toHaveLength(1);
    expect(createContext).not.toHaveBeenCalled();
  });

  it("does not expire an entry when its turn record belongs to another account", async () => {
    entry = { ...entry, run: { ...entry.run, start_time: "2000-01-01T00:00:00.000Z" } };
    writeFileSync(join(queueDir, `${entry.queue_id}${QUEUE_FILE_SUFFIX}`), JSON.stringify(entry));
    recordRun({
      path: recordPath,
      run: queuedRun(),
      tracing: "metadata",
      origin: "different-account",
    });

    await importLegacyQueueEntries({
      config: testConfig(stateFilePath),
      dir: queueDir,
      origin: "saved-account",
      createContext: vi.fn(),
    });

    expect(readQueue(queueDir)).toHaveLength(1);
  });

  it("leaves an entry queued when its original working directory is unknown", () => {
    const noRoute = { ...entry, where: undefined };
    const result = legacyQueueCapturePlan(noRoute);
    expect(result).toEqual({ reason: "the original working directory cannot be verified" });
  });

  it("does not infer the original project from the current configuration", () => {
    const noProjectRun = { ...queuedRun() };
    delete noProjectRun.project_name;
    recordRun({
      path: recordPath,
      run: noProjectRun,
      tracing: "metadata",
      origin: "saved-account",
    });

    expect(legacyQueueCapturePlan({ ...entry, run: noProjectRun })).toEqual({
      reason: "the original LangSmith project cannot be verified",
    });
  });

  it("rejects a queue entry when its saved project disagrees with the queued run", () => {
    expect(
      legacyQueueCapturePlan({
        ...entry,
        run: { ...entry.run, project_name: "another-project" },
      }),
    ).toEqual({
      reason: "the queue and turn record disagree about the original LangSmith project",
    });
  });

  it("rejects a queue entry when its saved cwd disagrees with the queued route", () => {
    const savedCwd = join(root, "another-project");
    recordRun({
      path: recordPath,
      run: queuedRun(),
      tracing: "metadata",
      origin: "saved-account",
      routing: { cwd: savedCwd },
    });

    expect(legacyQueueCapturePlan(entry)).toEqual({
      reason: "the queue and turn record disagree about the original working directory",
    });
  });

  it("uses persisted capture proof without constraining it to an event revision", async () => {
    const wakeError = new Error("worker wake failed");
    const captureSnapshot = vi.fn().mockRejectedValue(wakeError);
    readSavedCaptureWakeMock.mockResolvedValue({ runId });
    const context = {
      accountFingerprint: "saved-fingerprint",
      captureStore: {},
      session: { captureSnapshot },
    } as never;
    const createContext = vi.fn(() => context);

    await importLegacyQueueEntries({
      config: testConfig(stateFilePath),
      dir: queueDir,
      origin: "saved-account",
      createContext,
    });

    const options = vi.mocked(readSavedCaptureWake).mock.calls[0]?.[1];
    expect(options).toBeDefined();
    expect(Object.hasOwn(options ?? {}, "eventId")).toBe(false);
    expect(captureSnapshot.mock.calls[0]?.[0]).toMatchObject({
      sourceAgeStartedAtMs: Date.parse(startTime),
      priorDeliveryAttempts: 3,
    });
    expect(readQueue(queueDir)).toHaveLength(0);
  });

  it("keeps the queue when shared capture has no acceptance proof", async () => {
    const captureError = new Error("capture was not saved");
    const captureSnapshot = vi.fn().mockRejectedValue(captureError);
    readSavedCaptureWakeMock.mockResolvedValue(undefined);
    const context = {
      accountFingerprint: "saved-fingerprint",
      captureStore: {},
      session: { captureSnapshot },
    } as never;

    await importLegacyQueueEntries({
      config: testConfig(stateFilePath),
      dir: queueDir,
      origin: "saved-account",
      createContext: vi.fn(() => context),
    });

    expect(readSavedCaptureWakeMock).toHaveBeenCalledOnce();
    expect(readQueue(queueDir)).toHaveLength(1);
  });

  it("retries capture after acceptance but before queue retirement", async () => {
    const savedRecordPath = `${recordPath}.saved`;
    const captureSnapshot = vi
      .fn()
      .mockImplementationOnce(async () => {
        renameSync(recordPath, savedRecordPath);
        mkdirSync(recordPath);
        return { status: "published" };
      })
      .mockResolvedValueOnce({ status: "duplicate" });
    const context = {
      accountFingerprint: "saved-fingerprint",
      captureStore: {},
      session: { captureSnapshot },
    } as never;
    const options = {
      config: testConfig(stateFilePath),
      dir: queueDir,
      origin: "saved-account",
      createContext: vi.fn(() => context),
    };

    await importLegacyQueueEntries(options);

    expect(captureSnapshot).toHaveBeenCalledOnce();
    expect(readQueue(queueDir)).toHaveLength(1);

    rmdirSync(recordPath);
    renameSync(savedRecordPath, recordPath);
    await importLegacyQueueEntries(options);

    expect(captureSnapshot).toHaveBeenCalledTimes(2);
    expect(captureSnapshot.mock.calls[1]?.[0]).toMatchObject({ eventId: runId });
    expect(readQueue(queueDir)).toHaveLength(0);
  });

  it("requires a shared route with the raw session ID and saved cwd", () => {
    recordRun({
      path: recordPath,
      run: queuedRun(),
      tracing: "metadata",
      origin: "saved-account",
      shared: true,
      routing: { cwd: originalCwd },
    });

    expect(listLegacySessionRoutes(stateFilePath, "saved-account")).toEqual([
      { cwd: originalCwd, projectName: "saved-project", sessionId },
    ]);
    expect(readFileSync(recordPath, "utf-8")).toContain(
      `"routing":{"cwd":${JSON.stringify(originalCwd)}}`,
    );
    expect(readFileSync(recordPath, "utf-8")).not.toContain(
      `"metadata":{"cwd":${JSON.stringify(originalCwd)}}`,
    );
  });

  it("scans only the requested session directory when the flusher supplies one", () => {
    recordRun({
      path: recordPath,
      run: queuedRun(),
      tracing: "metadata",
      origin: "saved-account",
      shared: true,
      routing: { cwd: originalCwd },
    });
    recordRun({
      path: turnRecordPath(stateFilePath, "other-session", "other-turn-id"),
      run: {
        ...queuedRun(),
        id: "other-tool-run-id",
        extra: { metadata: { thread_id: "other-session" } },
      },
      tracing: "metadata",
      origin: "saved-account",
      shared: true,
      routing: { cwd: join(root, "other-project") },
    });

    expect(listLegacySessionRoutes(stateFilePath, "saved-account", "raw_session-id")).toEqual([
      { cwd: originalCwd, projectName: "saved-project", sessionId },
    ]);
  });

  it("refuses recovery when one session has conflicting saved routes", () => {
    recordRun({
      path: recordPath,
      run: queuedRun(),
      tracing: "metadata",
      origin: "saved-account",
      shared: true,
      routing: { cwd: originalCwd },
    });
    recordRun({
      path: recordPath,
      run: { ...queuedRun(), id: "another-tool-run-id" },
      tracing: "metadata",
      origin: "saved-account",
      shared: true,
      routing: { cwd: join(root, "different-project") },
    });

    expect(legacyRouteForSession(stateFilePath, sessionId, "saved-account")).toBeUndefined();
  });

  it("checks the raw session ID when storage names collide", () => {
    const otherSessionId = "raw_session-id";
    const otherRun = {
      ...queuedRun(),
      id: "other-tool-run-id",
      extra: { metadata: { thread_id: otherSessionId } },
    };
    recordRun({
      path: turnRecordPath(stateFilePath, otherSessionId, "other-turn-id"),
      run: otherRun,
      tracing: "metadata",
      origin: "saved-account",
      shared: true,
      routing: { cwd: originalCwd },
    });

    expect(legacyRouteForSession(stateFilePath, sessionId, "saved-account")).toBeUndefined();
  });

  it("requires the saved account, project, and absolute cwd for recovery", () => {
    const noProjectRun = { ...queuedRun() };
    delete noProjectRun.project_name;
    recordRun({
      path: recordPath,
      run: noProjectRun,
      tracing: "metadata",
      origin: "saved-account",
      shared: true,
      routing: { cwd: originalCwd },
    });
    expect(legacyRouteForSession(stateFilePath, sessionId, "saved-account")).toBeUndefined();

    recordRun({
      path: recordPath,
      run: queuedRun(),
      tracing: "metadata",
      origin: "other-account",
      shared: true,
      routing: { cwd: originalCwd },
    });
    expect(legacyRouteForSession(stateFilePath, sessionId, "saved-account")).toBeUndefined();

    recordRun({
      path: recordPath,
      run: queuedRun(),
      tracing: "metadata",
      origin: "saved-account",
      shared: true,
    });
    expect(legacyRouteForSession(stateFilePath, sessionId, "saved-account")).toBeUndefined();
  });

  it("rejects a relative cwd from a malformed saved record", () => {
    appendFileSync(
      recordPath,
      `${JSON.stringify({
        k: TURN_RECORD_LINE.run,
        origin: "saved-account",
        run: {
          run_id: runId,
          shared: true,
          project_name: "saved-project",
          routing: { cwd: "relative/project" },
          metadata: { thread_id: sessionId },
        },
      })}\n`,
    );

    expect(legacyRouteForSession(stateFilePath, sessionId, "saved-account")).toBeUndefined();
  });
});

function queuedRun(): Record<string, unknown> {
  return {
    id: runId,
    name: "Read",
    run_type: "tool",
    inputs: { input: "private input" },
    start_time: startTime,
    parent_run_id: turnId,
    trace_id: turnId,
    dotted_order: `${startTime.replaceAll(/[-:.TZ]/g, "")}${turnId}.${startTime.replaceAll(/[-:.TZ]/g, "")}${runId}`,
    project_name: "saved-project",
    extra: { metadata: { thread_id: sessionId, cwd: "/private/metadata/path" } },
  };
}

function rootRun(): Record<string, unknown> {
  return {
    id: turnId,
    name: "Claude Code Turn",
    run_type: "chain",
    inputs: { messages: [] },
    start_time: startTime,
    trace_id: turnId,
    dotted_order: `${startTime.replaceAll(/[-:.TZ]/g, "")}${turnId}`,
    project_name: "saved-project",
    extra: { metadata: { thread_id: sessionId } },
  };
}

function testConfig(path: string): Config {
  return {
    enabled: true,
    defaultMuted: false,
    apiKey: "test-key",
    project: "current-project",
    apiBaseUrl: "https://api.smith.langchain.com",
    stateFilePath: path,
    debug: false,
    redact: false,
  };
}

import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import type { Config } from "../config.js";
import * as hookInit from "../utils/hook-init.js";
import * as tracing from "../tracing-engine.js";
import { queueOrigin } from "../queue.js";
import { recordRun, recordTurnClosed, turnRecordPath } from "../turn-record.js";
import { main } from "./flush-queue.js";

it("keeps a turn until its receipt writer releases the cleanup lock", async () => {
  const root = mkdtempSync(join(tmpdir(), "claude-receipt-lock-"));
  const config: Config = {
    enabled: true,
    defaultMuted: false,
    apiKey: "synthetic-receipt-lock",
    apiBaseUrl: "http://127.0.0.1:1",
    project: "receipt-lock",
    stateFilePath: join(root, "state.json"),
    debug: false,
    redact: false,
  };
  const sessionId = "receipt-session";
  const turnId = "root";
  const runId = "tool";
  const context = tracing.createClaudeTracingSession(config, root, sessionId)!;
  const path = turnRecordPath(config.stateFilePath, sessionId, turnId);
  for (const id of [turnId, runId]) {
    expect(
      recordRun({
        path,
        origin: queueOrigin(config),
        tracing: "full",
        shared: true,
        root: id === turnId,
        run: { id, dotted_order: id, name: id, run_type: "chain" },
      }),
    ).toBe(true);
  }
  recordTurnClosed(path, turnId);
  const scope = { integration: "claude-code", sessionId, turnId, eventId: runId };
  expect(
    (
      await context.captureStore.capture({
        ...scope,
        runId,
        destinationFingerprint: context.accountFingerprint,
        eventKind: "run-post",
        normalizedPayload: {},
        turnEvidence: {},
        metadataProvenance: {
          integration: "claude-code",
          threadId: sessionId,
          agentType: "tool",
          runType: "tool",
        },
      })
    ).status,
  ).toBe("published");
  for (const destination of context.destinations) {
    await context.captureStore.recordOutcome({
      ...scope,
      destination: destination.id,
      outcome: "delivered",
    });
  }
  let release = () => {};
  let entered = () => {};
  const barrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  const ready = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const enumerate = context.captureStore.enumerate.bind(context.captureStore);
  vi.spyOn(context.captureStore, "enumerate").mockImplementationOnce(async (...args) => {
    entered();
    await barrier;
    return enumerate(...args);
  });
  vi.spyOn(hookInit, "initHook").mockReturnValue(config);
  vi.spyOn(tracing, "createClaudeTracingSession").mockReturnValue({
    ...context,
    session: { ...context.session, drain: async () => "completed" },
  });
  const first = main(root, sessionId);
  try {
    await ready;
    await main(root, sessionId);
    expect(existsSync(path)).toBe(true);
  } finally {
    release();
    await first;
    vi.restoreAllMocks();
  }
  expect(existsSync(path)).toBe(false);
});

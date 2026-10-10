import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initHook: vi.fn(),
  listQueues: vi.fn(),
  queueOrigin: vi.fn(),
  tryAcquireLock: vi.fn(),
  releaseLock: vi.fn(),
  importLegacyQueueEntries: vi.fn(),
}));

vi.mock("langsmith", () => ({ Client: vi.fn() }));
vi.mock("langsmith/anonymizer", () => ({ createSecretAnonymizer: vi.fn() }));
vi.mock("../utils/hook-init.js", () => ({ initHook: mocks.initHook }));
vi.mock("../queue.js", () => ({
  discardEmptyQueue: vi.fn(),
  listQueues: mocks.listQueues,
  foreignQueueLooksAbandoned: vi.fn(),
  queueDir: () => "/tmp/queue",
  queueOrigin: mocks.queueOrigin,
}));
vi.mock("../turn-record.js", () => ({
  listRecordedSessions: vi.fn(() => []),
  listTurnRecords: vi.fn(() => []),
  readTurnRecord: vi.fn(),
  recordsIdleMs: vi.fn(),
  turnRecordRoot: vi.fn(() => "/tmp/turn-records"),
}));
vi.mock("../reconcile.js", () => ({ reconcileAndClear: vi.fn() }));
vi.mock("../utils/session-store.js", () => ({
  discardDirIfEmpty: vi.fn(),
  safeName: (value: string) => value,
}));
vi.mock("../upload-confirm.js", () => ({ watchUploads: vi.fn() }));
vi.mock("../utils/file-lock.js", () => ({
  releaseLock: mocks.releaseLock,
  tryAcquireLock: mocks.tryAcquireLock,
}));
vi.mock("../tracing-engine.js", () => ({
  acknowledgeClaudeSharedDeliveries: vi.fn(),
  createClaudeTracingSession: vi.fn(),
}));
vi.mock("../legacy-import.js", () => ({
  importLegacyQueueEntries: mocks.importLegacyQueueEntries,
  listLegacySessionRoutes: vi.fn(() => []),
}));
vi.mock("../logger.js", () => ({ debug: vi.fn(), warn: vi.fn() }));
vi.mock("../constants.js", () => ({ FOREIGN_QUEUE_MIN_RECORD_AGE_MS: 1_000 }));

import { main } from "./flush-queue.js";
import type { Config } from "../config.js";

const config: Config = {
  enabled: true,
  defaultMuted: false,
  apiKey: "test-key",
  project: "saved-project",
  apiBaseUrl: "https://api.smith.langchain.com",
  stateFilePath: "/tmp/state.json",
  debug: false,
  redact: false,
};

describe("the legacy queue flusher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.initHook.mockReturnValue(config);
    mocks.listQueues.mockReturnValue(["session-1"]);
    mocks.queueOrigin.mockReturnValue("saved-account");
    mocks.tryAcquireLock.mockReturnValue(false);
    mocks.importLegacyQueueEntries.mockRejectedValue(new Error("unexpected importer call"));
  });

  it("does not import legacy entries while another flusher holds the session lock", async () => {
    await main("/saved/project", "session-1", "saved-project");

    expect(mocks.tryAcquireLock).toHaveBeenCalledWith(join("/tmp/queue", "session-1.flush"));
    expect(mocks.importLegacyQueueEntries).not.toHaveBeenCalled();
    expect(mocks.releaseLock).not.toHaveBeenCalled();
  });
});

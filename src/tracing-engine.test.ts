import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { EventEmitter } from "node:events";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCaptureStore } from "@langchain/plugins-base/storage/capture";
import type { Config } from "./types.js";
import { codingAgentMetadata } from "./metadata.js";
import { ENGINE_WORKER_ARG } from "./constants.js";
import { stableRunId } from "./utils/ids/run-id.js";

const warn = vi.hoisted(() => vi.fn());
const spawned = vi.hoisted(() => vi.fn());
vi.mock("./logger.js", () => ({
  warn,
  debug: vi.fn(),
  error: vi.fn(),
  initLogger: vi.fn(),
}));
vi.mock("node:child_process", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:child_process")>()),
  spawn: spawned,
}));

const PRIVATE = "PRIVATE_MARKER";
let root: string;
let config: Config;

function run(id: string) {
  return {
    id,
    name: "Bash",
    run_type: "tool",
    inputs: { input: PRIVATE },
    outputs: { output: PRIVATE },
    start_time: "2026-01-01T00:00:00.000Z",
    end_time: "2026-01-01T00:00:01.000Z",
    trace_id: id,
    dotted_order: `20260101T000000000000Z${id}`,
    metadata: codingAgentMetadata({ sessionId: "s1", agentType: "root" }),
  };
}

function launchesFail(): void {
  spawned.mockImplementation(() => {
    const child = new EventEmitter();
    queueMicrotask(() => child.emit("error", new Error("ENOENT")));
    return child;
  });
}

function launchesRunInline(): Promise<unknown>[] {
  const workers: Promise<unknown>[] = [];
  spawned.mockImplementation((_executable: string, args: string[]) => {
    const [cwd, sessionId] = args.slice(args.indexOf(ENGINE_WORKER_ARG) + 1);
    const child = Object.assign(new EventEmitter(), { pid: 4242, unref: vi.fn() });
    queueMicrotask(() => child.emit("spawn"));
    workers.push(
      import("./tracing-engine.js").then(({ runEngineWorker }) => runEngineWorker(cwd, sessionId)),
    );
    return child;
  });
  return workers;
}

const saved = async () =>
  createCaptureStore(join(root, "langsmith_engine")).enumerate("claude-code", "s1");

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), "utf-8"));
}

beforeEach(() => {
  vi.resetModules();
  warn.mockClear();
  spawned.mockReset();
  root = mkdtempSync(join(tmpdir(), "claude-engine-"));
  config = {
    enabled: true,
    defaultMuted: false,
    apiKey: "lsv2_pt_test_key",
    project: "test",
    apiBaseUrl: "http://127.0.0.1:9",
    stateFilePath: join(root, "state.json"),
    debug: false,
    redact: false,
  };
});

afterEach(() => vi.unstubAllEnvs());

describe("the shared engine adapter", () => {
  it("keeps a saved run and warns when its uploader cannot start", async () => {
    launchesFail();
    const { captureRun, initTracing } = await import("./tracing-engine.js");
    initTracing(config, root, "s1");
    const id = stableRunId("2026-01-01T00:00:00.000Z", "s1", "tool");

    await expect(captureRun(run(id))).resolves.toBeUndefined();

    expect((await saved()).map(({ record }) => record.runId)).toEqual([id]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("uploader did not start"));
  });

  it("sends the uploader's output to its own log file", async () => {
    launchesFail();
    const { captureRun, initTracing } = await import("./tracing-engine.js");
    initTracing(config, root, "s1");

    await captureRun(run(stableRunId("2026-01-01T00:00:00.000Z", "s1", "logged")));

    const [, , options] = spawned.mock.calls[0];
    expect(options.stdio[1]).toEqual(expect.any(Number));
    expect(existsSync(join(root, "langsmith_engine", "worker.log"))).toBe(true);
  });

  it("saves a muted run without its content", async () => {
    launchesFail();
    const { captureRun, initTracing } = await import("./tracing-engine.js");
    initTracing(config, root, "s1");

    await captureRun(run(stableRunId(0, "muted")), "metadata");

    expect(filesUnder(join(root, "langsmith_engine")).join("\n")).not.toContain(PRIVATE);
  });
});

describe("the uploader", () => {
  it("warns when it gives up on a run instead of dropping it silently", async () => {
    launchesFail();
    const refusing = createServer((_, response) => response.writeHead(400).end("{}"));
    await new Promise<void>((resolve) => refusing.listen(0, "127.0.0.1", resolve));
    const { port } = refusing.address() as { port: number };
    vi.stubEnv("STATE_FILE", config.stateFilePath);
    vi.stubEnv("TRACE_TO_LANGSMITH", "true");
    vi.stubEnv("LANGSMITH_API_KEY", config.apiKey);
    vi.stubEnv("LANGSMITH_ENDPOINT", `http://127.0.0.1:${port}`);
    vi.stubEnv("CC_LANGSMITH_REDACT", "false");
    const { captureRun, initTracing, runEngineWorker } = await import("./tracing-engine.js");
    const { loadConfig } = await import("./config.js");
    initTracing(loadConfig({ cwd: root }), root, "s1");
    await captureRun(run(stableRunId(0, "unreachable")));

    for (let drain = 0; drain < 6; drain += 1) await runEngineWorker(root, "s1");
    refusing.close();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("stopped with dropped"));
  });
});

describe("recovery of stranded work", () => {
  it("uploads a run whose own session never woke its uploader, from a later session's worker", async () => {
    const received: string[] = [];
    const accepting = createServer((request, response) => {
      let body = "";
      request.on("data", (chunk) => (body += chunk));
      request.on("end", () => {
        if (request.method === "POST") received.push(body);
        response.writeHead(200, { "content-type": "application/json" }).end("{}");
      });
    });
    await new Promise<void>((resolve) => accepting.listen(0, "127.0.0.1", resolve));
    const { port } = accepting.address() as { port: number };
    vi.stubEnv("STATE_FILE", config.stateFilePath);
    vi.stubEnv("TRACE_TO_LANGSMITH", "true");
    vi.stubEnv("LANGSMITH_API_KEY", config.apiKey);
    vi.stubEnv("LANGSMITH_ENDPOINT", `http://127.0.0.1:${port}`);
    vi.stubEnv("CC_LANGSMITH_REDACT", "false");
    const { captureRun, initTracing, runEngineWorker } = await import("./tracing-engine.js");
    const { loadConfig } = await import("./config.js");
    const stranded = stableRunId(0, "stranded");
    initTracing(loadConfig({ cwd: root }), root, "stranded");
    await captureRun(run(stranded));
    expect(received).toEqual([]);

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 3 * 60 * 60 * 1000);
    const workers = launchesRunInline();
    try {
      await runEngineWorker(root, "other");
      while (workers.length > 0) await workers.shift();
    } finally {
      vi.useRealTimers();
      accepting.close();
    }

    expect(received.join("\n")).toContain(stranded);
    expect(spawned.mock.calls.map(([, args]) => args.at(-1))).toContain("stranded");
  });
});

describe("a turn an older version opened", () => {
  it("closes its root and keeps its new children out of a turn the engine never saw open", async () => {
    launchesFail();
    const { captureRun, initTracing } = await import("./tracing-engine.js");
    initTracing(config, root, "s1");
    const opened = stableRunId("2026-01-01T00:00:00.000Z", "s1", "legacy-root");
    const child = stableRunId("2026-01-01T00:00:00.500Z", "s1", "new-child");

    await captureRun({ ...run(child), parent_run_id: opened, trace_id: opened }, "full", opened);
    await captureRun(run(opened), "full", opened, "patch");

    const records = (await saved()).map(({ record }) => record);
    const close = records.find((record) => record.runId === opened)!;
    expect(close.dependencies ?? []).toEqual([]);
    expect(records.find((record) => record.runId === child)?.turnId).toBe(child);
  });
});

describe("a turn's settlement", () => {
  const turn = stableRunId("2026-01-01T00:00:00.000Z", "s1", "turn");
  const child = (key: string, base: Record<string, unknown>) => ({
    ...run(stableRunId("2026-01-01T00:00:00.500Z", "s1", key)),
    parent_run_id: turn,
    trace_id: turn,
    metadata: codingAgentMetadata({ sessionId: "s1", agentType: "root", base }),
  });

  it("makes a run's update wait until the run itself has been posted", async () => {
    launchesFail();
    const { captureRun, initTracing } = await import("./tracing-engine.js");
    initTracing(config, root, "s1");

    await captureRun(run(turn));
    await captureRun(run(turn), "full", turn, "patch");

    const update = (await saved()).find(({ record }) => record.eventId === `patch:${turn}`);
    expect(update?.record.dependencies).toEqual([
      expect.objectContaining({ turnId: turn, eventId: `post:${turn}` }),
    ]);
  });

  it("holds the turn's repository back while a tool run has not landed", async () => {
    const stored = (runId: string, eventId: string, base: Record<string, unknown>) => ({
      record: {
        runId,
        eventId,
        eventKind: "run-post",
        capturedAtMs: 1,
        destinationFingerprint: "f",
        turnEvidence: { childRunIds: runId === turn ? ["llm"] : [] },
        normalizedPayload: { privacyMode: "full", run: { dotted_order: runId } },
        metadataProvenance: codingAgentMetadata({ sessionId: "s1", agentType: "root", base }),
      },
    });
    vi.doMock("./engine-session.js", () => ({
      openSession: () => ({
        sessionId: "s1",
        fingerprint: "f",
        destinations: [{ id: "primary" }],
        store: {
          enumerateTurn: async () => [
            stored(turn, `post:${turn}`, {}),
            stored("llm", "post:llm", { ls_git_repo: "acme/child" }),
            stored("tool", "tool:tool", {}),
          ],
          readOutcome: async () => ({ status: "pending" }),
        },
      }),
    }));
    try {
      const { initTracing, settledFromTurn } = await import("./tracing-engine.js");
      initTracing(config, root, "s1");

      expect(await settledFromTurn({ team: "core" }, turn)).toEqual({ team: "core" });
    } finally {
      vi.doUnmock("./engine-session.js");
    }
  });

  it("fills a run only with the turn keys it is missing", async () => {
    launchesFail();
    const { captureRun, initTracing, turnFiller } = await import("./tracing-engine.js");
    initTracing(config, root, "s1");

    await captureRun(run(turn));
    await captureRun(child("llm", { ls_git_repo: "acme/child" }), "full", turn);
    const fill = await turnFiller(turn);
    const own = codingAgentMetadata({
      sessionId: "s1",
      agentType: "root",
      base: { ls_attribution_identifier: "me" },
    });

    expect(fill(own).base).toEqual({
      ls_attribution_identifier: "me",
      ls_git_repo: "acme/child",
      repository_name: "acme/child",
    });
  });
});

describe("run identity", () => {
  it("gives the same run the same id, stamped with its own start time", () => {
    const time = "2026-01-01T00:00:01.234Z";
    const id = stableRunId(time, "s1", "tool-1");

    expect(stableRunId(time, "s1", "tool-1")).toBe(id);
    expect(stableRunId(time, "s1", "tool-2")).not.toBe(id);
    expect(Number.parseInt(id.replaceAll("-", "").slice(0, 12), 16)).toBe(Date.parse(time));
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

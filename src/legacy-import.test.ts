import { createHmac } from "node:crypto";
import {
  existsSync,
  lutimesSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCodingAgentMetadata } from "@langchain/plugins-base/metadata";
import { createCaptureStore } from "@langchain/plugins-base/storage/capture";
import { codingAgentMetadata } from "./metadata.js";
import { sweepLegacyLeftovers } from "./legacy-sweep.js";
import type { Config } from "./types.js";
import { stableRunId } from "./utils/ids/run-id.js";

const spawned = vi.hoisted(() => vi.fn());
const warned = vi.hoisted(() => vi.fn());
vi.mock("./logger.js", () => ({
  warn: warned,
  debug: vi.fn(),
  error: vi.fn(),
  initLogger: vi.fn(),
}));
vi.mock("node:child_process", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:child_process")>()),
  spawn: spawned,
}));

const PRIVATE = "PRIVATE_MARKER";
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const queueName = (id: string) => `0001767225600000-${id}.queue.json`;
const old = (path: string, ageMs: number) => {
  const time = new Date(Date.now() - ageMs);
  utimesSync(path, time, time);
};
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
    metadata: codingAgentMetadata({ sessionId: "s1", agentType: "root", toolName: "Bash" }),
  };
}

const saved = async () =>
  createCaptureStore(join(root, "langsmith_engine")).enumerate("claude-code", "s1");

function legacyOrigin(key: string): string {
  return createHmac("sha256", key)
    .update(JSON.stringify([config.apiBaseUrl, null, false, null]))
    .digest("hex")
    .slice(0, 12);
}

function legacyEnvironment(): void {
  vi.stubEnv("STATE_FILE", config.stateFilePath);
  vi.stubEnv("TRACE_TO_LANGSMITH", "true");
  vi.stubEnv("LANGSMITH_API_KEY", config.apiKey);
  vi.stubEnv("LANGSMITH_ENDPOINT", config.apiBaseUrl);
  vi.stubEnv("CC_LANGSMITH_REDACT", "false");
}

beforeEach(() => {
  vi.resetModules();
  spawned.mockReset();
  warned.mockReset();
  root = mkdtempSync(join(tmpdir(), "claude-legacy-"));
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

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

describe("runs and turns left by the previous version", () => {
  it("moves this account's queued runs into the engine and leaves another account's", async () => {
    spawned.mockImplementation(() => {
      throw new Error("no worker");
    });
    const queue = join(root, "langsmith_queue", "s1");
    mkdirSync(queue, { recursive: true });
    const legacy = (key: string, id: string) => {
      const { metadata, ...fields } = run(id);
      const queued = {
        ...fields,
        extra: {
          metadata: {
            ...buildCodingAgentMetadata(metadata),
            repository_name: "acme/q",
            repository_url: "https://github.com/acme/q",
            repository_provider: "github",
            git_branch: "trunk",
            git_commit_sha: "abc123",
          },
        },
      };
      const entry = { tracing: "full", attempts: 0, origin: legacyOrigin(key), run: queued };
      writeFileSync(join(queue, queueName(id)), JSON.stringify(entry));
      return id;
    };
    const ours = legacy(config.apiKey, stableRunId(0, "ours"));
    const theirs = legacy("another-key", stableRunId(0, "theirs"));
    legacyEnvironment();
    const { runEngineWorker } = await import("./tracing-engine.js");

    await runEngineWorker(root, "s1");

    const records = (await saved()).map(({ record }) => record);
    expect(records.map(({ runId }) => runId)).toEqual([ours]);
    const base = (records[0]!.metadataProvenance as { base: Record<string, unknown> }).base;
    expect(base).toMatchObject({
      ls_git_repo: "acme/q",
      ls_git_repo_url: "https://github.com/acme/q",
      ls_repo_provider: "github",
      ls_git_branch: "trunk",
      ls_git_commit_hash: "abc123",
    });
    expect(base).toMatchObject({
      repository_name: "acme/q",
      repository_url: "https://github.com/acme/q",
      repository_provider: "github",
      git_branch: "trunk",
      git_commit_sha: "abc123",
    });
    expect(readdirSync(queue)).toEqual([queueName(theirs)]);
  });

  it("closes and fills the open runs of a finished turn the previous version never settled", async () => {
    spawned.mockImplementation(() => {
      throw new Error("no worker");
    });
    const turns = join(root, "langsmith_turns", "s1");
    mkdirSync(turns, { recursive: true });
    const [opened, open, fixed, undelivered] = ["root", "open", "fixed", "undelivered"].map((key) =>
      stableRunId(0, key),
    );
    const recorded = (id: string, metadata: Record<string, unknown>) => ({
      run_id: id,
      trace_id: opened,
      dotted_order: `20260101T000000000000Z${id}`,
      name: "Bash",
      run_type: "tool",
      start_time: "2026-01-01T00:00:00.000Z",
      end_time: "2026-01-01T00:00:01.000Z",
      tracing: "full",
      open: true,
      metadata: { thread_id: "t1", ls_agent_type: "root", ...metadata },
    });
    const origin = legacyOrigin(config.apiKey);
    const lines = [
      { k: "run", root: true, origin, run: recorded(opened, { repository_name: "acme/x" }) },
      { k: "run", origin, run: { ...recorded(open, {}), run_type: "llm" } },
      { k: "ok", id: open },
      { k: "run", origin, run: recorded(fixed, {}) },
      { k: "ok", id: fixed },
      { k: "fixed", id: fixed },
      { k: "run", origin, run: recorded(undelivered, {}) },
      { k: "closed" },
    ];
    writeFileSync(
      join(turns, `${opened}.turn.jsonl`),
      lines.map((line) => JSON.stringify(line)).join("\n"),
    );
    const settled = [
      { k: "run", root: true, origin, run: recorded(fixed, {}) },
      { k: "fixed", id: fixed },
      { k: "closed" },
    ];
    writeFileSync(
      join(turns, `${fixed}.turn.jsonl`),
      settled.map((line) => JSON.stringify(line)).join("\n"),
    );
    legacyEnvironment();
    const { runEngineWorker } = await import("./tracing-engine.js");

    await runEngineWorker(root, "s1");

    const records = (await saved()).map(({ record }) => record);
    expect(records.map(({ eventId }) => eventId).toSorted()).toEqual(
      [`patch:${opened}`, `patch:${open}`].toSorted(),
    );
    const filled = records.find(({ runId }) => runId === open)!;
    expect(filled.metadataProvenance).toMatchObject({
      base: { ls_git_repo: "acme/x", repository_name: "acme/x" },
      runType: "llm",
      threadId: "t1",
    });
    expect(readdirSync(turns)).toEqual([]);
  });

  it.each([0, 2 * DAY])(
    "keeps a legacy file whose run could not be moved, %i ms old",
    async (age) => {
      spawned.mockImplementation(() => {
        throw new Error("no worker");
      });
      const queue = join(root, "langsmith_queue", "s1");
      mkdirSync(queue, { recursive: true });
      const { name: _name, metadata, ...fields } = run(stableRunId(0, "nameless"));
      const queued = { ...fields, extra: { metadata: buildCodingAgentMetadata(metadata) } };
      const file = join(queue, queueName(fields.id));
      writeFileSync(
        file,
        JSON.stringify({ tracing: "full", origin: legacyOrigin(config.apiKey), run: queued }),
      );
      old(file, age);
      legacyEnvironment();
      const { runEngineWorker } = await import("./tracing-engine.js");

      await runEngineWorker(root, "s1");

      expect(await saved()).toEqual([]);
      expect(readdirSync(queue)).toEqual([queueName(fields.id)]);
    },
  );

  it("keeps another account's runs and an unfinished turn however old they are", async () => {
    spawned.mockImplementation(() => {
      throw new Error("no worker");
    });
    const queue = join(root, "langsmith_queue", "s1");
    const turns = join(root, "langsmith_turns", "s1");
    mkdirSync(queue, { recursive: true });
    mkdirSync(turns, { recursive: true });
    const { metadata, ...fields } = run(stableRunId(0, "theirs"));
    const queued = { ...fields, extra: { metadata: buildCodingAgentMetadata(metadata) } };
    const theirs = join(queue, queueName(fields.id));
    writeFileSync(
      theirs,
      JSON.stringify({ tracing: "full", origin: legacyOrigin("another-key"), run: queued }),
    );
    const turnId = stableRunId(0, "unfinished");
    const unfinished = join(turns, `${turnId}.turn.jsonl`);
    const line = {
      k: "run",
      root: true,
      origin: legacyOrigin(config.apiKey),
      run: { run_id: turnId },
    };
    writeFileSync(unfinished, JSON.stringify(line));
    const theirTurnId = stableRunId(0, "their-turn");
    const theirTurn = join(turns, `${theirTurnId}.turn.jsonl`);
    const theirLines = [
      {
        ...line,
        origin: legacyOrigin("another-key"),
        run: { ...run(theirTurnId), run_id: theirTurnId, tracing: "full" },
      },
      { k: "closed" },
    ];
    writeFileSync(theirTurn, theirLines.map((entry) => JSON.stringify(entry)).join("\n"));
    for (const file of [theirs, unfinished, theirTurn]) old(file, 2 * DAY);
    legacyEnvironment();
    const { runEngineWorker } = await import("./tracing-engine.js");

    await runEngineWorker(root, "s1");

    expect(existsSync(theirs)).toBe(true);
    expect(existsSync(unfinished)).toBe(true);
    expect(existsSync(theirTurn)).toBe(true);
    expect(await saved()).toEqual([]);
  });

  it.each([
    [5 * HOUR, true],
    [7 * HOUR, false],
  ])("an unreadable entry %i ms old is kept: %s", async (age, kept) => {
    spawned.mockImplementation(() => {
      throw new Error("no worker");
    });
    const queue = join(root, "langsmith_queue", "s1");
    mkdirSync(queue, { recursive: true });
    const unreadable = join(queue, queueName(stableRunId(0, "unreadable")));
    writeFileSync(unreadable, "{");
    old(unreadable, age);
    legacyEnvironment();
    const { runEngineWorker } = await import("./tracing-engine.js");

    await runEngineWorker(root, "s1");

    expect(existsSync(unreadable)).toBe(kept);
    if (!kept) expect(warned).toHaveBeenCalledWith(expect.stringMatching(/^Removed 1 file/));
  });
});

describe("leftovers the previous version never cleaned up", () => {
  const id = stableRunId(0, "leftover");
  const none = new Set<string>();

  function leftovers() {
    const queue = join(root, "langsmith_queue");
    const turns = join(root, "langsmith_turns");
    mkdirSync(join(queue, "s1"), { recursive: true });
    mkdirSync(join(turns, "s1"), { recursive: true });
    const files = {
      entry: join(queue, "s1", queueName(id)),
      staged: join(queue, "s1", `${queueName(id)}.${id}.queue.tmp`),
      record: join(turns, "s1", `${id}.turn.jsonl`),
      lock: join(queue, "s1.flush.lock"),
    };
    for (const file of Object.values(files)) writeFileSync(file, "x");
    return { queue, turns, files };
  }

  it("removes old unreadable entries, half-written entries and locks, and the folders they leave empty", () => {
    const { queue, turns, files } = leftovers();
    for (const file of Object.values(files)) old(file, 2 * DAY);
    old(join(queue, "s1"), 2 * DAY);
    old(join(turns, "s1"), 2 * DAY);

    const aged = sweepLegacyLeftovers(config.stateFilePath, new Set([files.entry, files.record]));

    expect(aged).toBe(3);
    expect(readdirSync(root)).not.toContain("langsmith_queue");
    expect(readdirSync(root)).not.toContain("langsmith_turns");
  });

  it("keeps recent files and the folders that hold them", () => {
    const { queue, files } = leftovers();

    sweepLegacyLeftovers(config.stateFilePath, new Set([files.entry, files.record]));

    for (const file of Object.values(files)) expect(existsSync(file)).toBe(true);
    expect(readdirSync(queue).sort()).toEqual(["s1", "s1.flush.lock"]);
  });

  it("keeps an old entry the import did not hand over", () => {
    const { files } = leftovers();
    for (const file of Object.values(files)) old(file, 2 * DAY);

    sweepLegacyLeftovers(config.stateFilePath, none);

    expect(existsSync(files.entry)).toBe(true);
    expect(existsSync(files.record)).toBe(true);
  });

  it("keeps an empty folder that was just created", () => {
    mkdirSync(join(root, "langsmith_queue", "s1"), { recursive: true });

    sweepLegacyLeftovers(config.stateFilePath, none);

    expect(readdirSync(join(root, "langsmith_queue"))).toEqual(["s1"]);
  });

  it("never follows a link out of its own folders", () => {
    const { queue } = leftovers();
    const outside = join(root, "outside");
    mkdirSync(outside);
    const target = join(outside, "keep.txt");
    writeFileSync(target, "x");
    old(target, 2 * DAY);
    const linked = join(queue, "s1", `${queueName(id)}.${stableRunId(0, "link")}.queue.tmp`);
    symlinkSync(target, linked);
    lutimesSync(linked, new Date(Date.now() - 2 * DAY), new Date(Date.now() - 2 * DAY));
    const staged = join(outside, `${queueName(id)}.${id}.queue.tmp`);
    writeFileSync(staged, "x");
    old(staged, 2 * DAY);
    symlinkSync(outside, join(queue, "s2"));

    sweepLegacyLeftovers(config.stateFilePath, new Set([linked]));

    expect(readdirSync(outside).sort()).toEqual([`${queueName(id)}.${id}.queue.tmp`, "keep.txt"]);
  });

  it("keeps files it does not recognise and folders nested inside a session", () => {
    const { queue } = leftovers();
    const stray = join(queue, "s1", "notes.txt");
    const nested = join(queue, "s1", `${queueName(id)}.${stableRunId(0, "nested")}.queue.tmp`);
    const inner = join(nested, `${queueName(id)}.${id}.queue.tmp`);
    writeFileSync(stray, "x");
    mkdirSync(nested);
    writeFileSync(inner, "x");
    for (const path of [stray, inner, nested]) old(path, 2 * DAY);

    expect(() =>
      sweepLegacyLeftovers(config.stateFilePath, new Set([stray, nested])),
    ).not.toThrow();

    expect(existsSync(stray)).toBe(true);
    expect(existsSync(inner)).toBe(true);
  });
});

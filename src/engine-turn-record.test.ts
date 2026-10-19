import { describe, expect, it } from "vitest";
import { readEngineTurn } from "./engine-turn-record.js";
import { codingAgentMetadata } from "./metadata.js";
import type { ClaudeTracingSession } from "./types.js";

interface Entry {
  runId: string;
  eventId: string;
  eventKind?: string;
  at: number;
  fingerprint?: string;
  children?: string[];
}

const capture = ({
  runId,
  eventId,
  eventKind = "run-post",
  at,
  fingerprint = "f",
  children,
}: Entry) => ({
  record: {
    runId,
    eventId,
    eventKind,
    capturedAtMs: at,
    destinationFingerprint: fingerprint,
    turnEvidence: { childRunIds: children ?? [] },
    normalizedPayload: {
      privacyMode: "full",
      run: {
        parent_run_id: undefined,
        trace_id: "turn",
        dotted_order: runId,
        name: runId,
        run_type: "tool",
      },
    },
    metadataProvenance: codingAgentMetadata({ sessionId: "s1", agentType: "root" }),
  },
});

function context(entries: Entry[], delivered: string[]): ClaudeTracingSession {
  return {
    sessionId: "s1",
    fingerprint: "f",
    destinations: [{ id: "primary" }],
    store: {
      enumerateTurn: async () => entries.map(capture),
      readOutcome: async (record: { runId: string }) =>
        delivered.includes(record.runId)
          ? { status: "settled", receipt: { outcome: "delivered" } }
          : { status: "pending" },
    },
  } as never;
}

const root: Entry = { runId: "turn", eventId: "post:turn", at: 1, children: ["a", "b"] };

describe("readEngineTurn", () => {
  it("has nothing to say about a turn whose root was never captured", async () => {
    expect(await readEngineTurn(context([], []), "turn")).toBeUndefined();
  });

  it("says the turn landed once every tool run it saw has been delivered", async () => {
    const entries = [
      root,
      { runId: "a", eventId: "tool:a", at: 2 },
      { runId: "b", eventId: "tool:b", at: 3 },
    ];

    const turn = await readEngineTurn(context(entries, ["a", "b"]), "turn");

    expect(turn?.landed).toBe(true);
    expect(turn?.record.children.map((child) => child.run_id).sort()).toEqual(["a", "b"]);
    expect(turn?.record.origin).toBe("f");
  });

  it("holds the turn back while a tool run is still undelivered", async () => {
    const entries = [
      root,
      { runId: "a", eventId: "tool:a", at: 2 },
      { runId: "b", eventId: "tool:b", at: 3 },
    ];

    const turn = await readEngineTurn(context(entries, ["a"]), "turn");

    expect(turn?.landed).toBe(false);
    expect(turn?.record.delivered.has("b")).toBe(false);
  });

  it("counts a child that is not a tool run as delivered with the turn", async () => {
    const entries = [
      { ...root, children: ["llm"] },
      { runId: "llm", eventId: "post:llm", at: 2 },
    ];

    expect((await readEngineTurn(context(entries, []), "turn"))?.landed).toBe(true);
  });

  it("ignores work saved for a different account", async () => {
    const entries = [
      root,
      { runId: "a", eventId: "tool:a", at: 2 },
      { runId: "b", eventId: "tool:b", at: 3, fingerprint: "other" },
    ];

    const turn = await readEngineTurn(context(entries, ["a"]), "turn");

    expect(turn?.record.children.map((child) => child.run_id)).toEqual(["a"]);
  });
});

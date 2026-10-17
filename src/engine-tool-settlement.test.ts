import { beforeEach, describe, expect, it, vi } from "vitest";
import { captureToolRun, settleToolRuns } from "./engine-tool-settlement.js";
import { codingAgentMetadata } from "./metadata.js";
import type { ClaudeRun, ClaudeTracingSession, ToolOrigin } from "./types.js";

const settled = vi.hoisted(() => vi.fn());
vi.mock("./repo-attribution.js", () => ({ settledRepositoryMetadata: settled }));
vi.mock("./logger.js", () => ({ warn: vi.fn(), debug: vi.fn(), error: vi.fn() }));

const origin: ToolOrigin = { cwd: "/work", path: "/work/a.ts", namedAPath: true };

const run: ClaudeRun = {
  id: "tool-1",
  name: "Edit",
  run_type: "tool",
  start_time: "2026-01-01T00:00:00.000Z",
  end_time: "2026-01-01T00:00:01.000Z",
  trace_id: "turn",
  dotted_order: "order",
  metadata: codingAgentMetadata({ sessionId: "s1", agentType: "root", toolName: "Edit" }),
};

function context(rootPosted: boolean) {
  const session = {
    capture: vi.fn(async () => ({ status: "published" })),
    queueReconstruction: vi.fn(async () => ({ status: "published" })),
    readSavedReconstructionWake: vi.fn(async () => undefined),
  };
  const store = { read: vi.fn(async () => (rootPosted ? {} : undefined)) };
  return {
    session,
    store,
    value: {
      session,
      store,
      sessionId: "s1",
      fingerprint: "f",
      destinations: [],
    } as never as ClaudeTracingSession,
  };
}

beforeEach(() => settled.mockReset());

describe("captureToolRun", () => {
  it("saves a muted tool run straight away rather than waiting for its repository", async () => {
    const { session, value } = context(true);

    await captureToolRun(value, run, "metadata", "turn", origin);

    expect(session.capture).toHaveBeenCalledOnce();
    expect(session.queueReconstruction).not.toHaveBeenCalled();
  });

  it("queues a full tool run under the open turn together with where it worked", async () => {
    const { session, value } = context(true);

    await captureToolRun(value, run, "full", "turn", origin);

    expect(session.queueReconstruction).toHaveBeenCalledWith(
      expect.objectContaining({
        turnId: "turn",
        eventId: "tool:tool-1",
        sourceRefs: ["tool-1"],
        turnEvidence: { childRunIds: ["tool-1"], closureState: "open" },
        sourceSnapshots: [expect.objectContaining({ attributionContext: { toolOrigin: origin } })],
      }),
    );
  });

  it("treats the tool run as its own turn when the turn was never captured", async () => {
    const { session, value } = context(false);

    await captureToolRun(value, run, "full", "turn", origin);

    expect(session.queueReconstruction).toHaveBeenCalledWith(
      expect.objectContaining({ turnId: "tool-1" }),
    );
  });

  it("keeps going when the tool run was saved but its uploader did not start", async () => {
    const { session, value } = context(true);
    session.queueReconstruction.mockRejectedValue(new Error("no worker"));
    session.readSavedReconstructionWake.mockResolvedValue({ saved: true } as never);

    await expect(captureToolRun(value, run, "full", "turn", origin)).resolves.toBeUndefined();
  });
});

describe("settleToolRuns", () => {
  const job = (attributionContext?: unknown, parent?: string) =>
    ({
      turnId: "turn",
      sessionId: "s1",
      sourceSnapshots: [
        {
          sourceRef: "tool-1",
          submission: {
            run: { id: "tool-1", parent_run_id: parent },
            metadata: { integration: "claude-code", base: { cwd: "/work" } },
          },
          attributionContext,
        },
      ],
    }) as never;

  it("posts each tool run with the repository settled from where it worked", async () => {
    settled.mockReturnValue({ cwd: "/work", ls_git_repo: "acme/x" });

    const result = await settleToolRuns(job({ toolOrigin: origin }));

    expect(settled).toHaveBeenCalledWith({ cwd: "/work" }, origin);
    expect(result).toMatchObject({
      status: "ready",
      outputs: [
        {
          eventId: "post:tool-1",
          sourceRef: "tool-1",
          submission: { metadata: { base: { cwd: "/work", ls_git_repo: "acme/x" } } },
        },
      ],
    });
  });

  it("names the turn's saved post as the parent of a tool run under that turn", async () => {
    settled.mockReturnValue(undefined);

    const underTurn = await settleToolRuns(job(undefined, "turn"));
    const ownTurn = await settleToolRuns(job(undefined, "elsewhere"));

    expect(underTurn).toMatchObject({
      outputs: [
        {
          dependencies: [
            { integration: "claude-code", sessionId: "s1", turnId: "turn", eventId: "post:turn" },
          ],
        },
      ],
    });
    expect(ownTurn).toMatchObject({ outputs: [expect.not.objectContaining({ dependencies: [] })] });
    expect(JSON.stringify(ownTurn)).not.toContain("dependencies");
  });

  it("keeps the original metadata when nothing could be settled", async () => {
    settled.mockReturnValue(undefined);

    const result = await settleToolRuns(job({ toolOrigin: origin }));

    expect(result).toMatchObject({
      outputs: [{ submission: { metadata: { base: { cwd: "/work" } } } }],
    });
  });

  it("assumes the tool named no path when no origin was saved", async () => {
    settled.mockReturnValue(undefined);

    await settleToolRuns(job());

    expect(settled).toHaveBeenCalledWith({ cwd: "/work" }, { namedAPath: false });
  });
});

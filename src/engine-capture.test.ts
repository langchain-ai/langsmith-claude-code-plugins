import { beforeEach, describe, expect, it, vi } from "vitest";
import { attributionReady, captureInput, saveOrWarn } from "./engine-capture.js";
import { codingAgentMetadata } from "./metadata.js";
import type { ClaudeRun } from "./types.js";

const warn = vi.hoisted(() => vi.fn());
vi.mock("./logger.js", () => ({ warn, debug: vi.fn(), error: vi.fn() }));

beforeEach(() => warn.mockClear());

const run = (overrides: Partial<ClaudeRun> = {}): ClaudeRun => ({
  id: "run-1",
  name: "Bash",
  run_type: "tool",
  start_time: "2026-01-01T00:00:00.000Z",
  inputs: { input: "ls" },
  trace_id: "trace",
  dotted_order: "order",
  metadata: codingAgentMetadata({ sessionId: "s1", agentType: "root" }),
  ...overrides,
});

describe("attributionReady", () => {
  it("is true only once both the repository and the author are known", () => {
    const base = { ls_git_repo: "acme/x", ls_attribution_identifier: "dev" };
    const ready = (extra: Record<string, unknown>) =>
      attributionReady(codingAgentMetadata({ sessionId: "s1", agentType: "root", base: extra }));

    expect(ready(base)).toBe(true);
    expect(ready({ ls_git_repo: "acme/x" })).toBe(false);
    expect(ready({ ls_attribution_identifier: "dev" })).toBe(false);
  });
});

describe("captureInput", () => {
  it("keeps only the fields that exist for a post and does not alias the caller's run", () => {
    const original = run();
    const input = captureInput(original, "full", "turn", "post", "s1", false);
    original.inputs!.input = "changed";

    expect(input.eventId).toBe("post:run-1");
    expect(input.submission).toMatchObject({ operation: "post", run: { inputs: { input: "ls" } } });
  });

  it("records a patch's end state and waits for the post it follows", () => {
    const closing = run({ end_time: "2026-01-01T00:00:01.000Z", outputs: { output: "a" } });
    const input = captureInput(closing, "full", "turn", "patch", "s1", true);

    expect(input.submission).toMatchObject({
      operation: "patch",
      privacyContext: { status: "completed" },
      patch: { fields: ["outputs", "end_time"] },
    });
    expect(input.dependencies).toEqual([
      { integration: "claude-code", sessionId: "s1", turnId: "turn", eventId: "post:run-1" },
    ]);
  });

  it("marks a patch as an error when the run failed", () => {
    const input = captureInput(run({ error: "boom" }), "full", "turn", "patch", "s1", false);

    expect(input.submission).toMatchObject({ privacyContext: { status: "error" } });
  });

  it("names a child run as awaiting attribution until its repository is known", () => {
    const child = captureInput(run(), "full", "turn", "post", "s1", false);

    expect(child.turnEvidence).toMatchObject({ childRunIds: ["run-1"], closureState: "open" });
  });

  it("treats a closed root as authoritative", () => {
    const root = run({ id: "turn", end_time: "2026-01-01T00:00:01.000Z" });

    expect(captureInput(root, "full", "turn", "patch", "s1", false).turnEvidence).toMatchObject({
      rootRunId: "turn",
      closureState: "authoritative",
    });
  });
});

describe("saveOrWarn", () => {
  it("is quiet for a published or duplicate run", async () => {
    await saveOrWarn(
      "r",
      async () => ({ status: "published" }),
      async () => undefined,
    );
    await saveOrWarn(
      "r",
      async () => ({ status: "duplicate" }),
      async () => undefined,
    );

    expect(warn).not.toHaveBeenCalled();
  });

  it("warns when the run could not be saved", async () => {
    await saveOrWarn(
      "r",
      async () => ({ status: "conflict" }),
      async () => undefined,
    );

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("conflict"));
  });

  it("warns instead of failing when the work was saved but its uploader did not start", async () => {
    await saveOrWarn(
      "r",
      async () => {
        throw new Error("no worker");
      },
      async () => ({ saved: true }),
    );

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("uploader did not start"));
  });

  it("rethrows a failure that did not save anything", async () => {
    await expect(
      saveOrWarn(
        "r",
        async () => {
          throw new Error("disk full");
        },
        async () => undefined,
      ),
    ).rejects.toThrow("disk full");
  });
});

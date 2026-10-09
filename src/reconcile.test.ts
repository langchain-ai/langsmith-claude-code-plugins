import { describe, expect, it } from "vitest";

import { metadataAfterFill, reconcileTurn, turnAttribution } from "./reconcile.js";
import { inAlpha, inBeta, record, recorded } from "./fixtures/turn-record-sandbox.js";

const bare = { cwd: "/somewhere", thread_id: "s1" };

describe("what a turn settles on", () => {
  // Catches a reconcile that ignores the repository the session already configured and
  // goes looking at the tools instead, which relabels a whole turn from one stray call.
  it("keeps the repository the turn's own root already carries", () => {
    const turn = record({ ...bare, ...inAlpha }, [recorded("Glob", { ...bare, ...inBeta })]);

    expect(turnAttribution(turn)).toMatchObject({ repository_name: "acme/a" });
  });

  // Catches evidence picked in the order uploads finished rather than the order the
  // tools ran, which labels a turn from whichever call happened to answer first.
  it("takes the repository from the earliest tool call, not the first one recorded", () => {
    const turn = record(bare, [
      recorded("Edit", { ...bare, ...inAlpha }, 1),
      recorded("Glob", { ...bare, ...inBeta }, 2),
    ]);
    turn.children.reverse();

    expect(turnAttribution(turn)).toMatchObject({ repository_name: "acme/a" });
  });

  // Catches an author taken from a tool working in a different repository, which
  // credits one codebase's work to someone who never touched it.
  it("leaves the author alone when the only one on offer worked somewhere else", () => {
    const turn = record(bare, [
      recorded("Glob", { ...bare, repository_name: "acme/a" }, 1),
      recorded("Edit", { ...bare, ...inBeta }, 2),
    ]);

    expect(turnAttribution(turn)?.ls_attribution_identifier).toBeUndefined();
  });

  // Catches a turn that settles on nothing because no tool reached a repository, when
  // one of them still knew who was working.
  it("still names the author when nothing landed in a repository", () => {
    const turn = record(bare, [recorded("Bash", { ...bare, ls_attribution_identifier: "Nobody" })]);

    expect(turnAttribution(turn)).toEqual({ ls_attribution_identifier: "Nobody" });
  });

  // Catches a reconcile that invents an empty fill and patches every run with nothing,
  // which costs a request per run and rewrites metadata for no reason.
  it("settles on nothing when no run knew anything", () => {
    expect(turnAttribution(record(bare, [recorded("Bash", bare)]))).toBeUndefined();
  });
});

describe("what one run ends up with", () => {
  // Catches a fill that drops one repository's branch or commit onto another's name,
  // which is worse than leaving the gap.
  it("never mixes one repository's name with another's branch", () => {
    const partial = { ...bare, repository_name: "acme/b", git_branch: "trunk-b" };

    expect(metadataAfterFill(recorded("Edit", partial), inAlpha)).toBeUndefined();
  });

  // Catches a patch that sends only the repository keys, which drops everything else
  // the run already carried because an update replaces the whole metadata block.
  it("keeps every field the run already had", () => {
    const filled = metadataAfterFill(recorded("Bash", { ...bare, ls_tool_name: "Bash" }), inAlpha);

    expect(filled).toEqual({ ...bare, ls_tool_name: "Bash", ...inAlpha });
  });

  // Catches a reconcile that patches a run which already has everything, so every turn
  // costs a pointless request per run forever.
  it("asks for no change when the run already has it all", () => {
    expect(metadataAfterFill(recorded("Edit", { ...bare, ...inAlpha }), inAlpha)).toBeUndefined();
  });

  // Catches a fill that only adds the repository and leaves the author missing, when
  // the author is half of what the turn was reconciled for.
  it("fills the author onto a run that only knew the repository", () => {
    const run = recorded("Edit", { ...bare, repository_name: "acme/a" });

    expect(metadataAfterFill(run, inAlpha)).toMatchObject({
      ls_attribution_identifier: "Alpha Owner",
      git_branch: "trunk-a",
    });
  });
});

describe("letting go of a turn", () => {
  const nothingUploads = {
    client: undefined as never,
    replicas: undefined,
    watch: { failure: () => undefined },
  };

  // Catches a turn nobody ever closed being kept on disk for good, since the age limit sat
  // behind the check for a close that never comes. No other test leaves a turn unfinished.
  it("gives up on a turn left unfinished for longer than the service will accept", async () => {
    const old = record(bare, [], { closed: false });
    old.root!.start_time = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    await expect(reconcileTurn({ record: old, ...nothingUploads })).resolves.toBe(true);
  });

  // Catches a turn still running being thrown away mid-flight, which loses every call
  // recorded for it so far.
  it("keeps a turn that is still running", async () => {
    const live = record(bare, [], { closed: false });

    await expect(reconcileTurn({ record: live, ...nothingUploads })).resolves.toBe(false);
  });
});

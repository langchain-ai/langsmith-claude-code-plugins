import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  alpha,
  appendReply,
  beta,
  createdMetadataAll,
  createdMetadataOf,
  hook,
  metadataOf,
  notification,
  plain,
  prompt,
  recordFiles,
  hookLog,
  recordLines,
  service,
  stop,
  subagent,
  task,
  tool,
  reply,
  useReconcileSandbox,
  waitFor,
} from "./fixtures/reconcile-sandbox.js";

const session = (id: string, cwd: string) => ({
  session_id: id,
  transcript_path: join(plain, `${id}.jsonl`),
  cwd,
});

describe("settling a turn's repository and author", { timeout: 120_000 }, () => {
  useReconcileSandbox();

  // Catches a tool call that waits on the upload before the hook returns, which is the
  // whole cost this change removes. No other test holds the service open mid-turn.
  it("finishes a tool call before a deliberately slow upload has answered", async () => {
    const base = session("slow-upload", alpha);
    await prompt(base);

    service.delayMs = 2000;
    const startedAt = Date.now();
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    const hookTook = Date.now() - startedAt;

    expect(hookTook).toBeLessThan(service.delayMs);
    service.delayMs = 0;
    expect(await waitFor(() => metadataOf("Read").repository_name === "acme/a")).toBe(true);
  });

  // Catches every call being left running until the turn ends, which shows a finished tool
  // as still working and leaves it that way for good if the turn never closes.
  it("finishes a call that already knows where it worked", async () => {
    const base = session("already-known", alpha);
    await prompt(base);
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    await tool(base, "Glob", { path: join(plain, "notes.txt") });

    expect(
      await waitFor(() => service.created.filter((run) => run.run_type === "tool").length === 2),
    ).toBe(true);
    const created = (name: string) => service.created.find((run) => run.name === name);
    expect(created("Read")?.end_time).toBeTruthy();
    expect(created("Glob")?.end_time).toBeFalsy();
  });

  // Catches a reconcile that never runs for a turn that already knew its repository, so a
  // call reaching outside the checkout is the one run in the trace with no repository at all.
  it("gives the turn's own repository to a call that landed outside every repository", async () => {
    const base = session("root-known", alpha);
    await prompt(base);
    await tool(base, "Read", { file_path: join(plain, "notes.txt") });
    reply(base);
    await stop(base);

    expect(await waitFor(() => metadataOf("Read").repository_name === "acme/a")).toBe(true);
    expect(metadataOf("Read")).toMatchObject({
      git_branch: "trunk-a",
      ls_attribution_identifier: "Alpha Owner",
    });
    // The turn's own run was finished by its close, so the service refusing the repeat is
    // the turn being settled rather than something to retry forever.
    expect(await waitFor(() => recordFiles("root-known").length === 0)).toBe(true);
  });

  // Catches a model run closed the moment the turn is traced, which is the one run under a
  // turn that can never be told who was working once the turn has settled.
  it("uploads a model run already knowing the repository and the author", async () => {
    const base = session("model-born-known", alpha);
    await prompt(base);
    reply(base);
    await stop(base);

    expect(
      await waitFor(() => Object.keys(createdMetadataOf(base.session_id, "Claude")).length > 0),
    ).toBe(true);
    expect(createdMetadataOf(base.session_id, "Claude")).toMatchObject({
      repository_name: "acme/a",
      git_branch: "trunk-a",
      ls_attribution_identifier: "Alpha Owner",
    });
  });

  // Catches a model run uploaded before the turn's own tool calls are consulted, which
  // leaves it the only run in the trace with no repository at all.
  it("uploads a model run knowing the repository a call reached into", async () => {
    const base = session("model-born-outside", plain);
    await prompt(base);
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    reply(base);
    await stop(base);

    expect(
      await waitFor(() => Object.keys(createdMetadataOf(base.session_id, "Claude")).length > 0),
    ).toBe(true);
    expect(createdMetadataOf(base.session_id, "Claude")).toMatchObject({
      repository_name: "acme/a",
      git_branch: "trunk-a",
      ls_attribution_identifier: "Alpha Owner",
    });
  });

  // Catches a sub-task and everything under it being built from what the session knew
  // at the start, so the Task, the subagent and its model calls arrive with no author.
  it("gives a sub-task and the runs beneath it the repository and the author", async () => {
    const base = session("subagent-born-known", plain);
    await prompt(base);
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    await subagent(base, "agent-7");
    await task(base, "agent-7");
    reply(base);
    await stop(base);

    const attributed = {
      repository_name: "acme/a",
      git_branch: "trunk-a",
      ls_attribution_identifier: "Alpha Owner",
    };
    expect(await waitFor(() => service.created.some((run) => run.name === "Agent"))).toBe(true);
    expect(createdMetadataOf(base.session_id, "Agent")).toMatchObject(attributed);
    expect(createdMetadataOf(base.session_id, "Explore Subagent")).toMatchObject(attributed);
    const beneath = createdMetadataAll(base.session_id, "Claude").filter(
      (metadata) => metadata.ls_agent_type === "subagent",
    );
    expect(beneath).toHaveLength(1);
    expect(beneath[0]).toMatchObject(attributed);
  });

  // Catches an interrupted turn's model calls being backfilled from what the session knew
  // at the start, so a turn nobody stopped is the one turn that loses its author.
  it("gives an interrupted turn's model calls the repository and the author", async () => {
    const base = session("interrupted-fill", plain);
    await prompt(base);
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    // The uploader works the repository out, so wait for that call to land before the
    // interrupted turn asks the record where it worked.
    expect(await waitFor(() => service.created.some((run) => run.name === "Read"))).toBe(true);
    reply(base);
    await prompt(base);

    expect(await waitFor(() => createdMetadataAll(base.session_id, "Claude").length > 0)).toBe(
      true,
    );
    expect(createdMetadataAll(base.session_id, "Claude")[0]).toMatchObject({
      repository_name: "acme/a",
      git_branch: "trunk-a",
      ls_attribution_identifier: "Alpha Owner",
    });
  });

  // Catches the write that closes a background agent being rebuilt from what the session
  // knew at startup, which lands on top of the good metadata and clears it for good.
  it("closes a background agent carrying the repository the turn worked out", async () => {
    const base = session("background-open", plain);
    await prompt(base);
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    expect(await waitFor(() => metadataOf("Read").repository_name === "acme/a")).toBe(true);
    await task(base, "agent-bg1");
    reply(base);
    await stop(base);

    // The agent finishes in the background, so its run is posted open here.
    await subagent(base, "agent-bg1");
    await notification(base, "agent-bg1");
    appendReply(base, 2);
    await stop(base);

    expect(await waitFor(() => service.updated.some((run) => run.name === "Agent"))).toBe(true);
    const attributed = {
      repository_name: "acme/a",
      git_branch: "trunk-a",
      ls_attribution_identifier: "Alpha Owner",
    };
    expect(metadataOf("Agent")).toMatchObject(attributed);
    expect(metadataOf("Claude Code Turn")).toMatchObject(attributed);
  });

  // Catches the turn that reports a background agent back being built from the session's
  // own folder, which has no repository, so it and its model call are the two runs in the
  // trace with nothing on them.
  it("labels the turn that reports a background agent back", async () => {
    const base = session("background-notify", plain);
    await prompt(base);
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    expect(await waitFor(() => metadataOf("Read").repository_name === "acme/a")).toBe(true);
    await task(base, "agent-bg3");
    reply(base);
    await stop(base);

    await subagent(base, "agent-bg3");
    await notification(base, "agent-bg3");
    appendReply(base, 2);
    await stop(base);

    const attributed = {
      repository_name: "acme/a",
      git_branch: "trunk-a",
      ls_attribution_identifier: "Alpha Owner",
    };
    const turns = createdMetadataAll(base.session_id, "Claude Code Turn");
    expect(turns).toHaveLength(2);
    expect(turns.at(-1)).toMatchObject(attributed);
    expect(createdMetadataAll(base.session_id, "Claude").at(-1)).toMatchObject(attributed);
  });

  // Catches the same gap on the other route: a killed agent's run is never posted open,
  // so it is created already closed and there is no earlier write to fall back on.
  it("creates a killed agent's run carrying the repository the turn worked out", async () => {
    const base = session("background-killed", plain);
    await prompt(base);
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    expect(await waitFor(() => metadataOf("Read").repository_name === "acme/a")).toBe(true);
    await task(base, "agent-bg2");
    reply(base);
    await stop(base);

    // No SubagentStop ever fires for a killed agent.
    await notification(base, "agent-bg2", "killed");
    appendReply(base, 2);
    await stop(base);

    expect(await waitFor(() => service.created.some((run) => run.name === "Agent"))).toBe(true);
    expect(service.updated.some((run) => run.name === "Agent")).toBe(false);
    expect(metadataOf("Agent")).toMatchObject({
      repository_name: "acme/a",
      git_branch: "trunk-a",
      ls_attribution_identifier: "Alpha Owner",
    });
  });

  // Catches a turn settled on half its calls, and a turn's own run closed before the
  // answer is in. Either one is permanent, since a closed run takes no correction.
  it("settles a turn whose answer only lands after it closed", async () => {
    const base = session("late-handler", plain);
    await prompt(base);
    // Nothing here says where the turn worked.
    await tool(base, "Bash", { command: "echo hi" });
    expect(await waitFor(() => service.created.some((run) => run.name === "Bash"))).toBe(true);

    // The one call that does is refused, and the call behind it waits its turn.
    service.refuse = "alpha repo";
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    await tool(base, "Edit", { file_path: join(beta, "seed.txt") });
    reply(base);
    await stop(base);
    expect(await waitFor(() => hookLog().includes("Queued run upload failed"))).toBe(true);

    service.refuse = "";
    await stop(base);
    expect(await waitFor(() => recordFiles("late-handler").length === 0)).toBe(true);

    const turn = metadataOf("Claude Code Turn");
    expect(turn.repository_name).toBe("acme/a");
    expect(turn.ls_attribution_identifier).toBe("Alpha Owner");
    expect(metadataOf("Read").repository_name).toBe("acme/a");
    expect(metadataOf("Bash").repository_name).toBe("acme/a");
    // A call that reached into the other checkout keeps it.
    expect(metadataOf("Edit")).toMatchObject({
      repository_name: "acme/b",
      ls_attribution_identifier: "Beta Owner",
    });
  });

  // Catches a reconcile that records success before the service accepted the change, so
  // a failed patch is never retried and the metadata is lost without a trace.
  it("retries a patch the service refused and leaves no duplicate behind", async () => {
    const base = session("failed-patch", plain);
    await prompt(base);
    await tool(base, "Bash", { command: "echo hi" });
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    await waitFor(() =>
      ["Bash", "Read"].every((name) => service.created.some((run) => run.name === name)),
    );

    service.fail = true;
    reply(base);
    await stop(base);
    // Wait for the refusal itself, so the retry below is a retry and not the first attempt.
    expect(await waitFor(() => hookLog().includes("Could not settle the repository"))).toBe(true);

    service.fail = false;
    await stop(base);
    expect(await waitFor(() => metadataOf("Bash").repository_name === "acme/a")).toBe(true);
    expect(await waitFor(() => metadataOf("Claude Code Turn").repository_name === "acme/a")).toBe(
      true,
    );
    expect(service.created.filter((run) => run.name === "Bash")).toHaveLength(1);
  });

  // Catches a call queued while another uploader is busy never being sent, since that call
  // starts an uploader that would otherwise give up the moment it found the lock taken.
  it("uploads a call queued while another uploader was busy", async () => {
    const base = session("busy-uploader", alpha);
    await prompt(base);

    // Slow answers keep the first uploader holding the lock while the next call is queued.
    service.delayMs = 600;
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    await tool(base, "Glob", { path: join(alpha, "seed.txt") });
    service.delayMs = 0;

    expect(await waitFor(() => service.created.some((run) => run.name === "Glob"))).toBe(true);
  });

  // Catches a session ending without a stop leaving every call it was holding open running
  // for good, since only the stop hook used to say the turn was over.
  it("finishes the calls a session leaves behind when it ends without stopping", async () => {
    const base = session("no-stop", plain);
    await prompt(base);
    await tool(base, "Bash", { command: "echo hi" });
    await tool(base, "Read", { file_path: join(alpha, "seed.txt") });
    await hook("SessionEnd", { ...base, hook_event_name: "SessionEnd", reason: "clear" });

    expect(await waitFor(() => metadataOf("Bash").repository_name === "acme/a")).toBe(true);
    expect(await waitFor(() => recordFiles("no-stop").length === 0)).toBe(true);
  });

  // Catches a muted turn writing the repository, the author or the tool's own content
  // into the plugin's copy on disk, which is content a mute must never produce.
  it("writes nothing a muted turn should not have written", async () => {
    const base = session("muted", alpha);
    const muted = { CC_LANGSMITH_DEFAULT_MUTED: "true" };
    await hook(
      "UserPromptSubmit",
      { ...base, hook_event_name: "UserPromptSubmit", prompt: "go" },
      muted,
    );
    await hook(
      "PostToolUse",
      {
        ...base,
        hook_event_name: "PostToolUse",
        tool_name: "Read",
        tool_use_id: "use-Read",
        tool_input: { file_path: join(alpha, "secret.txt") },
        tool_response: { ok: true },
      },
      muted,
    );
    // Read the plugin's own copy while the turn is still open, since it goes once settled.
    const written = JSON.stringify(recordLines("muted"));
    expect(written).not.toContain("secret.txt");
    expect(written).not.toContain("acme/a");
    expect(written).not.toContain("Alpha Owner");

    reply(base);
    await hook("Stop", { ...base, hook_event_name: "Stop", last_assistant_message: "done" }, muted);

    expect(await waitFor(() => service.created.some((run) => run.name === "Read"))).toBe(true);
    expect(metadataOf("Read").repository_name).toBeUndefined();
    expect(JSON.stringify(service.created)).not.toContain("secret.txt");
  });
});

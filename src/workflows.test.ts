import { describe, it, expect } from "vitest";
import { detectWorkflowLaunch, workflowRunIdFromPath, findWorkflowEntry } from "./workflows.js";
import { recordBackgroundRun } from "./background-runs.js";
import type { SessionState } from "./types.js";

describe("detectWorkflowLaunch", () => {
  const response = {
    status: "async_launched",
    taskId: "wsz6rbzbj",
    taskType: "local_workflow",
    workflowName: "trace-probe",
    runId: "wf_78d4c90f-9af",
  };

  it("detects a Workflow async launch", () => {
    expect(detectWorkflowLaunch("Workflow", response)).toEqual({
      taskId: "wsz6rbzbj",
      runId: "wf_78d4c90f-9af",
      workflowName: "trace-probe",
    });
  });

  it("ignores non-Workflow tools", () => {
    expect(detectWorkflowLaunch("Bash", response)).toBeUndefined();
  });

  it("ignores non-async-launch responses", () => {
    expect(detectWorkflowLaunch("Workflow", { ...response, status: "completed" })).toBeUndefined();
  });

  it("requires both taskId and runId", () => {
    expect(
      detectWorkflowLaunch("Workflow", { status: "async_launched", taskId: "x" }),
    ).toBeUndefined();
    expect(
      detectWorkflowLaunch("Workflow", { status: "async_launched", runId: "wf_x" }),
    ).toBeUndefined();
  });

  it("tolerates null/garbage responses", () => {
    expect(detectWorkflowLaunch("Workflow", null)).toBeUndefined();
    expect(detectWorkflowLaunch("Workflow", "nope")).toBeUndefined();
  });
});

describe("workflowRunIdFromPath", () => {
  it("extracts the run_id from a stage transcript path", () => {
    const path =
      "/Users/x/.claude/projects/proj/sess/subagents/workflows/wf_78d4c90f-9af/agent-aef84d540b9277f6c.jsonl";
    expect(workflowRunIdFromPath(path)).toBe("wf_78d4c90f-9af");
  });

  it("returns undefined for a non-workflow path", () => {
    expect(workflowRunIdFromPath("/Users/x/sess/subagents/agent-abc.jsonl")).toBeUndefined();
  });
});

describe("findWorkflowEntry", () => {
  const map: SessionState["task_run_map"] = {
    a1b2c3: { run_id: "r1", dotted_order: "d1" }, // a Task agent, no workflow_run_id
    wsz6rbzbj: {
      run_id: "r2",
      dotted_order: "d2",
      workflow_run_id: "wf_78d4c90f-9af",
      is_workflow: true,
    },
  };

  it("finds the workflow entry by run_id, returning its taskId key", () => {
    const found = findWorkflowEntry(map, "wf_78d4c90f-9af");
    expect(found?.[0]).toBe("wsz6rbzbj");
    expect(found?.[1].run_id).toBe("r2");
  });

  it("returns undefined when no entry matches", () => {
    expect(findWorkflowEntry(map, "wf_other")).toBeUndefined();
    expect(findWorkflowEntry(undefined, "wf_x")).toBeUndefined();
  });
});

describe("recordBackgroundRun", () => {
  const turn = {
    run_id: "turn-1",
    trace_id: "trace-1",
    dotted_order: "do-1",
    parent_run_id: undefined,
    start_time: "2026-07-01T00:00:00.000Z",
    turn_number: 5,
  };

  it("records the run in task_run_map and registers it under the launching turn", () => {
    const session: SessionState = { last_line: 0, turn_count: 0, updated: "" };
    const update = recordBackgroundRun(session, turn, "wsz6rbzbj", {
      run_id: "r2",
      dotted_order: "d2",
      is_workflow: true,
      subagent_done: true,
    });

    expect(update.task_run_map?.wsz6rbzbj).toMatchObject({ run_id: "r2", is_workflow: true });
    expect(update.open_turns?.["turn-1"].agent_ids).toEqual(["wsz6rbzbj"]);
    expect(update.open_turns?.["turn-1"].stop_seen).toBe(false);
    expect(update.open_turns?.["turn-1"].turn_number).toBe(5);
  });

  it("appends to existing agent_ids without duplicating and preserves stop_seen", () => {
    const session: SessionState = {
      last_line: 0,
      turn_count: 0,
      updated: "",
      open_turns: {
        "turn-1": { run_id: "turn-1", stop_seen: true, agent_ids: ["existing"] },
      },
    };
    const update = recordBackgroundRun(session, turn, "wsz6rbzbj", {
      run_id: "r2",
      dotted_order: "d2",
    });
    expect(update.open_turns?.["turn-1"].agent_ids).toEqual(["existing", "wsz6rbzbj"]);
    expect(update.open_turns?.["turn-1"].stop_seen).toBe(true);

    // Re-recording the same id must not duplicate it.
    const again = recordBackgroundRun(
      { ...session, open_turns: update.open_turns },
      turn,
      "wsz6rbzbj",
      { run_id: "r2", dotted_order: "d2" },
    );
    expect(again.open_turns?.["turn-1"].agent_ids).toEqual(["existing", "wsz6rbzbj"]);
  });
});

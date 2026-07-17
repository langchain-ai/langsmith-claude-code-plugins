/**
 * Dynamic Workflow tracing.
 *
 * The `Workflow` tool launches a background workflow that orchestrates several
 * subagents ("stages"). It reaches the hooks differently from the `Task`/`Agent`
 * tool, so it needs its own correlation:
 *
 *  - Launch — PostToolUse sees `tool_name: "Workflow"` with a structured
 *    `tool_response` ({ status: "async_launched", taskId, runId, … }). Unlike
 *    Task (whose subagent type is only known later, so its Agent run is
 *    deferred), the Workflow run's name is known at launch, so PostToolUse posts
 *    it OPEN immediately and keeps it open until finalize — like a background
 *    Agent run, keyed in `task_run_map` by the *taskId* (the id its completion
 *    task-notification carries).
 *
 *  - Stages — each stage finishes with a SubagentStop whose `agent_type` is
 *    {@link WORKFLOW_SUBAGENT_TYPE} and whose transcript lives at
 *    `…/subagents/workflows/<runId>/agent-<id>.jsonl`. There is no per-stage
 *    Agent tool run; every stage nests as a chain under the one Workflow run,
 *    correlated by the `<runId>` embedded in the transcript path.
 *
 *  - Completion — the workflow emits a single task-notification (carrying the
 *    taskId), which nests + finalizes the Workflow run through the same
 *    machinery as a background agent. There is no whole-workflow SubagentStop,
 *    which is why the Workflow run is posted open at launch (finalize patches it
 *    closed) rather than posted by a SubagentStop.
 *
 * TODO(killed workflows): a *killed* workflow emits no signal at kill time — no
 * task-notification, and its aborted in-flight stage does not fire SubagentStop
 * (verified empirically; unlike a killed subagent, which gets a
 * `<status>killed</status>` notification we finalize on). So the open Workflow
 * run + its deferred launching turn currently close only via the SessionEnd
 * backstop (shown as completed). The one kill-referencing signal is a
 * `<status>stopped</status>` task-notification carrying the taskId, but it's
 * emitted on the *next* Claude Code startup when reconciling background tasks
 * with no completion record — an unbounded delay, and redundant with SessionEnd
 * on a clean exit. If we ever want prompt "killed" marking, wire that "stopped"
 * status into the notification-interrupted path (finalize as interrupted); until
 * then the SessionEnd backstop is the accepted behavior. See the
 * `killed-workflow-no-signal` memory.
 */

import { debug, error } from "./logger.js";
import { flushPendingTraces, traceWorkflowStage } from "./langsmith.js";
import type { TaskRunEntry } from "./langsmith.js";
import { getSessionState, loadState } from "./state.js";
import type { SessionState } from "./types.js";

/** The tool name that launches a dynamic workflow. */
export const WORKFLOW_TOOL_NAME = "Workflow";
/** SubagentStop `agent_type` for a workflow stage agent. */
export const WORKFLOW_SUBAGENT_TYPE = "workflow-subagent";

export interface WorkflowLaunch {
  /** Id the completion task-notification references → task_run_map key. */
  taskId: string;
  /** Workflow run_id (`wf_…`) → embedded in each stage's transcript path. */
  runId: string;
  workflowName?: string;
}

/**
 * Detect a background Workflow launch from PostToolUse input. Returns the launch
 * ids when `tool_name` is the Workflow tool and its response reports an async
 * launch with both ids present; otherwise undefined.
 */
export function detectWorkflowLaunch(
  toolName: string,
  toolResponse: unknown,
): WorkflowLaunch | undefined {
  if (toolName !== WORKFLOW_TOOL_NAME) return undefined;
  const r = toolResponse as
    | { status?: string; taskId?: string; runId?: string; workflowName?: string }
    | null
    | undefined;
  if (!r || r.status !== "async_launched" || !r.taskId || !r.runId) return undefined;
  return { taskId: r.taskId, runId: r.runId, workflowName: r.workflowName };
}

/**
 * Extract the workflow run_id (`wf_…`) from a stage's transcript path
 * (`…/subagents/workflows/<runId>/agent-<id>.jsonl`).
 */
export function workflowRunIdFromPath(path: string): string | undefined {
  return /\/workflows\/(wf_[A-Za-z0-9_-]+)\//.exec(path)?.[1];
}

/**
 * Find the Workflow `task_run_map` entry (keyed by taskId) for a given workflow
 * run_id. Returns `[taskId, entry]` or undefined if no matching run is recorded.
 */
export function findWorkflowEntry(
  taskRunMap: SessionState["task_run_map"],
  runId: string,
): [string, TaskRunEntry] | undefined {
  for (const [taskId, entry] of Object.entries(taskRunMap ?? {})) {
    if (entry.workflow_run_id === runId) return [taskId, entry as TaskRunEntry];
  }
  return undefined;
}

/**
 * Handle a `workflow-subagent` SubagentStop: correlate the stage back to its
 * open Workflow run (via the run_id in its transcript path) and nest the stage's
 * work as a chain under it. Does NOT drain/finalize the launching turn — the
 * workflow isn't finished until its task-notification arrives (more stages may
 * still run), and that notification owns finalization.
 */
export async function handleWorkflowSubagentStop(opts: {
  sessionId: string;
  agentId: string;
  agentType: string;
  agentTranscriptPath: string;
  stateFilePath: string;
  project: string;
  customMetadata?: Record<string, unknown>;
}): Promise<void> {
  const runId = workflowRunIdFromPath(opts.agentTranscriptPath);
  if (!runId) {
    error(`workflow-subagent ${opts.agentId}: no workflow run_id in ${opts.agentTranscriptPath}`);
    return;
  }

  const ss = getSessionState(loadState(opts.stateFilePath), opts.sessionId);
  const found = findWorkflowEntry(ss.task_run_map, runId);
  if (!found) {
    // The Workflow run isn't recorded (launched in another session, or state was
    // reset). Nothing to nest under — skip rather than orphan the stage.
    debug(`No Workflow run recorded for ${runId}; skipping stage ${opts.agentId}`);
    return;
  }

  const [, entry] = found;
  const deferred = entry.deferred as Record<string, unknown> | undefined;
  const launchingTurnId = deferred?.parent_run_id as string | undefined;
  const launchingTurn = launchingTurnId ? ss.open_turns?.[launchingTurnId] : undefined;
  const parentTraceId = (deferred?.trace_id as string | undefined) ?? ss.current_trace_id;

  try {
    await traceWorkflowStage({
      sessionId: opts.sessionId,
      project: opts.project,
      customMetadata: opts.customMetadata,
      workflowRun: { run_id: entry.run_id, dotted_order: entry.dotted_order },
      parentTraceId,
      stageAgentId: opts.agentId,
      stageType: opts.agentType,
      transcriptPath: opts.agentTranscriptPath,
      runtimeVersion: launchingTurn?.runtime_version ?? ss.runtime_version,
      turnId: launchingTurn?.turn_id,
      turnNumber: launchingTurn?.turn_number ?? ss.current_turn_number,
    });
    debug(`Traced workflow stage ${opts.agentId} under Workflow run ${entry.run_id}`);
  } catch (err) {
    error(`Failed to trace workflow stage ${opts.agentId}: ${err}`);
  }

  await flushPendingTraces();
}

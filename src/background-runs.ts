/**
 * Shared state-shaping for background runs launched by a turn.
 *
 * Both the Task/`Agent` tool and the dynamic `Workflow` tool launch work that
 * outlives the launching turn's Stop hook. PostToolUse records each such run in
 * two places, identically for both tool kinds:
 *
 *  - `task_run_map[backgroundId]` — the parent run to nest the eventual subagent
 *    / stage traces under (and to close when the run finishes).
 *  - `open_turns[launchingTurnRunId].agent_ids` — registers the run as in-flight
 *    under its launching turn, so Stop defers completing that turn until the
 *    run's SubagentStop / task-notification drains it.
 *
 * This module owns that shaping so PostToolUse doesn't grow a copy per tool kind.
 */

import type { SessionState } from "./types.js";
import type { TaskRunEntry } from "./langsmith.js";

/** Trace context of the turn that launched a background run. */
export interface LaunchingTurn {
  run_id: string;
  trace_id?: string;
  dotted_order?: string;
  parent_run_id?: string;
  start_time?: string;
  turn_number?: number;
  runtime_version?: string;
  approval_policy?: string;
}

/**
 * Compute the `task_run_map` + `open_turns` changes for recording a background
 * run (`backgroundId` → its parent-run `entry`) launched by `turn`. Merge the
 * returned maps into the session inside the same atomic update. `backgroundId`
 * is the Task subagent's agent_id or the Workflow's taskId.
 */
export function recordBackgroundRun(
  session: SessionState,
  turn: LaunchingTurn,
  backgroundId: string,
  entry: TaskRunEntry,
): Pick<SessionState, "task_run_map" | "open_turns"> {
  const existing = session.open_turns?.[turn.run_id];
  return {
    task_run_map: {
      ...session.task_run_map,
      [backgroundId]: entry,
    },
    open_turns: {
      ...session.open_turns,
      [turn.run_id]: {
        ...existing,
        run_id: turn.run_id,
        trace_id: turn.trace_id,
        dotted_order: turn.dotted_order,
        parent_run_id: turn.parent_run_id,
        start_time: turn.start_time,
        turn_number: turn.turn_number,
        runtime_version: turn.runtime_version,
        approval_policy: turn.approval_policy,
        stop_seen: existing?.stop_seen ?? false,
        agent_ids: [
          ...(existing?.agent_ids ?? []).filter((id) => id !== backgroundId),
          backgroundId,
        ],
      },
    },
  };
}

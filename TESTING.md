# Manual testing checklist

End-to-end scenarios for verifying Claude Code → LangSmith tracing. Each hits a
different hook path (turn lifecycle, sync/async subagents, cancellation,
workflows, blocking tools). Run them in a session with tracing enabled and
confirm the trace in LangSmith.

## How to verify each scenario

For every case, check three things in LangSmith:

1. **Root closes** — the top-level `Claude Code Turn` run has an `end_time`
   (status `success`, not `pending`). This is the #1 thing that regresses.
2. **Hierarchy** — children nest as described below (Assistant `llm` + tool runs
   under the turn; subagent/workflow work under its Agent/Workflow run).
3. **Status** — completed work is `success`; cancelled work carries the expected
   error; nothing is left `pending`.

Useful while debugging:

- Hook log: `~/.claude/state/hook.log` (set `CC_LANGSMITH_DEBUG=true`).
- State: `~/.claude/state/langsmith_state.json` — check `open_turns` (deferred
  turns), `task_run_map` (open Agent/Workflow runs), `current_turn_run_id`.
- A root stuck `pending` + a lingering `open_turns` entry = a turn that never
  finalized.

---

## Default mute configuration

- Enable tracing with test credentials. Set `CC_LANGSMITH_DEFAULT_MUTED=true` and use a thread with no saved override: prompt, tools, compaction, and subagents should upload metadata-only traces. No privacy preference file should be created by configuration alone.
- Set user `~/.claude/langsmith.json` to `{"defaultMuted":true}`, then project `.claude/langsmith.json` to `{"defaultMuted":false}`: the next unspecialized thread/turn should use full content. Check project > user > env precedence in both directions. An enabled-only file must not mask the default below it; a default-only file must not mask `enabled` below it.
- Run explicit unmute under default mute: subsequent turns stay full even after changing defaults. Explicit mute must likewise survive default unmute. Commands must not edit either config file; the privacy file must contain only `threads` with explicit `full`/`metadata` overrides.
- Change default while a turn/background Agent or Workflow is in flight: its saved mode remains unchanged, including finalization. The next turn (including a task notification) without an explicit override takes the new default.
- With test/legacy state lacking mode snapshots, check Stop, tool/compaction hooks, interruption/failure/session-end recovery, and background finalization use configured mute.
- With an empty privacy file override map (`{"threads":{}}`), changing configured default changes the next turn's mode without modifying the privacy file. Unknown top-level fields or invalid thread modes make the entire privacy file invalid: new turns stay metadata-only and commands refuse to overwrite it.
- Malformed/unreadable config disables uploads and resolves default muted; invalid present `defaultMuted` or an invalid environment value resolves muted. Corrupt privacy files remain metadata-only and commands refuse to overwrite them.
- Set project `enabled:false` with default mute and explicit unmute: no uploads to primary or replica destinations. Restore your settings after testing.

## Checklist

### 1. Normal message + response

- **Do:** Send a prompt that Claude answers with some tool use (e.g. "read X and
  summarize"), no subagents.
- **Expect:** One `Claude Code Turn` (root) → `Claude` (llm) runs + tool runs
  (Bash/Read/Edit/…) as siblings. Root closes `success` with the final assistant
  message as output.

### 2. Cancelled simple message

- **Do:** Send a prompt, then press Esc to interrupt mid-response.
- **Expect:** The turn's root closes with error **`User interrupt`** (not
  `pending`). Whatever was generated before the interrupt is traced. The _next_
  prompt's `UserPromptSubmit` is what finalizes it — so send a follow-up and
  confirm the interrupted root is closed.

### 3. Fast subagent (finishes within the turn)

- **Do:** Launch a subagent that completes quickly while Claude is still
  responding (e.g. the `foo-tester` agent), so its task-notification is consumed
  within the same turn.
- **Expect:** Root → `Agent` (tool run) → `<type> Subagent` (chain) → subagent
  turns. Finalized at the launching turn's Stop (log: `Finalizing subagent … that
finished within its launching turn`). Root closes `success`; no hang.

### 4. Long-running subagent (background, separate notification)

- **Do:** Launch a background subagent (e.g. `Explore` with a broad task) and let
  the turn end while it's still running; it finishes later and its
  `<task-notification>` arrives as a separate turn.
- **Expect:** The launching turn is **deferred** (log: `background subagent(s) in
flight, deferring turn completion`), stays open until the notification turn
  nests under the `Agent` run (log: `Task-notification for agent … nesting turn
under Agent run`) and finalizes it (log: `Completed launching turn … after
notification chain`). Both roots close `success`.

### 5. Cancelled fast subagent

- **Do:** Launch a subagent and cancel it almost immediately.
- **Expect:** Its notification reports `<status>killed</status>`. The `Agent` run
  is marked **`Subagent killed`** and the launching turn finalizes promptly
  (no SessionEnd wait). Confirm `current_notification_interrupted: true` in state
  while it's in flight.

### 6. Cancelled long-running subagent

- **Do:** Launch a background subagent, let it run a while, then cancel it.
- **Expect:** Same as #5 — `killed` notification → `Agent` run `Subagent killed`,
  launching turn finalized promptly. Any child work traced before the cancel
  stays nested under the `Agent` run.

### 7. Workflow (dynamic `Workflow` tool)

- **Do:** Run a dynamic workflow with one or more stages; let it complete.
- **Expect:**
  ```
  Claude Code Turn
  └── Workflow (tool run)
      ├── Workflow step (chain) → Claude (llm)
      └── Workflow step (chain) → Claude (llm)
  ```
  Exactly **one** `Workflow` run per task (posted open at launch, closed by the
  completion notification — not a duplicate). Each stage nested under it. The
  completion `<task-notification>` (carries the taskId) closes the run and the
  launching turn. Root closes `success`.

### 8. Cancelled workflow — ⚠️ KNOWN LIMITATION (not working)

- **Do:** Run a long workflow (e.g. several sequential stages) and cancel it.
- **Current behavior:** A killed workflow emits **no signal** at kill time — no
  task-notification and no SubagentStop for the aborted stage. So the open
  `Workflow` run + its deferred launching turn **do not close promptly**; they're
  closed only by the **SessionEnd backstop** (shown as completed, not "killed").
- **Expect (for now):** During the session the run stays open; it closes at
  session end. This is documented as a TODO in `src/workflows.ts` — revisit if
  Claude Code starts emitting a prompt kill signal for workflows. Not a
  regression; do not treat as a bug.

### 9. AskUserQuestion tool

- **Do:** Have Claude call the `AskUserQuestion` tool; answer it; let the turn
  finish normally.
- **Expect:** The turn traces normally — `AskUserQuestion` appears as a tool run
  (`tool_use` → `tool_result` in the transcript), and the root closes `success`
  after Stop. Note: nothing traces mid-question (all children + root are written
  at Stop), so during the wait the root is legitimately open.
- **Caveat:** Interrupting the turn repeatedly around the question can trigger the
  interrupt/concurrency race (two `UserPromptSubmit`s closing the same stale
  turn → a harmless 409 "duplicate run update"; the run is already closed by the
  first patch). Not an AskUserQuestion bug — see the interrupt path.

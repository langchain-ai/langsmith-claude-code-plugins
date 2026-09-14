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
- Unset both boolean environment variables, then layer home-root `~/.langsmith-plugins.json`, user `~/.claude/langsmith.json`, project-root `cwd/langsmith-plugins.json`, and project `cwd/.claude/langsmith.json`. Check **environment > `cwd/.claude/langsmith.json` > `cwd/langsmith-plugins.json` > `~/.claude/langsmith.json` > `~/.langsmith-plugins.json` > defaults** in both directions for all shared fields. Missing fields fall through independently. Present env `true`/`false` wins over every file; empty/invalid master env disables and empty/invalid default-mute env mutes. Both project paths use payload `cwd`, without ancestor traversal.
- Run explicit unmute under default mute: subsequent turns stay full even after changing defaults. Explicit mute must likewise survive default unmute. Commands must not edit any config file; the privacy file must contain only `threads` with explicit `full`/`metadata` overrides.
- Change default while a turn/background Agent or Workflow is in flight: its saved mode remains unchanged, including finalization. The next turn (including a task notification) without an explicit override takes the new default.
- For recovery without mode snapshots, check Stop, tool/compaction hooks, interruption/failure/session-end recovery, and background finalization use the saved thread preference or, when absent, the configured default.
- With an empty privacy file override map (`{"threads":{}}`), changing configured default changes the next turn's mode without modifying the privacy file. Unknown top-level fields or invalid thread modes make the entire privacy file invalid: new turns stay metadata-only and commands refuse to overwrite it.
- At each file priority, malformed/non-object JSON, unreadable files, or dangling symlinks block lower sources: uploads disabled and default muted. Higher-priority fields, including environment, still win independently; invalid files are not a global veto. Invalid present `enabled` resolves disabled; invalid present `defaultMuted` or an invalid default-mute environment value resolves muted. Missing fields fall through; no settings resolves `enabled:false`, `defaultMuted:false`. Corrupt privacy files remain metadata-only and commands refuse to overwrite them.
- With `TRACE_TO_LANGSMITH` unset, set root `langsmith-plugins.json` to `{"enabled":false}` with user tracing enabled, default mute, and explicit unmute: no uploads to primary or replicas. Repeat with `.claude/langsmith.json` disabled and root enabled: `.claude` wins. Then set `TRACE_TO_LANGSMITH=true`: tracing must enable despite either file being disabled. Set env `false`: no uploads despite files enabled or a thread unmute. Restore settings after testing.

## Shared JSON automated and manual checks

- `src/shared-config.test.ts` contains portable table fixtures for common schema validation, environment-first resolution, home-root configuration, replica aliases/SDK conversion, unknown extensions, shallow metadata merging/prototype safety, and filesystem errors, symlinks, and nonregular files.
- With the environment unset, set `cwd/langsmith-plugins.json` to enable tracing and verify it is honored; project `cwd/.claude/langsmith.json` must override it per field. Omit fields in each source to check independent fallthrough. Make either file malformed to verify its switches fail closed, then set higher-priority environment values to verify each switch can be overridden independently. Restore settings after testing.
- With `cwd` distinct from home, verify `~/.langsmith-plugins.json` supplies defaults and user `~/.claude/langsmith.json` overrides them per field. When `cwd` equals home, verify project `langsmith-plugins.json` and home `.langsmith-plugins.json` coexist: the project file is higher priority, with missing fields falling through to the home file (after user `.claude`).
- `src/config.test.ts` exercises live four-source files and exhaustive five-layer boolean precedence plus environment parsers (including empty strings, arrays, and the supported SDK replica tuple format), home-root defaults, and coincident home/cwd paths. `src/hook-init.test.ts` checks file-only credentials and replica-only routing require master enablement, including credentials from `~/.langsmith-plugins.json`.
- `src/privacy.integration.test.ts` captures real SDK HTTP serialization from home-root configuration (with a distinct cwd) through `initTracing`, including replica destination routing, extra redaction rules, untrusted metadata collisions, and muted projection even with `redact:false`. Replica-only cases omit the primary API key and verify POST/PATCH endpoint inheritance, explicit endpoint overrides, replica auth/project, and full versus muted content with redaction disabled.
- Set all common fields in `~/.langsmith-plugins.json`, including credentials, endpoint, project, replicas, metadata, redact and rules. Layer user `.claude`, cwd root, project `.claude`, then env: each higher field must win, while omitted fields retain baseline values. Metadata merges per key, nested objects replace, and `{}` does not clear. Empty strings remain unchanged; `[]` replaces arrays.
- With boolean environment variables unset, make root `metadata:null` while providing valid user credentials: root must discard all its ordinary fields, disable tracing, and default mute. Explicit higher project or environment switch values can override those restrictions while ordinary values still fall back to user/env. Invalid individual switches restrict only themselves. Repeat with invalid replica canonical values beside valid aliases and an invalid regex rule. Unknown extension values must not affect common validity.
- A readable symlink to a regular config must work; a directory/FIFO/dangling symlink must fail closed without blocking. Restore settings and never commit credentials.

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

## Experimental gateway tests

Build the packages, then run the focused offline checks:

```sh
pnpm build
pnpm exec vitest run src/packaging.test.ts src/proxy/proxy.test.ts src/proxy/settings.test.ts src/proxy/options.test.ts src/proxy/polling.test.ts
```

Use `pnpm exec vitest run` rather than `pnpm test <files>` to avoid script argument
forwarding that can run the full suite. The package test isolates OS-home lookup;
setting `HOME` alone does not isolate the proxy config. Use this harness rather
than smoke-running the bundle against real user configuration.

With dependencies already installed, bypass Corepack/package-manager bootstrap
(and any network/signature lookup) by running the local tools from the repo root:

```sh
./node_modules/.bin/tsc
node esbuild.config.mjs
./node_modules/.bin/vitest run src/packaging.test.ts src/proxy/proxy.test.ts src/proxy/settings.test.ts src/proxy/options.test.ts src/proxy/polling.test.ts
./node_modules/.bin/oxlint
./node_modules/.bin/oxfmt --check src/proxy src/hooks/gateway.ts src/packaging.test.ts
```

### Offline scenarios

- Packaging: separate marketplace sources, hook/bundle paths, standalone loading,
  a read-only plan exposing only selected destinations/profile/port/status/subscription mode without
  settings reads, secrets, writes, network or subprocesses; healthy enable without
  token calls (under a 2-second test bound); disabled hooks without network or state changes, and rejection of removed
  setup/launch entrypoints and unscoped/unauthorized enable/disable. Rejection checks isolate
  the OS home and deny config reads, network, subprocesses, and filesystem writes.
- Subscription mode: presence-only flag selects true; omission selects false on every
  explicit setup, even with saved true or retained disabled config. Negative flags,
  boolean values and duplicates reject without writes. Legacy missing-field reads
  and session hooks preserve true until explicit setup without the flag switches
  safely to false; hooks never require repeating setup each session. Check mode fingerprints
  and polling drain, sole-owned-target toggles with byte-stable settings/receipt/key,
  multi-scope and ownership refusal, unchanged endpoint disable-first rules, retained
  disabled opt-out on drain/readiness failure and retry, safe plan/command summaries,
  no client restart instruction for daemon-only changes, fake credential child
  cancellation before listener release. Signed-out Claude client behavior is not
  established by these tests.
- Proxy: OAuth-only requests without native auth, adversarial native/aux auth stripping,
  native/local auth validation, spoofed-header stripping, LS Bearer plus raw
  native passthrough, bare-model normalization and preserved provider/model
  overrides, JSON field retention and framing, malformed/oversized/compressed
  request rejection before CLI refresh, native Anthropic count-token mapping and
  local 501 for other prefixes, unified routing, SSE in both modes and cancellation.
- Lifecycle/tokens: leases, bind/recovery, incompatible daemon identity, cache
  expiry, singleflight, timeout, sanitized selected-profile/API login errors, and
  SessionStart health/register only (authentication first model use).
- Persistent setup: explicit scoped invocation, deterministic blocking before disabled config,
  multi-project/global reference counts, legacy ownership migration, git secret protection, OS-home isolation, private atomic settings and
  ownership receipt, exact header preservation, conflict/link/mode refusal, readiness
  failures, idempotence, reversible disable and later/concurrent edits.
- Configured destinations: strict HTTPS origin parsing/normalization, paired flags and mutually
  exclusive profile forms, legacy defaults, endpoint identity changes, configured
  CLI API flag, configured HTTPS hostname/port for every allowed route, rejected
  redirects/no production fallback, disable-first endpoint/profile replacement,
  old work drain and occupied-listener refusal, retained disabled destinations on failed daemon startup.

Setup has no eager 10-second CLI/12-second auth-check wait. Healthy setup should
be local-only; cold daemon startup still has a 4-second readiness polling budget.
Re-enable after disable intentionally retains up to 36 seconds for old work to
drain; conflicting listeners are never killed. First use may still wait up to
10 seconds for CLI token acquisition plus upstream latency. No fixed total slash
command latency guarantee (filesystem/git checks and listener drain add overhead).

For manual local preview testing, use the nested gateway `--plugin-dir` and retain
that flag on restart/every session. Choose global or project settings scope; disable all active scopes and restart
before removing the plugin. Do not make real-auth testing part of offline checks.

Tests use fake CLI executables and local upstream doubles. Passing them does not
establish gateway compatibility or real CLI concurrency safety.

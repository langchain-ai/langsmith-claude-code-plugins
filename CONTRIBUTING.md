# Contributing

Thanks for contributing to the LangSmith tracing plugin for Claude Code. This
covers local setup, how the code is organized, the dev loop, and how releases
ship.

## Prerequisites

- Node.js `>= 20`
- [pnpm](https://pnpm.io) (pinned via `packageManager` in `package.json`)

```bash
pnpm install
```

## How the plugin works

The plugin is a set of **Claude Code lifecycle hooks** that read the session's
JSONL transcript and emit [LangSmith](https://smith.langchain.com) runs. Each
hook is a short-lived Node process wired up in `hooks/hooks.json` as
`node "${CLAUDE_PLUGIN_ROOT}/bundle/<hook>.js"`, one per event:
`UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `StopFailure`,
`SubagentStop`, `PreCompact`, `PostCompact`, `SessionEnd`.

Source layout (`src/`):

- `hooks/` — one entry point per lifecycle event (the files above).
- `langsmith.ts` — LangSmith `RunTree` construction/submission (turns, subagent
  chains, workflow runs, turn completion).
- `transcript.ts` — parse the JSONL transcript into turns.
- `state.ts` / `types.ts` — the per-session state file
  (`~/.claude/state/langsmith_state.json`) and its shape.
- `finalize.ts` — close out background-subagent / notification chains.
- `workflows.ts`, `background-runs.ts` — dynamic `Workflow` tool tracing.
- `metadata.ts`, `config.ts`, `logger.ts`, `utils/` — supporting pieces.

Trace hierarchy: `Claude Code Turn` (root chain) → `Claude` (llm) + tool runs;
subagents nest under an `Agent` tool run; workflow stages nest under a `Workflow`
tool run. See `TESTING.md` for the per-scenario shapes.

## The build → `bundle/` relationship (important)

`pnpm build` runs `tsc` then bundles each hook into `bundle/*.js` via esbuild.
**`bundle/` is committed and is what actually runs** — the hooks execute the
committed `bundle/*.js`, not `src/`. So:

- **Never hand-edit `bundle/`.** Edit `src/`, run `pnpm build`, commit the result.
- Any PR that changes `src/` must include the regenerated `bundle/`. CI fails if
  the committed bundle doesn't match a fresh build (see below).

Locally, hooks re-read `bundle/` on every invocation, so after `pnpm build` your
next hook picks up the change without restarting the session.

## Dev loop

```bash
pnpm build        # tsc + regenerate bundle/
pnpm test         # vitest
pnpm lint         # oxlint
pnpm format       # oxfmt --write
pnpm dev          # tsc --watch
```

To try the plugin locally against a real session:

```bash
pnpm build
claude --plugin-dir /path/to/langsmith-claude-code-plugins
```

Set `TRACE_TO_LANGSMITH=true`, `CC_LANGSMITH_API_KEY`, and `CC_LANGSMITH_PROJECT`
(see the README for the full config surface). `CC_LANGSMITH_DEBUG=true` writes a
verbose hook log to `~/.claude/state/hook.log` — indispensable when debugging
which hook fired and why a run did/didn't close.

## Testing

- Unit tests: `pnpm test` (vitest; test files live next to sources as
  `*.test.ts`).
- Manual/e2e: `TESTING.md` has a per-scenario checklist (normal turn, cancelled
  turn, sync/async subagents, cancellations, workflows, AskUserQuestion) with the
  expected LangSmith trace shape for each. Run the relevant scenarios against a
  scratch project whenever you touch a hook path.

## Pull requests

- Commit messages follow conventional-commit prefixes seen in history: `feat:`,
  `fix:`, `release:`.
- Keep `src/` and the committed `bundle/` in the same commit so reviewers and CI
  see a consistent state.

## Releasing

This is a **Claude Code plugin served from a marketplace**, not an npm package.
Users install and update it straight from this repo:

```
/plugin marketplace add langchain-ai/langsmith-claude-code-plugins
/plugin install langsmith-tracing@langsmith-claude-code-plugins
# later…
/plugin marketplace update langsmith-claude-code-plugins
```

The marketplace entry (`.claude-plugin/marketplace.json`) has `source: "./"`, so
the plugin *is* this repository — a `marketplace update` pulls the latest commit
on `main`. **There is no separate publish/npm step: merging to `main` is what
ships.** Two things are therefore load-bearing on every release:

1. **`bundle/` must be fresh and committed** (it's the shipped artifact; CI
   enforces it).
2. **The version lives in two files that must stay in sync:** `package.json` and
   `.claude-plugin/plugin.json`.

### Versioning (semver, relative to what users see in traces)

- **patch** (`0.1.3 → 0.1.4`) — bug fixes, no change to trace shape or config.
- **minor** (`0.1.x → 0.2.0`) — new, backward-compatible tracing coverage or
  config (e.g. workflow tracing, a new env var).
- **major** (`0.x → 1.0`) — breaking changes to the trace hierarchy, metadata
  contract, or required configuration.

### Release checklist

1. Start from a clean, green `main`: `git checkout main && git pull`.
2. Build, lint, and test — all green:
   ```
   pnpm install --frozen-lockfile
   pnpm test && pnpm lint && pnpm build
   ```
3. Confirm the bundle is committed and up to date (the #1 footgun; same check as
   CI):
   ```
   git diff --exit-code bundle/
   ```
   If it reports changes, `git add bundle/`.
4. Bump the version to the same value in **both** `package.json` and
   `.claude-plugin/plugin.json`.
5. Smoke-test the affected trace scenarios from `TESTING.md` against a scratch
   LangSmith project (at minimum: a normal turn, a subagent, a workflow) and
   confirm roots close.
6. Commit on a release branch and open a PR:
   ```
   git checkout -b release/vX.Y.Z
   git add package.json .claude-plugin/plugin.json bundle/
   git commit -m "release: vX.Y.Z"
   ```
7. Merge to `main` — this is the moment the release goes live; the next
   `/plugin marketplace update` on any client pulls it.
8. Create a tag in the GitHub UI or from the CLI.

### After releasing

- Verify as a user: in a separate session run
  `/plugin marketplace update langsmith-claude-code-plugins`, confirm the reported
  version matches, and check a real session traces end-to-end.
- Cowork / CI consumers pull the marketplace the same way (see the README) — no
  extra step; they pick up `main`.

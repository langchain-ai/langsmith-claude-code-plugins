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
`node "${CLAUDE_PLUGIN_ROOT}/bundle/dispatch.js" <Event>`, one entry per event:
`UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `StopFailure`,
`SubagentStop`, `PreCompact`, `PostCompact`, `SessionEnd`. All nine share one
bundle, and `dispatch.js` runs the handler its argument names.

Source layout (`src/`):

- `constants.ts` — `HOOK_EVENT_NAMES` is the source of truth for that event list.
- `hooks/` — one handler per lifecycle event, plus `registry.ts` (event to
  handler map) and `dispatch.ts` (the entry point all nine go through).
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
tool run. See [TESTING.md](./TESTING.md) for testing guidance.

## Separate experimental gateway package

`langsmith-tracing` installs from `./`; `langsmith-gateway` installs from
`./plugins/langsmith-gateway` with its own manifest, hooks, commands, and bundle.
The nested ESM package must run on Node 20 without the repository root or
`node_modules`. Use the nested directory as `--plugin-dir` for gateway development;
the root loads tracing only.

Gateway source map:

- `src/hooks/gateway.ts` and `src/proxy/commands.ts`: consume setup/disable/status
  in UserPromptSubmit before config checks and return `decision: "block"`.
  Commands run deterministically; command markdown is a non-executing fallback.
  The executable accepts hook stdin or internal daemon mode, validated before I/O.
- `options.ts`, `config.ts`, `settings.ts`, `scopes.ts`, `files.ts`: validate options
  and private config, write settings safely, and discover shared routing scopes.
  `settingsTargets` is a discovery index, not authorization. Explicit setup selects
  forwarding by flag presence; ordinary hooks preserve the saved mode.
- `lifecycle.ts`, `server.ts`, `token.ts`: daemon identity, leases/draining, request
  forwarding, and request-time OAuth caching. Valid SessionStart/UserPromptSubmit
  hooks start the daemon whenever private config is enabled, without reading user,
  project, or managed routing settings; SessionEnd only releases its lease.
  Setup/disable still modify selected user/project settings files. No managed policy
  awareness or Claude settings precedence implementation is required.
  Mode changes drain/restart the daemon; authentication is deferred until model use. New setup without `--profile` saves
  no profile, letting the CLI use its persisted current/default selection; existing
  explicit profiles are retained. Keep token subprocess environment sanitization
  (`LANGSMITH_PROFILE` is not inherited) and configured `--api-url` pinning intact.
- `status.ts`: read-only disk routing/config reporting and bounded loopback health.

See [LOCAL_PROXY.md](./LOCAL_PROXY.md) for setup, schema, scope limits, and recovery,
and [TESTING.md](./TESTING.md#experimental-gateway-tests) for the isolated test harness.

## The build → bundle directories relationship (important)

`pnpm build` runs `tsc`, then preserves the tracing esbuild invocation into
`bundle/dispatch.js` and uses a separate invocation for
`plugins/langsmith-gateway/bundle/gateway.js`. There is no root `bundle/gateway.js`.
**Both bundle directories are committed and are what actually runs**, not `src/`.

- **Never hand-edit either bundle directory.** Edit source, run `pnpm build`, and
  include the regenerated artifacts in the eventual PR.
- CI checks both directories for tracked differences and untracked generated
  files after building; neither plugin may ship a stale or missing bundle.
- `pnpm format` excludes both generated bundle directories.

Locally, hooks re-read `bundle/` on every invocation, so after `pnpm build` your
next hook picks up the change without restarting the session.

## Standalone binary (macOS arm64)

`pnpm build:sea` runs `tsc`, bundles the hook dispatcher into one file, and embeds it in
a copy of Node under `bin/`. The result runs the tracing hooks on a machine with no Node
installed, which is why it is large. Building it needs a newer Node than the plugin does;
the workflow pins that version, and the plugin itself still runs on Node 20.

- The build only targets macOS arm64, and refuses to run anywhere else.
- CI builds the binary and runs it against all nine hook events on any PR that touches the build.
- The build asks the binary for its `--version` and fails unless it matches `package.json`.
- Publishing is manual. Run the workflow from the Actions tab against a release tag, and it
  attaches the binary to that tag's release as a draft.

The binary is ad-hoc signed, not Apple signed, so macOS quarantines it on download. Clear
that on the downloaded file before running it:

```bash
xattr -d com.apple.quarantine <downloaded-binary>
chmod +x <downloaded-binary>
```

### Installing the binary

```bash
bin/langsmith-claude-code-tracing --install   # add --print to see the settings instead
```

The binary installs itself, so users need no Node or clone. It copies itself into
`~/.langsmith` and merges its hooks into a settings file, leaving `hooks/hooks.json`
alone. Only `--tag` downloads, and that download is checksummed.

`esbuild.sea.config.mjs` compiles `hooks/hooks.sea.json` in. It mirrors `hooks/hooks.json`
and changes only the command. A test fails if they drift.

## Dev loop

```bash
pnpm build        # tsc + regenerate both plugin bundle directories
pnpm build:sea    # tsc + the standalone macOS arm64 binary in bin/
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

Run `pnpm test` for the unit suite; `*.test.ts` files live next to their sources.
See [TESTING.md](./TESTING.md) for focused gateway/package commands and manual
testing guidance. Run the relevant checks when changing hooks or packaging.

## Pull requests

- Commit messages follow conventional-commit prefixes seen in history: `feat:`,
  `fix:`, `release:`.
- Keep `src/` and both committed bundle directories in the same commit so reviewers and CI
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

The tracing marketplace entry (`.claude-plugin/marketplace.json`) has `source: "./"`, so
the plugin _is_ this repository — a `marketplace update` pulls the latest commit
on `main`. **There is no separate publish/npm step: merging to `main` is what
ships.** The following are therefore load-bearing on every release:

1. **Both `bundle/` and `plugins/langsmith-gateway/bundle/` must be fresh and
   committed** (CI enforces both shipped artifacts).
2. **The tracing version lives in two synchronized files:** root `package.json`
   and `.claude-plugin/plugin.json`. Gateway packaging does not bump these.
3. **The gateway version is independent:** update only
   `plugins/langsmith-gateway/.claude-plugin/plugin.json` for gateway releases.
   Its marketplace source stays `./plugins/langsmith-gateway`. There is no npm
   publish step for either plugin. The checklist below is for tracing releases.

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
   pnpm build && pnpm test && pnpm lint
   ```
3. Confirm the bundle is committed and up to date (the #1 footgun; same check as
   CI):
   ```
   git diff --exit-code HEAD -- bundle/ plugins/langsmith-gateway/bundle/
   git ls-files --others --exclude-standard -- bundle/ plugins/langsmith-gateway/bundle/
   ```
   The second command must print nothing. Include regenerated artifacts from both
   directories in the release. After a tracing version bump, rebuild again so the
   injected integration version matches the manifest.
4. Bump the version to the same value in **both** `package.json` and
   `.claude-plugin/plugin.json`.
5. Follow [TESTING.md](./TESTING.md) to smoke-test affected tracing behavior
   against a scratch LangSmith project.
6. Commit on a release branch and open a PR:
   ```
   git checkout -b release/vX.Y.Z
   git add package.json .claude-plugin/plugin.json bundle/ plugins/langsmith-gateway/bundle/
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

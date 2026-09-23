# Contributing

Thanks for contributing to the LangSmith tracing plugin for Claude Code. This covers setup, how
the code is laid out, the dev loop and how a release ships.

## Setup

You need Node 20 or newer and [pnpm](https://pnpm.io), which `package.json` pins. Building the
standalone binary also needs [Bun](https://bun.com) but nothing else does.

```bash
pnpm install
pnpm build
```

## How it works

The plugin is a set of Claude Code lifecycle hooks that read the session's JSONL transcript and
emit [LangSmith](https://smith.langchain.com) runs. All nine events are wired in `hooks/hooks.json`
to the same bundled entry point and `dispatch.js` runs whichever handler its argument names.

Inside `src/` the handlers live in `hooks/` with `registry.ts` mapping each event to one of them.
`transcript.ts` turns the JSONL into turns and `langsmith.ts` builds the run tree and submits it.
`state.ts` owns the per-session state file at `~/.claude/state/langsmith_state.json` and
`constants.ts` holds `HOOK_EVENT_NAMES`, which is the source of truth for the event list.
Everything else is supporting.

A trace is a `Claude Code Turn` chain carrying a `Claude` llm run and the tool runs, with subagents
nested under an `Agent` tool run and workflow stages under a `Workflow` tool run.

## Two plugins in one repository

`langsmith-tracing` is this repository root and `langsmith-gateway` is a separate experimental
package under `plugins/langsmith-gateway` with its own manifest, hooks and bundle. It has to run on
Node 20 without the repository root or `node_modules`, so pass that nested directory as
`--plugin-dir` when you work on it since the root loads tracing only.
[LOCAL_PROXY.md](./LOCAL_PROXY.md) covers its setup, its config schema and how to recover from a
bad one.

## The bundles are what actually run

`pnpm build` compiles with `tsc` and then bundles into `bundle/dispatch.js` and
`plugins/langsmith-gateway/bundle/gateway.js`. **Both directories are committed and are what Claude
Code executes**, not `src/`, so never hand-edit them and always include the rebuilt output in your
PR. CI fails the build if either one is stale or untracked. Hooks re-read the bundle on every
invocation so a rebuild reaches your next hook without restarting the session.

## Dev loop

```bash
pnpm dev     # tsc --watch
pnpm build   # compile and regenerate both bundles
pnpm test    # vitest
pnpm lint    # oxlint, and install.sh checked against its generator
pnpm format  # oxfmt --write
```

The binary and installer scripts are in `package.json` alongside these.

To try the plugin against a real session, build it and point Claude Code at your clone:

```bash
claude --plugin-dir /path/to/langsmith-claude-code-plugins
```

Set `TRACE_TO_LANGSMITH=true` along with `CC_LANGSMITH_API_KEY` and `CC_LANGSMITH_PROJECT` and see
the README for the rest of the configuration. `CC_LANGSMITH_DEBUG=true` writes a verbose log to
`~/.claude/state/hook.log`, which is the fastest way to find out which hook fired and why a run did
or did not close.

## Testing

`pnpm test` runs the unit suite and every `*.test.ts` sits next to the source it covers.
[TESTING.md](./TESTING.md) has the manual checklist for tracing behaviour and
[its gateway section](./TESTING.md#experimental-gateway-tests) has the isolated harness for the
gateway. Smoke-test against a scratch LangSmith project whenever you change hooks or packaging.

## Standalone binary

`pnpm build:binary` uses Bun to compile the hook dispatcher into one macOS executable that carries
its own JavaScript runtime, which is why it traces on a machine with no Node installed. The build,
the signing and the release all come from
[langsmith-plugin-binary](https://github.com/langchain-ai/langsmith-plugin-binary) and everything it
needs to know about this plugin lives in `binary.config.json`, so go to that repository rather than
this one for how any of it works.

The binary gets its hooks compiled in from `hooks/hooks.binary.json`, which mirrors
`hooks/hooks.json` and changes only the command, so a test fails if you add an event to one and not
the other.

Publishing is manual and a tag on its own attaches nothing. Run the Build Binary workflow from the
Actions tab against a release tag and it attaches an arm64 and an x64 build to that tag's release
as a draft.

## Pull requests

Use the conventional-commit prefixes already in the history. Keep `src/` and both rebuilt bundles in
the same commit so reviewers and CI see one consistent state.

## Releasing

There is no publish step. The marketplace entry's source is this repository itself, so **merging to
`main` is what ships the plugin** and the next `/plugin marketplace update` on any client picks it
up.

Two things are therefore load-bearing on every merge. Both bundles have to be fresh and committed
since CI enforces it, and the tracing version has to be the same in `package.json` and
`.claude-plugin/plugin.json` since a test compares them. Rebuild after a version bump so the version
injected into the bundle matches the manifest.

The gateway version is independent and lives only in
`plugins/langsmith-gateway/.claude-plugin/plugin.json`.

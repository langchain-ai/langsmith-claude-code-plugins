# LangSmith Tracing for Claude Code

Sends your Claude Code conversations to [LangSmith](https://smith.langchain.com) so you can read back what the agent actually did.

![](./static/img/example_trace.png)

## What you need

- **On a Mac, nothing.** The plugin carries its own build and runs it directly.
- **Everywhere else, including Windows,** Node.js 20 or newer.
- A LangSmith account and API key.

If the carried Mac build cannot start, the plugin hands the turn to Node instead of losing it, so Node is still worth having.

## Install

Run these inside Claude Code:

```text
/plugin marketplace add langchain-ai/langsmith-claude-code-plugins
/plugin install langsmith-tracing@langsmith-claude-code-plugins
/reload-plugins
```

Your install stays pinned to the version you got, so a newer release needs two steps: run `/plugin marketplace update langsmith-claude-code-plugins` in Claude Code, then `claude plugin update langsmith-tracing@langsmith-claude-code-plugins` in your shell, and restart. To skip that next time, open `/plugin`, go to **Marketplaces**, and turn on **Enable auto-update**.

## Turn on tracing

Tracing is off until you give it a key and switch it on. Write both to `~/.claude/langsmith.json`:

```json
{ "enabled": true, "api_key": "lsv2_pt_...", "project": "claude-code" }
```

Get a key from [smith.langchain.com](https://smith.langchain.com) under **Settings** then **API Keys**. Send a message, then look for it in the `claude-code` project.

Settings can also live in a project, at `<project>/.claude/langsmith.json` or `<project>/langsmith-plugins.json`, or across every harness at `~/.langsmith-plugins.json`. A setting from your shell beats a project file, which beats a user file, which beats the shared one.

> **Check a repository's tracing settings before you trust it.** A project file can switch tracing on, point uploads at someone else's server, supply its own credentials and turn secret redaction off, and a full trace can carry your conversation, file contents and tool results. Review these files in an unfamiliar repository, along with `.claude/settings.json` and `.claude/settings.local.json`.

## What gets traced

Each model call carries the conversation so far, the assistant's reply, and the model name, provider and token counts. Tool calls come with their inputs and outputs, subagents appear as children of the turn that started them, and a turn you cancel is marked interrupted rather than dropped. Skill calls record which skill ran so you can count usage per skill.

Run `/langsmith-tracing:trace` to get a link to the current conversation's trace. It does not start a model turn or change anything.

Subagents only upload once they finish, so cancelling a turn mid-subagent loses those runs.

## Hide one thread

```text
/langsmith-tracing:mute
/langsmith-tracing:unmute
```

Muting keeps tracing the shape of the thread while leaving the content out, and it applies from the next turn rather than the one in flight. The turn you are in already has its mode locked, and so does anything it started. Wait for the confirmation before sending anything sensitive.

Muting changes only what reaches LangSmith. Claude Code still reads and remembers everything locally, and earlier uploads are not deleted.

To mute by default instead of thread by thread, set `defaultMuted` to `true`. A thread you muted or unmuted by hand keeps that choice regardless.

## Settings

Every setting has a config key and an environment variable. The `CC_LANGSMITH_` form wins over the plain `LANGSMITH_` one.

| Config key           | Environment variable          | Default                           | What it does                            |
| -------------------- | ----------------------------- | --------------------------------- | --------------------------------------- |
| `enabled`            | `TRACE_TO_LANGSMITH`          | `false`                           | Whether to trace at all                 |
| `api_key`            | `CC_LANGSMITH_API_KEY`        | none                              | Your LangSmith key                      |
| `project`            | `CC_LANGSMITH_PROJECT`        | `claude-code`                     | Where runs land                         |
| `api_url`            | `LANGSMITH_ENDPOINT`          | `https://api.smith.langchain.com` | Which server to send to                 |
| `defaultMuted`       | `CC_LANGSMITH_DEFAULT_MUTED`  | `false`                           | Leave content out unless told otherwise |
| `redact`             | `CC_LANGSMITH_REDACT`         | `true`                            | Strip secrets before upload             |
| `redact_extra_rules` | `CC_LANGSMITH_REDACT_EXTRA`   | none                              | Extra patterns to strip                 |
| `metadata`           | `CC_LANGSMITH_METADATA`       | none                              | Custom fields on every run              |
| `replicas`           | `CC_LANGSMITH_RUNS_ENDPOINTS` | none                              | Send the same trace somewhere else too  |

Secrets are stripped before anything is uploaded, covering API keys, JWTs, PEM blocks and common `NAME=value`, `Authorization` and URL-credential shapes. That is not a guarantee that what you upload is safe to share.

## When nothing shows up

- **No runs at all.** Check the plugin is installed and enabled in `/plugin`, and that tracing is switched on. A `TRACE_TO_LANGSMITH` in your shell overrides whatever the files say.
- **Rejected key.** Check `CC_LANGSMITH_API_KEY` is set and still valid.
- **Runs in the wrong place.** Set `CC_LANGSMITH_PROJECT`, or the `project` key.

## What leaves your machine

With tracing on, a full turn uploads your messages, tool inputs and outputs, metadata, token usage and subagent structure. A muted turn uploads the structure and placeholders instead. Keep tracing off if none of that may leave your machine.

## More

- [Running in CI, nesting under another run, and sending to several destinations](./ADVANCED.md)
- [The separate `langsmith-gateway` plugin](./LOCAL_PROXY.md), which routes model requests through LangSmith and is unrelated to tracing

## Development

```bash
pnpm install
pnpm test
pnpm build
```

Run `pnpm build`, then `claude --plugin-dir /path/to/langsmith-claude-code-plugins`, and send a new message to pick up your changes.

## License

MIT

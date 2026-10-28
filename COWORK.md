# Tracing Claude Cowork

Claude Cowork runs the same plugins as Claude Code, so this plugin also traces Cowork tasks. Each turn becomes a trace and a task's turns are grouped into one LangSmith thread.

## Install

Cowork installs plugins from your claude.ai account rather than inside a task:

1. Go to **Customize** then **Plugins** on claude.ai.
2. Add `langchain-ai/langsmith-claude-code-plugins` as a marketplace.
3. Install the `langsmith-tracing` plugin from it.

The plugin loads into the next Cowork task you start. To install it for everyone in your organization, see Anthropic's [Choose a rollout route](https://claude.com/docs/plugins/org-rollout). For more on installing plugins in Cowork, see Anthropic's [Cowork plugins](https://claude.com/docs/cowork/guide/plugins) guide.

## Sign in and turn on tracing

In a desktop Cowork task the plugin's hooks run on your computer, so it reads the same settings as Claude Code. Sign in once with the LangSmith CLI, which you can [install from its docs](https://docs.langchain.com/langsmith/langsmith-cli#install) if you don't have it yet:

```bash
langsmith auth login
```

If you use the CLI sign-in and have more than one profile set `profile` to the one the plugin should use. Your own `api_key` ignores this setting, but a generic `LANGSMITH_API_KEY` isn't used as a fallback while `profile` is set.

Then switch tracing on in `~/.claude/langsmith.json`, unless your admin already turned it on with a managed file. Send traces to an agent with `agent_id`:

```json
{ "enabled": true, "agent_id": "shared-claude" }
```

Or send them to a project with `project`:

```json
{ "enabled": true, "project": "shared-claude" }
```

Use either one, and `agent_id` wins if you set both.

To use an API key instead, add `"api_key": "lsv2_pt_..."` to the same file. Every other setting works the same as in Claude Code, so see [Settings](./README.md#settings) in the README.

## What you'll see

Start a Cowork task and open your agent or project in LangSmith. Skill calls record which skill ran, so you can filter traces by skill and see how often each one is used.

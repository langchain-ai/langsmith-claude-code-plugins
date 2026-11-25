# Tracing Claude Cowork

Claude Cowork runs the same plugins as Claude Code, so this plugin also traces Cowork tasks. Each turn becomes a trace and a task's turns are grouped into one LangSmith thread.

## Install

Cowork installs plugins from your claude.ai account rather than inside a task:

1. Go to **Customize** then **Plugins** on claude.ai.
2. Add `langchain-ai/langsmith-claude-code-plugins` as a marketplace.
3. Install the `langsmith-tracing` plugin from it.

The plugin loads into the next Cowork task you start. To install it for everyone in your organization, see Anthropic's [Choose a rollout route](https://claude.com/docs/plugins/org-rollout). For more on installing plugins in Cowork, see Anthropic's [Cowork plugins](https://claude.com/docs/cowork/guide/plugins) guide.

## Cloud tasks

Cowork tasks run on your computer or on Anthropic's servers, depending on the **Run Cowork in the cloud** setting in **Organization settings** then **Cowork** on claude.ai. Only organization owners can see or change it. For more, see Anthropic's [Use Claude Cowork on Team and Enterprise plans](https://support.claude.com/en/articles/13455879-use-claude-cowork-on-team-and-enterprise-plans).

Tasks on your computer need nothing beyond the steps on this page. Tasks in the cloud start fresh each time and can only reach approved sites, so an owner needs to:

1. Add your LangSmith API host, such as `api.smith.langchain.com`, to **Organization settings** then **Capabilities** then **Network egress**.
2. Set the plugin's settings and API key in Claude's [server-managed settings](https://code.claude.com/docs/en/server-managed-settings). [TBD: exact steps once proven for cloud tasks]

Cloud traces include each turn's prompt and reply, tool calls with their inputs and outputs, and subagents. Token counts and cost are only available for tasks that run on your computer.

## Sign in and turn on tracing

In a Cowork task that runs on your computer the plugin's hooks run there too, so it reads the same settings as Claude Code. For cloud tasks, see [Cloud tasks](#cloud-tasks). Sign in once with the LangSmith CLI, which you can [install from its docs](https://docs.langchain.com/langsmith/langsmith-cli#install) if you don't have it yet:

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

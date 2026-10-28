# Advanced configuration

Everything here is optional. The [README](./README.md) covers what most people need, and this page has worked examples for the rest.

- [Where settings can live](#where-settings-can-live)
- [Set variables in Claude Code's settings](#set-variables-in-claude-codes-settings)
- [Add custom metadata](#add-custom-metadata)
- [Mute every conversation by default](#mute-every-conversation-by-default)
- [Redact extra patterns](#redact-extra-patterns)
- [Send the same trace to two places](#send-the-same-trace-to-two-places)
- [Trace a Claude Code run in CI](#trace-a-claude-code-run-in-ci)
- [Nest traces under a run you already trace](#nest-traces-under-a-run-you-already-trace)

## Where settings can live

The plugin reads four files, and the first one that sets a field wins:

1. `<project>/.claude/langsmith.json`
2. `<project>/langsmith-plugins.json`
3. `~/.claude/langsmith.json`
4. `~/.langsmith-plugins.json`

An environment variable beats all four, and an admin's [managed file](./README.md#lock-settings-with-a-managed-file) beats everything. The two `langsmith-plugins.json` files are shared with the LangSmith plugins for Cursor and Codex.

> **Any of these files can switch tracing on in a repository you cloned.** Read them before you trust an unfamiliar project.

A key in a file never turns tracing on by itself, so `enabled` must also be true. Keep any file that holds a key out of version control.

## Set variables in Claude Code's settings

Instead of a `langsmith.json` file you can set the plugin's environment variables in Claude Code's own settings. Put them under `env` in `.claude/settings.local.json` to trace one project, or in `~/.claude/settings.json` to trace every project:

```json
{
  "env": {
    "TRACE_TO_LANGSMITH": "true",
    "CC_LANGSMITH_PROJECT": "my-project"
  }
}
```

You can also export the same variables in your shell profile.

## Add custom metadata

Metadata adds your own fields to every run, which you can then filter on in LangSmith. Set it as an object in your config file:

```json
{ "enabled": true, "metadata": { "team": "platform", "environment": "dev" } }
```

Or set it in your shell as a JSON string:

```bash
export CC_LANGSMITH_METADATA='{"team":"platform","environment":"dev"}'
```

## Mute every conversation by default

Set `defaultMuted` so every conversation starts muted, keeping its structure and token counts but leaving out what was said:

```json
{ "enabled": true, "defaultMuted": true }
```

`CC_LANGSMITH_DEFAULT_MUTED=true` does the same from your shell. A conversation you mute or unmute by hand with `/langsmith-tracing:mute` keeps that choice.

## Redact extra patterns

The plugin strips common secrets before upload. To strip your own formats as well, list regular expressions under `redact_extra_rules`, each with an optional replacement:

```json
{
  "enabled": true,
  "redact_extra_rules": [{ "pattern": "ACME-[A-Z0-9]{16}", "replace": "[REDACTED_ACME_KEY]" }]
}
```

`CC_LANGSMITH_REDACT_EXTRA` takes the same list as a JSON string and skips any rule with an invalid regular expression. In a config file one invalid rule discards every setting in that file, so test your patterns first.

## Send the same trace to two places

Replicas copy every run to another project or workspace, such as a staging project or an audit workspace. Add them to `~/.claude/langsmith.json`:

```json
{
  "enabled": true,
  "replicas": [
    {
      "api_url": "https://api.smith.langchain.com",
      "api_key": "lsv2_pt_example_audit_key",
      "project": "audit"
    }
  ]
}
```

Give each replica a server, a key and a project. Add an optional `updates` object to attach extra metadata to that copy only.

To set replicas from your shell instead, `CC_LANGSMITH_RUNS_ENDPOINTS` takes a JSON string in the SDK's format:

```bash
export CC_LANGSMITH_RUNS_ENDPOINTS='[{"apiUrl":"https://api.smith.langchain.com","apiKey":"lsv2_pt_example_audit_key","projectName":"audit"}]'
```

`jq -c . replicas.json` turns a formatted file into that one-line string. See the [LangSmith replica docs](https://docs.langchain.com/langsmith/log-traces-to-project) for the wider feature.

## Trace a Claude Code run in CI

Add the plugin to [`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action) and your CI runs show up in LangSmith:

```yaml
- uses: anthropics/claude-code-action@v1
  env:
    TRACE_TO_LANGSMITH: "true"
    CC_LANGSMITH_API_KEY: ${{ secrets.LANGSMITH_API_KEY }}
    CC_LANGSMITH_PROJECT: "my-project"
    CC_LANGSMITH_METADATA: |
      {
        "pr_number": "${{ github.event.pull_request.number || '' }}",
        "repository": "${{ github.repository }}",
        "commit_sha": "${{ github.sha }}"
      }
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    plugin_marketplaces: |
      https://github.com/langchain-ai/langsmith-claude-code-plugins.git
    plugins: |
      langsmith-tracing@langsmith-claude-code-plugins
    prompt: |
      Your prompt here
```

Store your keys as [repository secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) first. Leave `strict_auth` off in CI unless a rejected key should fail the job. This repository runs [the same setup](.github/workflows/claude-code-review.yml) if you want a complete file.

## Nest traces under a run you already trace

When your own code calls Claude Code, you can hang its trace under the run that started it. Pass the parent's dotted order through `CC_LANGSMITH_PARENT_DOTTED_ORDER` and each Claude Code turn appears as a child of your run.

Python:

```python
import os
import subprocess

from langsmith import get_current_run_tree, traceable

os.environ["LANGSMITH_TRACING"] = "true"
os.environ["LANGSMITH_API_KEY"] = "lsv2_pt_example_not_a_real_key"


@traceable
def run_claude(prompt: str):
    run_tree = get_current_run_tree()
    subprocess.run(
        ["claude", "-p", prompt],
        env={
            **os.environ,
            "TRACE_TO_LANGSMITH": "true",
            "CC_LANGSMITH_API_KEY": "lsv2_pt_example_not_a_real_key",
            "CC_LANGSMITH_PARENT_DOTTED_ORDER": run_tree.dotted_order,
        },
    )
```

TypeScript:

```ts
import { execFileSync } from "node:child_process";
import { getCurrentRunTree, traceable } from "langsmith/traceable";

process.env.LANGSMITH_TRACING = "true";
process.env.LANGSMITH_API_KEY = "lsv2_pt_example_not_a_real_key";

const runClaude = traceable(
  async (prompt: string) => {
    const runTree = getCurrentRunTree();
    return execFileSync("claude", ["-p", prompt], {
      env: {
        ...process.env,
        TRACE_TO_LANGSMITH: "true",
        CC_LANGSMITH_API_KEY: "lsv2_pt_example_not_a_real_key",
        CC_LANGSMITH_PARENT_DOTTED_ORDER: runTree.dotted_order,
      },
    }).toString();
  },
  { name: "run_claude" },
);
```

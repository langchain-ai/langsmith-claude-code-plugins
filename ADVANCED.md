# Advanced configuration

Everything here is optional. The [README](./README.md) covers what most people need.

## Trace a Claude Code run in CI

Add the plugin to [`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action) and your CI runs show up in LangSmith.

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

Store your keys as [repository secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) first. This repository runs [the same setup](.github/workflows/claude-code-review.yml) if you want a complete file.

## Nest traces under a run you already trace

When your own code calls Claude Code, you can hang its trace under the run that started it. Pass the parent's dotted order through `CC_LANGSMITH_PARENT_DOTTED_ORDER`.

```python
import os
import subprocess
from langsmith import traceable, get_current_run_tree

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

Each Claude Code turn then appears as a child of your run, with its model calls and tool calls underneath.

## Send the same trace to two places

Replicas copy every run to a second project or workspace. Use one to feed a staging project or an audit workspace alongside your normal one. Add them to `~/.claude/langsmith.json`.

```json
{
  "enabled": true,
  "api_key": "lsv2_pt_example_not_a_real_key",
  "replicas": [
    {
      "api_url": "https://api.smith.langchain.com",
      "api_key": "lsv2_pt_example_audit_key",
      "project": "audit"
    }
  ]
}
```

Give each replica a server, a key and a project name. Add an optional `updates` object to attach extra metadata to that copy only. See the [LangSmith replica docs](https://docs.langchain.com/langsmith/log-traces-to-project) for the wider feature.

## Where settings can live

Settings load from four files, and the first one that sets a field wins:

1. `<project>/.claude/langsmith.json`
2. `<project>/langsmith-plugins.json`
3. `~/.claude/langsmith.json`
4. `~/.langsmith-plugins.json`

A value set in your shell beats all four. The two files named `langsmith-plugins.json` are shared with LangSmith's plugins for other coding tools.

> **Any of these files can switch tracing on in a repository you cloned.** Read them before you trust an unfamiliar project.

A key in a file never switches tracing on by itself, so `enabled` must also be true. Keep any file holding a key out of version control.

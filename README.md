# LangSmith Tracing Plugin for Claude Code

A Claude Code plugin that traces conversations, tool calls, subagent executions, and context compaction to [LangSmith](https://smith.langchain.com).

![](./static/img/example_trace.png)

## Installation

### From source (development)

```bash
pnpm install
pnpm build
claude --plugin-dir /path/to/tracing-claude-code
```

## Configuration

### Environment variables

| Variable                           | Required | Default                           | Description                                                          |
| ---------------------------------- | -------- | --------------------------------- | -------------------------------------------------------------------- |
| `TRACE_TO_LANGSMITH`               | Yes      | —                                 | Set to `"true"` to enable tracing                                    |
| `CC_LANGSMITH_API_KEY`             | Yes      | —                                 | LangSmith API key (falls back to `LANGSMITH_API_KEY`)                |
| `CC_LANGSMITH_PROJECT`             | No       | `"claude-code"`                   | LangSmith project name                                               |
| `LANGSMITH_ENDPOINT`               | No       | `https://api.smith.langchain.com` | LangSmith API base URL                                               |
| `CC_LANGSMITH_DEBUG`               | No       | `"false"`                         | Enable debug logging                                                 |
| `CC_LANGSMITH_PARENT_DOTTED_ORDER` | No       | —                                 | Dotted-order of an existing run to nest all Claude Code traces under |

### Setting environment variables

**Option 1: Claude Code settings file (recommended)**

Add to `~/.claude/settings.local.json`:

```json
{
  "env": {
    "TRACE_TO_LANGSMITH": "true",
    "CC_LANGSMITH_API_KEY": "lsv2_pt_...",
    "CC_LANGSMITH_PROJECT": "my-project"
  }
}
```

**Option 2: Export to shell**

Add to your `~/.zshrc`, `~/.bashrc`, or `~/.bash_profile`:

```bash
export TRACE_TO_LANGSMITH="true"
export CC_LANGSMITH_API_KEY="lsv2_pt_..."
export CC_LANGSMITH_PROJECT="my-project"
```

### Getting your LangSmith API key

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Sign in or create an account
3. Navigate to **Settings** → **API Keys**
4. Click **Create API Key**
5. Copy the key (starts with `lsv2_pt_...`)

## How it works

The plugin registers hooks that fire at different points in a Claude Code session.

### `UserPromptSubmit` hook

Fires when you submit a prompt. Creates the top-level Turn run in LangSmith so tool traces can be nested under it in real time.

### `PostToolUse` hook

Fires immediately after each tool executes. Creates a tool run in LangSmith while the session is still ongoing, so traces appear progressively rather than all at once at the end.

### `Stop` hook

Fires when the main agent finishes responding. Reads the JSONL transcript, reconciles any LLM calls not yet traced, completes the Turn run, and processes any pending subagent traces.

**Trace hierarchy:**

```
Turn (chain)
├── Claude (llm) — first LLM call
├── Read (tool)
├── Edit (tool)
├── Claude (llm) — second LLM call (after tool results)
└── Bash (tool)
```

### `SubagentStop` hook

Fires when a subagent (spawned via the Agent tool) finishes. Queues the subagent's transcript for processing by the Stop hook, which nests it under the Agent tool run that spawned it.

```
Turn (chain)
└── Agent (tool)
    └── general-purpose Subagent (chain)
        ├── Claude (llm)
        ├── Bash (tool)
        └── Claude (llm)
```

### `PreCompact` / `PostCompact` hooks

Fire before and after a context compaction operation. Creates a standalone LangSmith run capturing the compaction trigger and summary, linked to the session via `thread_id`.

## What gets traced

Each LLM run includes:

- **Inputs**: accumulated conversation messages
- **Outputs**: assistant response content
- **Metadata**: `ls_provider: "anthropic"`, `ls_model_name`, `ls_invocation_params` (model, stop reason), token usage

Tool runs include the tool name, inputs, and output content.

Interrupted turns (where the user cancels mid-response) are marked with status `"interrupted"` in LangSmith.

## Nesting traces under an existing run

Set `CC_LANGSMITH_PARENT_DOTTED_ORDER` to nest all Claude Code traces as children of an existing LangSmith run. This is useful when Claude Code is invoked programmatically as part of a larger traced workflow.

**Python**

```python
import subprocess
from langsmith import traceable, get_current_run_tree

@traceable
def run_claude(prompt: str):
    run_tree = get_current_run_tree()
    subprocess.run(
        ["claude", "-p", prompt],
        env={
            **os.environ,
            "CC_LANGSMITH_PARENT_DOTTED_ORDER": run_tree.dotted_order,
        },
    )
```

**TypeScript**

```ts
import { traceable, getCurrentRunTree } from "langsmith/traceable";
import { execSync } from "node:child_process";

const runClaude = traceable(
  async (prompt: string) => {
    const runTree = getCurrentRunTree();
    execSync(`claude -p "${prompt}"`, {
      env: {
        ...process.env,
        CC_LANGSMITH_PARENT_DOTTED_ORDER: runTree.dotted_order,
      },
    });
  },
  { name: "run_claude" },
);
```

The resulting trace hierarchy looks like:

```
Your outer run (chain)
└── Claude Code Turn (chain)
    ├── Claude (llm)
    ├── Read (tool)
    └── Claude (llm)
```

## Development

```bash
pnpm install
pnpm dev         # Watch mode — recompiles on changes
pnpm test        # Run tests
pnpm build       # Production build
```

After making changes, run `pnpm build` and send a new message in Claude Code to pick up the updated hooks.

## License

MIT

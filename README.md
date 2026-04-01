# LangSmith Tracing Plugin for Claude Code

A Claude Code plugin that traces conversations, tool calls, and subagent executions to [LangSmith](https://smith.langchain.com).

## Installation

### From source (development)

```bash
pnpm install
pnpm build
claude --plugin-dir /path/to/tracing-claude-code
```

## Configuration

### Environment variables

| Variable               | Required | Default                           | Description                                           |
| ---------------------- | -------- | --------------------------------- | ----------------------------------------------------- |
| `TRACE_TO_LANGSMITH`   | Yes      | —                                 | Set to `"true"` to enable tracing                     |
| `CC_LANGSMITH_API_KEY` | Yes      | —                                 | LangSmith API key (falls back to `LANGSMITH_API_KEY`) |
| `CC_LANGSMITH_PROJECT` | No       | `"claude-code"`                   | LangSmith project name                                |
| `LANGSMITH_ENDPOINT`   | No       | `https://api.smith.langchain.com` | LangSmith API base URL                                |
| `CC_LANGSMITH_DEBUG`   | No       | `"false"`                         | Enable debug logging                                  |

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

Then start Claude Code normally:

```bash
claude --plugin-dir /path/to/tracing-claude-code
```

**Option 2: Export in shell (temporary, for current session)**

```bash
export TRACE_TO_LANGSMITH="true"
export CC_LANGSMITH_API_KEY="lsv2_pt_..."
export CC_LANGSMITH_PROJECT="my-project"

claude --plugin-dir /path/to/tracing-claude-code
```

**Option 3: Shell profile (persistent, all sessions)**

Add to your `~/.zshrc`, `~/.bashrc`, or `~/.bash_profile`:

```bash
export TRACE_TO_LANGSMITH="true"
export CC_LANGSMITH_API_KEY="lsv2_pt_..."
export CC_LANGSMITH_PROJECT="my-project"
```

Then reload: `source ~/.zshrc` (or restart your terminal).

**Option 4: `.env` file**

Create a `.env` file in your home directory or project directory:

```bash
# ~/.env or /path/to/project/.env
TRACE_TO_LANGSMITH=true
CC_LANGSMITH_API_KEY=lsv2_pt_...
CC_LANGSMITH_PROJECT=my-project
```

Then source it before running Claude Code:

```bash
source ~/.env
claude --plugin-dir /path/to/tracing-claude-code
```

**Option 5: Inline (one-time, for testing)**

```bash
TRACE_TO_LANGSMITH=true CC_LANGSMITH_API_KEY=lsv2_pt_... claude --plugin-dir /path/to/tracing-claude-code
```

### Getting your LangSmith API key

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Sign in or create an account
3. Navigate to **Settings** → **API Keys**
4. Click **Create API Key**
5. Copy the key (starts with `lsv2_pt_...`)

## How it works

The plugin registers two hooks:

### `Stop` hook

Fires when the main Claude Code agent finishes responding. Reads the JSONL transcript, identifies new messages since the last invocation, groups them into turns, and sends traces to LangSmith.

**Trace hierarchy:**

```
Turn (chain) — "Claude Code"
├── Claude (llm) — first LLM call
├── Read (tool)
├── Edit (tool)
├── Claude (llm) — second LLM call (after tool results)
└── Bash (tool)
```

### `SubagentStop` hook

Fires when a subagent finishes. Reads the subagent's separate transcript file and traces it as a standalone trace in LangSmith, tagged with the agent type and ID.

Runs asynchronously so it doesn't block the main agent.

## Architecture

```
src/
├── types.ts          # TypeScript types for hook inputs, transcript messages, runs
├── config.ts         # Environment variable configuration
├── logger.ts         # File-based logger (writes to ~/.claude/state/hook.log)
├── state.ts          # Persistent state (tracks transcript read position per session)
├── transcript.ts     # JSONL transcript parser — groups messages into Turns
├── langsmith.ts      # LangSmith run construction using the official JS SDK
├── index.ts          # Public API re-exports
└── hooks/
    ├── stop.ts           # Stop hook entry point
    └── subagent-stop.ts  # SubagentStop hook entry point
```

## Development

```bash
pnpm install
pnpm dev         # Watch mode — recompiles on changes
pnpm test        # Run tests
pnpm build       # Production build
```

After making changes, run `/reload-plugins` in Claude Code to pick up updates.

## License

MIT

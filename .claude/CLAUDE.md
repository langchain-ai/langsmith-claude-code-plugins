# Claude Code to LangSmith Tracing Project

## Project Overview

This project sets up tracing of Claude Code conversations to LangSmith.

## How It Works

- A "Stop" hook is configured in `.claude/settings.local.json` that runs each time Claude Code responds
- The hook reads Claude Code's generated conversation transcripts
- Messages in the transcript are converted into LangSmith runs and sent to the configured LangSmith project

## Commands

### Fetch Traces

Use the langsmith-fetch command to retrieve traces from the LangSmith project when you want to debug. Do this proactivley to make sure your changes are correct:

Get the last trace:

```bash
langsmith-fetch traces --project-uuid 16e20536-e4d7-4390-8fcf-1d49cb47f4c2 --format json
```

Get the last N traces:

```bash
langsmith-fetch traces --project-uuid 16e20536-e4d7-4390-8fcf-1d49cb47f4c2 --format json --limit 5
```

## Project Configuration

- LangSmith Project UUID: `16e20536-e4d7-4390-8fcf-1d49cb47f4c2`
- Hook configuration is in `.claude/settings.local.json`

---
description: Open the current Claude Code session's thread in LangSmith
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/bundle/trace-link.js")
disable-model-invocation: true
---

!`node "${CLAUDE_PLUGIN_ROOT}/bundle/trace-link.js"`

Relay the line above to the user verbatim. If it contains a URL, present it as a clickable link. Add no other commentary.

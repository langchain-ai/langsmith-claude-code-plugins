---
description: Hide this thread's prompts, responses, and tool data from LangSmith next turn; keep only structural and usage metadata
disable-model-invocation: true
---

/langsmith-tracing:mute

This exact command takes no arguments and is handled locally by the UserPromptSubmit hook, not by the model. It saves a sticky metadata-only preference starting with the next turn; the current turn is unchanged. It does not change the master tracing switch. When master tracing is disabled, the preference is still saved for later use.

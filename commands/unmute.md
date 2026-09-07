---
description: Restore full tracing for this thread starting next turn
disable-model-invocation: true
---

/langsmith-tracing:unmute

This exact command takes no arguments and is handled locally by the UserPromptSubmit hook, not by the model. It saves a sticky full-content preference starting with the next turn; the current turn is unchanged. It does not enable master tracing or configure credentials. New threads with a healthy or absent preference file default to full-content tracing; unreadable or malformed preferences fail closed to metadata-only.

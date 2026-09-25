const USER_PROMPT_TURN_NAME = "Claude Code Turn";
const ASSISTANT_RUN_NAME = "Claude";

/** The single source of truth for the hook list; `hooks/hooks.json` is asserted against it. */
const HOOK_EVENT_NAMES = [
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "Stop",
  "StopFailure",
  "SubagentStop",
  "PreCompact",
  "PostCompact",
  "SessionEnd",
] as const;

type HookEventName = (typeof HOOK_EVENT_NAMES)[number];

const OLDER_THAN_ANY_RELEASE = "0.0.0";

const TRACING_PLUGIN_ID = "langsmith-tracing@langsmith-claude-code-plugins";

const HAND_INSTALLED_BINARY_WARNING_EVENT = "Stop";

const HAND_INSTALLED_BINARY_WARNING_MARKER_SUFFIX = ".warned";

const HAND_INSTALLED_BINARY_WARNING =
  "LangSmith tracing: the hand-installed binary at %s is still registered in settings.json, so it is doing the tracing and the plugin is standing aside. Delete that file and drop its hooks to let the plugin take over. You only see this once.";

export {
  USER_PROMPT_TURN_NAME,
  ASSISTANT_RUN_NAME,
  HOOK_EVENT_NAMES,
  OLDER_THAN_ANY_RELEASE,
  TRACING_PLUGIN_ID,
  HAND_INSTALLED_BINARY_WARNING_EVENT,
  HAND_INSTALLED_BINARY_WARNING,
  HAND_INSTALLED_BINARY_WARNING_MARKER_SUFFIX,
};
export type { HookEventName };

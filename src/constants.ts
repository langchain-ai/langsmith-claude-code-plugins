const USER_PROMPT_TURN_NAME = "Claude Code Turn";
const ASSISTANT_RUN_NAME = "Claude";

/**
 * Every Claude Code lifecycle event this plugin hooks, and the single source of
 * truth for that list. `hooks/hooks.json` is asserted against it in the tests.
 */
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

export { USER_PROMPT_TURN_NAME, ASSISTANT_RUN_NAME, HOOK_EVENT_NAMES };
export type { HookEventName };

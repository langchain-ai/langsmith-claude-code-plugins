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

/** Present on every Cursor hook payload and never sent by Claude Code. */
const CURSOR_VERSION_FIELD = "cursor_version";

/** Cleared before running git, since each one answers for somewhere else. */
const GIT_LOCATION_ENV_KEYS = [
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_COMMON_DIR",
  "GIT_INDEX_FILE",
  "GIT_CEILING_DIRECTORIES",
];

/** The parenthetical matters, since a broken submodule pointer fails with "not a git repository: <gitdir>" inside a good one. */
const NOT_A_REPOSITORY = /not a git repository \(or any of the parent directories\)/i;

const TOOL_PATH_INPUT_KEYS = ["file_path", "notebook_path", "path", "cwd"] as const;

const GIT_DIRECTORY_NAME = ".git";

const GIT_MARKERS = {
  REPOSITORY_ROOT: "repository root",
  ONLY_GIT_CAN_SAY: "only git can say",
  NOTHING_HERE: "nothing here",
} as const;

const TURN_REPOSITORY_KEYS = [
  "repository_name",
  "repository_provider",
  "repository_url",
  "git_branch",
  "git_commit_sha",
] as const;

const REPOSITORY_METADATA_KEYS = [...TURN_REPOSITORY_KEYS, "ls_attribution_identifier"] as const;

/** A symbol, since metadata travels as plain JSON and this must never reach LangSmith. */
const PINNED_REPOSITORY_KEYS = Symbol("pinned repository metadata keys");

const NO_PINNED_KEYS: ReadonlySet<string> = new Set();

const GH_LOGIN_COMMAND = "gh";

const GH_LOGIN_ARGUMENTS = ["api", "user", "--jq", ".login"];

const GH_LOGIN_TIMEOUT_MS = 5000;

const GH_LOGIN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/;

const JQ_NULL_OUTPUT = "null";

const STATE_FILE_DEFAULT = [".claude", "state", "langsmith_state.json"];

const GH_LOGIN_MARKER_FILE = "langsmith_gh_login.json";

const GH_LOGIN_RETRY_AFTER_MS = 24 * 60 * 60 * 1000;

export {
  USER_PROMPT_TURN_NAME,
  ASSISTANT_RUN_NAME,
  HOOK_EVENT_NAMES,
  CURSOR_VERSION_FIELD,
  GIT_LOCATION_ENV_KEYS,
  NOT_A_REPOSITORY,
  TOOL_PATH_INPUT_KEYS,
  GIT_DIRECTORY_NAME,
  GIT_MARKERS,
  REPOSITORY_METADATA_KEYS,
  PINNED_REPOSITORY_KEYS,
  NO_PINNED_KEYS,
  GH_LOGIN_COMMAND,
  GH_LOGIN_ARGUMENTS,
  GH_LOGIN_TIMEOUT_MS,
  GH_LOGIN_PATTERN,
  JQ_NULL_OUTPUT,
  STATE_FILE_DEFAULT,
  GH_LOGIN_MARKER_FILE,
  GH_LOGIN_RETRY_AFTER_MS,
};
export type { HookEventName };

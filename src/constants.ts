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
/** Directory of per-session upload queues, kept beside the state file. */
const QUEUE_DIR_NAME = "langsmith_queue";
const QUEUE_FILE_SUFFIX = ".queue.json";

/** A half-written entry carries this instead, so a reader never sees it. */
const QUEUE_TEMP_SUFFIX = ".queue.tmp";

/** Zero-padding that keeps entry names sorting by time well past the year 9999. */
const QUEUE_ID_TIME_WIDTH = 16;

/** Oldest entries are dropped past this, so a never-flushed queue cannot grow forever. */
const QUEUE_MAX_ENTRIES = 500;

/** An entry that fails this many uploads is dropped rather than retried forever. */
const QUEUE_MAX_ATTEMPTS = 5;

/** LangSmith rejects a run that started before this, and the whole batch with it. */
const QUEUE_RUN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** A session nobody has written to for this long is gone for good. */
const QUEUE_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Argument that runs the detached queue flusher instead of a hook handler. */
const FLUSH_QUEUE_ARG = "--flush-queue";

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
  QUEUE_DIR_NAME,
  QUEUE_FILE_SUFFIX,
  QUEUE_TEMP_SUFFIX,
  QUEUE_ID_TIME_WIDTH,
  QUEUE_MAX_ENTRIES,
  QUEUE_MAX_ATTEMPTS,
  QUEUE_RUN_MAX_AGE_MS,
  QUEUE_SESSION_MAX_AGE_MS,
  FLUSH_QUEUE_ARG,
};
export type { HookEventName };

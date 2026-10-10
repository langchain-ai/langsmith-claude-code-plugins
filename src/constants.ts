const USER_PROMPT_TURN_NAME = "Claude Code Turn";
const ASSISTANT_RUN_NAME = "Claude";
const CLAUDE_CODE_INTEGRATION = "claude-code";
const CLAUDE_TOOL_SNAPSHOT_EVENT_SUFFIX = ":native-tool";
const CLAUDE_TOOL_RECONSTRUCTION_EVENT_SUFFIX = ":reconstruct-tool";
const CLAUDE_RUN_RECONSTRUCTION_EVENT_SUFFIX = ":reconstruct-run";
const CLAUDE_RUN_SNAPSHOT_EVENT_SUFFIX = ":run-snapshot";
const CLAUDE_RUN_SNAPSHOT_SOURCE_SEPARATOR = ":";
const CLAUDE_TURN_CLOSURE_EVENT_SUFFIX = ":turn-closure";
const CLAUDE_TURN_FAILURE_EVENT_SUFFIX = ":turn-failure";
const CLAUDE_AGENT_CLOSURE_EVENT_SUFFIX = ":agent-closure";
const CLAUDE_TURN_PROGRESS_EVENT_SUFFIX = ":turn-progress";
const CLAUDE_TOOL_SNAPSHOT_EVENT_KIND = "claude-tool-snapshot-v1";
const CLAUDE_SETTLEMENT_EVENT_KIND = "run-settlement-patch";
const CLAUDE_NATIVE_SOURCE_STORAGE_DIRECTORY = "claude_native_sources_v1";

// Same build-time source as config.ts, read independently of its custom base.
// Keep this helper independent of config I/O (and hook configuration mocks).
declare const __LS_INTEGRATION_VERSION__: string;
const TRUSTED_INTEGRATION_VERSION =
  typeof __LS_INTEGRATION_VERSION__ !== "undefined"
    ? __LS_INTEGRATION_VERSION__
    : process.env.CC_LANGSMITH_INTEGRATION_VERSION || undefined;

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

/** Anything outside this set is replaced, so a session id can never escape its own folder. */
const QUEUE_SESSION_UNSAFE_CHARS = /[^\w.-]/g;

/** A half-written entry carries this instead, so a reader never sees it. */
const QUEUE_TEMP_SUFFIX = ".queue.tmp";

/** The same guard for the state file, which readers load without taking the lock. */
const STATE_TEMP_SUFFIX = ".state.tmp";
const STATE_LOCK_RELEASE_WARNING = "Could not release the shared state lock";

/** A lock is staged under this and linked into place, so it never exists without its owner's pid. */
const LOCK_STAGING_SUFFIX = ".lock.staging";

/** Owner-only, since what the plugin keeps beside the state file holds the same tool input and output the trace does. */
const PRIVATE_DIR_MODE = 0o700;
const PRIVATE_FILE_MODE = 0o600;

/** Enough of the hashed destination to tell two LangSmith accounts apart on disk. */
const QUEUE_ORIGIN_LENGTH = 12;

/** Zero-padding that keeps entry names sorting by time well past the year 9999. */
const QUEUE_ID_TIME_WIDTH = 16;

/** Oldest entries are dropped past this, so a never-flushed queue cannot grow forever. */
const QUEUE_MAX_ENTRIES = 500;

/** An entry that fails this many uploads is dropped rather than retried forever. */
const QUEUE_MAX_ATTEMPTS = 5;

/** LangSmith rejects a run that started before this, and the whole batch with it. */
const QUEUE_RUN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Another session's folder is only flushed once its oldest record is this old, which proves no live turn is still writing to it. */
const FOREIGN_QUEUE_MIN_RECORD_AGE_MS = 2 * 60 * 60 * 1000;

/** An empty folder is only removed once untouched this long, so a session that just created one keeps it. */
const EMPTY_QUEUE_MIN_IDLE_MS = 2 * 60 * 60 * 1000;

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
const TURN_RECORD_DIR_NAME = "langsmith_turns";
const TURN_RECORD_SUFFIX = ".turn.jsonl";
const SHARED_ENGINE_STORAGE_DIRECTORY = "langsmith_engine_v1";

const TURN_RECORD_MAX_BYTES = 8 * 1024 * 1024;
const TURN_RECORD_VALIDATION_LIMITS = {
  originLength: 512,
  pathLength: 16_384,
  toolUseIdLength: 512,
  toolNameLength: 512,
  resolvedMetadataValueLength: 4096,
} as const;
const TURN_RECORD_TOOL_ORIGIN_KEYS = [
  "toolUseId",
  "toolName",
  "order",
  "origin",
  "pinnedRepositoryKeys",
  "resolvedMetadata",
] as const;
const TURN_RECORD_TOOL_ORIGIN_FIELDS = ["path", "cwd", "namedAPath"] as const;
const TURN_RECORD_ORIGIN_NULL_CHARACTER = "\0";

const LEGACY_PROVIDER_METADATA_KEYS = [
  "ls_provider",
  "ls_model_type",
  "ls_message_format",
  "codex_cli_version",
  "ls_raw_aggregated_usage",
  "ls_invocation_params",
] as const;

const LEGACY_RUN_STRING_FIELDS = [
  "end_time",
  "parent_run_id",
  "trace_id",
  "dotted_order",
  "error",
  "reference_example_id",
] as const;

const LEGACY_RUN_OBJECT_FIELDS = ["outputs", "serialized"] as const;

const REPOSITORY_NAME_KEY = "repository_name";

const ATTRIBUTION_IDENTIFIER_KEY = "ls_attribution_identifier";

const UPDATE_ALREADY_RECEIVED_STATUS = 409;

const RECORDED_RUN_FALLBACK_TYPE = "tool";

const GIT_MARKER = {
  repositoryRoot: "repository root",
  onlyGitCanSay: "only git can say",
  nothingHere: "nothing here",
} as const;

const TURN_RECORD_LINE = {
  run: "run",
  toolOrigin: "tool-origin",
  closed: "closed",
  delivered: "ok",
  reconciled: "fixed",
} as const;

export {
  USER_PROMPT_TURN_NAME,
  ASSISTANT_RUN_NAME,
  CLAUDE_CODE_INTEGRATION,
  CLAUDE_TOOL_SNAPSHOT_EVENT_SUFFIX,
  CLAUDE_TOOL_RECONSTRUCTION_EVENT_SUFFIX,
  CLAUDE_RUN_RECONSTRUCTION_EVENT_SUFFIX,
  CLAUDE_RUN_SNAPSHOT_EVENT_SUFFIX,
  CLAUDE_RUN_SNAPSHOT_SOURCE_SEPARATOR,
  CLAUDE_TURN_CLOSURE_EVENT_SUFFIX,
  CLAUDE_TURN_FAILURE_EVENT_SUFFIX,
  CLAUDE_AGENT_CLOSURE_EVENT_SUFFIX,
  CLAUDE_TURN_PROGRESS_EVENT_SUFFIX,
  CLAUDE_TOOL_SNAPSHOT_EVENT_KIND,
  CLAUDE_SETTLEMENT_EVENT_KIND,
  CLAUDE_NATIVE_SOURCE_STORAGE_DIRECTORY,
  TRUSTED_INTEGRATION_VERSION,
  HOOK_EVENT_NAMES,
  CURSOR_VERSION_FIELD,
  GIT_LOCATION_ENV_KEYS,
  NOT_A_REPOSITORY,
  TOOL_PATH_INPUT_KEYS,
  GIT_DIRECTORY_NAME,
  GIT_MARKERS,
  TURN_REPOSITORY_KEYS,
  REPOSITORY_METADATA_KEYS,
  REPOSITORY_NAME_KEY,
  ATTRIBUTION_IDENTIFIER_KEY,
  UPDATE_ALREADY_RECEIVED_STATUS,
  TURN_RECORD_DIR_NAME,
  TURN_RECORD_SUFFIX,
  SHARED_ENGINE_STORAGE_DIRECTORY,
  TURN_RECORD_MAX_BYTES,
  LEGACY_PROVIDER_METADATA_KEYS,
  LEGACY_RUN_STRING_FIELDS,
  LEGACY_RUN_OBJECT_FIELDS,
  TURN_RECORD_VALIDATION_LIMITS,
  TURN_RECORD_TOOL_ORIGIN_KEYS,
  TURN_RECORD_TOOL_ORIGIN_FIELDS,
  TURN_RECORD_ORIGIN_NULL_CHARACTER,
  TURN_RECORD_LINE,
  RECORDED_RUN_FALLBACK_TYPE,
  GIT_MARKER,
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
  QUEUE_SESSION_UNSAFE_CHARS,
  QUEUE_TEMP_SUFFIX,
  STATE_TEMP_SUFFIX,
  STATE_LOCK_RELEASE_WARNING,
  LOCK_STAGING_SUFFIX,
  QUEUE_ID_TIME_WIDTH,
  PRIVATE_DIR_MODE,
  PRIVATE_FILE_MODE,
  QUEUE_ORIGIN_LENGTH,
  QUEUE_MAX_ENTRIES,
  QUEUE_MAX_ATTEMPTS,
  QUEUE_RUN_MAX_AGE_MS,
  FOREIGN_QUEUE_MIN_RECORD_AGE_MS,
  EMPTY_QUEUE_MIN_IDLE_MS,
  FLUSH_QUEUE_ARG,
};
export type { HookEventName };

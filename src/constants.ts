import { COMMON_BOOLEAN_SETTINGS } from "@langchain/plugins-base/settings";

const USER_PROMPT_TURN_NAME = "Claude Code Turn";
const ASSISTANT_RUN_NAME = "Claude";
const LS_INTEGRATION = "claude-code" as const;
const ENGINE_STORAGE_DIR_NAME = "langsmith_engine";
const RUN_CAPTURE_EVENT_KINDS: readonly string[] = ["run-post", "run-patch"];
const SDK_REPLICA_PROBE = { name: "replicas", run_type: "chain" } as const;
const TOOL_SETTLEMENT_EVENT_PREFIX = "tool:";
const POST_EVENT_PREFIX = "post:";
const PATCH_EVENT_PREFIX = "patch:";
const RUN_EVENT_PREFIXES = { post: POST_EVENT_PREFIX, patch: PATCH_EVENT_PREFIX } as const;
const CAPTURE_SAVED_STATUSES: readonly string[] = ["published", "duplicate"];
const WORKER_STOP_STATUSES: readonly string[] = ["dropped", "retry-exhausted", "scope-mismatch"];
const RECOVERY_REPORT_PROBLEM_STATUSES: readonly string[] = ["partial", "failed"];
const TRACING_NOT_STARTED_MESSAGE = "Tracing has not started for this hook";
const CLOSING_EVENT_PREFIX = "closing:";
const CLOSING_PRIVACY_MODE = "metadata" as const;
const STOP_FLUSH_WAIT_MS = 200;
const RUN_CONTEXT_FIELDS = [
  "id",
  "name",
  "run_type",
  "start_time",
  "parent_run_id",
  "trace_id",
  "dotted_order",
] as const;
const RUN_PATCH_FIELDS = ["outputs", "end_time", "error"] as const;
const RUN_SNAPSHOT_FIELDS = [...RUN_CONTEXT_FIELDS, "inputs", ...RUN_PATCH_FIELDS] as const;

/** `hooks/hooks.json` is tested against this list. */
const BINARY_COLD_START_TIMEOUT_MS = 60_000;
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

/** Only Cursor sends this, so it marks a Cursor payload. */
const CURSOR_VERSION_FIELD = "cursor_version";

const TOOL_PATH_INPUT_KEYS = ["file_path", "notebook_path", "path", "cwd"] as const;

/** A symbol so it is never serialized and sent to LangSmith. */
const PINNED_REPOSITORY_KEYS = Symbol("pinned repository metadata keys");

const NO_PINNED_KEYS: ReadonlySet<string> = new Set();

const STATE_TEMP_SUFFIX = ".state.tmp";
const STATE_LOCK_RELEASE_WARNING = "Could not release the shared state lock";
const STATE_LOCK_BUSY_WARNING =
  "Another process holds the state lock, so state updates in this hook are saved for the next lock holder";

const STATE_LOCK_WAIT_MS = 1000;
const STATE_LOCK_PROBE_MS = 200;
const STATE_LOCK_BUSY_MEMORY_MS = 30_000;
const PENDING_STATE_DIR_SUFFIX = ".pending";
const PENDING_STATE_FILE_SUFFIX = ".json";
const PENDING_STATE_TEMP_SUFFIX = ".pending.tmp";
const PENDING_STATE_ABANDONED_MS = 60_000;
const PENDING_STATE_TIME_WIDTH = 13;
const PENDING_STATE_SEQUENCE_WIDTH = 6;
const PENDING_STATE_WRITE_ATTEMPTS = 3;

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Owner-only since these files hold trace content. */
const PRIVATE_DIR_MODE = 0o700;
const PRIVATE_FILE_MODE = 0o600;

/** Argument that runs the background uploader instead of a hook handler. */
const ENGINE_WORKER_ARG = "--engine-worker";

const STATE_FILE_DEFAULT = [".claude", "state", "langsmith_state.json"];

const GH_LOGIN_MARKER_FILE = "langsmith_gh_login.json";

const BOOLEAN_SETTINGS = {
  enabled: { env: "TRACE_TO_LANGSMITH", ...COMMON_BOOLEAN_SETTINGS.enabled },
  defaultMuted: { env: "CC_LANGSMITH_DEFAULT_MUTED", ...COMMON_BOOLEAN_SETTINGS.defaultMuted },
} as const;

const USAGE_TEMPLATE = `Usage:
  {name} <HookEventName>
  {name} --version

Options:
  --help, -h     Show this help and exit
  --version, -v  Print the installed version and exit`;

const MAX_LOG_BYTES = 5 * 1024 * 1024; // 5 MB

const LOOKUP_TIMEOUT_MS = 4_000;

/** Larger transcripts are streamed instead of read whole. */
const MAX_FULL_READ_BYTES = 50 * 1024 * 1024; // 50 MB

const WORKFLOW_TOOL_NAME = "Workflow";

const WORKFLOW_SUBAGENT_TYPE = "workflow-subagent";

/** A killed subagent never fires SubagentStop, so other statuses count as completed. */
const KILLED_NOTIFICATION_STATUS = "killed";

/** Directory of per-session upload queues, kept beside the state file. */
const QUEUE_DIR_NAME = "langsmith_queue";

/** Enough of the hashed destination to tell two LangSmith accounts apart on disk. */
const QUEUE_ORIGIN_LENGTH = 12;

const TURN_RECORD_DIR_NAME = "langsmith_turns";

const TURN_RECORD_LINE = {
  run: "run",
  closed: "closed",
  delivered: "ok",
  reconciled: "fixed",
} as const;

const LEGACY_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const LEGACY_SWEEP_WARNING =
  "file(s) the previous version left unreadable or half written, since after 6 hours they can never be uploaded";
const LEGACY_EMPTY_FOLDER_IDLE_MS = 2 * 60 * 60 * 1000;
const LEGACY_UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const LEGACY_QUEUE_ID = `\\d{16}-${LEGACY_UUID}`;
const LEGACY_QUEUE_FILE = new RegExp(`^${LEGACY_QUEUE_ID}\\.queue\\.json$`);
const LEGACY_QUEUE_TEMP_FILE = new RegExp(
  `^${LEGACY_QUEUE_ID}\\.queue\\.json\\.${LEGACY_UUID}\\.queue\\.tmp$`,
);
const LEGACY_TURN_FILE = new RegExp(`^${LEGACY_UUID}\\.turn\\.jsonl$`);
const LEGACY_FLUSH_LOCK_FILE = new RegExp(
  `^[\\w.-]+\\.flush\\.lock(\\.${LEGACY_UUID}\\.lock\\.staging)?$`,
);

export {
  LEGACY_MAX_AGE_MS,
  LEGACY_EMPTY_FOLDER_IDLE_MS,
  LEGACY_SWEEP_WARNING,
  LEGACY_FLUSH_LOCK_FILE,
  LEGACY_QUEUE_FILE,
  LEGACY_QUEUE_TEMP_FILE,
  LEGACY_TURN_FILE,
  QUEUE_DIR_NAME,
  QUEUE_ORIGIN_LENGTH,
  TURN_RECORD_DIR_NAME,
  TURN_RECORD_LINE,
  USAGE_TEMPLATE,
  BOOLEAN_SETTINGS,
  MAX_LOG_BYTES,
  LOOKUP_TIMEOUT_MS,
  MAX_FULL_READ_BYTES,
  WORKFLOW_TOOL_NAME,
  WORKFLOW_SUBAGENT_TYPE,
  KILLED_NOTIFICATION_STATUS,
  USER_PROMPT_TURN_NAME,
  ASSISTANT_RUN_NAME,
  LS_INTEGRATION,
  ENGINE_STORAGE_DIR_NAME,
  SDK_REPLICA_PROBE,
  RUN_CAPTURE_EVENT_KINDS,
  TOOL_SETTLEMENT_EVENT_PREFIX,
  POST_EVENT_PREFIX,
  RUN_EVENT_PREFIXES,
  CAPTURE_SAVED_STATUSES,
  WORKER_STOP_STATUSES,
  RECOVERY_REPORT_PROBLEM_STATUSES,
  TRACING_NOT_STARTED_MESSAGE,
  CLOSING_EVENT_PREFIX,
  CLOSING_PRIVACY_MODE,
  STOP_FLUSH_WAIT_MS,
  RUN_CONTEXT_FIELDS,
  RUN_PATCH_FIELDS,
  RUN_SNAPSHOT_FIELDS,
  BINARY_COLD_START_TIMEOUT_MS,
  HOOK_EVENT_NAMES,
  CURSOR_VERSION_FIELD,
  TOOL_PATH_INPUT_KEYS,
  PINNED_REPOSITORY_KEYS,
  NO_PINNED_KEYS,
  STATE_FILE_DEFAULT,
  GH_LOGIN_MARKER_FILE,
  STATE_TEMP_SUFFIX,
  STATE_LOCK_RELEASE_WARNING,
  STATE_LOCK_BUSY_WARNING,
  STATE_LOCK_WAIT_MS,
  STATE_LOCK_PROBE_MS,
  STATE_LOCK_BUSY_MEMORY_MS,
  PENDING_STATE_DIR_SUFFIX,
  PENDING_STATE_FILE_SUFFIX,
  PENDING_STATE_TEMP_SUFFIX,
  PENDING_STATE_ABANDONED_MS,
  PENDING_STATE_TIME_WIDTH,
  PENDING_STATE_SEQUENCE_WIDTH,
  PENDING_STATE_WRITE_ATTEMPTS,
  SESSION_MAX_AGE_MS,
  PRIVATE_DIR_MODE,
  PRIVATE_FILE_MODE,
  ENGINE_WORKER_ARG,
};

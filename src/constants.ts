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

const GH_CONFIG_DIR_ENV = "GH_CONFIG_DIR";

const GH_DEFAULT_CONFIG_DIR = [".config", "gh"] as const;

const GH_HOSTS_FILE = "hosts.yml";

const GITHUB_DOT_COM = "github.com";

const GH_HOSTS_HOST_LINE = /^([A-Za-z0-9][^\s:]*):\s*$/;

const GH_HOSTS_USER_LINE = /^\s+user:\s+["']?([^"'\s#]+)["']?\s*$/;

export {
  USER_PROMPT_TURN_NAME,
  ASSISTANT_RUN_NAME,
  HOOK_EVENT_NAMES,
  CURSOR_VERSION_FIELD,
  GIT_LOCATION_ENV_KEYS,
  NOT_A_REPOSITORY,
  TOOL_PATH_INPUT_KEYS,
  TURN_REPOSITORY_KEYS,
  REPOSITORY_METADATA_KEYS,
  PINNED_REPOSITORY_KEYS,
  NO_PINNED_KEYS,
  GH_CONFIG_DIR_ENV,
  GH_DEFAULT_CONFIG_DIR,
  GH_HOSTS_FILE,
  GITHUB_DOT_COM,
  GH_HOSTS_HOST_LINE,
  GH_HOSTS_USER_LINE,
};
export type { HookEventName };

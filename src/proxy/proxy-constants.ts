export const CONFIG_UPDATE_GUIDANCE =
  "Invalid proxy configuration. A one-time private config update is required: use the full current schema with explicit enabled and useClaudeSubscription booleans, including when disabled. Retain your existing local key, CLI, profile, port and endpoints. Do not paste secrets or delete/reset configuration.";

export const COMMAND_GUIDANCE =
  "Use /langsmith-gateway:setup --scope global|project or /langsmith-gateway:disable --scope global|project within Claude Code. Add a --use-claude-subscription flag to pass Claude subscription auth directly to Anthropic. To sign in with your company identity token instead of the LangSmith CLI, add --workspace-id UUID and put --credential-command last, followed by a command that prints one token on standard output. The daemon runs that command with /bin/sh from your home directory and gives it only HOME and a standard PATH, so name a script if it needs quotes, pipes or anything else your shell sets up. Add --credential-ttl SECONDS to change how long each result is reused from the default 300.";

export const STATUS_GUIDANCE =
  "Use /langsmith-gateway:status [--scope global|project] within Claude Code.";

export const TTL_RANGE_GUIDANCE = "Credential cache seconds must be between 1 and 3600";

export const TENANT_HEADER_GUIDANCE =
  "Send x-tenant-id at most once and as a workspace UUID. Drop the header to use the workspace saved in your gateway configuration.";

export const ORIGIN_SHAPE_GUIDANCE =
  "Endpoints must be HTTPS DNS origins without credentials, path, query or fragment";

export const ORIGIN_DNS_GUIDANCE = "Endpoints must use public DNS names and HTTPS ports 1-65535";

export const API_URL = "https://api.smith.langchain.com";
export const UPSTREAM = "https://gateway.smith.langchain.com";
export const PROTOCOL_VERSION = 10;
export const KEY_HEADER = "x-langsmith-proxy-key";
export const TENANT_HEADER = "x-tenant-id";

export const BEARER_TOKEN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
export const WORKSPACE_ID = /^[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/;
export const PROFILE_NAME = /^[a-zA-Z0-9_.-]{1,128}$/;
export const SECRET = /^[a-f0-9]{64}$/;
export const SETTINGS_TARGET = /\/\.claude\/settings(?:\.local)?\.json$/;
export const TTL_SECONDS = /^[0-9]{1,5}$/;
export const WHITESPACE = /\s/;
export const ORIGIN = /^https:\/\/[a-zA-Z0-9.-]+(?::[0-9]{1,5})?\/?$/;
export const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
export const TOP_LEVEL_LABEL = /^[a-z][a-z0-9-]*$/;
export const PRIVATE_HOST = /(?:^|\.)(?:localhost|local|internal|home|lan)$/;
// eslint-disable-next-line no-control-regex
export const CONTROL = /[\x00-\x1f\x7f]/;

export const MAX_ORIGIN_LENGTH = 2048;
export const MAX_HOSTNAME_LENGTH = 253;
export const MIN_URL_PORT = 1;
export const MAX_URL_PORT = 65535;
export const MIN_PORT = 1024;
export const MAX_PORT = 65535;
export const MAX_SETTINGS_TARGETS = 128;
export const MAX_PATH_LENGTH = 4096;

export const SHELL = "/bin/sh";
export const MAX_TOKEN_BYTES = 16384;
export const EXPIRY_SKEW_MS = 5000;
export const EXPIRY_MARGIN_MS = 60_000;
export const RETRY_AFTER_MS = 2000;
export const MAX_CREDENTIAL_COMMAND = 4096;
export const CREDENTIAL_TIMEOUT_MS = 10_000;
export const CLI_TOKEN_TTL_MS = 60_000;
export const DEFAULT_CREDENTIAL_TTL_MS = 5 * 60_000;
export const MIN_CREDENTIAL_TTL_MS = 1000;
export const MAX_CREDENTIAL_TTL_MS = 60 * 60_000;

export const CONFIG_KEYS = [
  "enabled",
  "settingsTargets",
  "cli",
  "profile",
  "port",
  "secret",
  "apiUrl",
  "gatewayUrl",
  "useClaudeSubscription",
  "credentialCommand",
  "credentialTtlMs",
  "workspaceId",
];

export const SETUP_FLAGS = [
  "--scope",
  "--cli",
  "--port",
  "--profile",
  "--api-url",
  "--gateway-url",
  "--credential-ttl",
  "--workspace-id",
];

export const hop = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "proxy-connection",
]);
export const routing = new Set([
  "authorization",
  "x-auth-source",
  "x-gateway-key",
  "gateway-key",
  "x-api-key",
  "x-tenant-id",
  "x-workspace-id",
  "x-project-id",
  "x-auth-mode",
  "x-gateway-auth-mode",
  "x-service-key",
  "x-auth-token",
  "x-secret-token",
]);

// Matches smith-go/gateway's buffered request limit, including large image contexts.
export const MAX_REQUEST_BYTES = 60 * 1024 * 1024;

export const AUTH = [
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_API_KEY",
  "CLAUDE_CODE_USE_BEDROCK",
  "CLAUDE_CODE_USE_VERTEX",
  "CLAUDE_CODE_USE_FOUNDRY",
  "ANTHROPIC_FOUNDRY_API_KEY",
  "ANTHROPIC_FOUNDRY_BASE_URL",
  "CLAUDE_CODE_API_KEY_HELPER",
];

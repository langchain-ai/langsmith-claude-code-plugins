export const CONFIG_UPDATE_GUIDANCE =
  "Invalid proxy configuration. A one-time private config update is required: use the full current schema with explicit enabled and useClaudeSubscription booleans, including when disabled. Retain your existing local key, CLI, profile, port and endpoints. Do not paste secrets or delete/reset configuration.";

export const COMMAND_GUIDANCE =
  "Run /langsmith-gateway:setup --scope global|project within Claude Code, or /langsmith-gateway:disable to turn it off. To sign in with your own identity token, add --workspace-id UUID and --identity-token-command \"your command\", where the command prints one token. See GATEWAY.md for the other flags.";

export const CREDENTIAL_SOURCE_GUIDANCE =
  "Setup needs either the LangSmith CLI or your own identity token command, and found neither. Install the CLI using the README and complete terminal login with your selected profile and API URL (review the saved OAuth issuer), or add --workspace-id UUID and --identity-token-command with a command that prints your identity token. Then retry /langsmith-gateway:setup.";

export const CONFLICTING_AUTH_GUIDANCE =
  "Conflicting provider/auth setting; client auth overrides are not supported by this setup.";

export const CONFLICTING_BASE_GUIDANCE =
  "Conflicting Claude API address setting; it will not be overwritten.";

export const CONFLICT_ENVIRONMENT_GUIDANCE =
  "Unset in your shell and restart Claude Code, since it reads these at startup.";

export const CONFLICT_SETTINGS_GUIDANCE = "Remove from that file.";

export const CONFLICT_RETRY_GUIDANCE = "Then retry setup.";

export const PINNED_CHANGE_GUIDANCE =
  "Run /langsmith-gateway:disable first for every active scope (use --scope global|project), stop all gateway sessions and CLI writers, then retry /langsmith-gateway:setup with the explicit options. Do not edit the shared config while other scopes are active.";

export const PINNED_FIELD_LABELS = {
  cli: "CLI path",
  profile: "profile",
  port: "port",
  identityTokenCommand: "identity token command",
  identityTokenTtlMs: "identity token reuse seconds",
  workspaceId: "workspace id",
  apiUrl: "API address",
  gatewayUrl: "gateway address",
};

export const STATUS_GUIDANCE =
  "Use /langsmith-gateway:status [--scope global|project] within Claude Code.";

export const TTL_RANGE_GUIDANCE = "Identity token cache seconds must be between 1 and 3600";

export const QUOTE_GUIDANCE =
  "Unterminated quote after --identity-token-command. Close the quote around your command, or write the command unquoted and last.";

export const QUOTES = ["'", '"'];

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
export const MAX_IDENTITY_TOKEN_COMMAND = 4096;
export const CREDENTIAL_TIMEOUT_MS = 10_000;
export const CLI_TOKEN_TTL_MS = 60_000;
export const DEFAULT_IDENTITY_TOKEN_TTL_MS = 5 * 60_000;
export const MIN_IDENTITY_TOKEN_TTL_MS = 1000;
export const MAX_IDENTITY_TOKEN_TTL_MS = 60 * 60_000;

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
  "identityTokenCommand",
  "identityTokenTtlMs",
  "workspaceId",
];

export const SETUP_FLAGS = [
  "--scope",
  "--cli",
  "--port",
  "--profile",
  "--api-url",
  "--gateway-url",
  "--identity-token-ttl",
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

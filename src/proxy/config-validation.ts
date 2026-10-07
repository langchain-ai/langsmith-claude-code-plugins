import { isAbsolute, normalize } from "node:path";
import {
  CONFIG_KEYS,
  CONTROL,
  DNS_LABEL,
  MAX_CREDENTIAL_COMMAND,
  MAX_CREDENTIAL_TTL_MS,
  MAX_HOSTNAME_LENGTH,
  MAX_ORIGIN_LENGTH,
  MAX_PATH_LENGTH,
  MAX_PORT,
  MAX_SETTINGS_TARGETS,
  MAX_URL_PORT,
  MIN_CREDENTIAL_TTL_MS,
  MIN_PORT,
  MIN_URL_PORT,
  ORIGIN,
  PRIVATE_HOST,
  PROFILE_NAME,
  SECRET,
  SETTINGS_TARGET,
  TOP_LEVEL_LABEL,
  WHITESPACE,
  WORKSPACE_ID,
} from "./proxy-constants.js";
import type { ProxyConfig } from "./proxy-models.js";

export const wellFormedOrigin = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= MAX_ORIGIN_LENGTH &&
  !WHITESPACE.test(value) &&
  ORIGIN.test(value);

export const publicDnsOrigin = (url: URL): boolean => {
  const labels = url.hostname.split(".");
  const port = url.port === "" ? undefined : Number(url.port);
  return (
    url.hostname.length <= MAX_HOSTNAME_LENGTH &&
    labels.length >= 2 &&
    labels.every((label) => DNS_LABEL.test(label)) &&
    TOP_LEVEL_LABEL.test(labels.at(-1)!) &&
    !PRIVATE_HOST.test(url.hostname) &&
    (port === undefined || (port >= MIN_URL_PORT && port <= MAX_URL_PORT))
  );
};

export const absent = (value: unknown, valid: (v: unknown) => boolean): boolean =>
  value === undefined || valid(value);

export const isCredentialCommand = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= MAX_CREDENTIAL_COMMAND &&
  !CONTROL.test(value);

export const isCredentialTtlMs = (value: unknown): value is number =>
  Number.isInteger(value) &&
  (value as number) >= MIN_CREDENTIAL_TTL_MS &&
  (value as number) <= MAX_CREDENTIAL_TTL_MS;

export const isWorkspaceId = (value: unknown): value is string =>
  typeof value === "string" && WORKSPACE_ID.test(value);

export const isProfile = (value: unknown): boolean =>
  typeof value === "string" && PROFILE_NAME.test(value);

export const isCliPath = (value: unknown): boolean =>
  typeof value === "string" && isAbsolute(value);

export const isPort = (value: unknown): boolean =>
  Number.isInteger(value) && (value as number) >= MIN_PORT && (value as number) <= MAX_PORT;

export const isSecret = (value: unknown): boolean =>
  typeof value === "string" && SECRET.test(value);

export const isSettingsTarget = (value: unknown): boolean =>
  typeof value === "string" &&
  value.length <= MAX_PATH_LENGTH &&
  isAbsolute(value) &&
  normalize(value) === value &&
  !value.includes("\0") &&
  SETTINGS_TARGET.test(value);

export const isSettingsTargets = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.length <= MAX_SETTINGS_TARGETS &&
  value.every((target) => isSettingsTarget(target));

export const onlyKnownKeys = (value: object): boolean =>
  Object.keys(value).every((key) => CONFIG_KEYS.includes(key));

export const isSavedConfig = (c: ProxyConfig): boolean =>
  typeof c.enabled === "boolean" &&
  typeof c.useClaudeSubscription === "boolean" &&
  isCliPath(c.cli) &&
  absent(c.profile, isProfile) &&
  isPort(c.port) &&
  isSecret(c.secret) &&
  absent(c.settingsTargets, isSettingsTargets) &&
  absent(c.credentialCommand, isCredentialCommand) &&
  absent(c.credentialTtlMs, isCredentialTtlMs) &&
  absent(c.workspaceId, isWorkspaceId) &&
  onlyKnownKeys(c);

import { lstatSync, readFileSync, statSync } from "node:fs";

/** Canonical langsmith.json contract. Keep this module dependency-free across adapters. */
export interface CommonReplica {
  api_url?: string;
  api_key?: string;
  project?: string;
  updates?: Record<string, unknown>;
}

export interface CommonRedactRule {
  pattern: string;
  replace?: string;
}

export interface CommonConfig {
  enabled?: boolean;
  defaultMuted?: boolean;
  api_key?: string;
  api_url?: string;
  project?: string;
  replicas?: CommonReplica[];
  metadata?: Record<string, unknown>;
  redact?: boolean;
  redact_extra_rules?: CommonRedactRule[];
}

/** Raw is only for adapter extensions: never re-validate common fields with an extension schema. */
export interface CommonConfigResult {
  status: "absent" | "valid" | "invalid";
  common: CommonConfig;
  raw?: Record<string, unknown>;
  /** Fixed messages only: no file contents, values, parser errors, or secrets. */
  diagnostics: string[];
}

export const COMMON_BOOLEAN_SETTINGS = {
  enabled: { default: false, restrictive: false },
  defaultMuted: { default: false, restrictive: true },
} as const;

export interface CommonConfigSources {
  /** Adapter supplies exactly its project, cwd-root, and user sources; no ancestor search. */
  harness?: CommonConfig;
  root?: CommonConfig;
  user?: CommonConfig;
  /** Already parsed by the adapter's existing environment discovery/parsers. */
  env?: CommonConfig;
  defaults?: CommonConfig;
}

export type MergedCommonConfig = CommonConfig & {
  enabled: boolean;
  defaultMuted: boolean;
  redact: boolean;
};

export interface SdkReplica {
  apiUrl?: string;
  apiKey?: string;
  projectName?: string;
  updates?: Record<string, unknown>;
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(raw?: Record<string, unknown>): CommonConfigResult {
  return {
    status: "invalid",
    common: { enabled: false, defaultMuted: true },
    ...(raw === undefined ? {} : { raw }),
    diagnostics: [
      "Invalid or unreadable common config; ordinary fields discarded, privacy switches restricted.",
    ],
  };
}

function parseReplica(value: unknown): CommonReplica | undefined {
  if (!object(value)) return undefined;
  const replica: CommonReplica = {};
  for (const [canonical, alias] of [
    ["api_url", "apiUrl"],
    ["api_key", "apiKey"],
    ["project", "projectName"],
  ] as const) {
    // Presence, not nullishness: an invalid canonical value must not select its alias.
    const selected = Object.hasOwn(value, canonical) ? canonical : alias;
    if (Object.hasOwn(value, selected)) {
      const entry = value[selected];
      if (typeof entry !== "string") return undefined;
      replica[canonical] = entry;
    }
  }
  if (Object.hasOwn(value, "updates")) {
    if (!object(value.updates)) return undefined;
    replica.updates = value.updates;
  }
  return replica;
}

/** Parse a decoded JSON value (not JSON text). Unknown/adapter fields do not affect common validity. */
export function parseCommonConfig(value: unknown): CommonConfigResult {
  if (!object(value)) return invalid();
  const common: CommonConfig = {};
  const diagnostics: string[] = [];
  for (const field of ["enabled", "defaultMuted"] as const) {
    if (!Object.hasOwn(value, field)) continue;
    const entry = value[field];
    common[field] = typeof entry === "boolean" ? entry : COMMON_BOOLEAN_SETTINGS[field].restrictive;
    if (typeof entry !== "boolean") diagnostics.push(`Invalid ${field}; using restrictive value.`);
  }
  for (const field of ["api_key", "api_url", "project"] as const) {
    if (!Object.hasOwn(value, field)) continue;
    if (typeof value[field] !== "string") return invalid(value);
    common[field] = value[field];
  }
  if (Object.hasOwn(value, "redact")) {
    if (typeof value.redact !== "boolean") return invalid(value);
    common.redact = value.redact;
  }
  if (Object.hasOwn(value, "metadata")) {
    if (!object(value.metadata)) return invalid(value);
    common.metadata = value.metadata;
  }
  if (Object.hasOwn(value, "replicas")) {
    if (!Array.isArray(value.replicas)) return invalid(value);
    const replicas: CommonReplica[] = [];
    for (const entry of value.replicas) {
      const replica = parseReplica(entry);
      if (replica === undefined) return invalid(value);
      replicas.push(replica);
    }
    common.replicas = replicas;
  }
  if (Object.hasOwn(value, "redact_extra_rules")) {
    if (!Array.isArray(value.redact_extra_rules)) return invalid(value);
    const rules: CommonRedactRule[] = [];
    for (const rule of value.redact_extra_rules) {
      if (!object(rule) || typeof rule.pattern !== "string" || !Object.hasOwn(rule, "pattern")) {
        return invalid(value);
      }
      const hasReplace = Object.hasOwn(rule, "replace");
      if (hasReplace && typeof rule.replace !== "string") return invalid(value);
      try {
        new RegExp(rule.pattern, "g");
      } catch {
        return invalid(value);
      }
      rules.push({
        pattern: rule.pattern,
        ...(hasReplace ? { replace: rule.replace as string } : {}),
      });
    }
    common.redact_extra_rules = rules;
  }
  return { status: "valid", common, raw: value, diagnostics };
}

/** Follow readable symlinks, but never read directories/devices/FIFOs. Only true ENOENT is absent. */
export function readCommonConfigFile(path: string): CommonConfigResult {
  try {
    if (!statSync(path).isFile()) return invalid();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      try {
        lstatSync(path);
      } catch (lstatError) {
        if ((lstatError as NodeJS.ErrnoException).code === "ENOENT") {
          return { status: "absent", common: {}, diagnostics: [] };
        }
      }
    }
    return invalid();
  }
  try {
    return parseCommonConfig(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return invalid();
  }
}

/** Ordinary fields env-first; switches independently file-first; metadata shallow-merges per key. */
export function mergeCommonConfig(sources: CommonConfigSources): MergedCommonConfig {
  const { harness = {}, root = {}, user = {}, env = {}, defaults = {} } = sources;
  const merged: MergedCommonConfig = { enabled: false, defaultMuted: false, redact: true };
  for (const field of ["enabled", "defaultMuted"] as const) {
    merged[field] =
      harness[field] ??
      root[field] ??
      user[field] ??
      env[field] ??
      defaults[field] ??
      COMMON_BOOLEAN_SETTINGS[field].default;
  }
  merged.api_key =
    env.api_key ?? harness.api_key ?? root.api_key ?? user.api_key ?? defaults.api_key;
  merged.api_url =
    env.api_url ?? harness.api_url ?? root.api_url ?? user.api_url ?? defaults.api_url;
  merged.project =
    env.project ?? harness.project ?? root.project ?? user.project ?? defaults.project;
  merged.replicas =
    env.replicas ?? harness.replicas ?? root.replicas ?? user.replicas ?? defaults.replicas;
  merged.redact =
    env.redact ?? harness.redact ?? root.redact ?? user.redact ?? defaults.redact ?? true;
  merged.redact_extra_rules =
    env.redact_extra_rules ??
    harness.redact_extra_rules ??
    root.redact_extra_rules ??
    user.redact_extra_rules ??
    defaults.redact_extra_rules;
  if ([defaults, user, root, harness, env].some((source) => source.metadata !== undefined)) {
    // Spread defines own properties (including __proto__), unlike assignment into a target.
    merged.metadata = {
      ...defaults.metadata,
      ...user.metadata,
      ...root.metadata,
      ...harness.metadata,
      ...env.metadata,
    };
  }
  return merged;
}

/** Convert validated canonical FILE replicas only. Legacy SDK environment tuples belong to adapters. */
export function toSdkReplicas(
  replicas: readonly CommonReplica[] | undefined,
): SdkReplica[] | undefined {
  return replicas?.map((replica) => ({
    ...(replica.api_url === undefined ? {} : { apiUrl: replica.api_url }),
    ...(replica.api_key === undefined ? {} : { apiKey: replica.api_key }),
    ...(replica.project === undefined ? {} : { projectName: replica.project }),
    ...(replica.updates === undefined ? {} : { updates: replica.updates }),
  }));
}

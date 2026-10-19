import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { TOOL_PATH_INPUT_KEYS } from "./constants.js";
import type { ToolPathLookup } from "./types.js";

export function toolPathFromInput(toolInput: unknown, sessionCwd?: string): ToolPathLookup {
  if (!toolInput || typeof toolInput !== "object" || Array.isArray(toolInput)) {
    return { namedAPath: false };
  }
  const input = toolInput as Record<string, unknown>;
  let namedAPath = false;
  for (const key of TOOL_PATH_INPUT_KEYS) {
    const value = input[key];
    if (typeof value !== "string" || value.length === 0) continue;
    namedAPath = true;
    if (isAbsolute(value)) return { path: value, namedAPath };
    if (!sessionCwd || !isAbsolute(sessionCwd)) continue;
    const resolved = resolve(sessionCwd, value);
    if (existsSync(resolved)) return { path: resolved, namedAPath };
  }
  return { namedAPath };
}

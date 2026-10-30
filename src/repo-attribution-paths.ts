import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { GIT_DIR_COMMAND, GLOB_CHARACTER, TOOL_PATH_INPUT_KEYS } from "./constants.js";
import type { ToolPathLookup } from "./types.js";

export function toolPathFromInput(toolInput: unknown, sessionCwd?: string): ToolPathLookup {
  if (!toolInput || typeof toolInput !== "object" || Array.isArray(toolInput)) {
    return { namedAPath: false };
  }
  const named = toolInput as Record<string, unknown>;
  const gitDir = typeof named.command === "string" ? GIT_DIR_COMMAND.exec(named.command)?.[1] : "";
  const globDir =
    typeof named.pattern === "string" && isAbsolute(named.pattern) && named.path === undefined
      ? dirname(`${named.pattern.split(GLOB_CHARACTER)[0]}_`)
      : "";
  const input =
    gitDir || (globDir && existsSync(globDir)) ? { ...named, path: gitDir || globDir } : named;
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

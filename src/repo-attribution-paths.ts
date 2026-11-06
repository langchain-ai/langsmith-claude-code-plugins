import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import {
  GIT_DIR_COMMAND,
  GLOB_CHARACTER,
  SURROUNDING_QUOTES,
  TOOL_PATH_INPUT_KEYS,
} from "./constants.js";
import type { ToolPathLookup } from "./types.js";

function gitCommandFolder(command: unknown): string | undefined {
  if (typeof command !== "string") return undefined;
  return GIT_DIR_COMMAND.exec(command)?.[1]?.replace(SURROUNDING_QUOTES, "");
}

function globFolder(input: Record<string, unknown>, toolName?: string): string | undefined {
  const { pattern, path } = input;
  if (toolName !== "Glob" || typeof pattern !== "string" || !isAbsolute(pattern)) return undefined;
  if (path !== undefined) return undefined;
  const folder = dirname(`${pattern.split(GLOB_CHARACTER)[0]}_`);
  return existsSync(folder) ? folder : undefined;
}

export function toolPathFromInput(
  toolInput: unknown,
  sessionCwd?: string,
  toolName?: string,
): ToolPathLookup {
  if (!toolInput || typeof toolInput !== "object" || Array.isArray(toolInput)) {
    return { namedAPath: false };
  }
  const named = toolInput as Record<string, unknown>;
  const folder = gitCommandFolder(named.command) || globFolder(named, toolName);
  const input = folder ? { ...named, path: folder } : named;
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

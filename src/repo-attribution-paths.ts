import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import { rootFromGitMarker } from "@langchain/plugins-base/git";
import {
  BASH_GIT_DIRECTORY,
  BASH_CD_STEP,
  BASH_PLAIN_STEP,
  GLOB_TOOL_NAME,
  HOME_SHORTHAND,
  TOOL_PATH_INPUT_KEYS,
} from "./constants.js";
import type { ToolPathLookup } from "./types.js";

function insideGitRepository(path: string): boolean {
  return typeof rootFromGitMarker(path) === "string";
}

function existingPath(path: string | undefined, from: string | undefined): string | undefined {
  if (!path) return undefined;
  const target = path.replace(HOME_SHORTHAND, homedir());
  const resolved = isAbsolute(target)
    ? target
    : from && isAbsolute(from)
      ? resolve(from, target)
      : "";
  return resolved && existsSync(resolved) ? resolved : undefined;
}

function folderArgument(match: RegExpMatchArray): string {
  return match[1] ?? match[2] ?? match[3];
}

function pathFromBashCommand(command: string, sessionCwd?: string): string | undefined {
  let current: string | undefined;
  let rest = command;
  for (;;) {
    const from = current ?? sessionCwd;
    const git = rest.match(BASH_GIT_DIRECTORY);
    if (git) return existingPath(folderArgument(git), from) ?? current;
    const cd = rest.match(BASH_CD_STEP);
    if (cd) {
      const entered = existingPath(folderArgument(cd), from);
      if (!entered) return current;
      current = entered;
      if (cd[4] !== "&&") return current;
      rest = rest.slice(cd[0].length);
      continue;
    }
    const plain = rest.match(BASH_PLAIN_STEP);
    if (!plain) return current;
    rest = rest.slice(plain[0].length);
  }
}

function pathFromGlobPattern(pattern: string): string | undefined {
  return isAbsolute(pattern) && insideGitRepository(pattern) ? pattern : undefined;
}

export function toolPathFromInput(
  toolInput: unknown,
  sessionCwd?: string,
  toolName?: string,
): ToolPathLookup {
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
  const inferred =
    toolName === GLOB_TOOL_NAME && typeof input.pattern === "string"
      ? pathFromGlobPattern(input.pattern)
      : typeof input.command === "string"
        ? pathFromBashCommand(input.command, sessionCwd)
        : undefined;
  return inferred ? { path: inferred, namedAPath: true } : { namedAPath };
}

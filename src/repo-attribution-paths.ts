import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import { rootFromGitMarker } from "@langchain/plugins-base/git";
import {
  BASH_ABSOLUTE_PATH,
  BASH_GIT_DIRECTORY,
  BASH_LEADING_CD,
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

function firstGroup(match: RegExpMatchArray | null): string | undefined {
  return match?.slice(1).find((group) => group !== undefined);
}

function pathFromBashCommand(command: string, sessionCwd?: string): string | undefined {
  const enteredDirectory = existingPath(firstGroup(command.match(BASH_LEADING_CD)), sessionCwd);
  const gitDirectory = existingPath(firstGroup(command.match(BASH_GIT_DIRECTORY)), sessionCwd);
  const named = gitDirectory ?? enteredDirectory;
  if (named) return named;
  for (const match of command.matchAll(BASH_ABSOLUTE_PATH)) {
    const candidate = firstGroup(match);
    if (candidate && insideGitRepository(candidate)) return candidate;
  }
  return undefined;
}

function pathFromPattern(pattern: string): string | undefined {
  return isAbsolute(pattern) && insideGitRepository(pattern) ? pattern : undefined;
}

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
  const inferred =
    typeof input.pattern === "string"
      ? pathFromPattern(input.pattern)
      : typeof input.command === "string"
        ? pathFromBashCommand(input.command, sessionCwd)
        : undefined;
  return inferred ? { path: inferred, namedAPath: true } : { namedAPath };
}

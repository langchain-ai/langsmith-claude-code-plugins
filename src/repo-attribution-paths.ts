import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import { rootFromGitMarker } from "@langchain/plugins-base/git";
import {
  BASH_CD_STEP,
  BASH_CD_WORD,
  BASH_GIT_CONFIG_FLAG,
  BASH_GIT_DIRECTORY_FLAG,
  BASH_GIT_WORD,
  BASH_LATER_CD,
  BASH_PLAIN_STEP,
  BASH_SUBSHELL_STEP,
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
  let folder: string | undefined;
  let rest = command.trim();
  while (rest) {
    if (BASH_CD_WORD.test(rest)) {
      const cd = rest.match(BASH_CD_STEP);
      if (!cd) return undefined;
      const entered = existingPath(folderArgument(cd), folder ?? sessionCwd);
      if (!entered) return undefined;
      folder = entered;
      rest = rest.slice(cd[0].length).trimStart();
      continue;
    }
    if (BASH_GIT_WORD.test(rest)) {
      let options = rest.slice(3);
      let gitFolder = folder ?? sessionCwd;
      let named = false;
      for (;;) {
        const config = options.match(BASH_GIT_CONFIG_FLAG);
        const directory = options.match(BASH_GIT_DIRECTORY_FLAG);
        const flag = config ?? directory;
        if (!flag) break;
        if (directory) {
          gitFolder = existingPath(folderArgument(directory), gitFolder);
          if (!gitFolder) return undefined;
          named = true;
        }
        options = options.slice(flag[0].length);
      }
      if (named) return BASH_LATER_CD.test(options) ? undefined : gitFolder;
    }
    const step = rest.match(BASH_SUBSHELL_STEP) ?? rest.match(BASH_PLAIN_STEP);
    if (!step) return BASH_LATER_CD.test(rest) ? undefined : folder;
    rest = rest.slice(step[0].length).trimStart();
  }
  return folder;
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
  return inferred ? { path: inferred, namedAPath } : { namedAPath };
}

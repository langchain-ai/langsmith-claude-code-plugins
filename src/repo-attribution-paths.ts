import { existsSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, resolve, sep } from "node:path";
import { rootFromGitMarker } from "@langchain/plugins-base/git";
import {
  BASH_CD_STEP,
  BASH_FOLDER_CHANGE,
  BASH_GIT_CONFIG_FLAG,
  BASH_GIT_DIRECTORY_FLAG,
  BASH_GIT_ENVIRONMENT,
  BASH_GIT_OPTION,
  BASH_GIT_WORD,
  GLOB_TOOL_NAME,
  HOME_SHORTHAND,
  TOOL_PATH_INPUT_KEYS,
} from "./constants.js";
import type { ToolPathLookup } from "./types.js";

function insideGitRepository(path: string): boolean {
  return typeof rootFromGitMarker(path) === "string";
}

function directoryAt(
  path: string,
  from: string | undefined,
  physical: boolean,
): string | undefined {
  const target = path.replace(HOME_SHORTHAND, homedir());
  if (!isAbsolute(target) && from === undefined) return undefined;
  const joined = isAbsolute(target) ? target : `${from}${sep}${target}`;
  try {
    const folder = physical ? realpathSync.native(joined) : resolve(joined);
    return statSync(folder).isDirectory() ? folder : undefined;
  } catch {
    return undefined;
  }
}

function folderArgument(match: RegExpMatchArray): string {
  return match[1] ?? match[2] ?? match[3];
}

function pathFromBashCommand(command: string, callCwd?: string): string | undefined {
  if (BASH_GIT_ENVIRONMENT.test(command)) return undefined;
  let folder = callCwd !== undefined && isAbsolute(callCwd) ? callCwd : undefined;
  let named = false;
  let rest = command.trimStart();
  for (let cd = rest.match(BASH_CD_STEP); cd; cd = rest.match(BASH_CD_STEP)) {
    folder = directoryAt(folderArgument(cd), folder, false);
    if (!folder) return undefined;
    named = true;
    rest = rest.slice(cd[0].length);
  }
  const git = rest.match(BASH_GIT_WORD);
  if (git) {
    rest = rest.slice(git[0].length);
    for (;;) {
      const config = rest.match(BASH_GIT_CONFIG_FLAG);
      const directory = rest.match(BASH_GIT_DIRECTORY_FLAG);
      const flag = config ?? directory;
      if (!flag) break;
      if (directory) {
        folder = directoryAt(folderArgument(directory), folder, true);
        if (!folder) return undefined;
        named = true;
      }
      rest = rest.slice(flag[0].length);
    }
    if (BASH_GIT_OPTION.test(rest)) return undefined;
  }
  return named && !BASH_FOLDER_CHANGE.test(rest) ? folder : undefined;
}

export function commandLeavesItsFolder(toolInput: unknown): boolean {
  const command = (toolInput as { command?: unknown } | null)?.command;
  return typeof command === "string" && BASH_FOLDER_CHANGE.test(command);
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

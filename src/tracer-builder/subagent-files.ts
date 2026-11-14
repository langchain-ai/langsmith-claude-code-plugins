import { closeSync, fstatSync, openSync, readFileSync, readSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import {
  SUBAGENT_FILE,
  SUBAGENTS_FOLDER,
  TAIL_READ_BYTES,
  subagentFileName,
  subagentMetaFileName,
} from "./tracer-builder-constants.js";

export function subagentTranscriptPath(mainPath: string, sessionId: string, agentId: string) {
  return join(dirname(mainPath), sessionId, SUBAGENTS_FOLDER, subagentFileName(agentId));
}

export function subagentIdOf(path: string): string | undefined {
  return SUBAGENT_FILE.exec(basename(path))?.[1];
}

function topLevelUuid(line: string): string | undefined {
  try {
    const uuid = (JSON.parse(line) as { uuid?: unknown }).uuid;
    return typeof uuid === "string" ? uuid : undefined;
  } catch {
    return undefined;
  }
}

export function lastLineUuid(path: string): string | undefined {
  let fd: number | undefined;
  try {
    fd = openSync(path, "r");
    const size = fstatSync(fd).size;
    for (let tail = TAIL_READ_BYTES; ; tail *= 2) {
      const start = Math.max(0, size - tail);
      const buffer = Buffer.alloc(size - start);
      readSync(fd, buffer, 0, buffer.length, start);
      const lines = buffer
        .toString("utf8")
        .split("\n")
        .slice(start === 0 ? 0 : 1);
      const uuid = lines
        .reverse()
        .map(topLevelUuid)
        .find((id) => id !== undefined);
      if (uuid !== undefined || start === 0) return uuid;
    }
  } catch {
    return undefined;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

export function metaToolUseId(mainPath: string, sessionId: string, agentId: string) {
  const path = join(dirname(mainPath), sessionId, SUBAGENTS_FOLDER, subagentMetaFileName(agentId));
  try {
    const meta = JSON.parse(readFileSync(path, "utf8")) as { toolUseId?: unknown };
    return typeof meta.toolUseId === "string" ? meta.toolUseId : undefined;
  } catch {
    return undefined;
  }
}

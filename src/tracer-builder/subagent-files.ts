import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { jsonField } from "../utils/records.js";
import { SUBAGENT_FILE, SUBAGENTS_FOLDER } from "../constants.js";

const subagentFileName = (agentId: string) => `agent-${agentId}.jsonl`;
const subagentMetaFileName = (agentId: string) => `agent-${agentId}.meta.json`;

export function subagentTranscriptPath(mainPath: string, sessionId: string, agentId: string) {
  return join(dirname(mainPath), sessionId, SUBAGENTS_FOLDER, subagentFileName(agentId));
}

export function subagentIdOf(path: string): string | undefined {
  return SUBAGENT_FILE.exec(basename(path))?.[1];
}

export function lastLineUuid(path: string): string | undefined {
  try {
    for (const line of readFileSync(path, "utf8").split("\n").reverse()) {
      const uuid = jsonField(line, "uuid");
      if (uuid !== undefined) return uuid;
    }
  } catch {}
  return undefined;
}

export function metaToolUseId(mainPath: string, sessionId: string, agentId: string) {
  const path = join(dirname(mainPath), sessionId, SUBAGENTS_FOLDER, subagentMetaFileName(agentId));
  try {
    return jsonField(readFileSync(path, "utf8"), "toolUseId");
  } catch {
    return undefined;
  }
}

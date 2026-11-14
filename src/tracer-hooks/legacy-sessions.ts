import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { LegacySession } from "@langchain/plugins-base/tracer";
import { loadState } from "../state.js";
import { TRANSCRIPT_EXTENSION } from "../tracer-builder/tracer-builder-constants.js";
import { CLAUDE_PROJECTS_PATH } from "./tracer-hooks-constants.js";

function projectFolders(): string[] {
  const projects = join(homedir(), ...CLAUDE_PROJECTS_PATH);
  try {
    return readdirSync(projects).map((folder) => join(projects, folder));
  } catch {
    return [];
  }
}

export function readLegacySessions(stateFile: string): LegacySession[] {
  const folders = projectFolders();
  return Object.entries(loadState(stateFile)).flatMap(([sessionId, session]) => {
    const transcriptPath = folders
      .map((folder) => join(folder, `${sessionId}${TRANSCRIPT_EXTENSION}`))
      .find((path) => existsSync(path));
    if (transcriptPath === undefined) return [];
    return [
      {
        sessionId,
        transcriptPath,
        updatedAt: Date.parse(session.updated),
        tracingMode: session.current_turn_tracing,
      },
    ];
  });
}

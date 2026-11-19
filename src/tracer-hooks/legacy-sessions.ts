import { closeSync, existsSync, openSync, readdirSync, readSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { LegacySession } from "@langchain/plugins-base/tracer";
import { runEngineWorker } from "../engine-worker.js";
import { tracerWriter } from "../engine-writer.js";
import { loadState } from "../state.js";
import { legacyOpenTurn } from "../tracer-builder/tracer-builder.js";
import { loadConfig } from "../config.js";
import { hasUsableDestination } from "../utils/replicas.js";
import { jsonField } from "../utils/records.js";
import { CLAUDE_PROJECTS_PATH, TRANSCRIPT_EXTENSION, TRANSCRIPT_HEAD_BYTES } from "../constants.js";

function projectFolders(): string[] {
  const projects = join(homedir(), ...CLAUDE_PROJECTS_PATH);
  try {
    return readdirSync(projects).map((folder) => join(projects, folder));
  } catch {
    return [];
  }
}

function transcriptCwd(path: string): string | undefined {
  const head = Buffer.alloc(TRANSCRIPT_HEAD_BYTES);
  let file: number | undefined;
  let size = 0;
  try {
    file = openSync(path, "r");
    size = readSync(file, head, 0, head.length, 0);
  } catch {
    return undefined;
  } finally {
    if (file !== undefined) closeSync(file);
  }
  const lines = head.subarray(0, size).toString("utf8").split("\n");
  return lines.map((line) => jsonField(line, "cwd")).find((cwd) => cwd !== undefined);
}

function sessionWriter(cwd: string | undefined): LegacySession["writer"] {
  const config = cwd === undefined ? undefined : loadConfig({ cwd });
  return config?.enabled && hasUsableDestination(config) ? tracerWriter(config) : undefined;
}

export function readLegacySessions(stateFile: string): LegacySession[] {
  const folders = projectFolders();
  return Object.entries(loadState(stateFile)).flatMap(([sessionId, session]) => {
    const transcriptPath = folders
      .map((folder) => join(folder, `${sessionId}${TRANSCRIPT_EXTENSION}`))
      .find((path) => existsSync(path));
    if (transcriptPath === undefined) return [];
    const cwd = transcriptCwd(transcriptPath);
    return [
      {
        sessionId,
        transcriptPath,
        updatedAt: Date.parse(session.updated),
        tracingMode: session.current_turn_tracing,
        writer: sessionWriter(cwd),
        ...(cwd === undefined ? {} : { recover: () => runEngineWorker(cwd, sessionId) }),
        openTurn: legacyOpenTurn(session, transcriptPath),
      },
    ];
  });
}

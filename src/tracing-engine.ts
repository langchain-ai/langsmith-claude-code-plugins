import { buildCodingAgentMetadata } from "@langchain/plugins-base/metadata";
import type { CodingAgentMetadataOptions } from "@langchain/plugins-base/metadata";
import { settledTurnMetadata } from "@langchain/plugins-base/tracing/settlement";
import { TRACING_NOT_STARTED_MESSAGE } from "./constants.js";
import { captureInto } from "./engine-capture.js";
import { openSession } from "./engine-session.js";
import { captureToolRun as captureToolRunInto } from "./engine-tool-settlement.js";
import { readEngineTurn } from "./engine-turn-record.js";
import type {
  ClaudeRun,
  ClaudeTracingSession,
  Config,
  RunOperation,
  ToolOrigin,
  TracingMode,
} from "./types.js";

export { runEngineWorker } from "./engine-worker.js";

let active: ClaudeTracingSession | undefined;

function started(): ClaudeTracingSession {
  if (!active) throw new Error(TRACING_NOT_STARTED_MESSAGE);
  return active;
}

export function initTracing(
  config: Config,
  cwd: string,
  sessionId: string,
  startupWaitMs?: number,
): void {
  active = openSession(config, cwd, sessionId, startupWaitMs);
}

export async function captureRun(
  run: ClaudeRun,
  mode: TracingMode = "full",
  rootRunId: string = run.id,
  operation: RunOperation = "post",
): Promise<void> {
  await captureInto(started(), run, mode, rootRunId, operation);
}

export async function captureToolRun(
  run: ClaudeRun,
  mode: TracingMode,
  rootRunId: string,
  origin: ToolOrigin,
): Promise<void> {
  await captureToolRunInto(started(), run, mode, rootRunId, origin);
}

export async function settledFromTurn(
  base: Record<string, unknown> | undefined,
  turnRunId: string | undefined,
): Promise<Record<string, unknown> | undefined> {
  const turn = active && turnRunId ? await readEngineTurn(active, turnRunId) : undefined;
  return turn?.landed ? (settledTurnMetadata(base, turn.record) ?? base) : base;
}

export async function turnFiller(
  turnRunId: string | undefined,
): Promise<(metadata: CodingAgentMetadataOptions) => CodingAgentMetadataOptions> {
  const turn = active && turnRunId ? await readEngineTurn(active, turnRunId) : undefined;
  return (metadata) => {
    const built = buildCodingAgentMetadata(metadata);
    const filled = turn ? settledTurnMetadata(built, turn.record) : undefined;
    const added = Object.entries(filled ?? {}).filter(([key]) => built[key] === undefined);
    return added.length === 0
      ? metadata
      : { ...metadata, base: { ...metadata.base, ...Object.fromEntries(added) } };
  };
}

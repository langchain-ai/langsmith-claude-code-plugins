import { createHmac } from "node:crypto";
import { basename, dirname, join } from "node:path";
import {
  type CodingAgentMetadataOptions,
  type CodingAgentRunType,
  withBothGitMetadataNames,
} from "@langchain/plugins-base/metadata";
import { metadataAfterFill, turnAttribution } from "@langchain/plugins-base/tracing/settlement";
import type { RecordedRun, TurnRecord } from "@langchain/plugins-base/tracing/settlement";
import {
  LEGACY_QUEUE_FILE,
  LEGACY_TURN_FILE,
  LS_INTEGRATION,
  QUEUE_DIR_NAME,
  QUEUE_ORIGIN_LENGTH,
  TURN_RECORD_DIR_NAME,
  TURN_RECORD_LINE,
} from "./constants.js";
import { settledRepositoryMetadata } from "./repo-attribution.js";
import { entryInfo, listDirectory, readJson, readText } from "./utils/files.js";
import type {
  LegacyFile,
  LegacyQueueEntry,
  LegacyRunMetadata,
  LegacyScan,
  LegacyTurnLine,
  Config,
} from "./types.js";

export function legacyRuns(config: Config): LegacyScan {
  const origin = legacyOrigin(config);
  const root = dirname(config.stateFilePath);
  const scan: LegacyScan = { runs: [], settled: [], unreadable: [] };
  const { runs } = scan;
  for (const [sessionId, file] of legacyFiles(join(root, QUEUE_DIR_NAME), LEGACY_QUEUE_FILE)) {
    const entry = readJson(readText(file)) as LegacyQueueEntry | undefined;
    if (!entry?.run) scan.unreadable.push(file);
    if (!entry?.run || entry.origin !== origin) continue;
    const { extra, ...run } = entry.run;
    const metadata = withBothGitMetadataNames(extra?.metadata ?? {});
    const base =
      entry.where && entry.tracing === "full"
        ? settledRepositoryMetadata(metadata, entry.where)
        : metadata;
    runs.push({
      sessionId,
      file,
      mode: entry.tracing,
      operation: "post",
      run: { ...run, metadata: legacyOptions(base ?? {}, sessionId, "tool") },
    });
  }
  for (const [sessionId, file] of legacyFiles(join(root, TURN_RECORD_DIR_NAME), LEGACY_TURN_FILE)) {
    const record = readTurnRecord(file);
    if (!record.root || !record.closed || record.origin !== origin) continue;
    const filled = turnAttribution(record) ?? {};
    const open = record.children.filter((run) => run.open && record.delivered.has(run.run_id));
    const before = runs.length;
    for (const run of [record.root, ...open]) {
      if (record.fixed.has(run.run_id) || !run.start_time) continue;
      runs.push({
        sessionId,
        file,
        mode: run.tracing,
        operation: "patch",
        run: {
          id: run.run_id,
          name: run.name,
          run_type: run.run_type,
          start_time: run.start_time,
          end_time: run.end_time ?? new Date().toISOString(),
          parent_run_id: run.parent_run_id,
          trace_id: run.trace_id,
          dotted_order: run.dotted_order,
          metadata: legacyOptions(
            metadataAfterFill(run, filled) ?? run.metadata,
            sessionId,
            run === record.root ? "root" : run.run_type === "llm" ? "llm" : "tool",
          ),
        },
      });
    }
    if (runs.length === before) scan.settled.push(file);
  }
  return scan;
}

function legacyOrigin(config: Config): string {
  const identity = JSON.stringify([
    config.apiBaseUrl,
    config.replicas ?? null,
    config.redact ?? false,
    config.redactExtraRules ?? null,
  ]);
  return createHmac("sha256", config.apiKey)
    .update(identity)
    .digest("hex")
    .slice(0, QUEUE_ORIGIN_LENGTH);
}

function legacyOptions(
  metadata: Record<string, unknown>,
  sessionId: string,
  runType: CodingAgentRunType,
): CodingAgentMetadataOptions {
  const legacy: LegacyRunMetadata = metadata;
  return {
    integration: LS_INTEGRATION,
    threadId: legacy.thread_id ?? sessionId,
    agentType: legacy.ls_agent_type ?? "root",
    runType,
    base: metadata,
    turnId: legacy.turn_id,
    turnNumber: legacy.turn_number,
    runtimeVersion: legacy.ls_agent_runtime_version,
    integrationVersion: legacy.ls_integration_version,
    subagentId: legacy.ls_subagent_id,
    subagentType: legacy.ls_subagent_type,
    skillName: legacy.ls_skill_name,
    modelName: legacy.ls_model_name,
    usageMetadata: legacy.usage_metadata,
  };
}

function legacyFiles(root: string, pattern: RegExp): LegacyFile[] {
  if (!entryInfo(root)?.isDirectory()) return [];
  return listDirectory(root)
    .filter((sessionId) => entryInfo(join(root, sessionId))?.isDirectory())
    .flatMap((sessionId) =>
      listDirectory(join(root, sessionId))
        .map((name): LegacyFile => [sessionId, join(root, sessionId, name)])
        .filter(([, file]) => pattern.test(basename(file)) && entryInfo(file)?.isFile()),
    );
}

function readTurnRecord(path: string): TurnRecord {
  const record: TurnRecord = {
    path,
    origin: "",
    children: [],
    closed: false,
    delivered: new Set(),
    fixed: new Set(),
  };
  const children = new Map<string, RecordedRun>();
  for (const line of readText(path).split("\n")) {
    const parsed = readJson(line) as LegacyTurnLine | undefined;
    if (parsed?.k === TURN_RECORD_LINE.run && typeof parsed.run?.run_id === "string") {
      if (parsed.root) record.root = parsed.run;
      else children.set(parsed.run.run_id, parsed.run);
      if (parsed.origin) record.origin = parsed.origin;
    } else if (parsed?.k === TURN_RECORD_LINE.closed) {
      record.closed = true;
    } else if (parsed?.k === TURN_RECORD_LINE.delivered) {
      record.delivered.add(parsed.id);
    } else if (parsed?.k === TURN_RECORD_LINE.reconciled) {
      record.fixed.add(parsed.id);
    }
  }
  record.children = [...children.values()];
  return record;
}

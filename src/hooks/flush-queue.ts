/**
 * Detached queue flusher.
 *
 * Started by a hook and outliving it, this uploads every queued run in order,
 * removes each entry only once LangSmith has confirmed it, and then settles the
 * repository and author on the turns those runs belong to.
 */

import { Client } from "langsmith";
import { createSecretAnonymizer } from "langsmith/anonymizer";
import { join } from "node:path";
import { initHook } from "../utils/hook-init.js";
import { debug, warn } from "../logger.js";
import { FOREIGN_QUEUE_MIN_RECORD_AGE_MS } from "../constants.js";
import {
  discardEmptyQueue,
  listQueues,
  readQueue,
  foreignQueueLooksAbandoned,
  queueDir,
  queueOrigin,
} from "../queue.js";
import {
  listRecordedSessions,
  listTurnRecords,
  readTurnRecord,
  recordsIdleMs,
  turnRecordRoot,
} from "../turn-record.js";
import { reconcileAndClear } from "../reconcile.js";
import { discardDirIfEmpty, safeName } from "../utils/session-store.js";
import { watchUploads, type UploadWatch } from "../upload-confirm.js";
import { releaseLock, tryAcquireLock } from "../utils/file-lock.js";
import {
  acknowledgeClaudeSharedDeliveries,
  createClaudeTracingSession,
} from "../tracing-engine.js";
import { importLegacyQueueEntries, listLegacySessionRoutes } from "../legacy-import.js";
import type { Config } from "../config.js";
import type { ClaudeTracingEngineContext } from "../models/tracing-engine.js";

function flusherClient(config: Config): Client {
  const anonymizer = config.redact
    ? createSecretAnonymizer(
        config.redactExtraRules ? { extraRules: config.redactExtraRules } : undefined,
      )
    : undefined;
  return new Client({
    apiKey: config.apiKey || undefined,
    apiUrl: config.apiBaseUrl,
    anonymizer,
    autoBatchTracing: false,
  });
}

async function settleTurns(
  recordDir: string,
  config: Config,
  origin: string,
  client: Client,
  watch: UploadWatch,
): Promise<void> {
  for (const path of listTurnRecords(recordDir)) {
    const record = readTurnRecord(path);
    if (!record) continue;
    if (record.origin !== origin) {
      debug(`Leaving ${path} alone: it was traced for a different LangSmith account`);
      continue;
    }
    try {
      await reconcileAndClear({ record, client, replicas: config.replicas, watch });
    } catch (err) {
      warn(`Could not settle the repository on ${path}: ${err}`);
    }
  }
  discardDirIfEmpty(recordDir);
}

async function drainSession(
  session: string,
  config: Config,
  cwd: string,
  origin: string,
  activeSessionId?: string,
  activeProjectName?: string,
): Promise<void> {
  const dir = join(queueDir(config.stateFilePath), session);
  const flushTarget = `${dir}.flush`;
  if (!tryAcquireLock(flushTarget)) {
    debug(`Another flusher already owns ${dir}`);
    return;
  }
  const queueBefore = new Set(readQueue(dir).map((entry) => entry.queue_id));
  const client = flusherClient(config);
  const watch = watchUploads(client);
  const records = join(turnRecordRoot(config.stateFilePath), session);
  try {
    const contexts = new Map<string, ClaudeTracingEngineContext>();
    const getContext = (
      projectConfig: Config,
      routeCwd: string,
      sessionId: string,
      projectName: string,
    ) => {
      const key = `${sessionId}\0${projectName}\0${routeCwd}`;
      const existing = contexts.get(key);
      if (existing) return existing;
      const created = createClaudeTracingSession(projectConfig, routeCwd, sessionId, projectName);
      if (created) contexts.set(key, created);
      return created;
    };
    await importLegacyQueueEntries({
      config,
      dir,
      origin,
      createContext: getContext,
    });
    if (activeSessionId && activeProjectName) {
      getContext(
        { ...config, project: activeProjectName },
        cwd,
        activeSessionId,
        activeProjectName,
      );
    }
    for (const route of listLegacySessionRoutes(config.stateFilePath, origin, session)) {
      getContext(
        { ...config, project: route.projectName },
        route.cwd,
        route.sessionId,
        route.projectName,
      );
    }
    for (const context of contexts.values()) {
      const result = await context.session.drain();
      if (result === "scope-mismatch") {
        debug(`Leaving shared captures for ${context.sessionId} alone after an account change`);
      } else {
        await acknowledgeClaudeSharedDeliveries(context, config, context.sessionId);
      }
    }
    discardEmptyQueue(dir);
    await settleTurns(records, config, origin, client, watch);
  } finally {
    releaseLock(flushTarget);
  }
  const queueAfter = readQueue(dir);
  if (
    !queueAfter.some((entry) => queueBefore.has(entry.queue_id)) &&
    queueAfter.some((entry) => !queueBefore.has(entry.queue_id)) &&
    queueAfter[0]?.origin === origin
  ) {
    await drainSession(session, config, cwd, origin, activeSessionId, activeProjectName);
  }
}

function looksAbandoned(session: string, stateFilePath: string): boolean {
  const queued = join(queueDir(stateFilePath), session);
  if (foreignQueueLooksAbandoned(queued)) return true;
  return (
    recordsIdleMs(join(turnRecordRoot(stateFilePath), session)) >= FOREIGN_QUEUE_MIN_RECORD_AGE_MS
  );
}

export async function main(cwd: string, sessionId?: string, projectName?: string): Promise<void> {
  const config = initHook(cwd);
  if (!config) return;
  if (sessionId) {
    const context = createClaudeTracingSession(config, cwd, sessionId, projectName);
    if (context) {
      try {
        await context.session.drain();
      } catch (err) {
        warn(`Could not drain shared captures for ${sessionId}: ${err}`);
      }
    }
  }
  const own = sessionId ? safeName(sessionId) : undefined;
  const origin = queueOrigin(config);
  const sessions = new Set([
    ...listQueues(config.stateFilePath),
    ...listRecordedSessions(config.stateFilePath),
  ]);
  if (own) sessions.add(own);
  for (const session of [...sessions].sort()) {
    if (session !== own && !looksAbandoned(session, config.stateFilePath)) {
      debug(`Not flushing ${session}, which another session may still be writing to`);
      discardEmptyQueue(join(queueDir(config.stateFilePath), session));
      continue;
    }
    try {
      await drainSession(
        session,
        config,
        cwd,
        origin,
        session === own ? sessionId : undefined,
        session === own ? (projectName ?? config.project) : undefined,
      );
    } catch (err) {
      warn(`Could not flush ${session}: ${err}`);
    }
  }
}

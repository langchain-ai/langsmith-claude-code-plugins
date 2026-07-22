/**
 * Per-session LangSmith thread link, persisted by the UserPromptSubmit hook
 * so the /langsmith-tracing:trace command can print a shareable deep link.
 */

import { readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import type { Client } from "langsmith";

/** Persisted per-project record read by the trace command. */
export interface ThreadLinkRecord {
  /** Claude Code session_id (== LangSmith thread_id). */
  session_id: string;
  /** Tracing project name at record time. */
  project: string;
  /** Resolved thread-view URL; absent if the project lookup hasn't succeeded. */
  url?: string;
  updated: string;
}

/** Extract the leading `scheme://firsthost` label, matching the SDK's parsing. */
function firstLabel(url: string): string {
  return url.split(".", 1)[0];
}

/** True if the API URL points at a local dev instance. */
function isLocalhost(url: string): boolean {
  const stripped = url.replace("http://", "").replace("https://", "");
  const host = stripped.split("/")[0].split(":")[0];
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

/**
 * Derive the LangSmith UI host from the API endpoint, mirroring the SDK's
 * `Client.getHostUrl`. Handles cloud regions and self-hosted endpoints.
 */
export function deriveWebHost(apiBaseUrl: string): string {
  const url = apiBaseUrl.replace(/\/$/, "");
  if (isLocalhost(url)) return "http://localhost:3000";
  if (url.endsWith("/api/v1")) return url.replace("/api/v1", "");
  // Self-hosted "/api" suffix, unless the first host label itself ends in "api".
  if (url.includes("/api") && !firstLabel(url).endsWith("api")) return url.replace("/api", "");
  const label = firstLabel(url);
  if (label.includes("dev")) return "https://dev.smith.langchain.com";
  if (label.includes("eu")) return "https://eu.smith.langchain.com";
  if (label.includes("aws")) return "https://aws.smith.langchain.com";
  if (label.includes("apac")) return "https://apac.smith.langchain.com";
  if (label.includes("beta")) return "https://beta.smith.langchain.com";
  return "https://smith.langchain.com";
}

/** Build the canonical LangSmith thread-view deep link. */
export function buildThreadUrl(opts: {
  webHost: string;
  tenantId: string;
  projectId: string;
  threadId: string;
}): string {
  return `${opts.webHost}/o/${opts.tenantId}/projects/p/${opts.projectId}/t/${opts.threadId}`;
}

function homeDir(): string {
  return process.env.HOME ?? process.env.USERPROFILE ?? "";
}

/**
 * Per-project state-file path. Slug matches Claude Code's `~/.claude/projects`
 * naming (every non-alphanumeric char → "-"), so hook and command agree.
 */
export function threadFilePath(cwd: string, home: string = homeDir()): string {
  const slug = cwd.replace(/[^a-zA-Z0-9]/g, "-");
  return `${home}/.claude/state/langsmith-thread-${slug}.json`;
}

export function readThreadLink(
  cwd: string,
  home: string = homeDir(),
): ThreadLinkRecord | undefined {
  try {
    return JSON.parse(readFileSync(threadFilePath(cwd, home), "utf-8")) as ThreadLinkRecord;
  } catch {
    // Missing/unreadable — no thread recorded yet.
    return undefined;
  }
}

export function writeThreadLink(
  cwd: string,
  record: ThreadLinkRecord,
  home: string = homeDir(),
): void {
  const path = threadFilePath(cwd, home);
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true });
  // Atomic write (two sessions can share this per-cwd path)
  const tmpPath = `${path}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    writeFileSync(tmpPath, JSON.stringify(record, null, 2), { mode: 0o600, flag: "wx" });
    renameSync(tmpPath, path);
  } catch (err) {
    try {
      unlinkSync(tmpPath);
    } catch {
      // Ignore cleanup failures.
    }
    throw err;
  }
}

/** Resolve the thread URL, looking up project id + tenant id via the SDK. */
export async function resolveThreadUrl(
  client: Client,
  projectName: string,
  apiBaseUrl: string,
  sessionId: string,
): Promise<string> {
  const project = await client.readProject({ projectName });
  return buildThreadUrl({
    webHost: deriveWebHost(apiBaseUrl),
    tenantId: project.tenant_id,
    projectId: project.id,
    threadId: sessionId,
  });
}

/** Reject if `p` doesn't settle within `ms` — bounds the hook's best-effort work. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("thread-link timeout")), ms)),
  ]);
}

/**
 * Best-effort, once-per-session record of this session's thread link. URL
 * resolution is timeout-guarded; on failure session_id is still persisted.
 */
export async function maybeRecordThreadLink(opts: {
  cwd: string;
  sessionId: string;
  project: string;
  apiBaseUrl: string;
  client?: Client;
  timeoutMs?: number;
}): Promise<void> {
  const existing = readThreadLink(opts.cwd);
  if (existing?.session_id === opts.sessionId && existing.url) return;

  const record: ThreadLinkRecord = {
    session_id: opts.sessionId,
    project: opts.project,
    updated: new Date().toISOString(),
  };
  if (opts.client) {
    try {
      record.url = await withTimeout(
        resolveThreadUrl(opts.client, opts.project, opts.apiBaseUrl, opts.sessionId),
        opts.timeoutMs ?? 4000,
      );
    } catch {
      // Slow/offline lookup — persist session_id only; command retries on demand.
    }
  }
  writeThreadLink(opts.cwd, record);
}

/**
 * Setup for the reconcile tests: runs shaped the way a turn record holds them.
 */

import type { RecordedRun, TurnRecord } from "../types.js";

export const inAlpha = {
  repository_name: "acme/a",
  repository_provider: "github",
  repository_url: "https://github.com/acme/a",
  git_branch: "trunk-a",
  git_commit_sha: "aaaa",
  ls_attribution_identifier: "Alpha Owner",
};

export const inBeta = {
  repository_name: "acme/b",
  repository_provider: "gitlab",
  repository_url: "https://gitlab.com/acme/b",
  git_branch: "trunk-b",
  git_commit_sha: "bbbb",
  ls_attribution_identifier: "Beta Owner",
};

/** A run as the record holds it, with its place in the turn given by `order`. */
export function recorded(name: string, metadata: Record<string, unknown>, order = 1): RecordedRun {
  return {
    run_id: name,
    parent_run_id: "root",
    trace_id: "trace",
    dotted_order: `trace.2025010100000${order}000000Z${name}`,
    name,
    run_type: "tool",
    project_name: "p",
    // Recent, since the settle gives up on a turn the service would no longer accept.
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    tracing: "full",
    metadata,
  };
}

export function record(
  root: Record<string, unknown>,
  children: RecordedRun[],
  overrides: Partial<TurnRecord> = {},
): TurnRecord {
  return {
    path: "/tmp/turn.jsonl",
    origin: "account",
    root: {
      ...recorded("root", root),
      run_id: "root",
      parent_run_id: undefined,
      run_type: "chain",
    },
    children,
    toolOrigins: [],
    closed: true,
    delivered: new Set(children.map((child) => child.run_id)),
    fixed: new Set(),
    ...overrides,
  };
}

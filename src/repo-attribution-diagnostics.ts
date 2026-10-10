import { appendFileSync } from "node:fs";

export function recordRepoAttributionDiagnostic(
  event: string,
  details: Record<string, unknown>,
): void {
  const path = process.env.CC_LANGSMITH_TEST_RECONCILE_DIAGNOSTICS_FILE;
  if (!path) return;
  appendFileSync(path, `${JSON.stringify({ event, ...details })}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
}

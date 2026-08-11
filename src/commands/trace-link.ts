#!/usr/bin/env node
/**
 * Backend for the /langsmith-tracing:trace command. Prints the LangSmith thread
 * link from the file the UserPromptSubmit hook wrote; never throws.
 */

import { Client } from "langsmith";
import { loadConfig } from "../config.js";
import { readThreadLink, writeThreadLink, resolveThreadUrl } from "../thread-link.js";

function printLink(url: string): void {
  console.log(`🔗 Open this thread in LangSmith: ${url}`);
}

async function main(): Promise<void> {
  const cwd = process.cwd();

  if (process.env.TRACE_TO_LANGSMITH?.toLowerCase() !== "true") {
    console.log(
      "LangSmith tracing is disabled. Set TRACE_TO_LANGSMITH=true (plus a LangSmith API key) to trace this session.",
    );
    return;
  }

  const config = loadConfig({ cwd });
  if (!config.apiKey) {
    console.log(
      "No LangSmith API key found. Set CC_LANGSMITH_API_KEY or LANGSMITH_API_KEY to enable trace links.",
    );
    return;
  }

  const record = readThreadLink(cwd);
  if (!record) {
    console.log(
      "No LangSmith thread recorded for this project yet. Send a prompt to start tracing, then run /langsmith-tracing:trace again.",
    );
    return;
  }

  if (record.url) {
    printLink(record.url);
    return;
  }

  // Hook recorded the session but couldn't resolve the URL (offline/slow).
  // Retry the project lookup now, then cache it.
  try {
    const client = new Client({ apiKey: config.apiKey, apiUrl: config.apiBaseUrl });
    const url = await resolveThreadUrl(
      client,
      config.project,
      config.apiBaseUrl,
      record.session_id,
    );
    writeThreadLink(cwd, { ...record, url, updated: new Date().toISOString() });
    printLink(url);
  } catch {
    console.log(
      `Couldn't resolve the LangSmith project URL for "${config.project}". Thread id (session): ${record.session_id}`,
    );
  }
}

main().catch((err) => {
  console.log(`Could not build a LangSmith link: ${err}`);
  process.exit(0);
});

/**
 * Single entry point for every tracing hook.
 *
 * Claude Code invokes this once per lifecycle event with the event name as its
 * only argument. Routing all nine through one bundle keeps the LangSmith SDK in
 * the artifact once instead of nine times.
 */

import { dispatchHookCommand } from "@langchain/plugins-base/plugin";
import { binary } from "../binary-target.js";
import { ENGINE_WORKER_ARG, USAGE_TEMPLATE } from "../constants.js";
import { LS_INTEGRATION_VERSION } from "../integration-version.js";
import { error, initLogger } from "../logger.js";
import { runEngineWorker } from "../engine-worker.js";
import { HOOK_HANDLERS } from "./registry.js";

const EXECUTABLE_NAME = binary.target.executableName;

const USAGE = USAGE_TEMPLATE.replaceAll("{name}", EXECUTABLE_NAME);

void dispatchHookCommand(process.argv.slice(2), {
  usage: USAGE,
  version: LS_INTEGRATION_VERSION ?? "development",
  hooks: HOOK_HANDLERS,
  worker: {
    command: ENGINE_WORKER_ARG,
    run: ([cwd, sessionId]) => runEngineWorker(cwd ?? process.cwd(), sessionId),
  },
  onHookError: (name, err) => {
    try {
      initLogger(false);
      error(`${name} hook fatal error: ${err}`);
    } finally {
      process.exit(0);
    }
  },
  onUnknown: (argument) => {
    if (argument?.startsWith("-")) {
      console.error(`unknown option: ${argument}`);
      console.error(USAGE);
      process.exitCode = 1;
      return;
    }
    // Only a bad hooks.json reaches this, so log it rather than failing the hook.
    // No handler ran, so nothing has created the log directory yet.
    initLogger(false);
    error(`Unknown hook event: ${argument ?? "(none)"}`);
  },
});

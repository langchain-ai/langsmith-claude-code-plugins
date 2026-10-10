/**
 * Single entry point for every tracing hook.
 *
 * Claude Code invokes this once per lifecycle event with the event name as its
 * only argument. Routing all nine through one bundle keeps the LangSmith SDK in
 * the artifact once instead of nine times.
 */

import { binary } from "../binary-target.js";
import { LS_INTEGRATION_VERSION } from "../config.js";
import { FLUSH_QUEUE_ARG, HOOK_EVENT_NAMES } from "../constants.js";
import { error, initLogger } from "../logger.js";
import { runHookEntry } from "../utils/hook-entry.js";
import { main as flushQueue } from "./flush-queue.js";
import { HOOK_HANDLERS } from "./registry.js";

const EXECUTABLE_NAME = binary.target.executableName;

const USAGE = `Usage:
  ${EXECUTABLE_NAME} <HookEventName>
  ${EXECUTABLE_NAME} --version

Options:
  --help, -h     Show this help and exit
  --version, -v  Print the installed version and exit`;

const argument = process.argv[2];
const event = HOOK_EVENT_NAMES.find((name) => name === argument);

if (argument === "--help" || argument === "-h") {
  console.log(USAGE);
} else if (argument === "--version" || argument === "-v") {
  console.log(LS_INTEGRATION_VERSION ?? "development");
} else if (argument === FLUSH_QUEUE_ARG) {
  const [cwd, sessionId, projectName] = process.argv.slice(3);
  void runHookEntry(FLUSH_QUEUE_ARG, () =>
    flushQueue(cwd ?? process.cwd(), sessionId, projectName),
  );
} else if (event) {
  void runHookEntry(event, HOOK_HANDLERS[event]);
} else if (argument?.startsWith("-")) {
  console.error(`unknown option: ${argument}`);
  console.error(USAGE);
  process.exitCode = 1;
} else {
  // Only a bad hooks.json reaches this, so log it rather than failing the hook.
  // No handler ran, so nothing has created the log directory yet.
  initLogger(false);
  error(`Unknown hook event: ${argument ?? "(none)"}`);
}

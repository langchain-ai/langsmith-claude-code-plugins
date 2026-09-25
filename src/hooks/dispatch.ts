/**
 * Single entry point for every tracing hook.
 *
 * Claude Code invokes this once per lifecycle event with the event name as its
 * only argument. Routing all nine through one bundle keeps the LangSmith SDK in
 * the artifact once instead of nine times.
 */

import { binary } from "../binary-target.js";
import { LS_INTEGRATION_VERSION } from "../config.js";
import { HOOK_EVENT_NAMES } from "../constants.js";
import { runInstall } from "../installer.js";
import { error, initLogger } from "../logger.js";
import { runUpdateCheck } from "../updater.js";
import { runHookEntry } from "../utils/hook-entry.js";
import { drainStdinToAvoidEpipe } from "../utils/stdin.js";
import { warnAboutHandInstalledBinary } from "./hand-installed-binary.js";
import { HOOK_HANDLERS } from "./registry.js";
import { pluginShouldStandDown } from "./stand-down.js";

const EXECUTABLE_NAME = binary.target.executableName;

const USAGE = `Usage:
  ${EXECUTABLE_NAME} <HookEventName>
  ${EXECUTABLE_NAME} --install [--print] [--project] [--tag VERSION]
  ${EXECUTABLE_NAME} --update
  ${EXECUTABLE_NAME} --version

Options:
  --help, -h     Show this help and exit
  --version, -v  Print the installed version and exit
  --install      Install this binary and add the hooks to settings.json
  --print        With --install, print the merged settings and change nothing
  --project      Use .claude/settings.json in the current directory
  --tag VERSION  Install a published release instead of this binary
  --update       Replace the installed binary with the newest release`;

const argument = process.argv[2];
const event = HOOK_EVENT_NAMES.find((name) => name === argument);

if (argument === "--help" || argument === "-h") {
  console.log(USAGE);
} else if (argument === "--version" || argument === "-v") {
  console.log(LS_INTEGRATION_VERSION ?? "development");
} else if (argument === "--install") {
  void runInstall(process.argv.slice(3));
} else if (argument === "--update") {
  initLogger(false);
  void runUpdateCheck();
} else if (event) {
  warnAboutHandInstalledBinary(event);
  if (pluginShouldStandDown()) void drainStdinToAvoidEpipe();
  else void runHookEntry(event, HOOK_HANDLERS[event]);
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

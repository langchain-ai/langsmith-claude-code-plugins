/**
 * Single entry point for every tracing hook.
 *
 * Claude Code invokes this once per lifecycle event with the event name as its
 * only argument. Routing all nine through one bundle keeps the LangSmith SDK in
 * the artifact once instead of nine times.
 */

import { HOOK_EVENT_NAMES } from "../constants.js";
import { error } from "../logger.js";
import { runHookEntry } from "../utils/hook-entry.js";
import { HOOK_EVENTS } from "./registry.js";

const argument = process.argv[2];
const event = HOOK_EVENT_NAMES.find((name) => name === argument);

if (event) {
  runHookEntry(event, HOOK_EVENTS[event]);
} else {
  // Only a bad hooks.json reaches this, so log it rather than failing the hook.
  error(`Unknown hook event: ${argument ?? "(none)"}`);
}

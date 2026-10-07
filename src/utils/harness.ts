/**
 * Whether a hook payload belongs to the Claude Code event that is running.
 *
 * Cursor imports Claude Code's settings and plugins, then invokes the imported
 * hooks with its own native payload. Two independent signals separate the two:
 * Cursor stamps a version field Claude Code never sends, and Cursor names its
 * events in its own vocabulary, so a payload is traced only when it names the
 * very event the dispatcher was asked to run.
 */

import { CURSOR_VERSION_FIELD } from "../constants.js";
import type { HookEventName } from "../constants.js";

export function isCursorPayload(input: unknown): boolean {
  return typeof input === "object" && input !== null && Object.hasOwn(input, CURSOR_VERSION_FIELD);
}

export function isPayloadForHook<E extends HookEventName>(
  input: { hook_event_name: E },
  event: NoInfer<E>,
): boolean {
  if (isCursorPayload(input)) return false;
  const declared: unknown = input.hook_event_name;
  // Only a named event can disagree, and this repository's own callers name none.
  return declared === undefined || declared === event;
}

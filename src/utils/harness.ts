/** Cursor imports Claude Code's hooks and runs them with its own payloads, which must never be traced as Claude Code. */

import { CURSOR_VERSION_FIELD } from "../constants.js";
import type { HookEventName } from "../constants.js";
import type { HookEventPayload } from "../types.js";

export function isCursorPayload(input: unknown): boolean {
  return typeof input === "object" && input !== null && Object.hasOwn(input, CURSOR_VERSION_FIELD);
}

export function isPayloadForHook(input: HookEventPayload, event: HookEventName): boolean {
  if (isCursorPayload(input)) return false;
  const declared = input.hook_event_name;
  // Standing down on an absent name would silently stop tracing, so only a disagreeing name counts.
  return declared === undefined || declared === event;
}

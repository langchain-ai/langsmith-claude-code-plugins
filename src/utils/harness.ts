/**
 * Which coding agent started this hook.
 *
 * Cursor imports Claude Code's settings and plugins, then invokes the imported
 * hooks with its own native payload. Every Cursor payload carries a version
 * field that Claude Code never sends, so its presence is the signal to stand
 * down and leave the session untraced.
 */

import { CURSOR_VERSION_FIELD } from "../constants.js";

/** True when the payload came from a harness other than Claude Code. */
export function isForeignHarnessPayload(input: unknown): boolean {
  return typeof input === "object" && input !== null && Object.hasOwn(input, CURSOR_VERSION_FIELD);
}

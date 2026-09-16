import type { HookEventName } from "../constants.js";
import { error } from "../logger.js";

/** A hook must never affect Claude Code, so a rejected handler is logged and still exits 0. */
export function runHookEntry(event: HookEventName, main: () => Promise<void>): void {
  main().catch((err) => {
    try {
      error(`${event} hook fatal error: ${err}`);
    } catch {
      // Last resort
    }
    process.exit(0);
  });
}

import type { HookEventName } from "../constants.js";
import { main as postCompact } from "./post-compact.js";
import { main as postToolUse } from "./post-tool-use.js";
import { main as preCompact } from "./pre-compact.js";
import { main as preToolUse } from "./pre-tool-use.js";
import { main as sessionEnd } from "./session-end.js";
import { main as stop } from "./stop.js";
import { main as stopFailure } from "./stop-failure.js";
import { main as subagentStop } from "./subagent-stop.js";
import { main as userPromptSubmit } from "./user-prompt-submit.js";

/** A complete `Record`, so a new `HOOK_EVENT_NAMES` entry without a handler fails to compile. */
export const HOOK_HANDLERS: Record<HookEventName, () => Promise<void>> = {
  UserPromptSubmit: userPromptSubmit,
  PreToolUse: preToolUse,
  PostToolUse: postToolUse,
  Stop: stop,
  StopFailure: stopFailure,
  SubagentStop: subagentStop,
  PreCompact: preCompact,
  PostCompact: postCompact,
  SessionEnd: sessionEnd,
};

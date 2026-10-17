import { closeStoppedTurn } from "./hooks/stop.js";
import { closeFailedTurn } from "./hooks/stop-failure.js";
import { closeEndedSession } from "./hooks/session-end.js";
import { closeInterruptedPrompt } from "./hooks/user-prompt-submit.js";
import { traceStoppedSubagent } from "./hooks/subagent-stop.js";
import { traceCompaction } from "./hooks/post-compact.js";
import type { ClosingHandler, ClosingKind } from "./types.js";

const CLOSING_HANDLERS: Record<ClosingKind, ClosingHandler> = {
  stop: closeStoppedTurn,
  "stop-failure": closeFailedTurn,
  "session-end": closeEndedSession,
  interrupted: closeInterruptedPrompt,
  "subagent-stop": traceStoppedSubagent,
  "post-compact": traceCompaction,
};

export { CLOSING_HANDLERS };

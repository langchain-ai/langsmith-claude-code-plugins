import { randomUUID } from "node:crypto";
import { statSync } from "node:fs";
import { CLOSING_EVENT_PREFIX, CLOSING_PRIVACY_MODE } from "./constants.js";
import { atomicUpdateState, getSessionState } from "./state.js";
import { initTracing, queueJob } from "./tracing-engine.js";
import type {
  ClosingInput,
  ClosingKind,
  ClosingOptions,
  Config,
  QueuedClosing,
  SessionState,
} from "./types.js";
import { expandHome } from "./utils/hook-init.js";

export async function queueClosing(
  config: Config,
  kind: ClosingKind,
  input: ClosingInput,
  options: ClosingOptions = {},
): Promise<void> {
  const id = randomUUID();
  const at = Date.now();
  const cut = options.transcriptCut ? transcriptSize(input.transcript_path) : undefined;
  let queued = false;
  await atomicUpdateState(config.stateFilePath, (state) => {
    const session = getSessionState(state, input.session_id);
    if (options.skip?.(session)) return state;
    queued = true;
    const { queued_closings: earlier, ...snapshot } = session;
    const closing: QueuedClosing = {
      kind,
      at,
      ...(cut === undefined ? {} : { cut_bytes: cut }),
      input,
      session: snapshot,
    };
    return {
      ...state,
      [input.session_id]: {
        ...session,
        ...options.reset?.(session),
        updated: new Date(at).toISOString(),
        queued_closings: { ...earlier, [id]: closing },
      },
    };
  });
  if (!queued) return;
  initTracing(config, input.cwd, input.session_id);
  await queueJob({
    turnId: id,
    eventId: `${CLOSING_EVENT_PREFIX}${id}`,
    sourceRefs: [id],
    privacyMode: CLOSING_PRIVACY_MODE,
    turnEvidence: { childRunIds: [], closureState: "open" },
  });
}

function transcriptSize(path: string | undefined): number | undefined {
  const expanded = expandHome(path);
  if (!expanded) return undefined;
  try {
    return statSync(expanded).size;
  } catch {
    return undefined;
  }
}

export function turnClosedReset(session: SessionState): Partial<SessionState> {
  return {
    current_turn_run_id: undefined,
    current_turn_tracing: undefined,
    current_notification_agent_id: undefined,
    current_notification_interrupted: undefined,
    traced_tool_use_ids: [],
    tool_start_times: {},
    turn_count: Math.max(session.turn_count, session.current_turn_number ?? 0),
  };
}

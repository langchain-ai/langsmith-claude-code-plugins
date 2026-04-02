#!/usr/bin/env node
/**
 * SubagentStart hook entry point.
 *
 * Fires when a subagent is spawned via the Agent tool. Records the subagent's
 * transcript path and type in state so they can be traced even if the subagent
 * is interrupted and SubagentStop never fires.
 */

import { debug, error } from "../logger.js";
import { atomicUpdateState, getSessionState } from "../state.js";
import { initHook, expandHome } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";

interface SubagentStartHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: "SubagentStart";
  agent_id: string;
  agent_type: string;
}

async function main(): Promise<void> {
  const input: SubagentStartHookInput = await readStdin();

  const config = initHook();
  if (!config) return;

  debug(`SubagentStart hook: agent_id=${input.agent_id}, type=${input.agent_type}`);
  debug(`SubagentStart full input: ${JSON.stringify(input)}`);

  // transcript_path here is the SUBAGENT's transcript, not the parent's.
  const agentTranscriptPath = expandHome(input.transcript_path);
  if (!agentTranscriptPath) {
    debug("No transcript_path provided, skipping");
    return;
  }

  await atomicUpdateState(config.stateFilePath, (state) => {
    const ss = getSessionState(state, input.session_id);
    return {
      ...state,
      [input.session_id]: {
        ...ss,
        subagent_transcript_paths: {
          ...ss.subagent_transcript_paths,
          [input.agent_id]: {
            transcript_path: agentTranscriptPath,
            agent_type: input.agent_type,
          },
        },
      },
    };
  });

  debug(`Recorded transcript path for subagent ${input.agent_type} (${input.agent_id})`);
}

main().catch((err) => {
  try {
    error(`SubagentStart hook fatal error: ${err}`);
  } catch {
    // Last resort
  }
  process.exit(0);
});

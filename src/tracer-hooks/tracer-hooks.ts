import { dirname } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { launchDetachedWorker } from "@langchain/plugins-base/plugin";
import { sendHookNote, startTracerWorker, tracerPaths } from "@langchain/plugins-base/tracer";
import type { TracingMode } from "@langchain/plugins-base/tracer";
import {
  ENGINE_WORKER_ARG,
  HOOK_EVENT_NAMES,
  LS_INTEGRATION,
  STOP_FLUSH_WAIT_MS,
} from "../constants.js";
import { writerOptions } from "../engine-writer.js";
import { answerPrompt, promptTracingConfig } from "../hooks/user-prompt-submit.js";
import { PLUGIN_VERSION } from "../integration-version.js";
import { warn } from "../logger.js";
import { createTranscriptBuilder } from "../tracer-builder/tracer-builder.js";
import type { NoteDetails } from "../tracer-builder/tracer-builder-models.js";
import { promptTurnMode, resolveTurnTracingMode } from "../tracing-mode.js";
import type { Config, HookEventName, TurnStarter } from "../types.js";
import { isPayloadForHook } from "../utils/harness.js";
import { expandHome, initHook } from "../utils/hook-init.js";
import { readStdin } from "../utils/stdin.js";
import { readLegacySessions } from "./legacy-sessions.js";
import type { TracerHookInput } from "./tracer-hooks-models.js";

export async function sendTracerNote(
  event: HookEventName,
  input: TracerHookInput,
  config: Config,
  tracingMode: TracingMode = resolveTurnTracingMode(config, input.session_id),
): Promise<void> {
  const paths = tracerPaths(dirname(config.stateFilePath));
  let launch: Promise<unknown> | undefined;
  sendHookNote(
    {
      integration: LS_INTEGRATION,
      event,
      sessionId: input.session_id,
      ...(input.transcript_path ? { transcriptPath: expandHome(input.transcript_path) } : {}),
      ...(input.agent_id ? { agentId: input.agent_id } : {}),
      tracingMode,
      details: {
        time: Date.now(),
        cwd: input.cwd,
        toolUseId: input.tool_use_id,
        permissionMode: input.permission_mode,
        lastAssistantMessage: input.last_assistant_message,
        error: input.error,
        errorDetails: input.error_details,
        metadata: config.customMetadata,
        parentDottedOrder: config.parentDottedOrder,
      } satisfies NoteDetails,
      writer: writerOptions(config),
    },
    {
      paths,
      version: PLUGIN_VERSION,
      startWorker: () => {
        launch = launchDetachedWorker([ENGINE_WORKER_ARG, input.cwd], {
          storageRoot: paths.folder,
        }).catch((err: unknown) => warn(`Could not start the tracing worker: ${err}`));
      },
    },
  );
  await launch;
}

function noteHandler(event: HookEventName): () => Promise<void> {
  return async () => {
    const input = await readStdin<TracerHookInput>();
    if (!isPayloadForHook(input, event)) return;
    const config = initHook(input.cwd);
    if (config) await sendTracerNote(event, input, config);
  };
}

const sendPromptNote: TurnStarter = async (input, output, currentTurnMode) => {
  const config = await promptTracingConfig(input, output);
  if (!config) return;
  const mode = promptTurnMode(config, input.session_id, currentTurnMode);
  await sendTracerNote("UserPromptSubmit", input, config, mode);
};

export const NOTE_HANDLERS = {
  ...Object.fromEntries(HOOK_EVENT_NAMES.map((event) => [event, noteHandler(event)])),
  UserPromptSubmit: () => answerPrompt(sendPromptNote),
  Stop: () => sleep(STOP_FLUSH_WAIT_MS).then(noteHandler("Stop")),
} as Record<HookEventName, () => Promise<void>>;

export async function runTracerWorker(cwd: string): Promise<void> {
  const config = initHook(cwd);
  if (!config) return;
  await startTracerWorker({
    agentStateFolder: dirname(config.stateFilePath),
    integration: LS_INTEGRATION,
    version: PLUGIN_VERSION,
    writer: writerOptions(config),
    createBuilder: createTranscriptBuilder,
    readLegacySessions,
  });
}

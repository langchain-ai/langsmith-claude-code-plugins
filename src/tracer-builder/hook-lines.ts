import { END_TURN, HOOK_EVENTS } from "../constants.js";
import { isRecord } from "../utils/records.js";
import type { ClaudeLine, HookRoundText, NoteDetails, TextChunk } from "./tracer-builder-models.js";

export function joinedText(chunks: TextChunk[]): string {
  const messageIds = [...new Set(chunks.map((chunk) => chunk.messageId))];
  return messageIds
    .flatMap((id) =>
      chunks.filter((chunk) => chunk.messageId === id).sort((a, b) => a.index - b.index),
    )
    .map((chunk) => chunk.text)
    .join("");
}

function textBlocks(text: string) {
  return text ? [{ type: "text", text }] : [];
}

function toolResultLine(base: ClaudeLine, id: string | undefined, content: string, extra: object) {
  const block = { type: "tool_result", tool_use_id: id, content, ...extra };
  return { ...base, type: "user", message: { content: [block] } };
}

export function hookLine(
  event: string,
  details: NoteDetails,
  time: string,
  round: HookRoundText,
): ClaudeLine | undefined {
  const content = details.hookContent!;
  const base: ClaudeLine = { timestamp: time, cwd: details.cwd };
  const response = content.toolResponse;
  switch (event) {
    case HOOK_EVENTS.userPromptSubmit:
      return {
        ...base,
        type: "user",
        promptId: content.promptId,
        message: { content: content.prompt },
      };
    case HOOK_EVENTS.messageDisplay:
      return {
        ...base,
        type: "assistant",
        message: { id: round.id, content: textBlocks(round.text) },
      };
    case HOOK_EVENTS.preToolUse: {
      const use = {
        type: "tool_use",
        id: details.toolUseId,
        name: content.toolName,
        input: content.toolInput,
      };
      return {
        ...base,
        type: "assistant",
        message: { id: round.id, content: [...textBlocks(round.text), use] },
      };
    }
    case HOOK_EVENTS.postToolUse: {
      const text = typeof response === "string" ? response : JSON.stringify(response);
      const line = toolResultLine(base, details.toolUseId, text, {});
      return isRecord(response) ? { ...line, toolUseResult: response } : line;
    }
    case HOOK_EVENTS.postToolUseFailure:
      return toolResultLine(base, details.toolUseId, details.error ?? "", { is_error: true });
    case HOOK_EVENTS.stop:
    case HOOK_EVENTS.subagentStop:
      return {
        ...base,
        type: "assistant",
        message: { id: round.id, content: textBlocks(round.text), stop_reason: END_TURN },
      };
  }
  return undefined;
}

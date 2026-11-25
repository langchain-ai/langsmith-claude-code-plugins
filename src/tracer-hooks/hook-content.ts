import { HOOK_TOOL_VALUE_CUT_MARKER, HOOK_TOOL_VALUE_MAX_BYTES } from "../constants.js";
import type { HookContent } from "../tracer-builder/tracer-builder-models.js";
import type { TracerHookInput } from "../types.js";

function cappedToolValue(value: unknown): unknown {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (text === undefined) return value;
  const bytes = Buffer.from(text);
  if (bytes.length <= HOOK_TOOL_VALUE_MAX_BYTES) return value;
  let end = HOOK_TOOL_VALUE_MAX_BYTES;
  while ((bytes[end] & 0xc0) === 0x80) end--;
  const marker = HOOK_TOOL_VALUE_CUT_MARKER.replace("{bytes}", String(bytes.length));
  return bytes.subarray(0, end).toString("utf8") + marker;
}

export function hookContentOf(input: TracerHookInput): HookContent {
  return {
    prompt: input.prompt,
    promptId: input.prompt_id,
    toolName: input.tool_name,
    toolInput: cappedToolValue(input.tool_input),
    toolResponse: cappedToolValue(input.tool_response),
    messageId: input.message_id,
    index: input.index,
    text: input.delta,
  };
}

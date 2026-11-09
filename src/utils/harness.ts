import {
  CURSOR_VERSION_FIELD,
  HARNESS_COMMAND,
  HARNESS_DROPPED_ELEMENT,
  HARNESS_TASK_NOTIFICATION,
  HARNESS_TASK_NOTIFICATION_BLOCK,
  HARNESS_TASK_NOTIFICATION_KEPT,
  HARNESS_TASK_NOTIFICATION_TOOL_USE_ID,
  HARNESS_UNWRAPPED_TAG,
  NON_SKILL_PROMPT_COMMAND,
  SKILL_COMMAND_OPENING,
  SKILL_NAME_LEADING_SLASH,
} from "../constants.js";
import type { BackgroundAgentAnswer, HookEventName, HookEventPayload, Turn } from "../types.js";

export function isCursorPayload(input: unknown): boolean {
  return typeof input === "object" && input !== null && Object.hasOwn(input, CURSOR_VERSION_FIELD);
}

export function isPayloadForHook(input: HookEventPayload, event: HookEventName): boolean {
  if (isCursorPayload(input)) return false;
  const declared = input.hook_event_name;
  // Standing down on an absent name would silently stop tracing, so only a disagreeing name counts.
  return declared === undefined || declared === event;
}

export function stripHarnessMarkup(text: string): string {
  return text
    .replace(HARNESS_DROPPED_ELEMENT, "")
    .replace(HARNESS_COMMAND, (_, name: string, args = "") =>
      `${name.trim()} ${args.trim()}`.trim(),
    )
    .replace(HARNESS_TASK_NOTIFICATION, (block) =>
      [...block.matchAll(HARNESS_TASK_NOTIFICATION_KEPT)].map((m) => m[2].trim()).join("\n\n"),
    )
    .replace(HARNESS_UNWRAPPED_TAG, "")
    .trim();
}

export function backgroundAgentAnswers(
  content: Turn["userContent"],
): BackgroundAgentAnswer[] | undefined {
  if (typeof content !== "string" || !HARNESS_TASK_NOTIFICATION.test(content)) return undefined;
  const answers: BackgroundAgentAnswer[] = [];
  for (const [block] of content.matchAll(HARNESS_TASK_NOTIFICATION_BLOCK)) {
    const toolUseId = HARNESS_TASK_NOTIFICATION_TOOL_USE_ID.exec(block)?.[1];
    if (!toolUseId) return undefined;
    answers.push({ toolUseId, text: stripHarnessMarkup(block) });
  }
  return answers;
}

export function typedSkillName(content: Turn["userContent"]): string | undefined {
  if (typeof content !== "string" || !content.startsWith(SKILL_COMMAND_OPENING)) return undefined;
  const name = [...content.matchAll(HARNESS_COMMAND)][0]?.[1]
    ?.trim()
    .replace(SKILL_NAME_LEADING_SLASH, "");
  return name && !NON_SKILL_PROMPT_COMMAND.test(name) ? name : undefined;
}

export function stripContentMarkup(content: Turn["userContent"]): Turn["userContent"] | undefined {
  if (typeof content === "string") return stripHarnessMarkup(content) || undefined;
  const blocks = content.flatMap((block) => {
    if (block.type !== "text" || typeof block.text !== "string") return [block];
    const text = stripHarnessMarkup(block.text);
    return text ? [{ ...block, text }] : [];
  });
  return blocks.length > 0 ? blocks : undefined;
}

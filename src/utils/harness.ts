import {
  CURSOR_VERSION_FIELD,
  HARNESS_COMMAND,
  HARNESS_DROPPED_ELEMENT,
  HARNESS_TASK_NOTIFICATION,
  HARNESS_TASK_NOTIFICATION_KEPT,
  HARNESS_UNWRAPPED_TAG,
  SKILL_COMMAND_OPENING,
  SKILL_LEADING_SLASH,
  SKILL_NAMESPACE_SEPARATOR,
  SLASH_COMMAND,
} from "../constants.js";
import type { HookEventName, HookEventPayload, SlashSkill, Turn } from "../types.js";

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

export function stripContentMarkup(content: Turn["userContent"]): Turn["userContent"] | undefined {
  if (typeof content === "string") return stripHarnessMarkup(content) || undefined;
  const blocks = content.flatMap((block) => {
    if (block.type !== "text" || typeof block.text !== "string") return [block];
    const text = stripHarnessMarkup(block.text);
    return text ? [{ ...block, text }] : [];
  });
  return blocks.length > 0 ? blocks : undefined;
}

export function isFailedToolResponse(response: Record<string, unknown>): boolean {
  return response.is_error === true || response.success === false;
}

export function normalizeSkillName(name: string): string | undefined {
  return name.trim().replace(SKILL_LEADING_SLASH, "").trim() || undefined;
}

function contentText(content: Turn["userContent"]): string {
  if (typeof content === "string") return content;
  return content.map((block) => (typeof block.text === "string" ? block.text : "")).join("\n");
}

export function slashSkillOf(turn: Turn): SlashSkill | undefined {
  const text = contentText(turn.userContent).trimStart();
  if (!text.startsWith(SKILL_COMMAND_OPENING) || !turn.llmCalls[0]?.instructionsBefore) {
    return undefined;
  }
  const [, rawName = "", rawArgs] = SLASH_COMMAND.exec(text) ?? [];
  const name = normalizeSkillName(rawName);
  const args = rawArgs?.trim();
  if (!name) return undefined;
  return args ? { name, args } : { name };
}

export function isSameSkill(first: string, second: string): boolean {
  const [a, b] = [first, second].map((name) => name.toLowerCase());
  const [bareA, namespacedA] = skillParts(a);
  const [bareB, namespacedB] = skillParts(b);
  if (!bareA || !bareB) return false;
  return namespacedA && namespacedB ? a === b : bareA === bareB;
}

function skillParts(name: string): [string, boolean] {
  const parts = name.split(SKILL_NAMESPACE_SEPARATOR);
  return parts.includes("") ? [name, false] : [parts[parts.length - 1], parts.length > 1];
}

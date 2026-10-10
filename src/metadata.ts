import {
  buildCodingAgentMetadata,
  trustedCodingAgentMetadata,
} from "@langchain/plugins-base/metadata";
import type { CodingAgentMetadataOptions as SharedCodingAgentMetadataOptions } from "@langchain/plugins-base/metadata";
import { CLAUDE_CODE_INTEGRATION, TRUSTED_INTEGRATION_VERSION } from "./constants.js";
import type { CodingAgentMetadataOptions as NativeCodingAgentMetadataOptions } from "./models/metadata.js";

export type { CodingAgentMetadataOptions, LSAgentType } from "./models/metadata.js";
export { trustedCodingAgentMetadata };

export function codingAgentMetadataOptions(
  options: NativeCodingAgentMetadataOptions,
): SharedCodingAgentMetadataOptions {
  const { sessionId, ...nativeOptions } = options;
  return Object.fromEntries(
    Object.entries({
      ...nativeOptions,
      ...(nativeOptions.base === undefined ? {} : { base: { ...nativeOptions.base } }),
      integration: CLAUDE_CODE_INTEGRATION,
      integrationVersion: TRUSTED_INTEGRATION_VERSION,
      threadId: sessionId,
    }).filter(([, value]) => value !== undefined),
  ) as unknown as SharedCodingAgentMetadataOptions;
}

export function codingAgentMetadata(
  options: NativeCodingAgentMetadataOptions,
): Record<string, unknown> {
  return buildCodingAgentMetadata(codingAgentMetadataOptions(options));
}

/**
 * Extract the invoked skill name from a tool call, for `ls_skill_name`.
 * Centralizes the one "Skill" special-case so both trace paths stay one-liners.
 * Returns undefined for non-Skill tools; the name lives in the Skill tool's
 * `skill` input arg (`{ skill, args }`).
 */
export function skillNameFromTool(
  toolName: string | undefined,
  toolInput: unknown,
): string | undefined {
  if (toolName !== "Skill") return undefined;
  const skill = (toolInput as { skill?: unknown } | null | undefined)?.skill;
  return typeof skill === "string" ? skill : undefined;
}

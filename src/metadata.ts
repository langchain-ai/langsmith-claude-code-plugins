import type {
  CodingAgentMetadataOptions,
  CodingAgentRunType,
} from "@langchain/plugins-base/metadata";
import { LS_INTEGRATION } from "./constants.js";
import { LS_INTEGRATION_VERSION } from "./integration-version.js";
import type { ClaudeMetadataOptions } from "./types.js";

function runTypeOf(options: ClaudeMetadataOptions): CodingAgentRunType {
  if (options.toolName) return "tool";
  if (options.agentType === "subagent" || options.agentType === "compaction") return "subagent";
  return options.modelName === undefined ? "root" : "llm";
}

export function codingAgentMetadata(options: ClaudeMetadataOptions): CodingAgentMetadataOptions {
  const { sessionId, ...rest } = options;
  return {
    ...rest,
    runType: runTypeOf(options),
    integration: LS_INTEGRATION,
    integrationVersion: LS_INTEGRATION_VERSION,
    threadId: sessionId,
  };
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

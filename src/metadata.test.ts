import { describe, it, expect, vi } from "vitest";
import { buildCodingAgentMetadata } from "@langchain/plugins-base/metadata";
import { codingAgentMetadata, skillNameFromTool } from "./metadata.js";

describe("codingAgentMetadata", () => {
  it("names the run as Claude Code's and uses the session as the thread", () => {
    const meta = buildCodingAgentMetadata(
      codingAgentMetadata({ sessionId: "sess_7f3c2a9e1b", agentType: "root" }),
    );
    expect(meta.ls_integration).toBe("claude-code");
    expect(meta.ls_agent_runtime).toBe("Claude Code");
    expect(meta.thread_id).toBe("sess_7f3c2a9e1b");
  });

  it("stamps the build's version", async () => {
    vi.stubEnv("CC_LANGSMITH_INTEGRATION_VERSION", "9.9.9");
    vi.resetModules();
    const { codingAgentMetadata: fresh } = await import("./metadata.js");
    const meta = buildCodingAgentMetadata(fresh({ sessionId: "s1", agentType: "root" }));
    expect(meta.ls_integration_version).toBe("9.9.9");
    vi.unstubAllEnvs();
  });
});

describe("skillNameFromTool", () => {
  it("takes the name only from Skill tool calls", () => {
    expect(skillNameFromTool("Skill", { skill: "deep-research", args: "x" })).toBe("deep-research");
    expect(skillNameFromTool("Bash", { skill: "deep-research" })).toBeUndefined();
    expect(skillNameFromTool("Skill", {})).toBeUndefined();
    expect(skillNameFromTool("Skill", undefined)).toBeUndefined();
    expect(skillNameFromTool("Skill", { skill: 42 })).toBeUndefined();
  });
});

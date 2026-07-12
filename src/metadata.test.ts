/**
 * Contract test: loads validator.json and asserts the helper emits the required
 * keys (correct types + allowed values) for each run type.
 */

import { describe, it, expect } from "vitest";
import { codingAgentMetadata } from "./metadata.js";
import validator from "./fixtures/coding-agent-v1/validator.json" with { type: "json" };

type RunType = "root" | "llm" | "tool" | "subagent" | "interrupted";

interface ValidatorKey {
  key: string;
  appliesTo: RunType[];
  type: "string" | "integer";
  allowedValues: string[] | null;
  requirement: "always" | "where_known" | "contextual";
  requiredWhereKnown: boolean;
}

const KEYS = validator.keys as ValidatorKey[];

// Static base metadata as produced by config.ts (config-sourced contract keys
// + user attribution). The helper merges this onto every run.
const BASE = {
  ls_integration_version: "0.1.3",
  repository_url: "https://github.com/langchain-ai/langsmith-claude-code-plugins",
  repository_provider: "github",
  repository_name: "langchain-ai/langsmith-claude-code-plugins",
  git_branch: "main",
  git_commit_sha: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
  cwd: "/Users/dev/langsmith-claude-code-plugins",
  user_id: "u_9f3ab21c",
  local_username: "dev",
  anthropic_user_id: "u_9f3ab21c",
};

const COMMON = {
  sessionId: "sess_7f3c2a9e1b",
  base: BASE,
  turnId: "prompt_abc123",
  turnNumber: 3,
  runtimeVersion: "2.1.181",
} as const;

// One representative metadata object per run type, built via the shared helper.
const RUNS: Record<RunType, Record<string, unknown>> = {
  root: codingAgentMetadata({ ...COMMON, approvalPolicy: "acceptEdits", legacyRole: "root" }),
  llm: codingAgentMetadata({
    ...COMMON,
    runSpecific: {
      ls_provider: "anthropic",
      ls_model_name: "claude-opus-4-8",
      ls_invocation_params: { max_tokens: 8192, temperature: 1 },
      usage_metadata: { input_tokens: 12873, output_tokens: 412, total_tokens: 13285 },
    },
  }),
  tool: codingAgentMetadata({ ...COMMON, toolName: "Bash", runName: "Bash" }),
  subagent: codingAgentMetadata({
    ...COMMON,
    legacyRole: "subagent",
    subagentId: "sub_4d8e1f",
    subagentType: "Explore",
  }),
  interrupted: codingAgentMetadata({
    ...COMMON,
    approvalPolicy: "acceptEdits",
    legacyRole: "root",
  }),
};

function checkType(value: unknown, type: "string" | "integer"): boolean {
  return type === "integer" ? Number.isInteger(value) : typeof value === "string";
}

describe("coding-agent-v1 contract", () => {
  const runTypes = Object.keys(RUNS) as RunType[];

  it("validator covers the expected run types", () => {
    expect(new Set(validator.integrations)).toContain("claude-code");
    expect(validator.schemaVersion).toBe("coding-agent-v1");
  });

  describe.each(runTypes)("%s run", (runType) => {
    const meta = RUNS[runType];

    // Every "always" key must be present with correct type + allowed value.
    const alwaysKeys = KEYS.filter(
      (k) => k.requirement === "always" && k.appliesTo.includes(runType),
    );
    it.each(alwaysKeys.map((k) => [k.key, k] as const))("has required key %s", (_name, entry) => {
      expect(meta[entry.key], `${entry.key} missing`).toBeDefined();
      expect(checkType(meta[entry.key], entry.type), `${entry.key} wrong type`).toBe(true);
      if (entry.allowedValues) {
        expect(entry.allowedValues).toContain(meta[entry.key]);
      }
    });

    // "where_known" keys: every source is provided, so all must be present.
    const whereKnownKeys = KEYS.filter(
      (k) => k.requirement === "where_known" && k.appliesTo.includes(runType),
    );
    it.each(whereKnownKeys.map((k) => [k.key, k] as const))(
      "has where-known key %s",
      (_name, entry) => {
        expect(meta[entry.key], `${entry.key} missing`).toBeDefined();
        expect(checkType(meta[entry.key], entry.type), `${entry.key} wrong type`).toBe(true);
      },
    );

    // Any present contract key must be valid and apply to this run type.
    it("emits no key outside its appliesTo, and all present keys are valid", () => {
      for (const entry of KEYS) {
        if (meta[entry.key] === undefined) continue;
        expect(entry.appliesTo, `${entry.key} should not appear on ${runType}`).toContain(runType);
        expect(checkType(meta[entry.key], entry.type), `${entry.key} wrong type`).toBe(true);
        if (entry.allowedValues) {
          expect(entry.allowedValues).toContain(meta[entry.key]);
        }
      }
    });
  });

  // ─── Identity literals ──────────────────────────────────────────────────────

  it.each(Object.keys(RUNS) as RunType[])("%s run carries the frozen identity block", (rt) => {
    const meta = RUNS[rt];
    expect(meta.ls_agent_kind).toBe("coding_agent");
    expect(meta.ls_integration).toBe("claude-code");
    expect(meta.ls_agent_runtime).toBe("Claude Code");
    expect(meta.ls_trace_schema_version).toBe("coding-agent-v1");
    expect(meta.thread_id).toBe("sess_7f3c2a9e1b");
  });

  // ─── ls_subagent_type is subagent-only and never "root" ──────────────────────

  it("emits ls_subagent_type / ls_subagent_id only when subagentId is provided", () => {
    expect(RUNS.subagent.ls_subagent_type).toBe("Explore");
    expect(RUNS.subagent.ls_subagent_id).toBe("sub_4d8e1f");
    // Root-level llm/tool/interrupted runs don't carry a subagent id (none was
    // passed), so the keys must be absent.
    for (const rt of ["root", "llm", "tool", "interrupted"] as RunType[]) {
      expect(RUNS[rt].ls_subagent_type, `ls_subagent_type leaked onto ${rt}`).toBeUndefined();
      expect(RUNS[rt].ls_subagent_id, `ls_subagent_id leaked onto ${rt}`).toBeUndefined();
    }
  });

  it("propagates ls_subagent_id / ls_subagent_type onto subagent child runs (llm, tool)", () => {
    // An LLM run nested under a subagent — the helper stamps the parent subagent
    // id/type onto it (children don't inherit parent metadata in LangSmith).
    const subagentLlm = codingAgentMetadata({
      ...COMMON,
      subagentId: "sub_4d8e1f",
      subagentType: "Explore",
      runSpecific: { ls_provider: "anthropic", ls_model_name: "claude-opus-4-8" },
    });
    expect(subagentLlm.ls_subagent_id).toBe("sub_4d8e1f");
    expect(subagentLlm.ls_subagent_type).toBe("Explore");
    expect(subagentLlm.agent_id).toBe("sub_4d8e1f"); // DEPRECATED compat alias
    expect(subagentLlm.agent_type).toBe("Explore"); // DEPRECATED compat alias

    // A tool run nested under a subagent.
    const subagentTool = codingAgentMetadata({
      ...COMMON,
      subagentId: "sub_4d8e1f",
      subagentType: "Explore",
      toolName: "Bash",
      runName: "Bash",
    });
    expect(subagentTool.ls_subagent_id).toBe("sub_4d8e1f");
    expect(subagentTool.ls_subagent_type).toBe("Explore");
    expect(subagentTool.ls_tool_name).toBeUndefined(); // equals run name → omitted
  });

  it("never emits ls_subagent_type='root' (uses ls_agent_type compat alias instead)", () => {
    expect(RUNS.root.ls_subagent_type).toBeUndefined();
    expect(RUNS.root.ls_agent_type).toBe("root"); // DEPRECATED compat alias
    expect(RUNS.subagent.ls_agent_type).toBe("subagent"); // DEPRECATED compat alias
  });

  // ─── Turn markers propagate to subagent + Agent-tool runs ────────────────────

  it("propagates the parent turn's turn_id + turn_number onto the subagent run", () => {
    expect(RUNS.subagent.turn_id).toBe("prompt_abc123");
    expect(RUNS.subagent.turn_number).toBe(3);
  });

  it("propagates turn markers + ls_tool_name='Task' onto the Agent tool run", () => {
    // Mirrors tracePendingSubagents: run name "Agent", native tool "Task".
    const agentTool = codingAgentMetadata({
      ...COMMON,
      toolName: "Task",
      runName: "Agent",
      runSpecific: { agent_type: "Explore", agent_id: "sub_4d8e1f" },
    });
    expect(agentTool.turn_id).toBe("prompt_abc123");
    expect(agentTool.turn_number).toBe(3);
    expect(agentTool.ls_tool_name).toBe("Task"); // name "Agent" ≠ tool "Task"
    expect(agentTool.tool_name).toBe("Task"); // DEPRECATED compat alias
    expect(agentTool.ls_subagent_type).toBeUndefined(); // subagent-only
    expect(agentTool.ls_subagent_id).toBeUndefined();
  });

  // ─── approval_policy is root + interrupted only ──────────────────────────────

  it("emits approval_policy only on root + interrupted runs", () => {
    expect(RUNS.root.approval_policy).toBe("acceptEdits");
    expect(RUNS.interrupted.approval_policy).toBe("acceptEdits");
    expect(RUNS.llm.approval_policy).toBeUndefined();
    expect(RUNS.tool.approval_policy).toBeUndefined();
    expect(RUNS.subagent.approval_policy).toBeUndefined();
  });

  // ─── ls_tool_name only when it differs from the run name ─────────────────────

  it("omits ls_tool_name when tool name equals run name, keeps tool_name compat alias", () => {
    expect(RUNS.tool.tool_name).toBe("Bash"); // DEPRECATED compat alias, always kept
    expect(RUNS.tool.ls_tool_name).toBeUndefined(); // equal to run name → omitted
  });

  it("emits ls_tool_name when tool name differs from run name", () => {
    const meta = codingAgentMetadata({ ...COMMON, toolName: "Bash", runName: "Agent" });
    expect(meta.ls_tool_name).toBe("Bash");
    expect(meta.tool_name).toBe("Bash");
  });

  // ─── Model run keeps existing conventions unchanged ──────────────────────────

  it("preserves ls_provider/ls_model_name/usage_metadata on model runs", () => {
    for (const key of validator.preserveExistingOnModelAndToolRuns) {
      if (key === "usage_metadata" || key.startsWith("ls_")) {
        // present on the llm fixture
      }
    }
    expect(RUNS.llm.ls_provider).toBe("anthropic");
    expect(RUNS.llm.ls_model_name).toBe("claude-opus-4-8");
    expect(RUNS.llm.usage_metadata).toMatchObject({ total_tokens: 13285 });
  });

  // ─── Unknown values are omitted, never null/empty ────────────────────────────

  it("omits keys whose source is unknown (no null/empty values)", () => {
    const sparse = codingAgentMetadata({ sessionId: "s1" });
    expect(sparse.turn_id).toBeUndefined();
    expect(sparse.turn_number).toBeUndefined();
    expect(sparse.ls_agent_runtime_version).toBeUndefined();
    expect(sparse.approval_policy).toBeUndefined();
    for (const [, v] of Object.entries(sparse)) {
      expect(v === null || v === "").toBe(false);
    }
    // Identity literals are still present even with no context.
    expect(sparse.ls_agent_kind).toBe("coding_agent");
    expect(sparse.thread_id).toBe("s1");
  });

  // ─── User-supplied env metadata wins on collision ────────────────────────────

  it("lets user-supplied base metadata override contract keys", () => {
    const meta = codingAgentMetadata({
      sessionId: "s1",
      base: { thread_id: "override", ls_integration: "custom" },
    });
    expect(meta.thread_id).toBe("override");
    expect(meta.ls_integration).toBe("custom");
  });
});

import { describe, expect, it, vi } from "vitest";
import { RunTree } from "langsmith";
import {
  createRunTree,
  metadataForMode,
  MUTED_TRACE_CONTENT,
  runConfigForMode,
} from "./privacy.js";

vi.mock("langsmith", () => ({
  RunTree: vi.fn(function (config: Record<string, unknown>) {
    return {
      ...config,
      // Simulate SDK environment resolution happening inside the constructor.
      replicas: config.replicas ?? [
        { projectName: "env-replica", apiKey: "auth", updates: { inputs: { secret: true } } },
      ],
      patchRun: vi.fn(),
    };
  }),
}));

describe("metadata tracing privacy", () => {
  it("passes the original config to the SDK in full/default mode", () => {
    const config = {
      name: "run",
      inputs: { secret: true },
      extra: { runtime: { secret: true } },
    };
    for (const mode of [undefined, "full"] as const) {
      const run = createRunTree(config, mode);
      expect(vi.mocked(RunTree).mock.lastCall?.[0]).toBe(config);
      expect(run.replicas?.[0].updates).toEqual({ inputs: { secret: true } });
    }
  });

  it("strips updates after SDK environment resolution without altering destinations", () => {
    const run = createRunTree({ name: "run" }, "metadata");
    expect(run.replicas).toEqual([{ projectName: "env-replica", apiKey: "auth" }]);
    expect(run.inputs).toEqual({
      messages: [{ role: "user", content: MUTED_TRACE_CONTENT }],
    });
  });

  it("keeps only allowed metadata and message-shaped placeholders", () => {
    const config = runConfigForMode(
      {
        inputs: { secret: "input" },
        outputs: { secret: "output" },
        error: "raw error",
        end_time: "2025-01-01T00:00:01Z",
        extra: {
          metadata: {
            thread_id: "thread",
            turn_number: 2,
            ls_model_name: "model",
            ls_tool_name: "Bash",
            ls_agent_type: "root",
            usage_metadata: { total_tokens: 4 },
            cwd: "/secret",
            repository_name: "private",
            turn_id: "id",
            ls_invocation_params: { secret: true },
          },
        },
      },
      "metadata",
    );
    expect(config.inputs).toEqual({
      messages: [
        {
          role: "user",
          content: "[LangSmith system notice: content omitted because tracing is muted.]",
        },
      ],
    });
    expect(config.outputs).toEqual({
      messages: [
        {
          role: "assistant",
          content: "[LangSmith system notice: content omitted because tracing is muted.]",
        },
      ],
    });
    expect(config.error).toBeUndefined();
    expect(config.extra.metadata).toEqual({
      thread_id: "thread",
      turn_number: 2,
      ls_model_name: "model",
      ls_tool_name: "Bash",
      ls_agent_type: "root",
      usage_metadata: { total_tokens: 4 },
      turn_id: "id",
      ls_tracing_mode: "metadata",
      status: "error",
    });
  });

  it("strips replica updates in metadata mode", () => {
    const config = runConfigForMode(
      {
        replicas: [
          {
            apiUrl: "https://replica.example.com",
            apiKey: "key",
            projectName: "replica",
            workspaceId: "workspace",
            primary: true,
            fromEnv: true,
            reroot: true,
            client: { id: "dedicated-client" },
            updates: { metadata: { environment: "secret" }, inputs: { secret: true } },
          },
        ],
      },
      "metadata",
    );
    expect(config.replicas).toEqual([
      {
        apiUrl: "https://replica.example.com",
        apiKey: "key",
        projectName: "replica",
        workspaceId: "workspace",
        primary: true,
        fromEnv: true,
        reroot: true,
        client: { id: "dedicated-client" },
      },
    ]);
  });

  it("exports the exact user-facing placeholder", () => {
    expect(MUTED_TRACE_CONTENT).toBe(
      "[LangSmith system notice: content omitted because tracing is muted.]",
    );
  });

  it.each([
    [{}, "running"],
    [{ end_time: 0 }, "completed"],
    [{ end_time: 123 }, "completed"],
    [{ error: "private failure" }, "error"],
    [{ error: "private failure", end_time: 123 }, "error"],
  ] as const)("derives a safe status from lifecycle fields %j", (lifecycle, status) => {
    const safe = runConfigForMode(
      { ...lifecycle, extra: { metadata: { status: "custom-secret" } } },
      "metadata",
    );
    expect(safe.extra.metadata.status).toBe(status);
    expect(safe).not.toHaveProperty("error");
  });

  it("preserves topology, routing and timestamps without mutating the config", () => {
    const identity = {
      client: { id: "client" },
      id: "run-id",
      name: "Bash",
      run_type: "tool",
      project_name: "project",
      parent_run_id: "parent-id",
      trace_id: "trace-id",
      dotted_order: "parent.child",
      start_time: 0,
      end_time: 42,
    };
    const original = {
      ...identity,
      inputs: { secret: "input" },
      outputs: { secret: "output" },
      events: [{ secret: "event" }],
      attachments: { secret: "attachment" },
      tags: ["secret"],
      serialized: { secret: true },
      extra: { runtime: { secret: true }, metadata: { cwd: "secret" } },
    };
    const snapshot = structuredClone(original);
    const safe = runConfigForMode(original, "metadata");
    expect(safe).toMatchObject(identity);
    expect(safe.client).toBe(identity.client);
    expect(Object.keys(safe).sort()).toEqual(
      [...Object.keys(identity), "inputs", "outputs", "extra"].sort(),
    );
    expect(JSON.stringify(safe)).not.toContain("secret");
    expect(original).toEqual(snapshot);
  });

  it("validates other scalar types while preserving all usage fields", () => {
    const metadata = {
      thread_id: { secret: "private" },
      turn_number: Infinity,
      ls_model_name: ["private"],
      ls_tool_name: null,
      status: "private",
      ls_tracing_mode: "private",
      usage_metadata: {
        input_tokens: 2,
        output_tokens: "private",
        total_tokens: NaN,
        input_token_details: {
          cache_read: 1,
          cache_creation: 0,
          audio: 2,
          text: "private",
          nested: { secret: true },
        },
        output_token_details: { reasoning: 3, audio: -1, text: "private" },
        arbitrary: { total_tokens: 5, secret: "private" },
      },
    };
    expect(metadataForMode(metadata, "metadata")).toEqual({
      status: "running",
      ls_tracing_mode: "metadata",
      usage_metadata: metadata.usage_metadata,
    });
    expect(metadataForMode(metadata, "metadata")?.usage_metadata).toBe(metadata.usage_metadata);
    expect(metadataForMode(metadata, "full")).toBe(metadata);
    for (const usage_metadata of [{}, { total_tokens: {} }, { input_token_details: [1] }]) {
      expect(metadataForMode({ usage_metadata }, "metadata")?.usage_metadata).toBe(usage_metadata);
    }
    for (const usage_metadata of [[], "private", null, undefined, 4, true]) {
      expect(metadataForMode({ usage_metadata }, "metadata")?.usage_metadata).toBeUndefined();
    }
  });

  it("allocates fresh placeholder objects, arrays, and messages on every call", () => {
    const original = {
      inputs: { messages: [{ role: "user", content: "private input" }] },
      outputs: { messages: [{ role: "assistant", content: "private output" }] },
    };
    const first = runConfigForMode(original, "metadata");
    const second = runConfigForMode(original, "metadata");
    expect(first.inputs).not.toBe(first.outputs);
    expect(first.inputs.messages).not.toBe(first.outputs.messages);
    expect(first.inputs.messages[0]).not.toBe(first.outputs.messages[0]);
    for (const field of ["inputs", "outputs"] as const) {
      expect(first[field]).not.toBe(second[field]);
      expect(first[field].messages).not.toBe(second[field].messages);
      expect(first[field].messages[0]).not.toBe(second[field].messages[0]);
      first[field].messages[0].content = "mutated";
      first[field].messages.push({ role: "user", content: "extra" });
      expect(second[field]).toEqual({
        messages: [
          {
            role: field === "inputs" ? "user" : "assistant",
            content: "[LangSmith system notice: content omitted because tracing is muted.]",
          },
        ],
      });
    }
    expect(original.inputs.messages).toEqual([{ role: "user", content: "private input" }]);
    expect(original.outputs.messages).toEqual([{ role: "assistant", content: "private output" }]);
  });

  it("does not alter full tracing or its default", () => {
    const metadata = { cwd: "/repo", custom: "value" };
    const config = {
      inputs: { prompt: "original input" },
      outputs: { answer: "original output" },
      error: "original error",
      extra: { metadata },
      replicas: [{ projectName: "replica", updates: { inputs: { private: true } } }],
    };
    expect(metadataForMode(metadata, "full")).toBe(metadata);
    expect(runConfigForMode(config, "full")).toBe(config);
    expect(runConfigForMode(config)).toBe(config);
  });
});

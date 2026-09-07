import { describe, expect, it } from "vitest";
import { metadataForMode, runConfigForMode } from "./privacy.js";

describe("metadata tracing privacy", () => {
  it("keeps only allowed metadata and empty content", () => {
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
    expect(config.inputs).toEqual({});
    expect(config.outputs).toEqual({});
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

  it("keeps a snapshotted muted mode after policy changes", () => {
    const snapshot = "metadata" as const;
    expect(runConfigForMode({ inputs: { secret: true } }, snapshot).inputs).toEqual({});
  });

  it("validates scalar types and explicitly projects numeric usage details", () => {
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
      usage_metadata: {
        input_tokens: 2,
        input_token_details: { cache_read: 1, cache_creation: 0, audio: 2 },
        output_token_details: { reasoning: 3 },
      },
    });
    expect(metadataForMode(metadata, "full")).toBe(metadata);
    for (const usage_metadata of [
      [],
      "private",
      null,
      { total_tokens: {} },
      { input_token_details: [1] },
    ]) {
      expect(metadataForMode({ usage_metadata }, "metadata")?.usage_metadata).toBeUndefined();
    }
  });

  it("does not alter full tracing", () => {
    const metadata = { cwd: "/repo", custom: "value" };
    expect(metadataForMode(metadata, "full")).toBe(metadata);
  });
});

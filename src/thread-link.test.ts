import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Config } from "./config.js";
import { describeThreadLinks, LOOKUP_TIMEOUT_MS } from "./thread-link.js";

// Exercise the actual SDK URL handling and requests; only HTTP is replaced.
const fetchMock = vi.fn<typeof fetch>();
const config = {
  enabled: true,
  apiKey: "test",
  apiBaseUrl: "https://api.smith.langchain.com",
  project: "example",
} as Config;

beforeEach(() => {
  fetchMock
    .mockReset()
    .mockImplementation(async () =>
      Response.json([{ id: "project-id", tenant_id: "workspace-id" }]),
    );
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("thread links", () => {
  it("resolves each call from the passed session and config, not env or cached state", async () => {
    vi.stubEnv("TRACE_TO_LANGSMITH", "false"); // Use resolved config, not a second env check.
    const first = await describeThreadLinks(config, "session-a");
    const second = await describeThreadLinks(
      { ...config, replicas: [["other", undefined]] },
      "session-b",
    );
    expect(first).toContain(
      "https://smith.langchain.com/o/workspace-id/projects/p/project-id/t/session-a",
    );
    expect(second).toContain("/t/session-b");
    expect(second).not.toContain("session-a");
    expect(String(fetchMock.mock.calls[0][0])).toContain("name=example");
    expect(String(fetchMock.mock.calls[1][0])).toContain("name=other");
  });

  it("preserves self-hosted URL prefixes and encodes the session ID", async () => {
    const output = await describeThreadLinks(
      { ...config, apiBaseUrl: "https://company.example/langsmith/api/v1" },
      "session/with?#characters",
    );
    expect(output).toContain(
      "https://company.example/langsmith/o/workspace-id/projects/p/project-id/t/session%2Fwith%3F%23characters",
    );
  });

  it.each([
    [{ ...config, enabled: false }, "session", "disabled"],
    [{ ...config, apiKey: "" }, "session", "No LangSmith API key"],
  ] as const)(
    "handles unavailable tracing without requests",
    async (settings, session, message) => {
      expect(await describeThreadLinks(settings, session)).toContain(message);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("uses replica-only credentials and labels each destination instead of linking the primary", async () => {
    const output = await describeThreadLinks(
      {
        ...config,
        apiKey: "",
        replicas: [
          { projectName: "us-project", apiKey: "test-us" },
          {
            projectName: "eu-project",
            apiKey: "test-eu",
            apiUrl: "https://eu.api.smith.langchain.com",
            workspaceId: "eu-workspace",
          },
        ],
      },
      "session",
    );
    expect(output).toContain("us-project: https://smith.langchain.com/");
    expect(output).toContain("eu-project: https://eu.smith.langchain.com/");
    expect(output).not.toContain("example:");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
      "x-tenant-id": "eu-workspace",
      "x-api-key": "test-eu",
    });
  });

  it("keeps working links when another destination fails, without retries", async () => {
    fetchMock.mockResolvedValueOnce(new Response("PRIVATE_DETAILS", { status: 500 }));
    const output = await describeThreadLinks(
      { ...config, replicas: [{ projectName: "bad" }, { projectName: "good" }] },
      "session",
    );
    expect(output).toContain("bad: Could not resolve");
    expect(output).toContain("good: https://smith.langchain.com/");
    expect(output).toContain("Session ID: session");
    expect(output).not.toContain("PRIVATE_DETAILS");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("cancels a stalled lookup and returns without retries", async () => {
    // Shorten the SDK's real request abort signal, not the command's control flow.
    const timeout = AbortSignal.timeout.bind(AbortSignal);
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockImplementation(() => timeout(20));
    fetchMock.mockImplementation(
      async (_url, init) =>
        new Promise((_resolve, reject) => {
          init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason), {
            once: true,
          });
        }),
    );
    expect(await describeThreadLinks(config, "session")).toContain("Could not resolve");
    expect(timeoutSpy).toHaveBeenCalledWith(LOOKUP_TIMEOUT_MS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

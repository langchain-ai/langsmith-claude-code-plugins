import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Client as SDKClient, RunTreeConfig } from "langsmith";

// No SDK mocks: capture only the HTTP boundary, after SDK enrichment,
// anonymization, batching and (for multipart) splitting into individual parts.
type Transport = "non-batched" | "json-batch" | "multipart";
type Status = "running" | "completed" | "error";
type Payload = Record<string, any>;
type Operation = { action: "post" | "patch"; payload: Payload };
type RequestBody = {
  url: URL;
  method: string;
  headers: Headers;
  raw: string;
  operations: Operation[];
};

const API = "http://privacy.test";
const FORBIDDEN = "FORBIDDEN_PRIVACY_MARKER";
const REVISION = `${FORBIDDEN}_revision`;
const WORKSPACE = `${FORBIDDEN}_workspace`;
const CI_SHA = `${FORBIDDEN}_ci`;
const SECRET = "custom-sensitive-model-name";
const REDACTED = "[private-model]";
const transports: Transport[] = ["non-batched", "json-batch", "multipart"];

let Client: typeof import("langsmith").Client;
let RunTree: typeof import("langsmith").RunTree;
let createRunTree: typeof import("./privacy.js").createRunTree;
let createSecretAnonymizer: typeof import("langsmith/anonymizer").createSecretAnonymizer;
let clients: Set<SDKClient>;
let requests: RequestBody[];
let transport: Transport;
let allowedOrigins: Set<string>;

const allowedMetadata = {
  thread_id: "thread",
  turn_id: "turn",
  turn_number: 2,
  ls_agent_type: "root",
  ls_agent_purpose: "coding",
  ls_agent_runtime: "Claude Code",
  ls_agent_runtime_version: "test-runtime",
  ls_integration: "claude-code",
  ls_integration_version: "test-integration",
  ls_trace_schema_version: "coding-agent-v1",
  ls_model_name: SECRET,
  ls_tool_name: "Bash",
  usage_metadata: { input_tokens: 2, output_tokens: 3, total_tokens: 5 },
  ls_subagent_id: "subagent",
  ls_subagent_type: "Explore",
};

async function decodeMultipart(raw: string, contentType: string): Promise<Operation[]> {
  const form = await new Response(raw, { headers: { "content-type": contentType } }).formData();
  const operations = new Map<string, Operation>();
  for (const [name, part] of form.entries()) {
    const match = /^(post|patch)\.([^.]+)(?:\.(.+))?$/.exec(name);
    // Unexpected attachment/other parts must fail rather than go unexamined.
    expect(match, `unexpected multipart part ${name}`).not.toBeNull();
    const [, action, id, field] = match!;
    const key = `${action}.${id}`;
    const op = operations.get(key) ?? { action: action as Operation["action"], payload: {} };
    const value = JSON.parse(typeof part === "string" ? part : await part.text());
    if (field) op.payload[field] = value;
    else Object.assign(op.payload, value);
    operations.set(key, op);
  }
  return [...operations.values()];
}

const captureFetch: typeof fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  // Even shared/fallback clients cannot make an external request.
  expect(allowedOrigins.has(url.origin), `unexpected destination ${url.origin}`).toBe(true);
  if (url.pathname.endsWith("/info")) {
    return Response.json({
      batch_ingest_config: { use_multipart_endpoint: transport === "multipart" },
    });
  }
  const method = init?.method ?? (input instanceof Request ? input.method : "GET");
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined),
  );
  const raw =
    init?.body != null
      ? await new Response(init.body).text()
      : input instanceof Request
        ? await input.text()
        : "";
  let operations: Operation[];
  if (url.pathname.endsWith("/runs/multipart")) {
    operations = await decodeMultipart(raw, headers.get("content-type")!);
  } else if (url.pathname.endsWith("/runs/batch")) {
    const body = JSON.parse(raw);
    operations = [
      ...(body.post ?? []).map((payload: Payload) => ({ action: "post" as const, payload })),
      ...(body.patch ?? []).map((payload: Payload) => ({ action: "patch" as const, payload })),
    ];
  } else {
    expect(method).toMatch(/^(POST|PATCH)$/);
    expect(url.pathname).toMatch(/\/runs(?:\/[\da-f-]+)?$/);
    operations = [{ action: method === "POST" ? "post" : "patch", payload: JSON.parse(raw) }];
  }
  requests.push({ url, method, headers, raw, operations });
  return Response.json({});
};

beforeEach(async () => {
  // getRuntimeEnvironment/getShas and Client metadata are cached by the SDK.
  // Install markers BEFORE importing/constructing any real SDK objects, and
  // isolate its shared client/cache from other cases (and ambient tracing env).
  vi.resetModules();
  for (const key of Object.keys(process.env)) {
    if (/^(LANGCHAIN_|LANGSMITH_|CC_LANGSMITH_)/.test(key)) vi.stubEnv(key, undefined);
  }
  vi.stubEnv("TRACE_TO_LANGSMITH", undefined);
  vi.stubEnv("LANGCHAIN_REVISION_ID", REVISION);
  vi.stubEnv("LANGSMITH_WORKSPACE_ID", WORKSPACE);
  vi.stubEnv("CI_COMMIT_SHA", CI_SHA);
  vi.stubEnv("LANGSMITH_ENDPOINT", API);
  vi.stubEnv("LANGSMITH_API_KEY", "test-only-key");
  vi.stubEnv("LANGSMITH_TRACING_MODE", "langsmith");
  vi.stubEnv("LANGSMITH_TRACING_SAMPLING_RATE", "1");
  vi.stubEnv("CC_LANGSMITH_INTEGRATION_VERSION", "plugin-version");
  vi.stubGlobal("fetch", captureFetch);
  clients = new Set();
  requests = [];
  allowedOrigins = new Set([API]);
  transport = "non-batched";
  ({ Client, RunTree } = await import("langsmith"));
  ({ createRunTree } = await import("./privacy.js"));
  ({ createSecretAnonymizer } = await import("langsmith/anonymizer"));
});

afterEach(async () => {
  try {
    await Promise.all([...clients].map((client) => client.flush()));
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});

function makeClient(): SDKClient {
  const batched = transport !== "non-batched";
  const client = new Client({
    apiUrl: API,
    apiKey: "test-only-key",
    autoBatchTracing: batched,
    manualFlushMode: batched,
    blockOnRootRunFinalization: false,
    tracingSamplingRate: 1,
    // Deliberately leave omitTracedRuntimeInfo at its SDK default (false).
    anonymizer: createSecretAnonymizer({ extraRules: [{ pattern: SECRET, replace: REDACTED }] }),
    fetchImplementation: captureFetch,
  });
  clients.add(client);
  return client;
}

function config(
  client?: SDKClient,
  status: Status = "running",
  id: string = randomUUID(),
): RunTreeConfig {
  return {
    client,
    id,
    trace_id: id,
    dotted_order: `20250101T000000000000Z${id}`,
    name: "privacy integration",
    run_type: "chain",
    project_name: "primary",
    start_time: "2025-01-01T00:00:00Z",
    ...(status !== "running" ? { end_time: "2025-01-01T00:00:01Z" } : {}),
    ...(status === "error" ? { error: `${FORBIDDEN}_raw_error` } : {}),
    inputs: { prompt: `${FORBIDDEN}_input` },
    outputs: { answer: `${FORBIDDEN}_output` },
    tags: [`${FORBIDDEN}_tag`],
    serialized: { private: `${FORBIDDEN}_serialized` },
    extra: {
      private: `${FORBIDDEN}_extra`,
      runtime: { custom: `${FORBIDDEN}_runtime` },
      metadata: {
        ...allowedMetadata,
        cwd: `${FORBIDDEN}_cwd`,
        repository_name: `${FORBIDDEN}_repository`,
        user_id: `${FORBIDDEN}_identity`,
        ls_invocation_params: { private: FORBIDDEN },
        custom: FORBIDDEN,
      },
    },
  };
}

async function flush(): Promise<void> {
  await Promise.all([...clients].map((client) => client.flush()));
}

function expectTransport(expectedRequests: number): Operation[] {
  expect(requests).toHaveLength(expectedRequests);
  for (const request of requests) {
    if (transport === "non-batched") {
      expect(request.url.pathname).toMatch(/\/runs(?:\/[\da-f-]+)?$/);
      expect(request.operations).toHaveLength(1);
    } else {
      expect(request.method).toBe("POST");
      expect(
        request.url.pathname.endsWith(
          transport === "multipart" ? "/runs/multipart" : "/runs/batch",
        ),
      ).toBe(true);
    }
  }
  return requests.flatMap((request) => request.operations);
}

function expectMutedContent(payload: Payload, excludeInputs = false): void {
  if (excludeInputs) {
    expect.soft(payload.inputs).toBeUndefined();
  } else {
    expect.soft(payload.inputs).toEqual({
      messages: [
        {
          role: "user",
          content: "[LangSmith system notice: content omitted because tracing is muted.]",
        },
      ],
    });
  }
  expect.soft(payload.outputs).toEqual({
    messages: [
      {
        role: "assistant",
        content: "[LangSmith system notice: content omitted because tracing is muted.]",
      },
    ],
  });
}

function expectMetadata(payload: Payload, status: Status, redacted = true): void {
  // Soft assertions show post AND patch leaks in one run, rather than hiding
  // replica update failures behind the earlier post's runtime enrichment.
  expectMutedContent(payload);
  expect.soft(payload.error).toBeUndefined();
  // Exact equality, not just a denylist: newly SDK-injected keys are forbidden too.
  expect.soft(payload.extra).toEqual({
    metadata: {
      ...allowedMetadata,
      ls_model_name: redacted ? REDACTED : SECRET,
      status,
      ls_tracing_mode: "metadata",
    },
  });
  expect.soft(JSON.stringify(payload)).not.toContain(FORBIDDEN);
  if (redacted) expect.soft(JSON.stringify(payload)).not.toContain(SECRET);
}

function replicaUpdates(): Payload {
  return {
    inputs: { private: `${FORBIDDEN}_replica_input` },
    outputs: { private: `${FORBIDDEN}_replica_output` },
    error: `${FORBIDDEN}_replica_error`,
    tags: [`${FORBIDDEN}_replica_tag`],
    extra: {
      metadata: { custom: `${FORBIDDEN}_replica_metadata` },
      runtime: { private: FORBIDDEN },
    },
  };
}

describe.each(transports)("real SDK privacy over %s", (selectedTransport) => {
  it("preserves empty usage metadata on post and patch", async () => {
    transport = selectedTransport;
    const { codingAgentMetadata } = await import("./metadata.js");
    const metadata = codingAgentMetadata({
      sessionId: "plugin-session",
      agentType: "root",
      usageMetadata: {},
    });
    const client = makeClient();
    const initial = { ...config(client), extra: { metadata } };
    await createRunTree(initial, "metadata").postRun();
    await flush();
    await createRunTree(
      { ...config(client, "completed", initial.id), extra: { metadata } },
      "metadata",
    ).patchRun({ excludeInputs: true });
    await flush();
    const operations = expectTransport(2);
    expect(operations.map(({ action }) => action)).toEqual(["post", "patch"]);
    for (const { action, payload } of operations) {
      expectMutedContent(payload, action === "patch");
      expect(payload.extra.metadata.usage_metadata).toEqual({});
      expect(JSON.stringify(payload)).not.toContain(FORBIDDEN);
    }
  });

  it.each(["base", "runSpecific"] as const)(
    "projects custom %s collisions using explicit builder provenance at the wire",
    async (layer) => {
      transport = selectedTransport;
      const { codingAgentMetadata } = await import("./metadata.js");
      const collisions = Object.fromEntries(
        Object.keys(allowedMetadata).map((key) => [key, `${FORBIDDEN}_${key}`]),
      );
      collisions.usage_metadata = { total_tokens: 999, custom: FORBIDDEN };
      const metadata = codingAgentMetadata({
        sessionId: "plugin-session",
        turnId: "plugin-turn",
        turnNumber: 2,
        agentType: "root",
        runtimeVersion: "plugin-runtime",
        modelName: SECRET,
        usageMetadata: {
          input_tokens: 7,
          output_tokens: 3,
          total_tokens: 10,
          input_token_details: { cache_read: 4, cache_creation: 1, image: 2, custom: "allowed" },
          output_token_details: { video: 3, annotations: ["estimated", { source: "provider" }] },
          cost: { total: 0.25, currency: "USD" },
          annotation: SECRET,
          empty: {},
        },
        [layer]: collisions,
      });
      const client = makeClient();
      const initial = { ...config(client), extra: { metadata } };
      await createRunTree(initial, "metadata").postRun();
      await flush();
      await createRunTree(
        { ...config(client, "completed", initial.id), extra: { metadata } },
        "metadata",
      ).patchRun({ excludeInputs: true });
      await flush();
      const operations = expectTransport(2);
      expect(operations.map(({ action }) => action)).toEqual(["post", "patch"]);
      for (const { action, payload } of operations) {
        expectMutedContent(payload, action === "patch");
        expect(payload.extra).toEqual({
          metadata: {
            thread_id: "plugin-session",
            turn_id: "plugin-turn",
            turn_number: 2,
            ls_agent_purpose: "coding",
            ls_agent_type: "root",
            ls_agent_runtime: "Claude Code",
            ls_agent_runtime_version: "plugin-runtime",
            ls_integration: "claude-code",
            ls_integration_version: "plugin-version",
            ls_trace_schema_version: "coding-agent-v1",
            ls_model_name: REDACTED,
            usage_metadata: {
              input_tokens: 7,
              output_tokens: 3,
              total_tokens: 10,
              input_token_details: {
                cache_read: 4,
                cache_creation: 1,
                image: 2,
                custom: "allowed",
              },
              output_token_details: {
                video: 3,
                annotations: ["estimated", { source: "provider" }],
              },
              cost: { total: 0.25, currency: "USD" },
              annotation: REDACTED,
              empty: {},
            },
            status: action === "post" ? "running" : "completed",
            ls_tracing_mode: "metadata",
          },
        });
        expect(JSON.stringify(payload)).not.toContain(FORBIDDEN);
        expect(JSON.stringify(payload)).not.toContain(SECRET);
      }
    },
  );

  it("preserves parent identity, trace ordering and lifecycle timestamps on the wire", async () => {
    transport = selectedTransport;
    const client = makeClient();
    const parentId = randomUUID();
    const traceId = randomUUID();
    const initial = {
      ...config(client),
      parent_run_id: parentId,
      trace_id: traceId,
      dotted_order: `20241231T235959000000Z${parentId}.20250101T000000000000Z${randomUUID()}`,
    };
    await createRunTree(initial, "metadata").postRun();
    await flush();
    await createRunTree(
      { ...initial, end_time: "2025-01-01T00:00:01Z", error: `${FORBIDDEN}_failure` },
      "metadata",
    ).patchRun();
    await flush();
    const operations = expectTransport(2);
    expect(operations.map(({ action }) => action)).toEqual(["post", "patch"]);
    expect(operations[0].payload).toMatchObject({
      id: initial.id,
      name: initial.name,
      run_type: initial.run_type,
      session_name: initial.project_name,
      start_time: initial.start_time,
    });
    expect(operations[0].payload.end_time).toBeUndefined();
    for (const { payload } of operations) {
      expect(payload).toMatchObject({
        parent_run_id: parentId,
        trace_id: traceId,
        dotted_order: initial.dotted_order,
      });
    }
    expect(operations[1].payload.end_time).toBe("2025-01-01T00:00:01Z");
    expectMetadata(operations[0].payload, "running");
    expectMetadata(operations[1].payload, "error");
  });

  it("mixes metadata and full runs on one client, with separately serialized post and patch", async () => {
    transport = selectedTransport;
    const client = makeClient();
    const ids = [randomUUID(), randomUUID(), randomUUID()];
    const modes = ["metadata", "full", "metadata"] as const;
    for (let i = 0; i < ids.length; i++) {
      const run = createRunTree(config(client, "running", ids[i]), modes[i]);
      expect(run).toBeInstanceOf(RunTree);
      await run.postRun();
    }
    // A real flush boundary prevents the SDK merging a patch into its post.
    await flush();
    expectTransport(transport === "non-batched" ? 3 : 1);
    for (let i = 0; i < ids.length; i++) {
      // The plugin reconstructs RunTrees for updates in later hook processes.
      await createRunTree(
        config(client, i === 2 ? "completed" : "error", ids[i]),
        modes[i],
      ).patchRun();
    }
    await flush();
    const operations = expectTransport(transport === "non-batched" ? 6 : 2);
    expect(operations).toHaveLength(6);
    for (let i = 0; i < ids.length; i++) {
      const own = operations.filter(
        ({ payload }) =>
          payload.id === ids[i] ||
          // Non-batched PATCH identifies the run in its URL, not its JSON body.
          requests.some(
            (request) =>
              request.url.pathname.endsWith(`/runs/${ids[i]}`) &&
              request.operations.some((op) => op.payload === payload),
          ),
      );
      expect(own.map(({ action }) => action)).toEqual(["post", "patch"]);
      if (modes[i] === "metadata") {
        expectMetadata(own[0].payload, "running");
        expectMetadata(own[1].payload, i === 2 ? "completed" : "error");
      } else {
        for (const { payload } of own) {
          expect(payload.inputs).toEqual({ prompt: `${FORBIDDEN}_input` });
          expect(payload.outputs).toEqual({ answer: `${FORBIDDEN}_output` });
          expect(payload.extra.metadata).toMatchObject({
            custom: FORBIDDEN,
            ls_model_name: REDACTED,
          });
          expect(payload.extra.metadata.ls_tracing_mode).toBeUndefined();
        }
        expect(own[0].payload.extra.metadata).toMatchObject({
          revision_id: REVISION,
          LANGSMITH_WORKSPACE_ID: WORKSPACE,
        });
        expect(own[0].payload.extra.runtime).toMatchObject({
          library: "langsmith",
          CI_COMMIT_SHA: CI_SHA,
        });
        expect(own[1].payload.error).toBe(`${FORBIDDEN}_raw_error`);
      }
    }
  });

  it.each(["object", "tuple"] as const)(
    "sanitizes %s replica updates without bypassing the destination anonymizer",
    async (kind) => {
      transport = selectedTransport;
      const primary = makeClient();
      const dedicated = makeClient();
      const replicas: RunTreeConfig["replicas"] =
        kind === "object"
          ? [
              {
                projectName: "replica",
                apiUrl: `${API}/dedicated`,
                client: dedicated,
                updates: replicaUpdates(),
              },
            ]
          : [["replica", replicaUpdates()]];
      const initial = { ...config(primary), replicas };
      await createRunTree(initial, "metadata").postRun();
      await flush();
      expectTransport(1);
      await createRunTree(
        { ...config(primary, "error", initial.id), replicas },
        "metadata",
      ).patchRun();
      await flush();
      const operations = expectTransport(2);
      expect(operations.map(({ action }) => action)).toEqual(["post", "patch"]);
      expect(operations[0].payload.session_name).toBe("replica");
      expect(
        requests.every(({ url }) =>
          url.pathname.startsWith(kind === "object" ? "/dedicated/runs" : "/runs"),
        ),
      ).toBe(true);
      expectMetadata(operations[0].payload, "running");
      expectMetadata(operations[1].payload, "error");
    },
  );
});

describe.each(["json-batch", "multipart"] as const)(
  "coalesced %s payloads",
  (selectedTransport) => {
    it("retains the final privacy projection when a patch merges into its create", async () => {
      transport = selectedTransport;
      const client = makeClient();
      const initial = config(client);
      await createRunTree(initial, "metadata").postRun();
      await createRunTree(config(client, "completed", initial.id), "metadata").patchRun();
      await flush();
      const operations = expectTransport(1);
      expect(operations).toHaveLength(1);
      expect(operations[0].action).toBe("post");
      expectMetadata(operations[0].payload, "completed");
      expect(requests[0].raw).not.toContain(FORBIDDEN);
    });
  },
);

describe("file-fed privacy and routing", () => {
  describe.each([false, true])("replica-only defaultMuted=%s", (defaultMuted) => {
    it.each([false, true])(
      "routes through initTracing with explicit replica endpoint=%s and redaction off",
      async (overrideEndpoint) => {
        transport = "json-batch";
        const home = mkdtempSync(join(tmpdir(), "file-replica-routing-"));
        const primaryApi = `${API}/private`;
        const replicaApi = "http://replica.test/override";
        const destination = overrideEndpoint ? replicaApi : primaryApi;
        allowedOrigins.add(new URL(replicaApi).origin);
        try {
          vi.stubEnv("HOME", home);
          vi.stubEnv("USERPROFILE", undefined);
          vi.stubEnv("LANGSMITH_API_KEY", undefined);
          vi.stubEnv("LANGSMITH_ENDPOINT", undefined);
          vi.stubEnv("STATE_FILE", join(home, "state.json"));
          writeFileSync(
            join(home, ".langsmith-plugins.json"),
            JSON.stringify({
              enabled: true,
              defaultMuted,
              api_url: primaryApi,
              project: "file-primary",
              redact: false,
              redact_extra_rules: [{ pattern: SECRET, replace: REDACTED }],
              metadata: { custom: FORBIDDEN, thread_id: FORBIDDEN },
              replicas: [
                {
                  api_key: "replica-key",
                  project: "file-destination",
                  ...(overrideEndpoint ? { api_url: replicaApi } : {}),
                },
              ],
            }),
          );
          const { loadConfig } = await import("./config.js");
          const { initTracing, traceTurn, completeTurnRun, generateDottedOrderSegment } =
            await import("./langsmith.js");
          const { resolveTurnTracingMode } = await import("./tracing-mode.js");
          const cwd = join(home, "project");
          mkdirSync(cwd);
          const loaded = loadConfig({ cwd });
          expect(loaded).toMatchObject({
            enabled: true,
            apiKey: "",
            apiBaseUrl: primaryApi,
            redact: false,
            defaultMuted,
            replicas: [
              {
                apiKey: "replica-key",
                projectName: "file-destination",
                ...(overrideEndpoint ? { apiUrl: replicaApi } : {}),
              },
            ],
          });
          if (!overrideEndpoint) expect(loaded.replicas![0]).not.toHaveProperty("apiUrl");
          const client = initTracing(
            loaded.apiKey,
            loaded.apiBaseUrl,
            loaded.replicas,
            loaded.redact,
            loaded.redactExtraRules,
          );
          expect(client).toBeInstanceOf(Client);
          clients.add(client);
          const tracing = resolveTurnTracingMode(loaded, "fresh");
          expect(tracing).toBe(defaultMuted ? "metadata" : "full");
          const startTime = "2025-01-01T00:00:00Z";
          await traceTurn({
            tracing,
            turn: {
              userContent: `${FORBIDDEN}_input ${SECRET}`,
              userTimestamp: startTime,
              llmCalls: [],
              isComplete: false,
            },
            sessionId: "fresh",
            turnNum: 1,
            project: loaded.project,
            customMetadata: loaded.customMetadata,
          });
          await flush();
          const [post] = expectTransport(1);
          expect(post.action).toBe("post");
          expect(post.payload.session_name).toBe("file-destination");
          const runId = post.payload.id;
          await completeTurnRun({
            tracing,
            sessionId: "fresh",
            runId,
            traceId: runId,
            dottedOrder: generateDottedOrderSegment(startTime, runId),
            startTime,
            project: loaded.project,
            customMetadata: loaded.customMetadata,
            lastAssistantMessage: `${FORBIDDEN}_output ${SECRET}`,
          });
          await flush();
          const operations = expectTransport(2);
          expect(operations.map(({ action }) => action)).toEqual(["post", "patch"]);
          for (const request of requests) {
            expect(request.url.origin).toBe(new URL(destination).origin);
            expect(request.url.pathname).toMatch(
              new RegExp(`^${new URL(destination).pathname}/runs(?:/|$)`),
            );
            expect(request.headers.get("x-api-key")).toBe("replica-key");
            if (defaultMuted) {
              expect(request.raw).not.toContain(FORBIDDEN);
              expect(request.raw).not.toContain(SECRET);
              for (const { action, payload } of request.operations) {
                expectMutedContent(payload, action === "patch");
                expect(payload.extra.metadata).toMatchObject({
                  thread_id: "fresh",
                  ls_agent_type: "root",
                  ls_tracing_mode: "metadata",
                });
              }
            } else {
              expect(request.raw).toContain(FORBIDDEN);
              expect(request.raw).toContain(SECRET);
              expect(request.raw).not.toContain(REDACTED);
            }
          }
        } finally {
          rmSync(home, { recursive: true, force: true });
        }
      },
    );
  });

  it.each([true, false])(
    "file redact=%s cannot bypass muted provenance or replica projection",
    async (redact) => {
      transport = "json-batch";
      const home = mkdtempSync(join(tmpdir(), "file-privacy-"));
      try {
        vi.stubEnv("HOME", home);
        vi.stubEnv("USERPROFILE", undefined);
        vi.stubEnv("LANGSMITH_API_KEY", undefined);
        vi.stubEnv("LANGSMITH_ENDPOINT", undefined);
        mkdirSync(join(home, ".claude"));
        writeFileSync(
          join(home, ".langsmith-plugins.json"),
          JSON.stringify({
            enabled: true,
            defaultMuted: true,
            api_key: "file-key",
            api_url: API,
            project: "file-primary",
            redact,
            redact_extra_rules: [{ pattern: SECRET, replace: REDACTED }],
            metadata: {
              custom: FORBIDDEN,
              ls_model_name: FORBIDDEN,
              ls_agent_type: FORBIDDEN,
              thread_id: FORBIDDEN,
            },
            replicas: [
              {
                api_url: `${API}/file-replica`,
                api_key: "replica-key",
                project: "file-destination",
                updates: replicaUpdates(),
              },
            ],
          }),
        );
        const { loadConfig } = await import("./config.js");
        const { codingAgentMetadata } = await import("./metadata.js");
        const { resolveTurnTracingMode } = await import("./tracing-mode.js");
        const cwd = join(home, "project");
        mkdirSync(cwd);
        const loaded = loadConfig({ cwd });
        expect(loaded).toMatchObject({
          enabled: true,
          apiKey: "file-key",
          apiBaseUrl: API,
          project: "file-primary",
          redact,
        });
        const { initTracing } = await import("./langsmith.js");
        const client = initTracing(
          loaded.apiKey,
          loaded.apiBaseUrl,
          loaded.replicas,
          loaded.redact,
          loaded.redactExtraRules,
        );
        clients.add(client);
        const initial = {
          ...config(client),
          project_name: loaded.project,
          replicas: loaded.replicas,
          extra: {
            metadata: codingAgentMetadata({
              sessionId: "trusted-thread",
              agentType: "root",
              modelName: SECRET,
              base: loaded.customMetadata,
            }),
          },
        };
        const mode = resolveTurnTracingMode(loaded, "fresh");
        expect(mode).toBe("metadata");
        await createRunTree(initial, mode).postRun();
        await flush();
        await createRunTree(
          { ...initial, end_time: "2025-01-01T00:00:01Z", error: FORBIDDEN },
          mode,
        ).patchRun();
        await flush();
        const operations = expectTransport(2);
        expect(operations[0].payload.session_name).toBe("file-destination");
        for (const request of requests) {
          expect(request.url.pathname).toMatch(/^\/file-replica\/runs/);
          expect(request.raw).not.toContain(FORBIDDEN);
          for (const { payload } of request.operations) {
            expect(payload.extra.metadata).toMatchObject({
              thread_id: "trusted-thread",
              ls_agent_type: "root",
              ls_model_name: redact ? REDACTED : SECRET,
            });
            expectMutedContent(payload);
          }
        }
      } finally {
        rmSync(home, { recursive: true, force: true });
      }
    },
  );
});

describe("environment and shared SDK clients", () => {
  it("filters metadata/runtime on a real shared-client fallback", async () => {
    // No getSharedClient mock/private singleton replacement. The default shared
    // client batches; its global fetch is intercepted just like explicit clients.
    transport = "json-batch";
    const initial = {
      ...config(),
      replicas: [["shared-replica", replicaUpdates()]] as RunTreeConfig["replicas"],
    };
    const run = createRunTree(initial, "metadata");
    const shared = RunTree.getSharedClient();
    clients.add(shared);
    expect(run.client).toBe(shared);
    await run.postRun();
    await flush();
    expectTransport(1);
    await createRunTree(
      { ...initial, ...config(undefined, "completed", initial.id) },
      "metadata",
    ).patchRun();
    await flush();
    const operations = expectTransport(2);
    expect(operations.map(({ action }) => action)).toEqual(["post", "patch"]);
    // Shared SDK client has no anonymizer configured; privacy still applies.
    expectMetadata(operations[0].payload, "running", false);
    expectMetadata(operations[1].payload, "completed", false);
  });

  it.each(["plugin", "sdk"] as const)(
    "does not leak %s environment-derived replica updates",
    async (source) => {
      transport = "json-batch";
      const updates = replicaUpdates();
      if (source === "plugin") {
        vi.stubEnv("CC_LANGSMITH_RUNS_ENDPOINTS", JSON.stringify([["env-replica", updates]]));
      } else {
        // SDK endpoint parsing ignores updates, but the entire environment string
        // is also injected as metadata by Client, including on batched PATCH.
        vi.stubEnv(
          "LANGSMITH_RUNS_ENDPOINTS",
          JSON.stringify([
            {
              api_url: `${API}/environment`,
              api_key: "test-only-key",
              project_name: "env-replica",
              updates,
            },
          ]),
        );
      }
      const client = makeClient();
      // Same JSON parsing as loadConfig, without unrelated disk/git discovery.
      const replicas =
        source === "plugin" ? JSON.parse(process.env.CC_LANGSMITH_RUNS_ENDPOINTS!) : undefined;
      const initial = { ...config(client), replicas };
      await createRunTree(initial, "metadata").postRun();
      await flush();
      expectTransport(1);
      await createRunTree(
        { ...config(client, "error", initial.id), replicas },
        "metadata",
      ).patchRun();
      await flush();
      const operations = expectTransport(2);
      expect(operations.map(({ action }) => action)).toEqual(["post", "patch"]);
      expect(operations[0].payload.session_name).toBe("env-replica");
      expectMetadata(operations[0].payload, "running");
      expectMetadata(operations[1].payload, "error");
      for (const request of requests) expect(request.raw).not.toContain(FORBIDDEN);
    },
  );
});

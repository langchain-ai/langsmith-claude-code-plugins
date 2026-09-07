import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Client as SDKClient, RunTreeConfig } from "langsmith";

// No SDK mocks: capture only the HTTP boundary, after SDK enrichment,
// anonymization, batching and (for multipart) splitting into individual parts.
type Transport = "non-batched" | "json-batch" | "multipart";
type Status = "running" | "completed" | "error";
type Payload = Record<string, any>;
type Operation = { action: "post" | "patch"; payload: Payload };
type RequestBody = { url: URL; method: string; raw: string; operations: Operation[] };

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
  expect(url.origin).toBe(API);
  if (url.pathname === "/info") {
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
  requests.push({ url, method, raw, operations });
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

function expectMetadata(payload: Payload, status: Status, redacted = true): void {
  // Soft assertions show post AND patch leaks in one run, rather than hiding
  // replica update failures behind the earlier post's runtime enrichment.
  expect.soft(payload.inputs).toEqual({});
  expect.soft(payload.outputs).toEqual({});
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
  it("projects actual CC_LANGSMITH_METADATA collisions from config through traceTurn to the wire", async () => {
    transport = selectedTransport;
    const collisions = Object.fromEntries(
      Object.keys(allowedMetadata).map((key) => [key, `${FORBIDDEN}_${key}`]),
    );
    collisions.usage_metadata = {
      total_tokens: 999,
      input_token_details: { cache_read: FORBIDDEN },
      custom: FORBIDDEN,
    };
    vi.stubEnv("CC_LANGSMITH_METADATA", JSON.stringify(collisions));
    const { loadConfig } = await import("./config.js");
    const { initTracing, traceTurn } = await import("./langsmith.js");
    const loaded = loadConfig();
    expect(loaded.customMetadata).toMatchObject(collisions);
    const client = initTracing("test-only-key", API, undefined, true, [
      { pattern: SECRET, replace: REDACTED },
    ])!;
    // Exercise all three real transport paths using the actual plugin client.
    client.autoBatchTracing = transport !== "non-batched";
    clients.add(client);
    const turn = {
      userContent: `${FORBIDDEN}_prompt`,
      userTimestamp: "2025-01-01T00:00:00Z",
      promptId: "plugin-turn",
      isComplete: true,
      llmCalls: [
        {
          model: SECRET,
          content: [{ type: "text" as const, text: `${FORBIDDEN}_answer` }],
          usage: {
            input_tokens: 2,
            output_tokens: 3,
            cache_read_input_tokens: 4,
            cache_creation_input_tokens: 1,
          },
          startTime: "2025-01-01T00:00:01Z",
          endTime: "2025-01-01T00:00:02Z",
          toolCalls: [
            {
              tool_use: {
                type: "tool_use" as const,
                id: "tool-id",
                name: "Bash",
                input: { command: FORBIDDEN },
              },
            },
          ],
        },
      ],
    };
    await traceTurn({
      turn,
      sessionId: "plugin-session",
      turnNum: 2,
      project: "legitimate-project",
      runtimeVersion: "plugin-runtime",
      customMetadata: loaded.customMetadata,
      tracingMode: "metadata",
    });
    await flush();
    const operations = expectTransport(requests.length);
    expect(operations.length).toBeGreaterThanOrEqual(3);
    expect(operations.some(({ payload }) => payload.session_name === "legitimate-project")).toBe(
      true,
    );
    for (const { payload } of operations) {
      expect(payload.extra.metadata).toMatchObject({
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
        ls_tracing_mode: "metadata",
      });
      expect(JSON.stringify(payload)).not.toContain(FORBIDDEN);
      expect(JSON.stringify(payload)).not.toContain(SECRET);
      expect(payload.extra.metadata.ls_subagent_id).toBeUndefined();
      expect(payload.extra.metadata.ls_tool_name).toBeUndefined();
    }
    const llm = operations.filter(
      ({ payload }) => payload.extra.metadata.ls_model_name === REDACTED,
    );
    expect(llm.length).toBeGreaterThan(0);
    expect(
      llm.some(({ payload }) => payload.extra.metadata.usage_metadata?.total_tokens === 10),
    ).toBe(true);
    const completed = llm.find(({ payload }) => payload.extra.metadata.usage_metadata)!;
    expect(completed.payload.extra.metadata.usage_metadata).toEqual({
      input_tokens: 7,
      output_tokens: 3,
      total_tokens: 10,
      input_token_details: { cache_read: 4, cache_creation: 1 },
    });
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

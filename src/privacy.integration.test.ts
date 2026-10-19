import { createServer, type Server } from "node:http";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { stableRunId } from "./utils/ids/run-id.js";

vi.mock("./logger.js", () => ({
  warn: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
  initLogger: vi.fn(),
}));

type Request = { method: string; path: string; key?: string; body: Record<string, any> };

const FORBIDDEN = "FORBIDDEN_PRIVACY_MARKER";
const SECRET = "custom-sensitive-model-name";
const REDACTED = "[private-model]";
const MUTED = "[LangSmith system notice: content omitted because tracing is muted.]";
const SESSION = "privacy-session";
const START = "2026-01-01T00:00:00.000Z";
const requests: Request[] = [];
let server: Server;
let api: string;
let home: string;
let cwd: string;

beforeAll(async () => {
  server = createServer((request, response) => {
    let raw = "";
    request.on("data", (chunk) => (raw += chunk));
    request.on("end", () => {
      if (raw) {
        const key = request.headers["x-api-key"] as string | undefined;
        const body = JSON.parse(raw);
        if (request.url!.endsWith("/runs/batch")) {
          const base = request.url!.slice(0, -"/batch".length);
          for (const run of body.post ?? [])
            requests.push({ method: "POST", path: base, key, body: run });
          for (const run of body.patch ?? [])
            requests.push({ method: "PATCH", path: `${base}/${run.id}`, key, body: run });
        } else requests.push({ method: request.method!, path: request.url!, key, body });
      }
      response.setHeader("content-type", "application/json");
      response.end("{}");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  api = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

beforeEach(() => {
  vi.resetModules();
  requests.length = 0;
  home = mkdtempSync(join(tmpdir(), "claude-privacy-"));
  cwd = join(home, "project");
  mkdirSync(cwd);
  for (const key of Object.keys(process.env)) {
    if (/^(LANGCHAIN_|LANGSMITH_|CC_LANGSMITH_)/.test(key)) vi.stubEnv(key, undefined);
  }
  vi.stubEnv("HOME", home);
  vi.stubEnv("USERPROFILE", undefined);
  vi.stubEnv("STATE_FILE", join(home, "state.json"));
  vi.stubEnv("TRACE_TO_LANGSMITH", "true");
  vi.stubEnv("CC_LANGSMITH_INTEGRATION_VERSION", "plugin-version");
  vi.stubEnv("CC_LANGSMITH_REDACT_EXTRA", JSON.stringify([{ pattern: SECRET, replace: REDACTED }]));
});

afterEach(() => vi.unstubAllEnvs());

function primary(): void {
  vi.stubEnv("LANGSMITH_API_KEY", "primary-key");
  vi.stubEnv("LANGSMITH_ENDPOINT", `${api}/primary`);
}

async function engine() {
  const [{ loadConfig }, tracing, { codingAgentMetadata }] = await Promise.all([
    import("./config.js"),
    import("./tracing-engine.js"),
    import("./metadata.js"),
  ]);
  const config = loadConfig({ cwd });
  tracing.initTracing(config, cwd, SESSION);
  return { config, codingAgentMetadata, ...tracing };
}

function run(id: string, metadata: Record<string, any>, extra: Record<string, unknown> = {}) {
  return {
    id,
    name: "privacy integration",
    run_type: "chain",
    start_time: START,
    trace_id: id,
    dotted_order: `20260101T000000000000Z${id}`,
    inputs: { prompt: `${FORBIDDEN}_input ${SECRET}` },
    outputs: { answer: `${FORBIDDEN}_output ${SECRET}` },
    metadata,
    ...extra,
  } as never;
}

const closed = (extra: Record<string, unknown> = {}) => ({
  end_time: "2026-01-01T00:00:01.000Z",
  ...extra,
});

async function deliver(runEngineWorker: (cwd: string, session: string) => Promise<void>) {
  await runEngineWorker(cwd, SESSION);
  return requests;
}

function expectMuted({ method, body }: Request): void {
  if (method === "POST") {
    expect(body.inputs).toEqual({ messages: [{ role: "user", content: MUTED }] });
  } else expect(body.inputs).toBeUndefined();
  if (method === "POST" || body.outputs !== undefined) {
    expect(body.outputs).toEqual({ messages: [{ role: "assistant", content: MUTED }] });
  }
  expect(body.error).toBeUndefined();
  expect(body.extra.metadata.ls_tracing_mode).toBe("metadata");
  expect(body.extra.runtime).toBeUndefined();
  expect(JSON.stringify(body)).not.toContain(FORBIDDEN);
}

describe("muted runs on the wire", () => {
  it("keeps empty usage metadata on a muted post and patch", async () => {
    primary();
    const { captureRun, codingAgentMetadata, runEngineWorker } = await engine();
    const metadata = codingAgentMetadata({
      sessionId: SESSION,
      agentType: "root",

      usageMetadata: {},
    });
    const id = stableRunId(START, "usage");
    await captureRun(run(id, metadata), "metadata");
    await captureRun(run(id, metadata, closed()), "metadata", id, "patch");

    const sent = await deliver(runEngineWorker);

    expect(sent.map(({ method }) => method)).toEqual(["POST", ...sent.slice(1).map(() => "PATCH")]);
    expect(sent.length).toBeGreaterThan(1);
    for (const request of sent) {
      expectMuted(request);
      expect(request.body.extra.metadata.usage_metadata).toEqual({});
    }
  });

  it.each(["base", "runSpecific"] as const)(
    "keeps only plugin-built metadata when custom %s collides with it",
    async (layer) => {
      primary();
      const { captureRun, codingAgentMetadata, runEngineWorker } = await engine();
      const metadata = codingAgentMetadata({
        sessionId: SESSION,
        turnId: "plugin-turn",
        turnNumber: 2,
        agentType: "root",

        runtimeVersion: "plugin-runtime",
        modelName: SECRET,
        usageMetadata: { total_tokens: 10, annotation: SECRET },
        [layer]: {
          thread_id: `${FORBIDDEN}_thread`,
          ls_agent_type: `${FORBIDDEN}_type`,
          ls_model_name: `${FORBIDDEN}_model`,
          usage_metadata: { total_tokens: 999, custom: FORBIDDEN },
          custom: FORBIDDEN,
        },
      });
      const id = stableRunId(START, layer);
      await captureRun(run(id, metadata), "metadata");

      const [post] = await deliver(runEngineWorker);

      expectMuted(post);
      expect(post.body.extra.metadata).toEqual({
        thread_id: SESSION,
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
        usage_metadata: { total_tokens: 10, annotation: REDACTED },
        status: "running",
        ls_tracing_mode: "metadata",
      });
    },
  );

  it("keeps parent identity, ordering and timestamps while hiding the error", async () => {
    primary();
    const { captureRun, codingAgentMetadata, runEngineWorker } = await engine();
    const metadata = codingAgentMetadata({
      sessionId: SESSION,
      agentType: "root",
    });
    const parent = stableRunId(START, "parent");
    const trace = stableRunId(START, "trace");
    const id = stableRunId(START, "child");
    const nested = {
      parent_run_id: parent,
      trace_id: trace,
      dotted_order: `20251231T235959000000Z${parent}.20260101T000000000000Z${id}`,
    };
    await captureRun(run(id, metadata, nested), "metadata");
    await captureRun(
      run(id, metadata, { ...nested, ...closed({ error: `${FORBIDDEN}_failure` }) }),
      "metadata",
      id,
      "patch",
    );

    const [post, patch] = await deliver(runEngineWorker);

    expect(post.body).toMatchObject({ ...nested, id, start_time: START });
    expect(post.body.end_time).toBeUndefined();
    expect(patch.path).toBe(`/primary/runs/${id}`);
    expect(patch.body).toMatchObject({ end_time: "2026-01-01T00:00:01.000Z" });
    expect(patch.body.extra.metadata.status).toBe("error");
    expectMuted(post);
    expectMuted(patch);
  });

  it("sends full content and runtime details only for the full run beside a muted one", async () => {
    primary();
    const { captureRun, codingAgentMetadata, runEngineWorker } = await engine();
    const metadata = codingAgentMetadata({
      sessionId: SESSION,
      agentType: "root",

      base: { custom: FORBIDDEN },
    });
    const muted = stableRunId(START, "muted");
    const full = stableRunId(START, "full");
    await captureRun(run(muted, metadata), "metadata");
    await captureRun(run(full, metadata), "full");

    const sent = await deliver(runEngineWorker);

    const fullPost = sent.find(({ body }) => body.id === full)!;
    expectMuted(sent.find(({ body }) => body.id === muted)!);
    expect(fullPost.body.inputs.prompt).toBe(`${FORBIDDEN}_input ${REDACTED}`);
    expect(fullPost.body.extra.metadata.custom).toBe(FORBIDDEN);
    expect(fullPost.body.extra.runtime.library).toBe("langsmith");
  });
});

describe("replica routing", () => {
  const updates = {
    inputs: { private: `${FORBIDDEN}_replica_input` },
    outputs: { private: `${FORBIDDEN}_replica_output` },
    extra: { metadata: { custom: `${FORBIDDEN}_replica_metadata` } },
  };

  it.each(["object", "tuple"] as const)(
    "routes %s replicas and drops their updates from a muted run",
    async (kind) => {
      primary();
      vi.stubEnv(
        "CC_LANGSMITH_RUNS_ENDPOINTS",
        JSON.stringify(
          kind === "object"
            ? [{ projectName: "replica", apiUrl: `${api}/dedicated`, updates }]
            : [["replica", updates]],
        ),
      );
      const { captureRun, codingAgentMetadata, runEngineWorker } = await engine();
      const metadata = codingAgentMetadata({
        sessionId: SESSION,
        agentType: "root",
      });
      const id = stableRunId(START, kind);
      await captureRun(run(id, metadata), "metadata");
      await captureRun(run(id, metadata, closed()), "metadata", id, "patch");

      const sent = await deliver(runEngineWorker);

      expect(sent.map(({ method }) => method)).toEqual([
        "POST",
        ...sent.slice(1).map(() => "PATCH"),
      ]);
      expect(sent.length).toBeGreaterThan(1);
      expect(sent[0].body.session_name).toBe("replica");
      for (const request of sent) {
        expect(
          request.path.startsWith(kind === "object" ? "/dedicated/runs" : "/primary/runs"),
        ).toBe(true);
        expectMuted(request);
      }
    },
  );

  it("delivers to replicas the SDK reads from LANGSMITH_RUNS_ENDPOINTS", async () => {
    primary();
    vi.stubEnv(
      "LANGSMITH_RUNS_ENDPOINTS",
      JSON.stringify([
        { api_url: `${api}/environment`, api_key: "environment-key", project_name: "env-replica" },
      ]),
    );
    const { captureRun, codingAgentMetadata, runEngineWorker } = await engine();
    const metadata = codingAgentMetadata({
      sessionId: SESSION,
      agentType: "root",
    });
    await captureRun(run(stableRunId(START, "environment"), metadata, closed()), "metadata");

    const [post] = await deliver(runEngineWorker);

    expect(post).toMatchObject({ path: "/environment/runs", key: "environment-key" });
    expect(post.body.session_name).toBe("env-replica");
    expectMuted(post);
  });

  describe.each([false, true])("from a keyless file config with defaultMuted=%s", (muted) => {
    it.each([false, true])(
      "routes to the replica's own key with its endpoint override=%s and redaction off",
      async (override) => {
        writeFileSync(
          join(home, ".langsmith-plugins.json"),
          JSON.stringify({
            enabled: true,
            defaultMuted: muted,
            api_url: `${api}/private`,
            project: "file-primary",
            redact: false,
            metadata: { custom: FORBIDDEN },
            replicas: [
              {
                api_key: "replica-key",
                project: "file-destination",
                ...(override ? { api_url: `${api}/override` } : {}),
              },
            ],
          }),
        );
        vi.stubEnv("CC_LANGSMITH_REDACT_EXTRA", undefined);
        const { captureRun, codingAgentMetadata, config, runEngineWorker } = await engine();
        const { resolveTurnTracingMode } = await import("./tracing-mode.js");
        expect(config).toMatchObject({ apiKey: "", redact: false, defaultMuted: muted });
        const mode = resolveTurnTracingMode(config, SESSION);
        const metadata = codingAgentMetadata({
          sessionId: SESSION,
          agentType: "root",

          modelName: SECRET,
          base: config.customMetadata,
        });
        const id = stableRunId(START, `keyless-${muted}-${override}`);
        await captureRun(run(id, metadata), mode);
        await captureRun(run(id, metadata, closed()), mode, id, "patch");

        const sent = await deliver(runEngineWorker);

        expect(sent.map(({ method }) => method)).toEqual([
          "POST",
          ...sent.slice(1).map(() => "PATCH"),
        ]);
        expect(sent[0].body.session_name).toBe("file-destination");
        for (const request of sent) {
          expect(request.path.startsWith(override ? "/override/runs" : "/private/runs")).toBe(true);
          expect(request.key).toBe("replica-key");
          if (muted) expectMuted(request);
          else expect(JSON.stringify(request.body)).toContain(SECRET);
        }
      },
    );
  });

  it.each([true, false])(
    "keeps a muted run private whatever file redact=%s says, replica updates included",
    async (redact) => {
      writeFileSync(
        join(home, ".langsmith-plugins.json"),
        JSON.stringify({
          enabled: true,
          defaultMuted: true,
          api_key: "file-key",
          api_url: `${api}/primary`,
          project: "file-primary",
          redact,
          redact_extra_rules: [{ pattern: SECRET, replace: REDACTED }],
          metadata: { custom: FORBIDDEN, ls_model_name: FORBIDDEN, thread_id: FORBIDDEN },
          replicas: [
            {
              api_url: `${api}/file-replica`,
              api_key: "replica-key",
              project: "file-destination",
              updates,
            },
          ],
        }),
      );
      vi.stubEnv("CC_LANGSMITH_REDACT_EXTRA", undefined);
      const { captureRun, codingAgentMetadata, config, runEngineWorker } = await engine();
      const { resolveTurnTracingMode } = await import("./tracing-mode.js");
      const mode = resolveTurnTracingMode(config, SESSION);
      expect(mode).toBe("metadata");
      const metadata = codingAgentMetadata({
        sessionId: "trusted-thread",
        agentType: "root",

        modelName: SECRET,
        base: config.customMetadata,
      });
      const id = stableRunId(START, `file-redact-${redact}`);
      await captureRun(run(id, metadata), mode);
      await captureRun(run(id, metadata, closed({ error: FORBIDDEN })), mode, id, "patch");

      const sent = await deliver(runEngineWorker);

      expect(sent.map(({ method }) => method)).toEqual([
        "POST",
        ...sent.slice(1).map(() => "PATCH"),
      ]);
      expect(sent.length).toBeGreaterThan(1);
      for (const request of sent) {
        expect(request.path.startsWith("/file-replica/runs")).toBe(true);
        expectMuted(request);
        expect(request.body.extra.metadata).toMatchObject({
          thread_id: "trusted-thread",
          ls_model_name: redact ? REDACTED : SECRET,
        });
      }
    },
  );
});

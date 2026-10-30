import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGitSandbox } from "./fixtures/git-sandbox.js";
import { noManagedConfigEnv } from "./fixtures/no-managed-config-env.js";

const bundle = fileURLToPath(
  new URL("../plugins/langsmith-tracing/bundle/dispatch.js", import.meta.url),
);

type Run = { id?: string; name?: string; extra?: { metadata?: Record<string, unknown> } };

const sandbox = createGitSandbox("ls skill e2e ");
let server: Server;
let endpoint: string;
const posted: Run[] = [];

async function hook(event: string, payload: Record<string, unknown>): Promise<void> {
  const child = spawn(process.execPath, [bundle, event], {
    cwd: sandbox.root,
    env: {
      ...sandbox.env,
      PATH: process.env.PATH ?? "",
      ...noManagedConfigEnv(),
      TRACE_TO_LANGSMITH: "true",
      LANGSMITH_API_KEY: "lsv2_pt_fake_key_for_tests",
      LANGSMITH_ENDPOINT: endpoint,
      CC_LANGSMITH_PROJECT: "skill-e2e",
      STATE_FILE: join(sandbox.root, "state.json"),
    },
  });
  child.stdin.end(JSON.stringify(payload));
  const status = await new Promise<number | null>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  expect(status).toBe(0);
}

beforeAll(async () => {
  server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      response.setHeader("content-type", "application/json");
      if (request.url?.endsWith("/info")) {
        response.end(JSON.stringify({ batch_ingest_config: { use_multipart_endpoint: false } }));
        return;
      }
      if (body && request.url?.endsWith("/runs/batch")) {
        const batch = JSON.parse(body);
        for (const run of batch.post ?? []) posted.push(run);
        for (const run of batch.patch ?? [])
          Object.assign(posted.find(({ id }) => id === run.id) ?? {}, run);
      } else if (body && request.method === "PATCH") {
        const id = request.url?.split("/").at(-1);
        Object.assign(posted.find((run) => run.id === id) ?? {}, JSON.parse(body));
      } else if (body) posted.push(JSON.parse(body));
      response.end("{}");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  endpoint = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
}, 60_000);

afterAll(async () => {
  await sandbox.waitForWorkers();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  sandbox.remove();
});

describe("a typed skill whose Skill call failed", () => {
  it("names the skill on the typed run only", async () => {
    const session = "failed-skill";
    const path = join(sandbox.root, `${session}.jsonl`);
    const base = { session_id: session, transcript_path: path, cwd: sandbox.root };
    const at = (n: number) => `2025-01-01T00:00:0${n}Z`;
    const assistant = (id: string, content: object[], n: number) => ({
      type: "assistant",
      timestamp: at(n),
      message: {
        id,
        role: "assistant",
        model: "claude-sonnet-4-5-20250929",
        content,
        usage: { input_tokens: 10, output_tokens: 5 },
      },
    });

    await hook("UserPromptSubmit", {
      ...base,
      hook_event_name: "UserPromptSubmit",
      prompt: "/foo",
    });
    await hook("PostToolUse", {
      ...base,
      hook_event_name: "PostToolUse",
      tool_name: "Skill",
      tool_input: { skill: "foo" },
      tool_response: { success: false, error: "Unknown skill: foo" },
      tool_use_id: "skill-call",
    });
    writeFileSync(
      path,
      [
        {
          type: "user",
          timestamp: at(0),
          promptId: "p1",
          message: {
            role: "user",
            content: "<command-message>foo</command-message>\n<command-name>/foo</command-name>",
          },
        },
        {
          type: "user",
          timestamp: at(0),
          promptId: "p1",
          isMeta: true,
          message: {
            role: "user",
            content: [{ type: "text", text: "Base directory for this skill: /s/foo" }],
          },
        },
        assistant(
          "msg_1",
          [{ type: "tool_use", id: "skill-call", name: "Skill", input: { skill: "foo" } }],
          1,
        ),
        {
          type: "user",
          timestamp: at(2),
          message: {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: "skill-call",
                content: "Unknown skill: foo",
                is_error: true,
              },
            ],
          },
        },
        assistant("msg_2", [{ type: "text", text: "Could not load it." }], 3),
      ]
        .map((line) => JSON.stringify(line))
        .join("\n"),
    );
    await hook("Stop", { ...base, hook_event_name: "Stop", last_assistant_message: "done" });

    await vi.waitFor(
      () => {
        const names = posted
          .filter((run) => run.name === "Skill")
          .map((run) => run.extra?.metadata?.ls_skill_name);
        expect(names).toHaveLength(2);
        expect(names.filter(Boolean)).toEqual(["foo"]);
      },
      { timeout: 30_000, interval: 100 },
    );
  }, 120_000);
});

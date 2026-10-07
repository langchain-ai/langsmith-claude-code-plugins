import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createGitSandbox } from "./fixtures/git-sandbox.js";
import { USER_PROMPT_TURN_NAME } from "./constants.js";

// Claude Code runs the built bundle, so drive that, one real process per hook.
const bundle = fileURLToPath(new URL("../bundle/dispatch.js", import.meta.url));

type Run = { name?: string; extra?: { metadata?: Record<string, unknown> } };

const sandbox = createGitSandbox("ls repo e2e ");
const alpha = sandbox.makeRepo("alpha repo", "trunk-a", "Alpha Owner", "git@github.com:acme/a.git");
const beta = sandbox.makeRepo("beta repo", "trunk-b", "Beta Owner", "https://gitlab.com/acme/b");
const home = sandbox.makeRepo(
  "home folder",
  "trunk-home",
  "Private Person",
  "git@github.com:private/dotfiles.git",
);

let server: Server;
let endpoint: string;
const posted: Run[] = [];

async function hook(event: string, payload: Record<string, unknown>, home?: string): Promise<void> {
  const child = spawn(process.execPath, [bundle, event], {
    cwd: String(payload.cwd ?? alpha),
    env: {
      ...sandbox.env,
      ...(home ? { HOME: home, USERPROFILE: home } : {}),
      PATH: process.env.PATH ?? "",
      TRACE_TO_LANGSMITH: "true",
      LANGSMITH_API_KEY: "lsv2_pt_fake_key_for_tests",
      LANGSMITH_ENDPOINT: endpoint,
      CC_LANGSMITH_PROJECT: "repo-attribution-e2e",
      STATE_FILE: join(sandbox.root, "state.json"),
    },
  });
  child.stdin.end(JSON.stringify(payload));
  let stderr = "";
  child.stderr.setEncoding("utf-8");
  child.stderr.on("data", (chunk: string) => (stderr += chunk));
  const status = await new Promise<number | null>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  expect(status, stderr).toBe(0);
}

/** Two calls only the Stop hook traces: one reaching into the other repository, one relative to the session's own. */
function transcript(reaching: string, editing = "seed.txt"): string {
  const calls = [
    { type: "tool_use", id: "reaching", name: "Glob", input: { path: reaching } },
    { type: "tool_use", id: "relative", name: "Edit", input: { file_path: editing } },
  ];
  const results = calls.map((c) => ({ type: "tool_result", tool_use_id: c.id, content: "ok" }));
  const at = (n: number) => `2025-01-01T00:00:0${n}Z`;
  return [
    { type: "user", message: { role: "user", content: "find" }, timestamp: at(0) },
    {
      type: "assistant",
      timestamp: at(1),
      message: {
        id: "msg_1",
        role: "assistant",
        model: "claude-sonnet-4-5-20250929",
        content: [{ type: "text", text: "Looking." }, ...calls],
        usage: { input_tokens: 10, output_tokens: 5 },
      },
    },
    { type: "user", timestamp: at(2), message: { role: "user", content: results } },
  ]
    .map((message) => JSON.stringify(message))
    .join("\n");
}

function toolRun(name: string): Record<string, unknown> {
  const runs = posted.filter((run) => run.name === name);
  expect(runs, `exactly one ${name} run`).toHaveLength(1);
  return runs[0].extra?.metadata ?? {};
}

const prompt = (base: Record<string, unknown>, home?: string) =>
  hook("UserPromptSubmit", { ...base, hook_event_name: "UserPromptSubmit", prompt: "go" }, home);
const stop = (base: Record<string, unknown>, home?: string) =>
  hook("Stop", { ...base, hook_event_name: "Stop", last_assistant_message: "done" }, home);

beforeEach(() => (posted.length = 0));

beforeAll(async () => {
  // Nothing leaves this machine: every run lands here instead of LangSmith.
  server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      response.setHeader("content-type", "application/json");
      if (request.url?.endsWith("/info")) {
        response.end(JSON.stringify({ batch_ingest_config: { use_multipart_endpoint: false } }));
        return;
      }
      if (body) {
        const parsed = JSON.parse(body);
        // Patches carry the turn's final metadata, so a post-only capture cannot see a close.
        const batched = [...(parsed.post ?? []), ...(parsed.patch ?? [])];
        posted.push(...(batched.length > 0 ? batched : Array.isArray(parsed) ? parsed : [parsed]));
      }
      response.end("{}");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  endpoint = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
}, 60_000);

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  sandbox.remove();
});

describe("a turn working across repositories", () => {
  it("keeps every tool call on the repository the session itself resolved", async () => {
    const session = "repo-attribution";
    const path = join(sandbox.root, `${session}.jsonl`);
    // The session starts inside the first repository and reaches into the second.
    const base = { session_id: session, transcript_path: path, cwd: alpha };

    await prompt(base);
    await hook("PostToolUse", {
      ...base,
      hook_event_name: "PostToolUse",
      tool_name: "Read",
      tool_input: { file_path: join(beta, "seed.txt") },
      tool_response: { ok: true },
      tool_use_id: `${session}-tool-0`,
    });
    writeFileSync(path, transcript(join(beta, "seed.txt")));
    await stop(base);

    const inAlpha = {
      repository_name: "acme/a",
      git_branch: "trunk-a",
      ls_attribution_identifier: "Alpha Owner",
    };
    for (const name of ["Read", "Glob", "Edit"]) expect(toolRun(name)).toMatchObject(inAlpha);
    expect(JSON.stringify(posted)).not.toContain("acme/b");
    expect(JSON.stringify(posted)).not.toContain("Beta Owner");
  }, 120_000);

  it("fills a turn that resolved no repository from its first tool", async () => {
    const session = "turn-rollup";
    const path = join(sandbox.root, `${session}.jsonl`);
    // Started outside every repository, and prompted normally, so UserPromptSubmit opens the turn run.
    const base = { session_id: session, transcript_path: path, cwd: sandbox.root };

    await prompt(base);
    writeFileSync(path, transcript(join(beta, "seed.txt"), join(alpha, "seed.txt")));
    await stop(base);

    const inBeta = { repository_name: "acme/b", ls_attribution_identifier: "Beta Owner" };
    const turnRuns = posted.filter((run) => run.name === USER_PROMPT_TURN_NAME);
    expect(turnRuns.at(-1)?.extra?.metadata).toMatchObject(inBeta);
    expect(toolRun("Glob")).toMatchObject(inBeta);
    expect(toolRun("Edit")).toMatchObject(inBeta);
    expect(JSON.stringify(posted)).not.toContain("acme/a");
  }, 120_000);

  it("sends nothing from a home folder that is a repository of its own", async () => {
    const session = "private-home";
    const path = join(sandbox.root, `${session}.jsonl`);
    const base = { session_id: session, transcript_path: path, cwd: alpha };

    await prompt(base, home);
    await hook(
      "PostToolUse",
      {
        ...base,
        hook_event_name: "PostToolUse",
        tool_name: "Read",
        tool_input: { file_path: join(home, "seed.txt") },
        tool_response: { ok: true },
        tool_use_id: `${session}-tool-0`,
      },
      home,
    );
    writeFileSync(path, transcript(join(home, "seed.txt")));
    await stop(base, home);

    const wire = JSON.stringify(posted);
    expect(posted.length).toBeGreaterThan(0);
    for (const secret of ["private/dotfiles", "trunk-home", "Private Person"]) {
      expect(wire).not.toContain(secret);
    }
    for (const name of ["Read", "Glob", "Edit"]) {
      expect(toolRun(name)).toMatchObject({ repository_name: "acme/a", git_branch: "trunk-a" });
    }
  }, 120_000);
});

import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ inputs: [] as Record<string, unknown>[] }));
vi.mock("../utils/stdin.js", () => ({ readStdin: async () => h.inputs.shift() }));
vi.mock("../logger.js", () => ({
  warn: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
  initLogger: vi.fn(),
}));
vi.mock("@langchain/plugins-base/plugin", async (original) => ({
  ...(await original<typeof import("@langchain/plugins-base/plugin")>()),
  launchDetachedWorker: async () => 1,
}));

const SESSION = "11111111-2222-3333-4444-555555555555";
const HOOKS = {
  UserPromptSubmit: "./user-prompt-submit.js",
  PreToolUse: "./pre-tool-use.js",
  PostToolUse: "./post-tool-use.js",
  Stop: "./stop.js",
} as const;
const NOTIFICATION =
  "<task-notification>\n<task-id>bgtask1</task-id>\n<status>completed</status>\n<summary>PUBLIC_NOTIFICATION</summary>\n</task-notification>";
const BASH = { command: "cat SECRET_BASH_COMMAND" };

const uploads: unknown[] = [];
let server: Server;
let api: string;
let cwd: string;
let transcript: string;
let messageCount = 0;

beforeAll(async () => {
  server = createServer((request, response) => {
    let raw = "";
    request.on("data", (chunk) => (raw += chunk));
    request.on("end", () => {
      if (raw) uploads.push(JSON.parse(raw));
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
  uploads.length = 0;
  const home = mkdtempSync(join(tmpdir(), "claude-muted-turn-"));
  cwd = join(home, "project");
  mkdirSync(cwd);
  transcript = join(home, "transcript.jsonl");
  writeFileSync(transcript, "");
  for (const key of Object.keys(process.env)) {
    if (/^(LANGCHAIN_|LANGSMITH_|CC_LANGSMITH_)/.test(key)) vi.stubEnv(key, undefined);
  }
  vi.stubEnv("HOME", home);
  vi.stubEnv("USERPROFILE", undefined);
  vi.stubEnv("STATE_FILE", join(home, "state.json"));
  vi.stubEnv("TRACE_TO_LANGSMITH", "true");
  vi.stubEnv("LANGSMITH_API_KEY", "fake-test-key");
  vi.stubEnv("LANGSMITH_ENDPOINT", api);
});

afterEach(() => vi.unstubAllEnvs());

async function hook(name: keyof typeof HOOKS, payload: Record<string, unknown>): Promise<void> {
  h.inputs.push({
    hook_event_name: name,
    session_id: SESSION,
    transcript_path: transcript,
    cwd,
    permission_mode: "default",
    ...payload,
  });
  const { main } = (await import(HOOKS[name])) as { main: () => Promise<void> };
  return main();
}

function line(entry: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const uuid = randomUUID();
  appendFileSync(
    transcript,
    `${JSON.stringify({ sessionId: SESSION, timestamp, uuid, ...entry })}\n`,
  );
}

function user(content: unknown, promptId?: string): void {
  line({ type: "user", message: { role: "user", content }, promptId });
}

function assistant(content: unknown[], stopReason: string, promptId?: string): void {
  const usage = { input_tokens: 10, output_tokens: 5 };
  const id = `msg_${++messageCount}`;
  const message = { id, role: "assistant", model: "claude-sonnet-4-5", content, usage };
  line({ type: "assistant", message: { ...message, stop_reason: stopReason }, promptId });
}

async function prompt(text: string, promptId?: string): Promise<void> {
  user(text, promptId);
  await hook("UserPromptSubmit", { prompt: text });
}

function bashLines(): void {
  assistant([{ type: "tool_use", id: "toolu_bash", name: "Bash", input: BASH }], "tool_use", "A");
  user([{ type: "tool_result", tool_use_id: "toolu_bash", content: "SECRET_BASH_OUTPUT" }], "A");
}

async function bashHooks(): Promise<void> {
  const tool = { tool_name: "Bash", tool_input: BASH, tool_use_id: "toolu_bash" };
  await hook("PreToolUse", tool);
  await hook("PostToolUse", { ...tool, tool_response: { stdout: "SECRET_BASH_OUTPUT" } });
}

async function finishMutedTurn(): Promise<void> {
  assistant([{ type: "text", text: "SECRET_ANSWER" }], "end_turn", "A");
  await hook("Stop", { stop_hook_active: false, last_assistant_message: "SECRET_ANSWER" });
}

async function drain(): Promise<void> {
  const { runEngineWorker } = await import("../tracing-engine.js");
  await runEngineWorker(cwd, SESSION);
}

async function uploaded(): Promise<string> {
  await drain();
  return JSON.stringify(uploads);
}

async function openNotificationThenMute(): Promise<void> {
  await prompt(NOTIFICATION);
  assistant([{ type: "text", text: "PUBLIC_REPLY" }], "end_turn");
  await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:mute" });
}

it("keeps an unmuted turn whole when a task notification lands mid-turn", async () => {
  await prompt("PUBLIC_PROMPT", "A");
  assistant([{ type: "tool_use", id: "toolu_bash", name: "Bash", input: {} }], "tool_use", "A");
  user([{ type: "tool_result", tool_use_id: "toolu_bash", content: "PUBLIC_BASH" }], "A");
  user(NOTIFICATION);
  const read = { file_path: "/repo/PUBLIC_FILE" };
  assistant([{ type: "tool_use", id: "toolu_read", name: "Read", input: read }], "tool_use", "A");
  user([{ type: "tool_result", tool_use_id: "toolu_read", content: "PUBLIC_CONTENTS" }], "A");
  assistant([{ type: "text", text: "PUBLIC_ANSWER" }], "end_turn", "A");
  await hook("Stop", { stop_hook_active: false, last_assistant_message: "PUBLIC_ANSWER" });

  const sent = await uploaded();

  expect(sent).toContain("PUBLIC_NOTIFICATION");
  expect(sent).toContain("PUBLIC_CONTENTS");
});

it("keeps a turn whose prompt reaches the transcript after its hook fires", async () => {
  await hook("UserPromptSubmit", { prompt: "PUBLIC_PROMPT" });
  user([{ type: "text", text: "PUBLIC_PROMPT" }], "A");
  assistant([{ type: "text", text: "PUBLIC_ANSWER" }], "end_turn", "A");
  await hook("Stop", { stop_hook_active: false, last_assistant_message: "PUBLIC_ANSWER" });

  expect(await uploaded()).toContain('"run_type":"llm"');
});

it("keeps a full turn's own content when the user mutes partway through it", async () => {
  await prompt("PUBLIC_PROMPT", "A");
  const tool = { tool_name: "Bash", tool_input: { command: "ls" }, tool_use_id: "toolu_bash" };
  assistant([{ type: "tool_use", id: "toolu_bash", name: "Bash", input: {} }], "tool_use", "A");
  await hook("PreToolUse", tool);
  await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:mute" });
  user([{ type: "tool_result", tool_use_id: "toolu_bash", content: "PUBLIC_BASH" }], "A");
  await hook("PostToolUse", { ...tool, tool_response: { stdout: "PUBLIC_BASH" } });
  assistant([{ type: "text", text: "PUBLIC_ANSWER" }], "end_turn", "A");
  await hook("Stop", { stop_hook_active: false, last_assistant_message: "PUBLIC_ANSWER" });

  const sent = await uploaded();

  expect(sent).toContain('"stdout":"PUBLIC_BASH"');
  expect(sent).toContain('"content":"PUBLIC_ANSWER"');
});

it("keeps a turn whose prompt lands after a notification already on disk", async () => {
  user(NOTIFICATION);
  await hook("UserPromptSubmit", { prompt: "PUBLIC_PROMPT" });
  user("PUBLIC_PROMPT", "A");
  assistant([{ type: "text", text: "PUBLIC_ANSWER" }], "end_turn", "A");
  await hook("Stop", { stop_hook_active: false, last_assistant_message: "PUBLIC_ANSWER" });

  expect(await uploaded()).toContain('"run_type":"llm"');
});

it("keeps a slash command turn whose prompt lands after a notification already on disk", async () => {
  await prompt("FIRST_PROMPT", "Z");
  assistant([{ type: "text", text: "FIRST_ANSWER" }], "end_turn", "Z");
  await hook("Stop", { stop_hook_active: false, last_assistant_message: "FIRST_ANSWER" });
  user(NOTIFICATION);
  await hook("UserPromptSubmit", { prompt: "/review PUBLIC" });
  user("<command-message>review</command-message>\n<command-args>PUBLIC</command-args>", "A");
  assistant([{ type: "text", text: "PUBLIC_ANSWER" }], "end_turn", "A");
  await hook("Stop", { stop_hook_active: false, last_assistant_message: "PUBLIC_ANSWER" });

  expect(await uploaded()).toContain("PUBLIC_ANSWER");
});

it("uploads the next turn after the transcript loses lines it already read", async () => {
  await prompt("FIRST_PROMPT", "Z");
  assistant([{ type: "text", text: "FIRST_ANSWER" }], "end_turn", "Z");
  await hook("Stop", { stop_hook_active: false, last_assistant_message: "FIRST_ANSWER" });
  await drain();
  uploads.length = 0;
  writeFileSync(transcript, readFileSync(transcript, "utf-8").split("\n").slice(1).join("\n"));
  await prompt("SECOND_PROMPT", "B");
  assistant([{ type: "text", text: "SECOND_THOUGHT" }], "end_turn", "B");
  assistant([{ type: "text", text: "SECOND_ANSWER" }], "end_turn", "B");
  await hook("Stop", { stop_hook_active: false, last_assistant_message: "SECOND_ANSWER" });

  const sent = await uploaded();

  expect(sent).toContain("SECOND_PROMPT");
  expect(sent).toContain("SECOND_THOUGHT");
  expect(sent).not.toContain("FIRST_ANSWER");
});

describe("a muted turn after an open full turn", () => {
  it("keeps the muted turn out of the earlier turn when that turn is closed as interrupted", async () => {
    await openNotificationThenMute();
    await prompt("SECRET_PROMPT", "A");
    bashLines();
    await bashHooks();
    await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:unmute" });
    await finishMutedTurn();

    const sent = await uploaded();

    expect(sent).toContain("PUBLIC_NOTIFICATION");
    expect(sent).toContain('"name":"Bash"');
    expect(sent).not.toContain("SECRET");
  });

  it("keeps the muted turn out of the earlier turn's Stop when its lines land first", async () => {
    await openNotificationThenMute();
    user("SECRET_PROMPT", "A");
    bashLines();
    await hook("Stop", { stop_hook_active: false, last_assistant_message: "PUBLIC_REPLY" });
    await hook("UserPromptSubmit", { prompt: "SECRET_PROMPT" });
    await bashHooks();
    await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:unmute" });
    await finishMutedTurn();

    const sent = await uploaded();

    expect(sent).toContain("PUBLIC_REPLY");
    expect(sent).toContain('"name":"Bash"');
    expect(sent).not.toContain("SECRET");
  });

  it("keeps the muted turn out of the earlier turn's Stop when an interrupted close read it first", async () => {
    await openNotificationThenMute();
    user("SECRET_PROMPT", "A");
    bashLines();
    const opened = hook("UserPromptSubmit", { prompt: "SECRET_PROMPT" });
    const stopped = hook("Stop", {
      stop_hook_active: false,
      last_assistant_message: "PUBLIC_REPLY",
    });
    await Promise.all([opened, stopped]);
    await bashHooks();
    await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:unmute" });
    await finishMutedTurn();

    const sent = await uploaded();

    expect(sent).toContain("PUBLIC_REPLY");
    expect(sent).not.toContain("SECRET");
  });

  it("keeps the muted turn out of a second notification turn the first one was closed past", async () => {
    await prompt(NOTIFICATION);
    await prompt(NOTIFICATION.replace("bgtask1", "bgtask2"));
    assistant([{ type: "text", text: "PUBLIC_REPLY" }], "end_turn");
    await drain();
    await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:mute" });
    await prompt("SECRET_PROMPT", "A");
    bashLines();
    await bashHooks();
    await finishMutedTurn();

    expect(await uploaded()).not.toContain("SECRET");
  });

  it("keeps a muted notification turn out of the earlier turn's Stop", async () => {
    await prompt("PUBLIC_PROMPT", "P");
    assistant([{ type: "text", text: "PUBLIC_REPLY" }], "end_turn", "P");
    user(NOTIFICATION);
    await hook("Stop", { stop_hook_active: false, last_assistant_message: "PUBLIC_REPLY" });
    await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:mute" });
    await hook("UserPromptSubmit", { prompt: NOTIFICATION });
    assistant([{ type: "text", text: "SECRET_ANSWER" }], "end_turn");
    await drain();
    await hook("Stop", { stop_hook_active: false, last_assistant_message: "SECRET_ANSWER" });

    const sent = await uploaded();

    expect(sent).toContain("PUBLIC_REPLY");
    expect(sent).not.toContain("SECRET");
  });

  it("keeps the muted turn out of a notification turn whose prompt an earlier Stop already read", async () => {
    await prompt("PUBLIC_PROMPT", "P");
    assistant([{ type: "text", text: "PUBLIC_REPLY" }], "end_turn", "P");
    user(NOTIFICATION);
    await hook("Stop", { stop_hook_active: false, last_assistant_message: "PUBLIC_REPLY" });
    await drain();
    await hook("UserPromptSubmit", { prompt: NOTIFICATION });
    await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:mute" });
    await prompt("SECRET_PROMPT", "A");
    bashLines();
    await bashHooks();
    await finishMutedTurn();

    expect(await uploaded()).not.toContain("SECRET");
  });

  it("keeps the muted turn out of the earlier turn after the transcript is rewritten shorter", async () => {
    await prompt(`PUBLIC_PROMPT ${"x".repeat(4096)}`, "P");
    assistant([{ type: "text", text: "PUBLIC_REPLY" }], "end_turn", "P");
    writeFileSync(transcript, readFileSync(transcript, "utf-8").replace("x".repeat(4096), "x"));
    await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:mute" });
    user("SECRET_PROMPT", "A");
    bashLines();
    await bashHooks();
    await finishMutedTurn();

    const sent = await uploaded();

    expect(sent).toContain("PUBLIC_REPLY");
    expect(sent).not.toContain("SECRET");
  });

  it("uploads only metadata for a muted prompt delivered into the open turn without its own hook", async () => {
    await openNotificationThenMute();
    user("SECRET_PROMPT", "A");
    bashLines();
    await bashHooks();
    await finishMutedTurn();

    const sent = await uploaded();

    expect(sent).toContain('"name":"Bash"');
    expect(sent).not.toContain("SECRET");
  });

  it("keeps a muted prompt with no prompt id out of an open turn with none either, even after unmuting", async () => {
    await prompt("PUBLIC_PROMPT");
    assistant([{ type: "text", text: "PUBLIC_REPLY" }], "end_turn");
    await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:mute" });
    user("SECRET_PROMPT");
    assistant([{ type: "tool_use", id: "toolu_bash", name: "Bash", input: BASH }], "tool_use");
    user([{ type: "tool_result", tool_use_id: "toolu_bash", content: "SECRET_BASH_OUTPUT" }]);
    await bashHooks();
    await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:unmute" });
    assistant([{ type: "text", text: "SECRET_ANSWER" }], "end_turn");
    await hook("Stop", { stop_hook_active: false, last_assistant_message: "SECRET_ANSWER" });

    const sent = await uploaded();

    expect(sent).toContain("PUBLIC_REPLY");
    expect(sent).not.toContain("SECRET");
  });

  it.each([
    ["a prompt", () => prompt("PUBLIC_PROMPT", "P")],
    ["a task notification", () => prompt(NOTIFICATION)],
  ])(
    "uploads only metadata for a muted prompt with no prompt id delivered into a turn opened by %s",
    async (_, open) => {
      await open();
      assistant([{ type: "text", text: "PUBLIC_REPLY" }], "end_turn", "P");
      await hook("UserPromptSubmit", { prompt: "/langsmith-tracing:mute" });
      user("SECRET_PROMPT");
      assistant([{ type: "tool_use", id: "toolu_bash", name: "Bash", input: BASH }], "tool_use");
      user([{ type: "tool_result", tool_use_id: "toolu_bash", content: "SECRET_BASH_OUTPUT" }]);
      await bashHooks();
      assistant([{ type: "text", text: "SECRET_ANSWER" }], "end_turn");
      await hook("Stop", { stop_hook_active: false, last_assistant_message: "SECRET_ANSWER" });

      const sent = await uploaded();

      expect(sent).toContain("PUBLIC_REPLY");
      expect(sent).not.toContain("SECRET");
    },
  );
});

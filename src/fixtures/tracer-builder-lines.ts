import type { HookNote, RunPatch, RunPost } from "@langchain/plugins-base/tracer";

export function recordingSink() {
  const posts: RunPost[] = [];
  const patches: RunPatch[] = [];
  const post = (run: RunPost) => posts.push(run);
  return { posts, patches, sink: { post, patch: (run: RunPatch) => patches.push(run) } };
}

export function note(event: string, fields: Partial<HookNote> = {}): HookNote {
  const writer = { destinations: [], redact: false };
  return { integration: "claude-code", event, sessionId: "session", writer, ...fields };
}

export const at = (second: number) => new Date(Date.UTC(2026, 10, 13, 12, 0, second)).toISOString();

export const prompt = (uuid: string, second: number, content: string, promptId = uuid) => {
  const message = { role: "user", content };
  return { type: "user", uuid, promptId, timestamp: at(second), message };
};

export const assistant = (uuid: string, second: number, content: unknown[], stop?: string) => ({
  type: "assistant",
  uuid,
  timestamp: at(second),
  message: {
    id: `msg-${uuid}`,
    model: "claude-test",
    content,
    stop_reason: stop ?? null,
    usage: { input_tokens: 1, output_tokens: 1 },
  },
});

export const toolUse = (id: string, name = "Bash", input: unknown = { command: "ls" }) => ({
  type: "tool_use",
  id,
  name,
  input,
});

export const toolResult = (uuid: string, second: number, toolUseId: string, result?: unknown) => ({
  type: "user",
  uuid,
  timestamp: at(second),
  message: {
    role: "user",
    content: [{ type: "tool_result", tool_use_id: toolUseId, content: "done" }],
  },
  ...(result === undefined ? {} : { toolUseResult: result }),
});

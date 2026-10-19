import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import * as fsPromises from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getThreadTracingMode,
  parseTracingCommand,
  setThreadTracingMode,
  tracingPolicyPath,
} from "./tracing-policy.js";

const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  init: vi.fn(),
  stdin: vi.fn(),
  tracing: vi.fn(),
  state: vi.fn(),
  links: vi.fn(),
}));
vi.mock("node:fs/promises", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:fs/promises")>()),
}));
vi.mock("./thread-link.js", () => ({ describeThreadLinks: mocks.links }));
vi.mock("./config.js", () => ({ loadConfig: mocks.config }));
vi.mock("./utils/hook-init.js", () => ({ initHook: mocks.init, expandHome: (p: string) => p }));
vi.mock("./utils/stdin.js", () => ({ readStdin: mocks.stdin }));
vi.mock("./logger.js", () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }));
vi.mock("./tracing-engine.js", () => ({
  initTracing: mocks.tracing,
  captureRun: vi.fn(),
  settledFromTurn: async (base: unknown) => base,
}));
vi.mock("./langsmith.js", () => ({
  closeInterruptedTurn: vi.fn(),
  generateDottedOrderSegment: vi.fn(),
  parseDottedOrder: vi.fn(),
}));
vi.mock("./state.js", () => ({
  loadState: mocks.state,
  atomicUpdateState: mocks.state,
  getSessionState: mocks.state,
}));
vi.mock("./finalize.js", () => ({ finalizeNotificationChain: vi.fn() }));
vi.mock("./transcript.js", () => ({ getTranscriptEndLine: vi.fn(), readRuntimeVersion: vi.fn() }));
vi.mock("./metadata.js", () => ({ codingAgentMetadata: vi.fn() }));

let dir: string;
let state: string;
let policy: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "tracing-policy-"));
  state = join(dir, "state.json");
  policy = tracingPolicyPath(state);
  vi.clearAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});

type FsFault = "directory sync" | "temp writeFile";

// Use real files/rename so assertions cover the effective on-disk preference.
function injectFsFault(fault: FsFault) {
  const originalOpen = fsPromises.open;
  vi.spyOn(fsPromises, "open").mockImplementation(async (path, flags, mode) => {
    const handle = await originalOpen(path, flags, mode);
    const [kind, method] = fault.split(" ") as ["directory" | "temp", "sync" | "writeFile"];
    if ((String(path) === dir ? "directory" : "temp") === kind) {
      vi.spyOn(handle, method).mockImplementation(async () => {
        throw new Error(`${fault} failed`);
      });
    }
    return handle;
  });
}

describe("configured default and thread overrides", () => {
  it.each([true, false])(
    "uses defaultMuted=%s without creating a missing policy",
    (defaultMuted) => {
      expect(getThreadTracingMode(state, "new", defaultMuted)).toBe(
        defaultMuted ? "metadata" : "full",
      );
      expect(readdirSync(dir)).toEqual([]);
    },
  );

  it("uses the current configured default for threads without overrides", async () => {
    await setThreadTracingMode(state, "other", "full");
    const raw = readFileSync(policy, "utf8");
    expect(JSON.parse(raw)).toEqual({ threads: { other: "full" } });
    for (const defaultMuted of [true, false, true]) {
      expect(getThreadTracingMode(state, "new", defaultMuted)).toBe(
        defaultMuted ? "metadata" : "full",
      );
      expect(readFileSync(policy, "utf8")).toBe(raw);
    }
  });

  it("explicit unmute wins configured mute; explicit mute survives configured unmute", async () => {
    await setThreadTracingMode(state, "unmuted", "full");
    await setThreadTracingMode(state, "muted", "metadata");
    for (const defaultMuted of [true, false]) {
      expect(getThreadTracingMode(state, "unmuted", defaultMuted)).toBe("full");
      expect(getThreadTracingMode(state, "muted", defaultMuted)).toBe("metadata");
    }
  });

  it("uses only configuration when the override map is empty", () => {
    const raw = JSON.stringify({ threads: {} });
    writeFileSync(policy, raw);
    expect(getThreadTracingMode(state, "new", true)).toBe("metadata");
    expect(getThreadTracingMode(state, "new", false)).toBe("full");
    expect(readFileSync(policy, "utf8")).toBe(raw);
  });
});

describe("standalone tracing preference", () => {
  it.each([
    ["langsmith_state.json", "langsmith_state.privacy.json"],
    ["custom.json", "custom.privacy.json"],
    ["custom", "custom.privacy.json"],
    ["custom.txt", "custom.txt.privacy.json"],
    ["custom.json.backup", "custom.json.backup.privacy.json"],
  ])("uses the exact preference path for %s", async (stateName, policyName) => {
    const statePath = join(dir, stateName);
    const expectedPolicyPath = join(dir, policyName);
    expect(tracingPolicyPath(statePath)).toBe(expectedPolicyPath);
    await setThreadTracingMode(statePath, "a", "metadata");
    expect(readdirSync(dir)).toEqual([policyName]);
    expect(JSON.parse(readFileSync(expectedPolicyPath, "utf8"))).toEqual({
      threads: { a: "metadata" },
    });
    expect(getThreadTracingMode(statePath, "a")).toBe("metadata");
  });

  it("defaults absent/new healthy threads to full and persists only selected threads", async () => {
    expect(getThreadTracingMode(state, "new")).toBe("full");
    await setThreadTracingMode(state, "a", "metadata");
    expect(getThreadTracingMode(state, "a")).toBe("metadata");
    expect(getThreadTracingMode(state, "b")).toBe("full");
    await setThreadTracingMode(state, "b", "metadata");
    await setThreadTracingMode(state, "a", "full");
    expect(getThreadTracingMode(state, "a")).toBe("full");
    expect(getThreadTracingMode(state, "b")).toBe("metadata");
    expect(statSync(policy).mode & 0o777).toBe(0o600);
    expect(readdirSync(dir)).toEqual(["state.privacy.json"]);
  });

  it("creates missing parents and leaves existing tracing state untouched", async () => {
    writeFileSync(state, "current interrupted turn: do not reset");
    await setThreadTracingMode(state, "a", "metadata");
    expect(readFileSync(state, "utf8")).toBe("current interrupted turn: do not reset");
    rmSync(state); // Simulate pruning/deletion independently of preferences.
    expect(getThreadTracingMode(state, "a")).toBe("metadata");
    const nested = join(dir, "nested", "deep", "state.json");
    await setThreadTracingMode(nested, "a", "metadata");
    expect(getThreadTracingMode(nested, "a")).toBe("metadata");
    expect(existsSync(nested)).toBe(false);
  });

  it.each(["__proto__", "constructor", "toString"])("handles session key %s", async (id) => {
    expect(getThreadTracingMode(state, id)).toBe("full");
    await setThreadTracingMode(state, id, "metadata");
    expect(getThreadTracingMode(state, id)).toBe("metadata");
  });

  it("saves an override without losing other explicit preferences", async () => {
    writeFileSync(policy, JSON.stringify({ threads: { a: "metadata" } }));
    await setThreadTracingMode(state, "b", "full");
    expect(JSON.parse(readFileSync(policy, "utf8"))).toEqual({
      threads: { a: "metadata", b: "full" },
    });
    expect(getThreadTracingMode(state, "unknown", true)).toBe("metadata");
    expect(getThreadTracingMode(state, "unknown", false)).toBe("full");
    expect(getThreadTracingMode(state, "a", false)).toBe("metadata");
    expect(getThreadTracingMode(state, "b", true)).toBe("full");
  });

  it.each([
    "null",
    "{}",
    '{"threads":[]}',
    '{"threads":{"a":"metadata","b":"invalid"}}',
    '{"threads":{"a":null}}',
    '{"threads":{},"future":true}',
  ])("fails closed and refuses to overwrite malformed policy %s", async (raw) => {
    writeFileSync(policy, raw);
    for (const defaultMuted of [false, true]) {
      expect(getThreadTracingMode(state, "new", defaultMuted)).toBe("metadata");
    }
    await expect(setThreadTracingMode(state, "new", "full")).rejects.toThrow("repair the file");
    expect(readFileSync(policy, "utf8")).toBe(raw);
    expect(existsSync(`${policy}.lock`)).toBe(false);
  });

  it("retries until a held directory lock is released", async () => {
    mkdirSync(`${policy}.lock`);
    let finished = false;
    const save = setThreadTracingMode(state, "a", "metadata").then(() => {
      finished = true;
    });
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(finished).toBe(false);
      expect(existsSync(policy)).toBe(false);
    } finally {
      await fsPromises.rmdir(`${policy}.lock`);
      await save;
    }
    expect(getThreadTracingMode(state, "a")).toBe("metadata");
    expect(existsSync(`${policy}.lock`)).toBe(false);
  });
});

describe("exact command parser", () => {
  it.each(["mute", "unmute", "trace"] as const)("recognizes %s", (cmd) => {
    expect(parseTracingCommand(`/langsmith-tracing:${cmd}`)).toBe(cmd);
  });
  it.each([
    "",
    "/mute",
    "/langsmith-tracing:mute now",
    "/langsmith-tracing:unmute now",
    " /langsmith-tracing:mute",
    "/langsmith-tracing:mute\n",
    "/langsmith-tracing:MUTE",
    "please /langsmith-tracing:mute",
    "/langsmith-tracing:muted",
    "/langsmith-tracing:trace now",
    "please /langsmith-tracing:trace",
  ])("does not handle %j", (prompt) => expect(parseTracingCommand(prompt)).toBeUndefined());
});

describe("actual UserPromptSubmit command prefix", () => {
  async function submit(prompt: string, enabled = "false") {
    vi.resetModules();
    vi.stubEnv("TRACE_TO_LANGSMITH", enabled);
    mocks.stdin.mockResolvedValue({
      prompt,
      session_id: "session",
      cwd: dir,
      transcript_path: "unused",
      hook_event_name: "UserPromptSubmit",
    });
    mocks.init.mockReturnValue(null);
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    const { HOOK_HANDLERS } = await import("./hooks/registry.js");
    await HOOK_HANDLERS.UserPromptSubmit();
    expect(output).toHaveBeenCalled();
    expect(mocks.init).not.toHaveBeenCalled();
    expect(mocks.tracing).not.toHaveBeenCalled();
    expect(mocks.state).not.toHaveBeenCalled();
    const response = JSON.parse(output.mock.calls[0][0]);
    expect(response.decision).toBe("block");
    return response.reason as string;
  }

  beforeEach(() => {
    mocks.config
      .mockReset()
      .mockReturnValue({ stateFilePath: state, apiKey: "test", enabled: false });
    mocks.links.mockReset().mockResolvedValue("project: https://smith.langchain.com/example");
  });

  it.each(["mute", "unmute"] as const)(
    "blocks and persists %s with master disabled",
    async (command) => {
      writeFileSync(state, "existing turn");
      const reason = await submit(`/langsmith-tracing:${command}`);
      expect(reason).toContain(
        command === "mute" ? "muted (metadata-only)" : "unmuted (full content)",
      );
      expect(reason).toContain("Master tracing is disabled");
      expect(reason).toContain("for the next turn; the current turn is unchanged");
      expect(getThreadTracingMode(state, "session")).toBe(command === "mute" ? "metadata" : "full");
      expect(readFileSync(state, "utf8")).toBe("existing turn");
    },
  );

  it("names the managed config problem instead of the master switch", async () => {
    mocks.config.mockReturnValue({
      stateFilePath: state,
      apiKey: "test",
      enabled: false,
      managedConfigProblem: "Managed config is broken",
    });
    const reason = await submit("/langsmith-tracing:mute");
    expect(reason).toContain("Managed config is broken");
    expect(reason).not.toContain("Master tracing is disabled");
  });

  it.each(["mute", "unmute", "trace"] as const)(
    "handles the actual %s command definition body without a model turn",
    async (command) => {
      const definition = readFileSync(
        new URL(`../commands/${command}.md`, import.meta.url),
        "utf8",
      );
      const frontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(definition)!;
      expect(frontmatter[0]).toContain("disable-model-invocation: true");
      // Check the Markdown/hook contract; Claude Code's expansion order needs a live test.
      const prompt = definition.slice(frontmatter[0].length).trim();
      expect(prompt).toBe(`/langsmith-tracing:${command}`);
      writeFileSync(state, "existing turn");
      await submit(prompt);
      expect(readFileSync(state, "utf8")).toBe("existing turn");
    },
  );

  it("returns the resolved thread link without touching tracing preferences", async () => {
    const reason = await submit("/langsmith-tracing:trace");
    expect(reason).toContain("https://smith.langchain.com/example");
    expect(mocks.config).toHaveBeenCalledWith({ cwd: dir });
    expect(mocks.links).toHaveBeenCalledWith(mocks.config.mock.results[0].value, "session");
    expect(existsSync(policy)).toBe(false);
  });

  it("blocks a failed trace command without exposing error details or changing preferences", async () => {
    mocks.links.mockRejectedValue(new Error("PRIVATE_REQUEST_DETAILS"));
    const reason = await submit("/langsmith-tracing:trace");
    expect(reason).toContain("Session ID: session");
    expect(reason).not.toContain("PRIVATE_REQUEST_DETAILS");
    expect(existsSync(policy)).toBe(false);
    expect(existsSync(state)).toBe(false);
  });

  it("does not resolve links for an ordinary prompt", async () => {
    vi.resetModules();
    mocks.stdin.mockResolvedValue({
      prompt: "Explain /langsmith-tracing:trace",
      cwd: dir,
      session_id: "session",
    });
    mocks.init.mockReturnValue(null);
    const { HOOK_HANDLERS } = await import("./hooks/registry.js");
    await HOOK_HANDLERS.UserPromptSubmit();
    expect(mocks.init).toHaveBeenCalledWith(dir);
    expect(mocks.links).not.toHaveBeenCalled();
  });

  it("reports precommit write failure without changing preferences", async () => {
    await setThreadTracingMode(state, "session", "metadata");
    const before = readFileSync(policy, "utf8");
    injectFsFault("temp writeFile");
    const reason = await submit("/langsmith-tracing:unmute");
    expect(reason).toContain("Could not unmute");
    expect(reason).toContain("temp writeFile failed");
    expect(reason).toContain("Tracing may still be enabled");
    expect(readFileSync(policy, "utf8")).toBe(before);
    expect(existsSync(`${policy}.lock`)).toBe(false);
  });

  it("reports saved, not failed, when only the durability sync fails", async () => {
    await setThreadTracingMode(state, "session", "metadata");
    injectFsFault("directory sync");
    const reason = await submit("/langsmith-tracing:unmute");
    expect(reason).toContain("Preference saved for the next turn; the current turn is unchanged");
    expect(reason).toContain("Warning:");
    expect(reason).not.toContain("Could not");
    expect(getThreadTracingMode(state, "session")).toBe("full");
  });

  it("blocks commands with master enabled but credentials missing", async () => {
    mocks.config.mockReturnValue({ stateFilePath: state, apiKey: "", enabled: true });
    expect(await submit("/langsmith-tracing:mute", "true")).toContain("credentials");
    expect(getThreadTracingMode(state, "session")).toBe("metadata");
  });

  it("accepts legacy setter mocks returning undefined", async () => {
    vi.doMock("./tracing-policy.js", () => ({
      parseTracingCommand,
      getThreadTracingMode,
      setThreadTracingMode: vi.fn().mockResolvedValue(undefined),
    }));
    try {
      const reason = await submit("/langsmith-tracing:mute");
      expect(reason).toContain("Preference saved for the next turn");
      expect(reason).not.toContain("Could not");
      expect(reason).not.toContain("Warning:");
    } finally {
      vi.doUnmock("./tracing-policy.js");
      vi.resetModules();
    }
  });

  it("blocks configuration failures rather than falling through", async () => {
    mocks.config.mockImplementation(() => {
      throw new Error("config unavailable");
    });
    expect(await submit("/langsmith-tracing:mute")).toContain("config unavailable");
    expect(existsSync(policy)).toBe(false);
  });

  it("blocks parent/write failures", async () => {
    writeFileSync(join(dir, "not-directory"), "file");
    mocks.config.mockReturnValue({ stateFilePath: join(dir, "not-directory", "state.json") });
    expect(await submit("/langsmith-tracing:mute")).toContain("Could not mute");
  });

  it("blocks lock timeouts without stealing the lock", async () => {
    mkdirSync(`${policy}.lock`);
    expect(await submit("/langsmith-tracing:mute")).toContain("Timed out");
    expect(readdirSync(`${policy}.lock`)).toEqual([]);
  });

  it("leaves normal prompts on the existing initHook path", async () => {
    vi.resetModules();
    mocks.stdin.mockResolvedValue({ prompt: "/langsmith-tracing:mute with args", cwd: dir });
    mocks.init.mockReturnValue(null);
    mocks.config.mockReturnValue({ enabled: false });
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    const { HOOK_HANDLERS } = await import("./hooks/registry.js");
    await HOOK_HANDLERS.UserPromptSubmit();
    expect(mocks.init).toHaveBeenCalledWith(dir);
    expect(output).not.toHaveBeenCalled();
    expect(existsSync(policy)).toBe(false);
  });
});

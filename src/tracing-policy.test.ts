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
import { COMMAND_REPLY_MARKER } from "@langchain/plugins-base/plugin";
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
  loginNotice: vi.fn(),
}));
vi.mock("node:fs/promises", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:fs/promises")>()),
}));
vi.mock("@langchain/plugins-base/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@langchain/plugins-base/auth")>()),
  readLoginNotice: mocks.loginNotice,
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
  it.each(["/langsmith-tracing:setup", "/langsmith-tracing:setup my project https://x.test"])(
    "recognizes setup in %j",
    (prompt) => expect(parseTracingCommand(prompt)).toBe("setup"),
  );
  it.each([
    "",
    "/mute",
    "/langsmith-tracing:setupx",
    "please /langsmith-tracing:setup",
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
  async function run(prompt: string, enabled = "false") {
    vi.resetModules();
    vi.stubEnv("TRACE_TO_LANGSMITH", enabled);
    mocks.stdin.mockResolvedValue({
      prompt,
      session_id: "session",
      cwd: dir,
      transcript_path: "unused",
      hook_event_name: "UserPromptSubmit",
    });
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    output.mockClear();
    const { HOOK_HANDLERS } = await import("./hooks/registry.js");
    await HOOK_HANDLERS.UserPromptSubmit();
    expect(output).toHaveBeenCalledTimes(1);
    expect(mocks.init).toHaveBeenCalledWith(dir);
    response = JSON.parse(output.mock.calls[0][0]);
    return response;
  }
  async function submit(prompt: string, enabled = "false") {
    await run(prompt, enabled);
    expect(response.decision).toBeUndefined();
    expect(response.hookSpecificOutput.hookEventName).toBe("UserPromptSubmit");
    const [instruction, reply] = response.hookSpecificOutput.additionalContext.split("\n\n");
    expect(instruction.startsWith(COMMAND_REPLY_MARKER)).toBe(true);
    return reply as string;
  }
  let response: Record<string, any>;

  beforeEach(() => {
    mocks.init.mockReturnValue(null);
    mocks.config
      .mockReset()
      .mockReturnValue({ stateFilePath: state, apiKey: "test", enabled: false });
    mocks.links.mockReset().mockResolvedValue("project: https://smith.langchain.com/example");
  });

  it.each(["mute", "unmute"] as const)("persists %s with master disabled", async (command) => {
    writeFileSync(state, "existing turn");
    const reason = await submit(`/langsmith-tracing:${command}`);
    expect(reason).toContain(
      command === "mute" ? "muted (metadata-only)" : "unmuted (full content)",
    );
    expect(reason).toContain("Master tracing is disabled");
    expect(reason).toContain("for the next turn; the current turn is unchanged");
    expect(getThreadTracingMode(state, "session")).toBe(command === "mute" ? "metadata" : "full");
    expect(readFileSync(state, "utf8")).toBe("existing turn");
  });

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
    "handles the actual %s command definition body",
    async (command) => {
      const definition = readFileSync(
        new URL(`../plugins/langsmith-tracing/commands/${command}.md`, import.meta.url),
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

  it("reports a failed trace command without exposing error details or changing preferences", async () => {
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

  it("warns commands with master enabled but credentials missing", async () => {
    mocks.config.mockReturnValue({
      stateFilePath: state,
      apiKey: "",
      enabled: true,
      credentialProblem: "No credential",
    });
    expect(await submit("/langsmith-tracing:mute", "true")).toContain("credentials");
    expect(response.systemMessage).toBe("No credential");
    expect(getThreadTracingMode(state, "session")).toBe("metadata");
  });

  it("refuses to unmute when the managed file locks muting on", async () => {
    mocks.config.mockReturnValue({
      stateFilePath: state,
      apiKey: "test",
      enabled: true,
      defaultMuted: true,
      mutedLocked: true,
    });
    expect(await submit("/langsmith-tracing:unmute", "true")).toContain("locked muting");
    expect(getThreadTracingMode(state, "session", true)).toBe("metadata");
    await submit("/langsmith-tracing:mute", "true");
    expect(getThreadTracingMode(state, "session", false)).toBe("metadata");
  });

  it("says credentials are missing when no replica brings its own key", async () => {
    mocks.config.mockReturnValue({
      stateFilePath: state,
      apiKey: "",
      enabled: true,
      credentialProblem: "LangSmith isn't signed in.",
      replicas: [{ projectName: "keyless" }],
    });
    expect(await submit("/langsmith-tracing:mute", "true")).toContain("credentials");
  });

  it("doesn't call a CLI login user's credentials missing", async () => {
    mocks.config.mockReturnValue({
      stateFilePath: state,
      apiKey: "",
      enabled: true,
      login: { configPath: "/login/config.json", profile: "work" },
    });
    expect(await submit("/langsmith-tracing:mute", "true")).not.toContain("credentials");
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

  it("reports configuration failures rather than falling through", async () => {
    mocks.config.mockImplementation(() => {
      throw new Error("config unavailable");
    });
    expect(await submit("/langsmith-tracing:mute")).toContain("config unavailable");
    expect(existsSync(policy)).toBe(false);
  });

  it("reports parent/write failures", async () => {
    writeFileSync(join(dir, "not-directory"), "file");
    mocks.config.mockReturnValue({ stateFilePath: join(dir, "not-directory", "state.json") });
    expect(await submit("/langsmith-tracing:mute")).toContain("Could not mute");
  });

  it("reports lock timeouts without stealing the lock", async () => {
    mkdirSync(`${policy}.lock`);
    expect(await submit("/langsmith-tracing:mute")).toContain("Timed out");
    expect(readdirSync(`${policy}.lock`)).toEqual([]);
  });

  it("runs a command but still refuses the prompt under strict auth", async () => {
    mocks.config.mockReturnValue({
      stateFilePath: state,
      apiKey: "",
      enabled: true,
      strictAuth: true,
      credentialProblem: "LangSmith isn't signed in.",
    });
    expect(await run("/langsmith-tracing:mute", "true")).toEqual({
      decision: "block",
      reason:
        "Thread tracing muted (metadata-only). Preference saved for the next turn; the current turn is unchanged. Tracing remains inactive until credentials are configured.\n\nLangSmith isn't signed in.",
    });
    expect(getThreadTracingMode(state, "session")).toBe("metadata");
  });

  describe("setup", () => {
    const projectDestination =
      'Traces go to the "claude-code" project at "https://api.smith.langchain.com".';
    const oneReplicaDestination =
      "Traces go to the replica destination in your settings, which replaces the usual project and URL.";
    const twoReplicaDestinations =
      "Traces go to the 2 replica destinations in your settings, which replace the usual project and URL.";
    let settings: string;
    beforeEach(() => {
      mocks.loginNotice.mockReset();
      vi.stubEnv("HOME", dir);
      settings = join(dir, ".claude", "langsmith.json");
    });

    it("keeps other settings and replies with the values in effect after reloading", async () => {
      mkdirSync(join(dir, ".claude"));
      writeFileSync(settings, JSON.stringify({ api_key: "kept", notice_cooldown: 30 }));
      mocks.config.mockReturnValue({
        stateFilePath: state,
        apiKey: "kept",
        enabled: false,
        project: "from-env",
        apiBaseUrl: "https://env.example.test",
        managedConfigProblem: "Your admin's managed settings file is broken.",
      });
      const reply = await submit("/langsmith-tracing:setup my project https://eu.example.test");
      expect(JSON.parse(readFileSync(settings, "utf8"))).toEqual({
        api_key: "kept",
        notice_cooldown: 30,
        enabled: true,
        project: "my project",
        api_url: "https://eu.example.test",
      });
      expect(reply).toBe(
        `Turned LangSmith tracing on in ${settings}. Traces go to the "from-env" project at "https://env.example.test". Tracing is still off because an environment variable, a project's langsmith.json or langsmith-plugins.json, or your admin's managed settings turn it off. Another setting overrides part of this (an agent_id, an environment variable, a project's langsmith.json or langsmith-plugins.json, or your admin's managed settings), so the values above are what's in effect. Your admin's managed settings file is broken.`,
      );
      expect(response.systemMessage).toBeUndefined();
    });

    it("names a broken managed file instead of asking for a login when there is no key", async () => {
      mocks.config.mockReturnValue({
        stateFilePath: state,
        apiKey: "",
        enabled: false,
        project: "claude-code",
        apiBaseUrl: "https://api.smith.langchain.com",
        credentialProblem: "LangSmith isn't signed in.",
        managedConfigProblem: "Your admin's managed settings file is broken.",
      });
      expect(await submit("/langsmith-tracing:setup")).toBe(
        `Turned LangSmith tracing on in ${settings}. Traces go to the "claude-code" project at "https://api.smith.langchain.com". Tracing is still off because an environment variable, a project's langsmith.json or langsmith-plugins.json, or your admin's managed settings turn it off. Your admin's managed settings file is broken.`,
      );
    });

    it.each([
      { muting: "no mute", defaultMuted: false, threadMode: undefined, muted: false },
      { muting: "a default mute", defaultMuted: true, threadMode: undefined, muted: true },
      { muting: "a thread mute", defaultMuted: false, threadMode: "metadata", muted: true },
    ] as const)("says whether the thread is muted under $muting", async (example) => {
      if (example.threadMode) await setThreadTracingMode(state, "session", example.threadMode);
      mocks.config.mockReturnValue({
        stateFilePath: state,
        apiKey: "test",
        enabled: true,
        defaultMuted: example.defaultMuted,
        project: "claude-code",
        apiBaseUrl: "https://api.smith.langchain.com",
      });
      expect((await submit("/langsmith-tracing:setup")).includes("This thread is muted")).toBe(
        example.muted,
      );
    });

    it("passes a non-breaking space and a line break after the command through to setup", async () => {
      await submit("/langsmith-tracing:setup\u00a0spaced-project");
      expect(JSON.parse(readFileSync(settings, "utf8")).project).toBe("spaced-project");
      expect(await submit("/langsmith-tracing:setup\nsecond")).toBe(
        "Setup takes its project and URL on one line, so nothing was changed. Send anything else as its own message.",
      );
    });

    it.each([
      {
        signIn: { login: { configPath: "/login/config.json" } },
        ending: "Signed in with the LangSmith CLI.",
      },
      { signIn: { credentialProblem: "Key rejected." }, ending: "Key rejected." },
    ])("ends the reply with $ending", async ({ signIn, ending }) => {
      mocks.config.mockReturnValue({
        stateFilePath: state,
        apiKey: "",
        enabled: true,
        project: "claude-code",
        apiBaseUrl: "https://api.smith.langchain.com",
        ...signIn,
      });
      const reply = await submit("/langsmith-tracing:setup");
      expect(reply).toBe(
        `Turned LangSmith tracing on in ${settings}. Traces go to the "claude-code" project at "https://api.smith.langchain.com". ${ending}`,
      );
      expect(response.systemMessage).toBeUndefined();
    });

    it.each([
      {
        defect: "a rejected key is reported as working",
        config: { apiKey: "test-key" },
        loginNotice: "LangSmith API key was rejected.",
        destination: projectDestination,
        ending: "LangSmith API key was rejected.",
      },
      {
        defect: "a login whose replica can't upload is reported as signed in",
        config: {
          apiKey: "",
          login: { configPath: "/login/config.json" },
          credentialProblem: "Replicas on https://other.example need their own API key.",
          replicas: [{ projectName: "other", apiUrl: "https://other.example" }],
        },
        destination: projectDestination,
        ending: "Replicas on https://other.example need their own API key.",
      },
      {
        defect: "a login's skipped keyless replica goes unmentioned",
        config: {
          apiKey: "",
          login: { configPath: "/login/config.json" },
          credentialProblem: "Replicas on https://other.example need their own API key.",
          replicas: [
            { projectName: "other", apiUrl: "https://other.example" },
            { projectName: "same-server", apiUrl: "https://api.smith.langchain.com" },
            { projectName: "keyed", apiKey: "replica-key" },
          ],
        },
        destination: twoReplicaDestinations,
        ending:
          "LangSmith replicas on https://other.example need their own API key, so they're skipped.",
      },
      {
        defect: "a replica's own key is reported as missing",
        config: {
          apiKey: "",
          credentialProblem: "LangSmith isn't signed in.",
          replicas: [
            { projectName: "keyed", apiKey: "replica-key" },
            { projectName: "keyless", apiUrl: "https://api.smith.langchain.com" },
          ],
        },
        destination: oneReplicaDestination,
        ending: "Using your LangSmith API key.",
      },
    ])("asks what the next turn will upload with, so not $defect", async (example) => {
      mocks.loginNotice.mockReturnValue(example.loginNotice);
      mocks.config.mockReturnValue({
        stateFilePath: state,
        enabled: true,
        project: "claude-code",
        apiBaseUrl: "https://api.smith.langchain.com",
        ...example.config,
      });
      expect(await submit("/langsmith-tracing:setup")).toBe(
        `Turned LangSmith tracing on in ${settings}. ${example.destination} ${example.ending}`,
      );
    });

    it("names the replicas instead of a project that receives nothing", async () => {
      mocks.config.mockReturnValue({
        stateFilePath: state,
        apiKey: "test",
        enabled: true,
        project: "typed-project",
        apiBaseUrl: "https://api.smith.langchain.com",
        replicas: [{ projectName: "first", apiKey: "first-key" }, { projectName: "second" }],
      });
      expect(await submit("/langsmith-tracing:setup typed-project")).toBe(
        `Turned LangSmith tracing on in ${settings}. ${twoReplicaDestinations} Another setting overrides part of this (an agent_id, an environment variable, a project's langsmith.json or langsmith-plugins.json, or your admin's managed settings), so the values above are what's in effect. Using your LangSmith API key.`,
      );
    });

    it("counts replicas set in the environment the way uploads do", async () => {
      vi.stubEnv(
        "LANGSMITH_RUNS_ENDPOINTS",
        JSON.stringify([
          { api_url: "https://api.smith.langchain.com", api_key: "env-key", project_name: "env" },
        ]),
      );
      mocks.config.mockReturnValue({
        stateFilePath: state,
        apiKey: "test",
        enabled: true,
        project: "claude-code",
        apiBaseUrl: "https://api.smith.langchain.com",
      });
      expect(await submit("/langsmith-tracing:setup")).toBe(
        `Turned LangSmith tracing on in ${settings}. ${oneReplicaDestination} Using your LangSmith API key.`,
      );
    });

    it("keeps the setup reply when the environment's replicas can't be read", async () => {
      vi.stubEnv("LANGSMITH_RUNS_ENDPOINTS", JSON.stringify({ "https://a.example": "env-key" }));
      vi.stubEnv("LANGSMITH_ENDPOINT", "https://b.example");
      mocks.config.mockReturnValue({
        stateFilePath: state,
        apiKey: "test",
        enabled: true,
        project: "claude-code",
        apiBaseUrl: "https://api.smith.langchain.com",
      });
      expect(await submit("/langsmith-tracing:setup")).toBe(
        `Turned LangSmith tracing on in ${settings}. ${projectDestination} You cannot provide both LANGSMITH_ENDPOINT / LANGCHAIN_ENDPOINT and LANGSMITH_RUNS_ENDPOINTS.`,
      );
    });

    it("names the project when the environment's keyed replicas can't run because nothing can upload", async () => {
      vi.stubEnv(
        "LANGSMITH_RUNS_ENDPOINTS",
        JSON.stringify([
          { api_url: "https://api.smith.langchain.com", api_key: "env-key", project_name: "env" },
        ]),
      );
      mocks.config.mockReturnValue({
        stateFilePath: state,
        apiKey: "",
        enabled: true,
        project: "claude-code",
        apiBaseUrl: "https://api.smith.langchain.com",
        credentialProblem: "LangSmith isn't signed in.",
      });
      expect(await submit("/langsmith-tracing:setup")).toBe(
        `Turned LangSmith tracing on in ${settings}. ${projectDestination} LangSmith isn't signed in.`,
      );
    });

    it("doesn't let a blank API key cover keyless replicas", async () => {
      mocks.config.mockReturnValue({
        stateFilePath: state,
        apiKey: "  ",
        enabled: true,
        project: "claude-code",
        apiBaseUrl: "https://api.smith.langchain.com",
        credentialProblem: "LangSmith isn't signed in.",
        replicas: [
          { projectName: "keyed", apiKey: "replica-key" },
          { projectName: "keyless", apiUrl: "https://api.smith.langchain.com" },
        ],
      });
      expect(await submit("/langsmith-tracing:setup")).toBe(
        `Turned LangSmith tracing on in ${settings}. ${oneReplicaDestination} Using your LangSmith API key.`,
      );
    });

    it("names the agent when traces go to one", async () => {
      mocks.config.mockReturnValue({
        stateFilePath: state,
        apiKey: "test",
        enabled: true,
        project: "claude-code",
        agentId: "shared-claude",
        apiBaseUrl: "https://api.smith.langchain.com",
      });
      expect(await submit("/langsmith-tracing:setup")).toContain(
        'Traces go to the "shared-claude" agent at "https://api.smith.langchain.com".',
      );
    });

    it("reloads the settings after writing them", async () => {
      mocks.config.mockImplementation(() => ({
        stateFilePath: state,
        apiKey: "test",
        enabled: true,
        project: existsSync(settings)
          ? JSON.parse(readFileSync(settings, "utf8")).project
          : "claude-code",
        apiBaseUrl: "https://api.smith.langchain.com",
      }));
      expect(await submit("/langsmith-tracing:setup fresh-project")).toContain(
        'Traces go to the "fresh-project" project',
      );
    });

    it("writes the settings before the turn starts so the setup turn is traced", async () => {
      let writtenBeforeTurn = false;
      mocks.init.mockImplementation(() => {
        writtenBeforeTurn = existsSync(settings);
        return null;
      });
      await submit("/langsmith-tracing:setup");
      expect(writtenBeforeTurn).toBe(true);
    });

    it("replies with the error and leaves an unreadable settings file alone", async () => {
      mkdirSync(join(dir, ".claude"));
      writeFileSync(settings, "{not json");
      const reply = await submit("/langsmith-tracing:setup my-project");
      expect(reply).toBe(
        `Couldn't read ${settings} as a JSON object, so nothing was changed. Fix or remove that file and run setup again.`,
      );
      expect(readFileSync(settings, "utf8")).toBe("{not json");
    });
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

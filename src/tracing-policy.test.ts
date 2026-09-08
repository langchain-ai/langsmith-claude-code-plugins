import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { execFile } from "node:child_process";
import * as fsPromises from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { buildSync } from "esbuild";
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
}));
vi.mock("node:fs/promises", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:fs/promises")>()),
}));
vi.mock("./config.js", () => ({ loadConfig: mocks.config }));
vi.mock("./utils/hook-init.js", () => ({ initHook: mocks.init, expandHome: (p: string) => p }));
vi.mock("./utils/stdin.js", () => ({ readStdin: mocks.stdin }));
vi.mock("./logger.js", () => ({ debug: vi.fn(), error: vi.fn() }));
vi.mock("./langsmith.js", () => ({
  initTracing: mocks.tracing,
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

type FsFault =
  | "directory open"
  | "directory sync"
  | "directory close"
  | "lock rmdir"
  | "temp writeFile"
  | "temp sync"
  | "temp close"
  | "temp unlink";

// Use real files/rename so assertions cover the effective on-disk preference.
function injectFsFaults(...faults: FsFault[]) {
  const originalOpen = fsPromises.open;
  const originalUnlink = fsPromises.unlink;
  const originalRmdir = fsPromises.rmdir;
  vi.spyOn(fsPromises, "open").mockImplementation(async (path, flags, mode) => {
    const kind = String(path) === dir ? "directory" : "temp";
    if (faults.includes(`${kind} open` as FsFault)) throw new Error(`${kind} open failed`);
    const handle = await originalOpen(path, flags, mode);
    for (const method of ["writeFile", "sync", "close"] as const) {
      if (!faults.includes(`${kind} ${method}` as FsFault)) continue;
      const close = handle.close.bind(handle);
      vi.spyOn(handle, method).mockImplementation(async () => {
        // Release real descriptors even when simulating a close error.
        if (method === "close") await close();
        throw new Error(`${kind} ${method} failed`);
      });
    }
    return handle;
  });
  vi.spyOn(fsPromises, "unlink").mockImplementation(async (path) => {
    if (faults.includes("temp unlink")) throw new Error("temp unlink failed");
    return originalUnlink(path);
  });
  vi.spyOn(fsPromises, "rmdir").mockImplementation(async (path) => {
    if (faults.includes("lock rmdir")) throw new Error("lock rmdir failed");
    return originalRmdir(path);
  });
}

const postcommitFaults: FsFault[] = [
  "directory open",
  "directory sync",
  "directory close",
  "lock rmdir",
];

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
    "not json",
    "null",
    "[]",
    "{}",
    '{"threads":[]}',
    '{"threads":null}',
    '{"threads":"invalid"}',
    '{"threads":{"a":"metadata","b":"invalid"}}',
    '{"threads":{"a":null}}',
    '{"threads":{},"future":true}',
    '{"threads":{"new":"full"},"default":"full"}',
    '{"threads":{"new":"full"},"default":"metadata"}',
  ])("fails closed and refuses to overwrite malformed policy %s", async (raw) => {
    writeFileSync(policy, raw);
    for (const defaultMuted of [false, true]) {
      expect(getThreadTracingMode(state, "new", defaultMuted)).toBe("metadata");
    }
    await expect(setThreadTracingMode(state, "new", "full")).rejects.toThrow("repair the file");
    expect(readFileSync(policy, "utf8")).toBe(raw);
    expect(existsSync(`${policy}.lock`)).toBe(false);
  });

  it("fails closed on read errors, including dangling symlinks, and refuses writes", async () => {
    mkdirSync(policy);
    expect(getThreadTracingMode(state, "a")).toBe("metadata");
    await expect(setThreadTracingMode(state, "a", "full")).rejects.toThrow("Refusing to overwrite");
    rmSync(policy, { recursive: true });
    symlinkSync(join(dir, "missing"), policy);
    expect(getThreadTracingMode(state, "a")).toBe("metadata");
    await expect(setThreadTracingMode(state, "a", "full")).rejects.toThrow("Refusing to overwrite");
    expect(lstatSync(policy).isSymbolicLink()).toBe(true);
  });

  it("serializes concurrent edits within a process", async () => {
    await Promise.all(
      Array.from({ length: 24 }, (_, i) => setThreadTracingMode(state, `s${i}`, "metadata")),
    );
    for (let i = 0; i < 24; i++) expect(getThreadTracingMode(state, `s${i}`)).toBe("metadata");
  });

  it("serializes concurrent edits across actual processes", async () => {
    const bundle = join(dir, "policy.mjs");
    buildSync({
      entryPoints: [fileURLToPath(new URL("./tracing-policy.ts", import.meta.url))],
      outfile: bundle,
      bundle: true,
      platform: "node",
      format: "esm",
    });
    const run = promisify(execFile);
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        run(process.execPath, [
          "--input-type=module",
          "-e",
          `import { setThreadTracingMode } from ${JSON.stringify(pathToFileURL(bundle).href)}; await setThreadTracingMode(${JSON.stringify(state)}, 'process-${i}', 'metadata');`,
        ]),
      ),
    );
    for (let i = 0; i < 8; i++)
      expect(getThreadTracingMode(state, `process-${i}`)).toBe("metadata");
  });

  it("keeps the old policy and cleans up after atomic rename failure", async () => {
    await setThreadTracingMode(state, "a", "metadata");
    const before = readFileSync(policy, "utf8");
    vi.spyOn(fsPromises, "rename").mockRejectedValueOnce(new Error("rename failed"));
    await expect(setThreadTracingMode(state, "a", "full")).rejects.toThrow("rename failed");
    expect(readFileSync(policy, "utf8")).toBe(before);
    expect(readdirSync(dir)).toEqual(["state.privacy.json"]);
  });

  it.each(postcommitFaults)("returns a warning after committed %s failure", async (fault) => {
    await setThreadTracingMode(state, "a", "metadata");
    injectFsFaults(fault);
    const result = await setThreadTracingMode(state, "a", "full");
    expect(result.warning).toContain(`${fault} failed`);
    expect(getThreadTracingMode(state, "a")).toBe("full");
    expect(existsSync(`${policy}.lock`)).toBe(fault === "lock rmdir");
    if (fault === "directory open" || fault === "directory sync") {
      expect(result.warning).toContain("crash durability");
      expect(result.warning).toContain("retry saving");
    }
    if (fault === "lock rmdir") expect(result.warning).toContain("no preference writer is running");
  });

  it("attempts all postcommit cleanup independently", async () => {
    injectFsFaults("directory sync", "directory close", "lock rmdir");
    const result = await setThreadTracingMode(state, "a", "metadata");
    for (const fault of ["directory sync", "directory close", "lock rmdir"]) {
      expect(result.warning).toContain(`${fault} failed`);
    }
    expect(getThreadTracingMode(state, "a")).toBe("metadata");
  });

  it.each(["temp writeFile", "temp sync", "temp close"] as FsFault[])(
    "preserves the old policy on precommit %s failure",
    async (fault) => {
      await setThreadTracingMode(state, "a", "metadata");
      const before = readFileSync(policy, "utf8");
      injectFsFaults(fault);
      await expect(setThreadTracingMode(state, "a", "full")).rejects.toThrow(`${fault} failed`);
      expect(readFileSync(policy, "utf8")).toBe(before);
      expect(readdirSync(dir)).toEqual(["state.privacy.json"]);
    },
  );

  it.each(["write", "rename"])("does not mask %s errors with cleanup errors", async (failure) => {
    await setThreadTracingMode(state, "a", "metadata");
    const before = readFileSync(policy, "utf8");
    injectFsFaults(
      "temp unlink",
      "lock rmdir",
      ...(failure === "write" ? (["temp writeFile", "temp close"] as FsFault[]) : []),
    );
    if (failure === "rename")
      vi.spyOn(fsPromises, "rename").mockRejectedValueOnce(new Error("rename failed"));
    await expect(setThreadTracingMode(state, "a", "full")).rejects.toThrow(
      failure === "write" ? "temp writeFile failed" : "rename failed",
    );
    expect(readFileSync(policy, "utf8")).toBe(before);
    expect(fsPromises.rmdir).toHaveBeenCalledWith(`${policy}.lock`);
    expect(fsPromises.unlink).toHaveBeenCalledTimes(1);
  });

  it.each(["directory", "legacy file"])(
    "times out rather than stealing even an old live %s lock",
    async (kind) => {
      await setThreadTracingMode(state, "a", "metadata");
      const before = readFileSync(policy, "utf8");
      if (kind === "directory") mkdirSync(`${policy}.lock`);
      else writeFileSync(`${policy}.lock`, `${process.pid}\n`);
      utimesSync(`${policy}.lock`, new Date(0), new Date(0));
      await expect(setThreadTracingMode(state, "a", "full")).rejects.toThrow("Timed out");
      if (kind === "directory") expect(readdirSync(`${policy}.lock`)).toEqual([]);
      else expect(readFileSync(`${policy}.lock`, "utf8")).toBe(`${process.pid}\n`);
      expect(readFileSync(policy, "utf8")).toBe(before);
    },
  );

  it("holds a private, empty directory lock until the write completes", async () => {
    const originalRename = fsPromises.rename;
    vi.spyOn(fsPromises, "rename").mockImplementation(async (from, to) => {
      expect(statSync(`${policy}.lock`).isDirectory()).toBe(true);
      expect(statSync(`${policy}.lock`).mode & 0o777).toBe(0o700);
      expect(readdirSync(`${policy}.lock`)).toEqual([]);
      return originalRename(from, to);
    });
    const mkdir = vi.spyOn(fsPromises, "mkdir");
    await setThreadTracingMode(state, "a", "metadata");
    expect(mkdir).toHaveBeenCalledWith(`${policy}.lock`, { mode: 0o700 });
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

  it("propagates lock acquisition errors without changing preferences", async () => {
    await setThreadTracingMode(state, "a", "metadata");
    const before = readFileSync(policy, "utf8");
    const originalMkdir = fsPromises.mkdir;
    vi.spyOn(fsPromises, "mkdir").mockImplementation(async (path, options) => {
      if (String(path) === `${policy}.lock`) {
        throw Object.assign(new Error("permission denied"), { code: "EACCES" });
      }
      return originalMkdir(path, options);
    });
    const rmdir = vi.spyOn(fsPromises, "rmdir");
    await expect(setThreadTracingMode(state, "a", "full")).rejects.toThrow("permission denied");
    expect(readFileSync(policy, "utf8")).toBe(before);
    expect(rmdir).not.toHaveBeenCalled();
  });
});

describe("exact command parser", () => {
  it.each(["mute", "unmute"] as const)("recognizes %s", (cmd) => {
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
    await import("./hooks/user-prompt-submit.js");
    await vi.waitFor(() => expect(output).toHaveBeenCalled(), { timeout: 4000 });
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

  it.each(["mute", "unmute"] as const)(
    "handles the actual %s command definition body without a model turn",
    async (command) => {
      const definition = readFileSync(
        new URL(`../commands/${command}.md`, import.meta.url),
        "utf8",
      );
      const frontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(definition);
      expect(frontmatter).not.toBeNull();
      expect(frontmatter![0]).toContain("disable-model-invocation: true");
      // Feed the complete Markdown body, not a hardcoded prompt. Strip only
      // surrounding Markdown whitespace; explanatory prose must fail this test.
      // This tests our definition/hook contract, not Claude Code's expansion order.
      const prompt = definition.slice(frontmatter![0].length).trim();
      expect(prompt).toBe(`/langsmith-tracing:${command}`);
      await setThreadTracingMode(state, "session", command === "mute" ? "full" : "metadata");
      writeFileSync(state, "existing turn");
      const reason = await submit(prompt);
      expect(reason).toContain("for the next turn; the current turn is unchanged");
      expect(getThreadTracingMode(state, "session")).toBe(command === "mute" ? "metadata" : "full");
      expect(readFileSync(state, "utf8")).toBe("existing turn");
    },
  );

  it.each(postcommitFaults)("reports saved, not failed, after %s failure", async (fault) => {
    await setThreadTracingMode(state, "session", "metadata");
    injectFsFaults(fault);
    const reason = await submit("/langsmith-tracing:unmute");
    expect(reason).toContain("unmuted (full content)");
    expect(reason).toContain("Preference saved for the next turn; the current turn is unchanged");
    expect(reason).toContain("Warning:");
    expect(reason).toContain(`${fault} failed`);
    expect(reason).not.toContain("Could not");
    expect(getThreadTracingMode(state, "session")).toBe("full");
  });

  it("reports precommit write failure without changing preferences", async () => {
    await setThreadTracingMode(state, "session", "metadata");
    const before = readFileSync(policy, "utf8");
    injectFsFaults("temp writeFile");
    const reason = await submit("/langsmith-tracing:unmute");
    expect(reason).toContain("Could not unmute");
    expect(reason).toContain("temp writeFile failed");
    expect(reason).toContain("Tracing may still be enabled");
    expect(readFileSync(policy, "utf8")).toBe(before);
    expect(existsSync(`${policy}.lock`)).toBe(false);
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

  it("blocks corrupt-policy writes with actionable error", async () => {
    writeFileSync(policy, "corrupt");
    expect(await submit("/langsmith-tracing:unmute")).toContain("repair the file");
    expect(readFileSync(policy, "utf8")).toBe("corrupt");
  });

  it("blocks unreadable-policy writes", async () => {
    mkdirSync(policy);
    expect(await submit("/langsmith-tracing:unmute")).toContain("Refusing to overwrite");
  });

  it("blocks parent/write failures", async () => {
    writeFileSync(join(dir, "not-directory"), "file");
    mocks.config.mockReturnValue({ stateFilePath: join(dir, "not-directory", "state.json") });
    expect(await submit("/langsmith-tracing:mute")).toContain("Could not mute");
  });

  it("blocks atomic rename failures without changing saved preferences", async () => {
    await setThreadTracingMode(state, "session", "metadata");
    const before = readFileSync(policy, "utf8");
    vi.spyOn(fsPromises, "rename").mockRejectedValueOnce(new Error("rename failed"));
    expect(await submit("/langsmith-tracing:unmute")).toContain("rename failed");
    expect(readFileSync(policy, "utf8")).toBe(before);
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
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    await import("./hooks/user-prompt-submit.js");
    await vi.waitFor(() => expect(mocks.init).toHaveBeenCalledWith(dir));
    expect(mocks.config).not.toHaveBeenCalled();
    expect(output).not.toHaveBeenCalled();
    expect(existsSync(policy)).toBe(false);
  });
});

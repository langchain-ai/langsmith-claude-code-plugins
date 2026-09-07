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
  policy = `${state}.privacy.json`;
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
  | "lock close"
  | "lock unlink"
  | "temp writeFile"
  | "temp sync"
  | "temp close"
  | "temp unlink";

// Use real files/rename so assertions cover the effective on-disk preference.
function injectFsFaults(...faults: FsFault[]) {
  const originalOpen = fsPromises.open;
  const originalUnlink = fsPromises.unlink;
  vi.spyOn(fsPromises, "open").mockImplementation(async (path, flags, mode) => {
    const kind =
      String(path) === dir ? "directory" : String(path).endsWith(".lock") ? "lock" : "temp";
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
    const kind = String(path).endsWith(".lock") ? "lock" : "temp";
    if (faults.includes(`${kind} unlink` as FsFault)) throw new Error(`${kind} unlink failed`);
    return originalUnlink(path);
  });
}

const postcommitFaults: FsFault[] = [
  "directory open",
  "directory sync",
  "directory close",
  "lock close",
  "lock unlink",
];

describe("standalone tracing preference", () => {
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
    expect(readdirSync(dir)).toEqual(["state.json.privacy.json"]);
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

  it("honors a metadata default without losing other explicit preferences", async () => {
    writeFileSync(policy, JSON.stringify({ default: "metadata", threads: { a: "metadata" } }));
    await setThreadTracingMode(state, "b", "full");
    expect(getThreadTracingMode(state, "unknown")).toBe("metadata");
    expect(getThreadTracingMode(state, "a")).toBe("metadata");
    expect(getThreadTracingMode(state, "b")).toBe("full");
  });

  it.each([
    "not json",
    "null",
    "[]",
    "{}",
    '{"default":"full","threads":[]}',
    '{"default":"full","threads":{"a":"metadata","b":"invalid"}}',
    '{"default":"invalid","threads":{}}',
    '{"default":"full","threads":{},"future":true}',
  ])("fails closed and refuses to overwrite malformed policy %s", async (raw) => {
    writeFileSync(policy, raw);
    expect(getThreadTracingMode(state, "new")).toBe("metadata");
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
    expect(readdirSync(dir)).toEqual(["state.json.privacy.json"]);
  });

  it.each(postcommitFaults)("returns a warning after committed %s failure", async (fault) => {
    await setThreadTracingMode(state, "a", "metadata");
    injectFsFaults(fault);
    const result = await setThreadTracingMode(state, "a", "full");
    expect(result.warning).toContain(`${fault} failed`);
    expect(getThreadTracingMode(state, "a")).toBe("full");
    expect(existsSync(`${policy}.lock`)).toBe(fault === "lock unlink");
    if (fault === "directory open" || fault === "directory sync") {
      expect(result.warning).toContain("crash durability");
      expect(result.warning).toContain("retry saving");
    }
    if (fault === "lock unlink")
      expect(result.warning).toContain("no preference writer is running");
  });

  it("attempts all postcommit cleanup independently", async () => {
    injectFsFaults("directory sync", "directory close", "lock close", "lock unlink");
    const result = await setThreadTracingMode(state, "a", "metadata");
    for (const fault of ["directory sync", "directory close", "lock close", "lock unlink"]) {
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
      expect(readdirSync(dir)).toEqual(["state.json.privacy.json"]);
    },
  );

  it.each(["write", "rename"])("does not mask %s errors with cleanup errors", async (failure) => {
    await setThreadTracingMode(state, "a", "metadata");
    const before = readFileSync(policy, "utf8");
    injectFsFaults(
      "temp unlink",
      "lock close",
      "lock unlink",
      ...(failure === "write" ? (["temp writeFile", "temp close"] as FsFault[]) : []),
    );
    if (failure === "rename")
      vi.spyOn(fsPromises, "rename").mockRejectedValueOnce(new Error("rename failed"));
    await expect(setThreadTracingMode(state, "a", "full")).rejects.toThrow(
      failure === "write" ? "temp writeFile failed" : "rename failed",
    );
    expect(readFileSync(policy, "utf8")).toBe(before);
    expect(fsPromises.unlink).toHaveBeenCalledWith(`${policy}.lock`);
    expect(fsPromises.unlink).toHaveBeenCalledTimes(2);
  });

  it("times out rather than stealing even an old live lock", async () => {
    await setThreadTracingMode(state, "a", "metadata");
    const before = readFileSync(policy, "utf8");
    writeFileSync(`${policy}.lock`, `${process.pid}\n`);
    utimesSync(`${policy}.lock`, new Date(0), new Date(0));
    await expect(setThreadTracingMode(state, "a", "full")).rejects.toThrow("Timed out");
    expect(readFileSync(`${policy}.lock`, "utf8")).toBe(`${process.pid}\n`);
    expect(readFileSync(policy, "utf8")).toBe(before);
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
    injectFsFaults("temp writeFile", "lock close");
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
    writeFileSync(`${policy}.lock`, "live writer");
    expect(await submit("/langsmith-tracing:mute")).toContain("Timed out");
    expect(readFileSync(`${policy}.lock`, "utf8")).toBe("live writer");
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

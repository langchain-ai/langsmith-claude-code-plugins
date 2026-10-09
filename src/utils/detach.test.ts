import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";

const child = Object.assign(new EventEmitter(), { pid: 123, unref: () => {} });
vi.mock("node:child_process", () => ({ spawn: () => child }));
vi.mock("../logger.js", () => ({ debug: () => {}, warn: () => {} }));

describe("starting the detached uploader", () => {
  // Catches a spawn failure arriving as an event nobody listens for, which Node turns into
  // an uncaught exception, so the hook exits non-zero and Claude Code reports an error.
  it("survives a spawn that fails after it has returned", async () => {
    const { startQueueFlusher } = await import("./detach.js");
    startQueueFlusher("/tmp", "s1");

    expect(() => child.emit("error", new Error("EAGAIN"))).not.toThrow();
  });
});

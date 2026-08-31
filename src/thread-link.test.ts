import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  deriveWebHost,
  buildThreadUrl,
  threadFilePath,
  readThreadLink,
  writeThreadLink,
  type ThreadLinkRecord,
} from "./thread-link.js";

describe("thread-link", () => {
  it("derives the web host for cloud, regional, self-hosted, and localhost", () => {
    expect(deriveWebHost("https://api.smith.langchain.com")).toBe("https://smith.langchain.com");
    expect(deriveWebHost("https://eu.api.smith.langchain.com")).toBe(
      "https://eu.smith.langchain.com",
    );
    expect(deriveWebHost("https://langsmith.mycorp.com/api/v1")).toBe(
      "https://langsmith.mycorp.com",
    );
    expect(deriveWebHost("http://localhost:1984")).toBe("http://localhost:3000");
  });

  it("builds the canonical thread deep link", () => {
    expect(
      buildThreadUrl({
        webHost: "https://smith.langchain.com",
        tenantId: "tenant-1",
        projectId: "proj-1",
        threadId: "session-1",
      }),
    ).toBe("https://smith.langchain.com/o/tenant-1/projects/p/proj-1/t/session-1");
  });

  it("slugifies cwd into the per-project path", () => {
    expect(threadFilePath("/Users/me/Desktop/my-repo", "/home")).toBe(
      "/home/.claude/state/langsmith-thread--Users-me-Desktop-my-repo.json",
    );
  });

  it("round-trips a record (undefined when absent)", () => {
    const home = join(tmpdir(), `thread-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(home, { recursive: true });
    try {
      const cwd = "/Users/me/proj";
      expect(readThreadLink(cwd, home)).toBeUndefined();
      const record: ThreadLinkRecord = {
        session_id: "sess-abc",
        project: "claude-code",
        url: "https://smith.langchain.com/o/t/projects/p/p/t/sess-abc",
        updated: "2025-01-01T00:00:00.000Z",
      };
      writeThreadLink(cwd, record, home);
      expect(readThreadLink(cwd, home)).toEqual(record);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});

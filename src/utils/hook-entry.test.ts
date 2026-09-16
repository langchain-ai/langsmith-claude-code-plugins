import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../logger.js", () => ({ error: vi.fn() }));

import { error } from "../logger.js";
import { runHookEntry } from "./hook-entry.js";

describe("runHookEntry", () => {
  let exit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
  });

  it("logs the event and still exits 0 when the handler rejects", async () => {
    runHookEntry("Stop", async () => {
      throw new Error("boom");
    });
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
    expect(error).toHaveBeenCalledWith(expect.stringContaining("Stop hook fatal error"));
    expect(error).toHaveBeenCalledWith(expect.stringContaining("boom"));
  });

  it("leaves a resolving handler alone", async () => {
    runHookEntry("PreToolUse", async () => {});
    await new Promise((resolve) => setImmediate(resolve));
    expect(exit).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  // The logger writes to a file, so it can fail exactly when a hook is failing.
  it("still exits 0 when logging the failure also throws", async () => {
    vi.mocked(error).mockImplementation(() => {
      throw new Error("logger unavailable");
    });
    runHookEntry("SessionEnd", async () => {
      throw new Error("boom");
    });
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
  });
});

import { afterEach, describe, expect, it } from "vitest";

import { runningCompiledBinary } from "./binary-runtime.js";

const global = globalThis as { Bun?: { main?: unknown } };

function setBunMain(main: unknown): void {
  global.Bun = { main };
}

afterEach(() => {
  delete global.Bun;
});

describe("runningCompiledBinary", () => {
  it("recognises the entry path Bun gives a compiled binary", () => {
    setBunMain("/$bunfs/root/dispatch");
    expect(runningCompiledBinary()).toBe(true);
  });

  it("does not recognise a source file Bun is running directly", () => {
    setBunMain("/Users/someone/plugin/src/hooks/dispatch.ts");
    expect(runningCompiledBinary()).toBe(false);
  });

  it("does not recognise the plugin running on Node, where there is no Bun", () => {
    expect(global.Bun).toBeUndefined();
    expect(runningCompiledBinary()).toBe(false);
  });
});

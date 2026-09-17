import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { HOOK_EVENT_NAMES } from "./constants.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "hooks/hooks.json"), "utf8"));

describe("HOOK_EVENT_NAMES", () => {
  it("lists every event hooks.json wires up, and no others", () => {
    expect([...HOOK_EVENT_NAMES].sort()).toEqual(Object.keys(manifest.hooks).sort());
  });
});

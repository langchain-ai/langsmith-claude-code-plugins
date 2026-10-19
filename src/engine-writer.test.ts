import { describe, expect, it } from "vitest";
import { writerOptions, writerReplica } from "./engine-writer.js";
import type { Config } from "./types.js";

const config: Config = {
  enabled: true,
  defaultMuted: false,
  apiKey: "key",
  project: "p",
  apiBaseUrl: "http://127.0.0.1:1",
  stateFilePath: "/state.json",
  debug: false,
  redact: true,
};

describe("writerReplica", () => {
  it("turns the SDK's [project, updates] tuple into a replica", () => {
    expect(writerReplica(["other", { extra: { metadata: { a: 1 } } }] as never)).toEqual({
      projectName: "other",
      updates: { extra: { metadata: { a: 1 } } },
    });
  });

  it("copies an object replica so later edits to the config cannot change it", () => {
    const source = { projectName: "other", updates: { tags: ["x"] } };
    const copy = writerReplica(source as never);
    source.updates.tags.push("y");

    expect(copy).toEqual({ projectName: "other", updates: { tags: ["x"] } });
  });
});

describe("writerOptions", () => {
  it("sends to the configured destination and passes redaction through", () => {
    const rules = [{ pattern: "secret", replace: "hidden" }];

    expect(writerOptions({ ...config, redactExtraRules: rules })).toMatchObject({
      destinations: [{ apiKey: "key", apiUrl: "http://127.0.0.1:1", projectName: "p" }],
      redact: true,
      redactExtraRules: rules,
    });
  });

  it("leaves out redaction rules and replicas it was not given", () => {
    const options = writerOptions(config);

    expect(options).not.toHaveProperty("redactExtraRules");
    expect(options.replicas ?? []).toEqual([]);
  });

  it("carries the configured replicas", () => {
    const options = writerOptions({ ...config, replicas: [{ projectName: "r", apiKey: "k" }] });

    expect(options.replicas).toEqual([{ projectName: "r", apiKey: "k" }]);
  });
});

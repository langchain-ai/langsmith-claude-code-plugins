import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COMMON_BOOLEAN_SETTINGS,
  mergeCommonConfig,
  parseCommonConfig,
  readCommonConfigFile,
  toSdkReplicas,
  type CommonConfig,
} from "./shared-config.js";

vi.mock("node:fs", { spy: true });

const restrictive = { enabled: false, defaultMuted: true };
afterEach(() => vi.restoreAllMocks());

describe("canonical common schema fixtures", () => {
  it.each([null, [], true, false, 1, "", "{}"])("rejects nonobjects: %j", (value) => {
    expect(parseCommonConfig(value)).toMatchObject({ status: "invalid", common: restrictive });
  });

  it("preserves strings verbatim, empty collections, and raw extensions but strips unknown common keys", () => {
    const raw = {
      enabled: true,
      defaultMuted: false,
      api_key: "",
      api_url: " not a URL ",
      project: "  ",
      metadata: {},
      replicas: [],
      redact: false,
      redact_extra_rules: [],
      claude: null,
      codex: ["malformed extension"],
      apiKey: "ignored",
      projectName: "ignored",
    };
    const result = parseCommonConfig(raw);
    expect(result.status).toBe("valid");
    expect(result.raw).toBe(raw);
    expect(result.common).toEqual({
      enabled: true,
      defaultMuted: false,
      api_key: "",
      api_url: " not a URL ",
      project: "  ",
      metadata: {},
      replicas: [],
      redact: false,
      redact_extra_rules: [],
    });
  });

  it.each(["enabled", "defaultMuted"] as const)("invalid %s restricts only that field", (field) => {
    for (const value of [null, "false", 0, [], {}, undefined]) {
      const other = field === "enabled" ? "defaultMuted" : "enabled";
      expect(parseCommonConfig({ [field]: value, [other]: true, api_key: "kept" }).common).toEqual({
        [field]: COMMON_BOOLEAN_SETTINGS[field].restrictive,
        [other]: true,
        api_key: "kept",
      });
    }
  });

  const invalidFields = [
    ...["api_key", "api_url", "project"].flatMap((key) =>
      [null, 1, false, [], {}].map((value) => ({ [key]: value })),
    ),
    ...[null, "false", 0, [], {}].map((redact) => ({ redact })),
    ...[null, [], "x", true, 1].map((metadata) => ({ metadata })),
    ...[
      null,
      {},
      "x",
      [null],
      [["tuple", {}]],
      [{ api_url: null, apiUrl: "valid" }],
      [{ api_key: null, apiKey: "valid" }],
      [{ project: null, projectName: "valid" }],
      [{ apiUrl: 1 }],
      [{ apiKey: false }],
      [{ projectName: [] }],
      [{ updates: null }],
      [{ updates: [] }],
    ].map((replicas) => ({ replicas })),
    ...[
      null,
      {},
      [null],
      [{ pattern: 1 }],
      [{}],
      [{ pattern: "[" }],
      [{ pattern: "ok" }, { pattern: "(" }],
      [{ pattern: "ok", replace: null }],
      [{ pattern: "ok", replace: 1 }],
    ].map((redact_extra_rules) => ({ redact_extra_rules })),
  ];
  it.each(invalidFields)("invalid ordinary field discards ALL common values: %j", (bad) => {
    const result = parseCommonConfig({
      enabled: true,
      defaultMuted: false,
      api_key: "SECRET",
      ...bad,
    });
    expect(result).toMatchObject({ status: "invalid", common: restrictive });
    expect(JSON.stringify(result.diagnostics)).not.toContain("SECRET");
  });

  it("canonical own keys beat aliases, unknown replica/rule keys strip, updates survive unchanged", () => {
    const updates = JSON.parse('{"__proto__":{"safe":true},"extra":{"metadata":{"nested":1}}}');
    const result = parseCommonConfig({
      replicas: [
        {
          api_url: "",
          apiUrl: "alias",
          api_key: "canonical",
          apiKey: "alias",
          project: "",
          projectName: "alias",
          updates,
          unknown: true,
        },
        { apiUrl: "url", apiKey: "key", projectName: "name" },
        {},
      ],
      redact_extra_rules: [
        { pattern: "", replace: "", flags: "i" },
        { pattern: "x+", unknown: true },
      ],
    });
    expect(result.status).toBe("valid");
    expect(result.common.replicas).toEqual([
      { api_url: "", api_key: "canonical", project: "", updates },
      { api_url: "url", api_key: "key", project: "name" },
      {},
    ]);
    expect(result.common.replicas![0].updates).toBe(updates);
    expect(toSdkReplicas(result.common.replicas)).toEqual([
      { apiUrl: "", apiKey: "canonical", projectName: "", updates },
      { apiUrl: "url", apiKey: "key", projectName: "name" },
      {},
    ]);
    expect(result.common.redact_extra_rules).toEqual([
      { pattern: "", replace: "" },
      { pattern: "x+" },
    ]);
    expect(toSdkReplicas(undefined)).toBeUndefined();
    expect(toSdkReplicas([])).toEqual([]);
  });

  it("does not use inherited canonical keys over own aliases", () => {
    const replica = Object.assign(Object.create({ api_key: null }), { apiKey: "own" });
    expect(parseCommonConfig({ replicas: [replica] }).common.replicas).toEqual([
      { api_key: "own" },
    ]);
    expect(parseCommonConfig(Object.create({ enabled: true, api_key: null })).common).toEqual({});
  });
});

describe("per-field precedence fixtures", () => {
  it("envFirst overrides invalid sources independently without changing legacy defaults", () => {
    const sources = {
      harness: parseCommonConfig({ project: null }).common,
      userRoot: { api_key: "home-key", metadata: { home: true } },
      env: { enabled: true },
    };
    expect(mergeCommonConfig(sources)).toMatchObject({ enabled: false, defaultMuted: true });
    expect(mergeCommonConfig(sources, { envFirst: true })).toMatchObject({
      enabled: true,
      defaultMuted: true,
      api_key: "home-key",
      metadata: { home: true },
    });
    expect(
      mergeCommonConfig(
        { ...sources, env: { enabled: true, defaultMuted: false } },
        { envFirst: true },
      ),
    ).toMatchObject({ enabled: true, defaultMuted: false });
  });

  const values = [undefined, false, true];
  it.each(
    (["enabled", "defaultMuted"] as const).flatMap((field) =>
      values.flatMap((harness) =>
        values.flatMap((root) =>
          values.flatMap((user) => values.map((env) => ({ field, harness, root, user, env }))),
        ),
      ),
    ),
  )(
    "$field harness=$harness root=$root user=$user env=$env",
    ({ field, harness, root, user, env }) => {
      expect(
        mergeCommonConfig({
          harness: { [field]: harness },
          root: { [field]: root },
          user: { [field]: user },
          env: { [field]: env },
        })[field],
      ).toBe(harness ?? root ?? user ?? env ?? false);
    },
  );

  it.each(["api_key", "api_url", "project", "replicas", "redact", "redact_extra_rules"] as const)(
    "%s uses env > harness > root > user > userRoot > defaults, including empty values",
    (field) => {
      const sources: Record<string, CommonConfig> = {};
      const empty =
        field === "redact" ? false : ["replicas", "redact_extra_rules"].includes(field) ? [] : "";
      const nonempty =
        field === "redact"
          ? true
          : field === "replicas"
            ? [{}]
            : field === "redact_extra_rules"
              ? [{ pattern: "x" }]
              : "default";
      sources.defaults = { [field]: nonempty };
      expect(mergeCommonConfig(sources)[field]).toEqual(nonempty);
      for (const scope of ["userRoot", "user", "root", "harness", "env"]) {
        for (const source of Object.values(sources)) source[field] = nonempty as never;
        sources[scope] = { [field]: empty };
        expect(mergeCommonConfig(sources)[field]).toEqual(empty);
      }
    },
  );

  it("shallow merges metadata per key; {} cannot clear; __proto__ is safe own data", () => {
    const user = { metadata: { keep: 1, nested: { a: 1 }, winner: "user" } };
    const root = { metadata: { nested: { b: 2 }, winner: "root" } };
    const harness = { metadata: {} };
    const env = { metadata: JSON.parse('{"winner":"env","__proto__":{"polluted":true}}') };
    const metadata = mergeCommonConfig({ user, root, harness, env }).metadata!;
    expect(metadata).toEqual(
      JSON.parse('{"keep":1,"nested":{"b":2},"winner":"env","__proto__":{"polluted":true}}'),
    );
    expect(Object.getPrototypeOf(metadata)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(user.metadata.nested).toEqual({ a: 1 });
  });

  it("invalid root restricts switches, allows ordinary lower fallback and higher boolean overrides", () => {
    const root = parseCommonConfig({
      api_key: "discard",
      project: null,
      metadata: { discard: true },
    }).common;
    expect(
      mergeCommonConfig({
        root,
        user: { api_key: "lower", metadata: { kept: true }, enabled: true },
        harness: { enabled: true, defaultMuted: false },
        env: { enabled: false },
      }),
    ).toMatchObject({
      enabled: true,
      defaultMuted: false,
      api_key: "lower",
      metadata: { kept: true },
    });
    expect(mergeCommonConfig({ root, env: { enabled: true, defaultMuted: false } })).toMatchObject(
      restrictive,
    );
  });
});

describe("filesystem fixtures", () => {
  let dir: string;
  afterEach(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });
  function setup() {
    dir = fs.mkdtempSync(join(tmpdir(), "shared-config-"));
    return join(dir, "langsmith.json");
  }

  it("distinguishes absent, regular files, readable and dangling symlinks, and directories", () => {
    const path = setup();
    expect(readCommonConfigFile(path)).toEqual({ status: "absent", common: {}, diagnostics: [] });
    fs.writeFileSync(path, '{"api_key":"", "enabled":true}');
    const link = join(dir, "link");
    fs.symlinkSync(path, link);
    expect(readCommonConfigFile(link)).toEqual(readCommonConfigFile(path));
    fs.unlinkSync(path);
    expect(readCommonConfigFile(link)).toMatchObject({ status: "invalid", common: restrictive });
    expect(readCommonConfigFile(dir)).toMatchObject({ status: "invalid", common: restrictive });
  });

  it.skipIf(process.platform === "win32")("rejects FIFO without opening/blocking", () => {
    const path = setup();
    execFileSync("mkfifo", [path]);
    expect(readCommonConfigFile(path)).toMatchObject({ status: "invalid", common: restrictive });
  });

  it.each(["", "{SECRET", "null", "[]", '"SECRET"'])(
    "rejects invalid JSON file without raw diagnostics: %j",
    (text) => {
      const path = setup();
      fs.writeFileSync(path, text);
      const result = readCommonConfigFile(path);
      expect(result).toMatchObject({ status: "invalid", common: restrictive });
      expect(JSON.stringify(result.diagnostics)).not.toContain("SECRET");
      expect(result.raw).toBeUndefined();
    },
  );

  it.each(["EACCES", "EPERM", "EIO", "ENOTDIR", "ENOENT"])(
    "restricts read failure %s after regular stat",
    (code) => {
      const path = setup();
      fs.writeFileSync(path, "{}");
      vi.spyOn(fs, "readFileSync").mockImplementation(() => {
        throw Object.assign(new Error("SECRET"), { code });
      });
      expect(readCommonConfigFile(path)).toMatchObject({ status: "invalid", common: restrictive });
    },
  );

  it.each(["EACCES", "EPERM", "EIO", "ENOTDIR"])("restricts stat failure %s", (code) => {
    const path = setup();
    vi.spyOn(fs, "statSync").mockImplementation(() => {
      throw Object.assign(new Error("SECRET"), { code });
    });
    expect(readCommonConfigFile(path)).toMatchObject({ status: "invalid", common: restrictive });
  });

  it("stat ENOENT plus inaccessible lstat is not absence", () => {
    const path = setup();
    vi.spyOn(fs, "lstatSync").mockImplementation(() => {
      throw Object.assign(new Error("SECRET"), { code: "EACCES" });
    });
    expect(readCommonConfigFile(path)).toMatchObject({ status: "invalid", common: restrictive });
  });
});

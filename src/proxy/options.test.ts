import { describe, expect, it } from "vitest";
import { httpsOrigin, endpoints, API_URL, UPSTREAM } from "./config.js";
import { parseEnableArgs } from "./options.js";

describe("strict endpoint origins and paired explicit setup arguments", () => {
  it.each([
    "http://api.preview.test",
    "https://user:secret@api.preview.test",
    "https://@api.preview.test",
    "https://api.preview.test/api",
    "https://api.preview.test/gateway",
    "https://api.preview.test/.",
    "https://api.preview.test/a/..",
    "https://api.preview.test//",
    "https://api.preview.test/%2f",
    "https://api.preview.test?",
    "https://api.preview.test#",
    "https://api.preview.test/?x=1",
    "https://api.preview.test/#secret",
    " https://api.preview.test",
    "https://api.preview.test\n",
    "https://api.preview.test\\evil",
    "https://api.preview.test:0",
    "https://api.preview.test:65536",
    "https://api.preview.test:",
    "https://127.0.0.1",
    "https://127.1",
    "https://[::1]",
    "https://localhost",
    "https://a.local",
    "https://a.internal",
    "https://foo",
    "https://a..test",
    "https://-a.test",
    "https://a_.test",
    "https://a.test.",
    "https://%61.test",
    "https://a.test:abc",
    "https://api.pre\tview.test",
    "https:///api.preview.test",
    "https://api.preview.test:443/path",
  ])("rejects %s", (value) => expect(() => httpsOrigin(value)).toThrow());
  it("normalizes roots, host case and default ports, permits explicit HTTPS ports", () => {
    expect(httpsOrigin("https://PR-42-api.review.smith.langchain.com:443/")).toBe(
      "https://pr-42-api.review.smith.langchain.com",
    );
    expect(httpsOrigin("https://gateway.preview.test:8443/")).toBe(
      "https://gateway.preview.test:8443",
    );
    expect(endpoints({})).toEqual({ apiUrl: API_URL, gatewayUrl: UPSTREAM });
    expect(() => endpoints({ apiUrl: API_URL })).toThrow("both");
    expect(() => endpoints({ apiUrl: null, gatewayUrl: UPSTREAM })).toThrow();
  });
  it("accepts consented enable positional options and profile plus endpoint pair", () => {
    expect(
      parseEnableArgs([
        "--yes",
        "--scope",
        "global",
        "/bin/cli",
        "preview",
        "43127",
        "--api-url",
        "https://api.preview.test/",
        "--gateway-url",
        "https://gateway.preview.test/",
      ]),
    ).toEqual({
      scope: "global",
      useClaudeSubscription: false,
      cli: "/bin/cli",
      profile: "preview",
      port: 43127,
      apiUrl: "https://api.preview.test",
      gatewayUrl: "https://gateway.preview.test",
    });
    expect(parseEnableArgs(["--yes", "--scope", "global", "--profile", "preview"])).toEqual({
      scope: "global",
      useClaudeSubscription: false,
      profile: "preview",
    });
    expect(parseEnableArgs(["--yes", "--scope", "global"])).toEqual({
      scope: "global",
      useClaudeSubscription: false,
      profile: undefined,
    });
  });
  it.each([
    ["--yes", "--scope", "global", "--api-url", API_URL],
    ["--yes", "--scope", "global", "--gateway-url", UPSTREAM],
    ["--yes", "--scope", "global", "--profile", "a", "--profile", "b"],
    ["--yes", "--scope", "global", "--profile"],
    ["--yes", "--scope", "global", "--unknown", "x"],
    ["--yes", "--scope", "global", "/cli", "a", "43127", "--profile", "b"],
    ["--yes", "--scope", "global", "/cli", "a"],
    ["--yes", "--scope", "global", "/cli", "a", "0"],
    ["--yes", "--scope", "global", "--yes"],
    ["--yes", "--scope", "global", "--profile", "bad profile"],
    ["--yes", "--scope", "global", "--api-url=http://bad"],
  ])("refuses invalid or mutually exclusive flags: %j", (...args) => {
    expect(() => parseEnableArgs(args)).toThrow();
  });
  it.each([[], ["/cli", "a", "43127"], ["--profile", "preview"]])(
    "requires runtime consent before parsing options: %j",
    (...args) => {
      expect(() => parseEnableArgs(args)).toThrow("within Claude Code");
      expect(() => parseEnableArgs(args)).toThrow("within Claude Code");
    },
  );
});

it("rejects control bytes in raw executable arguments before filesystem validation", () => {
  expect(() => parseEnableArgs(["--yes", "--scope", "global", "--cli", "/tmp/cli\n"])).toThrow();
});

it.each([true, false])("parses subscription flag presence %s with all other options", (choice) => {
  const flags = choice ? ["--use-claude-subscription"] : [];
  expect(
    parseEnableArgs([
      "--yes",
      ...flags,
      "--scope",
      "project",
      "--profile",
      "test",
      "--api-url",
      API_URL,
      "--gateway-url",
      UPSTREAM,
      "--cli",
      "/bin/cli",
      "--port",
      "43127",
    ]),
  ).toMatchObject({
    scope: "project",
    useClaudeSubscription: choice,
    profile: "test",
    port: 43127,
  });
  expect(parseEnableArgs(["--yes", "--scope", "global"]).useClaudeSubscription).toBe(false);
});
it.each([
  ["--use-claude-subscription", "--no-use-claude-subscription"],
  ["--no-use-claude-subscription", "--use-claude-subscription"],
  ["--use-claude-subscription", "--use-claude-subscription"],
  ["--no-use-claude-subscription", "--no-use-claude-subscription"],
  ["--no-use-claude-subscription"],
  ["--use-claude-subscription=true"],
  ["--use-claude-subscription=false"],
  ["--use-claude-subscription", "true"],
  ["--use-claude-subscription", "false"],
  ["--no-use-claude-subscription", "false"],
])("rejects unsupported subscription arguments %j", (...flags) => {
  expect(() => parseEnableArgs(["--yes", "--scope", "global", ...flags])).toThrow();
});

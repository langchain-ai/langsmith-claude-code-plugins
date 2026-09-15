import { describe, expect, it } from "vitest";
import { httpsOrigin, endpoints, API_URL, UPSTREAM } from "./config.js";
import { parseSetupArgs } from "./options.js";

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
  it("accepts named setup options and profile plus endpoint pair", () => {
    expect(
      parseSetupArgs([
        "--scope",
        "global",
        "--cli",
        "/bin/cli",
        "--profile",
        "preview",
        "--port",
        "52507",
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
      port: 52507,
      apiUrl: "https://api.preview.test",
      gatewayUrl: "https://gateway.preview.test",
    });
    expect(parseSetupArgs(["--scope", "global", "--profile", "preview"])).toEqual({
      scope: "global",
      useClaudeSubscription: false,
      profile: "preview",
    });
    expect(parseSetupArgs(["--scope", "global"])).toEqual({
      scope: "global",
      useClaudeSubscription: false,
      profile: undefined,
    });
  });
  it.each([
    ["--scope", "global", "--api-url", API_URL],
    ["--scope", "global", "--gateway-url", UPSTREAM],
    ["--scope", "global", "--profile", "a", "--profile", "b"],
    ["--scope", "global", "--profile"],
    ["--scope", "global", "--unknown", "x"],
    ["--scope", "global", "/cli", "a", "52507"],
    ["--scope", "global", "bare"],
    ["--yes", "--scope", "global"],
    ["--scope", "global", "--profile", "bad profile"],
    ["--scope", "global", "--api-url=http://bad"],
  ])("refuses invalid or mutually exclusive flags: %j", (...args) => {
    expect(() => parseSetupArgs(args)).toThrow();
  });
  it.each([[], ["/cli", "a", "52507"], ["--profile", "preview"]])(
    "requires explicit scope: %j",
    (...args) => {
      expect(() => parseSetupArgs(args)).toThrow("within Claude Code");
    },
  );
});

it("rejects control bytes in setup arguments before filesystem validation", () => {
  expect(() => parseSetupArgs(["--scope", "global", "--cli", "/tmp/cli\n"])).toThrow();
});

it.each([true, false])("parses subscription flag presence %s with all other options", (choice) => {
  const flags = choice ? ["--use-claude-subscription"] : [];
  expect(
    parseSetupArgs([
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
      "52507",
    ]),
  ).toMatchObject({
    scope: "project",
    useClaudeSubscription: choice,
    profile: "test",
    port: 52507,
  });
});
it.each([
  ["--use-claude-subscription", "--use-claude-subscription"],
  ["--no-use-claude-subscription"],
  ["--use-claude-subscription=true"],
  ["--use-claude-subscription=false"],
  ["--use-claude-subscription", "true"],
  ["--use-claude-subscription", "false"],
])("rejects unsupported subscription arguments %j", (...flags) => {
  expect(() => parseSetupArgs(["--scope", "global", ...flags])).toThrow();
});

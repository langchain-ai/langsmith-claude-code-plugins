import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { releaseAssetName } from "./updater-utils.js";

const {
  APPLE_CREDENTIALS,
  acceptedSubmissionId,
  decodeBase64Credential,
  developerIdIdentity,
  developerIdRequirement,
  missingAppleCredentials,
  sign,
} = await import("../scripts/sign.binary.mjs");

const root = fileURLToPath(new URL("../", import.meta.url));
const workflow = readFileSync(join(root, ".github/workflows/build-binary.yml"), "utf8");
const entitlements = readFileSync(join(root, "macos-entitlements.plist"), "utf8");
const credentials: string[] = APPLE_CREDENTIALS;
const allSet = Object.fromEntries(credentials.map((name) => [name, "set"]));
const missing = (env: Record<string, string>): string[] => [...missingAppleCredentials(env)].sort();

const FOUND_IDENTITIES = [
  '  1) 0000000000000000000000000000000000000001 "Apple Development: Someone (AAAAAAAAAA)"',
  '  2) 0000000000000000000000000000000000000002 "Developer ID Installer: LangChain (BBBBBBBBBB)"',
  '  3) 0000000000000000000000000000000000000003 "Developer ID Application: LangChain (CCCCCCCCCC)"',
  "     3 valid identities found",
].join("\n");

describe("the Apple credentials", () => {
  it("names the five secrets the signing step is given", () => {
    expect([...credentials].sort()).toEqual([
      "APPLE_API_ISSUER",
      "APPLE_API_KEY",
      "APPLE_API_KEY_ID",
      "CSC_KEY_PASSWORD",
      "CSC_LINK",
    ]);
    for (const name of credentials) expect(workflow).toContain(`secrets.${name} }}`);
  });

  it("reports every unset or blank one", () => {
    expect(missing({})).toEqual([...credentials].sort());
    expect(missing(allSet)).toEqual([]);
    expect(missing({ ...allSet, CSC_LINK: "  \n" })).toEqual(["CSC_LINK"]);
  });
});

describe("sign", () => {
  const absent = join(root, "bin/no-such-binary");

  it("keeps the ad-hoc signature and names what is absent when nothing is set", async () => {
    const lines: string[] = [];
    await expect(
      sign({ binaryPath: absent, env: {}, out: (line: string) => lines.push(line) }),
    ).resolves.toBeUndefined();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Keeping the ad-hoc signature");
    for (const name of credentials) expect(lines[0]).toContain(name);
  });

  it("keeps the ad-hoc signature when only some credentials are set", async () => {
    const lines: string[] = [];
    await expect(
      sign({
        binaryPath: absent,
        env: { ...allSet, APPLE_API_ISSUER: "" },
        out: (line: string) => lines.push(line),
      }),
    ).resolves.toBeUndefined();
    expect(lines[0]).toContain("APPLE_API_ISSUER");
    expect(lines[0]).not.toContain("CSC_LINK");
  });
});

describe("developerIdIdentity", () => {
  it("picks the Developer ID Application identity and ignores the others", () => {
    expect(developerIdIdentity(FOUND_IDENTITIES)).toBe(
      "Developer ID Application: LangChain (CCCCCCCCCC)",
    );
  });

  it("rejects a keychain holding no such identity", () => {
    expect(() => developerIdIdentity("     0 valid identities found")).toThrow(
      "Developer ID Application",
    );
  });
});

describe("developerIdRequirement", () => {
  it("pins the Apple anchor and the team the certificate carries", () => {
    expect(developerIdRequirement(developerIdIdentity(FOUND_IDENTITIES))).toBe(
      "=anchor apple generic and certificate leaf[subject.OU] = CCCCCCCCCC",
    );
  });

  it("rejects an identity that ends in no team ID", () => {
    expect(() => developerIdRequirement("Developer ID Application: LangChain")).toThrow(
      "no Apple team ID",
    );
  });
});

describe("decodeBase64Credential", () => {
  it("decodes a wrapped base64 value", () => {
    expect(decodeBase64Credential("bGFuZ3Nt\naXRo\n", "CSC_LINK").toString()).toBe("langsmith");
  });

  it("rejects a value that decodes to nothing", () => {
    expect(() => decodeBase64Credential("   ", "CSC_LINK")).toThrow("CSC_LINK is empty");
  });
});

describe("acceptedSubmissionId", () => {
  it("returns the submission id Apple accepted", () => {
    expect(acceptedSubmissionId({ id: "abc", status: "Accepted" })).toBe("abc");
  });

  it.each([
    [{ id: "abc", status: "Invalid" }, "abc came back Invalid"],
    [{}, "submission came back an unreadable status"],
  ])("refuses %j", (submission, message) => {
    expect(() => acceptedSubmissionId(submission)).toThrow(message);
  });
});

describe("the macOS entitlements", () => {
  it("grants allow-jit and nothing wider", () => {
    expect(entitlements.match(/<key>([^<]+)<\/key>/g)).toEqual([
      "<key>com.apple.security.cs.allow-jit</key>",
    ]);
  });

  it("carries no entitlement that Apple refuses to notarize", () => {
    expect(entitlements).not.toContain("com.apple.security.get-task-allow");
  });
});

describe("the build workflow", () => {
  it("rebuilds the binary when any signing input changes", () => {
    const paths = /paths:\n((?:\s+- \S+\n)+)/.exec(workflow)?.[1] ?? "";
    for (const path of [
      "macos-entitlements.plist",
      "scripts/sign.binary.mjs",
      "src/sign-binary.test.ts",
    ]) {
      expect(paths).toContain(`- ${path}\n`);
    }
  });

  it("skips the signing step unless the job found every credential", () => {
    expect(workflow).toContain("if: env.HAS_APPLE_CREDENTIALS == 'true'");
    for (const name of credentials) expect(workflow).toContain(`secrets.${name} != ''`);
  });

  it("gates signing and publishing on one tag check", () => {
    expect(workflow.match(/startsWith\(github\.ref, 'refs\/tags\/'\)/g)).toHaveLength(1);
    expect(workflow).toContain("publishing: ${{ steps.release-gate.outputs.publishing }}");
    expect(workflow).toContain("if: needs.build-unsigned.outputs.publishing == 'true'");
  });

  it("publishes the asset name the updater and the installer look for", () => {
    expect(/^ +ASSET_NAME: (.+)$/m.exec(workflow)?.[1]).toBe(
      releaseAssetName("darwin", "arm64", "${{ github.ref_name }}"),
    );
  });

  it("moves one artifact name through build, signing and publishing", () => {
    const artifact = "langsmith-claude-code-tracing-darwin-arm64-unsigned";
    const names = [...workflow.matchAll(/^ {10}name: (\S+)$/gm)].map((match) => match[1]);
    expect(names).toEqual([artifact, artifact, artifact, artifact]);
  });

  it("waits for signing before it publishes", () => {
    expect(workflow).toContain("needs: [build-unsigned, sign-and-notarize]");
  });

  it("replaces the unsigned artifact with the signed one", () => {
    expect(workflow).toContain("overwrite: true");
  });
});

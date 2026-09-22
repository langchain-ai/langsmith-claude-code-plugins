import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EXECUTABLE_NAME, PUBLISHED_TARGETS } from "./binary-constants.js";
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
const arches = PUBLISHED_TARGETS.darwin as string[];
const jobs = workflow.split(/\n {2}(?=[a-z-]+:\n)/);
const job = (name: string) => jobs.find((body) => body.startsWith(`${name}:\n`)) ?? "";
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

  it("refuses to run and names every credential when nothing is set", async () => {
    const lines: string[] = [];
    const attempt = sign({ binaryPath: absent, env: {}, out: (line: string) => lines.push(line) });

    await expect(attempt).rejects.toThrow("these Apple credentials are not set");
    for (const name of credentials) await expect(attempt).rejects.toThrow(name);
    expect(lines).toEqual([]);
  });

  it("refuses to run when only some credentials are set", async () => {
    const attempt = sign({ binaryPath: absent, env: { ...allSet, APPLE_API_ISSUER: "" } });

    await expect(attempt).rejects.toThrow("APPLE_API_ISSUER");
    await expect(attempt).rejects.not.toThrow("CSC_LINK");
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
  it("rebuilds the binary when any signing or build input changes", () => {
    const paths = /paths:\n((?:\s+- \S+\n)+)/.exec(workflow)?.[1] ?? "";
    for (const path of [
      "macos-entitlements.plist",
      "scripts/build.binary.mjs",
      "scripts/sign.binary.mjs",
      "src/build-binary.test.ts",
      "src/sign-binary.test.ts",
    ]) {
      expect(paths).toContain(`- ${path}\n`);
    }
  });

  it("always signs, so a release can never go out unsigned", () => {
    const step = /- name: Sign and Notarize the Binary\n((?: {8}.+\n|\n)+)/.exec(
      job("sign-and-notarize"),
    )?.[1];

    expect(step).toBeDefined();
    expect(step).not.toContain("if:");
    for (const name of credentials) expect(step).toContain(`${name}: \${{ secrets.${name} }}`);
    expect(workflow).not.toContain("HAS_APPLE_CREDENTIALS");
  });

  it("gates signing and publishing on one tag check", () => {
    expect(workflow.match(/startsWith\(github\.ref, 'refs\/tags\/'\)/g)).toHaveLength(1);
    expect(workflow).toContain("publishing: ${{ steps.release-gate.outputs.publishing }}");
    expect(workflow).toContain("if: steps.release-gate.outputs.publishing == 'true'");
    expect(
      workflow.match(/if: needs\.build-unsigned\.outputs\.publishing == 'true'/g),
    ).toHaveLength(2);
  });

  it("cross compiles every published architecture in one build job", () => {
    const body = job("build-unsigned");

    expect(body).toContain("runs-on: macos-26\n");
    expect(body).toContain("pnpm build:binary -- --arch=all");
    expect(body).not.toContain("matrix.");
  });

  it("uploads each unsigned architecture under its own name", () => {
    const body = job("build-unsigned");
    const uploaded = [...body.matchAll(/^ {10}path: (\S+)$/gm)].map((match) => match[1]);

    expect(uploaded).toEqual([`bin/${EXECUTABLE_NAME}`, `bin/darwin-x64/${EXECUTABLE_NAME}`]);
    for (const arch of arches) {
      expect(body, arch).toContain(`name: ${EXECUTABLE_NAME}-darwin-${arch}-unsigned\n`);
    }
  });

  it("runs the x64 binary on a real Intel runner on every build", () => {
    const body = job("run-on-intel");

    expect(body).toContain("runs-on: macos-26-intel");
    expect(body).toContain("needs: build-unsigned");
    expect(body).not.toContain("publishing == 'true'");
    expect(body).toContain(`name: ${EXECUTABLE_NAME}-darwin-x64-unsigned`);
  });

  it("signs each published architecture on a runner of that architecture", () => {
    const body = job("sign-and-notarize");
    const legs = [...body.matchAll(/^ {10}- arch: (\S+)$/gm)].map((match) => match[1]);

    expect(legs).toEqual(arches);
    expect(body).toContain("runs-on: ${{ matrix.runner }}");
    expect(body).toContain("architecture: ${{ matrix.arch }}");
    expect(body.match(/runner: macos-26\n/g)).toHaveLength(1);
    expect(body.match(/runner: macos-26-intel\n/g)).toHaveLength(1);
  });

  it("runs one named suite against the unsigned, the Intel and the signed binary", () => {
    for (const name of ["build-unsigned", "run-on-intel", "sign-and-notarize"]) {
      expect(job(name), name).toContain("run: pnpm test:binary\n");
    }

    const { scripts } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    for (const file of [
      "src/build-binary.test.ts",
      "src/hooks/dispatch.binary.test.ts",
      "src/install-binary.test.ts",
    ]) {
      expect(scripts["test:binary"]).toContain(file);
    }
  });

  it("restores the executable bit once per job that downloads a binary", () => {
    for (const name of ["run-on-intel", "sign-and-notarize"]) {
      const body = job(name);
      expect(body.match(/- name: Restore the Executable Bit/g), name).toHaveLength(1);
      expect(body, name).toContain(`chmod +x bin/${EXECUTABLE_NAME}`);
    }
  });

  it("publishes nothing until the Intel run and every signing leg have passed", () => {
    expect(job("publish")).toContain("needs: [build-unsigned, run-on-intel, sign-and-notarize]");
    expect(job("sign-and-notarize")).toContain("fail-fast: false");
  });

  it("publishes only what the signing job signed, never the unsigned build", () => {
    const signing = job("sign-and-notarize");

    expect(signing).toContain(`name: ${EXECUTABLE_NAME}-darwin-\${{ matrix.arch }}-unsigned`);
    expect(signing).toContain(`name: ${EXECUTABLE_NAME}-darwin-\${{ matrix.arch }}-signed`);
    expect(signing).not.toContain("overwrite: true");
    expect(job("publish")).toContain(`pattern: ${EXECUTABLE_NAME}-darwin-*-signed`);

    const artifacts = [
      ...job("publish").matchAll(new RegExp(`${EXECUTABLE_NAME}-darwin-\\S*?-(un)?signed`, "g")),
    ];
    expect(artifacts.length).toBeGreaterThan(0);
    expect(artifacts.filter((match) => match[1] !== undefined)).toEqual([]);
  });

  it("publishes the asset name the updater and the installer look for", () => {
    const body = job("publish");

    expect(/^ +ASSET_NAME="(.+)"$/m.exec(body)?.[1]).toBe(
      releaseAssetName("darwin", "$ARCH", "$TAG"),
    );
    expect(body).toContain(`for ARCH in ${arches.join(" ")}; do`);
    expect(body.match(/gh release (upload|create) "\$TAG" "\$\{ASSETS\[@\]\}"/g)).toHaveLength(2);
  });
});

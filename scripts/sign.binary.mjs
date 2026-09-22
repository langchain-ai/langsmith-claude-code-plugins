#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { outputPath } from "./build.binary.mjs";

const DEVELOPER_ID_PREFIX = "Developer ID Application:";
const IDENTITY_LINE = /^\s*\d+\)\s+[0-9A-Fa-f]{40}\s+"([^"]+)"$/gm;
const TEAM_ID_SUFFIX = /\(([A-Z0-9]{10})\)$/;

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const entitlementsPath = join(repoRoot, "macos-entitlements.plist");

export const APPLE_CREDENTIALS = [
  "APPLE_API_ISSUER",
  "APPLE_API_KEY",
  "APPLE_API_KEY_ID",
  "CSC_KEY_PASSWORD",
  "CSC_LINK",
];

export function missingAppleCredentials(env) {
  return APPLE_CREDENTIALS.filter((name) => (env[name] ?? "").trim() === "");
}

export function decodeBase64Credential(value, name) {
  const decoded = Buffer.from(value.replace(/\s/g, ""), "base64");
  if (decoded.byteLength === 0) throw new Error(`${name} is empty or is not base64`);
  return decoded;
}

export function developerIdIdentity(findIdentityOutput) {
  const identity = [...findIdentityOutput.matchAll(IDENTITY_LINE)]
    .map((match) => match[1])
    .find((name) => name.startsWith(DEVELOPER_ID_PREFIX));
  if (!identity) throw new Error(`CSC_LINK carries no ${DEVELOPER_ID_PREFIX} identity`);
  return identity;
}

export function developerIdRequirement(identity) {
  const teamId = TEAM_ID_SUFFIX.exec(identity)?.[1];
  if (!teamId) throw new Error(`the identity ${identity} ends in no Apple team ID`);
  return `=anchor apple generic and certificate leaf[subject.OU] = ${teamId}`;
}

export function acceptedSubmissionId(submission) {
  const { id = "submission", status = "an unreadable status" } = submission;
  if (status !== "Accepted") throw new Error(`Apple notarization ${id} came back ${status}`);
  return id;
}

const security = (args) => execFileSync("/usr/bin/security", args, { encoding: "utf-8" });
const codesign = (args) => execFileSync("/usr/bin/codesign", args, { stdio: "inherit" });

function securityWithoutEchoingCredentials(args, failure) {
  try {
    execFileSync("/usr/bin/security", args, { stdio: "ignore" });
  } catch {
    throw new Error(`could not ${failure}`);
  }
}

function userKeychains() {
  return [...security(["list-keychains", "-d", "user"]).matchAll(/"([^"]+)"/g)].map(
    (match) => match[1],
  );
}

function searchUserKeychains(keychains) {
  security(["list-keychains", "-d", "user", "-s", ...keychains]);
}

async function writeCredentialFile(path, value, name) {
  await writeFile(path, decodeBase64Credential(value, name), { mode: 0o600, flag: "wx" });
  return path;
}

async function signAndNotarize(binaryPath, env) {
  const workspace = await mkdtemp(join(tmpdir(), "langsmith-binary-signing-"));
  const keychain = join(workspace, "signing.keychain-db");
  const password = randomBytes(32).toString("hex");
  const originalKeychains = userKeychains();
  try {
    const certificate = await writeCredentialFile(
      join(workspace, "developer-id-application.p12"),
      env.CSC_LINK,
      "CSC_LINK",
    );
    const notarizationKey = await writeCredentialFile(
      join(workspace, "notarization-key.p8"),
      env.APPLE_API_KEY,
      "APPLE_API_KEY",
    );

    securityWithoutEchoingCredentials(
      ["create-keychain", "-p", password, keychain],
      "create the temporary signing keychain",
    );
    searchUserKeychains([keychain, ...originalKeychains]);
    securityWithoutEchoingCredentials(
      ["unlock-keychain", "-p", password, keychain],
      "unlock the temporary signing keychain",
    );
    securityWithoutEchoingCredentials(
      [
        "import",
        certificate,
        "-P",
        env.CSC_KEY_PASSWORD,
        "-f",
        "pkcs12",
        "-T",
        "/usr/bin/codesign",
        "-k",
        keychain,
      ],
      "import CSC_LINK into the temporary signing keychain",
    );
    securityWithoutEchoingCredentials(
      ["set-key-partition-list", "-S", "apple-tool:,apple:", "-s", "-k", password, keychain],
      "let codesign use the imported certificate",
    );

    const identity = developerIdIdentity(
      security(["find-identity", "-v", "-p", "codesigning", keychain]),
    );
    codesign([
      "--force",
      "--options",
      "runtime",
      "--timestamp",
      "--entitlements",
      entitlementsPath,
      "--keychain",
      keychain,
      "--sign",
      identity,
      binaryPath,
    ]);
    const requirement = developerIdRequirement(identity);
    codesign(["--verify", "--strict", "--verbose=2", "-R", requirement, binaryPath]);

    const archive = join(workspace, "notarization.zip");
    execFileSync("/usr/bin/ditto", ["-c", "-k", "--keepParent", binaryPath, archive], {
      stdio: "inherit",
    });
    const submission = JSON.parse(
      execFileSync(
        "/usr/bin/xcrun",
        [
          "notarytool",
          "submit",
          archive,
          "--key",
          notarizationKey,
          "--key-id",
          env.APPLE_API_KEY_ID,
          "--issuer",
          env.APPLE_API_ISSUER,
          "--wait",
          "--timeout",
          "30m",
          "--output-format",
          "json",
        ],
        { encoding: "utf-8" },
      ),
    );
    return { identity, submissionId: acceptedSubmissionId(submission) };
  } finally {
    searchUserKeychains(originalKeychains);
    await rm(workspace, { force: true, recursive: true });
  }
}

export async function sign({ binaryPath, env = process.env, out = console.log } = {}) {
  const missing = missingAppleCredentials(env);
  if (missing.length > 0) {
    throw new Error(`these Apple credentials are not set: ${missing.join(", ")}`);
  }

  const target = binaryPath ?? outputPath(process.arch);
  const { identity, submissionId } = await signAndNotarize(target, env);
  out(`Signed ${target} as ${identity}`);
  out(`Apple notarization ${submissionId} accepted`);
  return submissionId;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    await sign({ binaryPath: process.argv[2] });
  } catch (err) {
    console.error(`Signing failed: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

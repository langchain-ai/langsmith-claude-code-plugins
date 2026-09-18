import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { arch, platform } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MINIMUM_NODE = { major: 25, minor: 5 };
const SUPPORTED_TARGET = "darwin-arm64";

function checkBuildEnvironment() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < MINIMUM_NODE.major || (major === MINIMUM_NODE.major && minor < MINIMUM_NODE.minor)) {
    throw new Error(
      `Building the binary needs Node >= ${MINIMUM_NODE.major}.${MINIMUM_NODE.minor}.0 for --build-sea, found ${process.versions.node}. Upgrade Node and try again.`,
    );
  }

  const target = `${platform()}-${arch()}`;
  if (target !== SUPPORTED_TARGET) {
    throw new Error(`Unsupported binary target ${target}, only ${SUPPORTED_TARGET} is built`);
  }

  return target;
}

const target = checkBuildEnvironment();

// Node resolves the paths in sea-config.json against the cwd.
process.chdir(fileURLToPath(new URL("./", import.meta.url)));

const seaConfigPath = "sea-config.json";
const { main: injectedScriptPath, output: binaryPath } = JSON.parse(
  readFileSync(seaConfigPath, "utf-8"),
);
const { version } = JSON.parse(readFileSync("package.json", "utf-8"));

// CommonJS to match sea-config.json's mainFormat.
await build({
  entryPoints: ["dist/hooks/dispatch.js"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: injectedScriptPath,
  external: ["node:*"],
  define: {
    __LS_INTEGRATION_VERSION__: JSON.stringify(version),
  },
});

mkdirSync(dirname(binaryPath), { recursive: true });
execFileSync(process.execPath, ["--build-sea", seaConfigPath], { stdio: "inherit" });

// macOS kills an unsigned arm64 binary, and the `-` identity needs no certificate.
execFileSync("/usr/bin/codesign", ["--force", "--sign", "-", binaryPath], { stdio: "inherit" });

console.log(`Built the ${target} binary ${binaryPath} (${statSync(binaryPath).size} bytes)`);

#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MACH_O_ARCHES = { arm64: "arm64", x64: "x86_64" };

export const PUBLISHED_PLATFORM = "darwin";
export const PUBLISHED_ARCHES = ["arm64", "x64"];
export const EXECUTABLE_NAME = "langsmith-claude-code-tracing";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const binDirectory = join(repoRoot, "bin");
const entryPoint = join(repoRoot, "src", "hooks", "dispatch.ts");
const hooksManifest = join(repoRoot, "hooks", "hooks.binary.json");

export function requestedArches(argv) {
  const requested = argv.find((arg) => arg.startsWith("--arch="))?.slice("--arch=".length);
  if (requested === "all") return [...PUBLISHED_ARCHES];
  const arch = requested ?? process.arch;
  if (!PUBLISHED_ARCHES.includes(arch)) {
    throw new Error(
      `Unsupported architecture ${arch}, expected one of ${[...PUBLISHED_ARCHES, "all"].join(", ")}`,
    );
  }
  return [arch];
}

export function machOArch(arch) {
  const name = MACH_O_ARCHES[arch];
  if (!name) throw new Error(`No Mach-O architecture is known for ${arch}`);
  return name;
}

export function outputPath(arch) {
  if (arch === process.arch) return join(binDirectory, EXECUTABLE_NAME);
  return join(binDirectory, `${PUBLISHED_PLATFORM}-${arch}`, EXECUTABLE_NAME);
}

export function buildArguments(arch, version, binary) {
  return [
    "build",
    "--compile",
    `--target=bun-${PUBLISHED_PLATFORM}-${arch}`,
    ...defineFlag("__LS_INTEGRATION_VERSION__", version),
    ...defineFlag("__LS_BINARY_HOOKS__", readFileSync(hooksManifest, "utf-8")),
    entryPoint,
    "--outfile",
    binary,
  ];
}

function defineFlag(name, value) {
  return ["--define", `${name}=${JSON.stringify(value)}`];
}

export function checkBuiltArch(binary, arch) {
  const wanted = machOArch(arch);
  const built = execFileSync("/usr/bin/lipo", ["-archs", binary], { encoding: "utf-8" }).trim();
  if (built !== wanted) {
    throw new Error(`The ${arch} build produced ${built}, not ${wanted}`);
  }
}

export function checkReportedVersion(binary, version) {
  const reported = execFileSync(binary, ["--version"], { encoding: "utf-8" }).trim();
  if (reported !== version) {
    throw new Error(`The built binary reports version ${reported}, expected ${version}`);
  }
}

function signAdHoc(binary) {
  execFileSync("/usr/bin/codesign", ["--force", "--sign", "-", binary], { stdio: "inherit" });
}

export function build(argv) {
  if (process.platform !== PUBLISHED_PLATFORM) {
    throw new Error(
      `Unsupported build host ${process.platform}, only ${PUBLISHED_PLATFORM} is built`,
    );
  }

  const { version } = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8"));
  for (const arch of requestedArches(argv)) {
    const binary = outputPath(arch);
    mkdirSync(dirname(binary), { recursive: true });
    rmSync(binary, { force: true });
    execFileSync("bun", buildArguments(arch, version, binary), {
      cwd: repoRoot,
      stdio: "inherit",
    });
    checkBuiltArch(binary, arch);
    signAdHoc(binary);
    if (arch === process.arch) checkReportedVersion(binary, version);
    console.log(
      `Built the ${PUBLISHED_PLATFORM}-${arch} binary ${binary} (${statSync(binary).size} bytes, version ${version})`,
    );
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    build(process.argv.slice(2));
  } catch (err) {
    console.error(`Build failed: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { EXECUTABLE_NAME, PUBLISHED_TARGETS } from "./binary-constants.js";
import { isPublishedTarget } from "./updater-utils.js";

const {
  PUBLISHED_ARCHES,
  PUBLISHED_PLATFORM,
  buildArguments,
  checkBuiltArch,
  checkReportedVersion,
  machOArch,
  outputPath,
  requestedArches,
} = await import("../scripts/build.binary.mjs");

const root = fileURLToPath(new URL("../", import.meta.url));
const binDirectory = join(root, "bin");
const arches: string[] = PUBLISHED_ARCHES;
const otherArch = arches.find((arch) => arch !== process.arch) as string;
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const bothBuilt = arches.every((arch) => existsSync(outputPath(arch)));

describe("the architectures the build knows about", () => {
  it("are the ones the installer and the updater will accept", () => {
    expect(PUBLISHED_PLATFORM).toBe("darwin");
    expect(arches).toEqual([...(PUBLISHED_TARGETS[PUBLISHED_PLATFORM] ?? [])]);
    for (const arch of arches) expect(isPublishedTarget(PUBLISHED_PLATFORM, arch)).toBe(true);
  });

  it("build to the name the installer registers as a hook", () => {
    for (const arch of arches) expect(outputPath(arch).endsWith(`/${EXECUTABLE_NAME}`)).toBe(true);
  });
});

describe("requestedArches", () => {
  it("builds this machine's architecture when nothing is asked for", () => {
    expect(requestedArches([])).toEqual([process.arch]);
  });

  it("builds every published architecture for --arch=all", () => {
    expect(requestedArches(["--arch=all"])).toEqual(arches);
  });

  it.each(arches)("builds only %s when it is the one named", (arch) => {
    expect(requestedArches([`--arch=${arch}`])).toEqual([arch]);
  });

  it("refuses an architecture nothing is published for", () => {
    expect(() => requestedArches(["--arch=ia32"])).toThrow(
      `Unsupported architecture ia32, expected one of ${[...arches, "all"].join(", ")}`,
    );
  });
});

describe("outputPath", () => {
  it("writes this machine's binary where the tests and the signer look for it", () => {
    expect(outputPath(process.arch)).toBe(join(binDirectory, EXECUTABLE_NAME));
  });

  it("writes a cross compiled binary into a directory of its own", () => {
    expect(outputPath(otherArch)).toBe(join(binDirectory, `darwin-${otherArch}`, EXECUTABLE_NAME));
  });
});

describe("machOArch", () => {
  it("names the architecture lipo reports for each published one", () => {
    expect(machOArch("arm64")).toBe("arm64");
    expect(machOArch("x64")).toBe("x86_64");
  });

  it("refuses an architecture it has no name for", () => {
    expect(() => machOArch("ia32")).toThrow("No Mach-O architecture is known for ia32");
  });
});

describe("buildArguments", () => {
  it.each(arches)("targets %s and writes that architecture's own file", (arch) => {
    const args: string[] = buildArguments(arch, version, outputPath(arch));

    expect(args.slice(0, 3)).toEqual(["build", "--compile", `--target=bun-darwin-${arch}`]);
    expect(args.slice(-2)).toEqual(["--outfile", outputPath(arch)]);
    expect(args).toContain(join(root, "src", "hooks", "dispatch.ts"));
  });

  it("passes the version and the hooks in the form Bun reads, not esbuild's", () => {
    const args: string[] = buildArguments(process.arch, version, "out");
    const defined = Object.fromEntries(
      args.flatMap((arg, index) =>
        arg === "--define" ? [args[index + 1].split(/=(.*)/s) as [string, string]] : [],
      ),
    );

    expect(Object.keys(defined)).toEqual(["__LS_INTEGRATION_VERSION__", "__LS_BINARY_HOOKS__"]);
    expect(JSON.parse(defined.__LS_INTEGRATION_VERSION__)).toBe(version);
    expect(Object.keys(JSON.parse(JSON.parse(defined.__LS_BINARY_HOOKS__)).hooks)).toEqual(
      Object.keys(JSON.parse(readFileSync(join(root, "hooks/hooks.binary.json"), "utf8")).hooks),
    );
    expect(args.some((arg) => arg.startsWith("--define:") || arg.startsWith("--define="))).toBe(
      false,
    );
  });
});

describe.runIf(bothBuilt)("the cross compiled binary", () => {
  it("holds the architecture it was built for and not this machine's", () => {
    expect(() => checkBuiltArch(outputPath(otherArch), otherArch)).not.toThrow();
    expect(() => checkBuiltArch(outputPath(otherArch), process.arch)).toThrow(
      `produced ${machOArch(otherArch)}, not ${machOArch(process.arch)}`,
    );
  });
});

describe.runIf(existsSync(outputPath(process.arch)))("this machine's built binary", () => {
  it("holds this machine's architecture", () => {
    expect(() => checkBuiltArch(outputPath(process.arch), process.arch)).not.toThrow();
    expect(() => checkBuiltArch(outputPath(process.arch), otherArch)).toThrow(
      `produced ${machOArch(process.arch)}, not ${machOArch(otherArch)}`,
    );
  });

  it("reports the package version", () => {
    expect(() => checkReportedVersion(outputPath(process.arch), version)).not.toThrow();
  });

  it("is refused when it reports anything else", () => {
    expect(() => checkReportedVersion(outputPath(process.arch), "9.9.9")).toThrow(
      `reports version ${version}, expected 9.9.9`,
    );
  });
});

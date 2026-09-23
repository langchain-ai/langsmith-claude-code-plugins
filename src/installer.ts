import { arch as osArch, homedir, platform as osPlatform } from "node:os";
import { dirname, join } from "node:path";
import { binary } from "./binary-target.js";
import { LS_INTEGRATION_VERSION } from "./config.js";
import { OLDER_THAN_ANY_RELEASE, TRACING_PLUGIN_ID } from "./constants.js";
import type { BinaryInstallOptions, HooksManifest, SettingsFile } from "./types.js";
import { runningCompiledBinary } from "./utils/binary-runtime.js";
import { underHome } from "./utils/paths.js";
import {
  projectSettingsPath,
  readSettings,
  userSettingsPath,
  writeSettings,
} from "./utils/settings.js";

declare const __LS_BINARY_HOOKS__: string;

export function mergeHooks(existing: SettingsFile, manifest: HooksManifest): SettingsFile {
  const merged: HooksManifest = { ...existing.hooks };
  for (const [event, groups] of Object.entries(manifest)) {
    const current = Array.isArray(merged[event]) ? merged[event] : [];
    const present = new Set(
      current.flatMap((group) => (group?.hooks ?? []).map((hook) => hook?.command)),
    );
    merged[event] = [
      ...current,
      ...groups.filter((group) => (group.hooks ?? []).every((hook) => !present.has(hook.command))),
    ];
  }
  return { ...existing, hooks: merged };
}

function compiledHooksManifest(): HooksManifest {
  const compiled = typeof __LS_BINARY_HOOKS__ === "undefined" ? undefined : __LS_BINARY_HOOKS__;
  const hooks = compiled ? (JSON.parse(compiled) as SettingsFile).hooks : undefined;
  if (!hooks || typeof hooks !== "object" || Array.isArray(hooks)) {
    throw new Error("this build carries no hooks manifest");
  }
  return hooks;
}

function hookCount(manifest: HooksManifest): number {
  return Object.values(manifest).reduce(
    (total, groups) =>
      total + groups.reduce((inGroups, group) => inGroups + (group.hooks ?? []).length, 0),
    0,
  );
}

function requestedTag(args: string[]): string | undefined {
  const index = args.indexOf("--tag");
  if (index === -1) return undefined;
  const tag = args[index + 1];
  if (!tag || tag.startsWith("-")) {
    throw new Error("--tag needs a release tag, for example --tag 0.4.0");
  }
  return tag;
}

async function tracingPluginIsEnabled(home: string): Promise<boolean> {
  try {
    const { enabledPlugins } = await readSettings(userSettingsPath(home));
    return (enabledPlugins as Record<string, unknown> | undefined)?.[TRACING_PLUGIN_ID] === true;
  } catch {
    return false;
  }
}

export async function install(options: BinaryInstallOptions = {}): Promise<string> {
  const args = options.args ?? [];
  const tag = requestedTag(args);
  const platform = options.runtimePlatform ?? osPlatform();
  const arch = options.runtimeArch ?? osArch();
  if (!binary.supportsHost(platform, arch)) {
    throw new Error(
      `no binary is published for ${platform}-${arch}. Install the Node plugin with '/plugin install ${TRACING_PLUGIN_ID}' instead`,
    );
  }

  const home = options.home ?? homedir();
  const settingsPath = args.includes("--project")
    ? projectSettingsPath(options.cwd ?? process.cwd())
    : userSettingsPath(home);
  const manifest = options.hooksManifest ?? compiledHooksManifest();
  const merged = mergeHooks(await readSettings(settingsPath), manifest);
  const settings = `${JSON.stringify(merged, null, 2)}\n`;
  const out = options.out ?? console.log;

  if (args.includes("--print")) {
    out(settings.trimEnd());
    return settingsPath;
  }

  const currentVersion = options.currentVersion ?? LS_INTEGRATION_VERSION ?? OLDER_THAN_ANY_RELEASE;
  const executablePath = options.executablePath ?? process.execPath;
  const copyable = !tag && (options.compiledBinary ?? runningCompiledBinary());
  const host = {
    fetchImpl: options.fetchImpl,
    home,
    releasesApi: options.releasesApi,
    runtimeArch: arch,
    runtimePlatform: platform,
    verifySignature: options.verifySignature,
  };
  const installed = copyable
    ? await binary.installLocalCopy(executablePath, currentVersion, host)
    : await binary.install({ ...host, currentVersion, tag });

  await writeSettings(settingsPath, settings);

  const configPath = join(dirname(settingsPath), "langsmith.json");
  for (const line of [
    `Installed ${binary.target.executableName} ${installed.version} to ${underHome(dirname(installed.path), home)}`,
    `Registered ${hookCount(manifest)} hooks in ${underHome(settingsPath, home)}`,
    "",
    "Next:",
    `  1. Create ${underHome(configPath, home)} (if it doesn't exist already):`,
    `       {"enabled": true, "api_key": "<your-api-key>", "project": "my-project"}`,
    "  2. Restart Claude Code",
  ]) {
    out(line);
  }

  if (await tracingPluginIsEnabled(home)) {
    for (const line of [
      "",
      "You have LangSmith tracing installed two ways: through the Claude Code",
      "marketplace and as this standalone binary. The binary handles tracing",
      "from now on and the marketplace copy goes quiet by itself. Removing it",
      "saves a process on each hook and will not affect the binary:",
      "",
      `  claude plugin uninstall ${TRACING_PLUGIN_ID}`,
    ]) {
      out(line);
    }
  }
  return settingsPath;
}

export async function runInstall(args: string[]): Promise<void> {
  try {
    await install({ args });
  } catch (err) {
    console.error(`Install failed: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  }
}

import * as fs from "node:fs/promises";
import { arch as osArch, homedir, platform as osPlatform } from "node:os";
import { basename, dirname, join } from "node:path";
import { LS_INTEGRATION_VERSION } from "./config.js";
import { OLDER_THAN_ANY_RELEASE } from "./sea-constants.js";
import type { HooksManifest, InstallOptions, SettingsFile } from "./sea-models.js";
import { runningCompiledBinary } from "./sea-runtime.js";
import {
  installDirectory,
  installedBinaryPath,
  installRelease,
  installRunningBinary,
} from "./updater-install.js";
import { fetchReleaseList, fetchTaggedRelease, pickNewestRelease } from "./updater-releases.js";
import { configuredReleasesApi, isPublishedTarget } from "./updater-utils.js";

declare const __LS_SEA_HOOKS__: string;

const TRACING_PLUGIN_ID = "langsmith-tracing@langsmith-claude-code-plugins";

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
  const compiled = typeof __LS_SEA_HOOKS__ === "undefined" ? undefined : __LS_SEA_HOOKS__;
  const hooks = compiled ? (JSON.parse(compiled) as SettingsFile).hooks : undefined;
  if (!hooks || typeof hooks !== "object" || Array.isArray(hooks)) {
    throw new Error("this build carries no hooks manifest");
  }
  return hooks;
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

async function readSettings(path: string): Promise<SettingsFile> {
  return fs.readFile(path, "utf-8").then(
    (text) => JSON.parse(text) as SettingsFile,
    () => ({}),
  );
}

async function tracingPluginIsEnabled(home: string): Promise<boolean> {
  try {
    const { enabledPlugins } = await readSettings(join(home, ".claude", "settings.json"));
    return (enabledPlugins as Record<string, unknown> | undefined)?.[TRACING_PLUGIN_ID] === true;
  } catch {
    return false;
  }
}

async function writeSettings(path: string, contents: string): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true });
  const mode = await fs.stat(path).then(
    (stats) => stats.mode & 0o777,
    () => 0o600,
  );
  const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.${Date.now()}.tmp`);
  try {
    await fs.writeFile(temporary, contents, { mode: 0o600 });
    await fs.chmod(temporary, mode);
    await fs.rename(temporary, path);
  } catch (err) {
    await fs.unlink(temporary).catch(() => undefined);
    throw err;
  }
}

export async function install(options: InstallOptions = {}): Promise<string> {
  const args = options.args ?? [];
  const tag = requestedTag(args);
  const platform = options.runtimePlatform ?? osPlatform();
  const arch = options.runtimeArch ?? osArch();
  if (!isPublishedTarget(platform, arch)) {
    throw new Error(
      `no binary is published for ${platform}-${arch}. Install the Node plugin with '/plugin install ${TRACING_PLUGIN_ID}' instead`,
    );
  }

  const home = options.home ?? homedir();
  const settingsPath = args.includes("--project")
    ? join(options.cwd ?? process.cwd(), ".claude", "settings.json")
    : join(home, ".claude", "settings.json");
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
  const copyable = !tag && (options.compiledBinary ?? (await runningCompiledBinary()));
  const installDir = installDirectory(home);
  let installedVersion = currentVersion;

  if (copyable) {
    await installRunningBinary(executablePath, installDir, currentVersion);
  } else {
    const releasesApi = options.releasesApi ?? configuredReleasesApi();
    const fetchImpl = options.fetchImpl ?? fetch;
    const release = tag
      ? await fetchTaggedRelease(fetchImpl, releasesApi, currentVersion, platform, arch, tag)
      : pickNewestRelease(
          await fetchReleaseList(fetchImpl, releasesApi, currentVersion, platform, arch),
          OLDER_THAN_ANY_RELEASE,
        );
    if (!release) {
      throw new Error(
        `no published release carries a ${platform}-${arch} binary for ${tag ?? "this plugin"} yet`,
      );
    }
    await installRelease(release, installDir, fetchImpl, releasesApi, currentVersion);
    installedVersion = release.version;
  }

  await writeSettings(settingsPath, settings);

  for (const line of [
    `Installed ${installedBinaryPath(installDir)} (${installedVersion})`,
    `Added the LangSmith tracing hooks to ${settingsPath}`,
    "",
    "Next:",
    "  1. Set enabled, api_key and project in ~/.claude/langsmith.json.",
    "  2. Restart Claude Code so it reloads the settings.",
  ]) {
    out(line);
  }

  if (await tracingPluginIsEnabled(home)) {
    for (const line of [
      "",
      "LangSmith tracing is now installed twice, as a plugin and as this binary.",
      "Only the binary traces. The plugin still starts a process on every hook.",
      "Remove it with:",
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

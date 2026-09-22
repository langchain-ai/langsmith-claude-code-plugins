export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  digest: string | null;
}

export interface Release {
  version: string;
  asset: ReleaseAsset;
}

export type UpdateResult =
  | { status: "not-installed" | "unsupported" | "busy" | "current" }
  | { status: "updated"; version: string };

export interface UpdateOptions {
  currentVersion?: string;
  installDir?: string;
  executablePath?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  releasesApi?: string;
  runtimePlatform?: string;
  runtimeArch?: string;
}

export interface HookCommand {
  type: string;
  command: string;
}

export interface HookGroup {
  hooks: HookCommand[];
}

export type HooksManifest = Record<string, HookGroup[]>;

export interface SettingsFile {
  hooks?: HooksManifest;
  [key: string]: unknown;
}

export interface InstallOptions {
  args?: string[];
  home?: string;
  cwd?: string;
  releasesApi?: string;
  fetchImpl?: typeof fetch;
  out?: (line: string) => void;
  currentVersion?: string;
  executablePath?: string;
  compiledBinary?: boolean;
  runtimePlatform?: string;
  runtimeArch?: string;
  hooksManifest?: HooksManifest;
}

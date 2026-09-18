import {
  DOWNLOAD_PREFIX,
  EXECUTABLE_NAME,
  LOOPBACK_HOSTS,
  PUBLISHED_TARGETS,
  RELEASES_API,
} from "./sea-constants.js";
import type { ReleaseAsset } from "./sea-models.js";

export function isPublishedTarget(platform: string, arch: string): boolean {
  return PUBLISHED_TARGETS[platform]?.includes(arch) ?? false;
}

export function releaseAssetName(platform: string, arch: string, version: string): string {
  return `${EXECUTABLE_NAME}-${platform}-${arch}-${version}-unsigned`;
}

function loopbackOverride(value: string | undefined): string | undefined {
  try {
    return value && LOOPBACK_HOSTS.includes(new URL(value).hostname) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function configuredReleasesApi(override = process.env.CC_LANGSMITH_RELEASES_API): string {
  return loopbackOverride(override) ?? RELEASES_API;
}

export function taggedReleaseUrl(releasesApi: string, tag: string): string {
  const url = new URL(releasesApi);
  url.search = "";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/tags/${encodeURIComponent(tag)}`;
  return url.href;
}

export type ParsedVersion = {
  numbers: [number, number, number];
  final: number;
  label: string;
  iteration: number;
};

export function parseVersion(version: string): ParsedVersion | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.(\d+))?$/.exec(version.trim());
  if (!match) return undefined;
  return {
    numbers: [Number(match[1]), Number(match[2]), Number(match[3])],
    final: match[4] === undefined ? 1 : 0,
    label: match[4] ?? "",
    iteration: match[5] === undefined ? 0 : Number(match[5]),
  };
}

function compareVersions(next: ParsedVersion, installed: ParsedVersion): number {
  for (let index = 0; index < next.numbers.length; index += 1) {
    if (next.numbers[index] !== installed.numbers[index]) {
      return next.numbers[index] - installed.numbers[index];
    }
  }
  if (next.final !== installed.final) return next.final - installed.final;
  if (next.label !== installed.label) return next.label < installed.label ? -1 : 1;
  return next.iteration - installed.iteration;
}

export function isVersionNewer(candidate: string, current: string): boolean {
  const next = parseVersion(candidate);
  const installed = parseVersion(current);
  if (!next || !installed) return false;
  return compareVersions(next, installed) > 0;
}

export function githubRequestHeaders(currentVersion: string): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": `langsmith-claude-code/${currentVersion}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export function expectedSha256(asset: ReleaseAsset): string {
  const match = /^sha256:([a-f0-9]{64})$/i.exec(asset.digest ?? "");
  if (!match) throw new Error(`release asset ${asset.name} has no SHA-256 digest`);
  return match[1].toLowerCase();
}

export function trustedDownloadUrl(asset: ReleaseAsset, releasesApi: string): URL {
  const url = new URL(asset.browser_download_url);
  const trusted =
    releasesApi === RELEASES_API
      ? url.href.startsWith(DOWNLOAD_PREFIX)
      : url.origin === new URL(releasesApi).origin;
  if (!trusted) throw new Error("release asset has an unexpected download URL");
  return url;
}

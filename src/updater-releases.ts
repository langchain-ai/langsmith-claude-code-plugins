import { LIST_TIMEOUT_MS } from "./sea-constants.js";
import type { Release, ReleaseAsset } from "./sea-models.js";
import {
  githubRequestHeaders,
  isPublishedTarget,
  isVersionNewer,
  parseVersion,
  releaseAssetName,
  taggedReleaseUrl,
} from "./updater-utils.js";

function asNamedAsset(value: unknown, assetName: string): ReleaseAsset | undefined {
  if (!value || typeof value !== "object") return undefined;
  const asset = value as Record<string, unknown>;
  if (asset.name !== assetName) return undefined;
  if (typeof asset.browser_download_url !== "string" || typeof asset.size !== "number") {
    return undefined;
  }
  return asset as unknown as ReleaseAsset;
}

export function parseReleases(value: unknown, platform: string, arch: string): Release[] {
  if (!Array.isArray(value)) throw new Error("GitHub returned no list of releases");
  if (!isPublishedTarget(platform, arch)) return [];
  const releases: Release[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const release = entry as Record<string, unknown>;
    if (release.draft === true || release.prerelease === true) continue;
    if (typeof release.tag_name !== "string" || !parseVersion(release.tag_name)) continue;
    if (!Array.isArray(release.assets)) continue;
    const version = release.tag_name.trim();
    const asset = release.assets
      .map((candidate) => asNamedAsset(candidate, releaseAssetName(platform, arch, version)))
      .find((candidate) => candidate !== undefined);
    if (asset) releases.push({ version, asset });
  }
  return releases;
}

export function pickNewestRelease(
  releases: Release[],
  currentVersion: string,
): Release | undefined {
  let newest: Release | undefined;
  for (const release of releases) {
    if (!isVersionNewer(release.version, currentVersion)) continue;
    if (!newest || isVersionNewer(release.version, newest.version)) newest = release;
  }
  return newest;
}

async function fetchReleaseJson(
  fetchImpl: typeof fetch,
  url: string,
  currentVersion: string,
): Promise<unknown> {
  const response = await fetchImpl(url, {
    headers: githubRequestHeaders(currentVersion),
    signal: AbortSignal.timeout(LIST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`failed to read the GitHub releases: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchReleaseList(
  fetchImpl: typeof fetch,
  releasesApi: string,
  currentVersion: string,
  platform: string,
  arch: string,
): Promise<Release[]> {
  const listed = await fetchReleaseJson(fetchImpl, releasesApi, currentVersion);
  return parseReleases(listed, platform, arch);
}

export async function fetchTaggedRelease(
  fetchImpl: typeof fetch,
  releasesApi: string,
  currentVersion: string,
  platform: string,
  arch: string,
  tag: string,
): Promise<Release | undefined> {
  const url = taggedReleaseUrl(releasesApi, tag);
  const tagged = await fetchReleaseJson(fetchImpl, url, currentVersion);
  return parseReleases([tagged], platform, arch)[0];
}

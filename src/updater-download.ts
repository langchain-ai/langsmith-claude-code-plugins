import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import { DOWNLOAD_TIMEOUT_MS, MAX_ASSET_BYTES } from "./binary-constants.js";
import type { ReleaseAsset } from "./binary-models.js";
import { expectedSha256, githubRequestHeaders, trustedDownloadUrl } from "./updater-utils.js";

async function writeFully(handle: fs.FileHandle, chunk: Buffer): Promise<void> {
  let offset = 0;
  while (offset < chunk.byteLength) {
    const { bytesWritten } = await handle.write(chunk, offset);
    if (bytesWritten === 0) throw new Error("could not write the release asset");
    offset += bytesWritten;
  }
}

export async function downloadAsset(
  asset: ReleaseAsset,
  destination: string,
  fetchImpl: typeof fetch,
  releasesApi: string,
  currentVersion: string,
): Promise<void> {
  if (asset.size <= 0 || asset.size > MAX_ASSET_BYTES) {
    throw new Error(`release asset size ${asset.size} is outside the allowed range`);
  }
  const digest = expectedSha256(asset);
  const response = await fetchImpl(trustedDownloadUrl(asset, releasesApi), {
    headers: githubRequestHeaders(currentVersion),
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });
  if (!response.ok || !response.body) {
    throw new Error(`failed to download the release asset: HTTP ${response.status}`);
  }

  const handle = await fs.open(destination, "wx", 0o700);
  const hash = createHash("sha256");
  let written = 0;
  try {
    for await (const rawChunk of response.body) {
      const chunk = Buffer.from(rawChunk);
      written += chunk.byteLength;
      if (written > asset.size) {
        throw new Error("the release asset download exceeds its declared size");
      }
      hash.update(chunk);
      await writeFully(handle, chunk);
    }
    await handle.sync();
  } finally {
    await handle.close();
  }

  if (written !== asset.size) {
    throw new Error(`release asset size mismatch: expected ${asset.size}, got ${written}`);
  }
  if (hash.digest("hex") !== digest) throw new Error("release asset SHA-256 mismatch");
}

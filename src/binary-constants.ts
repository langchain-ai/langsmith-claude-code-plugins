const REPOSITORY = "langchain-ai/langsmith-claude-code-plugins";

export const RELEASE_PAGE_SIZE = 100;
export const RELEASES_API = `https://api.github.com/repos/${REPOSITORY}/releases?per_page=${RELEASE_PAGE_SIZE}`;
export const DOWNLOAD_PREFIX = `https://github.com/${REPOSITORY}/releases/download/`;
export const LOOPBACK_HOSTS = ["127.0.0.1", "[::1]", "localhost"];

export const EXECUTABLE_NAME = "langsmith-claude-code-tracing";
export const INSTALL_DIRECTORY_NAME = ".langsmith";
export const PUBLISHED_TARGETS: Record<string, readonly string[]> = { darwin: ["arm64", "x64"] };
export const OLDER_THAN_ANY_RELEASE = "0.0.0";

export const LOCK_MAX_AGE_MS = 10 * 60 * 1000;
export const LIST_TIMEOUT_MS = 15_000;
export const DOWNLOAD_TIMEOUT_MS = 5 * 60_000;
export const MAX_ASSET_BYTES = 250 * 1024 * 1024;
export const LOCK_FILE = ".update.lock";

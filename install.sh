#!/usr/bin/env bash
set -euo pipefail

INSTALLER_VERSION="langsmith-claude-code-tracing installer 1.0"
REPOSITORY="langchain-ai/langsmith-claude-code-plugins"
EXECUTABLE="langsmith-claude-code-tracing"
RELEASE_PAGE_SIZE=100
RELEASES_API="${LANGSMITH_CC_RELEASES_API:-https://api.github.com/repos/$REPOSITORY/releases?per_page=$RELEASE_PAGE_SIZE}"
DOWNLOAD_BASE="${LANGSMITH_CC_DOWNLOAD_BASE:-https://github.com/$REPOSITORY/releases/download}"

TARGET_VERSION=""
WANT_BETA=0
BINARY_ARGUMENTS=()
TEMP_BINARY=""
VERIFIED=""
UNVERIFIED=""
SELECTED=""

print_help() {
  cat <<'HELP'
Install the LangSmith tracing binary for Claude Code.

Usage:
  curl -LsSf https://langch.in/claude-tracing | bash
  curl -LsSf https://langch.in/claude-tracing | bash -s -- [options]
  curl -LsSf https://langch.in/claude-tracing | bash -s -- VERSION

Options:
  --help, -h        Show this help message and exit
  --version, -v     Print installer version and exit
  --beta            Install the newest prerelease instead of the newest release

Target:
  VERSION           Install an exact release, e.g. 0.4.0. A prerelease such as
                    0.5.0-beta.1 is installed only when you name it or pass
                    --beta. VERSION and --beta cannot be combined.

Any other option, and everything after it, is passed to the binary's --install,
which takes --print, --project and --tag VERSION.

Environment variables:
  LANGSMITH_CC_RELEASES_API    GitHub releases API to install from
  LANGSMITH_CC_DOWNLOAD_BASE   Release download base URL

Only macOS arm64 is published. The langsmith-tracing plugin stops tracing while
this binary is installed, so the plugin is safe to remove. Restart Claude Code
when this finishes.
HELP
}

say() {
  printf '%s\n' "$*" >&2
}

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

die_usage() {
  printf '%s\n' "$*" >&2
  printf 'Run with --help to see available options.\n' >&2
  exit 2
}

cleanup() {
  if [[ -n "$TEMP_BINARY" ]]; then rm -f "$TEMP_BINARY"; fi
}

lowercase() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

escape_dots() {
  printf '%s' "${1//./\\.}"
}

parse_arguments() {
  local argument
  while [[ $# -gt 0 ]]; do
    argument="$1"
    shift
    case "$argument" in
      --help | -h)
        print_help
        exit 0
        ;;
      --version | -v)
        printf '%s\n' "$INSTALLER_VERSION"
        exit 0
        ;;
      --beta)
        WANT_BETA=1
        ;;
      -*)
        BINARY_ARGUMENTS=("$argument" "$@")
        break
        ;;
      *)
        if [[ -n "$TARGET_VERSION" ]]; then
          die_usage "Only one target is allowed. Got both $TARGET_VERSION and $argument."
        fi
        if [[ ! "$argument" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-z]+\.[0-9]+)?$ ]]; then
          die_usage "Invalid version target: $argument. Use an exact release like 0.4.0 or 0.5.0-beta.1."
        fi
        TARGET_VERSION="$argument"
        ;;
    esac
  done
  if [[ "$WANT_BETA" == 1 && -n "$TARGET_VERSION" ]]; then
    die_usage "--beta and a version target are contradictory. Got both --beta and $TARGET_VERSION."
  fi
}

require_supported_platform() {
  local platform
  platform="$(uname -s)-$(uname -m)"
  if [[ "$platform" != "Darwin-arm64" ]]; then
    die "The standalone binary is published only for macOS arm64, not $platform. Install the langsmith-tracing plugin instead."
  fi
}

fetch_releases() {
  curl -fsSL -H 'Accept: application/vnd.github+json' "$RELEASES_API"
}

tokenize_releases() {
  sed -n \
    -e 's/^    "tag_name": *"\([^"]*\)".*/T \1/p' \
    -e 's/^    "draft": *true.*/S/p' \
    -e 's/^    "prerelease": *true.*/P/p' \
    -e "s/^        \"name\": *\"$EXECUTABLE-darwin-arm64-\([^\"]*\)\".*/A \1/p" \
    -e 's/^        "digest": *"[Ss][Hh][Aa]256:\([0-9a-fA-F]\{64\}\)".*/H \1/p' \
    -e 's/^        "browser_download_url":.*/E/p'
}

scan_releases() {
  local tokens kind value tag drafted prereleased usable wanted digest
  tokens="$(tokenize_releases <<<"$1")" ||
    die "Could not read the release list returned by $RELEASES_API."
  tag=""
  drafted=0
  prereleased=0
  wanted=0
  digest=""
  while read -r kind value; do
    case "$kind" in
      T)
        tag="$value"
        drafted=0
        prereleased=0
        ;;
      S)
        drafted=1
        ;;
      P)
        prereleased=1
        ;;
      A)
        usable=1
        if [[ "$drafted" == 1 ]]; then usable=0; fi
        if [[ -z "$TARGET_VERSION" && "$prereleased" != "$WANT_BETA" ]]; then usable=0; fi
        if [[ "$usable" == 1 && "$value" == "$tag" ]]; then
          wanted=1
          digest=""
        fi
        ;;
      H)
        if [[ "$wanted" == 1 ]]; then digest="$value"; fi
        ;;
      E)
        if [[ "$wanted" == 1 ]]; then
          if [[ -n "$digest" ]]; then
            VERIFIED+="$tag $(lowercase "$digest")"$'\n'
          else
            UNVERIFIED+="$tag"$'\n'
          fi
        fi
        wanted=0
        digest=""
        ;;
    esac
  done <<<"$tokens"
}

newest_version() {
  cut -d' ' -f1 |
    sed -n \
      -e 's/^\([0-9][0-9]*\)\.\([0-9][0-9]*\)\.\([0-9][0-9]*\)$/\1 \2 \3 1 - 0 &/p' \
      -e 's/^\([0-9][0-9]*\)\.\([0-9][0-9]*\)\.\([0-9][0-9]*\)-\([a-z][a-z]*\)\.\([0-9][0-9]*\)$/\1 \2 \3 0 \4 \5 &/p' |
    LC_ALL=C sort -k1,1n -k2,2n -k3,3n -k4,4n -k5,5 -k6,6n |
    tail -n 1 |
    cut -d' ' -f7
}

select_pinned() {
  local pattern
  pattern="$(escape_dots "$TARGET_VERSION")"
  SELECTED="$(grep "^$pattern " <<<"$VERIFIED" || true)"
  if [[ -z "$SELECTED" ]]; then
    if grep -q "^$pattern\$" <<<"$UNVERIFIED"; then
      die "Release $TARGET_VERSION publishes its macOS arm64 binary without a SHA-256 digest, so it cannot be verified."
    fi
    die "None of the newest $RELEASE_PAGE_SIZE releases is $TARGET_VERSION carrying a macOS arm64 binary."
  fi
}

select_newest() {
  local newest
  newest="$(printf '%s%s' "$VERIFIED" "$UNVERIFIED" | newest_version)"
  if [[ -z "$newest" ]]; then
    if [[ "$WANT_BETA" == 1 ]]; then
      die "None of the newest $RELEASE_PAGE_SIZE releases is a prerelease carrying a macOS arm64 binary."
    fi
    die "None of the newest $RELEASE_PAGE_SIZE releases carries a macOS arm64 binary."
  fi
  SELECTED="$(grep "^$(escape_dots "$newest") " <<<"$VERIFIED" || true)"
  [[ -n "$SELECTED" ]] ||
    die "Release $newest is the newest carrying a macOS arm64 binary and publishes it without a SHA-256 digest, so it cannot be verified."
}

install_selected() {
  local tag expected_sha asset actual_sha
  tag="${SELECTED%% *}"
  expected_sha="${SELECTED##* }"
  asset="$EXECUTABLE-darwin-arm64-$tag"

  say "Downloading $asset."
  TEMP_BINARY="$(mktemp "${TMPDIR:-/tmp}/$EXECUTABLE.XXXXXX")"
  curl -fsSL -o "$TEMP_BINARY" "$DOWNLOAD_BASE/$tag/$asset" ||
    die "Could not download $asset from $DOWNLOAD_BASE/$tag/."

  actual_sha="$(shasum -a 256 "$TEMP_BINARY" | sed 's/ .*//')"
  if [[ "$actual_sha" != "$expected_sha" ]]; then
    die "$asset failed its SHA-256 check. Expected $expected_sha, got $actual_sha."
  fi

  chmod +x "$TEMP_BINARY"
  say "Installing $tag."
  "$TEMP_BINARY" --install ${BINARY_ARGUMENTS[@]+"${BINARY_ARGUMENTS[@]}"}
}

main() {
  trap cleanup EXIT
  trap 'exit 130' INT
  parse_arguments "$@"
  require_supported_platform
  say "Finding the release to install."
  local releases
  releases="$(fetch_releases)" ||
    die "Could not read the releases API at $RELEASES_API."
  scan_releases "$releases"
  if [[ -n "$TARGET_VERSION" ]]; then select_pinned; else select_newest; fi
  install_selected
}

main "$@"

#!/usr/bin/env bash
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
INSTALLER="${INSTALLER:-$ROOT/install.sh}"
EXECUTABLE="langsmith-claude-code-tracing"
REPO="langchain-ai/langsmith-claude-code-plugins"
ARCHES=(arm64 x64)
MACHINES=(arm64 x86_64)

WORK="$(mktemp -d "${TMPDIR:-/tmp}/install-test.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/dl" "$WORK/shim"

ARCH=""
OTHER=""
PASSED=0
FAILED=0
LAST_OUTPUT=""
LAST_STATUS=0

publish_binary() {
  local tag="$1" arch="${2:-$ARCH}" asset dir
  dir="$WORK/dl/$tag"
  asset="$EXECUTABLE-darwin-$arch-$tag"
  mkdir -p "$dir"
  cat >"$dir/$asset" <<EOF
#!/bin/bash
if [ "\$1" = "--install" ]; then printf 'RAN $tag args=%s\n' "\$*"; exit 0; fi
printf 'Unknown hook event: (none)\n'
exit 0
EOF
  shasum -a 256 "$dir/$asset" | sed 's/ .*//'
}

asset_json() {
  local name="$1" digest="$2"
  printf '      {\n'
  printf '        "url": "https://api.github.com/repos/%s/releases/assets/1",\n' "$REPO"
  printf '        "name": "%s",\n' "$name"
  printf '        "label": null,\n'
  printf '        "state": "uploaded",\n'
  printf '        "size": 91,\n'
  case "$digest" in
    omit) ;;
    null) printf '        "digest": null,\n' ;;
    *) printf '        "digest": "%s",\n' "$digest" ;;
  esac
  printf '        "browser_download_url": "https://github.com/%s/releases/download/x/%s"\n' "$REPO" "$name"
  printf '      }'
}

binary_asset_json() {
  asset_json "$EXECUTABLE-darwin-${3:-$ARCH}-$1" "$2"
}

release_json() {
  local tag="$1" title="$2" draft="$3" prerelease="$4"
  shift 4
  local first=1 element
  printf '  {\n'
  printf '    "url": "https://api.github.com/repos/%s/releases/1",\n' "$REPO"
  printf '    "html_url": "https://github.com/%s/releases/tag/%s",\n' "$REPO" "$tag"
  printf '    "tag_name": "%s",\n' "$tag"
  printf '    "name": "%s",\n' "$title"
  printf '    "draft": %s,\n' "$draft"
  printf '    "prerelease": %s,\n' "$prerelease"
  printf '    "published_at": "2026-09-15T14:24:34Z",\n'
  printf '    "assets": [\n'
  for element in "$@"; do
    if [[ $first -eq 0 ]]; then printf ',\n'; fi
    first=0
    printf '%s' "$element"
  done
  if [[ $first -eq 0 ]]; then printf '\n'; fi
  printf '    ],\n'
  printf '    "body": "Notes quoting \\"draft\\": true and \\"prerelease\\": true and \\"tag_name\\": \\"9.9.9\\" and \\"name\\": \\"%s-darwin-%s-9.9.9\\""\n' "$EXECUTABLE" "$ARCH"
  printf '  }'
}

stable() {
  local tag="$1"
  shift
  release_json "$tag" "$tag" false false "$@"
}

beta() {
  local tag="$1"
  shift
  release_json "$tag" "$tag" false true "$@"
}

write_releases() {
  local name="$1"
  shift
  local first=1 element
  {
    printf '[\n'
    for element in "$@"; do
      if [[ $first -eq 0 ]]; then printf ',\n'; fi
      first=0
      printf '%s' "$element"
    done
    printf '\n]\n'
  } >"$WORK/$name.json"
}

shim() {
  cat >"$WORK/shim/$1"
  chmod +x "$WORK/shim/$1"
}

shim_machine() {
  shim uname <<EOF
#!/bin/bash
if [ "\$1" = "-m" ]; then printf '%s\n' "$1"; else printf '%s\n' "${2:-Darwin}"; fi
EOF
}

run_installer() {
  local fixture="$1"
  shift
  LAST_OUTPUT="$(
    PATH="$WORK/shim:$PATH" \
      LANGSMITH_CC_RELEASES_API="file://$WORK/$fixture.json" \
      LANGSMITH_CC_DOWNLOAD_BASE="file://$WORK/dl" \
      /bin/bash "$INSTALLER" "$@" 2>&1
  )"
  LAST_STATUS=$?
}

run_installer_split() {
  local fixture="$1"
  shift
  LAST_OUTPUT="$(
    PATH="$WORK/shim:$PATH" \
      LANGSMITH_CC_RELEASES_API="file://$WORK/$fixture.json" \
      LANGSMITH_CC_DOWNLOAD_BASE="file://$WORK/dl" \
      /bin/bash "$INSTALLER" "$@" 2>"$WORK/stderr.txt"
  )"
  LAST_STATUS=$?
}

report() {
  local name="$1" ok="$2"
  if [[ "$ok" == ok ]]; then
    PASSED=$((PASSED + 1))
  else
    FAILED=$((FAILED + 1))
    printf 'FAIL %s\n' "$name"
    printf '     status %s, output: %s\n' "$LAST_STATUS" "$LAST_OUTPUT"
  fi
}

expect_output() {
  local name="$1" needle="$2" status="$3"
  if [[ "$LAST_OUTPUT" == *"$needle"* && "$LAST_STATUS" == "$status" ]]; then
    report "$name" ok
  else
    report "$name" no
  fi
}

write_fixtures() {
  local SHA_040 SHA_030 SHA_0100 SHA_999 UPPER_040 SHA_OTHER_040
  local SHA_BETA1 SHA_BETA2 SHA_BETA10 SHA_ALPHA99 SHA_050 SHA_040BETA1 SHA_040BETA
  SHA_040="$(publish_binary 0.4.0)"
  SHA_030="$(publish_binary 0.3.0)"
  SHA_0100="$(publish_binary 0.10.0)"
  SHA_999="$(publish_binary 9.9.9)"
  UPPER_040="$(printf '%s' "$SHA_040" | tr '[:lower:]' '[:upper:]')"

  write_releases good \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")" \
    "$(stable 0.3.0 "$(binary_asset_json 0.3.0 "sha256:$SHA_030")")"

  write_releases titled \
    "$(release_json 9.9.9 "$EXECUTABLE-darwin-$ARCH-9.9.9" false true \
      "$(asset_json notes.txt "sha256:$SHA_999")")" \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

  write_releases titled-stable \
    "$(release_json 9.9.9 "$EXECUTABLE-darwin-$ARCH-9.9.9" false false \
      "$(asset_json notes.txt "sha256:$SHA_999")")" \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

  write_releases prerelease \
    "$(beta 9.9.9 "$(binary_asset_json 9.9.9 "sha256:$SHA_999")")" \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

  write_releases draft \
    "$(release_json 9.9.9 9.9.9 true false "$(binary_asset_json 9.9.9 "sha256:$SHA_999")")" \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

  write_releases nulldigest \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 null)")" \
    "$(stable 0.3.0 "$(binary_asset_json 0.3.0 "sha256:$SHA_030")")"

  write_releases nodigest \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 omit)")" \
    "$(stable 0.3.0 "$(binary_asset_json 0.3.0 "sha256:$SHA_030")")"

  write_releases shortdigest \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:${SHA_040:0:40}")")"

  write_releases updigest \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$UPPER_040")")" \
    "$(stable 0.3.0 "$(binary_asset_json 0.3.0 "sha256:$SHA_030")")"

  write_releases mismatch \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_030")")"

  write_releases missingasset \
    "$(stable 0.7.0 "$(binary_asset_json 0.7.0 "sha256:$SHA_040")")"

  write_releases wrongversion \
    "$(stable 0.5.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

  write_releases ordering \
    "$(stable 0.9.0 "$(binary_asset_json 0.9.0 "sha256:$SHA_030")")" \
    "$(stable 0.10.0 "$(binary_asset_json 0.10.0 "sha256:$SHA_0100")")"

  SHA_OTHER_040="$(publish_binary 0.4.0 "$OTHER")"

  write_releases otheronly \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_OTHER_040" "$OTHER")")"

  write_releases botharches \
    "$(stable 0.4.0 \
      "$(binary_asset_json 0.4.0 "sha256:$SHA_OTHER_040" "$OTHER")" \
      "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

  write_releases botharchesreversed \
    "$(stable 0.4.0 \
      "$(binary_asset_json 0.4.0 "sha256:$SHA_040")" \
      "$(binary_asset_json 0.4.0 "sha256:$SHA_OTHER_040" "$OTHER")")"

  SHA_BETA1="$(publish_binary 0.5.0-beta.1)"
  SHA_BETA2="$(publish_binary 0.5.0-beta.2)"
  SHA_BETA10="$(publish_binary 0.5.0-beta.10)"
  SHA_ALPHA99="$(publish_binary 0.5.0-alpha.99)"
  SHA_050="$(publish_binary 0.5.0)"
  SHA_040BETA1="$(publish_binary 0.4.0-beta.1)"

  write_releases beta \
    "$(beta 0.5.0-beta.1 "$(binary_asset_json 0.5.0-beta.1 "sha256:$SHA_BETA1")")" \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

  write_releases betaonly \
    "$(beta 0.5.0-beta.1 "$(binary_asset_json 0.5.0-beta.1 "sha256:$SHA_BETA1")")"

  write_releases betadraft \
    "$(release_json 0.5.0-beta.1 0.5.0-beta.1 true true \
      "$(binary_asset_json 0.5.0-beta.1 "sha256:$SHA_BETA1")")"

  write_releases betaolder \
    "$(stable 0.5.0 "$(binary_asset_json 0.5.0 "sha256:$SHA_050")")" \
    "$(beta 0.4.0-beta.1 "$(binary_asset_json 0.4.0-beta.1 "sha256:$SHA_040BETA1")")"

  write_releases betaladderpre \
    "$(beta 0.5.0-beta.2 "$(binary_asset_json 0.5.0-beta.2 "sha256:$SHA_BETA2")")" \
    "$(beta 0.5.0-beta.10 "$(binary_asset_json 0.5.0-beta.10 "sha256:$SHA_BETA10")")" \
    "$(beta 0.5.0-alpha.99 "$(binary_asset_json 0.5.0-alpha.99 "sha256:$SHA_ALPHA99")")" \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

  write_releases betamislabelled \
    "$(stable 0.5.0-beta.1 "$(binary_asset_json 0.5.0-beta.1 "sha256:$SHA_BETA1")")" \
    "$(stable 0.5.0 "$(binary_asset_json 0.5.0 "sha256:$SHA_050")")"

  write_releases betaladder \
    "$(stable 0.5.0-beta.2 "$(binary_asset_json 0.5.0-beta.2 "sha256:$SHA_BETA2")")" \
    "$(stable 0.5.0-beta.10 "$(binary_asset_json 0.5.0-beta.10 "sha256:$SHA_BETA10")")" \
    "$(stable 0.5.0-alpha.99 "$(binary_asset_json 0.5.0-alpha.99 "sha256:$SHA_ALPHA99")")"

  write_releases unparsabletag \
    "$(stable v9.9.9 "$(binary_asset_json v9.9.9 "sha256:$SHA_999")")" \
    "$(stable 9.9.9-Beta.1 "$(binary_asset_json 9.9.9-Beta.1 "sha256:$SHA_999")")" \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

  SHA_040BETA="$(publish_binary 0.4.0-beta)"

  write_releases bareonly \
    "$(stable 0.4.0-beta "$(binary_asset_json 0.4.0-beta "sha256:$SHA_040BETA")")"

  write_releases bareladder \
    "$(stable 0.4.0-beta "$(binary_asset_json 0.4.0-beta "sha256:$SHA_040BETA")")" \
    "$(stable 0.4.0-beta.1 "$(binary_asset_json 0.4.0-beta.1 "sha256:$SHA_040BETA1")")"

  write_releases bareladderstable \
    "$(stable 0.4.0-beta "$(binary_asset_json 0.4.0-beta "sha256:$SHA_040BETA")")" \
    "$(stable 0.4.0-beta.1 "$(binary_asset_json 0.4.0-beta.1 "sha256:$SHA_040BETA1")")" \
    "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

  write_releases barebeta \
    "$(beta 0.4.0-beta "$(binary_asset_json 0.4.0-beta "sha256:$SHA_040BETA")")" \
    "$(stable 0.3.0 "$(binary_asset_json 0.3.0 "sha256:$SHA_030")")"

  local MANY=() index
  for index in $(seq 40 -1 11); do
    MANY+=("$(stable "1.0.$index")")
  done
  write_releases many30 "${MANY[@]}"
  write_releases many31 "${MANY[@]}" "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"
}

run_table() {
  local name fixture args needle status argv
  while IFS='|' read -r name fixture args needle status <&3; do
    [[ -n "$name" ]] || continue
    argv=()
    if [[ -n "$args" ]]; then read -r -a argv <<<"$args"; fi
    run_installer "$fixture" ${argv[@]+"${argv[@]}"}
    expect_output "$name ($ARCH)" "${needle//@ARCH@/$ARCH}" "$status"
  done 3<"$HERE/scenarios.txt"
}

run_extras() {
  shim sed <<'EOF'
#!/bin/bash
exit 1
EOF
  run_installer good
  expect_output "a parser failure is not a missing release ($ARCH)" "Could not read the release list" 1
  rm -f "$WORK/shim/sed"

  local CLEAN_STDOUT PROGRESS_STDERR BEFORE AFTER
  run_installer_split good
  CLEAN_STDOUT="$LAST_OUTPUT"
  PROGRESS_STDERR="$(cat "$WORK/stderr.txt")"
  LAST_OUTPUT="stdout: $CLEAN_STDOUT"
  if [[ "$CLEAN_STDOUT" == "RAN 0.4.0 args=--install" &&
    "$PROGRESS_STDERR" == *"Finding the release to install."* &&
    "$PROGRESS_STDERR" == *"Downloading "* &&
    "$PROGRESS_STDERR" == *"Installing 0.4.0."* ]]; then
    report "progress lands on stderr and never on stdout ($ARCH)" ok
  else
    report "progress lands on stderr and never on stdout ($ARCH)" no
  fi

  run_installer_split good --help
  LAST_OUTPUT="stdout: $LAST_OUTPUT"
  if [[ "$LAST_OUTPUT" == *"Install the LangSmith tracing binary"* && ! -s "$WORK/stderr.txt" ]]; then
    report "--help stays on stdout with a silent stderr ($ARCH)" ok
  else
    report "--help stays on stdout with a silent stderr ($ARCH)" no
  fi

  BEFORE="$(find "${TMPDIR:-/tmp}" -maxdepth 1 -name "$EXECUTABLE.*" | wc -l)"
  run_installer good
  run_installer mismatch
  AFTER="$(find "${TMPDIR:-/tmp}" -maxdepth 1 -name "$EXECUTABLE.*" | wc -l)"
  LAST_OUTPUT="$BEFORE then $AFTER"
  LAST_STATUS=0
  if [[ "$BEFORE" == "$AFTER" ]]; then
    report "the temp binary is cleaned up ($ARCH)" ok
  else
    report "the temp binary is cleaned up ($ARCH)" no
  fi
}

for index in "${!ARCHES[@]}"; do
  ARCH="${ARCHES[$index]}"
  OTHER="${ARCHES[$((1 - index))]}"
  shim_machine "${MACHINES[$index]}"
  write_fixtures
  run_table
  run_extras
  rm -f "$WORK/shim/uname"
done

ARCH="arm64"
OTHER="x64"
write_fixtures

shim_machine i386
run_installer good
expect_output "an unsupported architecture is refused" "The standalone binary is macOS arm64 and x64 only. This machine reports Darwin-i386." 1
expect_output "an unsupported architecture gives the plugin commands" "The plugin does the same tracing and works on Windows and Linux.
From within Claude Code:

  /plugin marketplace add langchain-ai/langsmith-claude-code-plugins
  /plugin install langsmith-tracing@langsmith-claude-code-plugins
  /reload-plugins" 1
rm -f "$WORK/shim/uname"

shim_machine x86_64 MINGW64_NT-10.0-22631
run_installer good
expect_output "an unsupported platform is named verbatim" "This machine reports MINGW64_NT-10.0-22631-x86_64." 1
rm -f "$WORK/shim/uname"

shim_machine arm64
shim curl <<EOF
#!/bin/bash
printf '%s\n' "\$@" | grep per_page >"$WORK/url.txt"
exit 22
EOF
PATH="$WORK/shim:$PATH" /bin/bash "$INSTALLER" >/dev/null 2>&1
LAST_OUTPUT="$(cat "$WORK/url.txt" 2>/dev/null)"
LAST_STATUS=0
expect_output "the default API asks for 100 releases" "per_page=100" 0
rm -f "$WORK/shim/curl"

REAL_CURL="$(command -v curl)"
rm -f "$WORK/curl-args.txt"
shim curl <<EOF
#!/bin/bash
printf '%s\n' "\$*" >>"$WORK/curl-args.txt"
exec "$REAL_CURL" "\$@"
EOF
run_installer good
rm -f "$WORK/shim/curl"
LAST_OUTPUT="$(cat "$WORK/curl-args.txt" 2>/dev/null)"
LISTING="$(grep -- per_page "$WORK/curl-args.txt")"
DOWNLOAD="$(grep -v -- per_page "$WORK/curl-args.txt")"
if [[ "$DOWNLOAD" == *"--progress-bar"* && "$LISTING" != *"--progress-bar"* ]]; then
  report "the binary download shows progress and the release list stays quiet" ok
else
  report "the binary download shows progress and the release list stays quiet" no
fi
rm -f "$WORK/shim/uname"

head -c $(($(wc -c <"$INSTALLER") - 11)) "$INSTALLER" >"$WORK/truncated.sh"
LAST_OUTPUT="$(/bin/bash "$WORK/truncated.sh" 2>&1)"
LAST_STATUS=$?
if [[ -z "$LAST_OUTPUT" && "$LAST_STATUS" == 0 ]]; then
  report "a truncated script does nothing" ok
else
  report "a truncated script does nothing" no
fi

printf '%s passed, %s failed\n' "$PASSED" "$FAILED"
[[ "$FAILED" == 0 ]]

#!/usr/bin/env bash
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
INSTALLER="${INSTALLER:-$ROOT/install.sh}"
EXECUTABLE="langsmith-claude-code-tracing"
REPO="langchain-ai/langsmith-claude-code-plugins"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/install-test.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/dl" "$WORK/shim"

PASSED=0
FAILED=0
LAST_OUTPUT=""
LAST_STATUS=0

publish_binary() {
  local tag="$1" asset dir
  dir="$WORK/dl/$tag"
  asset="$EXECUTABLE-darwin-arm64-$tag-unsigned"
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
  asset_json "$EXECUTABLE-darwin-arm64-$1-unsigned" "$2"
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
  printf '    "body": "Notes quoting \\"draft\\": true and \\"prerelease\\": true and \\"tag_name\\": \\"9.9.9\\" and \\"name\\": \\"%s-darwin-arm64-9.9.9-unsigned\\""\n' "$EXECUTABLE"
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

SHA_040="$(publish_binary 0.4.0)"
SHA_030="$(publish_binary 0.3.0)"
SHA_0100="$(publish_binary 0.10.0)"
SHA_999="$(publish_binary 9.9.9)"
UPPER_040="$(printf '%s' "$SHA_040" | tr '[:lower:]' '[:upper:]')"

write_releases good \
  "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")" \
  "$(stable 0.3.0 "$(binary_asset_json 0.3.0 "sha256:$SHA_030")")"

write_releases titled \
  "$(release_json 9.9.9 "$EXECUTABLE-darwin-arm64-9.9.9-unsigned" false true \
    "$(asset_json notes.txt "sha256:$SHA_999")")" \
  "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

write_releases titled-stable \
  "$(release_json 9.9.9 "$EXECUTABLE-darwin-arm64-9.9.9-unsigned" false false \
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
  "$(stable 9.9.9-beta "$(binary_asset_json 9.9.9-beta "sha256:$SHA_999")")" \
  "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

MANY=()
for index in $(seq 40 -1 11); do
  MANY+=("$(stable "1.0.$index")")
done
write_releases many30 "${MANY[@]}"
write_releases many31 "${MANY[@]}" "$(stable 0.4.0 "$(binary_asset_json 0.4.0 "sha256:$SHA_040")")"

while IFS='|' read -r name fixture args needle status <&3; do
  [[ -n "$name" ]] || continue
  argv=()
  if [[ -n "$args" ]]; then read -r -a argv <<<"$args"; fi
  run_installer "$fixture" ${argv[@]+"${argv[@]}"}
  expect_output "$name" "$needle" "$status"
done 3<<'CASES'
newest stable wins|good||RAN 0.4.0 args=--install|0
pinned release wins|good|0.3.0|RAN 0.3.0 args=--install|0
an asset-shaped prerelease title loses|titled||RAN 0.4.0 args=--install|0
an asset-shaped stable title is not an asset|titled-stable||RAN 0.4.0 args=--install|0
a prerelease is skipped|prerelease||RAN 0.4.0 args=--install|0
a draft is skipped|draft||RAN 0.4.0 args=--install|0
a pinned draft is refused|draft|9.9.9|None of the newest 100 releases is 9.9.9|1
a null digest does not downgrade|nulldigest||without a SHA-256 digest|1
a pinned null digest names the cause|nulldigest|0.4.0|Release 0.4.0 publishes its macOS arm64 binary without a SHA-256 digest|1
an absent digest does not downgrade|nodigest||without a SHA-256 digest|1
a truncated digest is not a digest|shortdigest||without a SHA-256 digest|1
an uppercase digest is accepted|updigest||RAN 0.4.0 args=--install|0
release 31 is still reachable|many31||RAN 0.4.0 args=--install|0
an empty page names the page size|many30||None of the newest 100 releases carries a macOS arm64 binary.|1
a digest mismatch fails the install|mismatch||failed its SHA-256 check|1
a missing download is reported|missingasset||Could not download|1
an asset version must match the tag|wrongversion||None of the newest 100 releases carries|1
0.10.0 sorts above 0.9.0|ordering||RAN 0.10.0 args=--install|0
an unreachable API is reported|absent||Could not read the releases API|1
--tag and --project reach the binary|good|--tag 0.4.0 --project|RAN 0.4.0 args=--install --tag 0.4.0 --project|0
a target and a forwarded flag coexist|good|0.3.0 --print|RAN 0.3.0 args=--install --print|0
--help exits clean|good|--help|Install the LangSmith tracing binary|0
--version exits clean|good|--version|installer 1.0|0
two targets are refused|good|0.1.0 0.2.0|Only one target is allowed|2
a non-version target is refused|good|nope|Invalid version target|2
the release lookup is announced|good||Finding the release to install.|0
the download names the resolved version|good||Downloading langsmith-claude-code-tracing-darwin-arm64-0.4.0-unsigned.|0
the handoff to the binary is announced|good||Installing 0.4.0.|0
a pinned install announces the pinned version|good|0.3.0|Installing 0.3.0.|0
a prerelease never wins on its own|beta||RAN 0.4.0 args=--install|0
a prerelease alone leaves nothing to install|betaonly||None of the newest 100 releases carries|1
a named prerelease installs|beta|0.5.0-beta.1|RAN 0.5.0-beta.1 args=--install|0
a named prerelease is the only one served|betaonly|0.5.0-beta.1|RAN 0.5.0-beta.1 args=--install|0
a named prerelease that is a draft is refused|betadraft|0.5.0-beta.1|None of the newest 100 releases is 0.5.0-beta.1|1
a mislabelled prerelease still loses to the release|betamislabelled||RAN 0.5.0 args=--install|0
beta.10 sorts above beta.2 and above alpha.99|betaladder||RAN 0.5.0-beta.10 args=--install|0
an unparsable tag cannot be newest|unparsabletag||RAN 0.4.0 args=--install|0
a version with a suffix is a valid target|good|0.5.0-beta.1|None of the newest 100 releases is 0.5.0-beta.1|1
a bare suffix is refused|good|0.5.0-beta|Invalid version target|2
--beta installs the newest prerelease|betaladderpre|--beta|RAN 0.5.0-beta.10 args=--install|0
the same ladder without --beta installs the stable|betaladderpre||RAN 0.4.0 args=--install|0
--beta passes over a newer stable|betaolder|--beta|RAN 0.4.0-beta.1 args=--install|0
--beta without a prerelease says so|good|--beta|None of the newest 100 releases is a prerelease carrying a macOS arm64 binary.|1
--beta skips a drafted prerelease|betadraft|--beta|None of the newest 100 releases is a prerelease carrying a macOS arm64 binary.|1
--beta before a target is refused|good|--beta 0.4.0|--beta and a version target are contradictory|2
--beta after a target is refused|good|0.4.0 --beta|--beta and a version target are contradictory|2
--beta still forwards later flags|beta|--beta --print|RAN 0.5.0-beta.1 args=--install --print|0
--help documents --beta|good|--help|--beta            Install the newest prerelease|0
CASES

shim sed <<'EOF'
#!/bin/bash
exit 1
EOF
run_installer good
expect_output "a parser failure is not a missing release" "Could not read the release list" 1
rm -f "$WORK/shim/sed"

shim uname <<'EOF'
#!/bin/bash
if [ "$1" = "-m" ]; then printf 'x86_64\n'; else printf 'Darwin\n'; fi
EOF
run_installer good
expect_output "an unsupported platform is refused" "published only for macOS arm64, not Darwin-x86_64" 1
rm -f "$WORK/shim/uname"

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

head -c $(($(wc -c <"$INSTALLER") - 11)) "$INSTALLER" >"$WORK/truncated.sh"
LAST_OUTPUT="$(/bin/bash "$WORK/truncated.sh" 2>&1)"
LAST_STATUS=$?
if [[ -z "$LAST_OUTPUT" && "$LAST_STATUS" == 0 ]]; then
  report "a truncated script does nothing" ok
else
  report "a truncated script does nothing" no
fi

run_installer_split good
CLEAN_STDOUT="$LAST_OUTPUT"
PROGRESS_STDERR="$(cat "$WORK/stderr.txt")"
LAST_OUTPUT="stdout: $CLEAN_STDOUT"
if [[ "$CLEAN_STDOUT" == "RAN 0.4.0 args=--install" &&
  "$PROGRESS_STDERR" == *"Finding the release to install."* &&
  "$PROGRESS_STDERR" == *"Downloading "* &&
  "$PROGRESS_STDERR" == *"Installing 0.4.0."* ]]; then
  report "progress lands on stderr and never on stdout" ok
else
  report "progress lands on stderr and never on stdout" no
fi

run_installer_split good --help
LAST_OUTPUT="stdout: $LAST_OUTPUT"
if [[ "$LAST_OUTPUT" == *"Install the LangSmith tracing binary"* && ! -s "$WORK/stderr.txt" ]]; then
  report "--help stays on stdout with a silent stderr" ok
else
  report "--help stays on stdout with a silent stderr" no
fi

BEFORE="$(find "${TMPDIR:-/tmp}" -maxdepth 1 -name "$EXECUTABLE.*" | wc -l)"
run_installer good
run_installer mismatch
AFTER="$(find "${TMPDIR:-/tmp}" -maxdepth 1 -name "$EXECUTABLE.*" | wc -l)"
LAST_OUTPUT="$BEFORE then $AFTER"
LAST_STATUS=0
if [[ "$BEFORE" == "$AFTER" ]]; then
  report "the temp binary is cleaned up" ok
else
  report "the temp binary is cleaned up" no
fi

printf '%s passed, %s failed\n' "$PASSED" "$FAILED"
[[ "$FAILED" == 0 ]]

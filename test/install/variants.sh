#!/usr/bin/env bash
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
INSTALLER="$ROOT/install.sh"
VARIANTS="$HERE/variants.txt"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/install-variants.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

CAUGHT=0
MISSED=0
UNCHANGED=0

while IFS= read -r line; do
  [[ -n "$line" ]] || continue
  name="${line%%|||*}"
  rest="${line#*|||}"
  old="${rest%%|||*}"
  new="${rest#*|||}"
  variant="$WORK/install.sh"
  OLD="$old" NEW="$new" perl -0777 -pe '
    my $o = $ENV{OLD}; $o =~ s/\\n/\n/g;
    my $n = $ENV{NEW}; $n =~ s/\\n/\n/g;
    s/\Q$o\E/$n/;
  ' "$INSTALLER" >"$variant"
  if cmp -s "$INSTALLER" "$variant"; then
    UNCHANGED=$((UNCHANGED + 1))
    printf 'UNCHANGED %s\n' "$name"
    continue
  fi
  if INSTALLER="$variant" /bin/bash "$HERE/cases.sh" >/dev/null 2>&1; then
    MISSED=$((MISSED + 1))
    printf 'MISSED %s\n' "$name"
  else
    CAUGHT=$((CAUGHT + 1))
  fi
done <"$VARIANTS"

printf '%s caught, %s missed, %s unchanged\n' "$CAUGHT" "$MISSED" "$UNCHANGED"
[[ "$MISSED" == 0 && "$UNCHANGED" == 0 ]]

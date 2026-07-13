#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="${1:-$repo_root/tmp/messy-fixture-demo}"

rm -rf "$out_dir"
mkdir -p "$out_dir"

node "$repo_root/dist/cli.js" scan "$repo_root/examples/fixtures/messy" \
  --format markdown \
  --no-respect-ignore \
  --out "../../../tmp/messy-fixture-demo/ARTIFACTS.md"

node "$repo_root/dist/cli.js" scan "$repo_root/examples/fixtures/messy" \
  --format json \
  --no-respect-ignore > "$out_dir/artifacts.json"

set +e
node "$repo_root/dist/cli.js" scan "$repo_root/examples/fixtures/messy" \
  --format json \
  --no-respect-ignore \
  --fail-on suspicious > "$out_dir/fail-on-suspicious.json"
status=$?
set -e

if [ "$status" -ne 2 ]; then
  echo "expected --fail-on suspicious to exit 2, got $status" >&2
  exit 1
fi

grep -q "Artifact Map" "$out_dir/ARTIFACTS.md"
grep -q "dist/source.ts" "$out_dir/ARTIFACTS.md"
grep -q '"path": "dist/source.ts"' "$out_dir/artifacts.json"

echo "wrote messy fixture artifact map to $out_dir"

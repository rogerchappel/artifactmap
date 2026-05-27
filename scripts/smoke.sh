#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm run build >/dev/null
rm -rf .artifactmap-smoke
mkdir -p .artifactmap-smoke

node dist/cli.js scan examples/fixtures/messy --format json --no-respect-ignore --out ../../../.artifactmap-smoke/messy.json
node dist/cli.js scan examples/fixtures/messy --out ../../../.artifactmap-smoke/ARTIFACTS.md

node -e "const fs=require('node:fs'); const report=JSON.parse(fs.readFileSync('.artifactmap-smoke/messy.json','utf8')); if (!report.artifacts.some((a)=>a.path==='dist/source.ts')) process.exit(1);"
test -s .artifactmap-smoke/ARTIFACTS.md

set +e
node dist/cli.js scan examples/fixtures/messy --format json --no-respect-ignore --fail-on suspicious >.artifactmap-smoke/fail-on-suspicious.json
status=$?
set -e
if [ "$status" -ne 2 ]; then
  printf 'expected --fail-on suspicious to exit 2, got %s\n' "$status" >&2
  exit 1
fi

printf 'Smoke report written to .artifactmap-smoke/ARTIFACTS.md\n'

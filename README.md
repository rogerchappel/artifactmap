# ArtifactMap

ArtifactMap inventories generated files, build outputs, caches, packages, and report artifacts so a repository can explain what should be committed, ignored, or cleaned.

It is local-first: no telemetry, no network calls during scans, and no automatic deletion.

## Install

```bash
npm install artifactmap
```

Scan a repo with the installed binary:

```bash
npx artifactmap scan . --out docs/ARTIFACTS.md
```

For local development:

```bash
git clone https://github.com/rogerchappel/artifactmap.git
cd artifactmap
npm install
npm run build
npx artifactmap scan . --out docs/ARTIFACTS.md
```

## Quick Start

Create a reviewable policy:

```bash
artifactmap init --preset node-cli
```

Scan a workspace and write Markdown:

```bash
artifactmap scan . --out docs/ARTIFACTS.md
```

Scan a fixture and emit JSON:

```bash
artifactmap scan examples/fixtures/messy --format json --no-respect-ignore
```

Fail when suspicious findings are present:

```bash
artifactmap scan . --format json --fail-on suspicious
```

## What It Detects

ArtifactMap labels files as:

- source-like
- generated-commit
- generated-ignore
- cache
- report
- package
- unknown

Findings currently include tracked ignored files, untracked package archives, stale reports, large files, and source-looking files inside generated folders.

## Policy Example

```json
{
  "version": 1,
  "largeFileBytes": 5242880,
  "staleReportDays": 30,
  "includeUnknown": false,
  "rules": [
    {
      "kind": "generated-commit",
      "patterns": ["dist/**", "build/**", "lib/**", "*.map"],
      "commit": true
    },
    {
      "kind": "generated-ignore",
      "patterns": ["coverage/**", ".next/**"],
      "commit": false
    }
  ]
}
```

## Safety Model

ArtifactMap only reads local files and writes reports or config files when asked. It does not delete files, mutate git state, upload artifacts, or infer private data from remote services.

## CI Usage

```yaml
- run: npm install
- run: npm run build
- run: node dist/cli.js scan . --format json --fail-on suspicious
```

## Limitations

ArtifactMap uses deterministic path and policy evidence, not full language build graph inference. Nested ignore handling is intentionally simple in the MVP; Git-tracked ignored files are still surfaced so releases can catch hygiene problems.

## Development

```bash
npm install
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

The checked-in fixtures under examples/fixtures exercise clean and messy repository states.

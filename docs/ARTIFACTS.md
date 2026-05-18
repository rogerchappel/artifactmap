# Artifact Map

| Field | Value |
| --- | --- |
| Root | `/Users/roger/Developer/my-opensource/artifactmap/examples/fixtures/messy` |
| Scanned at | 2026-05-18T08:45:41.967Z |
| Files considered | 8 |
| Artifacts | 5 |
| Findings | 6 |

## Counts by kind

| Kind | Count |
| --- | ---: |
| `generated-commit` | 2 |
| `generated-ignore` | 1 |
| `report` | 1 |
| `package` | 1 |

## Findings

### `coverage/coverage-summary.json`

- Kind: `generated-ignore`
- Size: 58 bytes
- Tracked: true
- Ignored: true
- WARNING `ignored-tracked`: Tracked file is also ignored by repository ignore rules.
  Suggestion: Either unignore it explicitly or remove it from git tracking.

### `dist/index.js`

- Kind: `generated-commit`
- Size: 46 bytes
- Tracked: true
- Ignored: true
- WARNING `ignored-tracked`: Tracked file is also ignored by repository ignore rules.
  Suggestion: Either unignore it explicitly or remove it from git tracking.
- WARNING `source-in-generated`: Source-looking file lives inside a generated directory.
  Suggestion: Move source files out of generated output folders or update artifact policy.

### `dist/source.ts`

- Kind: `generated-commit`
- Size: 32 bytes
- Tracked: true
- Ignored: true
- WARNING `ignored-tracked`: Tracked file is also ignored by repository ignore rules.
  Suggestion: Either unignore it explicitly or remove it from git tracking.
- WARNING `source-in-generated`: Source-looking file lives inside a generated directory.
  Suggestion: Move source files out of generated output folders or update artifact policy.

### `fixture-messy-1.0.0.tgz`

- Kind: `package`
- Size: 36 bytes
- Tracked: true
- Ignored: true
- WARNING `ignored-tracked`: Tracked file is also ignored by repository ignore rules.
  Suggestion: Either unignore it explicitly or remove it from git tracking.

## Artifact inventory

| Path | Kind | Tracked | Ignored | Evidence |
| --- | --- | --- | --- | --- |
| `coverage/coverage-summary.json` | `generated-ignore` | yes | yes | policy: coverage/** => generated-ignore |
| `dist/index.js` | `generated-commit` | yes | yes | policy: dist/** => generated-commit |
| `dist/source.ts` | `generated-commit` | yes | yes | policy: dist/** => generated-commit |
| `docs/ARTIFACTS.md` | `report` | yes | no | policy: docs/**/ARTIFACTS.md => report |
| `fixture-messy-1.0.0.tgz` | `package` | yes | yes | policy: *.tgz => package |

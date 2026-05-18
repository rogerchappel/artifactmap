# ArtifactMap PRD

Status: in-progress
Decision: build now
Factory run: 2026-05-18 PM

## One-liner

`artifactmap` inventories generated files, build outputs, caches, and report artifacts so repos can explain what should be committed, ignored, or cleaned. 🗺️

## Source attribution

Created during the 2026-05-18 evening OSS Factory run after the available idea queue was mostly already represented by local repositories. Inspired by repeated OSS Factory friction around generated docs, dist folders, coverage files, package tarballs, and agent-created reports; renamed and scoped as a deterministic local CLI.

## Target users

- Maintainers preparing clean releases.
- Agents deciding whether new files are source, generated evidence, or disposable output.
- Contributors trying to understand repo hygiene rules before committing.

## Problem

Generated artifacts are easy to confuse with source. Agents and humans commit transient files, delete useful generated docs, or leave stale build outputs because the repo lacks a local artifact policy.

## Goals

- Scan a workspace for common generated artifact patterns.
- Compare discovered artifacts against `.gitignore`, package metadata, docs, and config files.
- Label files as source-like, generated-commit, generated-ignore, cache, report, package, or unknown.
- Emit Markdown/JSON reports and optional failure gates for stale or suspicious artifacts.
- Provide a reviewable `artifactmap.config.json` policy.

## Non-goals

- Deleting files automatically.
- Uploading artifacts or integrating with cloud storage.
- Perfect language-specific build graph inference.

## V1 CLI

```bash
artifactmap scan . --out docs/ARTIFACTS.md
artifactmap scan fixtures/messy --format json --fail-on suspicious
artifactmap init --preset node-cli
```

## Functional requirements

1. Walk files deterministically while respecting ignore rules by default.
2. Detect dist/build/coverage/cache/temp/package/report patterns, sourcemaps, generated lock outputs, and known evidence files.
3. Read `.gitignore`, `.npmignore`, `package.json` files fields, common config files, and docs hints.
4. Flag tracked ignored files, untracked package artifacts, stale generated reports, large files, and source-looking files inside generated folders.
5. Emit stable Markdown and JSON with evidence, severity, and suggested policy fixes.
6. Include fixture-backed tests for clean, stale, tracked-ignore, package, report, and large-file cases.

## Acceptance criteria

- `npm test`, `npm run check`, `npm run build`, `npm run smoke`, and `bash scripts/validate.sh` pass where present.
- Real CLI smoke scans checked-in fixtures and writes reports.
- README includes install, quick start, policy examples, safety model, limitations, and CI usage.
- Public GitHub repo `rogerchappel/artifactmap` has useful description and topics.


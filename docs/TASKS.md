# ArtifactMap Task Plan

## MVP

- [x] Scaffold a TypeScript OSS CLI with StackForge.
- [x] Copy the product requirements into docs/PRD.md.
- [x] Implement deterministic artifact scanning.
- [x] Load artifactmap.config.json policy rules.
- [x] Classify generated, ignored, cache, report, package, and unknown artifacts.
- [x] Render Markdown and JSON reports.
- [x] Add artifactmap scan and artifactmap init commands.
- [x] Add fixture-backed tests for clean and messy repositories.
- [x] Add smoke and validation scripts.
- [x] Publish a public GitHub repository.

## Post-MVP

- [ ] Add nested .gitignore interpretation that mirrors Git exactly.
- [ ] Add language-specific presets for Python, Go, Rust, and static sites.
- [ ] Add SARIF output for code scanning integrations.
- [ ] Add config comments through a JSONC reader if maintainers ask for it.
- [ ] Add richer stale-report detection from embedded generated timestamps.

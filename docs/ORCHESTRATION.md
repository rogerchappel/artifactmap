# ArtifactMap Orchestration

ArtifactMap is designed for local agents and human maintainers that need a deterministic answer to one question: which files are generated artifacts, and what should happen to them?

## Local Loop

1. Run npm install.
2. Run npm test.
3. Run npm run check.
4. Run npm run build.
5. Run npm run smoke.
6. Run bash scripts/validate.sh.

## Agent Contract

- Do not delete artifacts automatically.
- Prefer artifactmap scan . --out docs/ARTIFACTS.md before release cleanup.
- Use --format json when another tool needs stable machine-readable output.
- Use --fail-on suspicious in CI when warnings should block a release.
- Update artifactmap.config.json rather than hard-coding project-specific rules.

## CI Gate

Recommended CI command:

```bash
npx artifactmap scan . --format json --fail-on suspicious
```

For repositories that commit generated reports, write the Markdown report and review it like any other generated evidence:

```bash
npx artifactmap scan . --out docs/ARTIFACTS.md
```

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

Until ArtifactMap is published to npm, install the source-built tarball using the
[repository installation steps](../README.md#install). Then run the installed CLI in CI:

```bash
artifactmap scan . --format json --fail-on suspicious
```

For repositories that commit generated reports, write the Markdown report and review it like any other generated evidence:

```bash
artifactmap scan . --out docs/ARTIFACTS.md
```

After ArtifactMap is published to npm, `npx artifactmap` can be used without the
source-tarball installation step.

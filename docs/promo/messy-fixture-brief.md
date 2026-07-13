# Demo brief: messy fixture artifact map

## Hook

"Before cleaning a repo, map which files are source, generated output, packages,
reports, and suspicious leftovers."

## Recording outline

1. Show `examples/fixtures/messy`.
2. Run `npm run build`.
3. Run `bash demo/run-messy-fixture-scan.sh`.
4. Open `tmp/messy-fixture-demo/ARTIFACTS.md`.
5. Show the `--fail-on suspicious` output for CI gating.

## Social hooks

- ArtifactMap turns repository cleanup into reviewable evidence.
- Find tracked ignored files and source-looking files inside generated folders.
- Use Markdown for humans and JSON for CI from the same scan.

## Grounding notes

The demo scans only the checked-in messy fixture. ArtifactMap does not delete
files, publish packages, or call remote services.

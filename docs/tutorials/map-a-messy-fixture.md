# Map a messy fixture

This tutorial scans the checked-in `examples/fixtures/messy` workspace. The
fixture intentionally includes tracked ignored files, package archives, generated
outputs, and a source-looking file inside `dist/`.

## Build the CLI

```bash
npm install
npm run build
```

## Run the demo

```bash
bash demo/run-messy-fixture-scan.sh
```

The script writes outputs to `tmp/messy-fixture-demo/`:

- `ARTIFACTS.md` is a reviewer-friendly Markdown inventory.
- `artifacts.json` is a machine-readable scan.
- `fail-on-suspicious.json` shows the same scan behind a non-zero gate.

## What to look for

The fixture demonstrates common repository hygiene questions:

- Should `dist/source.ts` really be inside generated output?
- Should ignored coverage files be tracked?
- Is a package archive meant to stay in git?
- Which files are reports versus source-like files?

ArtifactMap does not delete files. It produces evidence so maintainers can decide
what belongs in the repository, in CI artifacts, or in `.gitignore`.

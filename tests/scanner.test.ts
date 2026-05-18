import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { scanWorkspace } from '../src/scanner.js';

const fixtureRoot = path.resolve('examples/fixtures/messy');

test('scans checked-in fixture artifacts deterministically', async () => {
  const report = await scanWorkspace({
    root: fixtureRoot,
    respectIgnore: false,
    now: new Date('2026-05-18T00:00:00Z')
  });

  const byPath = new Map(report.artifacts.map((artifact) => [artifact.path, artifact]));
  assert.equal(byPath.get('dist/index.js')?.kind, 'generated-commit');
  assert.equal(byPath.get('dist/source.ts')?.findings.some((finding) => finding.code === 'source-in-generated'), true);
  assert.equal(byPath.get('coverage/coverage-summary.json')?.kind, 'generated-ignore');
  assert.equal(byPath.get('fixture-messy-1.0.0.tgz')?.kind, 'package');
  assert.deepEqual(report.artifacts.map((artifact) => artifact.path), [...report.artifacts.map((artifact) => artifact.path)].sort());
});

test('respects ignore rules by default while keeping tracked ignored files visible', async () => {
  const report = await scanWorkspace({
    root: fixtureRoot,
    now: new Date('2026-05-18T00:00:00Z')
  });

  assert.equal(report.artifacts.some((artifact) => artifact.path === 'coverage/coverage-summary.json'), true);
  assert.equal(report.artifacts.some((artifact) => artifact.path === 'fixture-messy-1.0.0.tgz'), true);
});

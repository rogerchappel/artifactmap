import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import os from 'node:os';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
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

test('scans generated artifacts in nested workspaces with the default policy', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifactmap-nested-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'packages/api/dist'), { recursive: true });
  await mkdir(path.join(root, 'packages/api/coverage'), { recursive: true });
  await writeFile(path.join(root, 'packages/api/dist/index.js'), 'export {}\n');
  await writeFile(path.join(root, 'packages/api/coverage/coverage-summary.json'), '{}\n');

  const report = await scanWorkspace({ root, respectIgnore: false });
  const byPath = new Map(report.artifacts.map((artifact) => [artifact.path, artifact]));

  assert.equal(byPath.get('packages/api/dist/index.js')?.kind, 'generated-commit');
  assert.equal(byPath.get('packages/api/coverage/coverage-summary.json')?.kind, 'generated-ignore');
});

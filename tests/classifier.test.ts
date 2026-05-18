import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyArtifact } from '../src/classifier.js';
import { createDefaultConfig } from '../src/defaultConfig.js';

test('classifies configured build output and source-looking generated files', () => {
  const result = classifyArtifact({
    path: 'dist/source.ts',
    size: 20,
    modifiedAt: new Date('2026-05-01T00:00:00Z'),
    tracked: true,
    ignored: false,
    gitUntracked: false,
    now: new Date('2026-05-18T00:00:00Z'),
    config: createDefaultConfig()
  });

  assert.equal(result.kind, 'generated-commit');
  assert.equal(result.findings.some((finding) => finding.code === 'source-in-generated'), true);
});

test('flags stale reports and large package artifacts', () => {
  const config = createDefaultConfig();
  config.largeFileBytes = 10;
  config.staleReportDays = 1;

  const report = classifyArtifact({
    path: 'docs/ARTIFACTS.md',
    size: 20,
    modifiedAt: new Date('2026-05-01T00:00:00Z'),
    tracked: true,
    ignored: false,
    gitUntracked: false,
    now: new Date('2026-05-18T00:00:00Z'),
    config
  });

  assert.equal(report.kind, 'report');
  assert.equal(report.findings.some((finding) => finding.code === 'stale-report'), true);
  assert.equal(report.findings.some((finding) => finding.code === 'large-file'), true);
});

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

test('classifies default artifacts inside nested workspaces', () => {
  const config = createDefaultConfig();
  const classify = (artifactPath: string) => classifyArtifact({
    path: artifactPath,
    size: 20,
    modifiedAt: new Date('2026-05-18T00:00:00Z'),
    tracked: false,
    ignored: false,
    gitUntracked: true,
    now: new Date('2026-05-18T00:00:00Z'),
    config
  });

  assert.equal(classify('packages/api/dist/index.js').kind, 'generated-commit');
  assert.equal(classify('packages/web/coverage/coverage-summary.json').kind, 'generated-ignore');
  assert.equal(classify('apps/docs/.next/server/app.js').kind, 'generated-ignore');
  assert.equal(classify('packages/api/node_modules/tool/index.js').kind, 'cache');
  assert.equal(classify('packages/api/reports/audit.html').kind, 'report');
  assert.equal(classify('packages/api/package/artifact.tgz').kind, 'package');
  assert.equal(
    classify('packages/api/dist/index.js').findings.some((finding) => finding.code === 'source-in-generated'),
    true
  );
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

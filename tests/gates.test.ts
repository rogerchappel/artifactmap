import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFailOn, shouldFail } from '../src/gates.js';
import type { ScanReport } from '../src/types.js';

test('fail-on suspicious treats warnings as failures', () => {
  assert.equal(shouldFail(reportWithSeverity('warning'), 'suspicious'), true);
  assert.equal(shouldFail(reportWithSeverity('warning'), 'error'), false);
  assert.equal(shouldFail(reportWithSeverity('error'), 'error'), true);
});

test('parses supported fail-on values', () => {
  assert.equal(parseFailOn('none'), 'none');
  assert.equal(parseFailOn('warning'), 'warning');
  assert.throws(() => parseFailOn('bad-value'));
});

function reportWithSeverity(severity: 'info' | 'warning' | 'error'): ScanReport {
  return {
    summary: {
      root: '/tmp/demo',
      scannedAt: '2026-05-18T00:00:00.000Z',
      totalFiles: 1,
      artifacts: 1,
      byKind: {
        'source-like': 0,
        'generated-commit': 1,
        'generated-ignore': 0,
        cache: 0,
        report: 0,
        package: 0,
        unknown: 0
      },
      bySeverity: {
        info: severity === 'info' ? 1 : 0,
        warning: severity === 'warning' ? 1 : 0,
        error: severity === 'error' ? 1 : 0
      }
    },
    artifacts: [
      {
        path: 'dist/index.js',
        kind: 'generated-commit',
        size: 10,
        modifiedAt: '2026-05-18T00:00:00.000Z',
        tracked: true,
        ignored: false,
        evidence: [],
        findings: [
          {
            code: 'large-file',
            severity,
            message: 'demo',
            suggestion: 'demo'
          }
        ]
      }
    ],
    policy: {
      version: 1,
      largeFileBytes: 10,
      staleReportDays: 30,
      includeUnknown: false,
      rules: []
    }
  };
}

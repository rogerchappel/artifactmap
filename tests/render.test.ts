import assert from 'node:assert/strict';
import test from 'node:test';
import { renderMarkdown } from '../src/render/markdown.js';
import type { ScanReport } from '../src/types.js';

test('renders markdown with real line breaks', () => {
  const report: ScanReport = {
    summary: {
      root: '/tmp/demo',
      scannedAt: '2026-05-18T00:00:00.000Z',
      totalFiles: 1,
      artifacts: 0,
      byKind: {
        'source-like': 0,
        'generated-commit': 0,
        'generated-ignore': 0,
        cache: 0,
        report: 0,
        package: 0,
        unknown: 0
      },
      bySeverity: {
        info: 0,
        warning: 0,
        error: 0
      }
    },
    artifacts: [],
    policy: {
      version: 1,
      largeFileBytes: 10,
      staleReportDays: 30,
      includeUnknown: false,
      rules: []
    }
  };

  const markdown = renderMarkdown(report);
  assert.match(markdown, /^# Artifact Map\n/);
  assert.equal(markdown.includes('\\n'), false);
});

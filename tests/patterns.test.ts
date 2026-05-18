import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesPattern } from '../src/patterns.js';

test('matches glob-like artifact patterns', () => {
  assert.equal(matchesPattern('dist/index.js', 'dist/**'), true);
  assert.equal(matchesPattern('docs/ARTIFACTS.md', 'docs/**/ARTIFACTS.md'), true);
  assert.equal(matchesPattern('artifactmap-1.0.0.tgz', '*.tgz'), true);
  assert.equal(matchesPattern('src/index.ts', 'dist/**'), false);
});

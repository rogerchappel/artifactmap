import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadConfig, writeDefaultConfig } from '../src/config.js';

test('writes and loads the default policy config', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifactmap-config-'));
  await writeDefaultConfig(root);
  const raw = await readFile(path.join(root, 'artifactmap.config.json'), 'utf8');
  const config = await loadConfig(root);

  assert.match(raw, /"version": 1/);
  assert.equal(config.rules.some((rule) => rule.kind === 'package'), true);
});

test('merges partial config with defaults', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifactmap-config-'));
  await writeDefaultConfig(root, 'custom.json');
  const config = await loadConfig(root, 'missing.json');

  assert.equal(config.version, 1);
  assert.equal(config.largeFileBytes > 0, true);
});

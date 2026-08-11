import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadConfig, mergeConfig, writeDefaultConfig } from '../src/config.js';

test('writes and loads the default policy config', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifactmap-config-'));
  await writeDefaultConfig(root);
  const raw = await readFile(path.join(root, 'artifactmap.config.json'), 'utf8');
  const config = await loadConfig(root);

  assert.match(raw, /"version": 1/);
  assert.equal(config.rules.some((rule) => rule.kind === 'package'), true);
});

test('merges valid partial config with defaults', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifactmap-config-'));
  await writeConfig(root, {
    largeFileBytes: 1024,
    includeUnknown: true
  });
  const config = await loadConfig(root);

  assert.equal(config.version, 1);
  assert.equal(config.largeFileBytes, 1024);
  assert.equal(config.includeUnknown, true);
  assert.equal(config.staleReportDays, 30);
  assert.equal(config.rules.some((rule) => rule.kind === 'package'), true);
});

test('rejects unsupported versions and invalid thresholds before scanning', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifactmap-config-'));
  await writeConfig(root, {
    version: 2,
    largeFileBytes: -1,
    staleReportDays: -1,
    includeUnknown: false,
    rules: []
  });

  await assert.rejects(loadConfig(root), /Invalid configuration field "version": expected the supported version 1\./);

  const invalidValues = [
    ['largeFileBytes', -1],
    ['largeFileBytes', null],
    ['staleReportDays', -1],
    ['staleReportDays', '30'],
    ['includeUnknown', 'false']
  ] as const;

  for (const [field, value] of invalidValues) {
    await writeConfig(root, { [field]: value });
    await assert.rejects(loadConfig(root), new RegExp(`Invalid configuration field "${field}"`));
  }

  assert.throws(
    () => mergeConfig({ largeFileBytes: Number.POSITIVE_INFINITY }),
    /Invalid configuration field "largeFileBytes": expected a finite, non-negative number\./
  );
});

test('rejects invalid rule kinds and pattern shapes before scanning', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifactmap-config-'));

  await writeConfig(root, { rules: [{ kind: 'archive', patterns: ['*.tgz'] }] });
  await assert.rejects(loadConfig(root), /Invalid configuration field "rules\[0\]\.kind"/);

  await writeConfig(root, { rules: [{ kind: 'package', patterns: '*.tgz' }] });
  await assert.rejects(
    loadConfig(root),
    /Invalid configuration field "rules\[0\]\.patterns": expected an array of strings\./
  );

  await writeConfig(root, { rules: [{ kind: 'package', patterns: ['*.tgz', 42] }] });
  await assert.rejects(loadConfig(root), /Invalid configuration field "rules\[0\]\.patterns\[1\]": expected a string\./);
});

test('creates parent directories for a nested config path', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifactmap-config-'));
  const destination = await writeDefaultConfig(root, 'nested/policy/artifactmap.config.json');

  assert.equal(destination, path.join(root, 'nested/policy/artifactmap.config.json'));
  assert.match(await readFile(destination, 'utf8'), /"version": 1/);
});

test('refuses to overwrite an existing config and preserves its bytes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifactmap-config-'));
  const destination = path.join(root, 'nested/artifactmap.config.json');
  const existing = Buffer.from('{"sentinel":true}\n');
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, existing);

  await assert.rejects(
    writeDefaultConfig(root, 'nested/artifactmap.config.json'),
    /Config already exists at .*artifactmap\.config\.json; choose a different --out path or remove it first/
  );
  assert.deepEqual(await readFile(destination), existing);
});

async function writeConfig(root: string, config: unknown): Promise<void> {
  await writeFile(path.join(root, 'artifactmap.config.json'), JSON.stringify(config), 'utf8');
}

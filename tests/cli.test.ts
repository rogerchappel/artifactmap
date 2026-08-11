import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const cliPath = path.resolve('src/cli.ts');
const tsxLoaderPath = path.resolve('node_modules/tsx/dist/loader.mjs');

test('init creates a config at a nested --out path', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifactmap-cli-'));

  const { stdout } = await runCli(root, ['init', '--out', 'nested/policy/artifactmap.config.json']);

  assert.equal(stdout, 'Wrote nested/policy/artifactmap.config.json\n');
  assert.match(await readFile(path.join(root, 'nested/policy/artifactmap.config.json'), 'utf8'), /"version": 1/);
});

test('init reports a collision, exits nonzero, and preserves the existing config', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifactmap-cli-'));
  const destination = path.join(root, 'artifactmap.config.json');
  const existing = Buffer.from('{"sentinel":true}\n');
  await writeFile(destination, existing);

  await assert.rejects(runCli(root, ['init']), (error: unknown) => {
    assert.ok(error instanceof Error && 'code' in error && error.code === 1);
    assert.ok('stderr' in error && typeof error.stderr === 'string');
    assert.match(
      error.stderr,
      /Config already exists at .*artifactmap\.config\.json; choose a different --out path or remove it first/
    );
    return true;
  });
  assert.deepEqual(await readFile(destination), existing);
});

function runCli(cwd: string, args: string[]) {
  return execFileAsync(process.execPath, ['--import', tsxLoaderPath, cliPath, ...args], { cwd });
}

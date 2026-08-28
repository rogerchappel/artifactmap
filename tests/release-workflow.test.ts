import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowPath = new URL('../.github/workflows/release.yml', import.meta.url);

test('release publishes the verified package before creating the GitHub release', async () => {
  const workflow = await readFile(workflowPath, 'utf8');
  const pack = workflow.indexOf('npm pack --json');
  const verify = workflow.indexOf('test -f "$package_file"');
  const publish = workflow.indexOf(
    'npm publish "${{ steps.package.outputs.file }}" --access public --provenance',
  );
  const githubRelease = workflow.indexOf('gh release create');

  assert.notEqual(pack, -1, 'release workflow must build an inspectable npm pack manifest');
  assert.notEqual(verify, -1, 'release workflow must verify the resolved tarball exists');
  assert.notEqual(publish, -1, 'release workflow must publish the resolved tarball to npm');
  assert.notEqual(githubRelease, -1, 'release workflow must create a GitHub release');
  assert.ok(pack < verify, 'tarball verification must happen after npm pack');
  assert.ok(verify < publish, 'npm publication must happen after tarball verification');
  assert.ok(publish < githubRelease, 'npm publication must happen before GitHub release creation');

  const artifactReference = '${{ steps.package.outputs.file }}';
  assert.equal(
    workflow.match(new RegExp(artifactReference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))?.length,
    2,
    'npm and GitHub releases must consume the same resolved tarball output',
  );
  assert.doesNotMatch(workflow, /npm (?:publish|release)[^\n]*\*\.tgz/);
  assert.doesNotMatch(workflow, /gh release create[^\n]*\*\.tgz/);
});

test('release installs and verifies a trusted publishing npm CLI before dependencies', async () => {
  const workflow = await readFile(workflowPath, 'utf8');
  const version = workflow.match(/^  NPM_VERSION: (\d+\.\d+\.\d+)$/m)?.[1];
  const installCli = workflow.indexOf('npm install --global "npm@$NPM_VERSION"');
  const verifyCli = workflow.indexOf('test "$(npm --version)" = "$NPM_VERSION"');
  const installDependencies = workflow.indexOf('run: npm ci');
  const publish = workflow.indexOf(
    'npm publish "${{ steps.package.outputs.file }}" --access public --provenance',
  );

  assert.ok(version, 'release workflow must pin an exact npm CLI version');
  assert.ok(
    Number(version.split('.')[0]) >= 11,
    'trusted publishing requires an npm CLI version with OIDC support',
  );
  assert.notEqual(installCli, -1, 'release workflow must install the pinned npm CLI');
  assert.notEqual(verifyCli, -1, 'release workflow must verify the resolved npm CLI version');
  assert.ok(installCli < verifyCli, 'npm CLI verification must follow installation');
  assert.ok(verifyCli < installDependencies, 'the verified npm CLI must install dependencies');
  assert.ok(installDependencies < publish, 'dependency installation must precede npm publication');
});

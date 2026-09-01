import assert from 'node:assert/strict';
import test from 'node:test';
import { checkInstallationDocs, checkReadme, isPublishedResponse } from '../scripts/check-readme-install.mjs';

const sourceReadme = `ArtifactMap is not published to the npm registry yet.
npm install --global ./artifactmap-0.1.0.tgz
After ArtifactMap is published to npm
npm install --global artifactmap`;

test('accepts unpublished registry response with source-tarball instructions', () => {
  assert.equal(isPublishedResponse(null), false);
  assert.deepEqual(checkReadme(sourceReadme, false), []);
});

test('rejects registry-first instructions while unpublished', () => {
  assert.match(checkReadme('npm install --global artifactmap', false).join('\n'), /unpublished/);
});

test('rejects active npx usage while unpublished', () => {
  const readme = `${sourceReadme}
Inspect the CLI:

\`\`\`sh
npx artifactmap --help
\`\`\``;

  assert.match(checkReadme(readme, false).join('\n'), /npx artifactmap/);
});

test('checks active npx usage in every maintained installation document', () => {
  const documents = {
    'README.md': sourceReadme,
    'docs/ORCHESTRATION.md': `Recommended CI command:\n\n\`\`\`bash\nnpx artifactmap scan .\n\`\`\``,
  };

  assert.match(checkInstallationDocs(documents, false).join('\n'), /docs\/ORCHESTRATION\.md.*npx artifactmap/);
});

test('accepts installed CLI commands across maintained installation documents', () => {
  const documents = {
    'README.md': sourceReadme,
    'docs/ORCHESTRATION.md': `Recommended CI command:\n\n\`\`\`bash\nartifactmap scan .\n\`\`\``,
  };

  assert.deepEqual(checkInstallationDocs(documents, false), []);
});

test('recognizes published response and rejects stale unpublished notice', () => {
  assert.equal(isPublishedResponse({ version: '0.1.0' }), true);
  assert.match(checkReadme(sourceReadme, true).join('\n'), /still says/);
});

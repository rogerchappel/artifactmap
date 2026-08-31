#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const isPublishedResponse = (response) => Boolean(response && typeof response.version === 'string' && response.version);

export function checkReadme(readme, published) {
  const errors = [];
  const unpublished = 'ArtifactMap is not published to the npm registry yet.';
  const codeBlocks = [...readme.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((match) => match[1]).join('\n');
  if (published) {
    if (readme.includes(unpublished)) errors.push('README still says the package is unpublished');
    if (!readme.includes('npm install --global artifactmap')) errors.push('README lacks the registry install command');
  } else {
    if (!readme.includes(unpublished)) errors.push('README must state that the package is unpublished');
    if (!readme.includes('npm install --global ./artifactmap-0.1.0.tgz')) errors.push('README lacks the source-tarball install command');
    if (!readme.includes('After ArtifactMap is published to npm')) errors.push('README must mark registry commands as post-publication');
    if (/^\s*(?:\$\s*)?npx(?:\s+--yes)?\s+artifactmap(?:\s|$)/m.test(codeBlocks)) errors.push('README must not use npx artifactmap while the package is unpublished');
  }
  return errors;
}

function registryResponse() {
  if (process.env.ARTIFACTMAP_REGISTRY_RESPONSE) return JSON.parse(process.env.ARTIFACTMAP_REGISTRY_RESPONSE);
  try {
    const version = JSON.parse(execFileSync('npm', ['view', 'artifactmap', 'version', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
    return { version };
  } catch { return null; }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const published = isPublishedResponse(registryResponse());
  const errors = checkReadme(readFileSync('README.md', 'utf8'), published);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log(`README installation instructions match the ${published ? 'published' : 'unpublished'} registry state.`);
}

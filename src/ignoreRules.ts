import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { Ignore } from 'ignore';

const DEFAULT_IGNORES = ['.git/**', 'node_modules/**'];
const require = createRequire(import.meta.url);
const ignore = require('ignore') as typeof import('ignore').default;

export async function buildIgnoreMatcher(root: string): Promise<Ignore> {
  const matcher = ignore().add(DEFAULT_IGNORES);

  for (const fileName of ['.gitignore', '.npmignore']) {
    const filePath = path.join(root, fileName);
    try {
      matcher.add(await readFile(filePath, 'utf8'));
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
        throw error;
      }
    }
  }

  return matcher;
}

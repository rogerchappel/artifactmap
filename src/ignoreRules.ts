import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ignore from 'ignore';
import type { Ignore } from 'ignore';

const DEFAULT_IGNORES = ['.git/**', 'node_modules/**'];

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

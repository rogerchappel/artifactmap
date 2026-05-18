import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Ignore } from 'ignore';
import { relativePath, sortPaths, toPosixPath } from './pathUtils.js';

export type WalkEntry = {
  absolutePath: string;
  path: string;
  size: number;
  modifiedAt: Date;
  ignored: boolean;
};

export async function walkFiles(root: string, matcher: Ignore, respectIgnore: boolean): Promise<WalkEntry[]> {
  const entries: WalkEntry[] = [];

  async function visit(directory: string): Promise<void> {
    const children = await readdir(directory, { withFileTypes: true });
    const ordered = children.sort((left, right) => left.name.localeCompare(right.name, 'en'));

    for (const child of ordered) {
      const absolutePath = path.join(directory, child.name);
      const relative = relativePath(root, absolutePath);
      const posixRelative = toPosixPath(relative);
      const ignored = matcher.ignores(posixRelative);

      if (child.isDirectory()) {
        if (posixRelative === '.git' || (respectIgnore && ignored)) {
          continue;
        }
        await visit(absolutePath);
        continue;
      }

      if (!child.isFile()) {
        continue;
      }

      if (respectIgnore && ignored) {
        continue;
      }

      const fileStat = await stat(absolutePath);
      entries.push({
        absolutePath,
        path: posixRelative,
        size: fileStat.size,
        modifiedAt: fileStat.mtime,
        ignored
      });
    }
  }

  await visit(root);
  return entries.sort((left, right) => sortPaths([left.path, right.path])[0] === left.path ? -1 : 1);
}

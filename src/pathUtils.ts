import path from 'node:path';

export function toPosixPath(value: string): string {
  return value.split(path.sep).join('/');
}

export function relativePath(root: string, absolutePath: string): string {
  const relative = path.relative(root, absolutePath);
  return toPosixPath(relative || '.');
}

export function sortPaths(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right, 'en'));
}

export function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

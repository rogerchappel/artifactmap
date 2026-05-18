import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sortPaths } from './pathUtils.js';

const execFileAsync = promisify(execFile);

export type GitState = {
  available: boolean;
  tracked: Set<string>;
  trackedIgnored: Set<string>;
  untracked: Set<string>;
};

export async function readGitState(root: string): Promise<GitState> {
  const inside = await git(root, ['rev-parse', '--is-inside-work-tree']);
  if (!inside.ok || inside.stdout.trim() !== 'true') {
    return emptyGitState(false);
  }
  const topLevel = await git(root, ['rev-parse', '--show-toplevel']);
  const pathspec = topLevel.ok && topLevel.stdout.trim() !== root ? ['--', '.'] : [];

  const [tracked, trackedIgnored, untracked] = await Promise.all([
    git(root, ['ls-files', '-z', ...pathspec]),
    git(root, ['ls-files', '-z', '-ci', '--exclude-standard', ...pathspec]),
    git(root, ['ls-files', '-z', '--others', '--exclude-standard', ...pathspec])
  ]);

  return {
    available: true,
    tracked: new Set(parseNul(tracked.stdout)),
    trackedIgnored: new Set(parseNul(trackedIgnored.stdout)),
    untracked: new Set(parseNul(untracked.stdout))
  };
}

function emptyGitState(available: boolean): GitState {
  return {
    available,
    tracked: new Set(),
    trackedIgnored: new Set(),
    untracked: new Set()
  };
}

function parseNul(output: string): string[] {
  return sortPaths(output.split('\0').filter(Boolean).map((item) => item.replace(/^\.\//, '')));
}

async function git(root: string, args: string[]): Promise<{ ok: boolean; stdout: string }> {
  try {
    const { stdout } = await execFileAsync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
    return { ok: true, stdout };
  } catch {
    return { ok: false, stdout: '' };
  }
}

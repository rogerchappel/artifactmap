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

  const [tracked, trackedIgnored, untracked] = await Promise.all([
    git(root, ['ls-files', '-z']),
    git(root, ['ls-files', '-z', '-ci', '--exclude-standard']),
    git(root, ['ls-files', '-z', '--others', '--exclude-standard'])
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
  return sortPaths(output.split('\0').filter(Boolean));
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

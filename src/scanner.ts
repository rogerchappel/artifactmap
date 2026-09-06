import { stat } from 'node:fs/promises';
import path from 'node:path';
import { classifyArtifact } from './classifier.js';
import { loadConfig } from './config.js';
import { readGitState } from './git.js';
import { buildIgnoreMatcher } from './ignoreRules.js';
import type { ArtifactKind, ArtifactRecord, ScanOptions, ScanReport, Severity } from './types.js';
import { walkFiles, type WalkEntry } from './walker.js';

const KINDS: ArtifactKind[] = ['source-like', 'generated-commit', 'generated-ignore', 'cache', 'report', 'package', 'unknown'];
const SEVERITIES: Severity[] = ['info', 'warning', 'error'];

export async function scanWorkspace(options: ScanOptions): Promise<ScanReport> {
  const root = path.resolve(options.root);
  const now = options.now ?? new Date();
  const config = await loadConfig(root, options.configPath);
  if (typeof options.includeUnknown === 'boolean') {
    config.includeUnknown = options.includeUnknown;
  }

  const matcher = await buildIgnoreMatcher(root);
  const git = await readGitState(root);
  const respectIgnore = options.respectIgnore ?? true;
  const walked = await walkFiles(root, matcher, respectIgnore);
  const entriesByPath = new Map(walked.map((entry) => [entry.path, entry]));

  for (const ignoredTrackedPath of git.trackedIgnored) {
    if (!entriesByPath.has(ignoredTrackedPath)) {
      const absolutePath = path.join(root, ignoredTrackedPath);
      const fileStat = await stat(absolutePath).catch((error: unknown) => {
        if (isMissingFileError(error)) {
          return undefined;
        }
        throw error;
      });
      if (!fileStat) {
        continue;
      }
      entriesByPath.set(ignoredTrackedPath, {
        absolutePath,
        path: ignoredTrackedPath,
        size: fileStat.size,
        modifiedAt: fileStat.mtime,
        ignored: true
      });
    }
  }

  const artifacts = [...entriesByPath.values()]
    .map((entry) => toArtifact(entry, git, config, now))
    .filter((artifact) => artifact.kind !== 'source-like' || artifact.findings.length > 0 || config.includeUnknown)
    .sort((left, right) => left.path.localeCompare(right.path, 'en'));

  return {
    summary: {
      root,
      scannedAt: now.toISOString(),
      totalFiles: entriesByPath.size,
      artifacts: artifacts.length,
      byKind: countByKind(artifacts),
      bySeverity: countBySeverity(artifacts)
    },
    artifacts,
    policy: config
  };
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function toArtifact(
  entry: WalkEntry,
  git: Awaited<ReturnType<typeof readGitState>>,
  config: ScanReport['policy'],
  now: Date
): ArtifactRecord {
  const tracked = git.tracked.has(entry.path);
  const classification = classifyArtifact({
    path: entry.path,
    size: entry.size,
    modifiedAt: entry.modifiedAt,
    tracked,
    ignored: entry.ignored || git.trackedIgnored.has(entry.path),
    gitUntracked: git.untracked.has(entry.path),
    now,
    config
  });

  return {
    path: entry.path,
    kind: classification.kind,
    size: entry.size,
    modifiedAt: entry.modifiedAt.toISOString(),
    tracked,
    ignored: entry.ignored || git.trackedIgnored.has(entry.path),
    evidence: classification.evidence,
    findings: classification.findings
  };
}

function countByKind(artifacts: ArtifactRecord[]): Record<ArtifactKind, number> {
  const counts = Object.fromEntries(KINDS.map((kind) => [kind, 0])) as Record<ArtifactKind, number>;
  for (const artifact of artifacts) {
    counts[artifact.kind] += 1;
  }
  return counts;
}

function countBySeverity(artifacts: ArtifactRecord[]): Record<Severity, number> {
  const counts = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0])) as Record<Severity, number>;
  for (const artifact of artifacts) {
    for (const finding of artifact.findings) {
      counts[finding.severity] += 1;
    }
  }
  return counts;
}

import path from 'node:path';
import { matchesAny } from './patterns.js';
import type { ArtifactKind, ArtifactMapConfig, Evidence, Finding } from './types.js';

export type ClassificationInput = {
  path: string;
  size: number;
  modifiedAt: Date;
  tracked: boolean;
  ignored: boolean;
  gitUntracked: boolean;
  now: Date;
  config: ArtifactMapConfig;
};

export type Classification = {
  kind: ArtifactKind;
  evidence: Evidence[];
  findings: Finding[];
};

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.go', '.rs', '.java', '.rb']);
const REPORT_HINTS = [/report/i, /artifacts?\.md$/i, /coverage-summary\.json$/i];
const SOURCE_LIKE_GENERATED_DIRS = /(?:^|\/)(?:dist|build|lib|coverage|reports)\//;

export function classifyArtifact(input: ClassificationInput): Classification {
  const evidence: Evidence[] = [];
  const findings: Finding[] = [];
  let kind = matchConfiguredKind(input, evidence);

  if (!kind) {
    kind = inferKind(input.path, evidence);
  }

  if (!kind && input.ignored) {
    kind = 'generated-ignore';
    evidence.push({ rule: 'ignore', detail: 'Ignored by .gitignore or .npmignore.' });
  }

  if (!kind && input.config.includeUnknown) {
    kind = 'unknown';
  }

  if (!kind) {
    return { kind: 'source-like', evidence, findings };
  }

  addFindings(input, kind, findings);
  return { kind, evidence, findings };
}

function matchConfiguredKind(input: ClassificationInput, evidence: Evidence[]): ArtifactKind | undefined {
  for (const rule of input.config.rules) {
    const pattern = matchesAny(input.path, rule.patterns);
    if (pattern) {
      evidence.push({ rule: 'policy', detail: pattern + ' => ' + rule.kind });
      return rule.kind;
    }
  }

  return undefined;
}

function inferKind(filePath: string, evidence: Evidence[]): ArtifactKind | undefined {
  const base = path.posix.basename(filePath);

  if (/\.(tgz|zip|tar\.gz)$/.test(base)) {
    evidence.push({ rule: 'extension', detail: 'Archive extension looks like a package artifact.' });
    return 'package';
  }

  if (base.endsWith('.map')) {
    evidence.push({ rule: 'extension', detail: 'Source map output.' });
    return 'generated-commit';
  }

  if (REPORT_HINTS.some((hint) => hint.test(filePath))) {
    evidence.push({ rule: 'name', detail: 'Path looks like a generated report or evidence file.' });
    return 'report';
  }

  if (/(?:^|\/)(?:tmp|temp|cache|\.cache)\//.test(filePath)) {
    evidence.push({ rule: 'directory', detail: 'Path is under a cache or temporary directory.' });
    return 'cache';
  }

  return undefined;
}

function addFindings(input: ClassificationInput, kind: ArtifactKind, findings: Finding[]): void {
  if (input.tracked && input.ignored) {
    findings.push({
      code: 'ignored-tracked',
      severity: 'warning',
      message: 'Tracked file is also ignored by repository ignore rules.',
      suggestion: 'Either unignore it explicitly or remove it from git tracking.'
    });
  }

  if (kind === 'package' && input.gitUntracked) {
    findings.push({
      code: 'untracked-package',
      severity: 'warning',
      message: 'Package artifact is present but not tracked.',
      suggestion: 'Keep package archives out of commits or document why this one is release evidence.'
    });
  }

  if (kind === 'report' && ageDays(input.modifiedAt, input.now) > input.config.staleReportDays) {
    findings.push({
      code: 'stale-report',
      severity: 'warning',
      message: 'Report is older than ' + input.config.staleReportDays + ' days.',
      suggestion: 'Regenerate the report or remove it if it is no longer useful.'
    });
  }

  if (input.size > input.config.largeFileBytes) {
    findings.push({
      code: 'large-file',
      severity: 'warning',
      message: 'File is larger than configured limit ' + input.config.largeFileBytes + ' bytes.',
      suggestion: 'Confirm it belongs in git or move it to an external release artifact.'
    });
  }

  if (SOURCE_LIKE_GENERATED_DIRS.test(input.path) && SOURCE_EXTENSIONS.has(path.posix.extname(input.path))) {
    findings.push({
      code: 'source-in-generated',
      severity: kind === 'source-like' ? 'error' : 'warning',
      message: 'Source-looking file lives inside a generated directory.',
      suggestion: 'Move source files out of generated output folders or update artifact policy.'
    });
  }

  if (kind === 'unknown') {
    findings.push({
      code: 'unknown-artifact',
      severity: 'info',
      message: 'File did not match source or known artifact policy.',
      suggestion: 'Add a policy rule if this file is generated.'
    });
  }
}

function ageDays(then: Date, now: Date): number {
  return (now.getTime() - then.getTime()) / 86400000;
}

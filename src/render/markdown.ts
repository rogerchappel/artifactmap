import type { ArtifactRecord, ScanReport, Severity } from '../types.js';

const SEVERITY_ORDER: Severity[] = ['error', 'warning', 'info'];
const TICK = String.fromCharCode(96);

export function renderMarkdown(report: ScanReport): string {
  const lines: string[] = [];
  lines.push('# Artifact Map');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| --- | --- |');
  lines.push('| Root | ' + code(report.summary.root) + ' |');
  lines.push('| Scanned at | ' + report.summary.scannedAt + ' |');
  lines.push('| Files considered | ' + report.summary.totalFiles + ' |');
  lines.push('| Artifacts | ' + report.summary.artifacts + ' |');
  lines.push('| Findings | ' + totalFindings(report) + ' |');
  lines.push('');
  lines.push('## Counts by kind');
  lines.push('');
  lines.push('| Kind | Count |');
  lines.push('| --- | ---: |');
  for (const [kind, count] of Object.entries(report.summary.byKind)) {
    if (count > 0) {
      lines.push('| ' + code(kind) + ' | ' + count + ' |');
    }
  }
  lines.push('');
  lines.push('## Findings');
  lines.push('');

  const artifactsWithFindings = report.artifacts.filter((artifact) => artifact.findings.length > 0);
  if (artifactsWithFindings.length === 0) {
    lines.push('No artifact findings.');
  } else {
    for (const artifact of sortBySeverity(artifactsWithFindings)) {
      lines.push('### ' + code(artifact.path));
      lines.push('');
      lines.push('- Kind: ' + code(artifact.kind));
      lines.push('- Size: ' + artifact.size + ' bytes');
      lines.push('- Tracked: ' + String(artifact.tracked));
      lines.push('- Ignored: ' + String(artifact.ignored));
      for (const finding of artifact.findings) {
        lines.push('- ' + finding.severity.toUpperCase() + ' ' + code(finding.code) + ': ' + finding.message);
        lines.push('  Suggestion: ' + finding.suggestion);
      }
      lines.push('');
    }
  }

  lines.push('## Artifact inventory');
  lines.push('');
  lines.push('| Path | Kind | Tracked | Ignored | Evidence |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const artifact of report.artifacts) {
    lines.push('| ' + code(artifact.path) + ' | ' + code(artifact.kind) + ' | ' + yesNo(artifact.tracked) + ' | ' + yesNo(artifact.ignored) + ' | ' + evidenceText(artifact) + ' |');
  }

  return lines.join('\n') + '\n';
}

function totalFindings(report: ScanReport): number {
  return report.artifacts.reduce((count, artifact) => count + artifact.findings.length, 0);
}

function sortBySeverity(artifacts: ArtifactRecord[]): ArtifactRecord[] {
  return [...artifacts].sort((left, right) => {
    const leftSeverity = Math.min(...left.findings.map((finding) => SEVERITY_ORDER.indexOf(finding.severity)));
    const rightSeverity = Math.min(...right.findings.map((finding) => SEVERITY_ORDER.indexOf(finding.severity)));
    return leftSeverity - rightSeverity || left.path.localeCompare(right.path, 'en');
  });
}

function yesNo(value: boolean): string {
  return value ? 'yes' : 'no';
}

function evidenceText(artifact: ArtifactRecord): string {
  if (artifact.evidence.length === 0) {
    return '';
  }
  return artifact.evidence.map((item) => item.rule + ': ' + escapeTable(item.detail)).join('<br>');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function code(value: string): string {
  return TICK + value + TICK;
}

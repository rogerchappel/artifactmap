import type { FailOn, ScanReport, Severity } from './types.js';

export function shouldFail(report: ScanReport, failOn: FailOn): boolean {
  if (failOn === 'none') {
    return false;
  }

  const severities = new Set<Severity>();
  for (const artifact of report.artifacts) {
    for (const finding of artifact.findings) {
      severities.add(finding.severity);
    }
  }

  if (failOn === 'suspicious' || failOn === 'warning') {
    return severities.has('warning') || severities.has('error');
  }

  return severities.has('error');
}

export function parseFailOn(value: string | undefined): FailOn {
  if (!value) {
    return 'none';
  }

  if (value === 'none' || value === 'warning' || value === 'error' || value === 'suspicious') {
    return value;
  }

  throw new Error('Unsupported fail-on value: ' + value);
}

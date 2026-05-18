export type ArtifactKind =
  | 'source-like'
  | 'generated-commit'
  | 'generated-ignore'
  | 'cache'
  | 'report'
  | 'package'
  | 'unknown';

export type Severity = 'info' | 'warning' | 'error';

export type FindingCode =
  | 'ignored-tracked'
  | 'untracked-package'
  | 'stale-report'
  | 'large-file'
  | 'source-in-generated'
  | 'unknown-artifact';

export type Finding = {
  code: FindingCode;
  severity: Severity;
  message: string;
  suggestion: string;
};

export type Evidence = {
  rule: string;
  detail: string;
};

export type ArtifactRecord = {
  path: string;
  kind: ArtifactKind;
  size: number;
  modifiedAt: string;
  tracked: boolean;
  ignored: boolean;
  evidence: Evidence[];
  findings: Finding[];
};

export type ArtifactSummary = {
  root: string;
  scannedAt: string;
  totalFiles: number;
  artifacts: number;
  byKind: Record<ArtifactKind, number>;
  bySeverity: Record<Severity, number>;
};

export type ScanReport = {
  summary: ArtifactSummary;
  artifacts: ArtifactRecord[];
  policy: ArtifactMapConfig;
};

export type ArtifactPolicyRule = {
  kind: ArtifactKind;
  patterns: string[];
  commit?: boolean;
  description?: string;
};

export type ArtifactMapConfig = {
  version: 1;
  largeFileBytes: number;
  staleReportDays: number;
  includeUnknown: boolean;
  rules: ArtifactPolicyRule[];
};

export type ScanOptions = {
  root: string;
  configPath?: string;
  respectIgnore?: boolean;
  includeUnknown?: boolean;
  now?: Date;
};

export type ScanFormat = 'markdown' | 'json';

export type FailOn = 'none' | 'warning' | 'error' | 'suspicious';

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createDefaultConfig } from './defaultConfig.js';
import type { ArtifactKind, ArtifactMapConfig, ArtifactPolicyRule } from './types.js';

export const CONFIG_FILE = 'artifactmap.config.json';

export async function loadConfig(root: string, configPath?: string): Promise<ArtifactMapConfig> {
  const candidate = configPath ? path.resolve(root, configPath) : path.join(root, CONFIG_FILE);

  try {
    const raw = await readFile(candidate, 'utf8');
    return mergeConfig(JSON.parse(raw) as unknown);
  } catch (error) {
    if (isNotFound(error)) {
      return createDefaultConfig();
    }

    throw error;
  }
}

export async function writeDefaultConfig(root: string, configPath = CONFIG_FILE): Promise<string> {
  const destination = path.resolve(root, configPath);
  await writeFile(destination, JSON.stringify(createDefaultConfig(), null, 2) + '\n', 'utf8');
  return destination;
}

export function mergeConfig(input: unknown): ArtifactMapConfig {
  assertConfigObject(input);
  const config = createDefaultConfig();

  if (input.version !== undefined && input.version !== 1) {
    invalid('version', 'expected the supported version 1');
  }

  validateThreshold(input.largeFileBytes, 'largeFileBytes');
  validateThreshold(input.staleReportDays, 'staleReportDays');

  validateBoolean(input.includeUnknown, 'includeUnknown');

  const rules = input.rules;
  if (rules !== undefined) {
    validateRules(rules);
  }

  return {
    version: 1,
    largeFileBytes: input.largeFileBytes ?? config.largeFileBytes,
    staleReportDays: input.staleReportDays ?? config.staleReportDays,
    includeUnknown: input.includeUnknown ?? config.includeUnknown,
    rules: rules ?? config.rules
  };
}

const ARTIFACT_KINDS = new Set<ArtifactKind>([
  'source-like',
  'generated-commit',
  'generated-ignore',
  'cache',
  'report',
  'package',
  'unknown'
]);

function assertConfigObject(input: unknown): asserts input is Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    invalid('config', 'expected a JSON object');
  }
}

function validateThreshold(
  value: unknown,
  field: 'largeFileBytes' | 'staleReportDays'
): asserts value is number | undefined {
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
    invalid(field, 'expected a finite, non-negative number');
  }
}

function validateBoolean(value: unknown, field: 'includeUnknown'): asserts value is boolean | undefined {
  if (value !== undefined && typeof value !== 'boolean') {
    invalid(field, 'expected a boolean');
  }
}

function validateRules(value: unknown): asserts value is ArtifactPolicyRule[] {
  if (!Array.isArray(value)) {
    invalid('rules', 'expected an array');
  }

  value.forEach((rule, index) => {
    const field = `rules[${index}]`;
    if (typeof rule !== 'object' || rule === null || Array.isArray(rule)) {
      invalid(field, 'expected an object');
    }

    const candidate = rule as Record<string, unknown>;
    if (typeof candidate.kind !== 'string' || !ARTIFACT_KINDS.has(candidate.kind as ArtifactKind)) {
      invalid(`${field}.kind`, `expected one of: ${[...ARTIFACT_KINDS].join(', ')}`);
    }

    if (!Array.isArray(candidate.patterns)) {
      invalid(`${field}.patterns`, 'expected an array of strings');
    }

    candidate.patterns.forEach((pattern, patternIndex) => {
      if (typeof pattern !== 'string') {
        invalid(`${field}.patterns[${patternIndex}]`, 'expected a string');
      }
    });
  });
}

function invalid(field: string, expectation: string): never {
  throw new Error(`Invalid configuration field "${field}": ${expectation}.`);
}

function isNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

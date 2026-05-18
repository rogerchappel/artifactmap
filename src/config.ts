import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createDefaultConfig } from './defaultConfig.js';
import type { ArtifactMapConfig } from './types.js';

export const CONFIG_FILE = 'artifactmap.config.json';

export async function loadConfig(root: string, configPath?: string): Promise<ArtifactMapConfig> {
  const candidate = configPath ? path.resolve(root, configPath) : path.join(root, CONFIG_FILE);

  try {
    const raw = await readFile(candidate, 'utf8');
    return mergeConfig(JSON.parse(raw) as Partial<ArtifactMapConfig>);
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

export function mergeConfig(input: Partial<ArtifactMapConfig>): ArtifactMapConfig {
  const config = createDefaultConfig();

  return {
    version: 1,
    largeFileBytes: input.largeFileBytes ?? config.largeFileBytes,
    staleReportDays: input.staleReportDays ?? config.staleReportDays,
    includeUnknown: input.includeUnknown ?? config.includeUnknown,
    rules: input.rules ?? config.rules
  };
}

function isNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

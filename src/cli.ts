#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Command } from 'commander';
import { writeDefaultConfig } from './config.js';
import { shouldFail, parseFailOn } from './gates.js';
import { renderJson, renderMarkdown } from './render/index.js';
import { scanWorkspace } from './scanner.js';
import type { ScanFormat } from './types.js';

const program = new Command();

program
  .name('artifactmap')
  .description('Inventory generated artifacts and repository hygiene evidence.')
  .version('0.1.0');

program
  .command('scan')
  .argument('[root]', 'Workspace root to scan', '.')
  .option('--out <path>', 'Write report to a file instead of stdout')
  .option('--format <markdown|json>', 'Report format', 'markdown')
  .option('--config <path>', 'Config path relative to the scan root')
  .option('--include-unknown', 'Include unknown files in the inventory')
  .option('--no-respect-ignore', 'Scan ignored files too')
  .option('--fail-on <none|warning|error|suspicious>', 'Exit non-zero when matching findings exist', 'none')
  .action(async (root: string, options: ScanOptions) => {
    try {
      const resolvedRoot = path.resolve(root);
      const format = parseFormat(options.format);
      const report = await scanWorkspace({
        root: resolvedRoot,
        configPath: options.config,
        respectIgnore: options.respectIgnore,
        includeUnknown: options.includeUnknown
      });
      const rendered = format === 'json' ? renderJson(report) : renderMarkdown(report);

      if (options.out) {
        const outputPath = path.resolve(resolvedRoot, options.out);
        await mkdir(path.dirname(outputPath), { recursive: true });
        await writeFile(outputPath, rendered, 'utf8');
      } else {
        process.stdout.write(rendered);
      }

      const failOn = parseFailOn(options.failOn);
      if (shouldFail(report, failOn)) {
        process.exitCode = 2;
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command('init')
  .option('--preset <node-cli>', 'Policy preset to write', 'node-cli')
  .option('--out <path>', 'Config file path', 'artifactmap.config.json')
  .action(async (options: InitOptions) => {
    try {
      if (options.preset !== 'node-cli') {
        throw new Error('Unsupported preset: ' + options.preset);
      }
      const destination = await writeDefaultConfig(process.cwd(), options.out);
      console.log('Wrote ' + path.relative(process.cwd(), destination));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program.parse();

type ScanOptions = {
  out?: string;
  format?: string;
  config?: string;
  respectIgnore?: boolean;
  includeUnknown?: boolean;
  failOn?: string;
};

type InitOptions = {
  preset?: string;
  out?: string;
};

function parseFormat(value: string | undefined): ScanFormat {
  if (value === 'markdown' || value === 'json') {
    return value;
  }

  throw new Error('Unsupported format: ' + value);
}

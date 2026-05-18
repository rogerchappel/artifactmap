export function matchesPattern(filePath: string, pattern: string): boolean {
  const expression = '^' + escapePattern(pattern)
    .replace(/\\\*\\\*\\\//g, '(?:.*\\/)?')
    .replace(/\\\*\\\*/g, '.*')
    .replace(/\\\*/g, '[^/]*') + '$';
  return new RegExp(expression).test(filePath);
}

export function matchesAny(filePath: string, patterns: string[]): string | undefined {
  return patterns.find((pattern) => matchesPattern(filePath, pattern));
}

function escapePattern(pattern: string): string {
  return pattern.replace(/[.+?^\${}()|[\]\\]/g, '\\$&');
}

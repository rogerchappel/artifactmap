export function matchesPattern(filePath: string, pattern: string): boolean {
  const expression = '^' + globToRegex(pattern) + '$';
  return new RegExp(expression).test(filePath);
}

export function matchesAny(filePath: string, patterns: string[]): string | undefined {
  return patterns.find((pattern) => matchesPattern(filePath, pattern));
}

function globToRegex(pattern: string): string {
  let expression = '';

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    const next = pattern[index + 1];

    if (character === '*' && next === '*') {
      if (pattern[index + 2] === '/') {
        expression += '(?:.*\\/)?';
        index += 2;
      } else {
        expression += '.*';
        index += 1;
      }
      continue;
    }

    if (character === '*') {
      expression += '[^/]*';
      continue;
    }

    expression += escapeRegex(character);
  }

  return expression;
}

function escapeRegex(value: string): string {
  return '.+?^$()|[]{}'.includes(value) || value === '\\' ? '\\' + value : value;
}

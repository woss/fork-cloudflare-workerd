// Copyright (c) 2017-2022 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

// Splits a string by top-level occurrences of a separator character,
// respecting nested braces and backslash escapes.
function splitTopLevel(str: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < str.length; i++) {
    const c = str[i]!;
    if (c === '\\' && i + 1 < str.length) {
      current += c + str[i + 1]!;
      i++;
      continue;
    }
    if (c === '{') {
      depth++;
      current += c;
    } else if (c === '}') {
      depth--;
      current += c;
    } else if (c === sep && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += c;
    }
  }

  parts.push(current);
  return parts;
}

// Expands brace expressions in a glob pattern into multiple patterns.
// e.g. "*.{js,ts}" -> ["*.js", "*.ts"]
// e.g. "{a,b}/{c,d}" -> ["a/c", "a/d", "b/c", "b/d"]
export function expandBraces(pattern: string): string[] {
  // Find the first top-level { } pair
  let depth = 0;
  let braceStart = -1;

  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!;
    if (c === '\\' && i + 1 < pattern.length) {
      i++;
      continue;
    }
    if (c === '{') {
      if (depth === 0) braceStart = i;
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0 && braceStart !== -1) {
        const prefix = pattern.slice(0, braceStart);
        const body = pattern.slice(braceStart + 1, i);
        const suffix = pattern.slice(i + 1);

        const alternatives = splitTopLevel(body, ',');

        // If there's only one alternative (no comma found), treat braces as literal
        if (alternatives.length === 1) {
          return [pattern];
        }

        const results: string[] = [];
        for (const alt of alternatives) {
          for (const expanded of expandBraces(prefix + alt + suffix)) {
            results.push(expanded);
          }
        }
        return results;
      }
    }
  }

  return [pattern];
}

// Converts a single glob pattern into a RegExp.
//
// Supported syntax:
//   *      - matches any characters except /
//   **     - matches zero or more path segments
//   ?      - matches a single character except /
//   [abc]  - character class
//   [!abc] - negated character class
//   \x     - escape (literal match of x)
export function globToRegex(pattern: string): RegExp {
  let regex = '';
  let i = 0;
  let inCharClass = false;

  while (i < pattern.length) {
    const c = pattern[i]!;

    // Handle escape sequences
    if (c === '\\' && i + 1 < pattern.length) {
      regex += '\\' + escapeRegexChar(pattern[i + 1]!);
      i += 2;
      continue;
    }

    // Inside character classes, most chars are literal
    if (inCharClass) {
      if (c === ']') {
        regex += ']';
        inCharClass = false;
      } else {
        regex += c;
      }
      i++;
      continue;
    }

    switch (c) {
      case '[':
        inCharClass = true;
        regex += '[';
        // Handle [! as [^ (glob negation syntax)
        if (i + 1 < pattern.length && pattern[i + 1] === '!') {
          regex += '^';
          i++;
        }
        break;

      case '*':
        if (i + 1 < pattern.length && pattern[i + 1] === '*') {
          // ** (globstar)
          i++; // consume second *
          const atStart = i === 1; // pattern started with **
          const atEnd = i + 1 >= pattern.length;
          const followedBySlash =
            i + 1 < pattern.length && pattern[i + 1] === '/';
          const precededBySlash = i >= 2 && pattern[i - 2] === '/';

          if (atEnd) {
            // ** at end: match everything remaining
            regex += '.*';
          } else if ((atStart || precededBySlash) && followedBySlash) {
            // **/ at start or /**/  in middle: zero or more directory segments
            regex += '(?:[^/]+/)*';
            i++; // consume the /
          } else if (atStart && !followedBySlash) {
            // **foo at start (no slash after): match any prefix path then continue
            regex += '(?:.*/)?';
          } else {
            // Treat as two * wildcards
            regex += '[^/]*[^/]*';
          }
        } else {
          // Single *: match within a single path segment
          regex += '[^/]*';
        }
        break;

      case '?':
        regex += '[^/]';
        break;

      case '.':
      case '+':
      case '^':
      case '$':
      case '|':
      case '(':
      case ')':
        regex += '\\' + c;
        break;

      default:
        regex += c;
        break;
    }
    i++;
  }

  return new RegExp('^' + regex + '$');
}

function escapeRegexChar(c: string): string {
  if ('.+*?^$|()[]{}\\'.includes(c)) {
    return '\\' + c;
  }
  return c;
}

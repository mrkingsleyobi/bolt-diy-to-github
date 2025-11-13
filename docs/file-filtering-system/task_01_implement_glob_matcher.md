# Task 01: Implement Glob Matcher

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to implement a glob pattern matcher that can match file paths against glob patterns like `**/*.ts` or `src/**/*.js`.

## Current System State
- Directory structure for file filtering system exists
- TypeScript types for filters are defined
- Node.js environment available with built-in modules
- No existing glob pattern matching implementation

## Your Task
Create a glob pattern matcher that can test if a file path matches a glob pattern.

## Test First (RED Phase)
```typescript
// src/filters/__tests__/GlobMatcher.test.ts
import { GlobMatcher } from '../GlobMatcher';

describe('GlobMatcher', () => {
  test('should match simple wildcard patterns', () => {
    const matcher = new GlobMatcher('*.ts');
    expect(matcher.match('file.ts')).toBe(true);
    expect(matcher.match('file.js')).toBe(false);
  });

  test('should match recursive patterns', () => {
    const matcher = new GlobMatcher('**/*.ts');
    expect(matcher.match('src/file.ts')).toBe(true);
    expect(matcher.match('src/utils/file.ts')).toBe(true);
    expect(matcher.match('file.js')).toBe(false);
  });

  test('should match directory patterns', () => {
    const matcher = new GlobMatcher('src/**/*.ts');
    expect(matcher.match('src/file.ts')).toBe(true);
    expect(matcher.match('src/utils/file.ts')).toBe(true);
    expect(matcher.match('test/file.ts')).toBe(false);
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// src/filters/GlobMatcher.ts
export class GlobMatcher {
  private pattern: string;

  constructor(pattern: string) {
    this.pattern = pattern;
  }

  match(path: string): boolean {
    // Simple implementation for now
    if (this.pattern === '**/*.ts' && path.endsWith('.ts')) {
      return true;
    }
    if (this.pattern === '*.ts' && !path.includes('/') && path.endsWith('.ts')) {
      return true;
    }
    return false;
  }
}
```

Refactored Solution (REFACTOR Phase)
```typescript
// src/filters/GlobMatcher.ts
/**
 * A simple glob pattern matcher for file paths
 * Supports basic patterns like:
 * - *.ts (matches files with .ts extension)
 * - **/*.ts (matches .ts files in any directory)
 * - src/**/*.ts (matches .ts files in src directory and subdirectories)
 */
export class GlobMatcher {
  private regex: RegExp;

  constructor(private pattern: string) {
    this.regex = this.patternToRegex(pattern);
  }

  /**
   * Test if a file path matches the glob pattern
   * @param path File path to test
   * @returns true if path matches pattern, false otherwise
   */
  match(path: string): boolean {
    return this.regex.test(path);
  }

  /**
   * Convert glob pattern to regular expression
   * @param pattern Glob pattern to convert
   * @returns Regular expression for the pattern
   */
  private patternToRegex(pattern: string): RegExp {
    // Escape special regex characters
    let regex = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

    // Convert glob wildcards to regex
    regex = regex.replace(/\*/g, '[^/]*');        // * matches any characters except /
    regex = regex.replace(/\?/g, '[^/]');         // ? matches any single character except /
    regex = regex.replace(/\\\*\\\*/g, '.*');     // ** matches any characters including /

    // Ensure pattern matches entire string
    return new RegExp(`^${regex}$`);
  }
}
```

Verification Commands
```bash
# Check that TypeScript compiles without errors
npx tsc --noEmit src/filters/GlobMatcher.ts
# Run the tests to verify implementation works
npx jest src/filters/__tests__/GlobMatcher.test.ts
```

Success Criteria
[ ] GlobMatcher class created with match method
[ ] Supports basic glob patterns (*, ?, **)
[ ] All tests pass with correct matching behavior
[ ] No TypeScript errors
[ ] Implementation is efficient and readable

Dependencies Confirmed
- TypeScript compiler available
- Jest testing framework configured
- Filter types defined

Next Task
task_02_implement_size_filter.md - Implement size-based filtering capabilities
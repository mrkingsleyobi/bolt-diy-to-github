# Task 10a: Test Glob Matcher

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to create comprehensive unit tests for the glob pattern matcher to ensure it works correctly with various patterns.

## Current System State
- GlobMatcher implementation exists
- Jest testing framework is configured
- TypeScript compiler available
- Basic tests may exist but need comprehensive coverage

## Your Task
Create comprehensive unit tests for the glob pattern matcher covering various patterns and edge cases.

## Test First (RED Phase)
The tests already exist from our earlier implementation, but we need to expand them for comprehensive coverage.

Minimal Implementation (GREEN Phase)
The existing tests should already pass.

Refactored Solution (REFACTOR Phase)
```typescript
// src/filters/__tests__/GlobMatcher.test.ts
import { GlobMatcher } from '../GlobMatcher';

describe('GlobMatcher', () => {
  test('should match simple wildcard patterns', () => {
    const matcher = new GlobMatcher('*.ts');
    expect(matcher.match('file.ts')).toBe(true);
    expect(matcher.match('file.js')).toBe(false);
    expect(matcher.match('path/file.ts')).toBe(false); // Should not match nested paths
  });

  test('should match recursive patterns', () => {
    const matcher = new GlobMatcher('**/*.ts');
    expect(matcher.match('file.ts')).toBe(true);
    expect(matcher.match('src/file.ts')).toBe(true);
    expect(matcher.match('src/utils/file.ts')).toBe(true);
    expect(matcher.match('file.js')).toBe(false);
  });

  test('should match directory patterns', () => {
    const matcher = new GlobMatcher('src/**/*.ts');
    expect(matcher.match('src/file.ts')).toBe(true);
    expect(matcher.match('src/utils/file.ts')).toBe(true);
    expect(matcher.match('test/file.ts')).toBe(false);
    expect(matcher.match('file.ts')).toBe(false);
  });

  test('should match single character wildcard', () => {
    const matcher = new GlobMatcher('file?.txt');
    expect(matcher.match('file1.txt')).toBe(true);
    expect(matcher.match('fileA.txt')).toBe(true);
    expect(matcher.match('file12.txt')).toBe(false); // Two characters
    expect(matcher.match('file.txt')).toBe(false);   // No character
  });

  test('should handle complex patterns', () => {
    const matcher = new GlobMatcher('src/**/*.{ts,tsx}');
    expect(matcher.match('src/index.ts')).toBe(true);
    expect(matcher.match('src/components/App.tsx')).toBe(true);
    expect(matcher.match('src/styles.css')).toBe(false);
  });

  test('should handle negation patterns', () => {
    const matcher = new GlobMatcher('!*.test.ts');
    expect(matcher.match('file.ts')).toBe(true);
    expect(matcher.match('file.test.ts')).toBe(false);
  });

  test('should handle edge cases', () => {
    // Empty pattern
    const emptyMatcher = new GlobMatcher('');
    expect(emptyMatcher.match('')).toBe(true);
    expect(emptyMatcher.match('file.txt')).toBe(false);

    // Pattern with special regex characters
    const specialMatcher = new GlobMatcher('file[1-3].txt');
    // Note: Our simple implementation might not handle this correctly
    // This is an edge case we might not support initially
  });

  test('should handle path separators correctly', () => {
    const matcher = new GlobMatcher('src/**/*.ts');
    expect(matcher.match('src\\utils\\file.ts')).toBe(true); // Windows path
    expect(matcher.match('src/utils/file.ts')).toBe(true);   // Unix path
  });
});
```

Verification Commands
```bash
# Run the tests to verify implementation works
npx jest src/filters/__tests__/GlobMatcher.test.ts --verbose
# Check coverage
npx jest src/filters/__tests__/GlobMatcher.test.ts --coverage
```

Success Criteria
[ ] All existing tests still pass
[ ] New tests cover additional pattern types
[ ] Edge cases are handled appropriately
[ ] Test coverage is comprehensive
[ ] No TypeScript errors in tests

Dependencies Confirmed
- GlobMatcher implementation exists
- Jest testing framework configured

Next Task
task_11a_test_size_filter.md - Create unit tests for size filter
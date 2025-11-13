# Task 12a: Test Content Type Filter

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to create comprehensive unit tests for the content-type filter to ensure it works correctly with various MIME types.

## Current System State
- ContentTypeFilter implementation exists
- Jest testing framework is configured
- TypeScript compiler available
- Basic tests may exist but need comprehensive coverage

## Your Task
Create comprehensive unit tests for the content-type filter covering various MIME types and edge cases.

## Test First (RED Phase)
The tests already exist from our earlier implementation, but we need to expand them for comprehensive coverage.

Minimal Implementation (GREEN Phase)
The existing tests should already pass.

Refactored Solution (REFACTOR Phase)
```typescript
// src/filters/__tests__/ContentTypeFilter.test.ts
import { ContentTypeFilter } from '../ContentTypeFilter';

describe('ContentTypeFilter', () => {
  test('should allow files with allowed content types', () => {
    const filter = new ContentTypeFilter({ contentTypes: ['text/plain', 'application/json'] });
    const result = filter.apply({ path: 'file.txt', size: 100, contentType: 'text/plain' });
    expect(result).toBe(true);
  });

  test('should exclude files with disallowed content types', () => {
    const filter = new ContentTypeFilter({ contentTypes: ['text/plain', 'application/json'] });
    const result = filter.apply({ path: 'file.exe', size: 100, contentType: 'application/octet-stream' });
    expect(result).toBe(false);
    expect(filter.getReason()).toBe('Content type application/octet-stream not in allowed list: text/plain,application/json');
  });

  test('should allow all files when no content types specified', () => {
    const filter = new ContentTypeFilter({});
    const result = filter.apply({ path: 'file.txt', size: 100, contentType: 'text/plain' });
    expect(result).toBe(true);
  });

  test('should handle empty content types array', () => {
    const filter = new ContentTypeFilter({ contentTypes: [] });
    const result = filter.apply({ path: 'file.txt', size: 100, contentType: 'text/plain' });
    expect(result).toBe(false);
    expect(filter.getReason()).toBe('No content types allowed');
  });

  test('should handle common text content types', () => {
    const filter = new ContentTypeFilter({
      contentTypes: ['text/plain', 'text/html', 'text/css', 'text/javascript']
    });

    expect(filter.apply({ path: 'readme.txt', size: 100, contentType: 'text/plain' })).toBe(true);
    expect(filter.apply({ path: 'index.html', size: 200, contentType: 'text/html' })).toBe(true);
    expect(filter.apply({ path: 'style.css', size: 150, contentType: 'text/css' })).toBe(true);
    expect(filter.apply({ path: 'script.js', size: 300, contentType: 'text/javascript' })).toBe(true);
    expect(filter.apply({ path: 'image.png', size: 500, contentType: 'image/png' })).toBe(false);
  });

  test('should handle common binary content types', () => {
    const filter = new ContentTypeFilter({
      contentTypes: ['image/png', 'image/jpeg', 'application/pdf', 'application/zip']
    });

    expect(filter.apply({ path: 'image.png', size: 1000, contentType: 'image/png' })).toBe(true);
    expect(filter.apply({ path: 'photo.jpg', size: 2000, contentType: 'image/jpeg' })).toBe(true);
    expect(filter.apply({ path: 'document.pdf', size: 3000, contentType: 'application/pdf' })).toBe(true);
    expect(filter.apply({ path: 'archive.zip', size: 4000, contentType: 'application/zip' })).toBe(true);
    expect(filter.apply({ path: 'text.txt', size: 100, contentType: 'text/plain' })).toBe(false);
  });

  test('should handle case sensitivity', () => {
    const filter = new ContentTypeFilter({ contentTypes: ['text/plain'] });

    // Should match exactly
    expect(filter.apply({ path: 'file.txt', size: 100, contentType: 'text/plain' })).toBe(true);

    // Should not match different case (MIME types are case-sensitive)
    expect(filter.apply({ path: 'file.txt', size: 100, contentType: 'TEXT/PLAIN' })).toBe(false);
    expect(filter.apply({ path: 'file.txt', size: 100, contentType: 'Text/Plain' })).toBe(false);
  });

  test('should handle wildcard content types', () => {
    const filter = new ContentTypeFilter({ contentTypes: ['text/*'] });

    expect(filter.apply({ path: 'file.txt', size: 100, contentType: 'text/plain' })).toBe(true);
    expect(filter.apply({ path: 'doc.html', size: 200, contentType: 'text/html' })).toBe(true);
    expect(filter.apply({ path: 'style.css', size: 150, contentType: 'text/css' })).toBe(true);
    expect(filter.apply({ path: 'image.png', size: 500, contentType: 'image/png' })).toBe(false);
  });

  test('should handle complex content type scenarios', () => {
    const filter = new ContentTypeFilter({
      contentTypes: ['text/*', 'application/json', 'image/png']
    });

    expect(filter.apply({ path: 'readme.txt', size: 100, contentType: 'text/plain' })).toBe(true);
    expect(filter.apply({ path: 'data.json', size: 200, contentType: 'application/json' })).toBe(true);
    expect(filter.apply({ path: 'image.png', size: 300, contentType: 'image/png' })).toBe(true);
    expect(filter.apply({ path: 'image.jpg', size: 400, contentType: 'image/jpeg' })).toBe(false);
    expect(filter.apply({ path: 'doc.pdf', size: 500, contentType: 'application/pdf' })).toBe(false);
  });

  test('should provide correct reasons for exclusion', () => {
    const filter = new ContentTypeFilter({ contentTypes: ['text/plain', 'application/json'] });

    filter.apply({ path: 'file.exe', size: 100, contentType: 'application/octet-stream' });
    expect(filter.getReason()).toBe('Content type application/octet-stream not in allowed list: text/plain,application/json');

    const emptyFilter = new ContentTypeFilter({ contentTypes: [] });
    emptyFilter.apply({ path: 'file.txt', size: 100, contentType: 'text/plain' });
    expect(emptyFilter.getReason()).toBe('No content types allowed');
  });

  test('should reset reason on each application', () => {
    const filter = new ContentTypeFilter({ contentTypes: ['text/plain'] });

    // First application - should be excluded
    filter.apply({ path: 'file.exe', size: 100, contentType: 'application/octet-stream' });
    expect(filter.getReason()).not.toBe('');

    // Second application - should be included (no reason)
    filter.apply({ path: 'text.txt', size: 100, contentType: 'text/plain' });
    expect(filter.getReason()).toBe('');
  });
});
```

Verification Commands
```bash
# Run the tests to verify implementation works
npx jest src/filters/__tests__/ContentTypeFilter.test.ts --verbose
# Check coverage
npx jest src/filters/__tests__/ContentTypeFilter.test.ts --coverage
```

Success Criteria
[ ] All existing tests still pass
[ ] New tests cover common content types
[ ] Edge cases like wildcards and case sensitivity are handled
[ ] Complex content type scenarios work correctly
[ ] Reasons are provided correctly and reset appropriately
[ ] Test coverage is comprehensive
[ ] No TypeScript errors in tests

Dependencies Confirmed
- ContentTypeFilter implementation exists
- Jest testing framework configured

Next Task
task_13a_test_config_parser.md - Create unit tests for configuration parser
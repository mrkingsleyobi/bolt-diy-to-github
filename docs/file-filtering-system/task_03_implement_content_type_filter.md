# Task 03: Implement Content Type Filter

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to implement a content-type filter that can include/exclude files based on their MIME type.

## Current System State
- Directory structure for file filtering system exists
- TypeScript types for filters are defined
- GlobMatcher and SizeFilter implementations are complete
- Node.js environment available with built-in modules

## Your Task
Create a content-type filter that can test if a file's MIME type is in an allowed list.

## Test First (RED Phase)
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
});
```

Minimal Implementation (GREEN Phase)
```typescript
// src/filters/ContentTypeFilter.ts
import { Filter, FileMetadata } from '../types/filters';

interface ContentTypeFilterConfig {
  contentTypes?: string[];
}

export class ContentTypeFilter implements Filter {
  private contentTypes?: string[];
  private reason: string = '';

  constructor(config: ContentTypeFilterConfig) {
    this.contentTypes = config.contentTypes;
  }

  apply(file: FileMetadata): boolean {
    if (!this.contentTypes || this.contentTypes.length === 0) {
      if (this.contentTypes && this.contentTypes.length === 0) {
        this.reason = 'No content types allowed';
        return false;
      }
      return true;
    }

    if (this.contentTypes.includes(file.contentType)) {
      return true;
    }

    this.reason = `Content type ${file.contentType} not in allowed list: ${this.contentTypes.join(',')}`;
    return false;
  }

  getReason(): string {
    return this.reason;
  }
}
```

Refactored Solution (REFACTOR Phase)
```typescript
// src/filters/ContentTypeFilter.ts
import { Filter, FileMetadata } from '../types/filters';
import { FilterConfig } from '../types/filters';

/**
 * Content type-based file filter
 * Excludes files that don't match allowed MIME types
 */
export class ContentTypeFilter implements Filter {
  private contentTypes?: string[];
  private reason: string = '';

  /**
   * Create a new content type filter
   * @param config Filter configuration with contentTypes option
   */
  constructor(config: Pick<FilterConfig, 'contentTypes'>) {
    this.contentTypes = config.contentTypes;
  }

  /**
   * Apply content type filter to a file
   * @param file File metadata to filter
   * @returns true if file passes content type filter, false otherwise
   */
  apply(file: FileMetadata): boolean {
    // Reset reason for each application
    this.reason = '';

    // If no content types specified, allow all files
    if (!this.contentTypes) {
      return true;
    }

    // If empty content types array, exclude all files
    if (this.contentTypes.length === 0) {
      this.reason = 'No content types allowed';
      return false;
    }

    // Check if file's content type is in allowed list
    if (this.contentTypes.includes(file.contentType)) {
      return true;
    }

    this.reason = `Content type ${file.contentType} not in allowed list: ${this.contentTypes.join(',')}`;
    return false;
  }

  /**
   * Get reason for filter exclusion
   * @returns Reason string explaining why file was excluded
   */
  getReason(): string {
    return this.reason;
  }
}
```

Verification Commands
```bash
# Check that TypeScript compiles without errors
npx tsc --noEmit src/filters/ContentTypeFilter.ts
# Run the tests to verify implementation works
npx jest src/filters/__tests__/ContentTypeFilter.test.ts
```

Success Criteria
[ ] ContentTypeFilter class implements Filter interface
[ ] Correctly filters files based on allowed content types
[ ] Provides clear exclusion reasons
[ ] All tests pass with correct behavior
[ ] No TypeScript errors
[ ] Implementation is efficient and readable

Dependencies Confirmed
- TypeScript compiler available
- Jest testing framework configured
- Filter types defined
- GlobMatcher and SizeFilter implementations complete

Next Task
task_04_create_config_parser.md - Create configuration parsing module
# Task 02: Implement Size Filter

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to implement a size-based filter that can include/exclude files based on their size.

## Current System State
- Directory structure for file filtering system exists
- TypeScript types for filters are defined
- GlobMatcher implementation is complete
- Node.js environment available with built-in modules

## Your Task
Create a size-based filter that can test if a file's size is within specified bounds.

## Test First (RED Phase)
```typescript
// src/filters/__tests__/SizeFilter.test.ts
import { SizeFilter } from '../SizeFilter';

describe('SizeFilter', () => {
  test('should allow files within size bounds', () => {
    const filter = new SizeFilter({ minSize: 100, maxSize: 1000 });
    const result = filter.apply({ path: 'file.txt', size: 500, contentType: 'text/plain' });
    expect(result).toBe(true);
  });

  test('should exclude files below minimum size', () => {
    const filter = new SizeFilter({ minSize: 100 });
    const result = filter.apply({ path: 'file.txt', size: 50, contentType: 'text/plain' });
    expect(result).toBe(false);
    expect(filter.getReason()).toBe('File size 50 bytes is below minimum 100 bytes');
  });

  test('should exclude files above maximum size', () => {
    const filter = new SizeFilter({ maxSize: 1000 });
    const result = filter.apply({ path: 'file.txt', size: 1500, contentType: 'text/plain' });
    expect(result).toBe(false);
    expect(filter.getReason()).toBe('File size 1500 bytes is above maximum 1000 bytes');
  });

  test('should allow all files when no size limits specified', () => {
    const filter = new SizeFilter({});
    const result = filter.apply({ path: 'file.txt', size: 500, contentType: 'text/plain' });
    expect(result).toBe(true);
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// src/filters/SizeFilter.ts
import { Filter, FileMetadata } from '../types/filters';

interface SizeFilterConfig {
  minSize?: number;
  maxSize?: number;
}

export class SizeFilter implements Filter {
  private minSize?: number;
  private maxSize?: number;
  private reason: string = '';

  constructor(config: SizeFilterConfig) {
    this.minSize = config.minSize;
    this.maxSize = config.maxSize;
  }

  apply(file: FileMetadata): boolean {
    if (this.minSize !== undefined && file.size < this.minSize) {
      this.reason = `File size ${file.size} bytes is below minimum ${this.minSize} bytes`;
      return false;
    }

    if (this.maxSize !== undefined && file.size > this.maxSize) {
      this.reason = `File size ${file.size} bytes is above maximum ${this.maxSize} bytes`;
      return false;
    }

    return true;
  }

  getReason(): string {
    return this.reason;
  }
}
```

Refactored Solution (REFACTOR Phase)
```typescript
// src/filters/SizeFilter.ts
import { Filter, FileMetadata } from '../types/filters';
import { FilterConfig } from '../types/filters';

/**
 * Size-based file filter
 * Excludes files that are too large or too small
 */
export class SizeFilter implements Filter {
  private minSize?: number;
  private maxSize?: number;
  private reason: string = '';

  /**
   * Create a new size filter
   * @param config Filter configuration with minSize and maxSize options
   */
  constructor(config: Pick<FilterConfig, 'minSize' | 'maxSize'>) {
    this.minSize = config.minSize;
    this.maxSize = config.maxSize;
  }

  /**
   * Apply size filter to a file
   * @param file File metadata to filter
   * @returns true if file passes size filter, false otherwise
   */
  apply(file: FileMetadata): boolean {
    // Reset reason for each application
    this.reason = '';

    // Check minimum size
    if (this.minSize !== undefined && file.size < this.minSize) {
      this.reason = `File size ${file.size} bytes is below minimum ${this.minSize} bytes`;
      return false;
    }

    // Check maximum size
    if (this.maxSize !== undefined && file.size > this.maxSize) {
      this.reason = `File size ${file.size} bytes is above maximum ${this.maxSize} bytes`;
      return false;
    }

    return true;
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
npx tsc --noEmit src/filters/SizeFilter.ts
# Run the tests to verify implementation works
npx jest src/filters/__tests__/SizeFilter.test.ts
```

Success Criteria
[ ] SizeFilter class implements Filter interface
[ ] Correctly filters files based on minSize and maxSize
[ ] Provides clear exclusion reasons
[ ] All tests pass with correct behavior
[ ] No TypeScript errors
[ ] Implementation is efficient and readable

Dependencies Confirmed
- TypeScript compiler available
- Jest testing framework configured
- Filter types defined
- GlobMatcher implementation complete

Next Task
task_03_implement_content_type_filter.md - Implement content-type filtering functionality
# Task 00b: Create Types File

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to define the TypeScript interfaces for our file filtering system before implementing the functionality.

## Current System State
- Directory structure for file filtering system exists
- TypeScript compiler is available
- Existing project uses type definitions in src/types/
- No existing filter types present

## Your Task
Create the TypeScript interfaces and types for the file filtering system configuration and results.

## Test First (RED Phase)
```typescript
// src/types/filters.test.ts
import type { FilterConfig, FilterResult, FileMetadata } from '../types/filters';

describe('Filter Types', () => {
  test('should compile with FilterConfig interface', () => {
    const config: FilterConfig = {
      include: ['**/*.ts'],
      exclude: ['**/node_modules/**'],
      maxSize: 1024 * 1024, // 1MB
      minSize: 0,
      contentTypes: ['text/plain', 'application/json']
    };

    expect(config.include).toBeInstanceOf(Array);
  });

  test('should compile with FilterResult interface', () => {
    const result: FilterResult = {
      included: ['/path/to/file.ts'],
      excluded: ['/path/to/excluded.ts'],
      reasons: {
        '/path/to/excluded.ts': 'matched exclude pattern'
      }
    };

    expect(result.included).toBeInstanceOf(Array);
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// src/types/filters.ts
export interface FilterConfig {
  include?: string[];
  exclude?: string[];
  maxSize?: number;
  minSize?: number;
  contentTypes?: string[];
}

export interface FilterResult {
  included: string[];
  excluded: string[];
  reasons: Record<string, string>;
}

export interface FileMetadata {
  path: string;
  size: number;
  contentType: string;
}
```

Refactored Solution (REFACTOR Phase)
```typescript
// src/types/filters.ts
/**
 * Configuration options for file filtering
 */
export interface FilterConfig {
  /**
   * Glob patterns to include files
   * @default []
   */
  include?: string[];

  /**
   * Glob patterns to exclude files
   * @default []
   */
  exclude?: string[];

  /**
   * Maximum file size in bytes
   * @default undefined (no limit)
   */
  maxSize?: number;

  /**
   * Minimum file size in bytes
   * @default undefined (no limit)
   */
  minSize?: number;

  /**
   * Allowed content types (MIME types)
   * @default [] (all types allowed)
   */
  contentTypes?: string[];
}

/**
 * Result of file filtering operation
 */
export interface FilterResult {
  /** Paths of files that passed all filters */
  included: string[];

  /** Paths of files that were excluded */
  excluded: string[];

  /** Reasons why files were excluded */
  reasons: Record<string, string>;
}

/**
 * Metadata about a file for filtering
 */
export interface FileMetadata {
  /** File path */
  path: string;

  /** File size in bytes */
  size: number;

  /** Content type (MIME type) */
  contentType: string;
}

/**
 * Interface for filter implementations
 */
export interface Filter {
  /**
   * Apply filter to a file
   * @param file File metadata to filter
   * @returns true if file passes filter, false otherwise
   */
  apply(file: FileMetadata): boolean;

  /**
   * Get reason for filter exclusion
   * @returns Reason string
   */
  getReason(): string;
}
```

Verification Commands
```bash
# Check that TypeScript compiles without errors
npx tsc --noEmit src/types/filters.ts
# Run the test to verify types work correctly
npx jest src/types/filters.test.ts
```

Success Criteria
[ ] Type definitions created and exported
[ ] All interfaces properly documented
[ ] Test compiles and passes
[ ] No TypeScript errors
[ ] Follows existing project patterns

Dependencies Confirmed
- TypeScript compiler available
- Jest testing framework configured
- Directory structure in place

Next Task
task_01_implement_glob_matcher.md - Implement glob pattern matching functionality
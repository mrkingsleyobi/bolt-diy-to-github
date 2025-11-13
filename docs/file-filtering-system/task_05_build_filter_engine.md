# Task 05: Build Filter Engine

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to build the main filter engine that orchestrates all the filters and applies them to files.

## Current System State
- Directory structure for file filtering system exists
- TypeScript types for filters are defined
- All individual filter implementations are complete
- Configuration parser is implemented
- Node.js environment available with built-in modules (fs, path)

## Your Task
Create the main filter engine that can apply all configured filters to a list of files.

## Test First (RED Phase)
```typescript
// src/filters/__tests__/FilterEngine.test.ts
import { FilterEngine } from '../FilterEngine';
import { FilterConfig, FileMetadata } from '../../types/filters';

describe('FilterEngine', () => {
  test('should filter files according to configuration', async () => {
    const config: FilterConfig = {
      include: ['**/*.ts'],
      exclude: ['**/*.test.ts'],
      maxSize: 1000,
      contentTypes: ['text/plain']
    };

    const files: FileMetadata[] = [
      { path: 'src/index.ts', size: 500, contentType: 'text/plain' },
      { path: 'src/index.test.ts', size: 300, contentType: 'text/plain' },
      { path: 'README.md', size: 100, contentType: 'text/markdown' },
      { path: 'large.ts', size: 1500, contentType: 'text/plain' }
    ];

    const engine = new FilterEngine();
    const result = await engine.filter(config, files);

    expect(result.included).toContain('src/index.ts');
    expect(result.excluded).toContain('src/index.test.ts');
    expect(result.excluded).toContain('README.md');
    expect(result.excluded).toContain('large.ts');
  });

  test('should handle empty file list', async () => {
    const config: FilterConfig = {};
    const files: FileMetadata[] = [];

    const engine = new FilterEngine();
    const result = await engine.filter(config, files);

    expect(result.included).toHaveLength(0);
    expect(result.excluded).toHaveLength(0);
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// src/filters/FilterEngine.ts
import { FilterConfig, FilterResult, FileMetadata } from '../types/filters';
import { ConfigParser } from './ConfigParser';

export class FilterEngine {
  async filter(config: FilterConfig, files: FileMetadata[]): Promise<FilterResult> {
    const parser = new ConfigParser();
    const filters = parser.parse(config);

    const included: string[] = [];
    const excluded: string[] = [];
    const reasons: Record<string, string> = {};

    for (const file of files) {
      let includedFile = true;
      let excludeReason = '';

      for (const filter of filters) {
        if (!filter.apply(file)) {
          includedFile = false;
          excludeReason = filter.getReason();
          break;
        }
      }

      if (includedFile) {
        included.push(file.path);
      } else {
        excluded.push(file.path);
        reasons[file.path] = excludeReason;
      }
    }

    return { included, excluded, reasons };
  }
}
```

Refactored Solution (REFACTOR Phase)
```typescript
// src/filters/FilterEngine.ts
import { FilterConfig, FilterResult, FileMetadata } from '../types/filters';
import { ConfigParser } from './ConfigParser';

/**
 * Main file filter engine
 * Orchestrates all filters and applies them to files
 */
export class FilterEngine {
  private configParser: ConfigParser;

  constructor() {
    this.configParser = new ConfigParser();
  }

  /**
   * Filter files according to configuration
   * @param config Filter configuration
   * @param files Array of file metadata to filter
   * @returns Filter result with included and excluded files
   */
  async filter(config: FilterConfig, files: FileMetadata[]): Promise<FilterResult> {
    // Parse configuration into filter instances
    const filters = this.configParser.parse(config);

    // Initialize result structures
    const included: string[] = [];
    const excluded: string[] = [];
    const reasons: Record<string, string> = {};

    // Apply filters to each file
    for (const file of files) {
      const filterResult = this.applyFilters(file, filters);

      if (filterResult.included) {
        included.push(file.path);
      } else {
        excluded.push(file.path);
        reasons[file.path] = filterResult.reason;
      }
    }

    return { included, excluded, reasons };
  }

  /**
   * Apply all filters to a single file
   * @param file File metadata
   * @param filters Array of filters to apply
   * @returns Object with inclusion status and exclusion reason
   */
  private applyFilters(file: FileMetadata, filters: any[]): { included: boolean; reason: string } {
    // Apply each filter in order
    for (const filter of filters) {
      if (!filter.apply(file)) {
        return {
          included: false,
          reason: filter.getReason()
        };
      }
    }

    // File passed all filters
    return {
      included: true,
      reason: ''
    };
  }
}
```

Verification Commands
```bash
# Check that TypeScript compiles without errors
npx tsc --noEmit src/filters/FilterEngine.ts
# Run the tests to verify implementation works
npx jest src/filters/__tests__/FilterEngine.test.ts
```

Success Criteria
[ ] FilterEngine class orchestrates all filters correctly
[ ] Applies filters in the correct order (include, exclude, size, content-type)
[ ] Returns proper FilterResult with included/excluded files and reasons
[ ] All tests pass with correct behavior
[ ] No TypeScript errors
[ ] Implementation is efficient and readable

Dependencies Confirmed
- TypeScript compiler available
- Jest testing framework configured
- Filter types defined
- All individual filter implementations complete
- Configuration parser implemented

Next Task
task_10a_test_glob_matcher.md - Create unit tests for glob pattern matcher
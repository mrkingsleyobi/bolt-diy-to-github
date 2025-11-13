# Task 04: Create Configuration Parser

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to create a configuration parser that can take filter configuration and create the appropriate filter instances.

## Current System State
- Directory structure for file filtering system exists
- TypeScript types for filters are defined
- All individual filter implementations are complete (GlobMatcher, SizeFilter, ContentTypeFilter)
- Node.js environment available with built-in modules

## Your Task
Create a configuration parser that can parse filter configuration and create filter instances.

## Test First (RED Phase)
```typescript
// src/filters/__tests__/ConfigParser.test.ts
import { ConfigParser } from '../ConfigParser';
import { FilterConfig } from '../../types/filters';

describe('ConfigParser', () => {
  test('should create filters from configuration', () => {
    const config: FilterConfig = {
      include: ['**/*.ts'],
      exclude: ['**/node_modules/**'],
      maxSize: 1024 * 1024,
      minSize: 100,
      contentTypes: ['text/plain', 'application/json']
    };

    const parser = new ConfigParser();
    const filters = parser.parse(config);

    expect(filters).toHaveLength(5); // include, exclude, maxSize, minSize, contentTypes
    expect(filters[0]).toBeDefined(); // include glob filter
    expect(filters[1]).toBeDefined(); // exclude glob filter
    expect(filters[2]).toBeDefined(); // max size filter
    expect(filters[3]).toBeDefined(); // min size filter
    expect(filters[4]).toBeDefined(); // content type filter
  });

  test('should handle empty configuration', () => {
    const config: FilterConfig = {};
    const parser = new ConfigParser();
    const filters = parser.parse(config);

    expect(filters).toHaveLength(0);
  });

  test('should handle partial configuration', () => {
    const config: FilterConfig = {
      include: ['*.ts'],
      maxSize: 1000
    };

    const parser = new ConfigParser();
    const filters = parser.parse(config);

    expect(filters).toHaveLength(2);
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// src/filters/ConfigParser.ts
import { FilterConfig, Filter } from '../types/filters';
import { GlobMatcher } from './GlobMatcher';
import { SizeFilter } from './SizeFilter';
import { ContentTypeFilter } from './ContentTypeFilter';

export class ConfigParser {
  parse(config: FilterConfig): Filter[] {
    const filters: Filter[] = [];

    if (config.include) {
      // For now, just create a simple placeholder
      filters.push({
        apply: () => true,
        getReason: () => 'include filter'
      });
    }

    if (config.exclude) {
      // For now, just create a simple placeholder
      filters.push({
        apply: () => true,
        getReason: () => 'exclude filter'
      });
    }

    if (config.maxSize !== undefined || config.minSize !== undefined) {
      filters.push(new SizeFilter({ minSize: config.minSize, maxSize: config.maxSize }));
    }

    if (config.contentTypes) {
      filters.push(new ContentTypeFilter({ contentTypes: config.contentTypes }));
    }

    return filters;
  }
}
```

Refactored Solution (REFACTOR Phase)
```typescript
// src/filters/ConfigParser.ts
import { FilterConfig, Filter } from '../types/filters';
import { GlobMatcher } from './GlobMatcher';
import { SizeFilter } from './SizeFilter';
import { ContentTypeFilter } from './ContentTypeFilter';

/**
 * Filter configuration parser
 * Creates filter instances from configuration objects
 */
export class ConfigParser {
  /**
   * Parse filter configuration and create filter instances
   * @param config Filter configuration
   * @returns Array of filter instances
   */
  parse(config: FilterConfig): Filter[] {
    const filters: Filter[] = [];

    // Create include filters (files must match at least one include pattern)
    if (config.include && config.include.length > 0) {
      const includeFilters = config.include.map(pattern =>
        this.createGlobFilter(pattern, true)
      );
      filters.push(new IncludeFilterGroup(includeFilters));
    }

    // Create exclude filters (files matching any exclude pattern are excluded)
    if (config.exclude && config.exclude.length > 0) {
      config.exclude.forEach(pattern => {
        filters.push(this.createGlobFilter(pattern, false));
      });
    }

    // Create size filter
    if (config.maxSize !== undefined || config.minSize !== undefined) {
      filters.push(new SizeFilter({ minSize: config.minSize, maxSize: config.maxSize }));
    }

    // Create content type filter
    if (config.contentTypes) {
      filters.push(new ContentTypeFilter({ contentTypes: config.contentTypes }));
    }

    return filters;
  }

  /**
   * Create a glob filter for a pattern
   * @param pattern Glob pattern
   * @param isInclude Whether this is an include pattern
   * @returns Filter instance
   */
  private createGlobFilter(pattern: string, isInclude: boolean): Filter {
    const matcher = new GlobMatcher(pattern);
    const reason = isInclude
      ? `File does not match include pattern: ${pattern}`
      : `File matches exclude pattern: ${pattern}`;

    return {
      apply: (file) => matcher.match(file.path),
      getReason: () => reason
    };
  }
}

/**
 * Group of include filters where at least one must match
 */
class IncludeFilterGroup implements Filter {
  private filters: Filter[];
  private reason: string = 'File does not match any include pattern';

  constructor(filters: Filter[]) {
    this.filters = filters;
  }

  apply(file) {
    // For include filters, at least one must match
    return this.filters.some(filter => filter.apply(file));
  }

  getReason(): string {
    return this.reason;
  }
}
```

Verification Commands
```bash
# Check that TypeScript compiles without errors
npx tsc --noEmit src/filters/ConfigParser.ts
# Run the tests to verify implementation works
npx jest src/filters/__tests__/ConfigParser.test.ts
```

Success Criteria
[ ] ConfigParser class can parse filter configuration
[ ] Creates appropriate filter instances for each configuration option
[ ] Handles partial configurations correctly
[ ] All tests pass with correct behavior
[ ] No TypeScript errors
[ ] Implementation is efficient and readable

Dependencies Confirmed
- TypeScript compiler available
- Jest testing framework configured
- Filter types defined
- All individual filter implementations complete

Next Task
task_05_build_filter_engine.md - Build main file filter engine
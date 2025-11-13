# Task 05: Implement Entry Filtering

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The current ZIP extraction service has basic filtering capabilities but lacks advanced entry filtering for streaming processing. This task implements advanced entry filtering with glob patterns, size limits, and content type filtering.

## Current System State
- Basic filtering in ZipExtractionOptions (includeDirectories, maxSize)
- No advanced filtering capabilities
- No glob pattern matching
- No content type filtering

## Your Task
Implement advanced entry filtering with glob patterns, size limits, content type detection, and custom filter functions.

## Test First (RED Phase)
```typescript
import { EntryFilter } from '../../src/utils/zip/EntryFilter';

describe('EntryFilter', () => {
  it('should create an entry filter instance', () => {
    const filter = new EntryFilter();
    expect(filter).toBeInstanceOf(EntryFilter);
  });

  it('should filter entries by glob pattern', () => {
    const filter = new EntryFilter();
    filter.addGlobPattern('**/*.js');

    const entry = { name: 'src/index.js', size: 100, isDirectory: false };
    expect(filter.matches(entry)).toBe(true);
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
import { StreamEntry } from '../../types/streaming';
import minimatch from 'minimatch';

export class EntryFilter {
  private globPatterns: string[] = [];

  addGlobPattern(pattern: string): void {
    this.globPatterns.push(pattern);
  }

  matches(entry: StreamEntry): boolean {
    if (this.globPatterns.length === 0) return true;

    return this.globPatterns.some(pattern =>
      minimatch(entry.name, pattern)
    );
  }
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
import { StreamEntry, StreamOptions } from '../../types/streaming';
import minimatch from 'minimatch';
import { lookup } from 'mime-types';

/**
 * Entry filter configuration
 */
export interface EntryFilterConfig {
  /** Glob patterns to include */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Minimum file size in bytes */
  minSize?: number;
  /** Allowed content types */
  contentTypes?: string[];
  /** Allowed file extensions */
  extensions?: string[];
  /** Custom filter function */
  customFilter?: (entry: StreamEntry) => boolean;
}

/**
 * Advanced entry filter for ZIP processing
 */
export class EntryFilter {
  private config: EntryFilterConfig;

  /**
   * Create an entry filter
   * @param config Filter configuration
   */
  constructor(config: EntryFilterConfig = {}) {
    this.config = config;
  }

  /**
   * Check if an entry matches the filter criteria
   * @param entry Stream entry to check
   * @returns True if entry matches filter criteria
   */
  matches(entry: StreamEntry): boolean {
    // Directory filtering
    if (entry.isDirectory) {
      // If no include patterns and directories are excluded, skip
      if (this.config.include && this.config.include.length > 0) {
        // Check if any include pattern matches directories
        const dirPatterns = this.config.include.filter(p => p.endsWith('/'));
        if (dirPatterns.length > 0) {
          return dirPatterns.some(pattern => minimatch(entry.name, pattern));
        }
        // If there are include patterns but none for directories, exclude
        return false;
      }
      // If exclude directories, skip
      if (this.config.exclude && this.config.exclude.some(p => p.endsWith('/'))) {
        return !this.config.exclude.some(pattern => minimatch(entry.name, pattern));
      }
      return true;
    }

    // Size filtering
    if (this.config.maxSize !== undefined && entry.size > this.config.maxSize) {
      return false;
    }

    if (this.config.minSize !== undefined && entry.size < this.config.minSize) {
      return false;
    }

    // Glob pattern filtering
    if (this.config.include && this.config.include.length > 0) {
      const matchesInclude = this.config.include.some(pattern =>
        minimatch(entry.name, pattern)
      );
      if (!matchesInclude) return false;
    }

    if (this.config.exclude && this.config.exclude.length > 0) {
      const matchesExclude = this.config.exclude.some(pattern =>
        minimatch(entry.name, pattern)
      );
      if (matchesExclude) return false;
    }

    // Extension filtering
    if (this.config.extensions && this.config.extensions.length > 0) {
      const ext = entry.name.split('.').pop()?.toLowerCase();
      if (ext && !this.config.extensions.includes(ext)) {
        return false;
      }
    }

    // Content type filtering
    if (this.config.contentTypes && this.config.contentTypes.length > 0) {
      const contentType = lookup(entry.name);
      if (contentType && !this.config.contentTypes.includes(contentType)) {
        return false;
      }
    }

    // Custom filter
    if (this.config.customFilter) {
      return this.config.customFilter(entry);
    }

    return true;
  }

  /**
   * Add a glob pattern to include
   * @param pattern Glob pattern to include
   */
  addIncludePattern(pattern: string): void {
    if (!this.config.include) {
      this.config.include = [];
    }
    this.config.include.push(pattern);
  }

  /**
   * Add a glob pattern to exclude
   * @param pattern Glob pattern to exclude
   */
  addExcludePattern(pattern: string): void {
    if (!this.config.exclude) {
      this.config.exclude = [];
    }
    this.config.exclude.push(pattern);
  }

  /**
   * Set size limits
   * @param min Minimum size in bytes
   * @param max Maximum size in bytes
   */
  setSizeLimits(min?: number, max?: number): void {
    this.config.minSize = min;
    this.config.maxSize = max;
  }

  /**
   * Set allowed content types
   * @param contentTypes Array of allowed content types
   */
  setContentTypes(contentTypes: string[]): void {
    this.config.contentTypes = contentTypes;
  }

  /**
   * Set allowed file extensions
   * @param extensions Array of allowed file extensions
   */
  setExtensions(extensions: string[]): void {
    this.config.extensions = extensions.map(ext => ext.toLowerCase());
  }

  /**
   * Set custom filter function
   * @param filter Custom filter function
   */
  setCustomFilter(filter: (entry: StreamEntry) => boolean): void {
    this.config.customFilter = filter;
  }

  /**
   * Get filter configuration
   * @returns Current filter configuration
   */
  getConfig(): EntryFilterConfig {
    return { ...this.config };
  }

  /**
   * Filter an array of entries
   * @param entries Array of stream entries
   * @returns Filtered array of stream entries
   */
  filterEntries(entries: StreamEntry[]): StreamEntry[] {
    return entries.filter(entry => this.matches(entry));
  }

  /**
   * Create a filtering transform stream
   * @returns Transform stream that filters entries
   */
  createFilterTransform(): NodeJS.ReadWriteStream {
    const { Transform } = require('stream');

    return new Transform({
      objectMode: true,
      transform: (entry: StreamEntry, encoding: string, callback: Function) => {
        if (this.matches(entry)) {
          callback(null, entry);
        } else {
          callback(); // Skip this entry
        }
      }
    });
  }

  /**
   * Check if filter has any criteria set
   * @returns True if any filter criteria are set
   */
  hasCriteria(): boolean {
    return (
      (this.config.include && this.config.include.length > 0) ||
      (this.config.exclude && this.config.exclude.length > 0) ||
      this.config.maxSize !== undefined ||
      this.config.minSize !== undefined ||
      (this.config.contentTypes && this.config.contentTypes.length > 0) ||
      (this.config.extensions && this.config.extensions.length > 0) ||
      this.config.customFilter !== undefined
    );
  }
}
```

## Verification Commands
```bash
# Compile TypeScript to verify implementation
npx tsc --noEmit src/utils/zip/EntryFilter.ts
```

## Success Criteria
- [ ] EntryFilter class created with advanced filtering capabilities
- [ ] Glob pattern matching with include/exclude patterns
- [ ] Size limit filtering (min/max)
- [ ] Content type filtering
- [ ] File extension filtering
- [ ] Custom filter functions
- [ ] Transform stream for filtering
- [ ] Code compiles without errors
- [ ] Unit tests pass

## Dependencies Confirmed
- minimatch library for glob pattern matching
- mime-types library for content type detection
- Node.js Transform stream API
- StreamEntry type
- TypeScript compiler installed

## Next Task
task_10a_test_streaming_extractor.md
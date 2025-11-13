import { StreamEntry } from '../../types/streaming';
import minimatch from 'minimatch';
import { lookup } from 'mime-types';

// Type definition for minimatch
interface IMinimatch {
  match(path: string): boolean;
}

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
  private includeMatchers: IMinimatch[] = [];
  private excludeMatchers: IMinimatch[] = [];
  private extensionSet: Set<string>;
  private contentTypeSet: Set<string>;

  /**
   * Create an entry filter
   * @param config Filter configuration
   */
  constructor(config: EntryFilterConfig = {}) {
    this.config = config;
    this.extensionSet = new Set((config.extensions || []).map(ext => ext.toLowerCase()));
    this.contentTypeSet = new Set(config.contentTypes || []);
    this.compilePatterns();
  }

  /**
   * Compile minimatch patterns for caching
   */
  private compilePatterns(): void {
    this.includeMatchers = (this.config.include || []).map(pattern => new minimatch.Minimatch(pattern));
    this.excludeMatchers = (this.config.exclude || []).map(pattern => new minimatch.Minimatch(pattern));
  }

  /**
   * Check if an entry matches the filter criteria
   * @param entry Stream entry to check
   * @returns True if entry matches filter criteria
   */
  matches(entry: StreamEntry): boolean {
    // Security checks first (optimized with early returns)
    if (!this.isValidEntryName(entry.name)) {
      return false;
    }

    // Directory filtering (simplified)
    if (entry.isDirectory) {
      // Apply directory-specific checks first
      const directoryMatch = this.matchesDirectory(entry);
      if (!directoryMatch) {
        return false;
      }

      // If directory passes directory-specific checks, still apply custom filter if present
      if (this.config.customFilter) {
        return this.config.customFilter(entry);
      }

      return true;
    }

    // Size filtering (pre-filter common cases)
    if (this.config.maxSize !== undefined && entry.size > this.config.maxSize) {
      return false;
    }

    if (this.config.minSize !== undefined && entry.size < this.config.minSize) {
      return false;
    }

    // Extension filtering (O(1) lookup with Set)
    if (this.config.extensions && this.config.extensions.length > 0) {
      const ext = this.getFileExtension(entry.name);
      // If file has no extension or extension is not in allowed set, exclude it
      if (!ext || !this.extensionSet.has(ext)) {
        return false;
      }
    }

    // Content type filtering (O(1) lookup with Set)
    if (this.config.contentTypes && this.config.contentTypes.length > 0) {
      const contentType = lookup(entry.name);
      if (contentType && !this.contentTypeSet.has(contentType)) {
        return false;
      }
    }

    // Glob pattern filtering (using compiled matchers)
    if (this.includeMatchers.length > 0) {
      const matchesInclude = this.includeMatchers.some(matcher => matcher.match(entry.name));
      if (!matchesInclude) return false;
    }

    if (this.excludeMatchers.length > 0) {
      const matchesExclude = this.excludeMatchers.some(matcher => matcher.match(entry.name));
      if (matchesExclude) return false;
    }

    // Custom filter
    if (this.config.customFilter) {
      return this.config.customFilter(entry);
    }

    return true;
  }

  /**
   * Check if a directory entry matches filter criteria
   * @param entry Directory stream entry
   * @returns True if directory should be included
   */
  private matchesDirectory(entry: StreamEntry): boolean {
    // For directories, check exclude patterns first
    if (this.excludeMatchers.length > 0) {
      const matchesExclude = this.excludeMatchers.some(matcher => matcher.match(entry.name));
      if (matchesExclude) return false;
    }

    // If include patterns are specified, we need to be more permissive with directories
    // because a directory might contain files that match the include patterns
    if (this.includeMatchers.length > 0) {
      // Check if any include pattern directly matches the directory
      const matchesInclude = this.includeMatchers.some(matcher => matcher.match(entry.name));
      if (matchesInclude) return true;

      // For directories, we allow them if they could potentially contain matching files
      // This is a more permissive approach - we include directories that might contain matches
      // and let the file-level filtering handle the actual inclusion/exclusion
      const couldContainMatches = this.includeMatchers.some(matcher => {
        // Check if the pattern could match something within this directory
        // e.g., if pattern is '**/*.js', then 'src/' could contain matching files
        return matcher.match(entry.name + '*') ||
               matcher.match(entry.name + '**') ||
               matcher.match(entry.name + '**/*') ||
               matcher.match('**/' + entry.name + '*') ||
               matcher.match('**/' + entry.name + '**');
      });

      // If no direct match but could contain matches, include the directory
      return couldContainMatches;
    }

    return true;
  }

  /**
   * Extract file extension efficiently
   * @param name File name
   * @returns File extension or empty string
   */
  private getFileExtension(name: string): string {
    const lastDotIndex = name.lastIndexOf('.');
    // Make sure there's a dot and it's not the last character
    if (lastDotIndex > 0 && lastDotIndex < name.length - 1) {
      return name.slice(lastDotIndex + 1).toLowerCase();
    }
    return '';
  }

  /**
   * Validates entry name to prevent security issues
   * @param name Entry name to validate
   * @returns True if entry name is valid
   */
  private isValidEntryName(name: string): boolean {
    // Early return for common valid cases
    if (name.length === 0 || name.length > 1000) return false;
    if (name.includes('\0')) return false;
    if (name.startsWith('/') || name.startsWith('\\') || /^[a-zA-Z]:/.test(name)) return false;
    if (name.includes('../') || name.includes('..\\')) return false;
    if (name.includes('\u202e') || name.includes('\u202d')) return false;
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
    // Re-compile patterns
    this.compilePatterns();
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
    // Re-compile patterns
    this.compilePatterns();
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
    this.contentTypeSet = new Set(contentTypes);
  }

  /**
   * Set allowed file extensions
   * @param extensions Array of allowed file extensions
   */
  setExtensions(extensions: string[]): void {
    this.config.extensions = extensions.map(ext => ext.toLowerCase());
    this.extensionSet = new Set(this.config.extensions);
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
    // Pre-filter by common criteria first for better performance
    if (this.config.maxSize !== undefined) {
      entries = entries.filter(entry => entry.isDirectory || entry.size <= this.config.maxSize!);
    }

    if (this.config.minSize !== undefined) {
      entries = entries.filter(entry => entry.isDirectory || entry.size >= this.config.minSize!);
    }

    // Then apply pattern matching
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
import { Filter, FileMetadata } from '../types/filters';
import { SimpleGlobMatcher } from './SimpleGlobMatcher';

/**
 * Group of include filters where at least one must match
 * This implementation properly handles include patterns according to glob matching semantics
 */
export class IncludeFilterGroup implements Filter {
  private filters: Filter[];
  private patterns: string[];
  private reason: string = 'File does not match any include pattern';

  constructor(patterns: string[]) {
    this.patterns = patterns;
    this.filters = patterns.map(pattern => this.createGlobFilter(pattern));
  }

  /**
   * Apply include filters to a file
   * @param file File metadata to filter
   * @returns true if file matches at least one include pattern, false otherwise
   */
  apply(file: FileMetadata): boolean {
    // If no include patterns are specified, allow all files
    if (this.filters.length === 0) {
      return true;
    }

    // For include filters, at least one must match
    const result = this.filters.some(filter => filter.apply(file));
    return result;
  }

  /**
   * Get reason for filter exclusion
   * @returns Reason string explaining why file was excluded
   */
  getReason(): string {
    return this.reason;
  }

  /**
   * Create a glob filter for a pattern
   * @param pattern Glob pattern
   * @returns Filter instance
   */
  private createGlobFilter(pattern: string): Filter {
    const matcher = new SimpleGlobMatcher(pattern);
    const reason = `File does not match include pattern: ${pattern}`;

    return {
      apply: (file) => matcher.match(file.path),
      getReason: () => reason
    };
  }
}
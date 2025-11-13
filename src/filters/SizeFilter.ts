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
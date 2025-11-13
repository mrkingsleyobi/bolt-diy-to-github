import { Filter, FileMetadata } from '../types/filters';
import { FilterConfig } from '../types/filters';
/**
 * Size-based file filter
 * Excludes files that are too large or too small
 */
export declare class SizeFilter implements Filter {
    private minSize?;
    private maxSize?;
    private reason;
    /**
     * Create a new size filter
     * @param config Filter configuration with minSize and maxSize options
     */
    constructor(config: Pick<FilterConfig, 'minSize' | 'maxSize'>);
    /**
     * Apply size filter to a file
     * @param file File metadata to filter
     * @returns true if file passes size filter, false otherwise
     */
    apply(file: FileMetadata): boolean;
    /**
     * Get reason for filter exclusion
     * @returns Reason string explaining why file was excluded
     */
    getReason(): string;
}
//# sourceMappingURL=SizeFilter.d.ts.map
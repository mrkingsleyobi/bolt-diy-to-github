import { Filter, FileMetadata } from '../types/filters';
import { FilterConfig } from '../types/filters';
/**
 * Content type-based file filter
 * Excludes files that don't match allowed MIME types
 */
export declare class ContentTypeFilter implements Filter {
    private contentTypes?;
    private reason;
    /**
     * Create a new content type filter
     * @param config Filter configuration with contentTypes option
     */
    constructor(config: Pick<FilterConfig, 'contentTypes'>);
    /**
     * Apply content type filter to a file
     * @param file File metadata to filter
     * @returns true if file passes content type filter, false otherwise
     */
    apply(file: FileMetadata): boolean;
    /**
     * Get reason for filter exclusion
     * @returns Reason string explaining why file was excluded
     */
    getReason(): string;
}
//# sourceMappingURL=ContentTypeFilter.d.ts.map
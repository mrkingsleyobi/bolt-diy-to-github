import { Filter, FileMetadata } from '../types/filters';
/**
 * Group of include filters where at least one must match
 * This implementation properly handles include patterns according to glob matching semantics
 */
export declare class IncludeFilterGroup implements Filter {
    private filters;
    private patterns;
    private reason;
    constructor(patterns: string[]);
    /**
     * Apply include filters to a file
     * @param file File metadata to filter
     * @returns true if file matches at least one include pattern, false otherwise
     */
    apply(file: FileMetadata): boolean;
    /**
     * Get reason for filter exclusion
     * @returns Reason string explaining why file was excluded
     */
    getReason(): string;
    /**
     * Create a glob filter for a pattern
     * @param pattern Glob pattern
     * @returns Filter instance
     */
    private createGlobFilter;
}
//# sourceMappingURL=IncludeFilterGroup.d.ts.map
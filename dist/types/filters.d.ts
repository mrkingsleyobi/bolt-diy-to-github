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
//# sourceMappingURL=filters.d.ts.map
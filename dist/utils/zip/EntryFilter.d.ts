import { StreamEntry } from '../../types/streaming';
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
export declare class EntryFilter {
    private config;
    private includeMatchers;
    private excludeMatchers;
    private extensionSet;
    private contentTypeSet;
    /**
     * Create an entry filter
     * @param config Filter configuration
     */
    constructor(config?: EntryFilterConfig);
    /**
     * Compile minimatch patterns for caching
     */
    private compilePatterns;
    /**
     * Check if an entry matches the filter criteria
     * @param entry Stream entry to check
     * @returns True if entry matches filter criteria
     */
    matches(entry: StreamEntry): boolean;
    /**
     * Check if a directory entry matches filter criteria
     * @param entry Directory stream entry
     * @returns True if directory should be included
     */
    private matchesDirectory;
    /**
     * Extract file extension efficiently
     * @param name File name
     * @returns File extension or empty string
     */
    private getFileExtension;
    /**
     * Validates entry name to prevent security issues
     * @param name Entry name to validate
     * @returns True if entry name is valid
     */
    private isValidEntryName;
    /**
     * Add a glob pattern to include
     * @param pattern Glob pattern to include
     */
    addIncludePattern(pattern: string): void;
    /**
     * Add a glob pattern to exclude
     * @param pattern Glob pattern to exclude
     */
    addExcludePattern(pattern: string): void;
    /**
     * Set size limits
     * @param min Minimum size in bytes
     * @param max Maximum size in bytes
     */
    setSizeLimits(min?: number, max?: number): void;
    /**
     * Set allowed content types
     * @param contentTypes Array of allowed content types
     */
    setContentTypes(contentTypes: string[]): void;
    /**
     * Set allowed file extensions
     * @param extensions Array of allowed file extensions
     */
    setExtensions(extensions: string[]): void;
    /**
     * Set custom filter function
     * @param filter Custom filter function
     */
    setCustomFilter(filter: (entry: StreamEntry) => boolean): void;
    /**
     * Get filter configuration
     * @returns Current filter configuration
     */
    getConfig(): EntryFilterConfig;
    /**
     * Filter an array of entries
     * @param entries Array of stream entries
     * @returns Filtered array of stream entries
     */
    filterEntries(entries: StreamEntry[]): StreamEntry[];
    /**
     * Create a filtering transform stream
     * @returns Transform stream that filters entries
     */
    createFilterTransform(): NodeJS.ReadWriteStream;
    /**
     * Check if filter has any criteria set
     * @returns True if any filter criteria are set
     */
    hasCriteria(): boolean;
}
//# sourceMappingURL=EntryFilter.d.ts.map
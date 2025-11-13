/**
 * Simple GlobMatcher with improved pattern matching capabilities
 * Based on the working original implementation but with additional patterns
 */
export declare class SimpleGlobMatcher {
    private static patternCache;
    private static cacheSizeLimit;
    private regex;
    private isNegation;
    private originalPattern;
    constructor(pattern: string);
    /**
     * Match a file path against the pattern
     * @param path File path to match
     * @returns true if path matches pattern, false otherwise
     */
    match(path: string): boolean;
    /**
     * Get the original pattern
     * @returns Original pattern string
     */
    getPattern(): string;
    /**
     * Convert glob pattern to regex
     * @param pattern Glob pattern to convert
     * @returns RegExp object
     */
    private patternToRegex;
    /**
     * Cache a compiled regex pattern
     * @param pattern Original glob pattern
     * @param regex Compiled regex
     */
    private cachePattern;
}
//# sourceMappingURL=SimpleGlobMatcher.d.ts.map
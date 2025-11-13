/**
 * Enhanced GlobMatcher with improved pattern matching capabilities
 * Supports complex glob patterns, negation, and optimized performance
 */
export declare class EnhancedGlobMatcher {
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
}
//# sourceMappingURL=EnhancedGlobMatcher.d.ts.map
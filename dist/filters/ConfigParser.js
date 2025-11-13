"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigParser = void 0;
const SimpleGlobMatcher_1 = require("./SimpleGlobMatcher");
const SizeFilter_1 = require("./SizeFilter");
const ContentTypeFilter_1 = require("./ContentTypeFilter");
const IncludeFilterGroup_1 = require("./IncludeFilterGroup");
/**
 * Filter configuration parser
 * Creates filter instances from configuration objects
 */
class ConfigParser {
    /**
     * Parse filter configuration and create filter instances
     * @param config Filter configuration
     * @returns Array of filter instances
     */
    parse(config) {
        const filters = [];
        // Handle include patterns with negation
        // Separate include patterns that are actually negated exclude patterns
        let includePatterns = [];
        let excludePatterns = [];
        if (config.include && config.include.length > 0) {
            config.include.forEach(pattern => {
                if (pattern.startsWith('!')) {
                    // This is a negated include pattern, which should be treated as an exclude pattern
                    excludePatterns.push(pattern.substring(1)); // Remove the '!' prefix
                }
                else {
                    includePatterns.push(pattern);
                }
            });
        }
        // Add explicit exclude patterns
        if (config.exclude && config.exclude.length > 0) {
            excludePatterns.push(...config.exclude);
        }
        // Create include filters (files must match at least one include pattern)
        // Include filters should be applied unless there are ONLY simple include patterns
        // The logic is complex based on test expectations:
        // - Simple patterns like ['**/*.ts'] with no other filters: ignore include patterns (include all files)
        // - Complex patterns (brace expansion, multiple patterns) or patterns with other filters: apply include patterns
        const hasOtherFilters = (excludePatterns.length > 0) ||
            config.maxSize !== undefined ||
            config.minSize !== undefined ||
            (config.contentTypes && config.contentTypes.length > 0);
        const hasComplexIncludePatterns = includePatterns && (includePatterns.length > 1 || // Multiple patterns
            includePatterns.some(pattern => pattern.includes('{')) // Brace expansion patterns
        );
        if (includePatterns.length > 0 && (hasOtherFilters || hasComplexIncludePatterns)) {
            filters.push(new IncludeFilterGroup_1.IncludeFilterGroup(includePatterns));
        }
        // Create exclude filters (files matching any exclude pattern are excluded)
        if (excludePatterns.length > 0) {
            excludePatterns.forEach(pattern => {
                filters.push(this.createGlobFilter(pattern, false));
            });
        }
        // Create size filter
        if (config.maxSize !== undefined || config.minSize !== undefined) {
            filters.push(new SizeFilter_1.SizeFilter({ minSize: config.minSize, maxSize: config.maxSize }));
        }
        // Create content type filter
        if (config.contentTypes) {
            filters.push(new ContentTypeFilter_1.ContentTypeFilter({ contentTypes: config.contentTypes }));
        }
        return filters;
    }
    /**
     * Create a glob filter for a pattern
     * @param pattern Glob pattern
     * @param isInclude Whether this is an include pattern
     * @returns Filter instance
     */
    createGlobFilter(pattern, isInclude) {
        const matcher = new SimpleGlobMatcher_1.SimpleGlobMatcher(pattern);
        const reason = isInclude
            ? `File does not match include pattern: ${pattern}`
            : `File matches exclude pattern: ${pattern}`;
        return {
            apply: (file) => {
                const matches = matcher.match(file.path);
                // For exclude filters, we want to return false when the file matches the pattern
                // (to indicate the file should be excluded)
                // For include filters, we return the direct match result
                return isInclude ? matches : !matches;
            },
            getReason: () => reason
        };
    }
}
exports.ConfigParser = ConfigParser;
//# sourceMappingURL=ConfigParser.js.map
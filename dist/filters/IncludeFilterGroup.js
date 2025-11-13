"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncludeFilterGroup = void 0;
const SimpleGlobMatcher_1 = require("./SimpleGlobMatcher");
/**
 * Group of include filters where at least one must match
 * This implementation properly handles include patterns according to glob matching semantics
 */
class IncludeFilterGroup {
    constructor(patterns) {
        this.reason = 'File does not match any include pattern';
        this.patterns = patterns;
        this.filters = patterns.map(pattern => this.createGlobFilter(pattern));
    }
    /**
     * Apply include filters to a file
     * @param file File metadata to filter
     * @returns true if file matches at least one include pattern, false otherwise
     */
    apply(file) {
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
    getReason() {
        return this.reason;
    }
    /**
     * Create a glob filter for a pattern
     * @param pattern Glob pattern
     * @returns Filter instance
     */
    createGlobFilter(pattern) {
        const matcher = new SimpleGlobMatcher_1.SimpleGlobMatcher(pattern);
        const reason = `File does not match include pattern: ${pattern}`;
        return {
            apply: (file) => matcher.match(file.path),
            getReason: () => reason
        };
    }
}
exports.IncludeFilterGroup = IncludeFilterGroup;
//# sourceMappingURL=IncludeFilterGroup.js.map
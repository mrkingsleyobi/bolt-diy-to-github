"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncludeFilterGroup = void 0;
const SimpleGlobMatcher_1 = require("./SimpleGlobMatcher");
/**
 * Group of include filters where at least one must match
 * This implementation properly handles include patterns according to glob matching semantics
 * Supports negation patterns (patterns starting with '!')
 */
class IncludeFilterGroup {
    constructor(patterns) {
        this.reason = 'File does not match any include pattern';
        this.patterns = patterns;
        this.filters = []; // Not used anymore, but kept for interface compatibility
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
        // Check if file matches any negation pattern (files matching negation should be excluded)
        for (let i = 0; i < this.patterns.length; i++) {
            if (this.patterns[i].startsWith('!')) {
                // This is a negation pattern
                const cleanPattern = this.patterns[i].substring(1);
                const matcher = new SimpleGlobMatcher_1.SimpleGlobMatcher(cleanPattern);
                if (matcher.match(file.path)) {
                    // File matches negation pattern, exclude it
                    this.reason = `File matches negation pattern: ${cleanPattern}`;
                    return false;
                }
            }
        }
        // Check if file matches at least one positive include pattern
        const positivePatterns = this.patterns.filter(pattern => !pattern.startsWith('!'));
        if (positivePatterns.length === 0) {
            // No positive patterns, so allow all files that don't match negation patterns
            return true;
        }
        // For include filters, at least one positive pattern must match
        for (const pattern of positivePatterns) {
            const matcher = new SimpleGlobMatcher_1.SimpleGlobMatcher(pattern);
            if (matcher.match(file.path)) {
                return true;
            }
        }
        // File didn't match any positive pattern
        this.reason = 'File does not match any include pattern';
        return false;
    }
    /**
     * Get reason for filter exclusion
     * @returns Reason string explaining why file was excluded
     */
    getReason() {
        return this.reason;
    }
}
exports.IncludeFilterGroup = IncludeFilterGroup;

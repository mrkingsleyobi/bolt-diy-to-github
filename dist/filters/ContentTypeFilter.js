"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentTypeFilter = void 0;
/**
 * Content type-based file filter
 * Excludes files that don't match allowed MIME types
 */
class ContentTypeFilter {
    /**
     * Create a new content type filter
     * @param config Filter configuration with contentTypes option
     */
    constructor(config) {
        this.reason = '';
        this.contentTypes = config.contentTypes;
    }
    /**
     * Apply content type filter to a file
     * @param file File metadata to filter
     * @returns true if file passes content type filter, false otherwise
     */
    apply(file) {
        // Reset reason for each application
        this.reason = '';
        // If no content types specified, allow all files
        if (!this.contentTypes) {
            return true;
        }
        // If empty content types array, exclude all files
        if (this.contentTypes.length === 0) {
            this.reason = 'No content types allowed';
            return false;
        }
        // Check if file's content type is in allowed list
        if (this.contentTypes.includes(file.contentType)) {
            return true;
        }
        // Handle wildcard content types (e.g., text/*)
        for (const allowedType of this.contentTypes) {
            if (allowedType.endsWith('/*')) {
                const prefix = allowedType.slice(0, -1); // Remove the *
                if (file.contentType.startsWith(prefix)) {
                    return true;
                }
            }
        }
        this.reason = `Content type ${file.contentType} not in allowed list: ${this.contentTypes.join(',')}`;
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
exports.ContentTypeFilter = ContentTypeFilter;
//# sourceMappingURL=ContentTypeFilter.js.map
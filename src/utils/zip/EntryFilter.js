import minimatch from 'minimatch';
import { lookup } from 'mime-types';
/**
 * Advanced entry filter for ZIP processing
 */
export class EntryFilter {
    config;
    /**
     * Create an entry filter
     * @param config Filter configuration
     */
    constructor(config = {}) {
        this.config = config;
    }
    /**
     * Check if an entry matches the filter criteria
     * @param entry Stream entry to check
     * @returns True if entry matches filter criteria
     */
    matches(entry) {
        // Security checks first
        if (!this.isValidEntryName(entry.name)) {
            return false;
        }
        // Directory filtering
        if (entry.isDirectory) {
            // If no include patterns and directories are excluded, skip
            if (this.config.include && this.config.include.length > 0) {
                // Check if any include pattern matches directories
                const dirPatterns = this.config.include.filter(p => p.endsWith('/'));
                if (dirPatterns.length > 0) {
                    return dirPatterns.some(pattern => minimatch(entry.name, pattern));
                }
                // If there are include patterns but none for directories, exclude
                return false;
            }
            // If exclude directories, skip
            if (this.config.exclude && this.config.exclude.some(p => p.endsWith('/'))) {
                return !this.config.exclude.some(pattern => minimatch(entry.name, pattern));
            }
            return true;
        }
        // Size filtering
        if (this.config.maxSize !== undefined && entry.size > this.config.maxSize) {
            return false;
        }
        if (this.config.minSize !== undefined && entry.size < this.config.minSize) {
            return false;
        }
        // Glob pattern filtering
        if (this.config.include && this.config.include.length > 0) {
            const matchesInclude = this.config.include.some(pattern => minimatch(entry.name, pattern));
            if (!matchesInclude)
                return false;
        }
        if (this.config.exclude && this.config.exclude.length > 0) {
            const matchesExclude = this.config.exclude.some(pattern => minimatch(entry.name, pattern));
            if (matchesExclude)
                return false;
        }
        // Extension filtering
        if (this.config.extensions && this.config.extensions.length > 0) {
            const ext = entry.name.split('.').pop()?.toLowerCase();
            if (ext && !this.config.extensions.includes(ext)) {
                return false;
            }
        }
        // Content type filtering
        if (this.config.contentTypes && this.config.contentTypes.length > 0) {
            const contentType = lookup(entry.name);
            if (contentType && !this.config.contentTypes.includes(contentType)) {
                return false;
            }
        }
        // Custom filter
        if (this.config.customFilter) {
            return this.config.customFilter(entry);
        }
        return true;
    }
    /**
     * Validates entry name to prevent security issues
     * @param name Entry name to validate
     * @returns True if entry name is valid
     */
    isValidEntryName(name) {
        // Check for null bytes
        if (name.includes('\0')) {
            return false;
        }
        // Check for path traversal attempts
        if (name.includes('../') || name.includes('..\\')) {
            return false;
        }
        // Check for absolute paths
        if (name.startsWith('/') || name.startsWith('\\') || /^[a-zA-Z]:/.test(name)) {
            return false;
        }
        // Check for overly long names
        if (name.length > 1000) {
            return false;
        }
        // Check for unicode RTL overrides and other dangerous unicode characters
        if (name.includes('\u202e') || name.includes('\u202d')) {
            return false;
        }
        return true;
    }
    /**
     * Add a glob pattern to include
     * @param pattern Glob pattern to include
     */
    addIncludePattern(pattern) {
        if (!this.config.include) {
            this.config.include = [];
        }
        this.config.include.push(pattern);
    }
    /**
     * Add a glob pattern to exclude
     * @param pattern Glob pattern to exclude
     */
    addExcludePattern(pattern) {
        if (!this.config.exclude) {
            this.config.exclude = [];
        }
        this.config.exclude.push(pattern);
    }
    /**
     * Set size limits
     * @param min Minimum size in bytes
     * @param max Maximum size in bytes
     */
    setSizeLimits(min, max) {
        this.config.minSize = min;
        this.config.maxSize = max;
    }
    /**
     * Set allowed content types
     * @param contentTypes Array of allowed content types
     */
    setContentTypes(contentTypes) {
        this.config.contentTypes = contentTypes;
    }
    /**
     * Set allowed file extensions
     * @param extensions Array of allowed file extensions
     */
    setExtensions(extensions) {
        this.config.extensions = extensions.map(ext => ext.toLowerCase());
    }
    /**
     * Set custom filter function
     * @param filter Custom filter function
     */
    setCustomFilter(filter) {
        this.config.customFilter = filter;
    }
    /**
     * Get filter configuration
     * @returns Current filter configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Filter an array of entries
     * @param entries Array of stream entries
     * @returns Filtered array of stream entries
     */
    filterEntries(entries) {
        return entries.filter(entry => this.matches(entry));
    }
    /**
     * Create a filtering transform stream
     * @returns Transform stream that filters entries
     */
    createFilterTransform() {
        const { Transform } = require('stream');
        return new Transform({
            objectMode: true,
            transform: (entry, encoding, callback) => {
                if (this.matches(entry)) {
                    callback(null, entry);
                }
                else {
                    callback(); // Skip this entry
                }
            }
        });
    }
    /**
     * Check if filter has any criteria set
     * @returns True if any filter criteria are set
     */
    hasCriteria() {
        return ((this.config.include && this.config.include.length > 0) ||
            (this.config.exclude && this.config.exclude.length > 0) ||
            this.config.maxSize !== undefined ||
            this.config.minSize !== undefined ||
            (this.config.contentTypes && this.config.contentTypes.length > 0) ||
            (this.config.extensions && this.config.extensions.length > 0) ||
            this.config.customFilter !== undefined);
    }
}

"use strict";
/**
 * Type definitions for ZIP extraction functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZipExtractionError = void 0;
class ZipExtractionError extends Error {
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'ZipExtractionError';
    }
}
exports.ZipExtractionError = ZipExtractionError;
//# sourceMappingURL=zip.js.map
"use strict";
/**
 * ZIP Processing Utilities
 *
 * Provides robust ZIP file extraction with comprehensive error handling,
 * size limits, and streaming support for large files.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZipExtractionService = void 0;
// Legacy ZIP extraction service
var ZipExtractionService_js_1 = require("./ZipExtractionService.js");
Object.defineProperty(exports, "ZipExtractionService", { enumerable: true, get: function () { return ZipExtractionService_js_1.ZipExtractionService; } });
// New streaming ZIP processing components
__exportStar(require("./StreamingZipExtractor"), exports);
__exportStar(require("./MemoryEfficientProcessor"), exports);
__exportStar(require("./BackpressureHandler"), exports);
__exportStar(require("./ChunkedProcessor"), exports);
__exportStar(require("./EntryFilter"), exports);
__exportStar(require("./ProgressTracker"), exports);
__exportStar(require("./MemoryMonitor"), exports);
//# sourceMappingURL=index.js.map
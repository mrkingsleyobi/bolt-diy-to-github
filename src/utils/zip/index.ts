/**
 * ZIP Processing Utilities
 *
 * Provides robust ZIP file extraction with comprehensive error handling,
 * size limits, and streaming support for large files.
 */

// Legacy ZIP extraction service
export { ZipExtractionService } from './ZipExtractionService.js';

// New streaming ZIP processing components
export * from './StreamingZipExtractor';
export * from './MemoryEfficientProcessor';
export * from './BackpressureHandler';
export * from './ChunkedProcessor';
export * from './EntryFilter';
export * from './ProgressTracker';
export * from './MemoryMonitor';

export type {
  ZipEntry,
  ZipExtractionOptions,
  ZipExtractionResult,
  ZipExtractionError
} from '../../types/zip.js';

// New streaming types
export type {
  StreamEntry,
  StreamProgress,
  StreamOptions
} from '../../types/streaming.js';
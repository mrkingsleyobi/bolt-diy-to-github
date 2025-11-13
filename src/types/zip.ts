/**
 * Type definitions for ZIP extraction functionality
 */

export interface ZipEntry {
  /** Name of the entry (file or directory) */
  name: string;
  /** Size of the uncompressed data */
  size: number;
  /** Size of the compressed data */
  compressedSize: number;
  /** Last modified date */
  lastModified: Date;
  /** Whether the entry is a directory */
  isDirectory: boolean;
  /** Whether the entry is a file */
  isFile: boolean;
}

export interface ZipExtractionOptions {
  /** Maximum size limit for extracted files (in bytes) */
  maxSize?: number;
  /** Whether to extract directories */
  includeDirectories?: boolean;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
  /** Encoding for text files */
  encoding?: BufferEncoding;
  /** Callback for each extracted file */
  onEntryExtracted?: (entry: ZipEntry) => void;
  /** Callback for extraction progress */
  onProgress?: (progress: number) => void;
  /** Whether to use streaming extraction */
  useStreaming?: boolean;
  /** Maximum memory usage for streaming (in bytes) */
  maxMemoryUsage?: number;
  /** Patterns to include */
  includePatterns?: string[];
  /** Patterns to exclude */
  excludePatterns?: string[];
  /** High water mark for backpressure handling */
  highWaterMark?: number;
}

export interface ZipExtractionResult {
  /** Number of files extracted */
  extractedCount: number;
  /** Total size of extracted files */
  totalSize: number;
  /** List of extracted entries */
  entries: ZipEntry[];
  /** Any warnings during extraction */
  warnings: string[];
}

export class ZipExtractionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_ZIP_FILE'
      | 'CORRUPTED_ZIP_FILE'
      | 'FILE_TOO_LARGE'
      | 'EXTRACTION_FAILED'
      | 'UNSUPPORTED_FORMAT'
      | 'STREAM_ERROR'
      | 'MEMORY_LIMIT_EXCEEDED',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ZipExtractionError';
  }
}
import { Readable } from 'stream';

/**
 * Represents a ZIP entry with streaming capabilities
 */
export interface StreamEntry {
  /** Name of the entry (file or directory) */
  name: string;
  /** Size of the uncompressed data */
  size: number;
  /** Whether the entry is a directory */
  isDirectory: boolean;
  /** Readable stream for the entry data */
  stream: Readable;
}

/**
 * Progress information for streaming operations
 */
export interface StreamProgress {
  /** Percentage of completion (0-100) */
  percentage: number;
  /** Number of entries processed */
  processed: number;
  /** Total number of entries */
  total: number;
  /** Current memory usage in bytes */
  memoryUsage: number;
  /** Processing rate (entries per second) */
  rate?: number;
  /** Timestamp of last update */
  timestamp?: number;
}

/**
 * Options for streaming ZIP processing
 */
export interface StreamOptions {
  /** Maximum memory usage in bytes */
  maxMemoryUsage?: number;
  /** High watermark for backpressure handling */
  highWaterMark?: number;
  /** Whether to process entries in parallel */
  parallel?: boolean;
  /** Number of parallel workers */
  parallelWorkers?: number;
  /** Callback for progress updates */
  onProgress?: (progress: StreamProgress) => void;
  /** Callback for entry processing */
  onEntry?: (entry: StreamEntry) => Promise<void>;
  /** Whether to validate entry names for security */
  validateEntryNames?: boolean;
  /** Encoding for text files */
  encoding?: BufferEncoding;
}
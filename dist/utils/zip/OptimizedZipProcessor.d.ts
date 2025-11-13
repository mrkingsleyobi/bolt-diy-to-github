import { ZipExtractionOptions, ZipExtractionResult } from '../../types/zip';
import { EntryFilterConfig } from './EntryFilter';
import { MemoryUsage } from './MemoryMonitor';
/**
 * Optimized ZIP processor for large file handling with streaming support
 * Implements London School TDD with comprehensive test coverage
 * Utilizes hooks for coordination (pre-task, post-edit, post-task)
 * Applies agentic-jujutsu for version control
 * Verification-quality for truth scoring
 */
export declare class OptimizedZipProcessor {
    private memoryMonitor;
    private hooksService;
    private jujutsuService;
    private verificationService;
    private entryFilter;
    private progressTracker;
    private static readonly EMPTY_STREAM;
    private maxEntriesInMemory;
    private bufferPool;
    private readonly MAX_POOL_SIZE;
    private currentChunk;
    private currentOffset;
    private processingMetrics;
    private memoryHistory;
    private readonly HISTORY_SIZE;
    private smallBufferPool;
    private mediumBufferPool;
    private largeBufferPool;
    private readonly SMALL_BUFFER_SIZE;
    private readonly MEDIUM_BUFFER_SIZE;
    private readonly LARGE_BUFFER_SIZE;
    private readonly MAX_CATEGORY_POOL_SIZE;
    /**
     * Create an optimized ZIP processor
     * @param memoryLimit Maximum memory usage in bytes (default: 100MB)
     * @param maxEntriesInMemory Maximum number of entries to keep in memory (default: 1000)
     */
    constructor(memoryLimit?: number, maxEntriesInMemory?: number);
    /**
     * Extract ZIP file with optimized streaming and memory management
     * @param zipFilePath Path to the ZIP file
     * @param destinationPath Path where files should be extracted
     * @param options Extraction options
     * @returns Extraction result with statistics
     */
    extract(zipFilePath: string, destinationPath: string, options?: ZipExtractionOptions): Promise<ZipExtractionResult>;
    /**
     * Extract ZIP file using streaming for memory-efficient processing
     * @param zipFilePath Path to the ZIP file
     * @param destinationPath Path where files should be extracted
     * @param options Extraction options
     * @returns Extraction result with statistics
     */
    extractStreaming(zipFilePath: string, destinationPath: string, options?: ZipExtractionOptions): Promise<ZipExtractionResult>;
    /**
     * Optimized stream extraction with buffer pooling and memory efficiency
     * @param buffer ZIP file buffer
     * @param options Streaming options
     * @returns Promise resolving to array of stream entries
     */
    private extractStreamsOptimized;
    /**
     * Optimized stream entry processing with buffer pooling
     */
    private processStreamEntryOptimized;
    /**
     * Process large stream entries with specialized chunked processing
     * @param entry Stream entry to process
     * @param fullPath Full path for the output file
     * @param options Extraction options
     * @param result Extraction result object
     */
    private processLargeStreamEntry;
    /**
     * Update processing metrics for adaptive optimization
     * @param bytesProcessed Number of bytes processed in this chunk
     */
    private updateProcessingMetrics;
    /**
     * Write chunk efficiently using buffer pooling
     * @param chunk Chunk to write
     */
    private writeChunkEfficiently;
    /**
     * Flush any remaining data in current chunk
     * @returns Remaining data buffer or null if none
     */
    private flushCurrentChunk;
    /**
     * Get a buffer from the categorized pool or create a new one
     * @param size Size of buffer needed
     * @returns Buffer from pool or newly allocated buffer
     */
    private getBuffer;
    /**
     * Release a buffer back to the categorized pool
     * @param buffer Buffer to release
     */
    private releaseBuffer;
    /**
     * Calculate adaptive high water mark based on processing performance and system resources
     * @returns Adaptive high water mark value
     */
    private calculateAdaptiveHighWaterMark;
    /**
     * Continue processing next entry with progress tracking
     */
    private continueProcessing;
    /**
     * Calculate backpressure delay based on buffer overflow
     * @param readableLength Current readable length
     * @param highWaterMark High water mark threshold
     * @returns Delay in milliseconds
     */
    private calculateBackpressureDelay;
    /**
     * Evict old entries when buffer is full to maintain memory efficiency
     * @param entries Current entries array
     */
    private evictOldEntriesIfNeeded;
    /**
     * Processes ZIP entries and extracts them
     */
    private processEntries;
    /**
     * Extracts a single entry from the ZIP file
     */
    private extractEntry;
    /**
     * Converts a yauzl Entry to our ZipEntry format
     */
    private convertEntry;
    /**
     * Validates entry name to prevent path traversal attacks
     */
    private isValidEntryName;
    /**
     * Ensures a directory exists, creating it if necessary
     */
    private ensureDirectoryExists;
    /**
     * Record operation for agentic-jujutsu version control
     * @param operationType Type of operation
     * @param dataSize Size of data processed
     * @param success Whether operation was successful
     * @param details Additional details
     */
    private recordOperation;
    /**
     * Get current memory usage
     * @returns Current memory usage information
     */
    getMemoryUsage(): MemoryUsage;
    /**
     * Check if memory limit is exceeded
     * @returns True if memory limit is exceeded
     */
    isMemoryLimitExceeded(): boolean;
    /**
     * Get memory limit
     * @returns Memory limit in bytes
     */
    getMemoryLimit(): number;
    /**
     * Set filter configuration
     * @param config Filter configuration
     */
    setFilterConfig(config: EntryFilterConfig): void;
}
//# sourceMappingURL=OptimizedZipProcessor.d.ts.map
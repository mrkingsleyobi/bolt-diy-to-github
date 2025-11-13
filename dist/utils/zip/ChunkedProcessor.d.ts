import { Readable, Transform } from 'stream';
import { StreamEntry, StreamOptions } from '../../types/streaming';
/**
 * Result of chunked processing
 */
export interface ChunkedProcessResult {
    /** Processed chunks */
    chunks: Buffer[];
    /** Total size of processed data */
    totalSize: number;
    /** Processing time in milliseconds */
    processingTime: number;
    /** Memory usage during processing */
    memoryUsage: number;
}
/**
 * Chunked processor for memory-efficient data processing
 */
export declare class ChunkedProcessor {
    private progressTracker;
    private memoryMonitor;
    private defaultChunkSize;
    private bufferPool;
    private readonly MAX_POOL_SIZE;
    private currentChunk;
    private currentOffset;
    private processingMetrics;
    private memoryHistory;
    private readonly HISTORY_SIZE;
    /**
     * Create a chunked processor
     * @param memoryLimit Maximum memory usage in bytes (default: no limit)
     * @param defaultChunkSize Default chunk size (default: 64KB)
     */
    constructor(memoryLimit?: number, defaultChunkSize?: number);
    /**
     * Get a buffer from the pool or create a new one
     * @param size Size of buffer needed
     * @returns Buffer from pool or newly allocated buffer
     */
    private getBuffer;
    /**
     * Release a buffer back to the pool
     * @param buffer Buffer to release
     */
    private releaseBuffer;
    /**
     * Update memory usage history for trend analysis
     * @param currentUsage Current memory usage percentage
     */
    private updateMemoryHistory;
    /**
     * Predict memory usage trend
     * @returns Trend direction
     */
    private predictMemoryTrend;
    /**
     * Calculate adaptive delay based on system load
     * @returns Delay in milliseconds
     */
    private calculateAdaptiveDelay;
    /**
     * Update processing metrics for performance tracking
     * @param chunkCount Number of chunks processed
     * @param processingTime Time taken to process chunks
     */
    private updateProcessingMetrics;
    /**
     * Calculate adaptive high water mark based on processing performance
     * @returns Adaptive high water mark value
     */
    private calculateAdaptiveHighWaterMark;
    /**
     * Determine optimal chunk size based on content type and data size
     * @param contentType MIME type of content
     * @param dataSize Size of data to process
     * @returns Optimal chunk size
     */
    private determineOptimalChunkSize;
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
     * Process data in chunks with progress tracking
     * @param data Data to process
     * @param chunkSize Size of each chunk
     * @param options Processing options
     * @returns Promise resolving to chunked process result
     */
    processInChunks(data: Buffer, chunkSize?: number, options?: StreamOptions): Promise<ChunkedProcessResult>;
    /**
     * Process a stream in chunks with backpressure handling
     * @param stream Readable stream to process
     * @param chunkSize Size of each chunk
     * @param options Processing options
     * @returns Promise resolving to array of chunks
     */
    processStreamInChunks(stream: Readable, chunkSize?: number, options?: StreamOptions): Promise<Buffer[]>;
    /**
     * Process a stream entry in chunks
     * @param entry Stream entry to process
     * @param chunkSize Size of each chunk
     * @param options Processing options
     * @returns Promise resolving to chunked process result
     */
    processStreamEntryInChunks(entry: StreamEntry, chunkSize?: number, options?: StreamOptions): Promise<ChunkedProcessResult>;
    /**
     * Create a chunked processing transform stream
     * @param chunkSize Size of each chunk
     * @param options Processing options
     * @returns Transform stream that outputs chunks
     */
    createChunkedTransform(chunkSize?: number, options?: StreamOptions): Transform;
    /**
     * Get current memory usage
     * @returns Current memory usage information
     */
    getMemoryUsage(): import("./MemoryMonitor").MemoryUsage;
    /**
     * Get memory limit
     * @returns Memory limit in bytes
     */
    getMemoryLimit(): number;
    /**
     * Check if memory limit is exceeded
     * @returns True if memory limit is exceeded
     */
    isMemoryLimitExceeded(): boolean;
}
//# sourceMappingURL=ChunkedProcessor.d.ts.map
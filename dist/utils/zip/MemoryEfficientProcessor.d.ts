import { Readable } from 'stream';
import { StreamEntry, StreamOptions } from '../../types/streaming';
/**
 * Result of memory efficient processing
 */
export interface MemoryEfficientProcessResult {
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
 * Memory-efficient stream processor for large file handling
 */
export declare class MemoryEfficientProcessor {
    private memoryMonitor;
    private progressTracker;
    private defaultChunkSize;
    private memoryCheckCounter;
    private readonly MEMORY_CHECK_INTERVAL;
    private hooksService;
    private jujutsuService;
    private verificationService;
    /**
     * Create a memory-efficient processor
     * @param memoryLimit Maximum memory usage in bytes (default: no limit)
     * @param defaultChunkSize Default chunk size for processing (default: 64KB)
     */
    constructor(memoryLimit?: number, defaultChunkSize?: number);
    /**
     * Process a stream with memory-efficient chunked reading
     * @param stream Readable stream to process
     * @param chunkSize Size of chunks to read at a time
     * @param options Processing options
     * @returns Promise resolving to processed buffer
     */
    processStream(stream: Readable, chunkSize?: number, options?: StreamOptions): Promise<Buffer>;
    /**
     * Process a stream entry with memory-efficient techniques
     * @param entry Stream entry to process
     * @param options Processing options
     * @returns Promise resolving to processed buffer
     */
    processStreamEntry(entry: StreamEntry, options?: StreamOptions): Promise<Buffer>;
    /**
     * Process multiple stream entries with memory-efficient techniques
     * @param entries Stream entries to process
     * @param options Processing options
     * @returns Promise resolving to array of processed buffers
     */
    processStreamEntries(entries: StreamEntry[], options?: StreamOptions): Promise<Buffer[]>;
    /**
     * Record operation for agentic-jujutsu version control
     * @param operationType Type of operation
     * @param dataSize Size of data processed
     * @param success Whether operation was successful
     * @param details Additional details
     */
    private recordOperation;
    /**
     * Process entries sequentially with memory monitoring
     */
    private processEntriesSequential;
    /**
     * Process entries in parallel with memory monitoring
     */
    private processEntriesParallel;
    /**
     * Worker pool function for parallel processing with progress tracking
     */
    private processWorkerPool;
    /**
     * Process data in chunks with progress tracking
     * @param data Data to process
     * @param chunkSize Size of each chunk
     * @param options Processing options
     * @returns Promise resolving to chunked process result
     */
    processInChunks(data: Buffer, chunkSize?: number, options?: StreamOptions): Promise<MemoryEfficientProcessResult>;
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
//# sourceMappingURL=MemoryEfficientProcessor.d.ts.map
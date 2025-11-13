import { StreamEntry, StreamOptions } from '../../types/streaming';
/**
 * Streaming ZIP extractor for memory-efficient processing
 */
export declare class StreamingZipExtractor {
    private memoryMonitor;
    private progressTracker;
    private static readonly EMPTY_STREAM;
    private maxEntriesInMemory;
    private hooksService;
    private jujutsuService;
    private verificationService;
    /**
     * Create a streaming ZIP extractor
     * @param memoryLimit Maximum memory usage in bytes (default: 100MB)
     * @param maxEntriesInMemory Maximum number of entries to keep in memory (default: 1000)
     */
    constructor(memoryLimit?: number, maxEntriesInMemory?: number);
    /**
     * Extract ZIP file entries as streams with streaming processing
     * @param buffer ZIP file buffer
     * @param options Streaming options
     * @returns Promise resolving to array of stream entries
     */
    extractStreams(buffer: Buffer, options?: StreamOptions): Promise<StreamEntry[]>;
    /**
     * Process ZIP entries with streaming callback for memory-efficient processing
     * @param buffer ZIP file buffer
     * @param entryCallback Callback function for each entry
     * @param options Streaming options
     */
    processEntriesStream(buffer: Buffer, entryCallback: (entry: StreamEntry) => Promise<void>, options?: StreamOptions): Promise<void>;
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
    getMemoryUsage(): import("./MemoryMonitor").MemoryUsage;
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
}
//# sourceMappingURL=StreamingZipExtractor.d.ts.map
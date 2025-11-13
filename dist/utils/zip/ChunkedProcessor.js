"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChunkedProcessor = void 0;
const stream_1 = require("stream");
const ProgressTracker_1 = require("./ProgressTracker");
const MemoryMonitor_1 = require("./MemoryMonitor");
const mime_types_1 = require("mime-types");
const perf_hooks_1 = require("perf_hooks");
/**
 * Chunked processor for memory-efficient data processing
 */
class ChunkedProcessor {
    /**
     * Create a chunked processor
     * @param memoryLimit Maximum memory usage in bytes (default: no limit)
     * @param defaultChunkSize Default chunk size (default: 64KB)
     */
    constructor(memoryLimit, defaultChunkSize) {
        this.progressTracker = null;
        this.bufferPool = [];
        this.MAX_POOL_SIZE = 100;
        this.currentChunk = null;
        this.currentOffset = 0;
        this.processingMetrics = {
            chunksPerSecond: [],
            avgProcessingTime: 0,
            lastProcessed: 0
        };
        this.memoryHistory = [];
        this.HISTORY_SIZE = 10;
        this.memoryMonitor = new MemoryMonitor_1.MemoryMonitor(memoryLimit);
        this.defaultChunkSize = defaultChunkSize || 64 * 1024; // 64KB default
    }
    /**
     * Get a buffer from the pool or create a new one
     * @param size Size of buffer needed
     * @returns Buffer from pool or newly allocated buffer
     */
    getBuffer(size) {
        // Try to reuse buffer from pool
        const bufferIndex = this.bufferPool.findIndex(buf => buf.length >= size);
        if (bufferIndex !== -1) {
            return this.bufferPool.splice(bufferIndex, 1)[0];
        }
        return Buffer.alloc(size);
    }
    /**
     * Release a buffer back to the pool
     * @param buffer Buffer to release
     */
    releaseBuffer(buffer) {
        if (this.bufferPool.length < this.MAX_POOL_SIZE) {
            this.bufferPool.push(buffer);
        }
        // Otherwise, let it be garbage collected
    }
    /**
     * Update memory usage history for trend analysis
     * @param currentUsage Current memory usage percentage
     */
    updateMemoryHistory(currentUsage) {
        this.memoryHistory.push(currentUsage);
        if (this.memoryHistory.length > this.HISTORY_SIZE) {
            this.memoryHistory.shift();
        }
    }
    /**
     * Predict memory usage trend
     * @returns Trend direction
     */
    predictMemoryTrend() {
        if (this.memoryHistory.length < 3)
            return 'stable';
        const recent = this.memoryHistory.slice(-3);
        const trend = recent[recent.length - 1] - recent[0];
        if (trend > 5)
            return 'increasing';
        if (trend < -5)
            return 'decreasing';
        return 'stable';
    }
    /**
     * Calculate adaptive delay based on system load
     * @returns Delay in milliseconds
     */
    calculateAdaptiveDelay() {
        const memoryUsage = this.memoryMonitor.getUsagePercentage();
        // Exponential backoff based on memory usage
        if (memoryUsage > 90) {
            return 100; // High delay under critical load
        }
        else if (memoryUsage > 75) {
            return 50; // Medium delay under high load
        }
        else if (memoryUsage > 60) {
            return 25; // Low delay under moderate load
        }
        return 0; // No delay under light load
    }
    /**
     * Update processing metrics for performance tracking
     * @param chunkCount Number of chunks processed
     * @param processingTime Time taken to process chunks
     */
    updateProcessingMetrics(chunkCount, processingTime) {
        const now = perf_hooks_1.performance.now();
        const chunksPerSec = chunkCount / (processingTime / 1000);
        this.processingMetrics.chunksPerSecond.push(chunksPerSec);
        this.processingMetrics.lastProcessed = now;
        if (this.processingMetrics.chunksPerSecond.length > 20) {
            this.processingMetrics.chunksPerSecond.shift();
        }
        // Update average processing time
        if (this.processingMetrics.avgProcessingTime === 0) {
            this.processingMetrics.avgProcessingTime = processingTime;
        }
        else {
            this.processingMetrics.avgProcessingTime =
                (this.processingMetrics.avgProcessingTime + processingTime) / 2;
        }
    }
    /**
     * Calculate adaptive high water mark based on processing performance
     * @returns Adaptive high water mark value
     */
    calculateAdaptiveHighWaterMark() {
        if (this.processingMetrics.chunksPerSecond.length === 0) {
            return this.defaultChunkSize;
        }
        const avgChunksPerSec = this.processingMetrics.chunksPerSecond.reduce((a, b) => a + b, 0) /
            this.processingMetrics.chunksPerSecond.length;
        // Adjust based on processing speed
        if (avgChunksPerSec > 1000) {
            return Math.min(this.defaultChunkSize * 4, 64 * 1024); // Increase buffer for fast processing (max 64KB)
        }
        else if (avgChunksPerSec < 100) {
            return Math.max(this.defaultChunkSize / 4, 4 * 1024); // Decrease buffer for slow processing (min 4KB)
        }
        return this.defaultChunkSize;
    }
    /**
     * Determine optimal chunk size based on content type and data size
     * @param contentType MIME type of content
     * @param dataSize Size of data to process
     * @returns Optimal chunk size
     */
    determineOptimalChunkSize(contentType, dataSize) {
        // Different optimal sizes for different content types
        switch (contentType) {
            case 'text/plain':
            case 'application/json':
                // Text content: smaller chunks for better processing
                return Math.min(32 * 1024, dataSize); // 32KB max for text
            case 'image/jpeg':
            case 'image/png':
                // Binary content: larger chunks for efficiency
                return Math.min(128 * 1024, dataSize); // 128KB max for images
            case 'video/mp4':
                // Large binary content: even larger chunks
                return Math.min(512 * 1024, dataSize); // 512KB max for video
            default:
                // Default: 64KB chunks
                return Math.min(this.defaultChunkSize, dataSize);
        }
    }
    /**
     * Write chunk efficiently using buffer pooling
     * @param chunk Chunk to write
     */
    writeChunkEfficiently(chunk) {
        const chunks = [];
        if (!this.currentChunk) {
            const highWaterMark = this.calculateAdaptiveHighWaterMark();
            this.currentChunk = this.getBuffer(highWaterMark);
            this.currentOffset = 0;
        }
        const availableSpace = this.currentChunk.length - this.currentOffset;
        if (chunk.length <= availableSpace) {
            // Fit entire chunk in current buffer
            chunk.copy(this.currentChunk, this.currentOffset);
            this.currentOffset += chunk.length;
        }
        else {
            // Split chunk across multiple buffers
            const firstPart = chunk.slice(0, availableSpace);
            firstPart.copy(this.currentChunk, this.currentOffset);
            // Push current chunk
            chunks.push(Buffer.from(this.currentChunk.buffer, this.currentChunk.byteOffset, this.currentOffset));
            // Process remaining part
            const remaining = chunk.slice(availableSpace);
            const highWaterMark = this.calculateAdaptiveHighWaterMark();
            this.currentChunk = this.getBuffer(highWaterMark);
            this.currentOffset = 0;
            if (remaining.length > 0) {
                chunks.push(...this.writeChunkEfficiently(remaining)); // Recursive call for remaining data
            }
        }
        return chunks;
    }
    /**
     * Flush any remaining data in current chunk
     * @returns Remaining data buffer or null if none
     */
    flushCurrentChunk() {
        if (this.currentChunk && this.currentOffset > 0) {
            const remainingData = Buffer.from(this.currentChunk.buffer, this.currentChunk.byteOffset, this.currentOffset);
            const highWaterMark = this.calculateAdaptiveHighWaterMark();
            this.releaseBuffer(this.currentChunk);
            this.currentChunk = this.getBuffer(highWaterMark);
            this.currentOffset = 0;
            return remainingData;
        }
        return null;
    }
    /**
     * Process data in chunks with progress tracking
     * @param data Data to process
     * @param chunkSize Size of each chunk
     * @param options Processing options
     * @returns Promise resolving to chunked process result
     */
    async processInChunks(data, chunkSize = this.defaultChunkSize, options) {
        // Check memory before processing
        if (this.memoryMonitor.isLimitExceeded()) {
            throw new Error('Memory limit exceeded before processing');
        }
        const startTime = perf_hooks_1.performance.now();
        const totalSize = data.length;
        let processedSize = 0;
        let chunkCount = 0;
        // Update memory history for trend analysis
        const memoryUsage = this.memoryMonitor.getUsagePercentage();
        this.updateMemoryHistory(memoryUsage);
        // Determine optimal chunk size based on content type (default to binary)
        const optimalChunkSize = this.determineOptimalChunkSize('application/octet-stream', data.length);
        const effectiveChunkSize = Math.min(chunkSize, optimalChunkSize);
        // Initialize progress tracker if callback provided
        if (options?.onProgress) {
            this.progressTracker = new ProgressTracker_1.ProgressTracker(Math.ceil(totalSize / effectiveChunkSize));
        }
        // For empty data, return immediately
        if (totalSize === 0) {
            const processingTime = perf_hooks_1.performance.now() - startTime;
            const memoryUsage = this.memoryMonitor.getCurrentUsage().heapUsed;
            // Update processing metrics
            this.updateProcessingMetrics(0, processingTime);
            return {
                chunks: [],
                totalSize: 0,
                processingTime,
                memoryUsage
            };
        }
        // Pre-calculate number of chunks to optimize array allocation
        const expectedChunks = Math.ceil(totalSize / effectiveChunkSize);
        const resultChunks = new Array(expectedChunks);
        try {
            // Process data in chunks with efficient slicing
            for (let i = 0, resultIndex = 0; i < data.length; i += effectiveChunkSize, resultIndex++) {
                // Check memory limit during processing
                if (this.memoryMonitor.isLimitExceeded()) {
                    throw new Error('Memory limit exceeded during processing');
                }
                // Use subarray for zero-copy views when possible
                const chunk = data.subarray(i, i + effectiveChunkSize);
                resultChunks[resultIndex] = chunk;
                processedSize += chunk.length;
                chunkCount++;
                // Update progress tracking
                if (this.progressTracker && options?.onProgress) {
                    this.progressTracker.update(resultIndex + 1);
                    const progress = this.progressTracker.getProgress();
                    options.onProgress({
                        ...progress,
                        processed: processedSize,
                        total: totalSize
                    });
                }
                // Apply adaptive backpressure if needed
                const delay = this.calculateAdaptiveDelay();
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            const processingTime = perf_hooks_1.performance.now() - startTime;
            const memoryUsage = this.memoryMonitor.getCurrentUsage().heapUsed;
            // Update processing metrics
            this.updateProcessingMetrics(chunkCount, processingTime);
            return {
                chunks: resultChunks,
                totalSize,
                processingTime,
                memoryUsage
            };
        }
        catch (error) {
            throw new Error(`Failed to process data in chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Process a stream in chunks with backpressure handling
     * @param stream Readable stream to process
     * @param chunkSize Size of each chunk
     * @param options Processing options
     * @returns Promise resolving to array of chunks
     */
    async processStreamInChunks(stream, chunkSize = this.defaultChunkSize, options) {
        const startTime = perf_hooks_1.performance.now();
        let totalSize = 0;
        let chunkCount = 0;
        const allChunks = [];
        return new Promise((resolve, reject) => {
            // Check memory before processing
            if (this.memoryMonitor.isLimitExceeded()) {
                return reject(new Error('Memory limit exceeded before processing'));
            }
            // Set up chunked processing with adaptive backpressure
            stream.on('data', async (chunk) => {
                try {
                    // Check memory limit during processing
                    if (this.memoryMonitor.isLimitExceeded()) {
                        stream.destroy();
                        return reject(new Error('Memory limit exceeded during processing'));
                    }
                    totalSize += chunk.length;
                    // Update memory history for trend analysis
                    const memoryUsage = this.memoryMonitor.getUsagePercentage();
                    this.updateMemoryHistory(memoryUsage);
                    // Use efficient chunk writing with buffer pooling
                    const writtenChunks = this.writeChunkEfficiently(chunk);
                    allChunks.push(...writtenChunks);
                    chunkCount += writtenChunks.length;
                    // Apply adaptive backpressure if needed
                    const delay = this.calculateAdaptiveDelay();
                    if (delay > 0) {
                        stream.pause();
                        await new Promise(resolve => setTimeout(resolve, delay));
                        if (!this.memoryMonitor.isLimitExceeded()) {
                            stream.resume();
                        }
                    }
                    // Apply backpressure based on buffer levels
                    const adaptiveHighWaterMark = this.calculateAdaptiveHighWaterMark();
                    if (stream.readableLength > (options?.highWaterMark || adaptiveHighWaterMark * 4)) {
                        stream.pause();
                        setImmediate(() => {
                            if (!this.memoryMonitor.isLimitExceeded()) {
                                stream.resume();
                            }
                        });
                    }
                    // Update progress tracking
                    if (this.progressTracker && options?.onProgress) {
                        const progress = {
                            percentage: Math.round((totalSize / totalSize) * 100), // Always 100% for single data processing
                            processed: totalSize,
                            total: totalSize,
                            memoryUsage: this.memoryMonitor.getCurrentUsage().heapUsed,
                            rate: chunkCount / ((perf_hooks_1.performance.now() - startTime) / 1000)
                        };
                        options.onProgress(progress);
                    }
                }
                catch (error) {
                    stream.destroy();
                    reject(new Error(`Stream processing error: ${error instanceof Error ? error.message : 'Unknown error'}`));
                }
            });
            stream.on('end', () => {
                try {
                    // Flush any remaining data
                    const remainingChunk = this.flushCurrentChunk();
                    if (remainingChunk) {
                        allChunks.push(remainingChunk);
                        chunkCount++;
                    }
                    // Update processing metrics
                    const processingTime = perf_hooks_1.performance.now() - startTime;
                    this.updateProcessingMetrics(chunkCount, processingTime);
                    resolve(allChunks);
                }
                catch (error) {
                    reject(new Error(`Failed to finalize stream processing: ${error instanceof Error ? error.message : 'Unknown error'}`));
                }
            });
            stream.on('error', (error) => {
                reject(new Error(`Stream processing error: ${error.message}`));
            });
        });
    }
    /**
     * Process a stream entry in chunks
     * @param entry Stream entry to process
     * @param chunkSize Size of each chunk
     * @param options Processing options
     * @returns Promise resolving to chunked process result
     */
    async processStreamEntryInChunks(entry, chunkSize = this.defaultChunkSize, options) {
        // Update memory history for trend analysis
        const memoryUsage = this.memoryMonitor.getUsagePercentage();
        this.updateMemoryHistory(memoryUsage);
        if (entry.isDirectory) {
            return {
                chunks: [],
                totalSize: 0,
                processingTime: 0,
                memoryUsage: this.memoryMonitor.getCurrentUsage().heapUsed
            };
        }
        const startTime = perf_hooks_1.performance.now();
        // Determine optimal chunk size based on content type
        const contentType = (0, mime_types_1.lookup)(entry.name) || 'application/octet-stream';
        const optimalChunkSize = this.determineOptimalChunkSize(contentType, entry.size);
        const effectiveChunkSize = Math.min(chunkSize, optimalChunkSize);
        const enhancedOptions = {
            ...options,
            contentType,
            knownTotalSize: entry.size
        };
        try {
            const chunks = await this.processStreamInChunks(entry.stream, effectiveChunkSize, enhancedOptions);
            const processingTime = perf_hooks_1.performance.now() - startTime;
            const memoryUsage = this.memoryMonitor.getCurrentUsage().heapUsed;
            const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            // Update processing metrics
            const chunkCount = chunks.length;
            this.updateProcessingMetrics(chunkCount, processingTime);
            return {
                chunks,
                totalSize,
                processingTime,
                memoryUsage
            };
        }
        catch (error) {
            throw new Error(`Failed to process stream entry ${entry.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create a chunked processing transform stream
     * @param chunkSize Size of each chunk
     * @param options Processing options
     * @returns Transform stream that outputs chunks
     */
    createChunkedTransform(chunkSize = this.defaultChunkSize, options) {
        let pendingData = null;
        const memoryMonitor = this.memoryMonitor; // Capture reference to memory monitor
        const self = this; // Capture reference to this instance
        return new stream_1.Transform({
            transform(chunk, encoding, callback) {
                try {
                    // Check memory limit
                    if (memoryMonitor.isLimitExceeded()) {
                        callback(new Error('Memory limit exceeded during chunked processing'));
                        return;
                    }
                    // Update memory history for trend analysis
                    const memoryUsage = memoryMonitor.getUsagePercentage();
                    self.updateMemoryHistory(memoryUsage);
                    // Combine with pending data if exists
                    let dataToProcess = pendingData ? Buffer.concat([pendingData, chunk]) : chunk;
                    pendingData = null;
                    // Process buffer in chunks with efficient slicing
                    while (dataToProcess.length >= chunkSize) {
                        const processChunk = dataToProcess.subarray(0, chunkSize);
                        dataToProcess = dataToProcess.subarray(chunkSize);
                        this.push(processChunk);
                    }
                    // Store remaining data for next chunk
                    pendingData = dataToProcess.length > 0 ? dataToProcess : null;
                    // Apply adaptive backpressure if needed
                    const delay = self.calculateAdaptiveDelay();
                    if (delay > 0) {
                        setTimeout(() => callback(), delay);
                    }
                    else {
                        callback();
                    }
                }
                catch (error) {
                    callback(new Error(`Chunked transform error: ${error instanceof Error ? error.message : 'Unknown error'}`));
                }
            },
            flush(callback) {
                try {
                    // Process any remaining data
                    if (pendingData && pendingData.length > 0) {
                        this.push(pendingData);
                    }
                    // Release any pooled buffers
                    if (self.currentChunk) {
                        self.releaseBuffer(self.currentChunk);
                        self.currentChunk = null;
                        self.currentOffset = 0;
                    }
                    callback();
                }
                catch (error) {
                    callback(new Error(`Chunked transform flush error: ${error instanceof Error ? error.message : 'Unknown error'}`));
                }
            }
        });
    }
    /**
     * Get current memory usage
     * @returns Current memory usage information
     */
    getMemoryUsage() {
        return this.memoryMonitor.getCurrentUsage();
    }
    /**
     * Get memory limit
     * @returns Memory limit in bytes
     */
    getMemoryLimit() {
        return this.memoryMonitor.getLimit();
    }
    /**
     * Check if memory limit is exceeded
     * @returns True if memory limit is exceeded
     */
    isMemoryLimitExceeded() {
        return this.memoryMonitor.isLimitExceeded();
    }
}
exports.ChunkedProcessor = ChunkedProcessor;
//# sourceMappingURL=ChunkedProcessor.js.map
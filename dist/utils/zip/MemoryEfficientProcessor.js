"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryEfficientProcessor = void 0;
const MemoryMonitor_1 = require("./MemoryMonitor");
const ProgressTracker_1 = require("./ProgressTracker");
const FilterHooksService_1 = require("../../filters/hooks/FilterHooksService");
const AgenticJujutsuService_1 = require("../../github/files/AgenticJujutsuService");
const ZipVerificationService_1 = require("./ZipVerificationService");
/**
 * Memory-efficient stream processor for large file handling
 */
class MemoryEfficientProcessor {
    /**
     * Create a memory-efficient processor
     * @param memoryLimit Maximum memory usage in bytes (default: no limit)
     * @param defaultChunkSize Default chunk size for processing (default: 64KB)
     */
    constructor(memoryLimit, defaultChunkSize) {
        this.progressTracker = null;
        this.memoryCheckCounter = 0;
        this.MEMORY_CHECK_INTERVAL = 10; // Check every 10 chunks
        this.memoryMonitor = new MemoryMonitor_1.MemoryMonitor(memoryLimit);
        this.defaultChunkSize = defaultChunkSize || 64 * 1024; // 64KB default
        this.hooksService = FilterHooksService_1.FilterHooksService.getInstance();
        this.jujutsuService = AgenticJujutsuService_1.AgenticJujutsuService.getInstance();
        this.verificationService = ZipVerificationService_1.ZipVerificationService.getInstance();
    }
    /**
     * Process a stream with memory-efficient chunked reading
     * @param stream Readable stream to process
     * @param chunkSize Size of chunks to read at a time
     * @param options Processing options
     * @returns Promise resolving to processed buffer
     */
    async processStream(stream, chunkSize = this.defaultChunkSize, options) {
        // Pre-task hook
        await this.hooksService.preTask(`Processing stream with chunk size ${chunkSize}`);
        return new Promise((resolve, reject) => {
            let totalSize = 0;
            let chunks = [];
            let resultBuffer = null;
            let offset = 0;
            const startTime = Date.now();
            // Check memory before processing
            if (this.memoryMonitor.isLimitExceeded()) {
                const error = new Error('Memory limit exceeded before processing');
                this.recordOperation('processStream', 0, false, error.message).catch(console.warn);
                return reject(error);
            }
            // Set up backpressure handling
            stream.on('data', (chunk) => {
                // Check memory limit during processing (with sampling interval)
                this.memoryCheckCounter++;
                if (this.memoryCheckCounter % this.MEMORY_CHECK_INTERVAL === 0 && this.memoryMonitor.isLimitExceeded()) {
                    stream.destroy();
                    const error = new Error('Memory limit exceeded during processing');
                    this.recordOperation('processStream', totalSize, false, error.message).catch(console.warn);
                    return reject(error);
                }
                totalSize += chunk.length;
                // If we haven't allocated yet, try to pre-allocate buffer based on chunk size
                if (!resultBuffer) {
                    try {
                        // Use a reasonable default size
                        const estimatedSize = 1024 * 1024; // Default to 1MB
                        resultBuffer = Buffer.allocUnsafe(estimatedSize);
                        offset = 0;
                    }
                    catch (allocError) {
                        // Fall back to chunked approach if allocation fails
                        resultBuffer = null;
                        chunks = [chunk];
                        return;
                    }
                }
                if (resultBuffer) {
                    // Efficient copy to pre-allocated buffer
                    if (offset + chunk.length <= resultBuffer.length) {
                        chunk.copy(resultBuffer, offset);
                        offset += chunk.length;
                    }
                    else {
                        // Handle case where chunk would overflow buffer
                        const completedBuffer = Buffer.allocUnsafe(offset);
                        resultBuffer.copy(completedBuffer, 0, 0, offset);
                        resultBuffer = null;
                        chunks = [completedBuffer, chunk];
                    }
                }
                else {
                    // Collect chunks for later concatenation
                    chunks.push(chunk);
                }
                // Apply backpressure if needed
                if (stream.readableLength > (options?.highWaterMark || chunkSize * 2)) {
                    stream.pause();
                    setImmediate(() => stream.resume());
                }
            });
            stream.on('end', async () => {
                try {
                    let result;
                    if (resultBuffer && offset === totalSize) {
                        // If we successfully used pre-allocated buffer, return it
                        // Trim to exact size if needed
                        result = offset < resultBuffer.length ? resultBuffer.subarray(0, offset) : resultBuffer;
                    }
                    else {
                        // Fall back to concatenation for collected chunks
                        result = Buffer.concat(chunks);
                    }
                    const processingTime = Date.now() - startTime;
                    // Post-edit hook
                    await this.hooksService.postEdit('stream-data', 'Processed stream');
                    // Record successful operation
                    await this.recordOperation('processStream', totalSize, true, `Processed ${totalSize} bytes in ${processingTime}ms`);
                    resolve(result);
                }
                catch (error) {
                    const errorMessage = `Failed to process chunks: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    this.recordOperation('processStream', totalSize, false, errorMessage).catch(console.warn);
                    reject(new Error(errorMessage));
                }
            });
            stream.on('error', async (error) => {
                const errorMessage = `Stream processing error: ${error.message}`;
                await this.recordOperation('processStream', totalSize, false, errorMessage).catch(console.warn);
                reject(new Error(errorMessage));
            });
        });
    }
    /**
     * Process a stream entry with memory-efficient techniques
     * @param entry Stream entry to process
     * @param options Processing options
     * @returns Promise resolving to processed buffer
     */
    async processStreamEntry(entry, options) {
        // Pre-task hook
        await this.hooksService.preTask(`Processing stream entry: ${entry.name}`);
        const startTime = Date.now();
        if (entry.isDirectory) {
            const processingTime = Date.now() - startTime;
            // Calculate truth score for directory processing
            const truthScore = this.verificationService.calculateTruthScore([entry], {
                extractedCount: 1,
                totalSize: 0,
                entries: [{
                        name: entry.name,
                        size: 0,
                        compressedSize: 0,
                        lastModified: new Date(),
                        isDirectory: true,
                        isFile: false
                    }],
                warnings: []
            }, processingTime);
            await this.hooksService.postTask({
                totalFiles: 1,
                includedFiles: 1,
                excludedFiles: 0,
                reasons: {},
                processingTimeMs: processingTime
            }, truthScore);
            await this.recordOperation('processStreamEntry', 0, true, `Processed directory: ${entry.name}`);
            return Buffer.alloc(0); // Empty buffer for directories
        }
        try {
            const result = await this.processStream(entry.stream, this.defaultChunkSize, options);
            const processingTime = Date.now() - startTime;
            // Post-edit hook
            await this.hooksService.postEdit(entry.name, 'Processed stream entry');
            // Calculate truth score
            const truthScore = this.verificationService.calculateTruthScore([entry], {
                extractedCount: 1,
                totalSize: result.length,
                entries: [{
                        name: entry.name,
                        size: result.length,
                        compressedSize: 0,
                        lastModified: new Date(),
                        isDirectory: false,
                        isFile: true
                    }],
                warnings: []
            }, processingTime);
            await this.hooksService.postTask({
                totalFiles: 1,
                includedFiles: 1,
                excludedFiles: 0,
                reasons: {},
                processingTimeMs: processingTime
            }, truthScore);
            // Record successful operation
            await this.recordOperation('processStreamEntry', entry.size, true, `Processed file: ${entry.name}`);
            return result;
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // Calculate truth score for error case
            const truthScore = this.verificationService.calculateTruthScore([entry], {
                extractedCount: 0,
                totalSize: 0,
                entries: [{
                        name: entry.name,
                        size: entry.size,
                        compressedSize: 0,
                        lastModified: new Date(),
                        isDirectory: entry.isDirectory,
                        isFile: !entry.isDirectory
                    }],
                warnings: [errorMessage]
            }, processingTime);
            await this.hooksService.postTask({
                totalFiles: 1,
                includedFiles: 0,
                excludedFiles: 0,
                reasons: {},
                processingTimeMs: processingTime
            }, truthScore);
            // Record failed operation
            await this.recordOperation('processStreamEntry', entry.size, false, `Failed to process ${entry.name}: ${errorMessage}`);
            throw error;
        }
    }
    /**
     * Process multiple stream entries with memory-efficient techniques
     * @param entries Stream entries to process
     * @param options Processing options
     * @returns Promise resolving to array of processed buffers
     */
    async processStreamEntries(entries, options) {
        // Pre-task hook
        await this.hooksService.preTask(`Processing ${entries.length} stream entries`);
        // Check memory before processing
        if (this.memoryMonitor.isLimitExceeded()) {
            const error = new Error('Memory limit exceeded before processing');
            await this.recordOperation('processStreamEntries', 0, false, error.message);
            throw error;
        }
        try {
            // Process entries with optional parallelization
            const results = options?.parallel && options.parallelWorkers
                ? await this.processEntriesParallel(entries, options)
                : await this.processEntriesSequential(entries, options);
            // Post-task hook
            await this.hooksService.postTask({
                totalFiles: entries.length,
                includedFiles: entries.filter(e => !e.isDirectory).length,
                excludedFiles: 0,
                reasons: {},
                processingTimeMs: 0 // This would need to be calculated
            });
            // Record successful operation
            const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
            await this.recordOperation('processStreamEntries', totalSize, true, `Processed ${entries.length} entries`);
            return results;
        }
        catch (error) {
            // Record failed operation
            const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
            await this.recordOperation('processStreamEntries', totalSize, false, `Failed to process entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    /**
     * Record operation for agentic-jujutsu version control
     * @param operationType Type of operation
     * @param dataSize Size of data processed
     * @param success Whether operation was successful
     * @param details Additional details
     */
    async recordOperation(operationType, dataSize, success, details) {
        try {
            // Record operation with agentic-jujutsu service
            await this.jujutsuService.recordOperation({
                operation: 'update',
                path: `memory-processor/${operationType}`,
                content: `Processing ${dataSize} bytes`,
                message: details,
                branch: 'main'
            }, {
                success,
                error: success ? undefined : details,
                path: `memory-processor/${operationType}`
            }, 'memory-processor-agent');
        }
        catch (error) {
            console.warn('Failed to record operation with agentic-jujutsu:', error);
        }
    }
    /**
     * Process entries sequentially with memory monitoring
     */
    async processEntriesSequential(entries, options) {
        const results = [];
        const startTime = Date.now();
        for (const [index, entry] of entries.entries()) {
            // Check memory limit during processing (with sampling interval)
            this.memoryCheckCounter++;
            if (this.memoryCheckCounter % this.MEMORY_CHECK_INTERVAL === 0 && this.memoryMonitor.isLimitExceeded()) {
                throw new Error('Memory limit exceeded during processing');
            }
            const result = await this.processStreamEntry(entry, options);
            results.push(result);
            // Call progress callback if provided
            if (options?.onProgress) {
                const progress = {
                    percentage: Math.round(((index + 1) / entries.length) * 100),
                    processed: index + 1,
                    total: entries.length,
                    memoryUsage: this.memoryMonitor.getCurrentUsage().heapUsed
                };
                options.onProgress(progress);
            }
        }
        return results;
    }
    /**
     * Process entries in parallel with memory monitoring
     */
    async processEntriesParallel(entries, options) {
        const workers = options?.parallelWorkers || 4;
        const results = new Array(entries.length);
        const processedCount = { count: 0 }; // Shared counter for progress tracking
        // Create worker pool with better distribution
        const workerPromises = [];
        const entriesPerWorker = Math.ceil(entries.length / workers);
        for (let i = 0; i < workers; i++) {
            const start = i * entriesPerWorker;
            const end = Math.min(start + entriesPerWorker, entries.length);
            const workerEntries = entries.slice(start, end);
            if (workerEntries.length > 0) {
                const workerPromise = this.processWorkerPool(workerEntries, results, start, options, processedCount, entries.length);
                workerPromises.push(workerPromise);
            }
        }
        await Promise.all(workerPromises);
        return results;
    }
    /**
     * Worker pool function for parallel processing with progress tracking
     */
    async processWorkerPool(entries, results, startIndex, options, processedCount, totalEntries) {
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            // Check memory limit during processing (with sampling interval)
            this.memoryCheckCounter++;
            if (this.memoryCheckCounter % this.MEMORY_CHECK_INTERVAL === 0 && this.memoryMonitor.isLimitExceeded()) {
                throw new Error('Memory limit exceeded during processing');
            }
            const result = await this.processStreamEntry(entry, options);
            results[startIndex + i] = result;
            // Update shared progress counter
            processedCount.count++;
            // Call progress callback if provided
            if (options?.onProgress) {
                const progress = {
                    percentage: Math.round((processedCount.count / totalEntries) * 100),
                    processed: processedCount.count,
                    total: totalEntries,
                    memoryUsage: this.memoryMonitor.getCurrentUsage().heapUsed
                };
                options.onProgress(progress);
            }
        }
    }
    /**
     * Process data in chunks with progress tracking
     * @param data Data to process
     * @param chunkSize Size of each chunk
     * @param options Processing options
     * @returns Promise resolving to chunked process result
     */
    async processInChunks(data, chunkSize = this.defaultChunkSize, options) {
        // Pre-task hook
        await this.hooksService.preTask(`Processing data in chunks (${data.length} bytes)`);
        // Check memory before processing (with sampling interval)
        this.memoryCheckCounter++;
        if (this.memoryCheckCounter % this.MEMORY_CHECK_INTERVAL === 0 && this.memoryMonitor.isLimitExceeded()) {
            const error = new Error('Memory limit exceeded before processing');
            await this.recordOperation('processInChunks', data.length, false, error.message);
            throw error;
        }
        const startTime = Date.now();
        const totalSize = data.length;
        let chunks = [];
        let processedSize = 0;
        // Initialize progress tracker if callback provided
        if (options?.onProgress) {
            this.progressTracker = new ProgressTracker_1.ProgressTracker(Math.ceil(totalSize / chunkSize));
        }
        // Pre-calculate number of chunks to optimize array allocation
        const expectedChunks = Math.ceil(totalSize / chunkSize);
        chunks = new Array(expectedChunks);
        try {
            // Process data in chunks with efficient slicing
            for (let i = 0, chunkIndex = 0; i < data.length; i += chunkSize, chunkIndex++) {
                // Check memory limit during processing (with sampling interval)
                this.memoryCheckCounter++;
                if (this.memoryCheckCounter % this.MEMORY_CHECK_INTERVAL === 0 && this.memoryMonitor.isLimitExceeded()) {
                    const error = new Error('Memory limit exceeded during processing');
                    await this.recordOperation('processInChunks', data.length, false, error.message);
                    throw error;
                }
                // Use subarray for zero-copy views when possible
                const chunk = data.subarray(i, i + chunkSize);
                chunks[chunkIndex] = chunk;
                processedSize += chunk.length;
                // Update progress tracking
                if (this.progressTracker && options?.onProgress) {
                    this.progressTracker.update(chunkIndex + 1);
                    const progress = this.progressTracker.getProgress();
                    options.onProgress({
                        ...progress,
                        processed: processedSize,
                        total: totalSize
                    });
                }
                // Apply backpressure if needed
                if (options?.highWaterMark && chunkIndex > options.highWaterMark) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            const processingTime = Date.now() - startTime;
            const memoryUsage = this.memoryMonitor.getCurrentUsage().heapUsed;
            // Post-edit hook
            await this.hooksService.postEdit('chunked-data', 'Processed data in chunks');
            // Record successful operation
            await this.recordOperation('processInChunks', totalSize, true, `Processed ${totalSize} bytes in chunks`);
            return {
                chunks,
                totalSize,
                processingTime,
                memoryUsage
            };
        }
        catch (error) {
            // Record failed operation
            await this.recordOperation('processInChunks', totalSize, false, `Failed to process data in chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
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
exports.MemoryEfficientProcessor = MemoryEfficientProcessor;
//# sourceMappingURL=MemoryEfficientProcessor.js.map
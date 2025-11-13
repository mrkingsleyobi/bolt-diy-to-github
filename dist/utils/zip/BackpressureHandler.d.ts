import { Readable, Writable } from 'stream';
import { StreamOptions } from '../../types/streaming';
/**
 * Advanced backpressure handler for stream processing
 */
export declare class BackpressureHandler {
    private memoryMonitor;
    private defaultHighWaterMark;
    private memoryHistory;
    private readonly HISTORY_SIZE;
    private processingMetrics;
    /**
     * Create a backpressure handler
     * @param memoryLimit Maximum memory usage in bytes (default: 50MB)
     * @param defaultHighWaterMark Default high water mark (default: 16KB)
     */
    constructor(memoryLimit?: number, defaultHighWaterMark?: number);
    /**
     * Calculate adaptive delay based on system load
     * @returns Delay in milliseconds
     */
    private calculateAdaptiveDelay;
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
     * Determine if backpressure should be applied
     * @returns True if backpressure should be applied
     */
    private shouldApplyBackpressure;
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
     * Apply backpressure handling to a readable stream
     * @param stream Readable stream to control
     * @param highWaterMark High water mark for backpressure (default: 16KB)
     * @param options Stream options
     * @returns Controlled readable stream
     */
    applyBackpressure(stream: Readable, highWaterMark?: number, options?: StreamOptions): Readable;
    /**
     * Create a backpressure-controlled writable stream
     * @param writeFunction Write function to wrap
     * @param highWaterMark High water mark for backpressure
     * @returns Controlled writable stream
     */
    createControlledWritable(writeFunction: (chunk: Buffer) => Promise<void>, highWaterMark?: number): Writable;
    /**
     * Monitor and control stream flow based on multiple factors
     * @param readable Readable stream to monitor
     * @param writable Writable stream to monitor
     * @param options Stream options with callbacks
     */
    monitorStreamFlow(readable: Readable, writable: Writable, options?: StreamOptions): void;
    /**
     * Apply adaptive backpressure based on system load
     * @param stream Stream to control
     * @param options Stream options
     * @returns Controlled stream with adaptive backpressure
     */
    applyAdaptiveBackpressure(stream: Readable, options?: StreamOptions): Readable;
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
//# sourceMappingURL=BackpressureHandler.d.ts.map
import { Readable, Writable, Transform } from 'stream';
import { StreamOptions } from '../../types/streaming';
import { MemoryMonitor } from './MemoryMonitor';
import { performance } from 'perf_hooks';

/**
 * Advanced backpressure handler for stream processing
 */
export class BackpressureHandler {
  private memoryMonitor: MemoryMonitor;
  private defaultHighWaterMark: number;
  private memoryHistory: number[] = [];
  private readonly HISTORY_SIZE: number = 10;
  private processingMetrics: {
    chunksPerSecond: number[];
    avgProcessingTime: number;
    lastProcessed: number;
  } = {
    chunksPerSecond: [],
    avgProcessingTime: 0,
    lastProcessed: 0
  };

  /**
   * Create a backpressure handler
   * @param memoryLimit Maximum memory usage in bytes (default: 50MB)
   * @param defaultHighWaterMark Default high water mark (default: 16KB)
   */
  constructor(memoryLimit?: number, defaultHighWaterMark?: number) {
    this.memoryMonitor = new MemoryMonitor(
      memoryLimit !== undefined ? memoryLimit : 50 * 1024 * 1024
    ); // 50MB default
    this.defaultHighWaterMark = defaultHighWaterMark || 16 * 1024; // 16KB default
  }

  /**
   * Calculate adaptive delay based on system load
   * @returns Delay in milliseconds
   */
  private calculateAdaptiveDelay(): number {
    const memoryUsage = this.memoryMonitor.getUsagePercentage();

    // Exponential backoff based on memory usage
    if (memoryUsage > 90) {
      return 100; // High delay under critical load
    } else if (memoryUsage > 75) {
      return 50;  // Medium delay under high load
    } else if (memoryUsage > 60) {
      return 25;  // Low delay under moderate load
    }
    return 0;     // No delay under light load
  }

  /**
   * Update memory usage history for trend analysis
   * @param currentUsage Current memory usage percentage
   */
  private updateMemoryHistory(currentUsage: number): void {
    this.memoryHistory.push(currentUsage);
    if (this.memoryHistory.length > this.HISTORY_SIZE) {
      this.memoryHistory.shift();
    }
  }

  /**
   * Predict memory usage trend
   * @returns Trend direction
   */
  private predictMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryHistory.length < 3) return 'stable';

    const recent = this.memoryHistory.slice(-3);
    const trend = recent[recent.length - 1] - recent[0];

    if (trend > 5) return 'increasing';
    if (trend < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Determine if backpressure should be applied
   * @returns True if backpressure should be applied
   */
  private shouldApplyBackpressure(): boolean {
    if (this.memoryMonitor.isLimitExceeded()) {
      return true;
    }

    const trend = this.predictMemoryTrend();
    const currentUsage = this.memoryMonitor.getUsagePercentage();

    // Apply backpressure earlier if memory usage is increasing
    if (trend === 'increasing' && currentUsage > 70) {
      return true;
    }

    return this.memoryMonitor.isWarningThresholdExceeded();
  }

  /**
   * Update processing metrics for performance tracking
   * @param chunkCount Number of chunks processed
   * @param processingTime Time taken to process chunks
   */
  private updateProcessingMetrics(chunkCount: number, processingTime: number): void {
    const now = performance.now();
    const chunksPerSec = chunkCount / (processingTime / 1000);

    this.processingMetrics.chunksPerSecond.push(chunksPerSec);
    this.processingMetrics.lastProcessed = now;

    if (this.processingMetrics.chunksPerSecond.length > 20) {
      this.processingMetrics.chunksPerSecond.shift();
    }

    // Update average processing time
    if (this.processingMetrics.avgProcessingTime === 0) {
      this.processingMetrics.avgProcessingTime = processingTime;
    } else {
      this.processingMetrics.avgProcessingTime =
        (this.processingMetrics.avgProcessingTime + processingTime) / 2;
    }
  }

  /**
   * Calculate adaptive high water mark based on processing performance
   * @returns Adaptive high water mark value
   */
  private calculateAdaptiveHighWaterMark(): number {
    if (this.processingMetrics.chunksPerSecond.length === 0) {
      return this.defaultHighWaterMark;
    }

    const avgChunksPerSec = this.processingMetrics.chunksPerSecond.reduce((a, b) => a + b, 0) /
                            this.processingMetrics.chunksPerSecond.length;

    // Adjust based on processing speed
    if (avgChunksPerSec > 1000) {
      return Math.min(this.defaultHighWaterMark * 4, 64 * 1024); // Increase buffer for fast processing (max 64KB)
    } else if (avgChunksPerSec < 100) {
      return Math.max(this.defaultHighWaterMark / 4, 4 * 1024); // Decrease buffer for slow processing (min 4KB)
    }

    return this.defaultHighWaterMark;
  }

  /**
   * Apply backpressure handling to a readable stream
   * @param stream Readable stream to control
   * @param highWaterMark High water mark for backpressure (default: 16KB)
   * @param options Stream options
   * @returns Controlled readable stream
   */
  applyBackpressure(stream: Readable, highWaterMark?: number, options?: StreamOptions): Readable {
    const watermark = highWaterMark || this.calculateAdaptiveHighWaterMark();
    const startTime = performance.now();
    let chunkCount = 0;

    // Create a transform stream for backpressure control
    const backpressureTransform = new Transform({
      highWaterMark: watermark,
      transform: (chunk: Buffer, encoding, callback) => {
        chunkCount++;

        // Update memory history for trend analysis
        const memoryUsage = this.memoryMonitor.getUsagePercentage();
        this.updateMemoryHistory(memoryUsage);

        // Check if backpressure should be applied
        if (this.shouldApplyBackpressure()) {
          const delay = this.calculateAdaptiveDelay();

          if (this.memoryMonitor.isLimitExceeded()) {
            // Instead of throwing an error, emit a warning and continue processing
            // This prevents unhandled error events in streams
            process.emitWarning('Memory limit exceeded during backpressure handling', 'MemoryLimitWarning');
            callback(null, chunk);
            return;
          }

          // Apply adaptive delay
          if (delay > 0) {
            setTimeout(() => {
              callback(null, chunk);
            }, delay);
          } else {
            callback(null, chunk);
          }
        } else {
          callback(null, chunk);
        }
      },

      flush: (callback) => {
        // Update processing metrics when stream completes
        const processingTime = performance.now() - startTime;
        if (chunkCount > 0) {
          this.updateProcessingMetrics(chunkCount, processingTime);
        }
        callback();
      }
    });

    // Pipe the original stream through the backpressure controller
    stream.pipe(backpressureTransform);

    // Handle stream events
    stream.on('error', (error) => {
      backpressureTransform.destroy(error);
    });

    return backpressureTransform;
  }

  /**
   * Create a backpressure-controlled writable stream
   * @param writeFunction Write function to wrap
   * @param highWaterMark High water mark for backpressure
   * @returns Controlled writable stream
   */
  createControlledWritable(
    writeFunction: (chunk: Buffer) => Promise<void>,
    highWaterMark?: number
  ): Writable {
    const watermark = highWaterMark || this.defaultHighWaterMark;
    const memoryMonitor = this.memoryMonitor; // Capture reference to memory monitor

    return new Writable({
      highWaterMark: watermark,
      write(chunk: Buffer, encoding, callback) {
        // Check memory usage
        if (memoryMonitor.isLimitExceeded()) {
          // Instead of throwing an error, emit a warning and continue processing
          // This prevents unhandled error events in streams
          process.emitWarning('Memory limit exceeded during write operation', 'MemoryLimitWarning');
          callback(null);
          return;
        }

        // Apply backpressure-aware writing
        writeFunction(chunk)
          .then(() => callback())
          .catch((error) => callback(error));
      }
    });
  }

  /**
   * Monitor and control stream flow based on multiple factors
   * @param readable Readable stream to monitor
   * @param writable Writable stream to monitor
   * @param options Stream options with callbacks
   */
  monitorStreamFlow(readable: Readable, writable: Writable, options?: StreamOptions): void {
    // Monitor based on actual stream events (event-driven approach)
    const monitorReadable = () => {
      const highWaterMark = options?.highWaterMark || this.defaultHighWaterMark * 4;

      if (readable.readableLength > highWaterMark) {
        readable.pause();

        // Resume when buffer level drops
        const checkBuffer = () => {
          const resumeWaterMark = options?.highWaterMark || this.defaultHighWaterMark * 2;

          if (readable.readableLength < resumeWaterMark) {
            if (!this.memoryMonitor.isLimitExceeded()) {
              readable.resume();
            }
          } else {
            // Continue checking with setImmediate for better performance
            setImmediate(checkBuffer);
          }
        };

        setImmediate(checkBuffer);
      }
    };

    // Attach to relevant stream events for event-driven monitoring
    readable.on('readable', monitorReadable);
    writable.on('drain', () => {
      if (!this.memoryMonitor.isLimitExceeded()) {
        readable.resume();
      }
    });

    // Monitor memory usage on data events
    readable.on('data', () => {
      if (this.memoryMonitor.isLimitExceeded()) {
        readable.pause();
        if (options?.onProgress) {
          options.onProgress({
            percentage: 0,
            processed: 0,
            total: 0,
            memoryUsage: this.memoryMonitor.getCurrentUsage().heapUsed,
            rate: 0
          });
        }
      }
    });

    // Cleanup on stream end
    const cleanup = () => {
      readable.removeListener('readable', monitorReadable);
    };

    readable.on('end', cleanup);
    writable.on('finish', cleanup);
  }

  /**
   * Apply adaptive backpressure based on system load
   * @param stream Stream to control
   * @param options Stream options
   * @returns Controlled stream with adaptive backpressure
   */
  applyAdaptiveBackpressure(stream: Readable, options?: StreamOptions): Readable {
    const startTime = performance.now();
    let chunkCount = 0;
    const watermark = options?.highWaterMark || this.calculateAdaptiveHighWaterMark();

    const adaptiveTransform = new Transform({
      highWaterMark: watermark,
      transform: (chunk: Buffer, encoding, callback) => {
        chunkCount++;

        // Update memory history for trend analysis
        const memoryUsage = this.memoryMonitor.getUsagePercentage();
        this.updateMemoryHistory(memoryUsage);

        // Check if backpressure should be applied using enhanced logic
        if (this.shouldApplyBackpressure()) {
          const delay = this.calculateAdaptiveDelay();

          if (this.memoryMonitor.isLimitExceeded()) {
            // Instead of throwing an error, emit a warning and continue processing
            // This prevents unhandled error events in streams
            process.emitWarning('Memory limit exceeded during adaptive backpressure', 'MemoryLimitWarning');
            callback(null, chunk);
            return;
          }

          // Apply adaptive delay
          if (delay > 0) {
            setTimeout(() => {
              callback(null, chunk);
            }, delay);
          } else {
            callback(null, chunk);
          }
        } else {
          callback(null, chunk);
        }
      },

      flush: (callback) => {
        // Update processing metrics when stream completes
        const processingTime = performance.now() - startTime;
        if (chunkCount > 0) {
          this.updateProcessingMetrics(chunkCount, processingTime);
        }
        callback();
      }
    });

    stream.pipe(adaptiveTransform);

    // Handle errors
    stream.on('error', (error) => {
      adaptiveTransform.destroy(error);
    });

    return adaptiveTransform;
  }

  /**
   * Get current memory usage
   * @returns Current memory usage information
   */
  getMemoryUsage() {
    return this.memoryMonitor.getCurrentUsage();
  }

  /**
   * Check if memory limit is exceeded
   * @returns True if memory limit is exceeded
   */
  isMemoryLimitExceeded(): boolean {
    return this.memoryMonitor.isLimitExceeded();
  }

  /**
   * Get memory limit
   * @returns Memory limit in bytes
   */
  getMemoryLimit(): number {
    return this.memoryMonitor.getLimit();
  }
}
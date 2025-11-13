# Task 03: Implement Backpressure Handling

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The current ZIP extraction service has basic streaming but lacks sophisticated backpressure handling for large file processing. This task implements advanced backpressure handling to prevent memory overflow.

## Current System State
- Basic streaming with yauzl library is implemented
- Simple stream piping without backpressure management
- No sophisticated flow control mechanisms
- No monitoring of stream buffer levels

## Your Task
Implement advanced backpressure handling with dynamic flow control, buffer monitoring, and adaptive processing rates.

## Test First (RED Phase)
```typescript
import { BackpressureHandler } from '../../src/utils/zip/BackpressureHandler';

describe('BackpressureHandler', () => {
  it('should create a backpressure handler instance', () => {
    const handler = new BackpressureHandler();
    expect(handler).toBeInstanceOf(BackpressureHandler);
  });

  it('should handle stream backpressure', async () => {
    const handler = new BackpressureHandler();
    const readable = new Readable();
    readable.push('test data');
    readable.push(null);

    const controlledStream = handler.applyBackpressure(readable, 1024);
    expect(controlledStream).toBeDefined();
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
import { Readable, Writable } from 'stream';

export class BackpressureHandler {
  applyBackpressure(stream: Readable, highWaterMark: number): Readable {
    const controlledStream = new Readable({
      read() {}
    });

    stream.on('data', (chunk: Buffer) => {
      if (!controlledStream.push(chunk)) {
        stream.pause();
      }
    });

    stream.on('end', () => {
      controlledStream.push(null);
    });

    controlledStream.on('drain', () => {
      stream.resume();
    });

    return controlledStream;
  }
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
import { Readable, Writable, Transform } from 'stream';
import { StreamOptions } from '../../types/streaming';
import { MemoryMonitor } from './MemoryMonitor';

/**
 * Advanced backpressure handler for stream processing
 */
export class BackpressureHandler {
  private memoryMonitor: MemoryMonitor;
  private defaultHighWaterMark: number;

  /**
   * Create a backpressure handler
   * @param memoryLimit Maximum memory usage in bytes (default: 50MB)
   * @param defaultHighWaterMark Default high water mark (default: 16KB)
   */
  constructor(memoryLimit?: number, defaultHighWaterMark?: number) {
    this.memoryMonitor = new MemoryMonitor(memoryLimit || 50 * 1024 * 1024); // 50MB default
    this.defaultHighWaterMark = defaultHighWaterMark || 16 * 1024; // 16KB default
  }

  /**
   * Apply backpressure handling to a readable stream
   * @param stream Readable stream to control
   * @param highWaterMark High water mark for backpressure (default: 16KB)
   * @param options Stream options
   * @returns Controlled readable stream
   */
  applyBackpressure(stream: Readable, highWaterMark?: number, options?: StreamOptions): Readable {
    const watermark = highWaterMark || this.defaultHighWaterMark;

    // Create a transform stream for backpressure control
    const backpressureTransform = new Transform({
      highWaterMark: watermark,
      transform(chunk: Buffer, encoding, callback) {
        // Check memory usage
        if (this.memoryMonitor && this.memoryMonitor.isLimitExceeded()) {
          callback(new Error('Memory limit exceeded during backpressure handling'));
          return;
        }

        // Apply adaptive processing based on memory usage
        if (this.memoryMonitor && this.memoryMonitor.isWarningThresholdExceeded()) {
          // Slow down processing when memory usage is high
          setTimeout(() => {
            callback(null, chunk);
          }, 10);
        } else {
          callback(null, chunk);
        }
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

    return new Writable({
      highWaterMark: watermark,
      write(chunk: Buffer, encoding, callback) {
        // Check memory usage
        if (this.memoryMonitor && this.memoryMonitor.isLimitExceeded()) {
          callback(new Error('Memory limit exceeded during write operation'));
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
    // Monitor readable stream buffer levels
    const monitorReadable = () => {
      if (readable.readableLength > (options?.highWaterMark || this.defaultHighWaterMark * 4)) {
        readable.pause();
        setTimeout(() => {
          if (!this.memoryMonitor.isLimitExceeded()) {
            readable.resume();
          }
        }, 50);
      }
    };

    // Monitor writable stream buffer levels
    const monitorWritable = () => {
      if (writable.writableLength > (options?.highWaterMark || this.defaultHighWaterMark * 4)) {
        readable.pause();
        writable.once('drain', () => {
          if (!this.memoryMonitor.isLimitExceeded()) {
            readable.resume();
          }
        });
      }
    };

    // Set up monitoring intervals
    const interval = setInterval(() => {
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
        return;
      }

      monitorReadable();
      monitorWritable();
    }, 100);

    // Clean up monitoring when streams end
    const cleanup = () => {
      clearInterval(interval);
    };

    readable.on('end', cleanup);
    writable.on('finish', cleanup);
    readable.on('error', cleanup);
    writable.on('error', cleanup);
  }

  /**
   * Apply adaptive backpressure based on system load
   * @param stream Stream to control
   * @param options Stream options
   * @returns Controlled stream with adaptive backpressure
   */
  applyAdaptiveBackpressure(stream: Readable, options?: StreamOptions): Readable {
    const adaptiveTransform = new Transform({
      highWaterMark: options?.highWaterMark || this.defaultHighWaterMark,
      transform(chunk: Buffer, encoding, callback) {
        // Check current system load
        const memoryUsage = this.memoryMonitor.getCurrentUsage();
        const memoryPercentage = this.memoryMonitor.getUsagePercentage();

        // Apply adaptive delay based on memory usage
        let delay = 0;
        if (memoryPercentage > 90) {
          delay = 100; // High delay when memory usage is critical
        } else if (memoryPercentage > 70) {
          delay = 50; // Medium delay when memory usage is high
        } else if (memoryPercentage > 50) {
          delay = 10; // Low delay when memory usage is moderate
        }

        if (delay > 0) {
          setTimeout(() => {
            callback(null, chunk);
          }, delay);
        } else {
          callback(null, chunk);
        }
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
}
```

## Verification Commands
```bash
# Compile TypeScript to verify implementation
npx tsc --noEmit src/utils/zip/BackpressureHandler.ts
```

## Success Criteria
- [ ] BackpressureHandler class created with advanced flow control
- [ ] Dynamic backpressure handling based on buffer levels
- [ ] Memory monitoring integration
- [ ] Adaptive processing rates based on system load
- [ ] Support for both readable and writable stream control
- [ ] Code compiles without errors
- [ ] Unit tests pass

## Dependencies Confirmed
- Node.js Transform and Writable stream APIs
- MemoryMonitor class
- StreamOptions type
- TypeScript compiler installed

## Next Task
task_04_implement_chunked_processing.md
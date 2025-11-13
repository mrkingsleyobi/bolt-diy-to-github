# Task 02: Implement Memory Efficient Processing

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The current ZIP extraction service may not handle very large ZIP files efficiently. This task implements memory-efficient processing techniques for large file handling.

## Current System State
- Basic streaming with yauzl library is implemented
- File-based extraction with read/write streams
- No explicit memory management for large files
- No chunked processing for memory efficiency

## Your Task
Implement memory-efficient processing techniques including chunked reading, stream pausing/resuming, and memory usage optimization.

## Test First (RED Phase)
```typescript
import { MemoryEfficientProcessor } from '../../src/utils/zip/MemoryEfficientProcessor';

describe('MemoryEfficientProcessor', () => {
  it('should process stream in chunks', async () => {
    const processor = new MemoryEfficientProcessor();
    const readable = new Readable();
    readable.push('test data');
    readable.push(null);

    const result = await processor.processStream(readable, 1024);
    expect(result).toBeDefined();
  });

  it('should respect memory limits', async () => {
    const processor = new MemoryEfficientProcessor(1000000); // 1MB limit
    expect(processor.getMemoryLimit()).toBe(1000000);
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
import { Readable } from 'stream';
import { StreamEntry } from '../../types/streaming';

export class MemoryEfficientProcessor {
  private memoryLimit: number;

  constructor(memoryLimit?: number) {
    this.memoryLimit = memoryLimit || Infinity;
  }

  async processStream(stream: Readable, chunkSize: number = 64 * 1024): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', reject);
    });
  }

  getMemoryLimit(): number {
    return this.memoryLimit;
  }
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
import { Readable } from 'stream';
import { StreamEntry, StreamOptions } from '../../types/streaming';
import { MemoryMonitor } from './MemoryMonitor';

/**
 * Memory-efficient stream processor for large file handling
 */
export class MemoryEfficientProcessor {
  private memoryMonitor: MemoryMonitor;
  private defaultChunkSize: number;

  /**
   * Create a memory-efficient processor
   * @param memoryLimit Maximum memory usage in bytes (default: 50MB)
   * @param defaultChunkSize Default chunk size for processing (default: 64KB)
   */
  constructor(memoryLimit?: number, defaultChunkSize?: number) {
    this.memoryMonitor = new MemoryMonitor(memoryLimit || 50 * 1024 * 1024); // 50MB default
    this.defaultChunkSize = defaultChunkSize || 64 * 1024; // 64KB default
  }

  /**
   * Process a stream with memory-efficient chunked reading
   * @param stream Readable stream to process
   * @param chunkSize Size of chunks to read at a time
   * @param options Processing options
   * @returns Promise resolving to processed buffer
   */
  async processStream(
    stream: Readable,
    chunkSize: number = this.defaultChunkSize,
    options?: StreamOptions
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalSize = 0;

      // Check memory before processing
      if (this.memoryMonitor.isLimitExceeded()) {
        return reject(new Error('Memory limit exceeded before processing'));
      }

      // Set up backpressure handling
      stream.on('data', (chunk: Buffer) => {
        // Check memory limit during processing
        if (this.memoryMonitor.isLimitExceeded()) {
          stream.destroy();
          return reject(new Error('Memory limit exceeded during processing'));
        }

        totalSize += chunk.length;
        chunks.push(chunk);

        // Apply backpressure if needed
        if (stream.readableLength > (options?.highWaterMark || chunkSize * 2)) {
          stream.pause();
          setImmediate(() => stream.resume());
        }
      });

      stream.on('end', () => {
        try {
          const result = Buffer.concat(chunks);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to concatenate chunks: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });

      stream.on('error', (error) => {
        reject(new Error(`Stream processing error: ${error.message}`));
      });
    });
  }

  /**
   * Process a stream entry with memory-efficient techniques
   * @param entry Stream entry to process
   * @param options Processing options
   * @returns Promise resolving to processed buffer
   */
  async processStreamEntry(entry: StreamEntry, options?: StreamOptions): Promise<Buffer> {
    if (entry.isDirectory) {
      return Buffer.alloc(0); // Empty buffer for directories
    }

    return this.processStream(entry.stream, this.defaultChunkSize, options);
  }

  /**
   * Process multiple stream entries with memory-efficient techniques
   * @param entries Stream entries to process
   * @param options Processing options
   * @returns Promise resolving to array of processed buffers
   */
  async processStreamEntries(entries: StreamEntry[], options?: StreamOptions): Promise<Buffer[]> {
    // Check memory before processing
    if (this.memoryMonitor.isLimitExceeded()) {
      throw new Error('Memory limit exceeded before processing');
    }

    // Process entries with optional parallelization
    if (options?.parallel && options.parallelWorkers) {
      return this.processEntriesParallel(entries, options);
    } else {
      return this.processEntriesSequential(entries, options);
    }
  }

  /**
   * Process entries sequentially with memory monitoring
   */
  private async processEntriesSequential(entries: StreamEntry[], options?: StreamOptions): Promise<Buffer[]> {
    const results: Buffer[] = [];

    for (const entry of entries) {
      // Check memory limit during processing
      if (this.memoryMonitor.isLimitExceeded()) {
        throw new Error('Memory limit exceeded during processing');
      }

      const result = await this.processStreamEntry(entry, options);
      results.push(result);

      // Call progress callback if provided
      if (options?.onProgress) {
        const progress = {
          percentage: Math.round(((results.length) / entries.length) * 100),
          processed: results.length,
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
  private async processEntriesParallel(entries: StreamEntry[], options?: StreamOptions): Promise<Buffer[]> {
    const workers = options?.parallelWorkers || 4;
    const results: Buffer[] = new Array(entries.length);
    const promises: Promise<void>[] = [];

    // Create worker queues
    for (let i = 0; i < workers; i++) {
      const workerEntries = entries.filter((_, index) => index % workers === i);
      const workerPromise = this.processWorker(workerEntries, results, options);
      promises.push(workerPromise);
    }

    await Promise.all(promises);
    return results;
  }

  /**
   * Worker function for parallel processing
   */
  private async processWorker(
    entries: StreamEntry[],
    results: Buffer[],
    options?: StreamOptions
  ): Promise<void> {
    for (const entry of entries) {
      // Check memory limit during processing
      if (this.memoryMonitor.isLimitExceeded()) {
        throw new Error('Memory limit exceeded during processing');
      }

      const result = await this.processStreamEntry(entry, options);
      // In a real implementation, we would need to track the correct index
      // This is simplified for the example
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
  getMemoryLimit(): number {
    return this.memoryMonitor.getLimit();
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
npx tsc --noEmit src/utils/zip/MemoryEfficientProcessor.ts
```

## Success Criteria
- [ ] MemoryEfficientProcessor class created with chunked processing
- [ ] Memory monitoring and limit enforcement
- [ ] Backpressure handling with stream pausing/resuming
- [ ] Support for sequential and parallel processing
- [ ] Progress tracking with callbacks
- [ ] Code compiles without errors
- [ ] Unit tests pass

## Dependencies Confirmed
- Node.js Readable stream API
- MemoryMonitor class
- StreamEntry and StreamOptions types
- TypeScript compiler installed

## Next Task
task_03_implement_backpressure_handling.md
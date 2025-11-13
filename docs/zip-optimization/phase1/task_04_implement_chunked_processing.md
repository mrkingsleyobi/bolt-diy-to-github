# Task 04: Implement Chunked Processing

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The current ZIP extraction service processes files in a single pass without chunked processing. This task implements chunked processing for better memory management and progress tracking.

## Current System State
- Basic streaming with yauzl library is implemented
- Files processed as single streams without chunking
- No explicit chunked processing for large files
- Limited progress tracking capabilities

## Your Task
Implement chunked processing for ZIP entries with configurable chunk sizes, progress tracking, and memory-efficient handling.

## Test First (RED Phase)
```typescript
import { ChunkedProcessor } from '../../src/utils/zip/ChunkedProcessor';

describe('ChunkedProcessor', () => {
  it('should create a chunked processor instance', () => {
    const processor = new ChunkedProcessor();
    expect(processor).toBeInstanceOf(ChunkedProcessor);
  });

  it('should process data in chunks', async () => {
    const processor = new ChunkedProcessor();
    const data = Buffer.from('a'.repeat(1000));

    const chunks = await processor.processInChunks(data, 100);
    expect(chunks).toHaveLength(10);
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
export class ChunkedProcessor {
  async processInChunks(data: Buffer, chunkSize: number): Promise<Buffer[]> {
    const chunks: Buffer[] = [];

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      chunks.push(chunk);
    }

    return chunks;
  }
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
import { Readable, Writable, Transform } from 'stream';
import { StreamEntry, StreamOptions, StreamProgress } from '../../types/streaming';
import { ProgressTracker } from './ProgressTracker';
import { MemoryMonitor } from './MemoryMonitor';

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
export class ChunkedProcessor {
  private progressTracker: ProgressTracker | null = null;
  private memoryMonitor: MemoryMonitor;
  private defaultChunkSize: number;

  /**
   * Create a chunked processor
   * @param memoryLimit Maximum memory usage in bytes (default: 50MB)
   * @param defaultChunkSize Default chunk size (default: 64KB)
   */
  constructor(memoryLimit?: number, defaultChunkSize?: number) {
    this.memoryMonitor = new MemoryMonitor(memoryLimit || 50 * 1024 * 1024); // 50MB default
    this.defaultChunkSize = defaultChunkSize || 64 * 1024; // 64KB default
  }

  /**
   * Process data in chunks with progress tracking
   * @param data Data to process
   * @param chunkSize Size of each chunk
   * @param options Processing options
   * @returns Promise resolving to chunked process result
   */
  async processInChunks(
    data: Buffer,
    chunkSize: number = this.defaultChunkSize,
    options?: StreamOptions
  ): Promise<ChunkedProcessResult> {
    // Check memory before processing
    if (this.memoryMonitor.isLimitExceeded()) {
      throw new Error('Memory limit exceeded before processing');
    }

    const startTime = Date.now();
    const chunks: Buffer[] = [];
    const totalSize = data.length;
    let processedSize = 0;

    // Initialize progress tracker if callback provided
    if (options?.onProgress) {
      this.progressTracker = new ProgressTracker(Math.ceil(totalSize / chunkSize));
    }

    // Process data in chunks
    for (let i = 0; i < data.length; i += chunkSize) {
      // Check memory limit during processing
      if (this.memoryMonitor.isLimitExceeded()) {
        throw new Error('Memory limit exceeded during processing');
      }

      const chunk = data.slice(i, i + chunkSize);
      chunks.push(chunk);
      processedSize += chunk.length;

      // Update progress tracking
      if (this.progressTracker && options?.onProgress) {
        this.progressTracker.update(Math.floor(i / chunkSize) + 1);
        const progress = this.progressTracker.getProgress();
        options.onProgress({
          ...progress,
          processed: processedSize,
          total: totalSize
        });
      }

      // Apply backpressure if needed
      if (options?.highWaterMark && chunks.length > options.highWaterMark) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    const processingTime = Date.now() - startTime;
    const memoryUsage = this.memoryMonitor.getCurrentUsage().heapUsed;

    return {
      chunks,
      totalSize,
      processingTime,
      memoryUsage
    };
  }

  /**
   * Process a stream in chunks with backpressure handling
   * @param stream Readable stream to process
   * @param chunkSize Size of each chunk
   * @param options Processing options
   * @returns Promise resolving to array of chunks
   */
  async processStreamInChunks(
    stream: Readable,
    chunkSize: number = this.defaultChunkSize,
    options?: StreamOptions
  ): Promise<Buffer[]> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalSize = 0;

      // Check memory before processing
      if (this.memoryMonitor.isLimitExceeded()) {
        return reject(new Error('Memory limit exceeded before processing'));
      }

      // Set up chunked processing with backpressure
      stream.on('data', (chunk: Buffer) => {
        // Check memory limit during processing
        if (this.memoryMonitor.isLimitExceeded()) {
          stream.destroy();
          return reject(new Error('Memory limit exceeded during processing'));
        }

        totalSize += chunk.length;

        // Process chunk if it's larger than chunkSize
        if (chunk.length > chunkSize) {
          for (let i = 0; i < chunk.length; i += chunkSize) {
            const subChunk = chunk.slice(i, i + chunkSize);
            chunks.push(subChunk);
          }
        } else {
          chunks.push(chunk);
        }

        // Apply backpressure if needed
        if (stream.readableLength > (options?.highWaterMark || chunkSize * 4)) {
          stream.pause();
          setTimeout(() => {
            if (!this.memoryMonitor.isLimitExceeded()) {
              stream.resume();
            }
          }, 50);
        }

        // Update progress tracking
        if (this.progressTracker && options?.onProgress) {
          this.progressTracker.update(chunks.length);
          const progress = this.progressTracker.getProgress();
          options.onProgress({
            ...progress,
            processed: totalSize,
            total: totalSize // This would need to be known ahead of time for accurate progress
          });
        }
      });

      stream.on('end', () => {
        resolve(chunks);
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
  async processStreamEntryInChunks(
    entry: StreamEntry,
    chunkSize: number = this.defaultChunkSize,
    options?: StreamOptions
  ): Promise<ChunkedProcessResult> {
    if (entry.isDirectory) {
      return {
        chunks: [],
        totalSize: 0,
        processingTime: 0,
        memoryUsage: 0
      };
    }

    const startTime = Date.now();
    const chunks = await this.processStreamInChunks(entry.stream, chunkSize, options);
    const processingTime = Date.now() - startTime;
    const memoryUsage = this.memoryMonitor.getCurrentUsage().heapUsed;
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

    return {
      chunks,
      totalSize,
      processingTime,
      memoryUsage
    };
  }

  /**
   * Create a chunked processing transform stream
   * @param chunkSize Size of each chunk
   * @param options Processing options
   * @returns Transform stream that outputs chunks
   */
  createChunkedTransform(
    chunkSize: number = this.defaultChunkSize,
    options?: StreamOptions
  ): Transform {
    let buffer = Buffer.alloc(0);

    return new Transform({
      transform(chunk: Buffer, encoding, callback) {
        // Check memory limit
        if (this.memoryMonitor.isLimitExceeded()) {
          callback(new Error('Memory limit exceeded during chunked processing'));
          return;
        }

        // Append new chunk to buffer
        buffer = Buffer.concat([buffer, chunk]);

        // Process buffer in chunks
        while (buffer.length >= chunkSize) {
          const processChunk = buffer.slice(0, chunkSize);
          buffer = buffer.slice(chunkSize);
          this.push(processChunk);
        }

        callback();
      },

      flush(callback) {
        // Push remaining buffer as final chunk
        if (buffer.length > 0) {
          this.push(buffer);
        }
        callback();
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
npx tsc --noEmit src/utils/zip/ChunkedProcessor.ts
```

## Success Criteria
- [ ] ChunkedProcessor class created with chunked processing capabilities
- [ ] Memory monitoring and limit enforcement
- [ ] Progress tracking with detailed metrics
- [ ] Backpressure handling during chunked processing
- [ ] Support for both buffer and stream chunking
- [ ] Transform stream for chunked processing
- [ ] Code compiles without errors
- [ ] Unit tests pass

## Dependencies Confirmed
- Node.js Transform and Readable stream APIs
- ProgressTracker and MemoryMonitor classes
- StreamEntry and StreamOptions types
- TypeScript compiler installed

## Next Task
task_05_implement_entry_filtering.md
# Task 01: Implement Streaming Extractor

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The current ZIP extraction service has basic streaming capabilities but lacks advanced streaming support for large file processing. This task implements an enhanced streaming extractor with memory efficiency and backpressure handling.

## Current System State
- Basic streaming with yauzl library is implemented
- File-based extraction with read/write streams
- No direct stream-based processing without file I/O
- No memory usage monitoring or limits

## Your Task
Implement a streaming extractor that processes ZIP entries as streams without immediate file I/O, with memory efficiency and backpressure handling.

## Test First (RED Phase)
```typescript
import { StreamingZipExtractor } from '../../src/utils/zip/StreamingZipExtractor';
import { StreamOptions } from '../../src/types/streaming';
import { createReadStream } from 'fs';

describe('StreamingZipExtractor', () => {
  it('should create a streaming extractor instance', () => {
    const extractor = new StreamingZipExtractor();
    expect(extractor).toBeInstanceOf(StreamingZipExtractor);
  });

  it('should process ZIP file as streams', async () => {
    const extractor = new StreamingZipExtractor();
    const zipStream = createReadStream('test.zip');
    const options: StreamOptions = { parallel: true };

    const result = await extractor.extractStreams(zipStream, options);
    expect(result).toBeDefined();
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
import { Readable } from 'stream';
import yauzl, { Entry, ZipFile } from 'yauzl';
import { StreamEntry, StreamOptions } from '../../types/streaming';
import { promisify } from 'util';

const openZip = promisify(yauzl.fromBuffer);

export class StreamingZipExtractor {
  async extractStreams(buffer: Buffer, options: StreamOptions = {}): Promise<StreamEntry[]> {
    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipFile) => {
        if (err) return reject(err);
        if (!zipFile) return reject(new Error('Failed to open ZIP file'));

        const entries: StreamEntry[] = [];

        zipFile.on('entry', (entry: Entry) => {
          zipFile.openReadStream(entry, (err, readStream) => {
            if (err || !readStream) return;

            entries.push({
              name: entry.fileName,
              size: entry.uncompressedSize,
              isDirectory: entry.fileName.endsWith('/'),
              stream: readStream
            });

            zipFile.readEntry();
          });
        });

        zipFile.on('end', () => {
          zipFile.close();
          resolve(entries);
        });

        zipFile.readEntry();
      });
    });
  }
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
import { Readable } from 'stream';
import yauzl, { Entry, ZipFile } from 'yauzl';
import { StreamEntry, StreamOptions, StreamProgress } from '../../types/streaming';
import { promisify } from 'util';
import { MemoryMonitor } from './MemoryMonitor';
import { ProgressTracker } from './ProgressTracker';

const openZip = promisify(yauzl.fromBuffer);

/**
 * Streaming ZIP extractor for memory-efficient processing
 */
export class StreamingZipExtractor {
  private memoryMonitor: MemoryMonitor;
  private progressTracker: ProgressTracker | null = null;

  constructor(memoryLimit?: number) {
    this.memoryMonitor = new MemoryMonitor(memoryLimit);
  }

  /**
   * Extract ZIP file entries as streams
   * @param buffer ZIP file buffer
   * @param options Streaming options
   * @returns Promise resolving to array of stream entries
   */
  async extractStreams(buffer: Buffer, options: StreamOptions = {}): Promise<StreamEntry[]> {
    // Check memory before processing
    if (this.memoryMonitor.isLimitExceeded()) {
      throw new Error('Memory limit exceeded before processing');
    }

    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipFile) => {
        if (err) return reject(new Error(`Failed to open ZIP file: ${err.message}`));
        if (!zipFile) return reject(new Error('Failed to open ZIP file: zipFile is null'));

        const entries: StreamEntry[] = [];
        let processedEntries = 0;
        const totalEntries = zipFile.entryCount;

        // Initialize progress tracker if callback provided
        if (options.onProgress) {
          this.progressTracker = new ProgressTracker(totalEntries);
        }

        // Set up memory monitoring
        this.memoryMonitor.setAlertCallback((usage) => {
          console.warn(`Memory usage warning: ${usage.heapUsed} bytes`);
        });

        zipFile.on('entry', (entry: Entry) => {
          // Check memory limit
          if (this.memoryMonitor.isLimitExceeded()) {
            zipFile.close();
            return reject(new Error('Memory limit exceeded during processing'));
          }

          // Handle directory entries
          if (entry.fileName.endsWith('/')) {
            entries.push({
              name: entry.fileName,
              size: entry.uncompressedSize,
              isDirectory: true,
              stream: new Readable({ read() { this.push(null); } })
            });
            this.continueProcessing(zipFile, ++processedEntries, totalEntries, options);
            return;
          }

          // Open read stream for file entries
          zipFile.openReadStream(entry, (err, readStream) => {
            if (err) {
              zipFile.close();
              return reject(new Error(`Failed to open read stream for entry ${entry.fileName}: ${err.message}`));
            }

            if (!readStream) {
              zipFile.close();
              return reject(new Error(`Failed to open read stream for entry ${entry.fileName}: stream is null`));
            }

            // Apply backpressure handling if highWaterMark specified
            if (options.highWaterMark) {
              readStream.on('data', (chunk: Buffer) => {
                if (readStream.readableLength > options.highWaterMark!) {
                  readStream.pause();
                  setTimeout(() => readStream.resume(), 10);
                }
              });
            }

            // Create stream entry
            const streamEntry: StreamEntry = {
              name: entry.fileName,
              size: entry.uncompressedSize,
              isDirectory: false,
              stream: readStream
            };

            entries.push(streamEntry);

            // Call entry callback if provided
            if (options.onEntry) {
              options.onEntry(streamEntry)
                .then(() => this.continueProcessing(zipFile, ++processedEntries, totalEntries, options))
                .catch((error) => {
                  zipFile.close();
                  reject(error);
                });
            } else {
              this.continueProcessing(zipFile, ++processedEntries, totalEntries, options);
            }
          });
        });

        zipFile.on('end', () => {
          zipFile.close();
          resolve(entries);
        });

        zipFile.on('error', (error) => {
          zipFile.close();
          reject(new Error(`Error during ZIP processing: ${error.message}`));
        });

        // Start reading entries
        zipFile.readEntry();
      });
    });
  }

  /**
   * Continue processing next entry with progress tracking
   */
  private continueProcessing(
    zipFile: ZipFile,
    processedEntries: number,
    totalEntries: number,
    options: StreamOptions
  ): void {
    // Update progress tracking
    if (this.progressTracker && options.onProgress) {
      this.progressTracker.update(processedEntries);
      const progress = this.progressTracker.getProgress();
      options.onProgress(progress);
    }

    // Check memory usage and alert if necessary
    this.memoryMonitor.checkAndAlert();

    // Continue to next entry
    zipFile.readEntry();
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
npx tsc --noEmit src/utils/zip/StreamingZipExtractor.ts
```

## Success Criteria
- [ ] StreamingZipExtractor class created with extractStreams method
- [ ] Processes ZIP entries as streams without immediate file I/O
- [ ] Memory monitoring and limit enforcement
- [ ] Backpressure handling with highWaterMark option
- [ ] Progress tracking with callbacks
- [ ] Code compiles without errors
- [ ] Unit tests pass

## Dependencies Confirmed
- yauzl library for ZIP processing
- Node.js Readable stream API
- MemoryMonitor and ProgressTracker classes
- TypeScript compiler installed

## Next Task
task_02_implement_memory_efficient_processing.md
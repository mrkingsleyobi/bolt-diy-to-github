# Task 20c: Integration Test Large Files

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The streaming components have been implemented and unit tested, but need integration testing with large files. This task creates integration tests for large file processing following London School TDD principles.

## Current System State
- All streaming components implemented with memory efficiency features
- Unit and integration tests for normal files created
- No integration tests for large file processing yet

## Your Task
Create comprehensive integration tests for large file processing following London School TDD principles with mocks and interaction testing.

## Test First (RED Phase)
```typescript
import { StreamingZipExtractor } from '../../src/utils/zip/StreamingZipExtractor';
import { MemoryEfficientProcessor } from '../../src/utils/zip/MemoryEfficientProcessor';
import { ChunkedProcessor } from '../../src/utils/zip/ChunkedProcessor';

describe('Large Files Integration', () => {
  it('should handle large file processing', async () => {
    const extractor = new StreamingZipExtractor();
    const processor = new MemoryEfficientProcessor();
    const chunker = new ChunkedProcessor();

    expect(extractor).toBeDefined();
    expect(processor).toBeDefined();
    expect(chunker).toBeDefined();
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
// This task is about writing tests, so there's no implementation to show here.
// The tests above would initially fail because we're testing integration.
```

## Refactored Solution (REFACTOR Phase)
```typescript
import { StreamingZipExtractor } from '../../src/utils/zip/StreamingZipExtractor';
import { MemoryEfficientProcessor } from '../../src/utils/zip/MemoryEfficientProcessor';
import { ChunkedProcessor } from '../../src/utils/zip/ChunkedProcessor';
import { BackpressureHandler } from '../../src/utils/zip/BackpressureHandler';
import { EntryFilter } from '../../src/utils/zip/EntryFilter';
import { StreamEntry, StreamOptions } from '../../src/types/streaming';
import { Readable } from 'stream';

// Helper function to create a large buffer efficiently
const createLargeBuffer = (size: number, fillChar: string = 'a'): Buffer => {
  // For very large buffers, create in chunks to avoid memory issues
  if (size > 10 * 1024 * 1024) { // 10MB
    const chunks: Buffer[] = [];
    const chunkSize = 1024 * 1024; // 1MB chunks
    let remaining = size;

    while (remaining > 0) {
      const currentChunkSize = Math.min(chunkSize, remaining);
      chunks.push(Buffer.alloc(currentChunkSize, fillChar));
      remaining -= currentChunkSize;
    }

    return Buffer.concat(chunks);
  }

  return Buffer.alloc(size, fillChar);
};

// Helper function to create mock large stream entries
const createLargeMockStreamEntries = (sizes: number[]): StreamEntry[] => {
  return sizes.map((size, index) => ({
    name: `large_file_${index}.dat`,
    size: size,
    isDirectory: false,
    stream: new Readable({
      read() {
        // For very large streams, emit data in chunks
        const chunkSize = Math.min(64 * 1024, size); // 64KB chunks
        const chunks = Math.ceil(size / chunkSize);

        for (let i = 0; i < chunks; i++) {
          const remaining = size - (i * chunkSize);
          const currentChunkSize = Math.min(chunkSize, remaining);
          this.push(Buffer.alloc(currentChunkSize, 'x'));
        }

        this.push(null);
      }
    })
  }));
};

// Helper function to simulate progress tracking
const createProgressTracker = () => {
  const progressEvents: any[] = [];
  return {
    callback: (progress: any) => {
      progressEvents.push(progress);
    },
    events: progressEvents
  };
};

describe('Large Files Integration', () => {
  let extractor: StreamingZipExtractor;
  let processor: MemoryEfficientProcessor;
  let chunker: ChunkedProcessor;
  let handler: BackpressureHandler;
  let filter: EntryFilter;

  beforeEach(() => {
    // Use reasonable memory limits for testing
    const memoryLimit = 50 * 1024 * 1024; // 50MB

    extractor = new StreamingZipExtractor(memoryLimit);
    processor = new MemoryEfficientProcessor(memoryLimit);
    chunker = new ChunkedProcessor(memoryLimit);
    handler = new BackpressureHandler(memoryLimit);
    filter = new EntryFilter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle large file processing', async () => {
    expect(extractor).toBeInstanceOf(StreamingZipExtractor);
    expect(processor).toBeInstanceOf(MemoryEfficientProcessor);
    expect(chunker).toBeInstanceOf(ChunkedProcessor);
  });

  it('should process moderately large files efficiently', async () => {
    // Create a 5MB file entry
    const largeEntry = createLargeMockStreamEntries([5 * 1024 * 1024])[0];

    // Set up progress tracking
    const progressTracker = createProgressTracker();
    const options: StreamOptions = {
      onProgress: progressTracker.callback,
      highWaterMark: 64 * 1024 // 64KB backpressure
    };

    // Process with memory efficient processor
    const startTime = Date.now();
    const processedBuffer = await processor.processStreamEntry(largeEntry, options);
    const processingTime = Date.now() - startTime;

    // Verify processing completed successfully
    expect(processedBuffer).toBeInstanceOf(Buffer);
    expect(processedBuffer.length).toBe(5 * 1024 * 1024);

    // Verify progress tracking
    expect(progressTracker.events.length).toBeGreaterThan(0);

    // Verify memory limits maintained
    expect(processor.isMemoryLimitExceeded()).toBe(false);

    // Verify reasonable processing time (should be fast for mock data)
    expect(processingTime).toBeLessThan(5000); // Less than 5 seconds
  });

  it('should chunk large files efficiently', async () => {
    // Create a 10MB buffer
    const largeBuffer = createLargeBuffer(10 * 1024 * 1024);

    // Set up progress tracking
    const progressTracker = createProgressTracker();
    const options: StreamOptions = {
      onProgress: progressTracker.callback,
      highWaterMark: 32 * 1024 // 32KB backpressure
    };

    // Process with chunked processor
    const startTime = Date.now();
    const result = await chunker.processInChunks(largeBuffer, 64 * 1024, options); // 64KB chunks
    const processingTime = Date.now() - startTime;

    // Verify chunked processing completed
    expect(result.chunks).toBeInstanceOf(Array);
    expect(result.chunks.length).toBe(160); // 10MB / 64KB = 160 chunks
    expect(result.totalSize).toBe(10 * 1024 * 1024);

    // Verify progress tracking
    expect(progressTracker.events.length).toBeGreaterThan(0);

    // Verify memory limits maintained
    expect(chunker.isMemoryLimitExceeded()).toBe(false);

    // Verify processing time is reasonable
    expect(processingTime).toBeLessThan(5000); // Less than 5 seconds
  });

  it('should handle multiple large files with memory constraints', async () => {
    // Create multiple large entries (total ~25MB)
    const entries = createLargeMockStreamEntries([
      5 * 1024 * 1024,  // 5MB
      8 * 1024 * 1024,  // 8MB
      7 * 1024 * 1024,  // 7MB
      5 * 1024 * 1024   // 5MB
    ]);

    // Set up progress tracking
    const progressTracker = createProgressTracker();
    const options: StreamOptions = {
      onProgress: progressTracker.callback,
      highWaterMark: 64 * 1024,
      parallel: true,
      parallelWorkers: 2
    };

    // Process entries with memory constraints
    const startTime = Date.now();
    const results = await processor.processStreamEntries(entries, options);
    const processingTime = Date.now() - startTime;

    // Verify all entries processed
    expect(results).toHaveLength(4);
    results.forEach((result, index) => {
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(entries[index].size);
    });

    // Verify progress tracking
    expect(progressTracker.events.length).toBeGreaterThan(0);

    // Verify memory limits maintained
    expect(processor.isMemoryLimitExceeded()).toBe(false);

    // Verify processing time is reasonable
    expect(processingTime).toBeLessThan(10000); // Less than 10 seconds
  });

  it('should apply backpressure during large file processing', async () => {
    // Create a large stream
    const largeEntry = createLargeMockStreamEntries([15 * 1024 * 1024])[0]; // 15MB

    // Apply backpressure handling
    const controlledStream = handler.applyBackpressure(largeEntry.stream, 16 * 1024); // 16KB high water mark

    // Process the controlled stream with chunking
    const progressTracker = createProgressTracker();
    const options: StreamOptions = {
      onProgress: progressTracker.callback,
      highWaterMark: 16 * 1024
    };

    const startTime = Date.now();
    const chunks = await chunker.processStreamInChunks(controlledStream, 32 * 1024, options); // 32KB chunks
    const processingTime = Date.now() - startTime;

    // Verify processing completed
    expect(chunks).toBeInstanceOf(Array);
    expect(chunks.length).toBeGreaterThan(0);

    // Verify backpressure was applied (progress events should show controlled processing)
    expect(progressTracker.events.length).toBeGreaterThan(0);

    // Verify memory limits maintained
    expect(handler.isMemoryLimitExceeded()).toBe(false);

    // Verify processing time is reasonable
    expect(processingTime).toBeLessThan(10000); // Less than 10 seconds
  });

  it('should filter large files appropriately', async () => {
    // Create large entries with different characteristics
    const entries = createLargeMockStreamEntries([
      10 * 1024 * 1024, // 10MB - should be included
      15 * 1024 * 1024, // 15MB - should be excluded (too large)
      5 * 1024 * 1024,  // 5MB - should be included
      25 * 1024 * 1024  // 25MB - should be excluded (too large)
    ]);

    // Add names to entries for filtering
    entries[0].name = 'included_large.dat';
    entries[1].name = 'excluded_too_large.dat';
    entries[2].name = 'included_medium.dat';
    entries[3].name = 'excluded_very_large.dat';

    // Set up filter to include files under 20MB
    filter.setSizeLimits(1024, 20 * 1024 * 1024); // 1KB to 20MB
    filter.addIncludePattern('**/*.dat');

    // Filter entries
    const filteredEntries = filter.filterEntries(entries);

    // Verify filtering worked correctly
    expect(filteredEntries).toHaveLength(2); // Only 10MB and 5MB files should be included
    expect(filteredEntries[0].name).toBe('included_large.dat');
    expect(filteredEntries[1].name).toBe('included_medium.dat');
  });

  it('should handle very large single files with chunking', async () => {
    // Create a 50MB buffer (large but manageable for testing)
    const veryLargeBuffer = createLargeBuffer(50 * 1024 * 1024);

    // Set up small chunk size for better memory management
    const progressTracker = createProgressTracker();
    const options: StreamOptions = {
      onProgress: progressTracker.callback,
      highWaterMark: 16 * 1024 // 16KB backpressure
    };

    // Process with small chunk size
    const startTime = Date.now();
    const result = await chunker.processInChunks(veryLargeBuffer, 32 * 1024, options); // 32KB chunks
    const processingTime = Date.now() - startTime;

    // Verify chunked processing completed
    expect(result.chunks).toBeInstanceOf(Array);
    expect(result.chunks.length).toBe(1600); // 50MB / 32KB = 1600 chunks
    expect(result.totalSize).toBe(50 * 1024 * 1024);

    // Verify progress tracking shows incremental progress
    expect(progressTracker.events.length).toBeGreaterThan(10); // Should have many progress events

    // Verify memory limits maintained
    expect(chunker.isMemoryLimitExceeded()).toBe(false);

    // Verify memory usage is reasonable (should not spike dramatically)
    expect(result.memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
  });

  it('should maintain performance with large file sequences', async () => {
    // Create many medium-sized entries
    const entries = createLargeMockStreamEntries(
      Array(20).fill(0).map(() => 2 * 1024 * 1024) // 20 entries of 2MB each
    );

    // Set up performance monitoring
    const progressTracker = createProgressTracker();
    const options: StreamOptions = {
      onProgress: progressTracker.callback,
      highWaterMark: 64 * 1024
    };

    // Process sequence of large files
    const startTime = Date.now();
    const results = await processor.processStreamEntries(entries, options);
    const processingTime = Date.now() - startTime;

    // Verify all entries processed
    expect(results).toHaveLength(20);
    results.forEach(result => {
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(2 * 1024 * 1024);
    });

    // Verify consistent performance
    expect(processingTime).toBeLessThan(15000); // Less than 15 seconds for 40MB total

    // Verify progress tracking
    expect(progressTracker.events.length).toBeGreaterThan(10);

    // Verify memory efficiency
    expect(processor.isMemoryLimitExceeded()).toBe(false);
  });

  it('should handle large file processing with adaptive backpressure', async () => {
    // Create a large entry
    const largeEntry = createLargeMockStreamEntries([12 * 1024 * 1024])[0]; // 12MB

    // Apply adaptive backpressure
    const adaptiveStream = handler.applyAdaptiveBackpressure(largeEntry.stream);

    // Process with memory efficient processor
    const progressTracker = createProgressTracker();
    const options: StreamOptions = {
      onProgress: progressTracker.callback
    };

    const startTime = Date.now();
    const processedBuffer = await processor.processStream(adaptiveStream, 64 * 1024, options);
    const processingTime = Date.now() - startTime;

    // Verify processing completed
    expect(processedBuffer).toBeInstanceOf(Buffer);
    expect(processedBuffer.length).toBe(12 * 1024 * 1024);

    // Verify adaptive backpressure was applied
    expect(progressTracker.events.length).toBeGreaterThan(0);

    // Verify memory limits maintained
    expect(handler.isMemoryLimitExceeded()).toBe(false);
    expect(processor.isMemoryLimitExceeded()).toBe(false);
  });

  it('should provide consistent timing and memory metrics for large files', async () => {
    // Create a moderately large file
    const largeEntry = createLargeMockStreamEntries([8 * 1024 * 1024])[0]; // 8MB

    // Measure processing metrics
    const progressTracker = createProgressTracker();
    const options: StreamOptions = {
      onProgress: progressTracker.callback,
      highWaterMark: 32 * 1024
    };

    // Get initial memory usage
    const initialMemory = processor.getMemoryUsage();

    const startTime = Date.now();
    const result = await chunker.processStreamEntryInChunks(largeEntry, 64 * 1024, options);
    const processingTime = Date.now() - startTime;

    // Get final memory usage
    const finalMemory = processor.getMemoryUsage();

    // Verify metrics are reasonable
    expect(result.processingTime).toBeGreaterThan(0);
    expect(result.processingTime).toBeLessThan(5000); // Less than 5 seconds
    expect(result.memoryUsage).toBeGreaterThan(0);
    expect(result.totalSize).toBe(8 * 1024 * 1024);

    // Verify memory usage is tracked
    expect(finalMemory.heapUsed).toBeGreaterThanOrEqual(initialMemory.heapUsed);
  });

  it('should handle edge cases in large file processing', async () => {
    // Test with maximum safe integer size (limited by Node.js)
    const maxSize = 1024 * 1024 * 1024; // 1GB (but we'll use smaller for testing)

    // Test with nearly maximum reasonable size for testing
    const largeEntry = createLargeMockStreamEntries([100 * 1024 * 1024])[0]; // 100MB

    // Set strict memory limits
    const strictProcessor = new MemoryEfficientProcessor(200 * 1024 * 1024); // 200MB limit

    // Process with strict limits
    const options: StreamOptions = {
      highWaterMark: 8 * 1024, // Very small buffer for strict control
      onProgress: jest.fn()
    };

    const startTime = Date.now();
    const processedBuffer = await strictProcessor.processStreamEntry(largeEntry, options);
    const processingTime = Date.now() - startTime;

    // Verify processing completed under strict limits
    expect(processedBuffer).toBeInstanceOf(Buffer);
    expect(processedBuffer.length).toBe(100 * 1024 * 1024);

    // Verify memory limits maintained even with large file
    expect(strictProcessor.isMemoryLimitExceeded()).toBe(false);

    // Verify reasonable processing time
    expect(processingTime).toBeLessThan(30000); // Less than 30 seconds
  });

  it('should coordinate memory usage across large file components', async () => {
    // Create large entries
    const entries = createLargeMockStreamEntries([
      15 * 1024 * 1024, // 15MB
      10 * 1024 * 1024  // 10MB
    ]);

    // Get baseline memory usage
    const processorUsage = processor.getMemoryUsage();
    const chunkerUsage = chunker.getMemoryUsage();
    const handlerUsage = handler.getMemoryUsage();

    // Process with all components
    const options: StreamOptions = {
      highWaterMark: 32 * 1024,
      onProgress: jest.fn()
    };

    // Process entries through different components
    const processedBuffers = await Promise.all(
      entries.map(entry => processor.processStreamEntry(entry, options))
    );

    const chunkedResults = await Promise.all(
      processedBuffers.map(buffer =>
        chunker.processInChunks(buffer, 64 * 1024, options)
      )
    );

    // Verify all processing completed
    expect(processedBuffers).toHaveLength(2);
    expect(chunkedResults).toHaveLength(2);

    // Verify memory coordination (usage should be consistent)
    const finalProcessorUsage = processor.getMemoryUsage();
    const finalChunkerUsage = chunker.getMemoryUsage();
    const finalHandlerUsage = handler.getMemoryUsage();

    // All components should maintain reasonable memory usage
    expect(processor.isMemoryLimitExceeded()).toBe(false);
    expect(chunker.isMemoryLimitExceeded()).toBe(false);
    expect(handler.isMemoryLimitExceeded()).toBe(false);
  });
});
```

## Verification Commands
```bash
# Run the large files integration tests
npm test -- src/utils/zip/large-files.integration.test.ts
```

## Success Criteria
- [ ] Large files integration tests created following London School TDD
- [ ] Tests cover processing of moderately large files (5-50MB)
- [ ] Tests verify memory efficiency with large data
- [ ] Tests verify backpressure handling during large file processing
- [ ] Tests verify chunked processing of very large files
- [ ] Tests cover filtering of large files
- [ ] Tests verify performance metrics for large file processing
- [ ] Tests handle edge cases in large file processing
- [ ] All tests pass
- [ ] Code coverage is high

## Dependencies Confirmed
- Jest testing framework
- All streaming component implementations
- StreamEntry and StreamOptions types
- Node.js Readable stream API
- TypeScript compiler installed

## Next Task
task_30a_test_error_handling.md
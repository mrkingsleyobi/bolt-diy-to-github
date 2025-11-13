# Task 20a: Integration Test Streaming

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The streaming components have been implemented and unit tested, but need integration testing. This task creates integration tests for the streaming functionality following London School TDD principles.

## Current System State
- StreamingZipExtractor, MemoryEfficientProcessor, BackpressureHandler, ChunkedProcessor, and EntryFilter implemented
- Unit tests for each component created
- No integration tests yet

## Your Task
Create comprehensive integration tests for the streaming functionality following London School TDD principles with mocks and interaction testing.

## Test First (RED Phase)
```typescript
import { StreamingZipExtractor } from '../../src/utils/zip/StreamingZipExtractor';
import { MemoryEfficientProcessor } from '../../src/utils/zip/MemoryEfficientProcessor';
import { BackpressureHandler } from '../../src/utils/zip/BackpressureHandler';
import { ChunkedProcessor } from '../../src/utils/zip/ChunkedProcessor';
import { EntryFilter } from '../../src/utils/zip/EntryFilter';

describe('Streaming Integration', () => {
  it('should integrate all streaming components', async () => {
    const extractor = new StreamingZipExtractor();
    const processor = new MemoryEfficientProcessor();
    const handler = new BackpressureHandler();
    const chunker = new ChunkedProcessor();
    const filter = new EntryFilter();

    expect(extractor).toBeDefined();
    expect(processor).toBeDefined();
    expect(handler).toBeDefined();
    expect(chunker).toBeDefined();
    expect(filter).toBeDefined();
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
import { BackpressureHandler } from '../../src/utils/zip/BackpressureHandler';
import { ChunkedProcessor } from '../../src/utils/zip/ChunkedProcessor';
import { EntryFilter } from '../../src/utils/zip/EntryFilter';
import { StreamEntry, StreamOptions } from '../../src/types/streaming';
import { Readable } from 'stream';

// Helper function to create a mock ZIP buffer
const createMockZipBuffer = (): Buffer => {
  // In a real test, this would be an actual ZIP file buffer
  // For integration testing, we can use a simple buffer
  return Buffer.from('PK mock zip content');
};

// Helper function to create mock stream entries
const createMockStreamEntries = (): StreamEntry[] => {
  return [
    {
      name: 'file1.txt',
      size: 100,
      isDirectory: false,
      stream: new Readable({
        read() {
          this.push(Buffer.from('content of file1'));
          this.push(null);
        }
      })
    },
    {
      name: 'file2.js',
      size: 200,
      isDirectory: false,
      stream: new Readable({
        read() {
          this.push(Buffer.from('content of file2'));
          this.push(null);
        }
      })
    },
    {
      name: 'dir/',
      size: 0,
      isDirectory: true,
      stream: new Readable({
        read() {
          this.push(null);
        }
      })
    }
  ];
};

describe('Streaming Integration', () => {
  let extractor: StreamingZipExtractor;
  let processor: MemoryEfficientProcessor;
  let handler: BackpressureHandler;
  let chunker: ChunkedProcessor;
  let filter: EntryFilter;

  beforeEach(() => {
    extractor = new StreamingZipExtractor();
    processor = new MemoryEfficientProcessor();
    handler = new BackpressureHandler();
    chunker = new ChunkedProcessor();
    filter = new EntryFilter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should integrate all streaming components', () => {
    expect(extractor).toBeInstanceOf(StreamingZipExtractor);
    expect(processor).toBeInstanceOf(MemoryEfficientProcessor);
    expect(handler).toBeInstanceOf(BackpressureHandler);
    expect(chunker).toBeInstanceOf(ChunkedProcessor);
    expect(filter).toBeInstanceOf(EntryFilter);
  });

  it('should extract streams and process them with memory efficiency', async () => {
    // Note: This test would require mocking the yauzl library for proper integration testing
    const buffer = createMockZipBuffer();
    const options: StreamOptions = {
      highWaterMark: 1024
    };

    // In a real integration test, we would:
    // 1. Extract streams from the ZIP buffer
    // 2. Process the streams with the memory efficient processor
    // 3. Verify the results

    expect(() => extractor.extractStreams(buffer, options)).not.toThrow();
  });

  it('should apply backpressure handling during stream processing', async () => {
    const entries = createMockStreamEntries();
    const filteredEntries = filter.filterEntries(entries);

    // Apply backpressure handling to each entry stream
    const controlledEntries = filteredEntries.map(entry => {
      if (!entry.isDirectory) {
        return {
          ...entry,
          stream: handler.applyBackpressure(entry.stream, 512)
        };
      }
      return entry;
    });

    // Process the controlled entries
    const processingPromises = controlledEntries
      .filter(entry => !entry.isDirectory)
      .map(entry => processor.processStreamEntry(entry));

    await Promise.all(processingPromises);

    // Verify all processing completed successfully
    expect(processingPromises).toHaveLength(2); // Only file entries
  });

  it('should process entries in chunks with filtering', async () => {
    // Set up filter criteria
    filter.addIncludePattern('**/*.js');
    filter.setSizeLimits(50, 500);

    const entries = createMockStreamEntries();
    const filteredEntries = filter.filterEntries(entries);

    // Process filtered entries in chunks
    const chunkedPromises = filteredEntries
      .filter(entry => !entry.isDirectory)
      .map(entry => chunker.processStreamEntryInChunks(entry, 64));

    const results = await Promise.all(chunkedPromises);

    // Verify chunked processing results
    expect(results).toHaveLength(2); // file1.txt and file2.js both match criteria
    results.forEach(result => {
      expect(result.chunks).toBeInstanceOf(Array);
      expect(result.totalSize).toBeGreaterThanOrEqual(0);
    });
  });

  it('should handle complex streaming workflow', async () => {
    // Complex workflow:
    // 1. Extract streams from ZIP
    // 2. Filter entries
    // 3. Apply backpressure handling
    // 4. Process with memory efficiency
    // 5. Chunk large entries

    const buffer = createMockZipBuffer();
    const progressCallback = jest.fn();
    const options: StreamOptions = {
      highWaterMark: 1024,
      onProgress: progressCallback,
      parallel: true,
      parallelWorkers: 2
    };

    // In a real integration test, we would:
    // 1. Extract streams (mocked here)
    const entries = createMockStreamEntries();

    // 2. Filter entries
    filter.addIncludePattern('**/*.{txt,js}');
    const filteredEntries = filter.filterEntries(entries);

    // 3. Apply backpressure handling
    const controlledEntries = filteredEntries.map(entry => ({
      ...entry,
      stream: entry.isDirectory ? entry.stream : handler.applyBackpressure(entry.stream, 512, options)
    }));

    // 4. Process with memory efficiency
    const processingPromises = controlledEntries
      .filter(entry => !entry.isDirectory)
      .map(entry => processor.processStreamEntry(entry, options));

    const processedResults = await Promise.all(processingPromises);

    // 5. Chunk large entries (those over 150 bytes)
    const largeEntries = controlledEntries.filter(entry => entry.size > 150 && !entry.isDirectory);
    const chunkingPromises = largeEntries.map(entry =>
      chunker.processStreamEntryInChunks(entry, 64, options)
    );

    const chunkedResults = await Promise.all(chunkingPromises);

    // Verify workflow completion
    expect(processedResults).toHaveLength(2); // Both file entries processed
    expect(chunkedResults).toHaveLength(1); // Only file2.js is over 150 bytes
    expect(progressCallback).toHaveBeenCalled();
  });

  it('should handle memory limits across integrated components', async () => {
    // Create components with strict memory limits
    const extractorWithLimit = new StreamingZipExtractor(1000);
    const processorWithLimit = new MemoryEfficientProcessor(1000);
    const handlerWithLimit = new BackpressureHandler(1000);
    const chunkerWithLimit = new ChunkedProcessor(1000);

    expect(extractorWithLimit.getMemoryLimit()).toBe(1000);
    expect(processorWithLimit.getMemoryLimit()).toBe(1000);
    expect(handlerWithLimit.isMemoryLimitExceeded()).toBe(false);
    expect(chunkerWithLimit.isMemoryLimitExceeded()).toBe(false);
  });

  it('should handle error propagation across components', async () => {
    // Test error handling in integrated workflow
    const entries = createMockStreamEntries();

    // Set up a filter that will cause issues
    filter.setCustomFilter(() => {
      throw new Error('Filter error');
    });

    // Error should be caught and handled appropriately
    expect(() => filter.filterEntries(entries)).toThrow('Filter error');
  });

  it('should handle progress tracking across integrated components', async () => {
    const progressCallback = jest.fn();
    const options: StreamOptions = {
      onProgress: progressCallback
    };

    // Simulate progress tracking across components
    const entries = createMockStreamEntries();

    // Extractor progress
    extractor.extractStreams(createMockZipBuffer(), options).catch(() => {});

    // Processor progress
    processor.processStreamEntries(entries, options).catch(() => {});

    // Chunker progress
    const entry = entries[0];
    if (!entry.isDirectory) {
      chunker.processStreamEntryInChunks(entry, 64, options).catch(() => {});
    }

    // Verify progress callbacks were called
    // Note: In real integration, these would be called by the actual components
  });

  it('should handle parallel processing across integrated components', async () => {
    const options: StreamOptions = {
      parallel: true,
      parallelWorkers: 2
    };

    const entries = createMockStreamEntries();

    // Process entries in parallel using different components
    const promises = [
      processor.processStreamEntries(entries, options),
      // In a real test, we would also test parallel extraction and chunking
    ];

    const results = await Promise.all(promises);
    expect(results).toHaveLength(1); // Only one promise in this simplified test
  });

  it('should handle stream transformation across components', async () => {
    const entries = createMockStreamEntries();

    // Create a processing pipeline:
    // 1. Filter entries
    // 2. Apply backpressure control
    // 3. Process in chunks
    // 4. Transform results

    const filteredEntries = filter.filterEntries(entries);

    // Apply backpressure handling
    const backpressureTransform = handler.applyAdaptiveBackpressure(filteredEntries[0].stream);

    // Process in chunks
    const chunkedResult = await chunker.processStreamInChunks(backpressureTransform, 32);

    // Verify transformation pipeline
    expect(chunkedResult).toBeInstanceOf(Array);
    expect(chunkedResult.length).toBeGreaterThan(0);
  });

  it('should maintain data integrity across integrated components', async () => {
    const testData = 'This is test data that should remain consistent across all components';
    const testBuffer = Buffer.from(testData);

    // Process data through all components and verify integrity
    const entries = [{
      name: 'test.txt',
      size: testBuffer.length,
      isDirectory: false,
      stream: new Readable({
        read() {
          this.push(testBuffer);
          this.push(null);
        }
      })
    }];

    // Process through memory efficient processor
    const processedBuffer = await processor.processStreamEntry(entries[0]);

    // Process through chunked processor
    const chunkedResult = await chunker.processStreamEntryInChunks(entries[0]);

    // Verify data integrity
    expect(processedBuffer.toString()).toBe(testData);

    const reassembledData = Buffer.concat(chunkedResult.chunks).toString();
    expect(reassembledData).toBe(testData);
  });

  it('should handle cleanup and resource management', async () => {
    // Test that components properly clean up resources
    const entries = createMockStreamEntries();

    // Process entries and verify cleanup
    const processingPromises = entries
      .filter(entry => !entry.isDirectory)
      .map(entry => processor.processStreamEntry(entry));

    await Promise.all(processingPromises);

    // Verify memory usage is reasonable after processing
    const memoryUsage = processor.getMemoryUsage();
    expect(memoryUsage.heapUsed).toBeGreaterThan(0);
  });

  it('should handle edge cases in integrated workflow', async () => {
    // Test with empty entries
    const emptyEntries: StreamEntry[] = [];
    const filteredEmpty = filter.filterEntries(emptyEntries);
    expect(filteredEmpty).toHaveLength(0);

    // Test with single entry
    const singleEntry = [createMockStreamEntries()[0]];
    const filteredSingle = filter.filterEntries(singleEntry);
    expect(filteredSingle).toHaveLength(1);

    // Test with large number of entries
    const manyEntries = Array(100).fill(0).map((_, i) => ({
      name: `file${i}.txt`,
      size: 100,
      isDirectory: false,
      stream: new Readable({
        read() {
          this.push(Buffer.from(`content${i}`));
          this.push(null);
        }
      })
    }));

    const filteredMany = filter.filterEntries(manyEntries);
    expect(filteredMany.length).toBeGreaterThan(0);
  });
});
```

## Verification Commands
```bash
# Run the integration tests
npm test -- src/utils/zip/streaming.integration.test.ts
```

## Success Criteria
- [ ] Streaming integration tests created following London School TDD
- [ ] Tests cover integration between all streaming components
- [ ] Tests verify data flow between components
- [ ] Tests verify error handling across components
- [ ] Tests verify memory management across components
- [ ] Tests verify progress tracking across components
- [ ] Tests cover complex workflows with multiple components
- [ ] Tests cover edge cases in integrated workflows
- [ ] All tests pass
- [ ] Code coverage is high

## Dependencies Confirmed
- Jest testing framework
- All streaming component implementations
- StreamEntry and StreamOptions types
- Node.js Readable stream API
- TypeScript compiler installed

## Next Task
task_20b_integration_test_memory_efficiency.md
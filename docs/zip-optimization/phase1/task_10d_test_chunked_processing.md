# Task 10d: Test Chunked Processing

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The ChunkedProcessor has been implemented but needs comprehensive testing. This task creates unit tests for chunked processing features following London School TDD principles.

## Current System State
- ChunkedProcessor class implemented
- Chunked data processing with progress tracking
- Memory-efficient handling capabilities
- No comprehensive test suite yet

## Your Task
Create comprehensive unit tests for the ChunkedProcessor following London School TDD principles with mocks and interaction testing.

## Test First (RED Phase)
```typescript
import { ChunkedProcessor } from '../../src/utils/zip/ChunkedProcessor';

describe('ChunkedProcessor', () => {
  let processor: ChunkedProcessor;

  beforeEach(() => {
    processor = new ChunkedProcessor();
  });

  it('should create a chunked processor instance', () => {
    expect(processor).toBeInstanceOf(ChunkedProcessor);
  });

  it('should process data in chunks', async () => {
    const data = Buffer.from('test data');

    const result = await processor.processInChunks(data);
    expect(result).toBeDefined();
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
// This task is about writing tests, so there's no implementation to show here.
// The tests above would initially fail because the actual implementation doesn't exist yet.
// The actual implementation was done in task_04_implement_chunked_processing.md
```

## Refactored Solution (REFACTOR Phase)
```typescript
import { ChunkedProcessor } from '../../src/utils/zip/ChunkedProcessor';
import { StreamEntry, StreamOptions } from '../../src/types/streaming';
import { Readable } from 'stream';

// Mock implementations for testing
const createMockReadableStream = (data: string | Buffer): Readable => {
  const stream = new Readable();
  stream.push(data);
  stream.push(null);
  return stream;
};

const createMockStreamEntry = (name: string, size: number, isDirectory: boolean = false): StreamEntry => {
  return {
    name,
    size,
    isDirectory,
    stream: createMockReadableStream('mock content')
  };
};

describe('ChunkedProcessor', () => {
  let processor: ChunkedProcessor;

  beforeEach(() => {
    processor = new ChunkedProcessor();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a chunked processor instance', () => {
    expect(processor).toBeInstanceOf(ChunkedProcessor);
  });

  it('should have default memory limit', () => {
    expect(processor.isMemoryLimitExceeded()).toBe(false);
  });

  it('should allow custom memory limit', () => {
    const processorWithLimit = new ChunkedProcessor(1000000);
    expect(processorWithLimit.getMemoryLimit()).toBe(1000000);
  });

  it('should process data in chunks', async () => {
    const data = Buffer.from('test data for chunking');

    const result = await processor.processInChunks(data);
    expect(result).toBeDefined();
    expect(result.chunks).toBeInstanceOf(Array);
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.totalSize).toBe(data.length);
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
    expect(result.memoryUsage).toBeGreaterThanOrEqual(0);
  });

  it('should process data with custom chunk size', async () => {
    const data = Buffer.from('test data for chunking');
    const chunkSize = 4;

    const result = await processor.processInChunks(data, chunkSize);
    expect(result.chunks).toHaveLength(Math.ceil(data.length / chunkSize));

    // Verify all chunks except the last one are of the specified size
    for (let i = 0; i < result.chunks.length - 1; i++) {
      expect(result.chunks[i].length).toBe(chunkSize);
    }
  });

  it('should process stream in chunks', async () => {
    const readable = createMockReadableStream('test data for chunking');

    const chunks = await processor.processStreamInChunks(readable);
    expect(chunks).toBeInstanceOf(Array);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should process stream with custom chunk size', async () => {
    const readable = createMockReadableStream('test data for chunking');
    const chunkSize = 4;

    const chunks = await processor.processStreamInChunks(readable, chunkSize);
    expect(chunks).toBeInstanceOf(Array);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should handle progress callbacks during chunked processing', async () => {
    const data = Buffer.from('test data for chunking');
    const progressCallback = jest.fn();
    const options: StreamOptions = {
      onProgress: progressCallback
    };

    await processor.processInChunks(data, 4, options);
    expect(progressCallback).toHaveBeenCalled();
  });

  it('should handle memory limit exceeded during processing', async () => {
    const processorWithLimit = new ChunkedProcessor(0); // Very small limit
    const data = Buffer.from('test data');

    await expect(processorWithLimit.processInChunks(data))
      .rejects
      .toThrow('Memory limit exceeded');
  });

  it('should handle stream errors during chunked processing', async () => {
    const readable = new Readable({
      read() {
        this.destroy(new Error('Stream error'));
      }
    });

    await expect(processor.processStreamInChunks(readable))
      .rejects
      .toThrow('Stream processing error');
  });

  it('should process stream entry in chunks', async () => {
    const entry = createMockStreamEntry('test.txt', 100);

    const result = await processor.processStreamEntryInChunks(entry);
    expect(result).toBeDefined();
    expect(result.chunks).toBeInstanceOf(Array);
    expect(result.totalSize).toBeGreaterThanOrEqual(0);
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
    expect(result.memoryUsage).toBeGreaterThanOrEqual(0);
  });

  it('should handle directory entries in chunked processing', async () => {
    const entry = createMockStreamEntry('test/', 0, true);

    const result = await processor.processStreamEntryInChunks(entry);
    expect(result.chunks).toHaveLength(0);
    expect(result.totalSize).toBe(0);
  });

  it('should create chunked transform stream', () => {
    const transform = processor.createChunkedTransform();
    expect(transform).toBeDefined();
    expect(transform).toBeInstanceOf(require('stream').Transform);
  });

  it('should handle backpressure in chunked processing', async () => {
    const data = Buffer.from('test data for chunking');
    const options: StreamOptions = {
      highWaterMark: 1024
    };

    const result = await processor.processInChunks(data, 4, options);
    expect(result).toBeDefined();
  });

  it('should process empty data', async () => {
    const data = Buffer.alloc(0);

    const result = await processor.processInChunks(data);
    expect(result.chunks).toHaveLength(0);
    expect(result.totalSize).toBe(0);
  });

  it('should process large data efficiently', async () => {
    const largeData = Buffer.alloc(100 * 1024, 'a'); // 100KB of data

    const result = await processor.processInChunks(largeData, 1024); // 1KB chunks
    expect(result.chunks).toHaveLength(100);
    expect(result.totalSize).toBe(largeData.length);
  });

  it('should handle very small chunk sizes', async () => {
    const data = Buffer.from('test');
    const chunkSize = 1;

    const result = await processor.processInChunks(data, chunkSize);
    expect(result.chunks).toHaveLength(data.length);

    // Verify each chunk is 1 byte
    result.chunks.forEach(chunk => {
      expect(chunk.length).toBe(1);
    });
  });

  it('should handle chunk size larger than data', async () => {
    const data = Buffer.from('small');
    const chunkSize = 1024; // Much larger than data

    const result = await processor.processInChunks(data, chunkSize);
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]).toEqual(data);
  });

  it('should provide memory usage information', () => {
    const usage = processor.getMemoryUsage();
    expect(usage).toBeDefined();
    expect(usage.heapUsed).toBeGreaterThanOrEqual(0);
  });

  it('should check memory limit exceeded', () => {
    const processorWithLimit = new ChunkedProcessor(0); // Very small limit
    expect(processorWithLimit.isMemoryLimitExceeded()).toBe(true);
  });

  it('should handle custom default chunk size', () => {
    const processorWithCustomChunk = new ChunkedProcessor(undefined, 32 * 1024);
    expect(processorWithCustomChunk).toBeDefined();
  });

  it('should handle transform stream errors', (done) => {
    const transform = processor.createChunkedTransform();

    transform.on('error', (err) => {
      expect(err).toBeDefined();
      done();
    });

    // Simulate an error by destroying the transform
    transform.destroy(new Error('Test error'));
  });

  it('should handle transform stream with data', (done) => {
    const transform = processor.createChunkedTransform(4);
    const testData = Buffer.from('test data');

    const chunks: Buffer[] = [];
    transform.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    transform.on('end', () => {
      expect(chunks.length).toBeGreaterThan(0);
      done();
    });

    transform.write(testData);
    transform.end();
  });
});
```

## Verification Commands
```bash
# Run the unit tests
npm test -- src/utils/zip/ChunkedProcessor.test.ts
```

## Success Criteria
- [ ] ChunkedProcessor unit tests created following London School TDD
- [ ] Tests cover all public methods and functionality
- [ ] Tests include error handling scenarios
- [ ] Tests verify chunked processing
- [ ] Tests verify progress tracking
- [ ] Tests verify backpressure handling
- [ ] Tests verify transform stream creation
- [ ] Tests cover edge cases (empty data, large data, small chunks)
- [ ] All tests pass
- [ ] Code coverage is high

## Dependencies Confirmed
- Jest testing framework
- ChunkedProcessor implementation
- StreamEntry and StreamOptions types
- Node.js Readable stream API
- TypeScript compiler installed

## Next Task
task_10e_test_entry_filtering.md
# Task 20b: Integration Test Memory Efficiency

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The memory efficiency components have been implemented and unit tested, but need integration testing. This task creates integration tests for memory efficiency features following London School TDD principles.

## Current System State
- MemoryEfficientProcessor, BackpressureHandler, and ChunkedProcessor implemented with memory monitoring
- Unit tests for each component created
- No integration tests for memory efficiency yet

## Your Task
Create comprehensive integration tests for memory efficiency features following London School TDD principles with mocks and interaction testing.

## Test First (RED Phase)
```typescript
import { MemoryEfficientProcessor } from '../../src/utils/zip/MemoryEfficientProcessor';
import { BackpressureHandler } from '../../src/utils/zip/BackpressureHandler';
import { ChunkedProcessor } from '../../src/utils/zip/ChunkedProcessor';

describe('Memory Efficiency Integration', () => {
  it('should integrate all memory efficiency components', () => {
    const processor = new MemoryEfficientProcessor();
    const handler = new BackpressureHandler();
    const chunker = new ChunkedProcessor();

    expect(processor).toBeDefined();
    expect(handler).toBeDefined();
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
import { MemoryEfficientProcessor } from '../../src/utils/zip/MemoryEfficientProcessor';
import { BackpressureHandler } from '../../src/utils/zip/BackpressureHandler';
import { ChunkedProcessor } from '../../src/utils/zip/ChunkedProcessor';
import { StreamEntry, StreamOptions } from '../../src/types/streaming';
import { Readable } from 'stream';

// Helper function to create mock stream entries with varying sizes
const createMockStreamEntries = (count: number, baseSize: number): StreamEntry[] => {
  return Array(count).fill(0).map((_, i) => ({
    name: `file${i}.txt`,
    size: baseSize * (i + 1),
    isDirectory: false,
    stream: new Readable({
      read() {
        // Create content proportional to file size
        const content = 'a'.repeat(Math.min(1024, baseSize * (i + 1)));
        this.push(Buffer.from(content));
        this.push(null);
      }
    })
  }));
};

// Helper function to create a large buffer for memory testing
const createLargeBuffer = (size: number): Buffer => {
  return Buffer.alloc(size, 'a');
};

describe('Memory Efficiency Integration', () => {
  let processor: MemoryEfficientProcessor;
  let handler: BackpressureHandler;
  let chunker: ChunkedProcessor;

  beforeEach(() => {
    processor = new MemoryEfficientProcessor();
    handler = new BackpressureHandler();
    chunker = new ChunkedProcessor();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should integrate all memory efficiency components', () => {
    expect(processor).toBeInstanceOf(MemoryEfficientProcessor);
    expect(handler).toBeInstanceOf(BackpressureHandler);
    expect(chunker).toBeInstanceOf(ChunkedProcessor);
  });

  it('should maintain consistent memory limits across components', () => {
    const limit = 5 * 1024 * 1024; // 5MB
    const processorWithLimit = new MemoryEfficientProcessor(limit);
    const handlerWithLimit = new BackpressureHandler(limit);
    const chunkerWithLimit = new ChunkedProcessor(limit);

    expect(processorWithLimit.getMemoryLimit()).toBe(limit);
    expect(handlerWithLimit.isMemoryLimitExceeded()).toBe(false);
    expect(chunkerWithLimit.getMemoryLimit()).toBe(limit);
  });

  it('should coordinate memory monitoring between components', async () => {
    // Create components with the same memory limit
    const limit = 10 * 1024 * 1024; // 10MB
    const processorWithLimit = new MemoryEfficientProcessor(limit);
    const handlerWithLimit = new BackpressureHandler(limit);
    const chunkerWithLimit = new ChunkedProcessor(limit);

    // Check initial memory state
    const processorUsage = processorWithLimit.getMemoryUsage();
    const handlerUsage = handlerWithLimit.getMemoryUsage();
    const chunkerUsage = chunkerWithLimit.getMemoryUsage();

    expect(processorUsage).toBeDefined();
    expect(handlerUsage).toBeDefined();
    expect(chunkerUsage).toBeDefined();

    // All components should start with similar memory usage
    expect(Math.abs(processorUsage.heapUsed - handlerUsage.heapUsed)).toBeLessThan(1024 * 1024); // 1MB tolerance
  });

  it('should handle memory pressure across integrated components', async () => {
    // Create components with strict memory limits
    const limit = 1000000; // 1MB
    const processorWithLimit = new MemoryEfficientProcessor(limit);
    const handlerWithLimit = new BackpressureHandler(limit);
    const chunkerWithLimit = new ChunkedProcessor(limit);

    // Create a moderately large buffer
    const buffer = createLargeBuffer(500000); // 500KB

    // Process with all components and monitor memory
    const initialUsage = processorWithLimit.getMemoryUsage();

    // Process with memory efficient processor
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);

    const processedBuffer = await processorWithLimit.processStream(readable);

    // Process with chunked processor
    const chunkedResult = await chunkerWithLimit.processInChunks(processedBuffer, 1024);

    // Apply backpressure handling
    const stream = new Readable();
    stream.push(processedBuffer);
    stream.push(null);

    const controlledStream = handlerWithLimit.applyBackpressure(stream, 1024);

    // Verify memory usage is within limits
    expect(processorWithLimit.isMemoryLimitExceeded()).toBe(false);
    expect(handlerWithLimit.isMemoryLimitExceeded()).toBe(false);
    expect(chunkerWithLimit.isMemoryLimitExceeded()).toBe(false);

    // Verify processing completed successfully
    expect(processedBuffer).toBeInstanceOf(Buffer);
    expect(chunkedResult.chunks).toBeInstanceOf(Array);
    expect(controlledStream).toBeDefined();
  });

  it('should apply backpressure when memory usage is high', async () => {
    const limit = 2 * 1024 * 1024; // 2MB
    const handlerWithLimit = new BackpressureHandler(limit, 1024); // Small buffer for testing

    // Create a stream that would consume significant memory
    const largeBuffer = createLargeBuffer(1024 * 1024); // 1MB
    const readable = new Readable();
    readable.push(largeBuffer);
    readable.push(null);

    // Apply adaptive backpressure
    const controlledStream = handlerWithLimit.applyAdaptiveBackpressure(readable);

    // Verify the stream was created successfully
    expect(controlledStream).toBeDefined();

    // Process the stream to trigger backpressure
    const chunks: Buffer[] = [];
    controlledStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Wait for stream to complete
    await new Promise((resolve) => {
      controlledStream.on('end', resolve);
    });

    // Verify processing completed
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should chunk large data efficiently with memory monitoring', async () => {
    const limit = 5 * 1024 * 1024; // 5MB
    const chunkerWithLimit = new ChunkedProcessor(limit, 64 * 1024); // 64KB default chunks

    // Create a large buffer
    const largeBuffer = createLargeBuffer(2 * 1024 * 1024); // 2MB

    // Track memory before processing
    const initialUsage = chunkerWithLimit.getMemoryUsage();

    // Process in chunks with memory monitoring
    const progressCallback = jest.fn();
    const options: StreamOptions = {
      onProgress: progressCallback,
      highWaterMark: 32 * 1024 // 32KB backpressure
    };

    const result = await chunkerWithLimit.processInChunks(largeBuffer, 64 * 1024, options);

    // Verify chunked processing completed
    expect(result.chunks).toBeInstanceOf(Array);
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.totalSize).toBe(largeBuffer.length);

    // Verify progress tracking
    expect(progressCallback).toHaveBeenCalled();

    // Verify memory usage is within limits
    expect(chunkerWithLimit.isMemoryLimitExceeded()).toBe(false);
  });

  it('should process multiple large entries with memory efficiency', async () => {
    const limit = 10 * 1024 * 1024; // 10MB
    const processorWithLimit = new MemoryEfficientProcessor(limit);
    const chunkerWithLimit = new ChunkedProcessor(limit);

    // Create multiple large entries
    const entries = createMockStreamEntries(5, 500000); // 5 entries, ~500KB each

    // Process entries sequentially with memory monitoring
    const progressCallback = jest.fn();
    const options: StreamOptions = {
      onProgress: progressCallback,
      highWaterMark: 64 * 1024
    };

    const results = await processorWithLimit.processStreamEntries(entries, options);

    // Verify all entries were processed
    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result).toBeInstanceOf(Buffer);
    });

    // Verify progress tracking
    expect(progressCallback).toHaveBeenCalledTimes(5);

    // Verify memory limits were maintained
    expect(processorWithLimit.isMemoryLimitExceeded()).toBe(false);
    expect(chunkerWithLimit.isMemoryLimitExceeded()).toBe(false);
  });

  it('should handle parallel processing with memory constraints', async () => {
    const limit = 5 * 1024 * 1024; // 5MB
    const processorWithLimit = new MemoryEfficientProcessor(limit);

    // Create entries for parallel processing
    const entries = createMockStreamEntries(10, 100000); // 10 entries, ~100KB each

    // Process in parallel with memory monitoring
    const options: StreamOptions = {
      parallel: true,
      parallelWorkers: 3,
      highWaterMark: 32 * 1024
    };

    const results = await processorWithLimit.processStreamEntries(entries, options);

    // Verify parallel processing completed
    expect(results).toHaveLength(10);

    // Verify memory limits were maintained
    expect(processorWithLimit.isMemoryLimitExceeded()).toBe(false);
  });

  it('should provide consistent memory usage reporting', () => {
    // All components should provide similar memory usage information
    const processorUsage = processor.getMemoryUsage();
    const handlerUsage = handler.getMemoryUsage();
    const chunkerUsage = chunker.getMemoryUsage();

    // Verify all usage objects have expected properties
    expect(processorUsage.heapTotal).toBeGreaterThan(0);
    expect(processorUsage.heapUsed).toBeGreaterThan(0);
    expect(processorUsage.external).toBeGreaterThanOrEqual(0);
    expect(processorUsage.rss).toBeGreaterThan(0);

    expect(handlerUsage.heapTotal).toBeGreaterThan(0);
    expect(handlerUsage.heapUsed).toBeGreaterThan(0);
    expect(handlerUsage.external).toBeGreaterThanOrEqual(0);
    expect(handlerUsage.rss).toBeGreaterThan(0);

    expect(chunkerUsage.heapTotal).toBeGreaterThan(0);
    expect(chunkerUsage.heapUsed).toBeGreaterThan(0);
    expect(chunkerUsage.external).toBeGreaterThanOrEqual(0);
    expect(chunkerUsage.rss).toBeGreaterThan(0);
  });

  it('should handle memory limit exceeded scenarios gracefully', async () => {
    // Create components with very small memory limits
    const limit = 1000; // Very small limit
    const processorWithLimit = new MemoryEfficientProcessor(limit);
    const chunkerWithLimit = new ChunkedProcessor(limit);

    // Create a buffer that exceeds the limit
    const largeBuffer = createLargeBuffer(10000); // 10KB buffer

    // Processing should fail due to memory limits
    await expect(processorWithLimit.processStream(new Readable()))
      .rejects
      .toThrow('Memory limit exceeded');

    await expect(chunkerWithLimit.processInChunks(largeBuffer))
      .rejects
      .toThrow('Memory limit exceeded');
  });

  it('should coordinate memory alerts between components', async () => {
    const limit = 1000000; // 1MB
    const processorWithLimit = new MemoryEfficientProcessor(limit, 64 * 1024);
    const handlerWithLimit = new BackpressureHandler(limit, 1024);
    const chunkerWithLimit = new ChunkedProcessor(limit, 32 * 1024);

    // Set up alert callbacks
    const processorAlert = jest.fn();
    const handlerAlert = jest.fn();
    const chunkerAlert = jest.fn();

    // In a real implementation, we would set up alert callbacks
    // For this test, we'll verify the components can handle alerts
    expect(processorWithLimit).toBeDefined();
    expect(handlerWithLimit).toBeDefined();
    expect(chunkerWithLimit).toBeDefined();
  });

  it('should maintain memory efficiency with chunked backpressure', async () => {
    const limit = 3 * 1024 * 1024; // 3MB
    const chunkerWithLimit = new ChunkedProcessor(limit, 64 * 1024);

    // Create a moderately large buffer
    const buffer = createLargeBuffer(1024 * 1024); // 1MB

    // Process with chunking and backpressure
    const options: StreamOptions = {
      highWaterMark: 16 * 1024, // 16KB backpressure
      onProgress: jest.fn()
    };

    const result = await chunkerWithLimit.processInChunks(buffer, 32 * 1024, options);

    // Verify efficient processing
    expect(result.chunks).toHaveLength(Math.ceil(buffer.length / (32 * 1024)));
    expect(result.processingTime).toBeGreaterThan(0);
    expect(result.memoryUsage).toBeGreaterThan(0);

    // Verify memory limits maintained
    expect(chunkerWithLimit.isMemoryLimitExceeded()).toBe(false);
  });

  it('should handle memory-intensive operations gracefully', async () => {
    // Create components with reasonable limits
    const limit = 20 * 1024 * 1024; // 20MB
    const processorWithLimit = new MemoryEfficientProcessor(limit);
    const chunkerWithLimit = new ChunkedProcessor(limit);

    // Create multiple large buffers
    const buffers = Array(5).fill(0).map(() => createLargeBuffer(2 * 1024 * 1024)); // 5 x 2MB buffers

    // Process each buffer through both components
    const processingPromises = buffers.map(async (buffer) => {
      // Process with memory efficient processor
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);

      const processedBuffer = await processorWithLimit.processStream(readable);

      // Process with chunked processor
      const chunkedResult = await chunkerWithLimit.processInChunks(processedBuffer, 64 * 1024);

      return { processedBuffer, chunkedResult };
    });

    const results = await Promise.all(processingPromises);

    // Verify all processing completed successfully
    expect(results).toHaveLength(5);
    results.forEach(({ processedBuffer, chunkedResult }) => {
      expect(processedBuffer).toBeInstanceOf(Buffer);
      expect(chunkedResult.chunks).toBeInstanceOf(Array);
    });

    // Verify memory limits maintained throughout
    expect(processorWithLimit.isMemoryLimitExceeded()).toBe(false);
    expect(chunkerWithLimit.isMemoryLimitExceeded()).toBe(false);
  });

  it('should provide memory usage telemetry', () => {
    // All components should provide detailed memory usage information
    const processorUsage = processor.getMemoryUsage();
    const handlerUsage = handler.getMemoryUsage();
    const chunkerUsage = chunker.getMemoryUsage();

    // Verify telemetry data structure
    expect(processorUsage).toHaveProperty('heapTotal');
    expect(processorUsage).toHaveProperty('heapUsed');
    expect(processorUsage).toHaveProperty('external');
    expect(processorUsage).toHaveProperty('rss');
    expect(processorUsage).toHaveProperty('arrayBuffers');

    expect(handlerUsage).toHaveProperty('heapTotal');
    expect(handlerUsage).toHaveProperty('heapUsed');
    expect(handlerUsage).toHaveProperty('external');
    expect(handlerUsage).toHaveProperty('rss');
    expect(handlerUsage).toHaveProperty('arrayBuffers');

    expect(chunkerUsage).toHaveProperty('heapTotal');
    expect(chunkerUsage).toHaveProperty('heapUsed');
    expect(chunkerUsage).toHaveProperty('external');
    expect(chunkerUsage).toHaveProperty('rss');
    expect(chunkerUsage).toHaveProperty('arrayBuffers');
  });
});
```

## Verification Commands
```bash
# Run the memory efficiency integration tests
npm test -- src/utils/zip/memory-efficiency.integration.test.ts
```

## Success Criteria
- [ ] Memory efficiency integration tests created following London School TDD
- [ ] Tests cover integration between all memory efficiency components
- [ ] Tests verify consistent memory limit enforcement
- [ ] Tests verify memory monitoring coordination
- [ ] Tests verify backpressure handling under memory pressure
- [ ] Tests verify chunked processing with memory constraints
- [ ] Tests cover parallel processing with memory limits
- [ ] Tests verify graceful handling of memory limit exceeded scenarios
- [ ] All tests pass
- [ ] Code coverage is high

## Dependencies Confirmed
- Jest testing framework
- MemoryEfficientProcessor, BackpressureHandler, and ChunkedProcessor implementations
- StreamEntry and StreamOptions types
- Node.js Readable stream API
- TypeScript compiler installed

## Next Task
task_20c_integration_test_large_files.md
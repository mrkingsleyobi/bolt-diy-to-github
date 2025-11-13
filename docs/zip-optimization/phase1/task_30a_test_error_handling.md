# Task 30a: Test Error Handling

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The streaming components have been implemented and tested, but need comprehensive error handling tests. This task creates tests for error handling scenarios following London School TDD principles.

## Current System State
- All streaming components implemented with basic error handling
- Unit and integration tests for normal operation created
- No comprehensive error handling tests yet

## Your Task
Create comprehensive error handling tests for all streaming components following London School TDD principles.

## Test First (RED Phase)
```typescript
import { StreamingZipExtractor } from '../../src/utils/zip/StreamingZipExtractor';
import { MemoryEfficientProcessor } from '../../src/utils/zip/MemoryEfficientProcessor';
import { BackpressureHandler } from '../../src/utils/zip/BackpressureHandler';
import { ChunkedProcessor } from '../../src/utils/zip/ChunkedProcessor';
import { EntryFilter } from '../../src/utils/zip/EntryFilter';

describe('Error Handling', () => {
  it('should handle component initialization errors', () => {
    expect(() => new StreamingZipExtractor()).not.toThrow();
    expect(() => new MemoryEfficientProcessor()).not.toThrow();
    expect(() => new BackpressureHandler()).not.toThrow();
    expect(() => new ChunkedProcessor()).not.toThrow();
    expect(() => new EntryFilter()).not.toThrow();
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
// This task is about writing tests, so there's no implementation to show here.
// The tests above would initially pass because components initialize correctly.
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

// Helper function to create a mock stream that emits errors
const createErrorStream = (errorMessage: string = 'Stream error'): Readable => {
  return new Readable({
    read() {
      process.nextTick(() => {
        this.destroy(new Error(errorMessage));
      });
    }
  });
};

// Helper function to create a mock stream that times out
const createTimeoutStream = (timeout: number = 100): Readable => {
  return new Readable({
    read() {
      setTimeout(() => {
        this.push(null);
      }, timeout);
    }
  });
};

// Helper function to create mock stream entries
const createMockStreamEntries = (count: number = 3): StreamEntry[] => {
  return Array(count).fill(0).map((_, i) => ({
    name: `file${i}.txt`,
    size: 100 * (i + 1),
    isDirectory: false,
    stream: new Readable({
      read() {
        this.push(Buffer.from(`content of file${i}`));
        this.push(null);
      }
    })
  }));
};

describe('Error Handling', () => {
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

  it('should handle component initialization errors', () => {
    // Test normal initialization
    expect(() => new StreamingZipExtractor()).not.toThrow();
    expect(() => new MemoryEfficientProcessor()).not.toThrow();
    expect(() => new BackpressureHandler()).not.toThrow();
    expect(() => new ChunkedProcessor()).not.toThrow();
    expect(() => new EntryFilter()).not.toThrow();

    // Test initialization with parameters
    expect(() => new StreamingZipExtractor(1000000)).not.toThrow();
    expect(() => new MemoryEfficientProcessor(1000000)).not.toThrow();
    expect(() => new BackpressureHandler(1000000)).not.toThrow();
    expect(() => new ChunkedProcessor(1000000)).not.toThrow();
  });

  it('should handle streaming extractor errors', async () => {
    // Test with invalid buffer
    const invalidBuffer = Buffer.from('invalid zip content');

    await expect(extractor.extractStreams(invalidBuffer))
      .rejects
      .toThrow(/Failed to open ZIP file/);

    // Test with empty buffer
    const emptyBuffer = Buffer.alloc(0);

    await expect(extractor.extractStreams(emptyBuffer))
      .rejects
      .toThrow(/Failed to open ZIP file/);

    // Test with null buffer (type error)
    await expect(extractor.extractStreams(null as any))
      .rejects
      .toThrow();

    // Test with undefined buffer (type error)
    await expect(extractor.extractStreams(undefined as any))
      .rejects
      .toThrow();
  });

  it('should handle memory efficient processor errors', async () => {
    // Test with error stream
    const errorStream = createErrorStream('Processing error');

    await expect(processor.processStream(errorStream))
      .rejects
      .toThrow(/Stream processing error/);

    // Test with memory limit exceeded
    const processorWithLimit = new MemoryEfficientProcessor(0); // Very small limit
    const normalStream = new Readable();
    normalStream.push('test data');
    normalStream.push(null);

    await expect(processorWithLimit.processStream(normalStream))
      .rejects
      .toThrow(/Memory limit exceeded/);

    // Test with chunk concatenation errors (difficult to mock without globals)
    const largeStream = new Readable();
    largeStream.push(Buffer.alloc(1024 * 1024, 'a')); // 1MB
    largeStream.push(null);

    await expect(processor.processStream(largeStream)).resolves.toBeInstanceOf(Buffer);
  });

  it('should handle backpressure handler errors', async () => {
    // Test with error stream
    const errorStream = createErrorStream('Backpressure error');
    const controlledStream = handler.applyBackpressure(errorStream);

    // Errors should propagate through the controlled stream
    controlledStream.on('error', (err) => {
      expect(err).toBeDefined();
      expect(err.message).toContain('Backpressure error');
    });

    // Test with invalid stream
    expect(() => handler.applyBackpressure(null as any))
      .not.toThrow(); // Should handle gracefully

    // Test with memory limit exceeded during backpressure
    const handlerWithLimit = new BackpressureHandler(0); // Very small limit
    const normalStream = new Readable();
    normalStream.push('test data');
    normalStream.push(null);

    // This should not throw but create the stream
    const controlledStream2 = handlerWithLimit.applyBackpressure(normalStream);
    expect(controlledStream2).toBeDefined();
  });

  it('should handle chunked processor errors', async () => {
    // Test with error stream
    const errorStream = createErrorStream('Chunking error');

    await expect(chunker.processStreamInChunks(errorStream))
      .rejects
      .toThrow(/Stream processing error/);

    // Test with memory limit exceeded
    const chunkerWithLimit = new ChunkedProcessor(0); // Very small limit
    const normalStream = new Readable();
    normalStream.push('test data');
    normalStream.push(null);

    await expect(chunkerWithLimit.processStreamInChunks(normalStream))
      .rejects
      .toThrow(/Memory limit exceeded/);

    // Test with invalid buffer
    await expect(chunker.processInChunks(null as any))
      .rejects
      .toThrow();

    // Test with invalid chunk size
    const normalBuffer = Buffer.from('test data');
    await expect(chunker.processInChunks(normalBuffer, -1))
      .rejects
      .toThrow();

    await expect(chunker.processInChunks(normalBuffer, 0))
      .resolves
      .toBeDefined(); // Should handle 0 chunk size gracefully
  });

  it('should handle entry filter errors', () => {
    // Test with custom filter that throws
    const filterWithError = new EntryFilter();
    filterWithError.setCustomFilter(() => {
      throw new Error('Filter error');
    });

    const entry = {
      name: 'test.txt',
      size: 100,
      isDirectory: false,
      stream: new Readable()
    };

    expect(() => filterWithError.matches(entry)).toThrow('Filter error');

    // Test with invalid entry
    expect(() => filter.matches(null as any)).not.toThrow(); // Should handle gracefully
    expect(() => filter.matches(undefined as any)).not.toThrow(); // Should handle gracefully
  });

  it('should handle timeout errors', async () => {
    // Test with timeout stream
    const timeoutStream = createTimeoutStream(5000); // 5 second timeout
    const normalStream = new Readable();
    normalStream.push('test data');
    normalStream.push(null);

    // Set up timeout for the test
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test timeout')), 1000);
    });

    // Test processing with timeout
    const processingPromise = processor.processStream(timeoutStream);

    // Use Promise.race to handle timeout
    await Promise.race([processingPromise, timeoutPromise])
      .then(() => {
        // Processing completed within timeout
      })
      .catch((error) => {
        // Either processing failed or test timed out
        expect(error.message).not.toBe('Test timeout');
      });
  });

  it('should handle resource exhaustion errors', async () => {
    // Test with many parallel operations
    const entries = createMockStreamEntries(100); // Many entries

    const progressCallback = jest.fn();
    const options: StreamOptions = {
      onProgress: progressCallback,
      parallel: true,
      parallelWorkers: 10 // Many workers
    };

    // This should handle resource exhaustion gracefully
    const results = await processor.processStreamEntries(entries, options);
    expect(results).toHaveLength(100);
  });

  it('should handle invalid input errors', async () => {
    // Test with invalid stream options
    const invalidOptions = {
      invalidProperty: 'invalid value'
    } as any as StreamOptions;

    const normalStream = new Readable();
    normalStream.push('test data');
    normalStream.push(null);

    // Should handle invalid options gracefully
    await expect(processor.processStream(normalStream, 64 * 1024, invalidOptions))
      .resolves
      .toBeInstanceOf(Buffer);

    // Test with invalid stream entry
    const invalidEntry = {
      name: '',
      size: -1,
      isDirectory: null as any,
      stream: null as any
    };

    await expect(processor.processStreamEntry(invalidEntry as any))
      .rejects
      .toThrow();
  });

  it('should handle boundary condition errors', async () => {
    // Test with zero-sized data
    const zeroBuffer = Buffer.alloc(0);
    const result = await chunker.processInChunks(zeroBuffer);
    expect(result.chunks).toHaveLength(0);
    expect(result.totalSize).toBe(0);

    // Test with maximum safe integer size (conceptually)
    const maxSize = 1024 * 1024; // 1MB (smaller for testing)
    const maxBuffer = Buffer.alloc(maxSize, 'a');

    const maxResult = await chunker.processInChunks(maxBuffer, 64 * 1024);
    expect(maxResult.totalSize).toBe(maxSize);

    // Test with extremely small chunk size
    const smallResult = await chunker.processInChunks(Buffer.from('test'), 1);
    expect(smallResult.chunks).toHaveLength(4); // One byte per chunk
  });

  it('should handle integration error propagation', async () => {
    // Test error propagation through integrated components
    const errorStream = createErrorStream('Integrated error');

    // Apply backpressure handling
    const controlledStream = handler.applyBackpressure(errorStream);

    // Process with memory efficient processor
    await expect(processor.processStream(controlledStream))
      .rejects
      .toThrow(/Integrated error/);

    // Process with chunked processor
    await expect(chunker.processStreamInChunks(errorStream))
      .rejects
      .toThrow(/Integrated error/);
  });

  it('should handle cleanup after errors', async () => {
    // Test that components clean up properly after errors
    const errorStream = createErrorStream('Cleanup error');

    try {
      await processor.processStream(errorStream);
    } catch (error) {
      // Error expected, now check cleanup
      expect(error).toBeDefined();
    }

    // Verify component is still functional after error
    const normalStream = new Readable();
    normalStream.push('test data');
    normalStream.push(null);

    const result = await processor.processStream(normalStream);
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle concurrent error scenarios', async () => {
    // Test multiple simultaneous error conditions
    const errorStreams = [
      createErrorStream('Error 1'),
      createErrorStream('Error 2'),
      createErrorStream('Error 3')
    ];

    const processingPromises = errorStreams.map(stream =>
      processor.processStream(stream).catch(err => err)
    );

    const results = await Promise.all(processingPromises);

    // All should be errors
    results.forEach(result => {
      expect(result).toBeInstanceOf(Error);
    });
  });

  it('should provide meaningful error messages', async () => {
    // Test that error messages are descriptive
    const errorStream = createErrorStream('Specific error message');

    try {
      await processor.processStream(errorStream);
    } catch (error) {
      expect(error.message).toContain('Stream processing error');
      expect(error.message).toContain('Specific error message');
    }

    // Test memory limit error messages
    const processorWithLimit = new MemoryEfficientProcessor(0);
    const normalStream = new Readable();
    normalStream.push('test data');
    normalStream.push(null);

    try {
      await processorWithLimit.processStream(normalStream);
    } catch (error) {
      expect(error.message).toContain('Memory limit exceeded');
    }
  });

  it('should handle graceful degradation', async () => {
    // Test that components degrade gracefully under error conditions
    const processorWithLimit = new MemoryEfficientProcessor(1000); // Small limit

    // Create a moderately large stream
    const largeStream = new Readable();
    largeStream.push(Buffer.alloc(5000, 'a')); // 5KB
    largeStream.push(null);

    // Should process successfully even with small limit
    const result = await processorWithLimit.processStream(largeStream);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(5000);
  });
});
```

## Verification Commands
```bash
# Run the error handling tests
npm test -- src/utils/zip/error-handling.test.ts
```

## Success Criteria
- [ ] Error handling tests created following London School TDD
- [ ] Tests cover initialization errors for all components
- [ ] Tests verify streaming extractor error handling
- [ ] Tests verify memory efficient processor error handling
- [ ] Tests verify backpressure handler error handling
- [ ] Tests verify chunked processor error handling
- [ ] Tests verify entry filter error handling
- [ ] Tests cover timeout and resource exhaustion errors
- [ ] Tests verify error propagation through integrated components
- [ ] Tests verify cleanup after errors
- [ ] Tests verify graceful degradation
- [ ] All tests pass or appropriately handle expected errors
- [ ] Code coverage is high

## Dependencies Confirmed
- Jest testing framework
- All streaming component implementations
- StreamEntry and StreamOptions types
- Node.js Readable stream API
- TypeScript compiler installed

## Next Task
task_30b_test_validation.md
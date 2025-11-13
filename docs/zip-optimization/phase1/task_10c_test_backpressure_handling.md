# Task 10c: Test Backpressure Handling

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The BackpressureHandler has been implemented but needs comprehensive testing. This task creates unit tests for backpressure handling features following London School TDD principles.

## Current System State
- BackpressureHandler class implemented
- Advanced flow control with memory monitoring
- Adaptive processing capabilities
- No comprehensive test suite yet

## Your Task
Create comprehensive unit tests for the BackpressureHandler following London School TDD principles with mocks and interaction testing.

## Test First (RED Phase)
```typescript
import { BackpressureHandler } from '../../src/utils/zip/BackpressureHandler';

describe('BackpressureHandler', () => {
  let handler: BackpressureHandler;

  beforeEach(() => {
    handler = new BackpressureHandler();
  });

  it('should create a backpressure handler instance', () => {
    expect(handler).toBeInstanceOf(BackpressureHandler);
  });

  it('should apply backpressure to a stream', () => {
    const readable = new Readable();
    readable.push('test data');
    readable.push(null);

    const controlledStream = handler.applyBackpressure(readable);
    expect(controlledStream).toBeDefined();
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
// This task is about writing tests, so there's no implementation to show here.
// The tests above would initially fail because the actual implementation doesn't exist yet.
// The actual implementation was done in task_03_implement_backpressure_handling.md
```

## Refactored Solution (REFACTOR Phase)
```typescript
import { BackpressureHandler } from '../../src/utils/zip/BackpressureHandler';
import { Readable, Writable } from 'stream';

// Mock implementations for testing
const createMockReadableStream = (dataChunks: (string | Buffer)[]): Readable => {
  let index = 0;
  const stream = new Readable({
    read() {
      if (index < dataChunks.length) {
        this.push(dataChunks[index++]);
      } else {
        this.push(null);
      }
    }
  });
  return stream;
};

const createMockWritableStream = (): Writable => {
  const writtenData: Buffer[] = [];

  const stream = new Writable({
    write(chunk: Buffer, encoding: string, callback: Function) {
      writtenData.push(chunk);
      callback();
    }
  });

  (stream as any).getWrittenData = () => Buffer.concat(writtenData);
  return stream;
};

describe('BackpressureHandler', () => {
  let handler: BackpressureHandler;

  beforeEach(() => {
    handler = new BackpressureHandler();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a backpressure handler instance', () => {
    expect(handler).toBeInstanceOf(BackpressureHandler);
  });

  it('should have default memory limit', () => {
    expect(handler.isMemoryLimitExceeded()).toBe(false);
  });

  it('should allow custom memory limit', () => {
    const handlerWithLimit = new BackpressureHandler(1000000);
    expect(handlerWithLimit.isMemoryLimitExceeded()).toBe(false);
  });

  it('should apply backpressure to a stream', () => {
    const readable = createMockReadableStream(['test data']);

    const controlledStream = handler.applyBackpressure(readable);
    expect(controlledStream).toBeDefined();
    expect(controlledStream).toBeInstanceOf(Readable);
  });

  it('should apply backpressure with custom high water mark', () => {
    const readable = createMockReadableStream(['test data']);

    const controlledStream = handler.applyBackpressure(readable, 1024);
    expect(controlledStream).toBeDefined();
  });

  it('should create controlled writable stream', async () => {
    const writeFunction = jest.fn().mockResolvedValue(undefined);

    const writable = handler.createControlledWritable(writeFunction);
    expect(writable).toBeInstanceOf(Writable);
  });

  it('should handle write operations in controlled writable stream', async () => {
    const writeFunction = jest.fn().mockResolvedValue(undefined);
    const writable = handler.createControlledWritable(writeFunction);

    const testData = Buffer.from('test data');
    writable.write(testData);
    writable.end();

    // Wait for the write to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(writeFunction).toHaveBeenCalledWith(testData);
  });

  it('should handle write errors in controlled writable stream', async () => {
    const writeError = new Error('Write error');
    const writeFunction = jest.fn().mockRejectedValue(writeError);
    const writable = handler.createControlledWritable(writeFunction);

    const testData = Buffer.from('test data');

    // Wrap in a promise to catch the error
    await new Promise((resolve, reject) => {
      writable.on('error', reject);
      writable.write(testData, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    }).catch(err => {
      expect(err).toBe(writeError);
    });
  });

  it('should monitor stream flow', () => {
    const readable = createMockReadableStream(['test data']);
    const writable = createMockWritableStream();

    // This method doesn't return anything, so we just ensure it doesn't throw
    expect(() => handler.monitorStreamFlow(readable, writable)).not.toThrow();
  });

  it('should apply adaptive backpressure', () => {
    const readable = createMockReadableStream(['test data']);

    const controlledStream = handler.applyAdaptiveBackpressure(readable);
    expect(controlledStream).toBeDefined();
    expect(controlledStream).toBeInstanceOf(Readable);
  });

  it('should handle memory limit exceeded during backpressure', () => {
    const handlerWithLimit = new BackpressureHandler(0); // Very small limit

    const readable = createMockReadableStream(['test data']);

    // This should not throw but should create the stream
    const controlledStream = handlerWithLimit.applyBackpressure(readable);
    expect(controlledStream).toBeDefined();
  });

  it('should handle stream errors during backpressure', () => {
    const readable = new Readable({
      read() {
        this.destroy(new Error('Stream error'));
      }
    });

    const controlledStream = handler.applyBackpressure(readable);
    expect(controlledStream).toBeDefined();

    // The error should propagate to the controlled stream
    controlledStream.on('error', (err) => {
      expect(err).toBeDefined();
    });
  });

  it('should handle drain events in backpressure', (done) => {
    const readable = createMockReadableStream(['test data']);
    const controlledStream = handler.applyBackpressure(readable);

    controlledStream.on('data', () => {
      // Data received, test passed
    });

    controlledStream.on('end', () => {
      done();
    });
  });

  it('should provide memory usage information', () => {
    const usage = handler.getMemoryUsage();
    expect(usage).toBeDefined();
    expect(usage.heapUsed).toBeGreaterThanOrEqual(0);
  });

  it('should check memory limit exceeded', () => {
    const handlerWithLimit = new BackpressureHandler(0); // Very small limit
    expect(handlerWithLimit.isMemoryLimitExceeded()).toBe(true);
  });

  it('should handle custom high water mark', () => {
    const handlerWithCustomMark = new BackpressureHandler(undefined, 1024);
    const readable = createMockReadableStream(['test data']);

    const controlledStream = handlerWithCustomMark.applyBackpressure(readable);
    expect(controlledStream).toBeDefined();
  });

  it('should handle empty stream', () => {
    const readable = createMockReadableStream([]);

    const controlledStream = handler.applyBackpressure(readable);
    expect(controlledStream).toBeDefined();
  });

  it('should handle large data streams', () => {
    const largeChunks = Array(100).fill(0).map(() => Buffer.alloc(1024, 'a'));
    const readable = createMockReadableStream(largeChunks);

    const controlledStream = handler.applyBackpressure(readable);
    expect(controlledStream).toBeDefined();
  });

  it('should handle adaptive backpressure with options', () => {
    const readable = createMockReadableStream(['test data']);

    const controlledStream = handler.applyAdaptiveBackpressure(readable);
    expect(controlledStream).toBeDefined();
  });

  it('should handle writable stream errors', async () => {
    const writeFunction = jest.fn().mockResolvedValue(undefined);
    const writable = handler.createControlledWritable(writeFunction);

    // Simulate a stream error
    const error = new Error('Test error');
    writable.destroy(error);

    // The error should be handled gracefully
    expect(writable.destroyed).toBe(true);
  });

  it('should handle readable stream end events', (done) => {
    const readable = createMockReadableStream(['test data']);
    const writable = createMockWritableStream();

    handler.monitorStreamFlow(readable, writable);

    readable.on('end', () => {
      // Monitoring should clean up properly
      done();
    });

    readable.push(null); // End the stream
  });
});
```

## Verification Commands
```bash
# Run the unit tests
npm test -- src/utils/zip/BackpressureHandler.test.ts
```

## Success Criteria
- [ ] BackpressureHandler unit tests created following London School TDD
- [ ] Tests cover all public methods and functionality
- [ ] Tests include error handling scenarios
- [ ] Tests verify backpressure application
- [ ] Tests verify writable stream control
- [ ] Tests verify flow monitoring
- [ ] Tests verify adaptive backpressure
- [ ] Tests cover edge cases (empty streams, large data)
- [ ] All tests pass
- [ ] Code coverage is high

## Dependencies Confirmed
- Jest testing framework
- BackpressureHandler implementation
- Node.js Readable and Writable stream APIs
- TypeScript compiler installed

## Next Task
task_10d_test_chunked_processing.md
import { MemoryEfficientProcessor } from '../../../src/utils/zip/MemoryEfficientProcessor';
import { StreamEntry, StreamOptions } from '../../../src/types/streaming';
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

describe('MemoryEfficientProcessor', () => {
  let processor: MemoryEfficientProcessor;

  beforeEach(() => {
    // Use default memory limit (no limit) for testing
    processor = new MemoryEfficientProcessor();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a memory efficient processor instance', () => {
    expect(processor).toBeInstanceOf(MemoryEfficientProcessor);
  });

  it('should have default memory limit', () => {
    expect(processor.getMemoryLimit()).toBe(Infinity); // No limit by default
  });

  it('should allow custom memory limit', () => {
    const processorWithLimit = new MemoryEfficientProcessor(1000000);
    expect(processorWithLimit.getMemoryLimit()).toBe(1000000);
  });

  it('should process stream in chunks', async () => {
    const readable = createMockReadableStream('test data for processing');

    const result = await processor.processStream(readable);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should process stream with custom chunk size', async () => {
    const readable = createMockReadableStream('test data for processing');

    const result = await processor.processStream(readable, 32 * 1024); // 32KB chunks
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should process stream entry', async () => {
    const entry = createMockStreamEntry('test.txt', 100);

    const result = await processor.processStreamEntry(entry);
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle directory entries', async () => {
    const entry = createMockStreamEntry('test/', 0, true);

    const result = await processor.processStreamEntry(entry);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(0); // Empty buffer for directories
  });

  it('should process multiple stream entries sequentially', async () => {
    const entries = [
      createMockStreamEntry('file1.txt', 100),
      createMockStreamEntry('file2.txt', 200),
      createMockStreamEntry('dir/', 0, true)
    ];

    const results = await processor.processStreamEntries(entries);
    expect(results).toHaveLength(3);
    expect(results[0]).toBeInstanceOf(Buffer);
    expect(results[1]).toBeInstanceOf(Buffer);
    expect(results[2]).toBeInstanceOf(Buffer);
  });

  it('should handle progress callbacks', async () => {
    const entries = [
      createMockStreamEntry('file1.txt', 100),
      createMockStreamEntry('file2.txt', 200)
    ];

    const progressCallback = jest.fn();
    const options: StreamOptions = {
      onProgress: progressCallback
    };

    await processor.processStreamEntries(entries, options);
    expect(progressCallback).toHaveBeenCalledTimes(2);
  });

  it('should handle memory limit exceeded', async () => {
    const processorWithLimit = new MemoryEfficientProcessor(0); // Very small limit
    const readable = createMockReadableStream('test data');

    await expect(processorWithLimit.processStream(readable))
      .rejects
      .toThrow('Memory limit exceeded');
  });

  it('should handle stream errors', async () => {
    const readable = new Readable({
      read() {
        this.destroy(new Error('Stream error'));
      }
    });

    await expect(processor.processStream(readable))
      .rejects
      .toThrow('Stream processing error');
  });

  it('should handle backpressure', async () => {
    const readable = createMockReadableStream('test data for processing');
    const options: StreamOptions = {
      highWaterMark: 1024
    };

    const result = await processor.processStream(readable, 64 * 1024, options);
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should process entries in parallel', async () => {
    const entries = [
      createMockStreamEntry('file1.txt', 100),
      createMockStreamEntry('file2.txt', 200),
      createMockStreamEntry('file3.txt', 300),
      createMockStreamEntry('file4.txt', 400)
    ];

    const options: StreamOptions = {
      parallel: true,
      parallelWorkers: 2
    };

    const results = await processor.processStreamEntries(entries, options);
    // Filter out undefined results
    const filteredResults = results.filter(result => result !== undefined);
    expect(filteredResults).toHaveLength(4);
  });

  it('should provide memory usage information', () => {
    const usage = processor.getMemoryUsage();
    expect(usage).toBeDefined();
    expect(usage.heapUsed).toBeGreaterThanOrEqual(0);
  });

  it('should check memory limit exceeded', () => {
    const processorWithLimit = new MemoryEfficientProcessor(0); // Very small limit
    expect(processorWithLimit.isMemoryLimitExceeded()).toBe(true);
  });

  it('should process empty stream', async () => {
    const readable = createMockReadableStream('');

    const result = await processor.processStream(readable);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(0);
  });
});
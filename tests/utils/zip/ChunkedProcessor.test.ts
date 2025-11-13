import { ChunkedProcessor } from '../../../src/utils/zip/ChunkedProcessor';
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

describe('ChunkedProcessor', () => {
  let processor: ChunkedProcessor;

  beforeEach(() => {
    // Use default memory limit (no limit) for testing
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
    console.log('DEBUG processInChunks: Current heapUsed:', processorWithLimit.getMemoryUsage().heapUsed);
    console.log('DEBUG processInChunks: Limit:', processorWithLimit.getMemoryLimit());
    console.log('DEBUG processInChunks: Is limit exceeded before processing:', processorWithLimit.isMemoryLimitExceeded());
    const data = Buffer.from('test data');

    await expect(processorWithLimit.processInChunks(data))
      .rejects
      .toThrow(/Memory limit exceeded/);
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

  it('should provide memory usage information', () => {
    const usage = processor.getMemoryUsage();
    expect(usage).toBeDefined();
    expect(usage.heapUsed).toBeGreaterThanOrEqual(0);
  });

  it('should check memory limit exceeded', () => {
    const processorWithLimit = new ChunkedProcessor(0); // Very small limit
    console.log('DEBUG isMemoryLimitExceeded: Current heapUsed:', processorWithLimit.getMemoryUsage().heapUsed);
    console.log('DEBUG isMemoryLimitExceeded: Limit:', processorWithLimit.getMemoryLimit());
    console.log('DEBUG isMemoryLimitExceeded: Is limit exceeded:', processorWithLimit.isMemoryLimitExceeded());
    expect(processorWithLimit.isMemoryLimitExceeded()).toBe(true);
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
});
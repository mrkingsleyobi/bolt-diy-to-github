# Task 40b: Create Examples

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The streaming components have been implemented and documented, but practical examples are needed. This task creates comprehensive examples demonstrating the new streaming features.

## Current System State
- All streaming components implemented with documentation
- No practical examples yet

## Your Task
Create comprehensive examples demonstrating the new streaming ZIP processing features.

## Test First (RED Phase)
```typescript
// This task is about creating examples, not writing tests.
// There's no test to write here as we're creating example code.
```

## Minimal Implementation (GREEN Phase)
```typescript
// This task is about creating examples, not implementing code.
// There's no implementation to show here.
```

## Refactored Solution (REFACTOR Phase)
```typescript
/*
 * Streaming ZIP Processing Examples
 *
 * These examples demonstrate the usage of the new streaming ZIP processing components.
 */

import {
  StreamingZipExtractor,
  MemoryEfficientProcessor,
  BackpressureHandler,
  ChunkedProcessor,
  EntryFilter
} from '../src/utils/zip';
import { StreamEntry, StreamOptions } from '../src/types/streaming';
import { createReadStream, promises as fs } from 'fs';
import { join } from 'path';

/**
 * Example 1: Basic Streaming Extraction
 *
 * Demonstrates basic usage of the StreamingZipExtractor
 */
async function basicStreamingExtraction() {
  console.log('=== Example 1: Basic Streaming Extraction ===');

  try {
    // Initialize extractor with 50MB memory limit
    const extractor = new StreamingZipExtractor(50 * 1024 * 1024);

    // Read ZIP file
    const zipBuffer = await fs.readFile(join(__dirname, 'sample.zip'));

    // Extract streams with progress tracking
    const entries = await extractor.extractStreams(zipBuffer, {
      onProgress: (progress) => {
        console.log(`Extraction progress: ${progress.percentage}% (${progress.processed}/${progress.total} entries)`);
      }
    });

    console.log(`Extracted ${entries.length} entries`);
    entries.forEach(entry => {
      console.log(`  - ${entry.name} (${entry.size} bytes)`);
    });
  } catch (error) {
    console.error('Error in basic streaming extraction:', error);
  }
}

/**
 * Example 2: Memory Efficient Processing
 *
 * Demonstrates memory-efficient processing of large files
 */
async function memoryEfficientProcessing() {
  console.log('\n=== Example 2: Memory Efficient Processing ===');

  try {
    // Initialize processor with 100MB memory limit
    const processor = new MemoryEfficientProcessor(100 * 1024 * 1024);

    // Create a large file stream
    const largeFileStream = createReadStream(join(__dirname, 'large-file.dat'));

    // Process stream with 64KB chunks and backpressure
    const buffer = await processor.processStream(largeFileStream, 64 * 1024, {
      highWaterMark: 32 * 1024, // 32KB backpressure
      onProgress: (progress) => {
        console.log(`Processing: ${progress.percentage}% (${progress.processed}/${progress.total} bytes)`);
        console.log(`Memory usage: ${Math.round(progress.memoryUsage / 1024 / 1024)}MB`);
      }
    });

    console.log(`Processed buffer size: ${buffer.length} bytes`);
  } catch (error) {
    console.error('Error in memory efficient processing:', error);
  }
}

/**
 * Example 3: Backpressure Handling
 *
 * Demonstrates advanced backpressure handling for stream control
 */
async function backpressureHandling() {
  console.log('\n=== Example 3: Backpressure Handling ===');

  try {
    // Initialize backpressure handler with 50MB limit
    const handler = new BackpressureHandler(50 * 1024 * 1024, 16 * 1024); // 16KB default high water mark

    // Create a stream that might overwhelm memory
    const fastStream = createReadStream(join(__dirname, 'fast-data.dat'));

    // Apply adaptive backpressure
    const controlledStream = handler.applyAdaptiveBackpressure(fastStream, {
      highWaterMark: 32 * 1024,
      onProgress: (progress) => {
        console.log(`Backpressure control: ${progress.percentage}%`);
      }
    });

    // Process the controlled stream
    const chunks: Buffer[] = [];
    controlledStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      console.log(`Received chunk of ${chunk.length} bytes`);
    });

    controlledStream.on('end', () => {
      console.log(`Total chunks received: ${chunks.length}`);
      console.log(`Total data processed: ${chunks.reduce((sum, chunk) => sum + chunk.length, 0)} bytes`);
    });

    // Wait for stream completion
    await new Promise((resolve) => {
      controlledStream.on('end', resolve);
    });
  } catch (error) {
    console.error('Error in backpressure handling:', error);
  }
}

/**
 * Example 4: Chunked Processing
 *
 * Demonstrates processing large data in configurable chunks
 */
async function chunkedProcessing() {
  console.log('\n=== Example 4: Chunked Processing ===');

  try {
    // Initialize chunked processor with 50MB limit and 64KB default chunks
    const chunker = new ChunkedProcessor(50 * 1024 * 1024, 64 * 1024);

    // Create a large buffer
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024, 'x'); // 10MB buffer

    // Process in smaller chunks with progress tracking
    const result = await chunker.processInChunks(largeBuffer, 32 * 1024, { // 32KB chunks
      onProgress: (progress) => {
        console.log(`Chunking progress: ${progress.percentage}%`);
        console.log(`Processing rate: ${progress.rate} chunks/sec`);
      }
    });

    console.log(`Processed ${result.chunks.length} chunks in ${result.processingTime}ms`);
    console.log(`Average chunk size: ${Math.round(result.totalSize / result.chunks.length)} bytes`);
    console.log(`Memory usage: ${Math.round(result.memoryUsage / 1024 / 1024)}MB`);
  } catch (error) {
    console.error('Error in chunked processing:', error);
  }
}

/**
 * Example 5: Entry Filtering
 *
 * Demonstrates advanced filtering of ZIP entries
 */
async function entryFiltering() {
  console.log('\n=== Example 5: Entry Filtering ===');

  try {
    // Initialize entry filter with comprehensive criteria
    const filter = new EntryFilter({
      include: ['**/*.{js,ts,jsx,tsx,json,md}'], // Include source files and docs
      exclude: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}', '**/node_modules/**'], // Exclude tests and node_modules
      maxSize: 5 * 1024 * 1024, // 5MB max
      minSize: 10, // 10 bytes min
      contentTypes: ['text/javascript', 'text/typescript', 'application/json', 'text/markdown'],
      extensions: ['js', 'ts', 'jsx', 'tsx', 'json', 'md']
    });

    // Create sample entries (in practice, these would come from ZIP extraction)
    const sampleEntries: StreamEntry[] = [
      {
        name: 'src/index.js',
        size: 1024,
        isDirectory: false,
        stream: createReadStream(join(__dirname, 'sample.js'))
      },
      {
        name: 'src/__tests__/index.test.js',
        size: 512,
        isDirectory: false,
        stream: createReadStream(join(__dirname, 'sample.test.js'))
      },
      {
        name: 'node_modules/large-lib/bundle.js',
        size: 10 * 1024 * 1024, // 10MB - too large
        isDirectory: false,
        stream: createReadStream(join(__dirname, 'large.js'))
      },
      {
        name: 'docs/README.md',
        size: 2048,
        isDirectory: false,
        stream: createReadStream(join(__dirname, 'README.md'))
      },
      {
        name: 'config.json',
        size: 100,
        isDirectory: false,
        stream: createReadStream(join(__dirname, 'config.json'))
      }
    ];

    // Filter entries
    const filteredEntries = filter.filterEntries(sampleEntries);

    console.log(`Filtered ${sampleEntries.length} entries down to ${filteredEntries.length}`);
    filteredEntries.forEach(entry => {
      console.log(`  ✓ ${entry.name} (${entry.size} bytes)`);
    });

    // Show excluded entries
    const excludedEntries = sampleEntries.filter(entry =>
      !filteredEntries.some(filtered => filtered.name === entry.name)
    );

    console.log('\nExcluded entries:');
    excludedEntries.forEach(entry => {
      let reason = 'Unknown reason';
      if (entry.name.includes('.test.') || entry.name.includes('.spec.')) {
        reason = 'Test file';
      } else if (entry.name.includes('node_modules')) {
        reason = 'Node modules';
      } else if (entry.size > 5 * 1024 * 1024) {
        reason = 'Too large';
      }
      console.log(`  ✗ ${entry.name} (${entry.size} bytes) - ${reason}`);
    });
  } catch (error) {
    console.error('Error in entry filtering:', error);
  }
}

/**
 * Example 6: Complete Integration Workflow
 *
 * Demonstrates all components working together
 */
async function completeIntegrationWorkflow() {
  console.log('\n=== Example 6: Complete Integration Workflow ===');

  try {
    // Initialize all components
    const extractor = new StreamingZipExtractor(100 * 1024 * 1024); // 100MB
    const processor = new MemoryEfficientProcessor(100 * 1024 * 1024);
    const handler = new BackpressureHandler(100 * 1024 * 1024);
    const chunker = new ChunkedProcessor(100 * 1024 * 1024);
    const filter = new EntryFilter({
      include: ['**/*.{js,ts,json,md}'],
      exclude: ['**/*.test.*', '**/dist/**', '**/build/**'],
      maxSize: 10 * 1024 * 1024, // 10MB max
      contentTypes: ['text/javascript', 'text/typescript', 'application/json', 'text/markdown']
    });

    // Read ZIP file
    console.log('Reading ZIP file...');
    const zipBuffer = await fs.readFile(join(__dirname, 'project.zip'));

    // Extract with progress tracking
    console.log('Extracting streams...');
    const entries = await extractor.extractStreams(zipBuffer, {
      highWaterMark: 64 * 1024,
      onProgress: (progress) => {
        console.log(`  Extraction: ${progress.percentage}%`);
      }
    });

    // Filter entries
    console.log('Filtering entries...');
    const filteredEntries = filter.filterEntries(entries);
    console.log(`  Kept ${filteredEntries.length} of ${entries.length} entries`);

    // Process filtered entries
    console.log('Processing entries...');
    const processingResults = [];

    for (const [index, entry] of filteredEntries.entries()) {
      console.log(`  Processing ${entry.name} (${index + 1}/${filteredEntries.length})`);

      try {
        // Apply backpressure handling
        const controlledStream = handler.applyBackpressure(entry.stream, 32 * 1024);

        // Process with memory efficiency
        const buffer = await processor.processStream(controlledStream, 64 * 1024, {
          highWaterMark: 32 * 1024,
          onProgress: (progress) => {
            if (progress.processed % (1024 * 1024) === 0) { // Log every MB
              console.log(`    ${entry.name}: ${Math.round(progress.processed / 1024)}KB processed`);
            }
          }
        });

        // Chunk large files
        let finalResult;
        if (buffer.length > 1024 * 1024) { // 1MB
          console.log(`    ${entry.name}: Chunking large file (${Math.round(buffer.length / 1024)}KB)`);
          const chunkedResult = await chunker.processInChunks(buffer, 64 * 1024);
          finalResult = {
            name: entry.name,
            size: buffer.length,
            chunks: chunkedResult.chunks.length,
            processingTime: chunkedResult.processingTime
          };
        } else {
          finalResult = {
            name: entry.name,
            size: buffer.length,
            chunks: 1,
            processingTime: 0
          };
        }

        processingResults.push(finalResult);
        console.log(`    ${entry.name}: Completed (${Math.round(buffer.length / 1024)}KB)`);
      } catch (error) {
        console.error(`    Error processing ${entry.name}:`, error.message);
      }
    }

    // Summary
    console.log('\nProcessing Summary:');
    console.log(`  Total files processed: ${processingResults.length}`);
    console.log(`  Total data processed: ${Math.round(processingResults.reduce((sum, result) => sum + result.size, 0) / 1024)}KB`);
    console.log(`  Large files chunked: ${processingResults.filter(r => r.chunks > 1).length}`);

    // Memory usage
    console.log('\nMemory Usage:');
    console.log(`  Extractor: ${Math.round(extractor.getMemoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`  Processor: ${Math.round(processor.getMemoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`  Handler: ${Math.round(handler.getMemoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`  Chunker: ${Math.round(chunker.getMemoryUsage().heapUsed / 1024 / 1024)}MB`);

  } catch (error) {
    console.error('Error in complete integration workflow:', error);
  }
}

/**
 * Example 7: Performance Monitoring
 *
 * Demonstrates performance monitoring and optimization
 */
async function performanceMonitoring() {
  console.log('\n=== Example 7: Performance Monitoring ===');

  try {
    // Initialize components with performance tracking
    const processor = new MemoryEfficientProcessor(50 * 1024 * 1024);
    const chunker = new ChunkedProcessor(50 * 1024 * 1024);

    // Create test data of various sizes
    const testData = [
      { name: 'small', size: 100 * 1024 }, // 100KB
      { name: 'medium', size: 1024 * 1024 }, // 1MB
      { name: 'large', size: 10 * 1024 * 1024 } // 10MB
    ];

    console.log('Performance Test Results:');
    console.log('File Size\tChunk Size\tProcessing Time\tMemory Usage\tThroughput');

    for (const data of testData) {
      for (const chunkSize of [32 * 1024, 64 * 1024, 128 * 1024]) { // 32KB, 64KB, 128KB chunks
        const buffer = Buffer.alloc(data.size, 'x');

        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;

        const result = await chunker.processInChunks(buffer, chunkSize);

        const endTime = Date.now();
        const endMemory = process.memoryUsage().heapUsed;

        const processingTime = endTime - startTime;
        const memoryUsed = endMemory - startMemory;
        const throughput = data.size / (processingTime / 1000); // bytes per second

        console.log(
          `${Math.round(data.size / 1024)}KB\t\t` +
          `${Math.round(chunkSize / 1024)}KB\t\t` +
          `${processingTime}ms\t\t` +
          `${Math.round(memoryUsed / 1024)}KB\t\t` +
          `${Math.round(throughput / 1024)}KB/s`
        );
      }
      console.log('---');
    }
  } catch (error) {
    console.error('Error in performance monitoring:', error);
  }
}

/**
 * Example 8: Error Handling and Recovery
 *
 * Demonstrates comprehensive error handling
 */
async function errorHandlingAndRecovery() {
  console.log('\n=== Example 8: Error Handling and Recovery ===');

  try {
    // Initialize components with strict limits
    const processor = new MemoryEfficientProcessor(1024 * 1024); // 1MB limit
    const chunker = new ChunkedProcessor(1024 * 1024);

    // Test various error scenarios
    console.log('Testing memory limit exceeded...');
    try {
      const hugeBuffer = Buffer.alloc(10 * 1024 * 1024, 'x'); // 10MB buffer
      await processor.processInChunks(hugeBuffer);
    } catch (error) {
      console.log(`  ✓ Caught memory limit error: ${error.message}`);
    }

    console.log('Testing invalid stream...');
    try {
      // @ts-ignore - Testing invalid input
      await processor.processStream(null);
    } catch (error) {
      console.log(`  ✓ Caught invalid stream error: ${error.message}`);
    }

    console.log('Testing invalid chunk size...');
    try {
      const buffer = Buffer.from('test');
      await chunker.processInChunks(buffer, -1);
    } catch (error) {
      console.log(`  ✓ Caught invalid chunk size error: ${error.message}`);
    }

    console.log('Testing graceful degradation...');
    // Test with reasonable limits
    const reasonableProcessor = new MemoryEfficientProcessor(10 * 1024 * 1024); // 10MB
    const reasonableBuffer = Buffer.alloc(5 * 1024 * 1024, 'x'); // 5MB

    try {
      const result = await reasonableProcessor.processInChunks(reasonableBuffer);
      console.log(`  ✓ Processed ${Math.round(result.totalSize / 1024)}KB successfully with ${result.chunks.length} chunks`);
    } catch (error) {
      console.log(`  ✗ Unexpected error: ${error.message}`);
    }

  } catch (error) {
    console.error('Error in error handling example:', error);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('Streaming ZIP Processing Examples');
  console.log('================================');

  await basicStreamingExtraction();
  await memoryEfficientProcessing();
  await backpressureHandling();
  await chunkedProcessing();
  await entryFiltering();
  await completeIntegrationWorkflow();
  await performanceMonitoring();
  await errorHandlingAndRecovery();

  console.log('\nAll examples completed!');
}

// Export examples for testing
export {
  basicStreamingExtraction,
  memoryEfficientProcessing,
  backpressureHandling,
  chunkedProcessing,
  entryFiltering,
  completeIntegrationWorkflow,
  performanceMonitoring,
  errorHandlingAndRecovery,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
```

## Verification Commands
```bash
# Compile TypeScript to verify examples
npx tsc --noEmit examples/streaming-examples.ts

# Run the examples (if sample files are available)
# node examples/streaming-examples.js
```

## Success Criteria
- [ ] Basic streaming extraction example created
- [ ] Memory efficient processing example created
- [ ] Backpressure handling example created
- [ ] Chunked processing example created
- [ ] Entry filtering example created
- [ ] Complete integration workflow example created
- [ ] Performance monitoring example created
- [ ] Error handling and recovery example created
- [ ] All examples compile without errors
- [ ] Examples demonstrate realistic use cases
- [ ] Examples show proper error handling
- [ ] Examples include progress tracking and monitoring

## Dependencies Confirmed
- All streaming component implementations
- StreamEntry and StreamOptions types
- Node.js fs and path modules
- TypeScript compiler

## Next Task
Documentation and examples creation completed. Next step would be to implement the actual source code files.
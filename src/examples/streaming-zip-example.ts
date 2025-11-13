/**
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
} from '../utils/zip';
import { StreamEntry, StreamOptions } from '../types/streaming';
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

    // For demonstration, we'll create a mock buffer
    // In practice, you would read an actual ZIP file:
    // const zipBuffer = await fs.readFile('path/to/your/file.zip');
    const zipBuffer = Buffer.from('PK mock zip content');

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

    // Create a mock stream for demonstration
    // In practice, you would use an actual file stream:
    // const largeFileStream = createReadStream('path/to/large/file.dat');
    const mockStream = new (require('stream').Readable)({
      read() {
        this.push(Buffer.from('Mock data for demonstration'));
        this.push(null);
      }
    });

    // Process stream with 64KB chunks and backpressure
    const buffer = await processor.processStream(mockStream, 64 * 1024, {
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
 * Example 3: Entry Filtering
 *
 * Demonstrates advanced filtering of ZIP entries
 */
async function entryFiltering() {
  console.log('\n=== Example 3: Entry Filtering ===');

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
        stream: new (require('stream').Readable)()
      },
      {
        name: 'src/__tests__/index.test.js',
        size: 512,
        isDirectory: false,
        stream: new (require('stream').Readable)()
      },
      {
        name: 'docs/README.md',
        size: 2048,
        isDirectory: false,
        stream: new (require('stream').Readable)()
      },
      {
        name: 'config.json',
        size: 100,
        isDirectory: false,
        stream: new (require('stream').Readable)()
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
 * Example 4: Complete Integration Workflow
 *
 * Demonstrates all components working together
 */
async function completeIntegrationWorkflow() {
  console.log('\n=== Example 4: Complete Integration Workflow ===');

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

    // For demonstration, we'll create a mock buffer
    const zipBuffer = Buffer.from('PK mock zip content');

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
            if (progress.processed % 1024 === 0) { // Log every KB
              console.log(`    ${entry.name}: ${Math.round(progress.processed / 1024)}KB processed`);
            }
          }
        });

        // Chunk large files
        let finalResult;
        if (buffer.length > 1024) { // 1KB for demo
          console.log(`    ${entry.name}: Chunking large file (${Math.round(buffer.length)} bytes)`);
          const chunkedResult = await chunker.processInChunks(buffer, 64);
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
        console.log(`    ${entry.name}: Completed (${buffer.length} bytes)`);
      } catch (error) {
        console.error(`    Error processing ${entry.name}:`, (error as Error).message);
      }
    }

    // Summary
    console.log('\nProcessing Summary:');
    console.log(`  Total files processed: ${processingResults.length}`);
    console.log(`  Total data processed: ${processingResults.reduce((sum, result) => sum + result.size, 0)} bytes`);
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
 * Run all examples
 */
async function runAllExamples() {
  console.log('Streaming ZIP Processing Examples');
  console.log('================================');

  await basicStreamingExtraction();
  await memoryEfficientProcessing();
  await entryFiltering();
  await completeIntegrationWorkflow();

  console.log('\nAll examples completed!');
}

// Export examples for testing
export {
  basicStreamingExtraction,
  memoryEfficientProcessing,
  entryFiltering,
  completeIntegrationWorkflow,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
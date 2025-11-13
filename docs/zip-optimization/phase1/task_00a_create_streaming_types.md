# Task 00a: Create Streaming Types

**Estimated Time: 8 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The current ZIP extraction service has basic streaming capabilities but lacks advanced streaming support for large file processing. This task creates the necessary type definitions for enhanced streaming functionality.

## Current System State
- ZipEntry, ZipExtractionOptions, and ZipExtractionResult types exist
- Basic streaming with yauzl library is implemented
- No advanced streaming types for memory-efficient processing

## Your Task
Create type definitions for streaming ZIP processing including stream-based entry processing, memory monitoring, and backpressure handling.

## Test First (RED Phase)
```typescript
// This is a type definition task, so we'll verify by importing and using the types
import { StreamEntry, StreamProgress, StreamOptions } from '../../src/types/streaming';

describe('Streaming Types', () => {
  it('should define StreamEntry type', () => {
    const entry: StreamEntry = {
      name: 'test.txt',
      size: 100,
      isDirectory: false,
      stream: {} as any // mock stream
    };
    expect(entry.name).toBe('test.txt');
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
import { Readable } from 'stream';

export interface StreamEntry {
  /** Name of the entry (file or directory) */
  name: string;
  /** Size of the uncompressed data */
  size: number;
  /** Whether the entry is a directory */
  isDirectory: boolean;
  /** Readable stream for the entry data */
  stream: Readable;
}

export interface StreamProgress {
  /** Percentage of completion (0-100) */
  percentage: number;
  /** Number of entries processed */
  processed: number;
  /** Total number of entries */
  total: number;
  /** Current memory usage in bytes */
  memoryUsage: number;
}

export interface StreamOptions {
  /** Maximum memory usage in bytes */
  maxMemoryUsage?: number;
  /** High watermark for backpressure handling */
  highWaterMark?: number;
  /** Whether to process entries in parallel */
  parallel?: boolean;
  /** Number of parallel workers */
  parallelWorkers?: number;
  /** Callback for progress updates */
  onProgress?: (progress: StreamProgress) => void;
  /** Callback for entry processing */
  onEntry?: (entry: StreamEntry) => Promise<void>;
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
import { Readable } from 'stream';

/**
 * Represents a ZIP entry with streaming capabilities
 */
export interface StreamEntry {
  /** Name of the entry (file or directory) */
  name: string;
  /** Size of the uncompressed data */
  size: number;
  /** Whether the entry is a directory */
  isDirectory: boolean;
  /** Readable stream for the entry data */
  stream: Readable;
}

/**
 * Progress information for streaming operations
 */
export interface StreamProgress {
  /** Percentage of completion (0-100) */
  percentage: number;
  /** Number of entries processed */
  processed: number;
  /** Total number of entries */
  total: number;
  /** Current memory usage in bytes */
  memoryUsage: number;
  /** Processing rate (entries per second) */
  rate?: number;
}

/**
 * Options for streaming ZIP processing
 */
export interface StreamOptions {
  /** Maximum memory usage in bytes */
  maxMemoryUsage?: number;
  /** High watermark for backpressure handling */
  highWaterMark?: number;
  /** Whether to process entries in parallel */
  parallel?: boolean;
  /** Number of parallel workers */
  parallelWorkers?: number;
  /** Callback for progress updates */
  onProgress?: (progress: StreamProgress) => void;
  /** Callback for entry processing */
  onEntry?: (entry: StreamEntry) => Promise<void>;
  /** Whether to validate entry names for security */
  validateEntryNames?: boolean;
  /** Encoding for text files */
  encoding?: BufferEncoding;
}
```

## Verification Commands
```bash
# Compile TypeScript to verify types
npx tsc --noEmit src/types/streaming.ts
```

## Success Criteria
- [ ] StreamEntry type defined with name, size, isDirectory, and stream properties
- [ ] StreamProgress type defined with percentage, processed, total, and memoryUsage
- [ ] StreamOptions type defined with memory management and streaming options
- [ ] All types are properly exported
- [ ] Code compiles without errors

## Dependencies Confirmed
- Node.js Readable stream type available
- TypeScript compiler installed

## Next Task
task_00b_create_progress_tracker.md
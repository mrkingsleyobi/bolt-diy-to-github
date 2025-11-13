# API Documentation and Usage Examples

## Overview

This document provides comprehensive API documentation and practical usage examples for the ZIP processing system. It covers all public interfaces, configuration options, and demonstrates common use cases.

## Table of Contents

1. [API Reference](#api-reference)
2. [Usage Examples](#usage-examples)
3. [Configuration Options](#configuration-options)
4. [Error Handling](#error-handling)
5. [Advanced Features](#advanced-features)
6. [Integration Examples](#integration-examples)

## API Reference

### OptimizedZipProcessor

The main class for ZIP file processing operations.

#### Constructor

```typescript
new OptimizedZipProcessor(memoryLimit?: number, maxEntriesInMemory?: number)
```

**Parameters**:
- `memoryLimit` (optional): Maximum memory usage in bytes. Default: 100MB (100 * 1024 * 1024)
- `maxEntriesInMemory` (optional): Maximum number of entries to keep in memory. Default: 1000

**Example**:
```typescript
// Default configuration
const processor = new OptimizedZipProcessor();

// Custom memory limit (50MB) and entry limit (500)
const processor = new OptimizedZipProcessor(50 * 1024 * 1024, 500);
```

#### extract

Extract ZIP file using standard method.

```typescript
extract(
  zipFilePath: string,
  destinationPath: string,
  options?: ZipExtractionOptions
): Promise<ZipExtractionResult>
```

**Parameters**:
- `zipFilePath`: Path to the ZIP file to extract
- `destinationPath`: Directory where files will be extracted
- `options` (optional): Extraction configuration options

**Returns**: Promise resolving to `ZipExtractionResult`

**Example**:
```typescript
const result = await processor.extract('/path/to/archive.zip', '/extract/here');
console.log(`Extracted ${result.extractedCount} files`);
```

#### extractStreaming

Extract ZIP file using streaming for memory-efficient processing.

```typescript
extractStreaming(
  zipFilePath: string,
  destinationPath: string,
  options?: ZipExtractionOptions
): Promise<ZipExtractionResult>
```

**Parameters**:
- `zipFilePath`: Path to the ZIP file to extract
- `destinationPath`: Directory where files will be extracted
- `options` (optional): Extraction configuration options

**Returns**: Promise resolving to `ZipExtractionResult`

**Example**:
```typescript
const result = await processor.extractStreaming('/path/to/large-archive.zip', '/extract/here');
console.log(`Streaming extraction completed: ${result.extractedCount} files`);
```

#### setFilterConfig

Set filter configuration for selective extraction.

```typescript
setFilterConfig(config: EntryFilterConfig): void
```

**Parameters**:
- `config`: Filter configuration object

**Example**:
```typescript
processor.setFilterConfig({
  include: ['**/*.js', '**/*.ts'],
  exclude: ['**/node_modules/**'],
  maxSize: 10 * 1024 * 1024
});
```

#### getMemoryUsage

Get current memory usage information.

```typescript
getMemoryUsage(): MemoryUsage
```

**Returns**: Current memory usage metrics

**Example**:
```typescript
const usage = processor.getMemoryUsage();
console.log(`Memory usage: ${usage.heapUsed / 1024 / 1024} MB`);
```

#### isMemoryLimitExceeded

Check if current memory usage exceeds the configured limit.

```typescript
isMemoryLimitExceeded(): boolean
```

**Returns**: True if memory limit is exceeded

**Example**:
```typescript
if (processor.isMemoryLimitExceeded()) {
  console.warn('Memory limit exceeded!');
}
```

#### getMemoryLimit

Get the configured memory limit.

```typescript
getMemoryLimit(): number
```

**Returns**: Memory limit in bytes

**Example**:
```typescript
const limit = processor.getMemoryLimit();
console.log(`Memory limit: ${limit / 1024 / 1024} MB`);
```

### EntryFilter

Advanced filtering system for selective file extraction.

#### Constructor

```typescript
new EntryFilter(config?: EntryFilterConfig)
```

**Parameters**:
- `config` (optional): Filter configuration

#### matches

Check if an entry matches the filter criteria.

```typescript
matches(entry: StreamEntry): boolean
```

**Parameters**:
- `entry`: Stream entry to check

**Returns**: True if entry matches filter criteria

#### filterEntries

Filter an array of entries.

```typescript
filterEntries(entries: StreamEntry[]): StreamEntry[]
```

**Parameters**:
- `entries`: Array of stream entries to filter

**Returns**: Filtered array of stream entries

#### addIncludePattern

Add a glob pattern to include.

```typescript
addIncludePattern(pattern: string): void
```

**Parameters**:
- `pattern`: Glob pattern to include

#### addExcludePattern

Add a glob pattern to exclude.

```typescript
addExcludePattern(pattern: string): void
```

**Parameters**:
- `pattern`: Glob pattern to exclude

#### setSizeLimits

Set size limits for file filtering.

```typescript
setSizeLimits(min?: number, max?: number): void
```

**Parameters**:
- `min` (optional): Minimum file size in bytes
- `max` (optional): Maximum file size in bytes

#### setContentTypes

Set allowed content types.

```typescript
setContentTypes(contentTypes: string[]): void
```

**Parameters**:
- `contentTypes`: Array of allowed content types

#### setExtensions

Set allowed file extensions.

```typescript
setExtensions(extensions: string[]): void
```

**Parameters**:
- `extensions`: Array of allowed file extensions

#### setCustomFilter

Set custom filter function.

```typescript
setCustomFilter(filter: (entry: StreamEntry) => boolean): void
```

**Parameters**:
- `filter`: Custom filter function

### MemoryMonitor

Memory management system for monitoring and controlling memory usage.

#### Constructor

```typescript
new MemoryMonitor(limit?: number, warningThreshold?: number)
```

**Parameters**:
- `limit` (optional): Maximum memory usage in bytes. Default: Infinity
- `warningThreshold` (optional): Warning threshold percentage. Default: 80

#### getCurrentUsage

Get current memory usage information.

```typescript
getCurrentUsage(): MemoryUsage
```

**Returns**: Current memory usage metrics

#### isLimitExceeded

Check if memory limit is exceeded.

```typescript
isLimitExceeded(): boolean
```

**Returns**: True if current usage exceeds limit

#### isWarningThresholdExceeded

Check if memory usage exceeds warning threshold.

```typescript
isWarningThresholdExceeded(): boolean
```

**Returns**: True if current usage exceeds warning threshold

#### getUsagePercentage

Get memory usage as percentage of limit.

```typescript
getUsagePercentage(): number
```

**Returns**: Percentage of limit used (0-100)

#### getLimit

Get memory limit.

```typescript
getLimit(): number
```

**Returns**: Memory limit in bytes

#### setAlertCallback

Set alert callback for memory usage warnings.

```typescript
setAlertCallback(callback: (usage: MemoryUsage) => void): void
```

**Parameters**:
- `callback`: Function to call when warning threshold is exceeded

#### checkAndAlert

Check memory usage and trigger alert if necessary.

```typescript
checkAndAlert(): void
```

### ZipVerificationService

Quality assurance system for calculating truth scores.

#### getInstance

Get singleton instance of the service.

```typescript
static getInstance(): ZipVerificationService
```

**Returns**: Singleton instance

#### calculateTruthScore

Calculate truth score for ZIP extraction operation.

```typescript
calculateTruthScore(
  entries: StreamEntry[],
  result: ZipExtractionResult,
  processingTime: number
): number
```

**Parameters**:
- `entries`: Input stream entries
- `result`: Extraction results
- `processingTime`: Processing time in milliseconds

**Returns**: Truth score between 0 and 1

#### meetsThreshold

Check if truth score meets minimum threshold.

```typescript
meetsThreshold(score: number, threshold?: number): boolean
```

**Parameters**:
- `score`: Calculated truth score
- `threshold` (optional): Minimum required threshold. Default: 0.95

**Returns**: Whether score meets threshold

#### generateReport

Generate verification report.

```typescript
generateReport(
  entries: StreamEntry[],
  result: ZipExtractionResult,
  processingTime: number,
  score: number
): ZipVerificationReport
```

**Parameters**:
- `entries`: Input stream entries
- `result`: Extraction results
- `processingTime`: Processing time in milliseconds
- `score`: Calculated truth score

**Returns**: Detailed verification report

### AgenticJujutsuService

Quantum-resistant version control system for multi-agent coordination.

#### getInstance

Get singleton instance of the service.

```typescript
static getInstance(): AgenticJujutsuService
```

**Returns**: Singleton instance

#### initializeSession

Initialize agentic jujutsu session.

```typescript
initializeSession(sessionId: string, agents: string[]): Promise<void>
```

**Parameters**:
- `sessionId`: Unique session identifier
- `agents`: List of participating agents

#### recordOperation

Record operation for learning and coordination.

```typescript
recordOperation(
  operation: BatchFileOperation,
  result: BatchFileOperationResult,
  agentId: string
): Promise<void>
```

**Parameters**:
- `operation`: File operation performed
- `result`: Operation result
- `agentId`: ID of the agent performing the operation

#### analyzePatterns

Analyze operation patterns for self-learning.

```typescript
analyzePatterns(): Promise<JujutsuLearningInsights>
```

**Returns**: Learning insights

#### generateVersionControlReport

Generate version control report.

```typescript
generateVersionControlReport(summary: FileOperationSummary): Promise<JujutsuVersionControlReport>
```

**Parameters**:
- `summary`: Operation summary

**Returns**: Version control report

#### cleanupSession

Cleanup session resources.

```typescript
cleanupSession(sessionId: string): Promise<void>
```

**Parameters**:
- `sessionId`: Session to cleanup

### FilterHooksService

Coordination system for tracking filter operations.

#### getInstance

Get singleton instance of the service.

```typescript
static getInstance(): FilterHooksService
```

**Returns**: Singleton instance

#### preTask

Pre-task hook - called before filter operations begin.

```typescript
preTask(taskDescription: string): Promise<void>
```

**Parameters**:
- `taskDescription`: Description of the filtering task

#### postEdit

Post-edit hook - called after filter configuration is modified.

```typescript
postEdit(filePath: string, config: any): Promise<void>
```

**Parameters**:
- `filePath`: Path to the configuration file that was edited
- `config`: The filter configuration that was applied

#### postTask

Post-task hook - called after filter operations complete.

```typescript
postTask(resultSummary: FilterResultSummary, truthScore?: number): Promise<void>
```

**Parameters**:
- `resultSummary`: Summary of the filtering results
- `truthScore` (optional): Verification score for the operation

#### sessionEnd

Session end hook - called when filtering session completes.

```typescript
sessionEnd(): Promise<void>
```

## Usage Examples

### Basic ZIP Extraction

```typescript
import { OptimizedZipProcessor } from './src/utils/zip/OptimizedZipProcessor';

// Create processor with default settings
const processor = new OptimizedZipProcessor();

try {
  // Extract ZIP file
  const result = await processor.extract(
    '/path/to/archive.zip',
    '/destination/directory'
  );

  console.log(`Extraction completed successfully:`);
  console.log(`- Files extracted: ${result.extractedCount}`);
  console.log(`- Total size: ${result.totalSize} bytes`);
  console.log(`- Warnings: ${result.warnings.length}`);

  if (result.warnings.length > 0) {
    console.warn('Warnings during extraction:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
} catch (error) {
  console.error('Extraction failed:', error);
}
```

### Streaming Extraction with Progress Tracking

```typescript
import { OptimizedZipProcessor } from './src/utils/zip/OptimizedZipProcessor';

// Create processor with 50MB memory limit
const processor = new OptimizedZipProcessor(50 * 1024 * 1024);

try {
  // Extract large ZIP file with streaming
  const result = await processor.extractStreaming(
    '/path/to/large-archive.zip',
    '/destination/directory',
    {
      useStreaming: true,
      onProgress: (progress) => {
        console.log(`Extraction progress: ${progress}%`);
      },
      onEntryExtracted: (entry) => {
        console.log(`Extracted: ${entry.name} (${entry.size} bytes)`);
      },
      maxSize: 100 * 1024 * 1024, // 100MB max file size
      overwrite: false // Don't overwrite existing files
    }
  );

  console.log(`Streaming extraction completed:`);
  console.log(`- Files extracted: ${result.extractedCount}`);
  console.log(`- Total size: ${result.totalSize} bytes`);
} catch (error) {
  console.error('Streaming extraction failed:', error);
}
```

### Advanced Filtering

```typescript
import { OptimizedZipProcessor, EntryFilterConfig } from './src/utils/zip';

const processor = new OptimizedZipProcessor();

// Configure advanced filtering
const filterConfig: EntryFilterConfig = {
  include: ['**/*.txt', '**/*.md', '**/*.pdf'],
  exclude: ['**/*.tmp', '**/cache/**', '**/temp/**'],
  maxSize: 50 * 1024 * 1024, // 50MB max file size
  minSize: 100, // 100 bytes min
  extensions: ['txt', 'md', 'pdf'],
  contentTypes: ['text/plain', 'text/markdown', 'application/pdf']
};

// Apply filter configuration
processor.setFilterConfig(filterConfig);

try {
  const result = await processor.extract(
    '/path/to/documents.zip',
    '/extracted/documents'
  );

  console.log(`Filtered extraction completed:`);
  console.log(`- Files extracted: ${result.extractedCount}`);
  console.log(`- Total entries: ${result.entries.length}`);
  console.log(`- Filtered out: ${result.entries.length - result.extractedCount} files`);
} catch (error) {
  console.error('Filtered extraction failed:', error);
}
```

### Custom Filter Function

```typescript
import { OptimizedZipProcessor, StreamEntry } from './src/utils/zip';

const processor = new OptimizedZipProcessor();

// Set custom filter function
processor.setFilterConfig({
  customFilter: (entry: StreamEntry) => {
    // Only include files modified in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // For this example, we'll assume we have a lastModified property
    // In real implementation, this would come from ZIP entry metadata
    return entry.size > 1024 && entry.name.length > 5;
  }
});

try {
  const result = await processor.extract(
    '/path/to/archive.zip',
    '/filtered/output'
  );

  console.log(`Custom filtered extraction completed:`);
  console.log(`- Files extracted: ${result.extractedCount}`);
} catch (error) {
  console.error('Custom filtered extraction failed:', error);
}
```

### Memory-Conscious Processing

```typescript
import { OptimizedZipProcessor } from './src/utils/zip/OptimizedZipProcessor';

// Create processor with strict memory limits
const processor = new OptimizedZipProcessor(25 * 1024 * 1024, 100); // 25MB, 100 entries

// Monitor memory usage
const monitorMemory = () => {
  const usage = processor.getMemoryUsage();
  const percentage = processor.getMemoryLimit() === Infinity ? 0 :
    (usage.heapUsed / processor.getMemoryLimit()) * 100;

  console.log(`Memory usage: ${percentage.toFixed(2)}%`);

  if (processor.isMemoryLimitExceeded()) {
    console.warn('Memory limit exceeded!');
  }
};

// Set up memory monitoring
setInterval(monitorMemory, 5000); // Check every 5 seconds

try {
  const result = await processor.extractStreaming(
    '/path/to/large-archive.zip',
    '/memory-safe/output',
    {
      useStreaming: true,
      highWaterMark: 32 * 1024, // 32KB buffer size
      onProgress: (progress) => {
        console.log(`Progress: ${progress}%`);
        monitorMemory(); // Check memory on each progress update
      }
    }
  );

  console.log(`Memory-safe extraction completed:`);
  console.log(`- Files extracted: ${result.extractedCount}`);
  console.log(`- Final memory usage: ${(processor.getMemoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
} catch (error) {
  console.error('Memory-safe extraction failed:', error);
}
```

### Verification and Quality Assurance

```typescript
import { OptimizedZipProcessor, ZipVerificationService } from './src/utils/zip';

const processor = new OptimizedZipProcessor();
const verificationService = ZipVerificationService.getInstance();

try {
  // Extract with verification
  const result = await processor.extract(
    '/path/to/archive.zip',
    '/verified/output'
  );

  // Calculate truth score
  // Note: In real implementation, you'd pass actual stream entries
  const mockEntries = result.entries.map(entry => ({
    name: entry.name,
    size: entry.size,
    isDirectory: entry.isDirectory,
    stream: null as any
  }));

  const processingTime = 1000; // Mock processing time
  const truthScore = verificationService.calculateTruthScore(
    mockEntries,
    result,
    processingTime
  );

  console.log(`Extraction verification:`);
  console.log(`- Truth score: ${(truthScore * 100).toFixed(2)}%`);
  console.log(`- Quality threshold met: ${verificationService.meetsThreshold(truthScore)}`);

  // Generate detailed report
  const report = verificationService.generateReport(
    mockEntries,
    result,
    processingTime,
    truthScore
  );

  console.log(`Verification report generated at: ${report.timestamp}`);
  console.log(`- Extraction accuracy: ${(report.metrics.extractionAccuracy * 100).toFixed(2)}%`);
  console.log(`- Data integrity: ${(report.metrics.dataIntegrity * 100).toFixed(2)}%`);
  console.log(`- Performance efficiency: ${(report.metrics.performance * 100).toFixed(2)}%`);

  if (!verificationService.meetsThreshold(truthScore)) {
    console.warn('Warning: Quality threshold not met!');
  }
} catch (error) {
  console.error('Verified extraction failed:', error);
}
```

## Configuration Options

### ZipExtractionOptions

```typescript
interface ZipExtractionOptions {
  /** Maximum size limit for extracted files (in bytes) */
  maxSize?: number;

  /** Whether to extract directories */
  includeDirectories?: boolean;

  /** Whether to overwrite existing files */
  overwrite?: boolean;

  /** Encoding for text files */
  encoding?: BufferEncoding;

  /** Callback for each extracted file */
  onEntryExtracted?: (entry: ZipEntry) => void;

  /** Callback for extraction progress */
  onProgress?: (progress: number) => void;

  /** Whether to use streaming extraction */
  useStreaming?: boolean;

  /** Maximum memory usage for streaming (in bytes) */
  maxMemoryUsage?: number;

  /** Patterns to include */
  includePatterns?: string[];

  /** Patterns to exclude */
  excludePatterns?: string[];

  /** High water mark for backpressure handling */
  highWaterMark?: number;
}
```

### EntryFilterConfig

```typescript
interface EntryFilterConfig {
  /** Glob patterns to include */
  include?: string[];

  /** Glob patterns to exclude */
  exclude?: string[];

  /** Maximum file size in bytes */
  maxSize?: number;

  /** Minimum file size in bytes */
  minSize?: number;

  /** Allowed content types */
  contentTypes?: string[];

  /** Allowed file extensions */
  extensions?: string[];

  /** Custom filter function */
  customFilter?: (entry: StreamEntry) => boolean;
}
```

### StreamOptions

```typescript
interface StreamOptions {
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

## Error Handling

### ZipExtractionError

The system uses a custom error type for ZIP extraction failures:

```typescript
class ZipExtractionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_ZIP_FILE'
      | 'CORRUPTED_ZIP_FILE'
      | 'FILE_TOO_LARGE'
      | 'EXTRACTION_FAILED'
      | 'UNSUPPORTED_FORMAT'
      | 'STREAM_ERROR'
      | 'MEMORY_LIMIT_EXCEEDED',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ZipExtractionError';
  }
}
```

### Error Handling Example

```typescript
import { OptimizedZipProcessor, ZipExtractionError } from './src/utils/zip';

const processor = new OptimizedZipProcessor();

try {
  const result = await processor.extract('/path/to/archive.zip', '/output');
  console.log('Extraction successful');
} catch (error) {
  if (error instanceof ZipExtractionError) {
    switch (error.code) {
      case 'INVALID_ZIP_FILE':
        console.error('Invalid ZIP file provided');
        break;
      case 'FILE_TOO_LARGE':
        console.error('File exceeds size limit');
        break;
      case 'MEMORY_LIMIT_EXCEEDED':
        console.error('Memory limit exceeded during processing');
        break;
      case 'EXTRACTION_FAILED':
        console.error('Extraction failed:', error.message);
        if (error.originalError) {
          console.error('Original error:', error.originalError);
        }
        break;
      default:
        console.error('Unknown ZIP extraction error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Advanced Features

### Buffer Pooling Configuration

```typescript
// The system uses adaptive buffer pooling, but you can monitor it:

const processor = new OptimizedZipProcessor();

// Monitor buffer usage (internal details for debugging)
setInterval(() => {
  const usage = processor.getMemoryUsage();
  console.log(`Buffer pool status:`);
  console.log(`- Heap used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Heap total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
}, 10000);
```

### Adaptive Processing

```typescript
// The system automatically adapts to performance conditions:

const processor = new OptimizedZipProcessor();

// Configure for adaptive processing
const result = await processor.extractStreaming(
  '/path/to/archive.zip',
  '/adaptive/output',
  {
    useStreaming: true,
    // The system will automatically adjust these based on performance:
    highWaterMark: undefined, // Auto-calculated
    maxMemoryUsage: undefined // Auto-managed
  }
);
```

### Progress Tracking with Metrics

```typescript
const processor = new OptimizedZipProcessor();

const result = await processor.extractStreaming(
  '/path/to/archive.zip',
  '/progress/output',
  {
    useStreaming: true,
    onProgress: (progress) => {
      console.log(`Progress: ${progress}%`);

      // Get additional metrics
      const usage = processor.getMemoryUsage();
      const memoryPercentage = processor.getUsagePercentage();

      console.log(`Memory usage: ${memoryPercentage}%`);
      console.log(`Processing rate: ~${Math.round(progress * 10)} files/second`);
    },
    onEntryExtracted: (entry) => {
      console.log(`Extracted: ${entry.name}`);
    }
  }
);
```

## Integration Examples

### GitHub Integration with Agentic Jujutsu

```typescript
import { OptimizedZipProcessor } from './src/utils/zip/OptimizedZipProcessor';
import { AgenticJujutsuService } from './src/github/files/AgenticJujutsuService';

const processor = new OptimizedZipProcessor();
const jujutsuService = AgenticJujutsuService.getInstance();

// Initialize session
const sessionId = `zip-extraction-${Date.now()}`;
await jujutsuService.initializeSession(sessionId, ['zip-processor', 'file-handler']);

try {
  // Record operation start
  await jujutsuService.recordOperation(
    {
      operation: 'create',
      path: '/processed/archives/archive.zip',
      message: 'Starting ZIP extraction',
      content: '',
      branch: 'main'
    },
    { success: true, path: '/processed/archives/archive.zip' },
    'zip-processor'
  );

  // Perform extraction
  const result = await processor.extract(
    '/path/to/archive.zip',
    '/github/output'
  );

  // Record successful completion
  await jujutsuService.recordOperation(
    {
      operation: 'update',
      path: '/processed/archives/archive.zip',
      message: `Extraction completed: ${result.extractedCount} files`,
      content: JSON.stringify(result),
      branch: 'main'
    },
    { success: true, path: '/processed/archives/archive.zip' },
    'zip-processor'
  );

  console.log('GitHub-integrated extraction completed successfully');
} catch (error) {
  // Record failure
  await jujutsuService.recordOperation(
    {
      operation: 'update',
      path: '/processed/archives/archive.zip',
      message: `Extraction failed: ${error.message}`,
      content: '',
      branch: 'main'
    },
    { success: false, error: error.message, path: '/processed/archives/archive.zip' },
    'zip-processor'
  );

  console.error('GitHub-integrated extraction failed:', error);
} finally {
  // Cleanup session
  await jujutsuService.cleanupSession(sessionId);
}
```

### Hook Integration for Multi-Agent Coordination

```typescript
import { OptimizedZipProcessor } from './src/utils/zip/OptimizedZipProcessor';
import { FilterHooksService } from './src/filters/hooks/FilterHooksService';

const processor = new OptimizedZipProcessor();
const hooksService = FilterHooksService.getInstance();

try {
  // Pre-task hook
  await hooksService.preTask('Extracting ZIP archive with filtering');

  // Configure filtering
  processor.setFilterConfig({
    include: ['**/*.js', '**/*.ts'],
    exclude: ['**/node_modules/**'],
    maxSize: 5 * 1024 * 1024 // 5MB limit
  });

  // Perform extraction
  const result = await processor.extract(
    '/path/to/code-archive.zip',
    '/filtered/output'
  );

  // Post-task hook with verification
  await hooksService.postTask({
    totalFiles: result.entries.length,
    includedFiles: result.extractedCount,
    excludedFiles: result.entries.length - result.extractedCount,
    reasons: {
      'size_limit': result.entries.filter(e => e.size > 5 * 1024 * 1024).length,
      'pattern_filter': result.entries.length - result.extractedCount
    },
    processingTimeMs: 2500
  }, 0.98); // Truth score

  console.log('Hook-integrated extraction completed successfully');
} catch (error) {
  console.error('Hook-integrated extraction failed:', error);
} finally {
  // Session end hook
  await hooksService.sessionEnd();
}
```

## Conclusion

The ZIP processing system provides a comprehensive, flexible, and efficient solution for handling ZIP files of any size. With its advanced streaming capabilities, sophisticated filtering system, robust security measures, and extensive API, it's suitable for a wide range of applications from simple file extraction to complex enterprise workflows.

The system's modular design, comprehensive documentation, and extensive examples make it easy to integrate into existing applications while providing the power and flexibility needed for complex requirements.
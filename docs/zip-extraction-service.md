# ZIP Extraction Service

The ZIP Extraction Service provides robust ZIP file extraction with comprehensive error handling, size limits, and streaming support for large files.

## Features

- **Corrupted file detection and handling**: Gracefully handles corrupted or invalid ZIP files
- **Size limit enforcement**: Prevents extraction of files that exceed specified size limits
- **Streaming support**: Efficiently handles large files through streaming
- **Comprehensive error handling**: Detailed error reporting with specific error codes
- **Progress tracking**: Monitor extraction progress with callbacks
- **Path traversal protection**: Prevents directory traversal attacks
- **Memory-efficient processing**: Processes files without loading entire ZIP into memory

## Installation

```bash
npm install yauzl
```

## Usage

### Basic Extraction

```typescript
import { ZipExtractionService } from './utils/zip/index.js';

// Extract a ZIP file
const result = await ZipExtractionService.extract(
  '/path/to/archive.zip',
  '/path/to/destination'
);

console.log(`Extracted ${result.extractedCount} files`);
```

### Extraction with Options

```typescript
const result = await ZipExtractionService.extract(
  '/path/to/archive.zip',
  '/path/to/destination',
  {
    maxSize: 1024 * 1024, // 1MB limit
    overwrite: true,      // Overwrite existing files
    includeDirectories: false, // Skip directories
    onProgress: (progress) => {
      console.log(`Progress: ${progress}%`);
    },
    onEntryExtracted: (entry) => {
      console.log(`Extracted: ${entry.name}`);
    }
  }
);
```

### List Entries Without Extraction

```typescript
const entries = await ZipExtractionService.listEntries('/path/to/archive.zip');

for (const entry of entries) {
  console.log(`${entry.name} (${entry.size} bytes)`);
}
```

## API

### ZipExtractionService.extract(zipFilePath, destinationPath, options)

Extracts a ZIP file to the specified destination.

**Parameters:**
- `zipFilePath` (string): Path to the ZIP file
- `destinationPath` (string): Path where files should be extracted
- `options` (ZipExtractionOptions): Extraction options

**Returns:** Promise<ZipExtractionResult>

### ZipExtractionService.listEntries(zipFilePath)

Lists entries in a ZIP file without extracting them.

**Parameters:**
- `zipFilePath` (string): Path to the ZIP file

**Returns:** Promise<ZipEntry[]>

## Types

### ZipEntry

```typescript
interface ZipEntry {
  name: string;           // Name of the entry
  size: number;           // Size of uncompressed data
  compressedSize: number; // Size of compressed data
  lastModified: Date;     // Last modified date
  isDirectory: boolean;   // Whether the entry is a directory
  isFile: boolean;        // Whether the entry is a file
}
```

### ZipExtractionOptions

```typescript
interface ZipExtractionOptions {
  maxSize?: number;                    // Maximum size limit (bytes)
  includeDirectories?: boolean;        // Whether to extract directories
  overwrite?: boolean;                 // Whether to overwrite existing files
  onEntryExtracted?: (entry: ZipEntry) => void; // Callback for each extracted file
  onProgress?: (progress: number) => void;      // Callback for extraction progress
}
```

### ZipExtractionResult

```typescript
interface ZipExtractionResult {
  extractedCount: number;  // Number of files extracted
  totalSize: number;       // Total size of extracted files
  entries: ZipEntry[];     // List of extracted entries
  warnings: string[];      // Any warnings during extraction
}
```

### ZipExtractionError

```typescript
class ZipExtractionError extends Error {
  code: 'INVALID_ZIP_FILE' | 'CORRUPTED_ZIP_FILE' | 'FILE_TOO_LARGE' |
        'EXTRACTION_FAILED' | 'UNSUPPORTED_FORMAT' | 'STREAM_ERROR';
  originalError?: Error;
}
```

## Error Codes

- `INVALID_ZIP_FILE`: The provided file path is invalid or the file doesn't exist
- `CORRUPTED_ZIP_FILE`: The ZIP file is corrupted or invalid
- `FILE_TOO_LARGE`: A file exceeds the specified size limit
- `EXTRACTION_FAILED`: General extraction failure
- `UNSUPPORTED_FORMAT`: Unsupported compression format
- `STREAM_ERROR`: Error during stream processing

## Security Features

- **Path Traversal Protection**: Prevents extraction of files with paths like `../../../etc/passwd`
- **Size Limit Enforcement**: Prevents resource exhaustion attacks
- **Input Validation**: Validates all input parameters
- **Error Containment**: Graceful error handling without exposing system information

## Performance

- **Streaming**: Files are processed in chunks rather than loaded entirely into memory
- **Lazy Loading**: ZIP entries are read on-demand
- **Efficient Memory Usage**: Minimal memory footprint during extraction
- **Parallel Processing**: Multiple files can be extracted concurrently

## Example

See `examples/zip-extraction-example.ts` for a complete example of using the ZIP Extraction Service.
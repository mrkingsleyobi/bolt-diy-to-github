# Task 31a: Document API Usage

**Estimated Time: 8 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to document the API usage for the file filtering system so users can understand how to integrate it into their applications.

## Current System State
- All filter components are implemented and tested
- Configuration parser exists
- TypeScript types are defined
- Basic configuration documentation exists
- No API usage documentation exists yet

## Your Task
Create documentation for the API usage of the file filtering system.

## Test First (RED Phase)
We don't need a failing test for documentation, but we'll verify our documentation is clear and complete.

Minimal Implementation (GREEN Phase)
Create basic API usage documentation.

Refactored Solution (REFACTOR Phase)
```markdown
# File Filtering System API Usage

## Installation

The file filtering system is part of the bolt-diy-to-github project. No additional installation is required.

## Basic Usage

### 1. Import the FilterEngine

```typescript
import { FilterEngine } from './filters/FilterEngine';
```

### 2. Create File Metadata

The filter engine works with `FileMetadata` objects:

```typescript
import { FileMetadata } from './types/filters';

const files: FileMetadata[] = [
  {
    path: 'src/index.ts',
    size: 5000, // in bytes
    contentType: 'text/typescript'
  },
  {
    path: 'README.md',
    size: 1000,
    contentType: 'text/markdown'
  }
];
```

### 3. Configure Filters

Create a `FilterConfig` object to specify your filtering rules:

```typescript
import { FilterConfig } from './types/filters';

const config: FilterConfig = {
  include: ['**/*.ts'],
  exclude: ['**/*.test.ts'],
  maxSize: 1024 * 1024, // 1MB
  contentTypes: ['text/typescript']
};
```

### 4. Apply Filters

Use the `FilterEngine` to apply your filters:

```typescript
const engine = new FilterEngine();
const result = await engine.filter(config, files);

console.log('Included files:', result.included);
console.log('Excluded files:', result.excluded);
console.log('Reasons for exclusion:', result.reasons);
```

## API Reference

### FilterEngine

The main class for filtering files.

#### Constructor

```typescript
const engine = new FilterEngine();
```

#### filter Method

Applies filters to a list of files.

```typescript
async filter(config: FilterConfig, files: FileMetadata[]): Promise<FilterResult>
```

- `config`: Filter configuration object
- `files`: Array of file metadata objects
- Returns: Promise that resolves to a `FilterResult` object

### FilterConfig

Configuration object for specifying filter rules.

```typescript
interface FilterConfig {
  include?: string[];      // Glob patterns to include
  exclude?: string[];      // Glob patterns to exclude
  maxSize?: number;        // Maximum file size in bytes
  minSize?: number;        // Minimum file size in bytes
  contentTypes?: string[]; // Allowed content types
}
```

### FileMetadata

Metadata about a file for filtering.

```typescript
interface FileMetadata {
  path: string;        // File path
  size: number;        // File size in bytes
  contentType: string; // Content type (MIME type)
}
```

### FilterResult

Result of a filtering operation.

```typescript
interface FilterResult {
  included: string[];                    // Paths of files that passed all filters
  excluded: string[];                    // Paths of files that were excluded
  reasons: Record<string, string>;       // Reasons why files were excluded
}
```

## Advanced Usage

### Custom File Metadata Provider

You can create a function to generate file metadata from your file system:

```typescript
import { FileMetadata } from './types/filters';
import { promises as fs } from 'fs';
import { lookup } from 'mime-types';

async function getFileMetadata(filePath: string): Promise<FileMetadata> {
  const stats = await fs.stat(filePath);
  const contentType = lookup(filePath) || 'application/octet-stream';

  return {
    path: filePath,
    size: stats.size,
    contentType
  };
}

async function getFilesFromDirectory(dir: string): Promise<FileMetadata[]> {
  // Implementation would walk directory and collect file metadata
  // This is a simplified example
  const filePaths = ['src/index.ts', 'README.md']; // In reality, you'd get this from fs.readdir
  return Promise.all(filePaths.map(getFileMetadata));
}
```

### Integration with File System Operations

Example of integrating with Node.js file system operations:

```typescript
import { FilterEngine } from './filters/FilterEngine';
import { FilterConfig } from './types/filters';
import { promises as fs } from 'fs';
import { join } from 'path';

async function filterFilesInDirectory(
  directory: string,
  config: FilterConfig
): Promise<string[]> {
  // Get all files in directory (simplified)
  const fileNames = await fs.readdir(directory);
  const filePaths = fileNames.map(name => join(directory, name));

  // Create file metadata (simplified)
  const files = await Promise.all(filePaths.map(async (path) => ({
    path,
    size: (await fs.stat(path)).size,
    contentType: 'text/plain' // Simplified - you'd use mime-types library
  })));

  // Apply filters
  const engine = new FilterEngine();
  const result = await engine.filter(config, files);

  return result.included;
}

// Usage
const config: FilterConfig = {
  include: ['**/*.ts'],
  exclude: ['**/*.test.ts'],
  maxSize: 1024 * 1024
};

filterFilesInDirectory('./src', config)
  .then(includedFiles => {
    console.log('Files to process:', includedFiles);
  })
  .catch(error => {
    console.error('Filtering failed:', error);
  });
```

## Error Handling

The filter engine handles errors gracefully:

```typescript
try {
  const result = await engine.filter(config, files);
  // Process result
} catch (error) {
  console.error('Filtering failed:', error);
  // Handle error appropriately
}
```

## Performance Considerations

For large file sets, consider:

1. **Batching**: Process files in batches to avoid memory issues
2. **Streaming**: Implement streaming for very large directories
3. **Caching**: Cache file metadata for frequently accessed files

```typescript
// Example of batched processing
async function filterFilesInBatches(
  files: FileMetadata[],
  config: FilterConfig,
  batchSize = 1000
): Promise<FilterResult> {
  const engine = new FilterEngine();
  const allResults: FilterResult[] = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const result = await engine.filter(config, batch);
    allResults.push(result);
  }

  // Combine results
  const combined: FilterResult = {
    included: [],
    excluded: [],
    reasons: {}
  };

  for (const result of allResults) {
    combined.included.push(...result.included);
    combined.excluded.push(...result.excluded);
    Object.assign(combined.reasons, result.reasons);
  }

  return combined;
}
```

## Testing Your Integration

Use the provided test utilities to verify your integration:

```typescript
import { FilterEngine } from './filters/FilterEngine';

describe('My File Processing System', () => {
  test('should filter files correctly', async () => {
    const engine = new FilterEngine();
    const config = {
      include: ['**/*.ts'],
      exclude: ['**/*.test.ts']
    };

    const files = [
      { path: 'src/index.ts', size: 1000, contentType: 'text/typescript' },
      { path: 'src/index.test.ts', size: 500, contentType: 'text/typescript' }
    ];

    const result = await engine.filter(config, files);

    expect(result.included).toContain('src/index.ts');
    expect(result.excluded).toContain('src/index.test.ts');
  });
});
```
```

Verification Commands
```bash
# Verify documentation is clear and complete
cat /workspaces/bolt-diy-to-github/docs/file-filtering-system/task_31a_document_api_usage.md
```

Success Criteria
[ ] API usage is clearly documented
[ ] Examples are provided for common use cases
[ ] Advanced usage patterns are explained
[ ] Error handling is documented
[ ] Performance considerations are mentioned
[ ] Documentation is clear and comprehensive

Dependencies Confirmed
- FilterEngine implementation exists
- All types are defined
- Configuration documentation exists

Next Task
task_40a_run_full_test_suite.md - Run complete test suite
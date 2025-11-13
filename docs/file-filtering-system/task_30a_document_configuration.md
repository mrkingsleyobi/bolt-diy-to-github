# Task 30a: Document Configuration Options

**Estimated Time: 8 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to document the configuration options for the file filtering system so users can understand how to use it.

## Current System State
- All filter components are implemented and tested
- Configuration parser exists
- TypeScript types are defined
- No documentation exists yet

## Your Task
Create documentation for the filter configuration options.

## Test First (RED Phase)
We don't need a failing test for documentation, but we'll verify our documentation is clear and complete.

Minimal Implementation (GREEN Phase)
Create a basic README for the filters module.

Refactored Solution (REFACTOR Phase)
```markdown
# File Filtering System

## Configuration Options

The file filtering system can be configured using the `FilterConfig` interface:

```typescript
interface FilterConfig {
  include?: string[];
  exclude?: string[];
  maxSize?: number;
  minSize?: number;
  contentTypes?: string[];
}
```

### Include Patterns

The `include` option specifies glob patterns for files to include. A file must match at least one include pattern to be considered for inclusion.

Examples:
- `['**/*.ts']` - Include all TypeScript files
- `['src/**/*.{ts,tsx}']` - Include TypeScript files in the src directory
- `['**/*.{js,ts,jsx,tsx}']` - Include all JavaScript and TypeScript files

If no include patterns are specified, all files are considered for inclusion.

### Exclude Patterns

The `exclude` option specifies glob patterns for files to exclude. If a file matches any exclude pattern, it will be excluded regardless of include patterns.

Examples:
- `['**/node_modules/**']` - Exclude node_modules directory
- `['**/*.test.*']` - Exclude test files
- `['**/dist/**', '**/build/**']` - Exclude dist and build directories

### Size Limits

The `maxSize` and `minSize` options specify file size limits in bytes.

Examples:
- `maxSize: 1024 * 1024` - Exclude files larger than 1MB
- `minSize: 100` - Exclude files smaller than 100 bytes
- `{ minSize: 100, maxSize: 1024 * 1024 }` - Exclude files outside the 100 bytes to 1MB range

### Content Types

The `contentTypes` option specifies allowed MIME types. Files with content types not in this list will be excluded.

Examples:
- `['text/plain', 'application/json']` - Allow only plain text and JSON files
- `['image/*']` - Allow all image files (if wildcard support is implemented)
- `['text/*', 'application/javascript']` - Allow all text files and JavaScript files

## Usage Example

```typescript
import { FilterEngine } from './filters/FilterEngine';
import { FilterConfig } from './types/filters';

const config: FilterConfig = {
  include: ['**/*.{ts,tsx}', '**/*.js'],
  exclude: ['**/node_modules/**', '**/*.test.*'],
  maxSize: 1024 * 1024, // 1MB
  minSize: 10,
  contentTypes: ['text/plain', 'application/javascript', 'text/typescript']
};

const engine = new FilterEngine();
const files = [
  // Array of file metadata objects
];

const result = await engine.filter(config, files);
console.log('Included files:', result.included);
console.log('Excluded files:', result.excluded);
```

## Glob Pattern Syntax

The file filtering system supports the following glob patterns:

- `*` - Matches any sequence of characters except path separators
- `?` - Matches any single character except path separators
- `**` - Matches any sequence of characters including path separators
- `{a,b}` - Matches either a or b

Examples:
- `*.ts` - Matches files with .ts extension in the current directory
- `**/*.ts` - Matches .ts files in any directory
- `src/**/*.ts` - Matches .ts files in the src directory and subdirectories
- `src/**/*.{ts,tsx}` - Matches .ts and .tsx files in the src directory and subdirectories
```

Verification Commands
```bash
# Verify documentation is clear and complete
cat /workspaces/bolt-diy-to-github/docs/file-filtering-system/task_30a_document_configuration.md
```

Success Criteria
[ ] Configuration options are clearly documented
[ ] Examples are provided for each option
[ ] Usage example is included
[ ] Glob pattern syntax is explained
[ ] Documentation is clear and comprehensive

Dependencies Confirmed
- FilterConfig interface exists
- All filter implementations exist
- Configuration parser exists

Next Task
task_31a_document_api_usage.md - Document API usage examples
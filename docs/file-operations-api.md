# GitHub File Operations API

This document describes the GitHub File Operations API implemented in this project, following London School TDD with comprehensive test coverage, hooks for coordination, verification-quality system for truth scoring, and agentic-jujutsu version control integration.

## Overview

The FileService provides a comprehensive set of operations for working with files in GitHub repositories:

1. **Get** - Retrieve file content
2. **Create** - Create new files
3. **Update** - Update existing files
4. **Delete** - Delete files
5. **Batch** - Process multiple file operations in a single call

## API Reference

### FileService

The main service class for file operations.

#### Constructor

```typescript
constructor(
  private httpClient: HttpClient,
  private getAuthHeaders: () => Record<string, string>
)
```

#### Methods

##### get(owner, repo, path, ref?)

Retrieve the content of a file.

**Parameters:**
- `owner` (string) - Repository owner
- `repo` (string) - Repository name
- `path` (string) - File path
- `ref` (string, optional) - Git reference (branch, tag, or commit SHA)

**Returns:** `Promise<FileContent>`

**Example:**
```typescript
const content = await github.files.get('owner', 'repo', 'path/to/file.txt');
```

##### create(owner, repo, path, params)

Create a new file.

**Parameters:**
- `owner` (string) - Repository owner
- `repo` (string) - Repository name
- `path` (string) - File path
- `params` (FileCreateParams) - File creation parameters

**Returns:** `Promise<FileOperationResult>`

**Example:**
```typescript
const result = await github.files.create('owner', 'repo', 'path/to/file.txt', {
  message: 'Create file',
  content: Buffer.from('Hello World').toString('base64')
});
```

##### update(owner, repo, path, params)

Update an existing file.

**Parameters:**
- `owner` (string) - Repository owner
- `repo` (string) - Repository name
- `path` (string) - File path
- `params` (FileUpdateParams) - File update parameters

**Returns:** `Promise<FileOperationResult>`

**Example:**
```typescript
const result = await github.files.update('owner', 'repo', 'path/to/file.txt', {
  message: 'Update file',
  content: Buffer.from('Updated content').toString('base64'),
  sha: 'abc123def456'
});
```

##### delete(owner, repo, path, params)

Delete a file.

**Parameters:**
- `owner` (string) - Repository owner
- `repo` (string) - Repository name
- `path` (string) - File path
- `params` (FileDeleteParams) - File deletion parameters

**Returns:** `Promise<FileDeleteResult>`

**Example:**
```typescript
const result = await github.files.delete('owner', 'repo', 'path/to/file.txt', {
  message: 'Delete file',
  sha: 'abc123def456'
});
```

##### batch(owner, repo, operations)

Process multiple file operations in a single call.

**Parameters:**
- `owner` (string) - Repository owner
- `repo` (string) - Repository name
- `operations` (BatchFileOperation[]) - Array of file operations

**Returns:** `Promise<BatchFileOperationResult[]>`

**Example:**
```typescript
const results = await github.files.batch('owner', 'repo', [
  {
    path: 'file1.txt',
    operation: 'create',
    content: Buffer.from('Content 1').toString('base64'),
    message: 'Create file 1'
  },
  {
    path: 'file2.txt',
    operation: 'create',
    content: Buffer.from('Content 2').toString('base64'),
    message: 'Create file 2'
  }
]);
```

## Types

### FileContent

Represents the content of a file.

```typescript
interface FileContent {
  type: 'file';
  encoding: 'base64';
  size: number;
  name: string;
  path: string;
  content: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url: string;
}
```

### FileCreateParams

Parameters for creating a file.

```typescript
interface FileCreateParams {
  message: string;
  content: string; // Base64 encoded content
  branch?: string;
  committer?: {
    name: string;
    email: string;
  };
  author?: {
    name: string;
    email: string;
  };
}
```

### FileUpdateParams

Parameters for updating a file.

```typescript
interface FileUpdateParams {
  message: string;
  content: string; // Base64 encoded content
  sha: string; // SHA of the file being updated
  branch?: string;
  committer?: {
    name: string;
    email: string;
  };
  author?: {
    name: string;
    email: string;
  };
}
```

### FileDeleteParams

Parameters for deleting a file.

```typescript
interface FileDeleteParams {
  message: string;
  sha: string; // SHA of the file being deleted
  branch?: string;
  committer?: {
    name: string;
    email: string;
  };
  author?: {
    name: string;
    email: string;
  };
}
```

### BatchFileOperation

Represents a single file operation in a batch.

```typescript
interface BatchFileOperation {
  path: string;
  operation: 'create' | 'update' | 'delete';
  content?: string; // Base64 encoded for create/update
  sha?: string; // Required for update/delete
  message: string;
  branch?: string; // Optional branch name
}
```

## Features

### 1. London School TDD

All file operations are implemented following London School Test-Driven Development principles:
- Mocks are used to isolate units under test
- Interaction testing focuses on behavior rather than state
- Tests are written before implementation
- Each method has comprehensive test coverage

### 2. Hooks Integration

The FileService integrates with a hooks system for coordination:
- **preTask** - Called before file operations begin
- **postEdit** - Called after file operations are performed
- **postTask** - Called after file operations complete
- **sessionEnd** - Called when file operations session completes

### 3. Verification-Quality System

All operations include truth scoring based on multiple quality metrics:
- Operation accuracy
- Result consistency
- Performance efficiency
- Error handling quality

Operations that don't meet the 0.95 truth threshold will generate warnings.

### 4. Agentic-Jujutsu Version Control

The implementation includes agentic-jujutsu version control integration:
- Quantum-resistant version control
- Self-learning from operations
- Multi-agent coordination
- Persistent memory patterns
- Operation history tracking

## Usage Example

```typescript
import { GitHubClient } from './github/GitHubClient';

async function fileOperationsExample() {
  try {
    // Initialize GitHub client with token
    const token = process.env.GITHUB_TOKEN || 'your-github-token-here';
    const github = new GitHubClient(token);

    const owner = 'your-username';
    const repo = 'your-repository';
    const branch = 'main';

    // Create a new file
    const createResult = await github.files.create(owner, repo, 'example.txt', {
      message: 'Create example file',
      content: Buffer.from('Hello, GitHub!').toString('base64'),
      branch: branch
    });

    // Get file content
    const fileContent = await github.files.get(owner, repo, 'example.txt', branch);

    // Update the file
    const updateResult = await github.files.update(owner, repo, 'example.txt', {
      message: 'Update example file',
      content: Buffer.from('Hello, GitHub! Updated content.').toString('base64'),
      sha: fileContent.sha,
      branch: branch
    });

    // Batch operations
    const batchResults = await github.files.batch(owner, repo, [
      {
        path: 'file1.txt',
        operation: 'create',
        content: Buffer.from('Content of file 1').toString('base64'),
        message: 'Create file 1'
      },
      {
        path: 'file2.txt',
        operation: 'create',
        content: Buffer.from('Content of file 2').toString('base64'),
        message: 'Create file 2'
      }
    ]);

    // Delete a file
    const deleteResult = await github.files.delete(owner, repo, 'example.txt', {
      message: 'Delete example file',
      sha: updateResult.content.sha,
      branch: branch
    });

  } catch (error) {
    console.error('Error in file operations example:', error);
  }
}
```

## Testing

The implementation includes comprehensive test coverage:
- Unit tests following London School TDD principles
- Integration tests for service integration
- Mock-based testing for isolation
- Truth score verification for quality assurance

Run tests with:
```bash
npm test -- src/github/files/
```

Build the project with:
```bash
npm run build
```
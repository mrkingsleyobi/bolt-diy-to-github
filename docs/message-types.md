# Message Types for Cross-Origin Communication

## Overview
This document lists all required message types for communication between the Chrome extension and bolt.diy web application, following the specifications in PHASE4_SPECIFICATION_DETAILED.md.

## Message Types

### 1. EXPORT_PROJECT
**Direction**: Extension → WebApp
**Purpose**: Initiate project export from Chrome extension to bolt.diy
**Payload**:
```typescript
{
  projectId: string;
  encryptionKey: string;
}
```

### 2. SYNC_PROJECT_STATE
**Direction**: Bidirectional
**Purpose**: Synchronize project changes between systems
**Payload**:
```typescript
{
  projectId: string;
  boltDiyId: string;
  resolutionStrategy: 'timestamp' | 'interactive' | 'local-wins' | 'remote-wins';
  direction: 'upload' | 'download' | 'both';
}
```

### 3. REQUEST_ENVIRONMENT_CONFIG
**Direction**: Extension → WebApp
**Purpose**: Retrieve environment-specific settings
**Payload**:
```typescript
{
  environment: 'development' | 'staging' | 'testing' | 'production';
}
```

### 4. TRIGGER_DEPLOYMENT
**Direction**: Extension → WebApp
**Purpose**: Initiate deployment to specific environments
**Payload**:
```typescript
{
  boltDiyId: string;
  branch: string;
  environment: 'development' | 'staging' | 'testing' | 'production';
  deploymentConfig: any;
}
```

### 5. VERIFY_CONNECTION
**Direction**: Bidirectional
**Purpose**: Test communication channel integrity
**Payload**:
```typescript
{
  timestamp: number;
  nonce: string;
}
```

### 6. UPDATE_STATUS
**Direction**: Bidirectional
**Purpose**: Provide real-time status updates
**Payload**:
```typescript
{
  operation: string;
  progress: number; // 0-100
  message: string;
}
```

### 7. ERROR_REPORT
**Direction**: Bidirectional
**Purpose**: Handle and report errors between systems
**Payload**:
```typescript
{
  code: string;
  message: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

## Additional Message Types for Enhanced Functionality

### 8. REQUEST_FILE_LIST
**Direction**: Extension → WebApp
**Purpose**: Request list of files in a project
**Payload**:
```typescript
{
  projectId: string;
}
```

### 9. REQUEST_FILE_CONTENT
**Direction**: Extension → WebApp
**Purpose**: Request content of a specific file
**Payload**:
```typescript
{
  projectId: string;
  filePath: string;
}
```

### 10. UPDATE_FILE_CONTENT
**Direction**: Extension → WebApp
**Purpose**: Update content of a specific file
**Payload**:
```typescript
{
  projectId: string;
  filePath: string;
  content: string;
  lastModified: number;
}
```

### 11. DELETE_FILE
**Direction**: Extension → WebApp
**Purpose**: Delete a specific file from project
**Payload**:
```typescript
{
  projectId: string;
  filePath: string;
}
```

### 12. CREATE_BRANCH
**Direction**: Extension → WebApp
**Purpose**: Create a new branch for environment isolation
**Payload**:
```typescript
{
  projectId: string;
  branchName: string;
  baseBranch: string;
}
```

### 13. SWITCH_BRANCH
**Direction**: Extension → WebApp
**Purpose**: Switch to a different branch
**Payload**:
```typescript
{
  projectId: string;
  branchName: string;
}
```

### 14. MERGE_BRANCH
**Direction**: Extension → WebApp
**Purpose**: Merge changes from one branch to another
**Payload**:
```typescript
{
  projectId: string;
  sourceBranch: string;
  targetBranch: string;
}
```

### 15. EXPORT_PROGRESS
**Direction**: Extension → WebApp
**Purpose**: Report progress during export operations
**Payload**:
```typescript
{
  projectId: string;
  progress: number; // 0-100
  processedFiles: number;
  totalFiles: number;
}
```

### 16. IMPORT_PROGRESS
**Direction**: WebApp → Extension
**Purpose**: Report progress during import operations
**Payload**:
```typescript
{
  projectId: string;
  progress: number; // 0-100
  processedFiles: number;
  totalFiles: number;
}
```

## Message Direction Legend
- **Extension → WebApp**: Messages sent from Chrome extension to bolt.diy web application
- **WebApp → Extension**: Messages sent from bolt.diy web application to Chrome extension
- **Bidirectional**: Messages that can be sent in both directions
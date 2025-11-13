# Phase 4: Bolt.diy Integration - Design Document

## Overview

This document outlines the design for Phase 4 of the bolt-diy-to-github project, which focuses on seamless cross-platform integration between the Chrome extension and the Bolt.diy platform. The goal is to enable direct export functionality from Bolt.diy projects to GitHub with multi-environment branching support.

## Cross-Platform Communication Architecture

### Architecture Pattern

The integration will follow a **message-passing architecture** using Chrome's extension messaging system:

```
Bolt.diy Web App ↔ Chrome Extension Content Script ↔ Chrome Extension Background Service Worker ↔ GitHub API
```

### Communication Flow

1. **Export Detection**: Content script detects export triggers on Bolt.diy platform
2. **Message Passing**: Content script communicates with background service worker
3. **Data Processing**: Background service worker processes project data and prepares for GitHub sync
4. **GitHub Integration**: Background service worker uses existing GitHub services to sync to repository
5. **Status Updates**: Real-time status updates sent back to content script for UI feedback

### Technical Implementation

#### 1. Content Script Enhancements (Bolt.diy Web App Integration)

- **Export Detection**: Monitor for export/download buttons or keyboard shortcuts
- **Project Data Extraction**: Enhanced extraction of project files, metadata, and structure
- **Real-time Communication**: Send progress updates and status to background script

#### 2. Background Service Worker Integration

- **Message Handling**: Process export requests from content script
- **ZIP Processing**: Use existing OptimizedZipProcessor for project packaging
- **GitHub Operations**: Leverage existing GitHubClient for repository operations
- **Multi-environment Support**: Implement branch management for different environments

#### 3. Data Synchronization

- **Project Metadata**: Sync project name, description, and configuration
- **File Structure**: Maintain consistent file organization between platforms
- **Environment Configuration**: Preserve environment-specific settings

## Export Detection Mechanism

### Trigger Points

1. **UI Button**: "Export to GitHub" button in Bolt.diy interface
2. **Context Menu**: Right-click context menu option
3. **Keyboard Shortcut**: Ctrl+Shift+G (customizable)
4. **Auto-detection**: Automatic detection of project save/export events

### Data Collection

1. **Project Files**: All source code files, assets, and configuration
2. **Metadata**: Project name, description, author information
3. **Dependencies**: Package.json, requirements.txt, or other dependency files
4. **Environment Config**: Environment-specific configuration files

## Project Metadata Synchronization

### Metadata Types

1. **Basic Information**
   - Project name
   - Description
   - Version
   - Author/Owner

2. **Configuration Data**
   - Build settings
   - Environment variables
   - Deployment configuration

3. **Dependency Information**
   - Package dependencies
   - Development dependencies
   - Runtime requirements

### Synchronization Strategy

1. **Initial Sync**: Full metadata transfer on first export
2. **Incremental Updates**: Only changed metadata on subsequent exports
3. **Conflict Resolution**: User prompt for conflicting metadata
4. **Version Control**: Maintain history of metadata changes

## Communication Bridge Implementation

### Message Protocol

#### Content Script to Background Service Worker

```javascript
// Export request
{
  type: 'EXPORT_TO_GITHUB',
  projectId: 'project-123',
  projectName: 'My Project',
  options: {
    branch: 'main',
    createNewRepo: false,
    repoName: 'my-project'
  }
}

// Progress update
{
  type: 'EXPORT_PROGRESS',
  projectId: 'project-123',
  status: 'processing',
  progress: 45,
  message: 'Processing files...'
}
```

#### Background Service Worker to Content Script

```javascript
// Status update
{
  type: 'EXPORT_STATUS',
  projectId: 'project-123',
  status: 'completed',
  result: {
    repoUrl: 'https://github.com/user/my-project',
    branch: 'main',
    commitSha: 'a1b2c3d4e5f6'
  }
}

// Error notification
{
  type: 'EXPORT_ERROR',
  projectId: 'project-123',
  error: 'Failed to authenticate with GitHub'
}
```

### Security Considerations

1. **Message Validation**: Validate all incoming messages
2. **Data Sanitization**: Sanitize project data before processing
3. **Token Security**: Secure handling of GitHub authentication tokens
4. **Permission Management**: Follow Chrome extension permission best practices

## End-to-End Export Workflow

### Workflow Steps

1. **Trigger**: User initiates export from Bolt.diy platform
2. **Detection**: Content script detects export request
3. **Data Collection**: Gather all project files and metadata
4. **Preparation**: Package data into ZIP format
5. **Validation**: Validate data and check GitHub connectivity
6. **Processing**: Use OptimizedZipProcessor for efficient handling
7. **Upload**: Transfer files to GitHub using FileService
8. **Branch Management**: Create/update appropriate branches
9. **Completion**: Notify user of successful export
10. **Cleanup**: Clear temporary data and update UI

### Error Handling

1. **Network Issues**: Retry mechanism for GitHub API calls
2. **Authentication**: Prompt for GitHub token if missing/invalid
3. **File Processing**: Handle corrupted or unsupported files
4. **Size Limits**: Manage large project exports with streaming
5. **Rate Limiting**: Respect GitHub API rate limits

## Integration with Existing Components

### GitHub Services

- **GitHubClient**: Use existing client for API operations
- **BranchService**: Extend for multi-environment branching
- **FileService**: Utilize for file operations with batch processing
- **RepositoryService**: Use for repository management

### ZIP Processing

- **OptimizedZipProcessor**: Reuse for efficient file handling
- **File Filtering**: Apply existing filtering mechanisms
- **Memory Management**: Leverage buffer pooling and streaming

### Authentication

- **GitHubPATAuthService**: Use existing PAT authentication
- **SecureTokenStorage**: Reuse secure storage mechanisms
- **TokenValidation**: Apply existing validation logic

## Testing Strategy

### Unit Tests

- Message passing between content script and background service worker
- Export detection mechanisms
- Data extraction and packaging
- Error handling scenarios

### Integration Tests

- End-to-end export workflow
- GitHub API integration
- Multi-environment branching
- Large project handling

### End-to-End Tests

- Real-world export scenarios
- Cross-browser compatibility
- Performance benchmarks
- User experience validation

## Success Criteria

1. ✅ Seamless export from Bolt.diy to GitHub with single click
2. ✅ Multi-environment branching support (main, dev, stage, test)
3. ✅ Real-time progress updates in extension UI
4. ✅ Proper error handling and user feedback
5. ✅ Data consistency between platforms
6. ✅ Performance within acceptable thresholds
7. ✅ 100% test coverage for new functionality
8. ✅ 0.95+ truth verification score maintained
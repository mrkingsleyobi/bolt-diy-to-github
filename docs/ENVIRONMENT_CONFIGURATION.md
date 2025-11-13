# Environment Configuration Management

## Overview

This document describes the enhanced environment configuration management features added to the Bolt.DIY to GitHub Chrome extension. These features provide users with comprehensive control over multi-environment branching and secure configuration management.

## New Components

### 1. EnvironmentConfig.svelte

A dedicated component for managing environment configurations with the following features:

- **GitHub Token Management**
  - Secure input with visibility toggle
  - Real-time validation of token format
  - Encrypted local storage

- **Branch Configuration**
  - Default branch setting with validation
  - Support for any valid Git branch name

- **Environment Management**
  - Add, edit, and remove environments
  - Real-time validation of environment names
  - Duplicate prevention
  - Keyboard shortcuts for editing (Enter to save, Escape to cancel)

- **Environment Selection**
  - Visual display of current environment
  - Quick-switch buttons for all configured environments

### 2. EnvironmentSyncControls.svelte

A component that provides environment-specific sync controls:

- Environment selector dropdown
- Quick-switch buttons for environments
- Environment-aware sync button
- Visual feedback during sync operations

## Features

### Validation

All configuration inputs include real-time validation:

- **GitHub Token**: Must start with "ghp_" or "github_pat_"
- **Environment Names**: 2-50 characters, alphanumeric and hyphens only, cannot start/end with hyphen
- **Branch Names**: 1-100 characters
- **Duplicate Prevention**: No duplicate environment names allowed

### Security

- GitHub tokens are stored encrypted in Chrome's secure storage
- Token visibility can be toggled for verification
- Tokens are never logged or exposed in plain text

### User Experience

- Intuitive interface with clear visual feedback
- Keyboard navigation support
- Responsive design for all popup sizes
- Real-time validation with helpful error messages
- Environment quick-switch for rapid workflow changes

## Integration

### Background Script

The background script has been updated to:

- Accept environment-specific branch parameters
- Use the specified branch for GitHub operations
- Handle environment-specific commit messages
- Maintain backward compatibility with existing configurations

### Storage

Configuration is stored using Chrome's `storage.sync` API:

```javascript
{
  githubToken: "encrypted_token",
  defaultBranch: "main",
  environments: ["main", "development", "staging", "production"],
  autoSync: false,
  syncInterval: 30
}
```

## Usage

1. Open the extension popup
2. Click the gear icon to access configuration
3. Enter your GitHub Personal Access Token
4. Configure your default branch
5. Add/edit/remove environments as needed
6. Select an environment for sync operations
7. Save your configuration

The selected environment will be used for all subsequent sync operations until changed.
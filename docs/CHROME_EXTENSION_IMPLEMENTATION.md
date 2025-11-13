# Chrome Extension Implementation

This document describes the implementation of the Chrome extension for syncing Bolt.DIY projects to GitHub with multi-environment branching support.

## Architecture Overview

The extension consists of three main components:

1. **Content Script** - Runs on Bolt.DIY pages to detect projects and extract information
2. **Background Service Worker** - Handles ZIP processing, GitHub synchronization, and multi-environment branching
3. **Popup UI** - Svelte-based user interface for configuration and control

## Component Details

### Content Script (`content/content.js`)

The content script is injected into Bolt.DIY pages and performs the following functions:

- Detects when a user is viewing a Bolt.DIY project
- Extracts project information (ID, name, description, URL)
- Communicates with the background service worker via Chrome messaging
- Handles user-triggered sync operations

Key features:
- Project detection using URL patterns and DOM elements
- Robust project information extraction with fallbacks
- Message handling for communication with background script
- Context menu integration for quick sync actions

### Background Service Worker (`background/background.js`)

The background service worker is the core of the extension, responsible for:

- Managing extension state and configuration
- Handling ZIP processing using the existing OptimizedZipProcessor
- Coordinating GitHub synchronization with multi-environment branching
- Managing communication between content scripts and popup UI
- Handling extension lifecycle events

Key features:
- GitHub token management with secure storage
- Multi-environment branching support (main, development, staging, production)
- Auto-sync functionality with configurable intervals
- Context menu integration
- Comprehensive error handling and user feedback

### Popup UI (`popup/`)

The popup UI provides a user-friendly interface for:

- Viewing detected project information
- Configuring extension settings
- Triggering sync operations
- Monitoring sync status

Components:
- **App.svelte** - Main application component
- **ProjectView.svelte** - Displays project information
- **SyncControls.svelte** - Controls for sync operations
- **OptionsPanel.svelte** - Configuration interface

## Build System

The extension uses Vite with the CRX plugin for building:

- Svelte for UI components
- TypeScript for type safety
- Vite for fast development and optimized builds
- CRX plugin for Chrome extension packaging

## Messaging Architecture

Communication between components uses Chrome's messaging API:

1. Content script → Background: Project detection, sync requests
2. Background → Content script: Sync triggers, status updates
3. Popup → Background: Configuration changes, sync commands
4. Background → Popup: Status updates, project information

## Security Considerations

- GitHub tokens are stored using Chrome's secure storage API
- Content scripts are only injected on Bolt.DIY domains
- Host permissions are limited to GitHub API endpoints
- All communication uses Chrome's secure messaging channels

## Multi-Environment Branching

The extension supports multiple environments with automatic branching:

- Main branch for production code
- Development branch for active development
- Staging branch for testing
- Custom branches for specific features

## Installation and Usage

1. Build the extension: `npm run build:extension`
2. Load the extension in Chrome:
   - Navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist-extension` folder
3. Configure GitHub token in the extension popup
4. Navigate to a Bolt.DIY project page
5. Use the popup to sync the project to GitHub

## Future Enhancements

- Integration with the existing ZIP processing pipeline
- Enhanced file filtering and exclusion patterns
- Real-time sync status notifications
- Advanced branching strategies
- Conflict resolution for collaborative development
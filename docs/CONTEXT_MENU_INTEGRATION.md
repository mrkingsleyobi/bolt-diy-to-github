# Context Menu Integration for Bolt.DIY to GitHub Extension

## Overview

This document describes the context menu integration feature that allows users to export Bolt.DIY projects to GitHub directly from the context menu.

## Implementation Details

### Manifest Permissions

The extension manifest has been updated to include the `contextMenus` permission:

```json
{
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "notifications",
    "contextMenus"
  ]
}
```

### Background Service Integration

The Bolt.DIY background service (`bolt-diy-background.js`) now includes:

1. **Context Menu Creation**: The `createContextMenu()` function creates a context menu item titled "Export to GitHub" that appears when right-clicking on Bolt.DIY pages.

2. **Context Menu Handling**: The `handleContextMenuClick()` function listens for context menu clicks and sends a message to the content script to trigger the export process.

### Content Script Integration

The Bolt.DIY content script (`bolt-diy-content.js`) now includes:

1. **Message Handler**: The `handleBackgroundMessage()` function has been updated to handle `CONTEXT_MENU_EXPORT` messages.

2. **Export Trigger**: The `handleContextMenuExport()` function triggers the export process with `context_menu` as the trigger type.

## Usage

1. Navigate to a Bolt.DIY project page
2. Right-click anywhere on the page
3. Select "Export to GitHub" from the context menu
4. The export process will begin, similar to using the UI button or keyboard shortcut

## Trigger Types

The export process now supports three trigger types:
- `ui_button`: When clicking export/download buttons on the page
- `keyboard_shortcut`: When using Ctrl+Shift+G
- `context_menu`: When using the context menu option

## Error Handling

The context menu integration includes proper error handling:
- Failed context menu creation is logged as a warning
- Failed message sending between background and content scripts is logged as an error
- The export process itself handles errors through existing error handling mechanisms

## Testing

Context menu functionality can be tested by:
1. Installing the extension
2. Navigating to a Bolt.DIY page
3. Right-clicking and verifying the "Export to GitHub" option appears
4. Clicking the option and verifying the export process begins
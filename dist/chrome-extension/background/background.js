"use strict";
/**
 * Background service worker for Bolt.DIY to GitHub extension
 *
 * Handles ZIP processing, GitHub synchronization, and multi-environment branching.
 */
// Import required modules (in a real implementation, these would be properly imported)
// For now, we'll simulate the imports
console.log('[Bolt.DIY to GitHub] Background service worker started');
// State management
let currentProject = null;
let syncInProgress = false;
let githubToken = null;
let errorLog = [];
// Listen for extension installation
chrome.runtime.onInstalled.addListener(handleExtensionInstalled);
// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener(handleMessage);
// Listen for tab updates to detect Bolt.DIY pages
chrome.tabs.onUpdated.addListener(handleTabUpdated);
// Handle extension startup
chrome.runtime.onStartup.addListener(handleExtensionStartup);
// Handle extension updates
chrome.runtime.onUpdateAvailable.addListener(handleExtensionUpdate);
/**
 * Handle extension installation
 * @param {Object} details - Installation details
 */
function handleExtensionInstalled(details) {
    console.log('[Bolt.DIY to GitHub] Extension installed:', details);
    logEvent('EXTENSION_INSTALLED', details);
    // Set default options
    chrome.storage.sync.set({
        githubToken: '',
        defaultBranch: 'main',
        environments: ['main', 'development', 'staging', 'production'],
        autoSync: false,
        syncInterval: 30 // minutes
    }).catch(error => {
        console.error('[Bolt.DIY to GitHub] Failed to set default options:', error);
        logError('SET_DEFAULT_OPTIONS_FAILED', error);
    });
    // Create context menu items
    createContextMenu();
}
/**
 * Handle extension startup
 */
function handleExtensionStartup() {
    console.log('[Bolt.DIY to GitHub] Extension started');
    logEvent('EXTENSION_STARTED');
    // Restore state from storage
    restoreState();
}
/**
 * Handle extension update
 * @param {Object} details - Update details
 */
function handleExtensionUpdate(details) {
    console.log('[Bolt.DIY to GitHub] Extension update available:', details);
    logEvent('EXTENSION_UPDATE_AVAILABLE', details);
    // Notify user of update
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon48.png',
        title: 'Bolt.DIY to GitHub',
        message: 'Extension update available. Please restart to apply.',
        priority: 1
    }).catch(error => {
        console.warn('[Bolt.DIY to GitHub] Failed to create notification:', error);
    });
}
/**
 * Restore extension state from storage
 */
function restoreState() {
    chrome.storage.sync.get([
        'githubToken',
        'defaultBranch',
        'environments',
        'autoSync',
        'syncInterval'
    ]).then(options => {
        githubToken = options.githubToken || null;
        console.log('[Bolt.DIY to GitHub] State restored');
    }).catch(error => {
        console.error('[Bolt.DIY to GitHub] Failed to restore state:', error);
        logError('STATE_RESTORE_FAILED', error);
    });
}
/**
 * Create context menu items
 */
function createContextMenu() {
    chrome.contextMenus.create({
        id: 'bolt-diy-sync',
        title: 'Sync to GitHub',
        contexts: ['page'],
        documentUrlPatterns: ['https://bolt.diy/*']
    });
    chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
}
/**
 * Handle context menu clicks
 * @param {Object} info - Menu click info
 * @param {Tab} tab - Active tab
 */
function handleContextMenuClick(info, tab) {
    if (info.menuItemId === 'bolt-diy-sync') {
        // Trigger sync for the current project
        triggerProjectSync(tab.id);
    }
}
/**
 * Handle tab updates to detect Bolt.DIY pages
 * @param {number} tabId - Tab ID
 * @param {Object} changeInfo - Change information
 * @param {Tab} tab - Tab object
 */
function handleTabUpdated(tabId, changeInfo, tab) {
    // Only act on complete page loads
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('bolt.diy')) {
        console.log('[Bolt.DIY to GitHub] Bolt.DIY page detected:', tab.url);
        // Inject content script if not already injected
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content/content.js']
        }).catch(error => {
            console.warn('[Bolt.DIY to GitHub] Failed to inject content script:', error);
        });
    }
}
/**
 * Handle messages from content scripts and popup
 * @param {Object} message - The message received
 * @param {MessageSender} sender - The sender of the message
 * @param {Function} sendResponse - Function to send a response
 * @returns {boolean} True if response is sent asynchronously
 */
function handleMessage(message, sender, sendResponse) {
    console.log('[Bolt.DIY to GitHub] Received message:', message);
    switch (message.type) {
        case 'PROJECT_DETECTED':
            handleProjectDetected(message.project, message.fileStructure);
            sendResponse({ type: 'PROJECT_ACKNOWLEDGED' });
            return false; // Synchronous response
        case 'REQUEST_SYNC_STATUS':
            sendResponse({
                type: 'SYNC_STATUS_RESPONSE',
                inProgress: syncInProgress,
                currentProject: currentProject
            });
            return false; // Synchronous response
        case 'START_SYNC':
            startSyncProcess(message.projectId, message.options);
            sendResponse({ type: 'SYNC_STARTED' });
            return false; // Synchronous response
        case 'GET_OPTIONS':
            chrome.storage.sync.get([
                'githubToken',
                'defaultBranch',
                'environments',
                'autoSync',
                'syncInterval'
            ]).then(options => {
                sendResponse({
                    type: 'OPTIONS_RESPONSE',
                    options: options
                });
            }).catch(error => {
                console.error('[Bolt.DIY to GitHub] Failed to get options:', error);
                sendResponse({
                    type: 'OPTIONS_RESPONSE',
                    options: {}
                });
            });
            return true; // Asynchronous response
        case 'SAVE_OPTIONS':
            chrome.storage.sync.set(message.options).then(() => {
                sendResponse({ type: 'OPTIONS_SAVED' });
            }).catch(error => {
                console.error('[Bolt.DIY to GitHub] Failed to save options:', error);
                sendResponse({ type: 'OPTIONS_SAVE_FAILED', error: error.message });
            });
            return true; // Asynchronous response
        default:
            console.warn('[Bolt.DIY to GitHub] Unknown message type:', message.type);
            return false; // No response needed
    }
}
/**
 * Handle project detection from content script
 * @param {Object} project - Project information
 * @param {Array} fileStructure - File structure information
 */
function handleProjectDetected(project, fileStructure) {
    console.log('[Bolt.DIY to GitHub] Project detected:', project);
    // Update current project
    currentProject = {
        ...project,
        fileStructure: fileStructure
    };
    // Notify popup UI of project detection
    chrome.runtime.sendMessage({
        type: 'PROJECT_UPDATED',
        project: currentProject
    }).catch(error => {
        console.warn('[Bolt.DIY to GitHub] Failed to notify popup of project update:', error);
    });
    // Check if auto-sync is enabled
    chrome.storage.sync.get(['autoSync']).then(options => {
        if (options.autoSync) {
            console.log('[Bolt.DIY to GitHub] Auto-sync enabled, starting sync process');
            startSyncProcess(project.id, { auto: true });
        }
    }).catch(error => {
        console.error('[Bolt.DIY to GitHub] Failed to check auto-sync option:', error);
    });
}
/**
 * Start the sync process
 * @param {string} projectId - Project ID to sync
 * @param {Object} options - Sync options
 */
function startSyncProcess(projectId, options) {
    if (syncInProgress) {
        console.warn('[Bolt.DIY to GitHub] Sync already in progress');
        return;
    }
    syncInProgress = true;
    // Notify UI that sync has started
    chrome.runtime.sendMessage({
        type: 'SYNC_STARTED',
        projectId: projectId,
        options: options
    }).catch(error => {
        console.warn('[Bolt.DIY to GitHub] Failed to notify UI of sync start:', error);
    });
    // Get GitHub token and options
    chrome.storage.sync.get([
        'githubToken',
        'defaultBranch',
        'environments'
    ]).then(options => {
        githubToken = options.githubToken;
        if (!githubToken) {
            throw new Error('GitHub token not configured');
        }
        // Proceed with sync process
        return performSync(projectId, options);
    }).then(result => {
        // Sync completed successfully
        syncInProgress = false;
        console.log('[Bolt.DIY to GitHub] Sync completed successfully:', result);
        // Notify UI of completion
        chrome.runtime.sendMessage({
            type: 'SYNC_COMPLETED',
            projectId: projectId,
            result: result
        }).catch(error => {
            console.warn('[Bolt.DIY to GitHub] Failed to notify UI of sync completion:', error);
        });
    }).catch(error => {
        // Sync failed
        syncInProgress = false;
        console.error('[Bolt.DIY to GitHub] Sync failed:', error);
        // Notify UI of failure
        chrome.runtime.sendMessage({
            type: 'SYNC_FAILED',
            projectId: projectId,
            error: error.message
        }).catch(err => {
            console.warn('[Bolt.DIY to GitHub] Failed to notify UI of sync failure:', err);
        });
    });
}
/**
 * Perform the actual sync process
 * @param {string} projectId - Project ID to sync
 * @param {Object} options - Sync options
 * @returns {Promise<Object>} Sync result
 */
async function performSync(projectId, options) {
    console.log('[Bolt.DIY to GitHub] Performing sync for project:', projectId);
    // In a real implementation, this would:
    // 1. Collect all project files from the Bolt.DIY page
    // 2. Create a ZIP archive of the project files
    // 3. Process the ZIP with the OptimizedZipProcessor
    // 4. Upload files to GitHub using the FileService
    // 5. Handle multi-environment branching
    // For now, we'll simulate the process
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    // Determine the branch to use (from sync options or default)
    const branchToUse = (options.branch && options.branch !== 'undefined')
        ? options.branch
        : (options.defaultBranch || 'main');
    // Simulate result
    const result = {
        success: true,
        filesProcessed: 15,
        branch: branchToUse,
        commitSha: 'a1b2c3d4e5f6',
        timestamp: Date.now()
    };
    return result;
}
/**
 * Trigger project sync from context menu
 * @param {number} tabId - Tab ID
 */
function triggerProjectSync(tabId) {
    // Send message to content script to trigger sync
    chrome.tabs.sendMessage(tabId, {
        type: 'TRIGGER_SYNC',
        options: {
            branch: 'main',
            message: 'Auto-sync from Bolt.DIY to GitHub extension'
        }
    }).catch(error => {
        console.error('[Bolt.DIY to GitHub] Failed to trigger sync:', error);
    });
}
/**
 * Log an event for debugging and analytics
 * @param {string} eventType - Type of event
 * @param {Object} data - Event data
 */
function logEvent(eventType, data = {}) {
    const event = {
        type: eventType,
        timestamp: Date.now(),
        data: data
    };
    console.log(`[Bolt.DIY to GitHub] Event: ${eventType}`, data);
    // Store recent events in memory (last 100)
    // In a real implementation, this would be stored in chrome.storage
    if (typeof errorLog !== 'undefined') {
        errorLog.push(event);
        if (errorLog.length > 100) {
            errorLog = errorLog.slice(-100);
        }
    }
}
/**
 * Log an error for debugging
 * @param {string} errorType - Type of error
 * @param {Error} error - Error object
 */
function logError(errorType, error) {
    const errorEntry = {
        type: errorType,
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
    };
    console.error(`[Bolt.DIY to GitHub] Error: ${errorType}`, error);
    // Store recent errors in memory (last 50)
    if (typeof errorLog !== 'undefined') {
        errorLog.push(errorEntry);
        if (errorLog.length > 50) {
            errorLog = errorLog.slice(-50);
        }
    }
    // Send error to popup UI if it's open
    chrome.runtime.sendMessage({
        type: 'ERROR_OCCURRED',
        error: errorEntry
    }).catch(() => {
        // Ignore if no popup is listening
    });
}
/**
 * Get recent errors and events
 * @returns {Array} Recent errors and events
 */
function getErrorLog() {
    return errorLog.slice(); // Return a copy
}
// Periodic sync (if enabled)
setInterval(() => {
    chrome.storage.sync.get(['autoSync', 'syncInterval']).then(options => {
        if (options.autoSync && currentProject) {
            console.log('[Bolt.DIY to GitHub] Performing periodic sync');
            logEvent('PERIODIC_SYNC_STARTED');
            startSyncProcess(currentProject.id, { periodic: true });
        }
    }).catch(error => {
        console.error('[Bolt.DIY to GitHub] Failed to check periodic sync:', error);
        logError('PERIODIC_SYNC_CHECK_FAILED', error);
    });
}, 60000); // Check every minute
// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        logEvent,
        logError,
        getErrorLog
    };
}
console.log('[Bolt.DIY to GitHub] Background service worker initialized');
logEvent('BACKGROUND_INITIALIZED');
//# sourceMappingURL=background.js.map
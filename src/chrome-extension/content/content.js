/**
 * Content script for Bolt.DIY project detection
 *
 * This script runs on bolt.diy pages to detect projects and extract relevant information
 * for syncing to GitHub with multi-environment branching support.
 */

// Error tracking
let errorCount = 0;
const maxErrors = 10;

// Wait for the page to load completely
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}

/**
 * Log content script errors
 * @param {string} message - Error message
 * @param {Error} error - Error object
 */
function logContentError(message, error = null) {
  errorCount++;
  console.error(`[Bolt.DIY to GitHub] Content Error ${errorCount}: ${message}`, error);

  // Send error to background script
  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_ERROR',
    message: message,
    error: error ? error.message : null,
    url: window.location.href,
    timestamp: Date.now()
  }).catch(() => {
    // Ignore if background script is not available
  });

  // Prevent infinite error loops
  if (errorCount > maxErrors) {
    console.error('[Bolt.DIY to GitHub] Too many errors, stopping error reporting');
  }
}

/**
 * Initialize the content script
 */
function initializeContentScript() {
  try {
    console.log('[Bolt.DIY to GitHub] Content script loaded');
    logContentError('Content script initialized');

    // Check if we're on a Bolt.DIY project page
    if (isBoltDiyProjectPage()) {
      console.log('[Bolt.DIY to GitHub] Detected Bolt.DIY project page');
      extractProjectInfo();
    }

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener(handleMessage);
  } catch (error) {
    logContentError('Failed to initialize content script', error);
  }
}

/**
 * Check if we're on a Bolt.DIY project page
 * @returns {boolean} True if on a project page
 */
function isBoltDiyProjectPage() {
  // Check for common Bolt.DIY project page elements
  const projectElements = document.querySelectorAll('[data-project-id], [data-bolt-project]');
  const urlPattern = /^https:\/\/bolt\.diy\/(project|app)\/.+$/;

  return urlPattern.test(window.location.href) || projectElements.length > 0;
}

/**
 * Extract project information from the page
 */
function extractProjectInfo() {
  try {
    // Extract project ID from URL or data attributes
    const projectId = extractProjectId();

    // Extract project name
    const projectName = extractProjectName();

    // Extract project description
    const projectDescription = extractProjectDescription();

    // Extract file structure (this would be more complex in a real implementation)
    const fileStructure = extractFileStructure();

    // Send project info to background script
    const projectInfo = {
      id: projectId,
      name: projectName,
      description: projectDescription,
      url: window.location.href,
      timestamp: Date.now()
    };

    // Send message to background script
    chrome.runtime.sendMessage({
      type: 'PROJECT_DETECTED',
      project: projectInfo,
      fileStructure: fileStructure
    }).then(() => {
      console.log('[Bolt.DIY to GitHub] Project info sent to background script');
    }).catch(error => {
      console.warn('[Bolt.DIY to GitHub] Failed to send project info to background:', error);
      logContentError('Failed to send project info to background', error);
    });

    console.log('[Bolt.DIY to GitHub] Project info extracted:', projectInfo);
  } catch (error) {
    console.error('[Bolt.DIY to GitHub] Error extracting project info:', error);
    logContentError('Error extracting project info', error);
  }
}

/**
 * Extract project ID from the page
 * @returns {string} Project ID
 */
function extractProjectId() {
  // Try to get project ID from URL
  const urlMatch = window.location.href.match(/\/(project|app)\/([^\/\?#]+)/);
  if (urlMatch && urlMatch[2]) {
    return urlMatch[2];
  }

  // Try to get from data attributes
  const projectElement = document.querySelector('[data-project-id]');
  if (projectElement) {
    return projectElement.getAttribute('data-project-id');
  }

  // Fallback to hostname + pathname hash
  return btoa(window.location.hostname + window.location.pathname).substring(0, 16);
}

/**
 * Extract project name from the page
 * @returns {string} Project name
 */
function extractProjectName() {
  // Try to get from title
  const title = document.title;
  if (title && !title.includes('Bolt.DIY')) {
    return title.replace(' - Bolt.DIY', '').replace('Bolt.DIY - ', '');
  }

  // Try to get from h1 elements
  const h1Elements = document.querySelectorAll('h1');
  for (const h1 of h1Elements) {
    const text = h1.textContent.trim();
    if (text && text.length > 0 && !text.includes('Bolt')) {
      return text;
    }
  }

  // Fallback to project ID
  return `Bolt Project ${extractProjectId()}`;
}

/**
 * Extract project description from the page
 * @returns {string} Project description
 */
function extractProjectDescription() {
  // Try to get from meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    return metaDescription.getAttribute('content') || '';
  }

  // Try to get from paragraph elements
  const pElements = document.querySelectorAll('p');
  for (const p of pElements) {
    const text = p.textContent.trim();
    if (text && text.length > 50 && text.length < 500) {
      return text;
    }
  }

  // Fallback
  return `Bolt.DIY project synced on ${new Date().toISOString()}`;
}

/**
 * Extract file structure (simplified for this example)
 * @returns {Array} File structure information
 */
function extractFileStructure() {
  // In a real implementation, this would extract the actual file structure
  // from the Bolt.DIY interface. For now, we'll return a placeholder.
  return [
    { name: 'index.html', type: 'file', size: 1024 },
    { name: 'styles.css', type: 'file', size: 2048 },
    { name: 'script.js', type: 'file', size: 4096 },
    { name: 'components', type: 'directory', children: [] }
  ];
}

/**
 * Handle messages from the background script
 * @param {Object} message - The message received
 * @param {MessageSender} sender - The sender of the message
 * @param {Function} sendResponse - Function to send a response
 * @returns {boolean} True if response is sent asynchronously
 */
function handleMessage(message, sender, sendResponse) {
  console.log('[Bolt.DIY to GitHub] Received message:', message);

  switch (message.type) {
    case 'REQUEST_PROJECT_INFO':
      // Re-extract and send project info
      const projectInfo = {
        id: extractProjectId(),
        name: extractProjectName(),
        description: extractProjectDescription(),
        url: window.location.href,
        timestamp: Date.now()
      };

      sendResponse({
        type: 'PROJECT_INFO_RESPONSE',
        project: projectInfo
      });
      return false; // Synchronous response

    case 'TRIGGER_SYNC':
      // Trigger the sync process
      triggerSync(message.options);
      sendResponse({ type: 'SYNC_STARTED' });
      return false; // Synchronous response

    default:
      console.warn('[Bolt.DIY to GitHub] Unknown message type:', message.type);
      return false; // No response needed
  }
}

/**
 * Trigger the sync process
 * @param {Object} options - Sync options
 */
function triggerSync(options) {
  console.log('[Bolt.DIY to GitHub] Triggering sync with options:', options);

  // In a real implementation, this would:
  // 1. Collect all project files
  // 2. Package them into a ZIP
  // 3. Send to background script for GitHub upload
  // 4. Handle multi-environment branching

  // For now, we'll just send a notification
  chrome.runtime.sendMessage({
    type: 'SYNC_TRIGGERED',
    projectId: extractProjectId(),
    options: options
  }).catch(error => {
    console.warn('[Bolt.DIY to GitHub] Failed to send sync trigger to background:', error);
  });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isBoltDiyProjectPage,
    extractProjectId,
    extractProjectName,
    extractProjectDescription,
    extractFileStructure
  };
}
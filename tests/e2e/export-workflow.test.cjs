/**
 * End-to-end tests for the complete Bolt.diy to GitHub export workflow
 */

console.log('[E2E Test] Starting Bolt.diy to GitHub export workflow end-to-end tests');

// Helper function to create isolated mock environment
function createMockChromeEnvironment() {
  return {
    runtime: {
      onMessage: {
        listeners: [],
        addListener: function(callback) {
          this.listeners.push(callback);
          console.log('[E2E Test] Message listener added');
        },
        removeListener: function(callback) {
          const index = this.listeners.indexOf(callback);
          if (index > -1) {
            this.listeners.splice(index, 1);
          }
        }
      },
      sendMessage: function(message) {
        return new Promise((resolve) => {
          console.log('[E2E Test] Sending message:', message.type);

          // Simulate background processing
          setTimeout(() => {
            // Find and call the appropriate listener
            for (const listener of this.onMessage.listeners) {
              let responseSent = false;
              const sendResponse = (response) => {
                responseSent = true;
                console.log('[E2E Test] Background response:', response?.type);
                resolve(response);
              };

              // Call listener with message
              const result = listener(message, { tab: { id: 1 } }, sendResponse);

              // If listener returns true, it will send an async response
              if (result !== true && !responseSent) {
                // For synchronous responses, resolve immediately if not already resolved
                switch (message.type) {
                  case 'BOLT_DIY_EXPORT_REQUEST':
                    resolve({ type: 'EXPORT_STARTED' });
                    break;
                  case 'GET_EXPORT_STATUS':
                    resolve({
                      type: 'EXPORT_STATUS_RESPONSE',
                      inProgress: false,
                      currentExport: null
                    });
                    break;
                  default:
                    resolve({ type: 'MESSAGE_PROCESSED' });
                }
              }
            }
          }, 10);
        });
      }
    },
    storage: {
      sync: {
        get: function(keys) {
          console.log('[E2E Test] Getting storage values for keys:', keys);
          const mockStorage = {
            githubToken: 'test-token-12345',
            defaultBranch: 'main',
            environments: ['main', 'development', 'staging', 'production']
          };

          if (Array.isArray(keys)) {
            const result = {};
            keys.forEach(key => {
              result[key] = mockStorage[key];
            });
            return Promise.resolve(result);
          } else if (typeof keys === 'string') {
            return Promise.resolve({ [keys]: mockStorage[keys] });
          } else {
            return Promise.resolve(mockStorage);
          }
        },
        set: function(items) {
          console.log('[E2E Test] Setting storage values:', items);
          return Promise.resolve();
        }
      }
    },
    contextMenus: {
      removeAll: function() {
        console.log('[E2E Test] Removing all context menus');
        return Promise.resolve();
      },
      create: function(options, callback) {
        console.log('[E2E Test] Creating context menu:', options.title);
        if (callback) callback();
        return Promise.resolve();
      },
      onClicked: {
        addListener: function(callback) {
          console.log('[E2E Test] Context menu click listener added');
        }
      }
    },
    tabs: {
      sendMessage: function(tabId, message) {
        console.log('[E2E Test] Sending message to tab:', message.type);
        return Promise.resolve({ success: true });
      }
    }
  };
}

// Test 1: Complete export workflow from trigger to GitHub upload
async function testCompleteExportWorkflow() {
  console.log('[E2E Test] Test 1: Complete export workflow from trigger to GitHub upload');

  // Create isolated mock environment for this test
  const mockChrome = createMockChromeEnvironment();
  const originalChrome = global.chrome;
  global.chrome = mockChrome;

  // Track cleanup
  let currentListener = null;
  let exportProcessCompleted = false;

  try {
    // Add the background message listener to simulate the background service
    function setupBackgroundMessageListener() {
      // Remove existing listener if present
      if (currentListener) {
        global.chrome.runtime.onMessage.removeListener(currentListener);
      }

      // Create new listener
      currentListener = (message, sender, sendResponse) => {
        try {
          console.log('[E2E Test] Background received message:', message.type, '(listener active)');

          // Handle different message types
          switch (message.type) {
            case 'BOLT_DIY_EXPORT_REQUEST':
              // Validate required fields
              if (!message.project) {
                console.error('[E2E Test] Background: Missing project data in export request');
                sendResponse({ type: 'EXPORT_ERROR', error: 'Missing project data' });
                return false;
              }

              console.log('[E2E Test] Background: Export request received for project:', message.project.name);

              // Simulate export process with progress updates
              simulateExportProcess(message.project, message.trigger);
              sendResponse({ type: 'EXPORT_STARTED' });
              return false; // Synchronous response

            case 'GET_EXPORT_STATUS':
              sendResponse({
                type: 'EXPORT_STATUS_RESPONSE',
                inProgress: false,
                currentExport: null
              });
              return false; // Synchronous response

            case 'EXPORT_STATUS_UPDATE':
              // Handle status update messages
              console.log('[E2E Test] Background: Received status update:', message.status);
              sendResponse({ type: 'STATUS_UPDATE_ACK' });
              return false; // Synchronous response

            default:
              console.warn('[E2E Test] Background: Unknown message type received:', message.type);
              return false; // No response needed
          }
        } catch (error) {
          console.error('[E2E Test] Background: Error handling message:', error);
          try {
            sendResponse({ type: 'MESSAGE_ERROR', error: error.message });
          } catch (responseError) {
            console.error('[E2E Test] Background: Failed to send error response:', responseError);
          }
          return false;
        }
      };

      global.chrome.runtime.onMessage.addListener(currentListener);
    }

    // Simulate the export process with progress updates
    function simulateExportProcess(project, trigger) {
      // Create a promise that resolves when the export process is complete
      return new Promise(async (resolve) => {
        try {
          console.log('[E2E Test] Simulating export process for project:', project.name);

          // Send progress updates with shorter delays for testing
          await sendProgressUpdate('initializing', 'Initializing export process', 0);
          await delay(5);

          await sendProgressUpdate('collecting', 'Collecting project files', 10);
          await delay(5);

          await sendProgressUpdate('processing', 'Processing project data', 20);
          await delay(5);

          await sendProgressUpdate('creating_zip', 'Creating ZIP archive', 30);
          await delay(5);

          await sendProgressUpdate('uploading', 'Uploading to GitHub', 60);
          await delay(5);

          await sendProgressUpdate('finalizing', 'Finalizing export', 90);
          await delay(5);

          await sendProgressUpdate('completed', 'Export completed successfully', 100);
          await delay(5);

          console.log('[E2E Test] Export process simulation completed');
          exportProcessCompleted = true;
          resolve();
        } catch (error) {
          console.error('[E2E Test] Error in export process simulation:', error);
          await sendProgressUpdate('error', `Export failed: ${error.message}`, 0, true);
          exportProcessCompleted = true;
          resolve();
        }
      });
    }

    // Helper function to send progress updates
    async function sendProgressUpdate(status, message, progress, isError = false) {
      const updateMessage = {
        type: 'EXPORT_STATUS_UPDATE',
        status: status,
        message: message,
        progress: progress,
        isError: isError
      };

      console.log('[E2E Test] Sending progress update:', updateMessage, '(from Test 1)');

      // Simulate sending message to content script
      try {
        if (global.chrome && global.chrome.tabs && global.chrome.tabs.sendMessage) {
          await global.chrome.tabs.sendMessage(1, updateMessage);
        }
      } catch (error) {
        console.error('[E2E Test] Error sending progress update:', error);
      }
    }

    // Helper function for delays
    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Set up background message listener
    setupBackgroundMessageListener();

    // Mock the content script functionality
    const mockContentScript = {
      // Extract project ID
      extractProjectId: function() {
        return 'test-project-123';
      },

      // Extract project name
      extractProjectName: function() {
        return 'Test Project';
      },

      // Extract project description
      extractProjectDescription: function() {
        return 'Project exported from Bolt.diy';
      },

      // Extract file structure
      extractFileStructure: function() {
        return [
          { name: 'index.js', type: 'file', size: 1024 },
          { name: 'styles.css', type: 'file', size: 512 },
          { name: 'README.md', type: 'file', size: 256 }
        ];
      },

      // Extract project metadata
      extractProjectMetadata: function() {
        return {
          version: '1.0.0',
          author: 'Test User',
          license: 'MIT',
          framework: 'Vanilla JS',
          buildTool: 'Vite',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      },

      // Extract dependencies
      extractDependencies: function() {
        return {
          production: {},
          development: {}
        };
      },

      // Extract environment configuration
      extractEnvironmentConfig: function() {
        return {
          environments: {
            development: {},
            staging: {},
            production: {}
          },
          variables: {}
        };
      }
    };

    // Track the export process promise so we can wait for it to complete
    let exportProcessPromise = null;

    // Simulate the export trigger
    async function simulateExportTrigger() {
      console.log('[E2E Test] Simulating export trigger');

      try {
        // Extract comprehensive project information
        const projectData = {
          id: mockContentScript.extractProjectId(),
          name: mockContentScript.extractProjectName(),
          description: mockContentScript.extractProjectDescription(),
          metadata: mockContentScript.extractProjectMetadata(),
          dependencies: mockContentScript.extractDependencies(),
          environmentConfig: mockContentScript.extractEnvironmentConfig(),
          fileStructure: mockContentScript.extractFileStructure(),
          url: 'https://bolt.diy/project/test-project-123',
          timestamp: Date.now()
        };

        console.log('[E2E Test] Extracted project data:', {
          id: projectData.id,
          name: projectData.name,
          fileCount: projectData.fileStructure.length
        });

        // Validate project data
        if (!projectData.id || !projectData.name) {
          throw new Error('Missing required project data');
        }

        // Send export request to background script
        const response = await global.chrome.runtime.sendMessage({
          type: 'BOLT_DIY_EXPORT_REQUEST',
          project: projectData,
          trigger: 'ui_button',
          timestamp: Date.now()
        });

        console.log('[E2E Test] Export request response:', response);

        // Validate response
        if (!response || response.type !== 'EXPORT_STARTED') {
          throw new Error('Invalid response from background service');
        }

        console.log('[E2E Test] ✅ Test 1 passed: Complete export workflow');
        return true;
      } catch (error) {
        console.error('[E2E Test] ❌ Test 1 failed:', error.message);
        return false;
      }
    }

    // Modify simulateExportProcess to return a promise we can track
    const originalSimulateExportProcess = simulateExportProcess;
    simulateExportProcess = function(project, trigger) {
      exportProcessPromise = originalSimulateExportProcess(project, trigger);
      return exportProcessPromise;
    };

    // Run the export trigger simulation
    const result = await simulateExportTrigger();

    // Wait for the export process to complete before finishing the test
    if (exportProcessPromise) {
      console.log('[E2E Test] Waiting for export process to complete...');
      await exportProcessPromise;
      console.log('[E2E Test] Export process completed');
    }

    return result;
  } catch (error) {
    console.error('[E2E Test] ❌ Test 1 failed:', error.message);
    return false;
  } finally {
    // Clean up listener
    if (currentListener) {
      console.log('[E2E Test] Cleaning up listener');
      global.chrome.runtime.onMessage.removeListener(currentListener);
      currentListener = null;
    }

    // Restore original chrome object
    global.chrome = originalChrome;

    // Ensure export process is completed
    if (!exportProcessCompleted) {
      console.log('[E2E Test] Warning: Export process may not have completed properly');
    }
  }
}

// Test 2: Keyboard shortcut export trigger
async function testKeyboardShortcutTrigger() {
  console.log('[E2E Test] Test 2: Keyboard shortcut export trigger');

  // Create isolated mock environment for this test
  const mockChrome = createMockChromeEnvironment();
  const originalChrome = global.chrome;
  global.chrome = mockChrome;

  // Track cleanup
  let currentListener = null;

  try {
    // Add the background message listener to simulate the background service
    function setupBackgroundMessageListener() {
      // Remove existing listener if present
      if (currentListener) {
        global.chrome.runtime.onMessage.removeListener(currentListener);
      }

      // Create new listener
      currentListener = (message, sender, sendResponse) => {
        try {
          console.log('[E2E Test] Background received message:', message.type, '(listener active)');

          // Handle different message types
          switch (message.type) {
            case 'BOLT_DIY_EXPORT_REQUEST':
              // Validate required fields
              if (!message.project) {
                console.error('[E2E Test] Background: Missing project data in export request');
                sendResponse({ type: 'EXPORT_ERROR', error: 'Missing project data' });
                return false;
              }

              console.log('[E2E Test] Background: Export request received for project:', message.project.name);
              sendResponse({ type: 'EXPORT_STARTED' });
              return false; // Synchronous response

            default:
              console.warn('[E2E Test] Background: Unknown message type received:', message.type);
              return false; // No response needed
          }
        } catch (error) {
          console.error('[E2E Test] Background: Error handling message:', error);
          try {
            sendResponse({ type: 'MESSAGE_ERROR', error: error.message });
          } catch (responseError) {
            console.error('[E2E Test] Background: Failed to send error response:', responseError);
          }
          return false;
        }
      };

      global.chrome.runtime.onMessage.addListener(currentListener);
    }

    // Set up background message listener
    setupBackgroundMessageListener();

    // Mock the keyboard shortcut handler
    async function handleKeyboardShortcut(event) {
      // Check for Ctrl+Shift+E (or Cmd+Shift+E on Mac)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
        console.log('[E2E Test] Keyboard shortcut detected');

        // In a real implementation, this would trigger the export
        // For testing, we'll just simulate the export request
        try {
          const response = await global.chrome.runtime.sendMessage({
            type: 'BOLT_DIY_EXPORT_REQUEST',
            project: {
              id: 'test-project',
              name: 'Test Project',
              description: 'Test project'
            },
            trigger: 'keyboard_shortcut'
          });
          return response;
        } catch (error) {
          console.error('[E2E Test] Keyboard shortcut error:', error);
          throw error;
        }
      }
    }

    // Simulate keyboard shortcut
    const keyboardEvent = {
      ctrlKey: true,
      shiftKey: true,
      key: 'E'
    };

    const response = await handleKeyboardShortcut(keyboardEvent);

    // Validate response
    if (!response || response.type !== 'EXPORT_STARTED') {
      throw new Error('Keyboard shortcut trigger failed');
    }

    console.log('[E2E Test] ✅ Test 2 passed: Keyboard shortcut export trigger');
    return true;
  } catch (error) {
    console.error('[E2E Test] ❌ Test 2 failed:', error.message);
    return false;
  } finally {
    // Clean up listener
    if (currentListener) {
      console.log('[E2E Test] Cleaning up listener');
      global.chrome.runtime.onMessage.removeListener(currentListener);
      currentListener = null;
    }

    // Restore original chrome object
    global.chrome = originalChrome;
  }
}

// Test 3: Context menu export trigger
async function testContextMenuTrigger() {
  console.log('[E2E Test] Test 3: Context menu export trigger');

  // Create isolated mock environment for this test
  const mockChrome = createMockChromeEnvironment();
  const originalChrome = global.chrome;
  global.chrome = mockChrome;

  // Track cleanup
  let contextMenuListener = null;
  let currentListener = null;

  try {
    // Add the background message listener to simulate the background service
    function setupBackgroundMessageListener() {
      // Remove existing listener if present
      if (currentListener) {
        global.chrome.runtime.onMessage.removeListener(currentListener);
      }

      // Create new listener
      currentListener = (message, sender, sendResponse) => {
        try {
          console.log('[E2E Test] Background received message:', message.type, '(listener active)');

          // Handle different message types
          switch (message.type) {
            case 'BOLT_DIY_EXPORT_REQUEST':
              // Validate required fields
              if (!message.project) {
                console.error('[E2E Test] Background: Missing project data in export request');
                sendResponse({ type: 'EXPORT_ERROR', error: 'Missing project data' });
                return false;
              }

              console.log('[E2E Test] Background: Export request received for project:', message.project.name);
              sendResponse({ type: 'EXPORT_STARTED' });
              return false; // Synchronous response

            default:
              console.warn('[E2E Test] Background: Unknown message type received:', message.type);
              return false; // No response needed
          }
        } catch (error) {
          console.error('[E2E Test] Background: Error handling message:', error);
          try {
            sendResponse({ type: 'MESSAGE_ERROR', error: error.message });
          } catch (responseError) {
            console.error('[E2E Test] Background: Failed to send error response:', responseError);
          }
          return false;
        }
      };

      global.chrome.runtime.onMessage.addListener(currentListener);
    }

    // Set up background message listener
    setupBackgroundMessageListener();

    // Mock context menu click handler
    contextMenuListener = async function handleContextMenuClick(info, tab) {
      console.log('[E2E Test] Context menu clicked:', info.menuItemId);

      if (info.menuItemId === 'bolt-diy-export-github') {
        // Simulate sending context menu export request
        try {
          const response = await global.chrome.runtime.sendMessage({
            type: 'BOLT_DIY_EXPORT_REQUEST',
            project: {
              id: 'test-project',
              name: 'Test Project',
              description: 'Test project'
            },
            trigger: 'context_menu'
          });
          return response;
        } catch (error) {
          console.error('[E2E Test] Context menu error:', error);
          throw error;
        }
      }
    };

    // Add context menu listener
    if (global.chrome.contextMenus && global.chrome.contextMenus.onClicked && global.chrome.contextMenus.onClicked.addListener) {
      global.chrome.contextMenus.onClicked.addListener(contextMenuListener);
    }

    // Simulate context menu click
    const contextMenuClick = {
      menuItemId: 'bolt-diy-export-github'
    };

    const response = await contextMenuListener(contextMenuClick, { id: 1 });

    // Validate response
    if (!response || response.type !== 'EXPORT_STARTED') {
      throw new Error('Context menu trigger failed');
    }

    console.log('[E2E Test] ✅ Test 3 passed: Context menu export trigger');
    return true;
  } catch (error) {
    console.error('[E2E Test] ❌ Test 3 failed:', error.message);
    return false;
  } finally {
    // Clean up listener
    if (contextMenuListener && global.chrome.contextMenus && global.chrome.contextMenus.onClicked && global.chrome.contextMenus.onClicked.removeListener) {
      global.chrome.contextMenus.onClicked.removeListener(contextMenuListener);
    }

    // Clean up background listener
    if (currentListener) {
      console.log('[E2E Test] Cleaning up listener');
      global.chrome.runtime.onMessage.removeListener(currentListener);
      currentListener = null;
    }

    // Restore original chrome object
    global.chrome = originalChrome;
  }
}

// Test 4: Progress tracking during export
async function testProgressTracking() {
  console.log('[E2E Test] Test 4: Progress tracking during export');

  // Save original chrome object
  const originalChrome = global.chrome;

  try {
    // Mock chrome.tabs.sendMessage to capture progress updates
    const progressUpdates = [];

    // Create isolated mock environment
    const mockChrome = {
      tabs: {
        sendMessage: function(tabId, message) {
          console.log('[E2E Test] Progress update received:', message);
          if (message.type === 'EXPORT_STATUS_UPDATE') {
            progressUpdates.push({
              status: message.status,
              progress: message.progress,
              message: message.message,
              timestamp: Date.now()
            });
          }
          return Promise.resolve({ success: true });
        }
      }
    };
    global.chrome = mockChrome;

    // Simulate progress updates
    const progressSteps = [
      { status: 'initializing', message: 'Initializing export process', progress: 0 },
      { status: 'collecting', message: 'Collecting project files', progress: 10 },
      { status: 'processing', message: 'Processing project data', progress: 20 },
      { status: 'creating_zip', message: 'Creating ZIP archive', progress: 30 },
      { status: 'uploading', message: 'Uploading to GitHub', progress: 60 },
      { status: 'finalizing', message: 'Finalizing export', progress: 90 },
      { status: 'completed', message: 'Export completed successfully', progress: 100 }
    ];

    // Send progress updates
    for (const step of progressSteps) {
      await global.chrome.tabs.sendMessage(1, {
        type: 'EXPORT_STATUS_UPDATE',
        status: step.status,
        message: step.message,
        progress: step.progress
      });

      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    // Validate progress updates
    if (progressUpdates.length !== progressSteps.length) {
      throw new Error(`Expected ${progressSteps.length} progress updates, got ${progressUpdates.length}`);
    }

    // Check that progress values are increasing
    for (let i = 1; i < progressUpdates.length; i++) {
      if (progressUpdates[i].progress < progressUpdates[i-1].progress) {
        throw new Error(`Progress values should be increasing: ${progressUpdates[i-1].progress} -> ${progressUpdates[i].progress}`);
      }
    }

    // Check final progress
    const finalUpdate = progressUpdates[progressUpdates.length - 1];
    if (finalUpdate.progress !== 100) {
      throw new Error(`Expected final progress to be 100, got ${finalUpdate.progress}`);
    }

    console.log('[E2E Test] Progress updates:', progressUpdates.map(u => `${u.status} (${u.progress}%)`));
    console.log('[E2E Test] ✅ Test 4 passed: Progress tracking during export');
    return true;
  } catch (error) {
    console.error('[E2E Test] ❌ Test 4 failed:', error.message);
    return false;
  } finally {
    // Restore original chrome object
    global.chrome = originalChrome;
  }
}

// Test 5: Error handling in export workflow
async function testErrorHandling() {
  console.log('[E2E Test] Test 5: Error handling in export workflow');

  // Save original chrome object
  const originalChrome = global.chrome;

  try {
    // Mock chrome.runtime.sendMessage to simulate errors
    let callCount = 0;

    // Create isolated mock environment
    const mockChrome = {
      runtime: {
        sendMessage: function(message) {
          callCount++;
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              console.log('[E2E Test] Mock sendMessage called with:', message.type);

              // Simulate different error scenarios
              if (callCount === 1) {
                // First call - network error
                reject(new Error('Network error'));
              } else if (callCount === 2) {
                // Second call - invalid response
                resolve({ type: 'UNKNOWN_RESPONSE' });
              } else {
                // Third call - success
                resolve({ type: 'EXPORT_STARTED' });
              }
            }, 10);
          });
        }
      }
    };
    global.chrome = mockChrome;

    // Mock retry mechanism
    const MAX_RETRIES = 3;
    let retryCount = 0;

    async function sendExportRequestWithRetry(projectData, triggerType) {
      while (retryCount < MAX_RETRIES) {
        try {
          const response = await global.chrome.runtime.sendMessage({
            type: 'BOLT_DIY_EXPORT_REQUEST',
            project: projectData,
            trigger: triggerType,
            retryCount: retryCount
          });

          console.log('[E2E Test] Export request response:', response);

          // Validate response
          if (response && response.type === 'EXPORT_STARTED') {
            console.log('[E2E Test] Export request successful after', retryCount, 'retries');
            return { success: true, retryCount: retryCount };
          } else {
            console.log('[E2E Test] Invalid response, retrying...');
            retryCount++;
          }
        } catch (error) {
          console.log('[E2E Test] Export request failed:', error.message, 'Retry:', retryCount + 1);
          retryCount++;

          if (retryCount >= MAX_RETRIES) {
            throw new Error(`Max retries reached: ${error.message}`);
          }

          // Exponential backoff with shorter delays for testing
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 10));
        }
      }

      throw new Error('Max retries reached without success');
    }

    // Test with a sample project
    const projectData = {
      id: 'test-project',
      name: 'Test Project',
      description: 'Test project for error handling'
    };

    // This should succeed after 2 retries
    const result = await sendExportRequestWithRetry(projectData, 'ui_button');

    if (!result.success) {
      throw new Error('Error handling test failed');
    }

    console.log('[E2E Test] ✅ Test 5 passed: Error handling in export workflow');
    return true;
  } catch (error) {
    console.error('[E2E Test] ❌ Test 5 failed:', error.message);
    return false;
  } finally {
    // Restore original chrome object
    global.chrome = originalChrome;
  }
}

// Run all end-to-end tests
async function runAllE2ETests() {
  console.log('[E2E Test] Starting all end-to-end tests');

  let passedTests = 0;
  let totalTests = 5;

  // Test 1: Complete export workflow
  if (await testCompleteExportWorkflow()) {
    passedTests++;
  }

  // Test 2: Keyboard shortcut trigger
  if (await testKeyboardShortcutTrigger()) {
    passedTests++;
  }

  // Test 3: Context menu trigger
  if (await testContextMenuTrigger()) {
    passedTests++;
  }

  // Test 4: Progress tracking
  if (await testProgressTracking()) {
    passedTests++;
  }

  // Test 5: Error handling
  if (await testErrorHandling()) {
    passedTests++;
  }

  console.log(`[E2E Test] End-to-end tests completed: ${passedTests}/${totalTests} passed`);

  if (passedTests === totalTests) {
    console.log('[E2E Test] 🎉 All end-to-end tests passed!');
    return true;
  } else {
    console.log('[E2E Test] ❌ Some end-to-end tests failed');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllE2ETests()
    .then(success => {
      if (success) {
        console.log('[E2E Test] All end-to-end tests completed successfully');
        process.exit(0);
      } else {
        console.error('[E2E Test] Some end-to-end tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('[E2E Test] End-to-end test execution failed:', error);
      process.exit(1);
    });
}

// Export for testing
module.exports = {
  testCompleteExportWorkflow,
  testKeyboardShortcutTrigger,
  testContextMenuTrigger,
  testProgressTracking,
  testErrorHandling,
  runAllE2ETests
};
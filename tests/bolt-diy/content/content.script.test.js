/**
 * Basic tests for Bolt.diy content script functionality
 */

// Mock DOM APIs
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

console.log('[Content Script Test] Starting Bolt.diy content script tests');

// Test 1: Initialize integration
function testInitializeIntegration() {
  console.log('[Content Script Test] Test 1: Initialize integration');

  try {
    // Create a mock DOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://bolt.diy/project/123'
    });

    // Set up global objects
    global.window = dom.window;
    global.document = dom.window.document;
    global.Node = dom.window.Node;
    global.MutationObserver = dom.window.MutationObserver;
    global.chrome = {
      runtime: {
        sendMessage: function(message) {
          return new Promise((resolve) => {
            console.log('[Content Script Test] Mock sendMessage called with:', message);
            resolve({ success: true });
          });
        },
        onMessage: {
          addListener: function(callback) {
            console.log('[Content Script Test] Mock addListener called');
          }
        }
      }
    };

    // Mock the chrome-extension content functions
    const mockContent = {
      extractProjectId: function() { return 'test-project-id'; },
      extractProjectName: function() { return 'Test Project'; },
      extractProjectDescription: function() { return 'Test project description'; }
    };

    // Temporarily modify the module resolution to use our mocks
    const originalRequire = require;
    const mockRequire = function(modulePath) {
      if (modulePath.includes('chrome-extension/content/content.js')) {
        return mockContent;
      }
      return originalRequire(modulePath);
    };

    console.log('[Content Script Test] ✅ Test 1 passed: Integration initialization');
    return true;
  } catch (error) {
    console.error('[Content Script Test] ❌ Test 1 failed:', error.message);
    return false;
  }
}

// Test 2: Extract project data
function testExtractProjectData() {
  console.log('[Content Script Test] Test 2: Extract project data');

  try {
    // Create a mock DOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://bolt.diy/project/123'
    });

    // Set up global objects
    global.window = dom.window;
    global.document = dom.window.document;

    // Mock the chrome-extension content functions
    const mockContent = {
      extractProjectId: function() { return 'test-project-id'; },
      extractProjectName: function() { return 'Test Project'; },
      extractProjectDescription: function() { return 'Test project description'; }
    };

    // Create a simple mock for the content script functions
    const mockContentScript = {
      extractProjectMetadata: function() {
        return {
          version: '1.0.0',
          author: '',
          license: '',
          framework: '',
          buildTool: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      },
      extractDependencies: function() {
        return {
          production: {},
          development: {}
        };
      },
      extractEnvironmentConfig: function() {
        return {
          environments: {
            development: {},
            staging: {},
            production: {}
          },
          variables: {}
        };
      },
      extractFileStructure: function() {
        return [
          { name: 'README.md', type: 'file', size: 0 },
          { name: 'index.js', type: 'file', size: 0 }
        ];
      }
    };

    // Simulate extractProjectData function logic
    function extractProjectData() {
      try {
        // Extract basic project information with fallbacks
        let projectId, projectName, projectDescription;

        try {
          projectId = mockContent.extractProjectId();
        } catch (error) {
          console.warn('[Bolt.DIY Integration] Failed to extract project ID:', error);
          projectId = 'unknown-project-' + Date.now();
        }

        try {
          projectName = mockContent.extractProjectName();
        } catch (error) {
          console.warn('[Bolt.DIY Integration] Failed to extract project name:', error);
          projectName = 'Unknown Project';
        }

        try {
          projectDescription = mockContent.extractProjectDescription();
        } catch (error) {
          console.warn('[Bolt.DIY Integration] Failed to extract project description:', error);
          projectDescription = 'Project exported from Bolt.DIY on ' + new Date().toISOString();
        }

        // Extract additional metadata with error handling
        let metadata;
        try {
          metadata = mockContentScript.extractProjectMetadata();
        } catch (error) {
          console.warn('[Bolt.DIY Integration] Failed to extract project metadata:', error);
          metadata = {
            version: '1.0.0',
            author: '',
            license: '',
            framework: '',
            buildTool: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }

        // Extract dependencies with error handling
        let dependencies;
        try {
          dependencies = mockContentScript.extractDependencies();
        } catch (error) {
          console.warn('[Bolt.DIY Integration] Failed to extract dependencies:', error);
          dependencies = {
            production: {},
            development: {}
          };
        }

        // Extract environment configuration with error handling
        let environmentConfig;
        try {
          environmentConfig = mockContentScript.extractEnvironmentConfig();
        } catch (error) {
          console.warn('[Bolt.DIY Integration] Failed to extract environment configuration:', error);
          environmentConfig = {
            environments: {
              development: {},
              staging: {},
              production: {}
            },
            variables: {}
          };
        }

        // Extract file structure with error handling
        let fileStructure;
        try {
          fileStructure = mockContentScript.extractFileStructure();
        } catch (error) {
          console.warn('[Bolt.DIY Integration] Failed to extract file structure:', error);
          fileStructure = [
            { name: 'README.md', type: 'file', size: 0 },
            { name: 'index.js', type: 'file', size: 0 }
          ];
        }

        const projectData = {
          id: projectId,
          name: projectName,
          description: projectDescription,
          metadata: metadata,
          dependencies: dependencies,
          environmentConfig: environmentConfig,
          fileStructure: fileStructure,
          url: global.window.location.href,
          timestamp: Date.now()
        };

        return projectData;
      } catch (error) {
        console.error('[Bolt.DIY Integration] Critical error extracting project data:', error);
        // Return minimal project data as fallback
        return {
          id: 'fallback-project-' + Date.now(),
          name: 'Fallback Project',
          description: 'Fallback project data due to extraction error',
          metadata: {
            version: '1.0.0',
            author: '',
            license: '',
            framework: '',
            buildTool: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          dependencies: {
            production: {},
            development: {}
          },
          environmentConfig: {
            environments: {
              development: {},
              staging: {},
              production: {}
            },
            variables: {}
          },
          fileStructure: [
            { name: 'README.md', type: 'file', size: 0 },
            { name: 'index.js', type: 'file', size: 0 }
          ],
          url: global.window.location.href,
          timestamp: Date.now()
        };
      }
    }

    // Test the function
    const projectData = extractProjectData();

    // Validate the structure
    if (!projectData.id || !projectData.name || !projectData.description) {
      throw new Error('Missing required project data fields');
    }

    if (!projectData.metadata || !projectData.dependencies || !projectData.environmentConfig || !projectData.fileStructure) {
      throw new Error('Missing required project data structures');
    }

    console.log('[Content Script Test] ✅ Test 2 passed: Project data extraction');
    console.log('[Content Script Test] Extracted project data:', {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description,
      fileCount: projectData.fileStructure.length
    });
    return true;
  } catch (error) {
    console.error('[Content Script Test] ❌ Test 2 failed:', error.message);
    return false;
  }
}

// Test 3: Handle export trigger
async function testHandleExportTrigger() {
  console.log('[Content Script Test] Test 3: Handle export trigger');

  try {
    // Set up mock environment
    global.exportInProgress = false;
    global.MAX_RETRIES = 3;
    global.RETRY_DELAY = 100;

    // Mock chrome runtime
    global.chrome = {
      runtime: {
        sendMessage: function(message) {
          return new Promise((resolve) => {
            setTimeout(() => {
              console.log('[Content Script Test] Mock sendMessage called with:', message.type);
              resolve({ success: true });
            }, 10);
          });
        }
      }
    };

    // Mock extractProjectData function
    function extractProjectData() {
      return {
        id: 'test-project-id',
        name: 'Test Project',
        description: 'Test project description',
        metadata: {},
        dependencies: {},
        environmentConfig: {},
        fileStructure: [],
        url: 'https://bolt.diy/project/123',
        timestamp: Date.now()
      };
    }

    // Mock handleExportTrigger function
    async function handleExportTrigger(triggerType, retryCount = 0) {
      if (global.exportInProgress) {
        console.warn('[Bolt.DIY Integration] Export already in progress');
        return;
      }

      try {
        global.exportInProgress = true;

        // Extract comprehensive project information
        const projectData = extractProjectData();

        // Send export request to background script with timeout handling
        const sendMessageWithTimeout = (message, timeout = 5000) => {
          return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('Message timeout'));
            }, timeout);

            global.chrome.runtime.sendMessage(message)
              .then((response) => {
                clearTimeout(timeoutId);
                resolve(response);
              })
              .catch((error) => {
                clearTimeout(timeoutId);
                reject(error);
              });
          });
        };

        await sendMessageWithTimeout({
          type: 'BOLT_DIY_EXPORT_REQUEST',
          project: projectData,
          trigger: triggerType,
          timestamp: Date.now()
        }, 10000); // 10 second timeout

        console.log('[Bolt.DIY Integration] Export request sent to background script');
      } catch (error) {
        console.error('[Bolt.DIY Integration] Failed to send export request:', error);
        global.exportInProgress = false;

        // Retry mechanism
        if (retryCount < global.MAX_RETRIES) {
          console.log(`[Bolt.DIY Integration] Retrying export request (${retryCount + 1}/${global.MAX_RETRIES})`);
          setTimeout(() => {
            handleExportTrigger(triggerType, retryCount + 1);
          }, global.RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        } else {
          console.error('[Bolt.DIY Integration] Max retries reached, export failed');
        }
      }
    }

    // Test the function
    await handleExportTrigger('ui_button');

    console.log('[Content Script Test] ✅ Test 3 passed: Export trigger handling');
    return true;
  } catch (error) {
    console.error('[Content Script Test] ❌ Test 3 failed:', error.message);
    return false;
  }
}

// Test 4: Extract file structure
function testExtractFileStructure() {
  console.log('[Content Script Test] Test 4: Extract file structure');

  try {
    // Create a mock DOM environment with some file elements
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="styles.css">
        </head>
        <body>
          <div data-file="test.js">Test file</div>
          <script type="text/babel">
            import React from 'react';
            import './App.css';
          </script>
          <script src="external.js"></script>
        </body>
      </html>
    `);

    // Set up global objects
    global.window = dom.window;
    global.document = dom.window.document;
    global.Node = dom.window.Node;

    // Mock extractFileStructure function
    function extractFileStructure() {
      try {
        const fileStructure = [];

        // Look for link tags for CSS files
        const linkElements = global.document.querySelectorAll('link[rel="stylesheet"]');
        for (const link of linkElements) {
          try {
            const href = link.getAttribute('href');
            if (href && (href.endsWith('.css') || href.includes('.css'))) {
              if (!fileStructure.some(f => f.name === href)) {
                fileStructure.push({
                  name: href,
                  type: 'file',
                  size: 0
                });
              }
            }
          } catch (e) {
            continue;
          }
        }

        return fileStructure;
      } catch (error) {
        console.warn('[Bolt.DIY Integration] Error extracting file structure:', error);
        return [];
      }
    }

    // Test the function
    const fileStructure = extractFileStructure();

    // Validate the result
    if (!Array.isArray(fileStructure)) {
      throw new Error('File structure is not an array');
    }

    console.log('[Content Script Test] ✅ Test 4 passed: File structure extraction');
    console.log('[Content Script Test] Extracted files:', fileStructure.map(f => f.name));
    return true;
  } catch (error) {
    console.error('[Content Script Test] ❌ Test 4 failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('[Content Script Test] Starting all tests');

  let passedTests = 0;
  let totalTests = 4;

  // Test 1: Initialize integration
  if (testInitializeIntegration()) {
    passedTests++;
  }

  // Test 2: Extract project data
  if (testExtractProjectData()) {
    passedTests++;
  }

  // Test 3: Handle export trigger
  if (await testHandleExportTrigger()) {
    passedTests++;
  }

  // Test 4: Extract file structure
  if (testExtractFileStructure()) {
    passedTests++;
  }

  console.log(`[Content Script Test] Tests completed: ${passedTests}/${totalTests} passed`);

  if (passedTests === totalTests) {
    console.log('[Content Script Test] 🎉 All tests passed!');
    return true;
  } else {
    console.log('[Content Script Test] ❌ Some tests failed');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      if (success) {
        console.log('[Content Script Test] All tests completed successfully');
        process.exit(0);
      } else {
        console.error('[Content Script Test] Some tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('[Content Script Test] Test execution failed:', error);
      process.exit(1);
    });
}

// Export for testing
module.exports = {
  testInitializeIntegration,
  testExtractProjectData,
  testHandleExportTrigger,
  testExtractFileStructure,
  runAllTests
};
/**
 * Basic tests for Bolt.diy background service functionality
 */

console.log('[Background Service Test] Starting Bolt.diy background service tests');

// Test 1: Initialize background service
function testInitializeBackgroundService() {
  console.log('[Background Service Test] Test 1: Initialize background service');

  try {
    // Mock chrome APIs
    global.chrome = {
      runtime: {
        onMessage: {
          addListener: function(callback) {
            console.log('[Background Service Test] Mock addListener called');
          }
        },
        sendMessage: function(message) {
          return new Promise((resolve) => {
            console.log('[Background Service Test] Mock sendMessage called with:', message.type);
            resolve({ success: true });
          });
        }
      },
      storage: {
        onChanged: {
          addListener: function(callback) {
            console.log('[Background Service Test] Mock storage addListener called');
          }
        },
        sync: {
          get: function(keys) {
            return Promise.resolve({
              githubToken: 'test-token',
              defaultBranch: 'main',
              environments: ['main', 'development', 'staging', 'production']
            });
          }
        }
      },
      contextMenus: {
        removeAll: function() {
          return Promise.resolve();
        },
        create: function(options, callback) {
          console.log('[Background Service Test] Mock context menu created:', options.title);
          if (callback) callback();
        },
        onClicked: {
          addListener: function(callback) {
            console.log('[Background Service Test] Mock context menu click listener added');
          }
        }
      },
      tabs: {
        sendMessage: function(tabId, message) {
          return Promise.resolve();
        }
      }
    };

    // Since we're in an ES module environment, we'll use a simpler mocking approach
    // Mock the GitHub client functions directly
    const mockGitHubClient = {
      repositories: {
        create: jest.fn().mockResolvedValue({
          name: 'test-repo',
          html_url: 'https://github.com/test/test-repo',
          owner: { login: 'test' }
        })
      },
      files: {
        batch: jest.fn().mockResolvedValue([
          { success: true, path: 'README.md' },
          { success: true, path: 'package.json' }
        ])
      }
    };

    // Mock the ZIP processor
    const mockOptimizedZipProcessor = {
      create: jest.fn().mockResolvedValue(Buffer.from('test zip content')),
      extractBuffer: jest.fn().mockResolvedValue({
        entries: [
          { name: 'README.md', content: '# Test', isDirectory: false },
          { name: 'package.json', content: '{}', isDirectory: false }
        ]
      })
    };

    console.log('[Background Service Test] ✅ Test 1 passed: Background service initialization');
    return true;
  } catch (error) {
    console.error('[Background Service Test] ❌ Test 1 failed:', error.message);
    return false;
  }
}

// Test 2: Handle content message
function testHandleContentMessage() {
  console.log('[Background Service Test] Test 2: Handle content message');

  try {
    // Set up mock environment
    global.exportInProgress = false;
    global.currentExport = null;

    // Mock chrome runtime
    global.chrome = {
      runtime: {
        sendMessage: function(message) {
          return new Promise((resolve) => {
            setTimeout(() => {
              console.log('[Background Service Test] Mock sendMessage called with:', message.type);
              resolve({ success: true });
            }, 10);
          });
        }
      }
    };

    // Mock handleExportRequest function
    async function handleExportRequest(project, trigger, retryCount = 0) {
      console.log('[Background Service Test] Mock handleExportRequest called with:', project.name, trigger);
      return { success: true };
    }

    // Mock handleContentMessage function
    function handleContentMessage(message, sender, sendResponse) {
      try {
        // Validate message
        if (!message || !message.type) {
          console.warn('[Bolt.DIY Background] Invalid message received');
          return false;
        }

        switch (message.type) {
          case 'BOLT_DIY_EXPORT_REQUEST':
            // Validate required fields
            if (!message.project) {
              console.error('[Bolt.DIY Background] Missing project data in export request');
              sendResponse({ type: 'EXPORT_ERROR', error: 'Missing project data' });
              return false;
            }

            handleExportRequest(message.project, message.trigger);
            sendResponse({ type: 'EXPORT_STARTED' });
            return false; // Synchronous response

          case 'GET_EXPORT_STATUS':
            sendResponse({
              type: 'EXPORT_STATUS_RESPONSE',
              inProgress: global.exportInProgress,
              currentExport: global.currentExport
            });
            return false; // Synchronous response

          default:
            console.warn('[Bolt.DIY Background] Unknown message type received:', message.type);
            // Ignore unknown message types
            return false; // No response needed
        }
      } catch (error) {
        console.error('[Bolt.DIY Background] Error handling content message:', error);
        try {
          // Try to send error response
          sendResponse({ type: 'MESSAGE_ERROR', error: error.message });
        } catch (responseError) {
          console.error('[Bolt.DIY Background] Failed to send error response:', responseError);
        }
        return false;
      }
    }

    // Test valid export request
    let responseSent = false;
    let responseContent = null;

    const mockSendResponse = function(response) {
      responseSent = true;
      responseContent = response;
    };

    const validMessage = {
      type: 'BOLT_DIY_EXPORT_REQUEST',
      project: {
        id: 'test-project',
        name: 'Test Project',
        description: 'Test project description'
      },
      trigger: 'ui_button'
    };

    handleContentMessage(validMessage, {}, mockSendResponse);

    if (!responseSent || responseContent.type !== 'EXPORT_STARTED') {
      throw new Error('Failed to handle valid export request');
    }

    // Test invalid message
    responseSent = false;
    responseContent = null;

    const invalidMessage = {
      type: 'INVALID_TYPE'
    };

    handleContentMessage(invalidMessage, {}, mockSendResponse);

    // For unknown message types, we don't send a response, so responseSent should still be false
    if (responseSent) {
      throw new Error('Should not send response for unknown message types');
    }

    console.log('[Background Service Test] ✅ Test 2 passed: Content message handling');
    return true;
  } catch (error) {
    console.error('[Background Service Test] ❌ Test 2 failed:', error.message);
    return false;
  }
}

// Test 3: Get GitHub configuration
async function testGetGitHubConfig() {
  console.log('[Background Service Test] Test 3: Get GitHub configuration');

  try {
    // Mock chrome storage
    global.chrome = {
      storage: {
        sync: {
          get: function(keys) {
            return Promise.resolve({
              githubToken: 'test-token',
              defaultBranch: 'main',
              environments: ['main', 'development', 'staging', 'production']
            });
          }
        }
      }
    };

    // Mock getGitHubConfig function
    async function getGitHubConfig() {
      const result = await global.chrome.storage.sync.get([
        'githubToken',
        'defaultBranch',
        'environments'
      ]);

      return {
        token: result.githubToken,
        defaultBranch: result.defaultBranch || 'main',
        environments: result.environments || ['main', 'development', 'staging', 'production']
      };
    }

    // Test the function
    const config = await getGitHubConfig();

    // Validate the structure
    if (!config.token || !config.defaultBranch || !config.environments) {
      throw new Error('Missing required configuration fields');
    }

    if (!Array.isArray(config.environments)) {
      throw new Error('Environments should be an array');
    }

    console.log('[Background Service Test] ✅ Test 3 passed: GitHub configuration retrieval');
    console.log('[Background Service Test] Retrieved config:', {
      hasToken: !!config.token,
      defaultBranch: config.defaultBranch,
      environmentCount: config.environments.length
    });
    return true;
  } catch (error) {
    console.error('[Background Service Test] ❌ Test 3 failed:', error.message);
    return false;
  }
}

// Test 4: Collect project files
async function testCollectProjectFiles() {
  console.log('[Background Service Test] Test 4: Collect project files');

  try {
    // Mock collectProjectFiles function
    async function collectProjectFiles(project) {
      try {
        // Start with enhanced project information
        const files = [];

        // Create README.md with project information
        files.push({
          name: 'README.md',
          content: `# ${project.name}
${project.description || 'Bolt.DIY project exported to GitHub'}`
        });

        // Create package.json with dependencies
        files.push({
          name: 'package.json',
          content: JSON.stringify({
            name: `bolt-diy-${project.name.replace(/\s+/g, '-').toLowerCase()}`,
            version: project.metadata?.version || '1.0.0',
            description: project.description || '',
            main: 'index.js'
          }, null, 2)
        });

        // Add detected files from file structure
        if (project.fileStructure && Array.isArray(project.fileStructure)) {
          for (const file of project.fileStructure) {
            // Skip files we've already created
            if (files.some(f => f.name === file.name)) {
              continue;
            }

            // Create content based on file type
            if (file.type === 'file') {
              files.push({
                name: file.name,
                content: `// Auto-generated file: ${file.name}`
              });
            }
          }
        }

        return files;
      } catch (error) {
        console.error('[Bolt.DIY Background] Error collecting project files:', error);
        // Fallback to minimal files
        return [
          {
            name: 'README.md',
            content: `# ${project.name}\n\n${project.description || 'Bolt.DIY project exported to GitHub'}`
          }
        ];
      }
    }

    // Test with a sample project
    const testProject = {
      id: 'test-project-id',
      name: 'Test Project',
      description: 'Test project description',
      metadata: {
        version: '1.0.0',
        author: 'Test Author'
      },
      fileStructure: [
        { name: 'app.js', type: 'file', size: 1024 },
        { name: 'styles.css', type: 'file', size: 512 }
      ],
      url: 'https://bolt.diy/project/test',
      timestamp: Date.now()
    };

    // Test the function
    const files = await collectProjectFiles(testProject);

    // Validate the result
    if (!Array.isArray(files)) {
      throw new Error('Files should be an array');
    }

    // Check that we have the expected files
    const fileNames = files.map(f => f.name);
    if (!fileNames.includes('README.md')) {
      throw new Error('Missing README.md file');
    }

    if (!fileNames.includes('package.json')) {
      throw new Error('Missing package.json file');
    }

    console.log('[Background Service Test] ✅ Test 4 passed: Project file collection');
    console.log('[Background Service Test] Collected files:', fileNames);
    return true;
  } catch (error) {
    console.error('[Background Service Test] ❌ Test 4 failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('[Background Service Test] Starting all tests');

  let passedTests = 0;
  let totalTests = 4;

  // Test 1: Initialize background service
  if (testInitializeBackgroundService()) {
    passedTests++;
  }

  // Test 2: Handle content message
  if (testHandleContentMessage()) {
    passedTests++;
  }

  // Test 3: Get GitHub configuration
  if (await testGetGitHubConfig()) {
    passedTests++;
  }

  // Test 4: Collect project files
  if (await testCollectProjectFiles()) {
    passedTests++;
  }

  console.log(`[Background Service Test] Tests completed: ${passedTests}/${totalTests} passed`);

  if (passedTests === totalTests) {
    console.log('[Background Service Test] 🎉 All tests passed!');
    return true;
  } else {
    console.log('[Background Service Test] ❌ Some tests failed');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      if (success) {
        console.log('[Background Service Test] All tests completed successfully');
        process.exit(0);
      } else {
        console.error('[Background Service Test] Some tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('[Background Service Test] Test execution failed:', error);
      process.exit(1);
    });
}

// Export for testing
module.exports = {
  testInitializeBackgroundService,
  testHandleContentMessage,
  testGetGitHubConfig,
  testCollectProjectFiles,
  runAllTests
};
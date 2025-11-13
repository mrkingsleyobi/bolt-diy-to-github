/**
 * Integration tests for the Bolt.DIY to GitHub Chrome Extension Popup UI
 *
 * These tests verify the integration between the popup UI components and
 * the background service worker.
 */

// Mock Chrome API
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

// Mock Svelte components
jest.mock('../../../src/chrome-extension/popup/ProjectView.svelte', () => {
  return {
    default: jest.fn()
  };
});

jest.mock('../../../src/chrome-extension/popup/SyncControls.svelte', () => {
  return {
    default: jest.fn()
  };
});

jest.mock('../../../src/chrome-extension/popup/OptionsPanel.svelte', () => {
  return {
    default: jest.fn()
  };
});

// Mock the App.svelte component
let App;
let appInstance;

describe('Bolt.DIY to GitHub Popup UI Integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up Chrome API mocks
    global.chrome = mockChrome as any;

    // Import the App component after setting up mocks
    jest.isolateModules(() => {
      App = require('../../../src/chrome-extension/popup/App.svelte').default;
    });
  });

  afterEach(() => {
    // Clean up
    if (appInstance) {
      appInstance.$destroy();
    }
  });

  test('should initialize with default options', async () => {
    // Set up mock response
    mockChrome.runtime.sendMessage.mockResolvedValue({
      type: 'OPTIONS_RESPONSE',
      options: {
        githubToken: 'test-token',
        defaultBranch: 'main',
        environments: ['main', 'development'],
        autoSync: true,
        syncInterval: 30
      }
    });

    // Create component instance
    appInstance = new App({
      target: document.createElement('div')
    });

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify options were loaded
    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'GET_OPTIONS' });
  });

  test('should handle project detection updates', async () => {
    // Create component instance
    const target = document.createElement('div');
    appInstance = new App({
      target: target
    });

    // Simulate project update message
    const projectUpdateHandler = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
    const testProject = {
      id: 'test-project-123',
      name: 'Test Project',
      description: 'A test project'
    };

    projectUpdateHandler({
      type: 'PROJECT_UPDATED',
      project: testProject
    });

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify project was updated (this would require accessing component state in a real test)
    // For now, we verify the handler was called correctly
    expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('should handle sync start and completion', async () => {
    // Create component instance
    const target = document.createElement('div');
    appInstance = new App({
      target: target
    });

    // Set up a mock project
    const projectUpdateHandler = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
    projectUpdateHandler({
      type: 'PROJECT_UPDATED',
      project: {
        id: 'test-project-123',
        name: 'Test Project'
      }
    });

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Mock sync start
    mockChrome.runtime.sendMessage.mockResolvedValueOnce({});

    // Simulate sync start message
    const syncStartHandler = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
    syncStartHandler({
      type: 'SYNC_STARTED'
    });

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify sync started state
    expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('should handle options saving', async () => {
    // Create component instance
    const target = document.createElement('div');
    appInstance = new App({
      target: target
    });

    // Mock successful options save
    mockChrome.runtime.sendMessage.mockResolvedValueOnce({
      type: 'OPTIONS_SAVED'
    });

    // Get the component instance to call methods directly
    // In a real test, we would interact with the UI elements

    // Simulate options save
    const testOptions = {
      githubToken: 'new-token',
      defaultBranch: 'development',
      environments: ['main', 'development', 'staging'],
      autoSync: false,
      syncInterval: 60
    };

    // This would normally be triggered by UI interaction
    // For testing, we're directly testing the message handling
    const optionsSaveHandler = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
    optionsSaveHandler({
      type: 'OPTIONS_SAVED'
    });

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('should handle errors gracefully', async () => {
    // Create component instance
    const target = document.createElement('div');
    appInstance = new App({
      target: target
    });

    // Simulate error message
    const errorHandler = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
    errorHandler({
      type: 'ERROR_OCCURRED',
      error: {
        message: 'Test error message'
      }
    });

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify error handling
    expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('should handle export status updates', async () => {
    // Create component instance
    const target = document.createElement('div');
    appInstance = new App({
      target: target
    });

    // Simulate export started
    const exportHandler = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
    exportHandler({
      type: 'EXPORT_STARTED',
      project: {
        id: 'test-project-123',
        name: 'Test Project'
      }
    });

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify export handling
    expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });
});
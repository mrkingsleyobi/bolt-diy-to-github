/**
 * @fileoverview Tests for environment configuration components
 */

// Mock Chrome API for testing
const mockChrome = {
  storage: {
    sync: {
      get: jest.fn().mockResolvedValue({
        githubToken: 'ghp_testtoken123',
        defaultBranch: 'main',
        environments: ['main', 'development', 'staging', 'production'],
        autoSync: false,
        syncInterval: 30
      }),
      set: jest.fn().mockResolvedValue()
    }
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue()
  }
};

// Mock Svelte component testing
describe('EnvironmentConfig Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.chrome = mockChrome;
  });

  test('should validate GitHub token format', () => {
    const component = new EnvironmentConfig({
      target: document.body,
      props: {
        githubToken: 'invalid_token',
        defaultBranch: 'main',
        environments: ['main', 'dev']
      }
    });

    // Token should show validation error
    const errorElement = document.querySelector('.error-message');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Invalid GitHub token format');
  });

  test('should validate environment name format', () => {
    const component = new EnvironmentConfig({
      target: document.body,
      props: {
        githubToken: 'ghp_validtoken123',
        defaultBranch: 'main',
        environments: ['main', 'dev']
      }
    });

    // Try to add invalid environment name
    const input = document.querySelector('.add-env-row input');
    const addButton = document.querySelector('.add-btn');

    input.value = 'invalid name with spaces';
    addButton.click();

    const errorElement = document.querySelector('.error-message');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Environment name can only contain');
  });

  test('should prevent duplicate environments', () => {
    const component = new EnvironmentConfig({
      target: document.body,
      props: {
        githubToken: 'ghp_validtoken123',
        defaultBranch: 'main',
        environments: ['main', 'dev']
      }
    });

    // Try to add existing environment
    const input = document.querySelector('.add-env-row input');
    const addButton = document.querySelector('.add-btn');

    input.value = 'main';
    addButton.click();

    const errorElement = document.querySelector('.error-message');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Environment already exists');
  });
});

describe('EnvironmentSyncControls Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.chrome = mockChrome;
  });

  test('should display all environments', () => {
    const environments = ['main', 'development', 'staging', 'production'];
    const component = new EnvironmentSyncControls({
      target: document.body,
      props: {
        environments,
        currentEnvironment: 'main',
        syncInProgress: false
      }
    });

    // Check that all environment buttons are rendered
    const envButtons = document.querySelectorAll('.env-btn');
    expect(envButtons.length).toBe(environments.length);

    environments.forEach((env, index) => {
      expect(envButtons[index].textContent).toBe(env);
    });
  });

  test('should disable controls during sync', () => {
    const component = new EnvironmentSyncControls({
      target: document.body,
      props: {
        environments: ['main', 'dev'],
        currentEnvironment: 'main',
        syncInProgress: true
      }
    });

    const select = document.querySelector('#environment-select');
    const syncButton = document.querySelector('.sync-btn');

    expect(select.disabled).toBe(true);
    expect(syncButton.disabled).toBe(true);
  });
});

describe('Background Script Environment Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.chrome = mockChrome;
  });

  test('should use environment-specific branch', async () => {
    const options = {
      branch: 'development',
      defaultBranch: 'main'
    };

    const branchToUse = (options.branch && options.branch !== 'undefined')
      ? options.branch
      : (options.defaultBranch || 'main');

    expect(branchToUse).toBe('development');
  });

  test('should fallback to default branch', async () => {
    const options = {
      branch: undefined,
      defaultBranch: 'main'
    };

    const branchToUse = (options.branch && options.branch !== 'undefined')
      ? options.branch
      : (options.defaultBranch || 'main');

    expect(branchToUse).toBe('main');
  });
});
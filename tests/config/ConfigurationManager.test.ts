// ConfigurationManager.test.ts - Tests for Configuration Manager
// Phase 4: Environment Configuration Management - Task 14: Write Configuration Manager Tests

import {
  BasicConfigurationManager
} from '../../src/config/BasicConfigurationManager';
import {
  FileConfigurationProvider
} from '../../src/config/providers/FileConfigurationProvider';
import {
  EnvironmentConfigurationProvider
} from '../../src/config/providers/EnvironmentConfigurationProvider';
import { PayloadEncryptionService } from '../../src/security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../../src/security/MessageAuthenticationService';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock the security services
const mockEncryptionService = {
  encrypt: jest.fn().mockImplementation(async (data: string) => `encrypted:${data}`),
  decrypt: jest.fn().mockImplementation(async (data: string) => data.replace('encrypted:', ''))
} as unknown as PayloadEncryptionService;

const mockAuthenticationService = {
  authenticateMessage: jest.fn().mockImplementation(async (data: string) => `signature:${data}`),
  verifyMessage: jest.fn().mockImplementation(async (data: string, signature: string) => true)
} as unknown as MessageAuthenticationService;

describe('BasicConfigurationManager', () => {
  let configManager: BasicConfigurationManager;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-test-'));

    configManager = new BasicConfigurationManager(
      mockEncryptionService,
      mockAuthenticationService
    );
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize with default options', async () => {
      await configManager.initialize({});

      const status = configManager.getStatus();
      expect(status.loaded).toBe(true);
      expect(status.sources).toEqual([]);
    });

    it('should initialize with custom options', async () => {
      const options = {
        environment: 'testing',
        enableCache: false,
        enableHotReload: true
      };

      await configManager.initialize(options);

      const status = configManager.getStatus();
      expect(status.loaded).toBe(true);
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      // Create a temporary config file
      const configPath = path.join(tempDir, 'test-config.json');
      const configData = {
        app: {
          name: 'TestApp',
          version: '1.0.0'
        },
        database: {
          host: 'localhost',
          port: 5432
        }
      };

      await fs.writeFile(configPath, JSON.stringify(configData, null, 2));

      // Set up file provider
      const provider = new FileConfigurationProvider('test-config', configPath);
      (configManager as any).providers = [provider];
      await configManager.load();
    });

    it('should get configuration values', () => {
      const appName = configManager.get('app.name');
      expect(appName).toBe('TestApp');

      const dbPort = configManager.get('database.port');
      expect(dbPort).toBe(5432);
    });

    it('should return default values for missing keys', () => {
      const defaultValue = configManager.get('missing.key', 'default');
      expect(defaultValue).toBe('default');
    });

    it('should use cache when enabled', async () => {
      // Initialize with caching enabled
      await configManager.initialize({ enableCache: true });

      // Create a temporary config file
      const configPath = path.join(tempDir, 'test-config.json');
      const configData = { test: 'value' };
      await fs.writeFile(configPath, JSON.stringify(configData, null, 2));

      const provider = new FileConfigurationProvider('test-config', configPath);
      (configManager as any).providers = [provider];
      await configManager.load();

      // Get value twice to test caching
      const value1 = configManager.get('test');
      const value2 = configManager.get('test');

      expect(value1).toBe('value');
      expect(value2).toBe('value');

      const status = configManager.getStatus();
      expect(status.cache.hits).toBeGreaterThan(0);
    });
  });

  describe('set', () => {
    it('should set configuration values', async () => {
      await configManager.initialize({});

      configManager.set('new.key', 'new-value');
      const value = configManager.get('new.key');
      expect(value).toBe('new-value');
    });

    it('should update nested configuration values', async () => {
      await configManager.initialize({});

      configManager.set('nested.object.value', 'nested-value');
      const value = configManager.get('nested.object.value');
      expect(value).toBe('nested-value');
    });

    it('should notify listeners of changes', async () => {
      await configManager.initialize({});

      const listener = jest.fn();
      configManager.onChange(listener);

      configManager.set('test.key', 'test-value');

      expect(listener).toHaveBeenCalledWith({
        keys: ['test.key'],
        timestamp: expect.any(Number),
        source: 'direct-set'
      });
    });
  });

  describe('load', () => {
    it('should load configuration from file provider', async () => {
      // Create a temporary config file
      const configPath = path.join(tempDir, 'test-config.json');
      const configData = { test: 'value' };
      await fs.writeFile(configPath, JSON.stringify(configData, null, 2));

      const provider = new FileConfigurationProvider('test-config', configPath);
      (configManager as any).providers = [provider];

      await configManager.load();

      const value = configManager.get('test');
      expect(value).toBe('value');
    });

    it('should load configuration from environment provider', async () => {
      // Set environment variable
      process.env.TEST_KEY = 'env-value';

      const provider = new EnvironmentConfigurationProvider('test-env', 'TEST_');
      (configManager as any).providers = [provider];

      await configManager.load();

      const value = configManager.get('key');
      expect(value).toBe('env-value');

      // Clean up
      delete process.env.TEST_KEY;
    });

    it('should merge configurations from multiple providers', async () => {
      // Create config files
      const config1Path = path.join(tempDir, 'config1.json');
      const config2Path = path.join(tempDir, 'config2.json');

      await fs.writeFile(config1Path, JSON.stringify({ a: 1, b: 2 }, null, 2));
      await fs.writeFile(config2Path, JSON.stringify({ b: 3, c: 4 }, null, 2));

      const provider1 = new FileConfigurationProvider('config1', config1Path);
      const provider2 = new FileConfigurationProvider('config2', config2Path);

      (configManager as any).providers = [provider1, provider2];
      await configManager.load();

      // Second provider should override first
      expect(configManager.get('a')).toBe(1);
      expect(configManager.get('b')).toBe(3);
      expect(configManager.get('c')).toBe(4);
    });
  });

  describe('reload', () => {
    it('should reload configuration and notify listeners', async () => {
      await configManager.initialize({});

      const listener = jest.fn();
      configManager.onChange(listener);

      await configManager.reload();

      expect(listener).toHaveBeenCalledWith({
        keys: ['*'],
        timestamp: expect.any(Number),
        source: 'reload'
      });
    });
  });

  describe('validate', () => {
    it('should validate configuration', async () => {
      await configManager.initialize({ environment: 'development' });

      const result = configManager.validate();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('getStatus', () => {
    it('should return configuration status', async () => {
      await configManager.initialize({});

      const status = configManager.getStatus();
      expect(status).toHaveProperty('loaded');
      expect(status).toHaveProperty('lastLoad');
      expect(status).toHaveProperty('sources');
      expect(status).toHaveProperty('cache');
      expect(status).toHaveProperty('errorCount');
    });
  });
});
// ConfigurationProvider.test.ts - Tests for Configuration Providers
// Phase 4: Environment Configuration Management - Task 16: Write Configuration Provider Tests

import {
  FileConfigurationProvider,
  EnvironmentConfigurationProvider,
  SecureStorageConfigurationProvider,
  RemoteConfigurationProvider
} from '../../src/config';
import { PayloadEncryptionService } from '../../src/security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../../src/security/MessageAuthenticationService';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';

// Mock the security services
const mockEncryptionService = {
  encrypt: jest.fn().mockImplementation(async (data: string) => `encrypted:${data}`),
  decrypt: jest.fn().mockImplementation(async (data: string) => data.replace('encrypted:', ''))
} as unknown as PayloadEncryptionService;

const mockAuthenticationService = {
  authenticateMessage: jest.fn().mockImplementation(async (data: string) => `signature:${data}`),
  verifyMessage: jest.fn().mockImplementation(async (data: string, signature: string) => true)
} as unknown as MessageAuthenticationService;

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Configuration Providers', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-provider-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('FileConfigurationProvider', () => {
    it('should load configuration from JSON file', async () => {
      const configPath = path.join(tempDir, 'test-config.json');
      const configData = { test: 'value', nested: { key: 'nested-value' } };
      await fs.writeFile(configPath, JSON.stringify(configData, null, 2));

      const provider = new FileConfigurationProvider('test-config', configPath);
      const config = await provider.load();

      expect(config).toEqual(configData);
    });

    it('should load configuration from YAML file', async () => {
      const configPath = path.join(tempDir, 'test-config.yaml');
      const configData = 'test: value\nnested:\n  key: nested-value\n';
      await fs.writeFile(configPath, configData);

      const provider = new FileConfigurationProvider('test-config', configPath, 'yaml');
      const config = await provider.load();

      expect(config).toEqual({ test: 'value', nested: { key: 'nested-value' } });
    });

    it('should save configuration to file', async () => {
      const configPath = path.join(tempDir, 'test-config.json');
      const configData = { test: 'value' };

      const provider = new FileConfigurationProvider('test-config', configPath);
      await provider.save(configData);

      const savedData = await fs.readFile(configPath, 'utf8');
      expect(JSON.parse(savedData)).toEqual(configData);
    });

    it('should check if file is available', async () => {
      const configPath = path.join(tempDir, 'test-config.json');
      const provider = new FileConfigurationProvider('test-config', configPath);

      // File doesn't exist yet
      expect(await provider.isAvailable()).toBe(false);

      // Create file
      await fs.writeFile(configPath, '{}');
      expect(await provider.isAvailable()).toBe(true);
    });

    it('should handle missing files gracefully', async () => {
      const configPath = path.join(tempDir, 'missing-config.json');
      const provider = new FileConfigurationProvider('missing-config', configPath);

      const config = await provider.load();
      expect(config).toEqual({});
    });
  });

  describe('EnvironmentConfigurationProvider', () => {
    beforeEach(() => {
      // Set test environment variables
      process.env.TEST_KEY = 'value';
      process.env.TEST_NESTED_KEY = 'nested-value';
      process.env.TEST_NUMBER = '42';
      process.env.TEST_BOOLEAN = 'true';
    });

    afterEach(() => {
      // Clean up environment variables
      delete process.env.TEST_KEY;
      delete process.env.TEST_NESTED_KEY;
      delete process.env.TEST_NUMBER;
      delete process.env.TEST_BOOLEAN;
    });

    it('should load configuration from environment variables', async () => {
      const provider = new EnvironmentConfigurationProvider('test-env', 'TEST_');
      const config = await provider.load();

      expect(config).toEqual({
        key: 'value',
        nested: {
          key: 'nested-value'
        },
        number: 42,
        boolean: true
      });
    });

    it('should handle prefixed environment variables', async () => {
      process.env.MYAPP_DATABASE_HOST = 'localhost';
      process.env.MYAPP_DATABASE_PORT = '5432';

      const provider = new EnvironmentConfigurationProvider('test-env', 'MYAPP_');
      const config = await provider.load();

      expect(config).toEqual({
        database: {
          host: 'localhost',
          port: 5432
        }
      });

      // Clean up
      delete process.env.MYAPP_DATABASE_HOST;
      delete process.env.MYAPP_DATABASE_PORT;
    });

    it('should always be available', async () => {
      const provider = new EnvironmentConfigurationProvider('test-env');
      expect(await provider.isAvailable()).toBe(true);
    });

    it('should not support saving', async () => {
      const provider = new EnvironmentConfigurationProvider('test-env');
      await expect(provider.save({})).rejects.toThrow('Saving to environment variables is not supported');
    });
  });

  describe('SecureStorageConfigurationProvider', () => {
    it('should load configuration from secure storage', async () => {
      const provider = new SecureStorageConfigurationProvider(
        'test-secure',
        'test-namespace',
        mockEncryptionService,
        mockAuthenticationService
      );

      // Mock storage
      (provider as any).storage.set('test-namespace:config', {
        data: 'encrypted:{"test":"value"}',
        timestamp: Date.now()
      });

      const config = await provider.load();
      expect(config).toEqual({ test: 'value' });
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted:{"test":"value"}');
    });

    it('should save configuration to secure storage', async () => {
      const provider = new SecureStorageConfigurationProvider(
        'test-secure',
        'test-namespace',
        mockEncryptionService,
        mockAuthenticationService
      );

      const config = { test: 'value' };
      await provider.save(config);

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('{"test":"value"}');
      expect(mockAuthenticationService.authenticateMessage).toHaveBeenCalledWith(
        'encrypted:{"test":"value"}'
      );

      // Check that data was stored
      expect((provider as any).storage.size).toBe(1);
    });

    it('should check if secure storage is available', async () => {
      const provider = new SecureStorageConfigurationProvider(
        'test-secure',
        'test-namespace',
        mockEncryptionService,
        mockAuthenticationService
      );

      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(true);
    });
  });

  describe('RemoteConfigurationProvider', () => {
    it('should load configuration from remote source', async () => {
      const configData = { test: 'value' };
      mockedAxios.mockResolvedValue({ data: configData, status: 200 });

      const provider = new RemoteConfigurationProvider(
        'test-remote',
        'https://config.example.com/test'
      );

      const config = await provider.load();
      expect(config).toEqual(configData);
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://config.example.com/test',
        headers: {},
        timeout: 10000
      });
    });

    it('should save configuration to remote source', async () => {
      mockedAxios.mockResolvedValue({ data: {}, status: 200 });

      const provider = new RemoteConfigurationProvider(
        'test-remote',
        'https://config.example.com/test'
      );

      const config = { test: 'value' };
      await provider.save(config);

      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://config.example.com/test',
        headers: {
          'Content-Type': 'application/json'
        },
        data: config,
        timeout: 10000
      });
    });

    it('should check if remote source is available', async () => {
      mockedAxios.mockResolvedValue({ status: 200 });

      const provider = new RemoteConfigurationProvider(
        'test-remote',
        'https://config.example.com/test'
      );

      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      mockedAxios.mockRejectedValue(new Error('Network error'));

      const provider = new RemoteConfigurationProvider(
        'test-remote',
        'https://config.example.com/test'
      );

      await expect(provider.load()).rejects.toThrow('Failed to load remote configuration: Network error');
    });

    it('should use cache when available', async () => {
      const configData = { test: 'value' };
      mockedAxios.mockResolvedValue({ data: configData, status: 200 });

      const provider = new RemoteConfigurationProvider(
        'test-remote',
        'https://config.example.com/test',
        {},
        10000,
        5000 // 5 second cache
      );

      // First call should hit the network
      const config1 = await provider.load();
      expect(mockedAxios).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const config2 = await provider.load();
      expect(mockedAxios).toHaveBeenCalledTimes(1); // Still only called once
      expect(config1).toEqual(config2);
    });
  });
});
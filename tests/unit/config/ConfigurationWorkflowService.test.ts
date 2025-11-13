// ConfigurationWorkflowService.test.ts - Unit tests for ConfigurationWorkflowService
// Phase 4: Environment Configuration Management - Task 7: Implement configuration retrieval test scenarios with security validation

import { ConfigurationWorkflowService, ConfigurationWorkflowOptions } from '../../src/config/ConfigurationWorkflowService';
import { EnvironmentConfigurationService } from '../../src/config/EnvironmentConfigurationService';
import { EncryptedConfigStore } from '../../src/config/EncryptedConfigStore';
import { ConfigValidatorImpl } from '../../src/config/ConfigValidator';
import { PayloadEncryptionService } from '../../src/security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../../src/security/MessageAuthenticationService';
import { TokenEncryptionService } from '../../src/security/TokenEncryptionService';
import { GitHubPATAuthService } from '../../src/services/GitHubPATAuthService';
import { GitHubAppAuthService } from '../../src/services/GitHubAppAuthService';

// Mock the dependencies
jest.mock('../../src/config/EnvironmentConfigurationService');
jest.mock('../../src/config/EncryptedConfigStore');
jest.mock('../../src/config/ConfigValidator');
jest.mock('../../src/security/PayloadEncryptionService');
jest.mock('../../src/security/MessageAuthenticationService');
jest.mock('../../src/security/TokenEncryptionService');
jest.mock('../../src/services/GitHubPATAuthService');
jest.mock('../../src/services/GitHubAppAuthService');

describe('ConfigurationWorkflowService', () => {
  let workflowService: ConfigurationWorkflowService;
  let mockEnvironmentConfigService: jest.Mocked<EnvironmentConfigurationService>;
  let mockEncryptedConfigStore: jest.Mocked<EncryptedConfigStore>;
  let mockConfigValidator: jest.Mocked<ConfigValidatorImpl>;
  let mockPayloadEncryptionService: jest.Mocked<PayloadEncryptionService>;
  let mockMessageAuthenticationService: jest.Mocked<MessageAuthenticationService>;
  let mockTokenEncryptionService: jest.Mocked<TokenEncryptionService>;
  let mockGitHubPatAuthService: jest.Mocked<GitHubPATAuthService>;
  let mockGitHubAppAuthService: jest.Mocked<GitHubAppAuthService>;

  const workflowOptions: ConfigurationWorkflowOptions = {
    storagePath: '/test/storage',
    encryptionPassword: 'test-password',
    validateOnLoad: true,
    validateOnSave: true,
    encryptTokens: true
  };

  beforeEach(() => {
    // Create mock instances
    mockEnvironmentConfigService = new EnvironmentConfigurationService(
      new PayloadEncryptionService(),
      new MessageAuthenticationService(),
      new TokenEncryptionService(),
      'test-password',
      new GitHubPATAuthService(),
      new GitHubAppAuthService('test-client-id', 'test-client-secret')
    ) as jest.Mocked<EnvironmentConfigurationService>;

    mockEncryptedConfigStore = new EncryptedConfigStore(
      '/test/storage',
      new PayloadEncryptionService(),
      new MessageAuthenticationService(),
      'test-password'
    ) as jest.Mocked<EncryptedConfigStore>;

    mockConfigValidator = new ConfigValidatorImpl() as jest.Mocked<ConfigValidatorImpl>;
    mockPayloadEncryptionService = new PayloadEncryptionService() as jest.Mocked<PayloadEncryptionService>;
    mockMessageAuthenticationService = new MessageAuthenticationService() as jest.Mocked<MessageAuthenticationService>;
    mockTokenEncryptionService = new TokenEncryptionService() as jest.Mocked<TokenEncryptionService>;
    mockGitHubPatAuthService = new GitHubPATAuthService() as jest.Mocked<GitHubPATAuthService>;
    mockGitHubAppAuthService = new GitHubAppAuthService('test-client-id', 'test-client-secret') as jest.Mocked<GitHubAppAuthService>;

    // Mock the constructors to return our mocks
    (EnvironmentConfigurationService as jest.Mock).mockImplementation(() => mockEnvironmentConfigService);
    (EncryptedConfigStore as jest.Mock).mockImplementation(() => mockEncryptedConfigStore);
    (ConfigValidatorImpl as jest.Mock).mockImplementation(() => mockConfigValidator);

    // Create the service instance
    workflowService = new ConfigurationWorkflowService(
      workflowOptions,
      mockPayloadEncryptionService,
      mockMessageAuthenticationService,
      mockTokenEncryptionService,
      mockGitHubPatAuthService,
      mockGitHubAppAuthService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadConfiguration', () => {
    it('should load configuration from secure storage when available', async () => {
      const environment = 'development';
      const configKey = 'dev-config';
      const storedConfig = {
        environment: 'development',
        github: {
          repository: 'test-repo',
          owner: 'test-owner'
        }
      };

      // Mock the encrypted config store to return a config
      mockEncryptedConfigStore.load.mockResolvedValue(storedConfig);

      // Mock the config validator
      mockConfigValidator.createDefaultSchema.mockReturnValue({
        properties: {},
        required: []
      });
      mockConfigValidator.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: []
      });

      const result = await workflowService.loadConfiguration(environment, configKey);

      expect(result.success).toBe(true);
      expect(result.config).toEqual(storedConfig);
      expect(result.truthScore).toBe(0.95);
      expect(mockEncryptedConfigStore.load).toHaveBeenCalledWith(configKey);
    });

    it('should load configuration from environment service when not in storage', async () => {
      const environment = 'development';
      const configKey = 'dev-config';
      const envConfig = {
        environment: 'development',
        github: {
          repository: 'test-repo',
          owner: 'test-owner'
        },
        truthScore: 0.98,
        valid: true
      };

      // Mock the encrypted config store to return null (not found)
      mockEncryptedConfigStore.load.mockResolvedValue(null);

      // Mock the environment config service
      mockEnvironmentConfigService.getEnvironmentConfig.mockResolvedValue(envConfig);

      // Mock the config validator
      mockConfigValidator.createDefaultSchema.mockReturnValue({
        properties: {},
        required: []
      });
      mockConfigValidator.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: []
      });

      const result = await workflowService.loadConfiguration(environment, configKey);

      expect(result.success).toBe(true);
      expect(result.config).toEqual(envConfig);
      expect(result.truthScore).toBe(0.9);
      expect(mockEnvironmentConfigService.getEnvironmentConfig).toHaveBeenCalledWith(environment);
    });

    it('should handle validation errors during loading', async () => {
      const environment = 'development';
      const configKey = 'dev-config';
      const invalidConfig = {
        environment: 'invalid-env' // Invalid environment value
      };

      // Mock the encrypted config store to return an invalid config
      mockEncryptedConfigStore.load.mockResolvedValue(invalidConfig);

      // Mock the config validator to return validation errors
      mockConfigValidator.createDefaultSchema.mockReturnValue({
        properties: {
          environment: {
            type: 'string',
            constraints: {
              enum: ['development', 'testing', 'staging', 'production']
            }
          }
        },
        required: ['environment']
      });
      mockConfigValidator.validate.mockReturnValue({
        valid: false,
        errors: ["Property 'environment' must be one of: development, testing, staging, production"],
        warnings: []
      });

      const result = await workflowService.loadConfiguration(environment, configKey);

      expect(result.success).toBe(false);
      expect(result.config).toEqual(invalidConfig);
      expect(result.validation?.valid).toBe(false);
      expect(result.error).toBe('Configuration validation failed');
      expect(result.truthScore).toBe(0.75);
    });

    it('should handle load errors gracefully', async () => {
      const environment = 'development';
      const configKey = 'dev-config';

      // Mock the encrypted config store to throw an error
      mockEncryptedConfigStore.load.mockRejectedValue(new Error('Storage read error'));

      const result = await workflowService.loadConfiguration(environment, configKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load configuration: Storage read error');
      expect(result.truthScore).toBe(0.1);
    });
  });

  describe('saveConfiguration', () => {
    it('should save configuration with validation', async () => {
      const environment = 'development';
      const configKey = 'dev-config';
      const config = {
        environment: 'development',
        github: {
          repository: 'test-repo',
          owner: 'test-owner'
        }
      };

      // Mock the config validator
      mockConfigValidator.createDefaultSchema.mockReturnValue({
        properties: {},
        required: []
      });
      mockConfigValidator.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: []
      });

      // Mock the encrypted config store
      mockEncryptedConfigStore.save.mockResolvedValue(undefined);

      // Mock the environment config service
      mockEnvironmentConfigService.saveEnvironmentConfig.mockResolvedValue(undefined);

      const result = await workflowService.saveConfiguration(environment, configKey, config);

      expect(result.success).toBe(true);
      expect(result.config).toEqual(config);
      expect(result.truthScore).toBe(0.95);
      expect(mockEncryptedConfigStore.save).toHaveBeenCalledWith(configKey, config);
      expect(mockEnvironmentConfigService.saveEnvironmentConfig).toHaveBeenCalledWith(environment, config);
    });

    it('should handle validation errors during saving', async () => {
      const environment = 'development';
      const configKey = 'dev-config';
      const invalidConfig = {
        environment: 'invalid-env' // Invalid environment value
      };

      // Mock the config validator to return validation errors
      mockConfigValidator.createDefaultSchema.mockReturnValue({
        properties: {
          environment: {
            type: 'string',
            constraints: {
              enum: ['development', 'testing', 'staging', 'production']
            }
          }
        },
        required: ['environment']
      });
      mockConfigValidator.validate.mockReturnValue({
        valid: false,
        errors: ["Property 'environment' must be one of: development, testing, staging, production"],
        warnings: []
      });

      const result = await workflowService.saveConfiguration(environment, configKey, invalidConfig);

      expect(result.success).toBe(false);
      expect(result.config).toEqual(invalidConfig);
      expect(result.validation?.valid).toBe(false);
      expect(result.error).toBe('Configuration validation failed');
      expect(result.truthScore).toBe(0.75);
      // Should not have called save methods
      expect(mockEncryptedConfigStore.save).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const environment = 'development';
      const configKey = 'dev-config';
      const config = {
        environment: 'development'
      };

      // Mock the config validator
      mockConfigValidator.createDefaultSchema.mockReturnValue({
        properties: {},
        required: []
      });
      mockConfigValidator.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: []
      });

      // Mock the encrypted config store to throw an error
      mockEncryptedConfigStore.save.mockRejectedValue(new Error('Storage write error'));

      const result = await workflowService.saveConfiguration(environment, configKey, config);

      expect(result.success).toBe(false);
      expect(result.config).toEqual(config);
      expect(result.error).toBe('Failed to save configuration: Storage write error');
      expect(result.truthScore).toBe(0.1);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration successfully', async () => {
      const config = {
        environment: 'development'
      };

      // Mock the config validator
      mockConfigValidator.createDefaultSchema.mockReturnValue({
        properties: {
          environment: {
            type: 'string',
            constraints: {
              enum: ['development', 'testing', 'staging', 'production']
            }
          }
        },
        required: ['environment']
      });
      mockConfigValidator.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: []
      });

      const result = await workflowService.validateConfiguration(config);

      expect(result.success).toBe(true);
      expect(result.config).toEqual(config);
      expect(result.validation?.valid).toBe(true);
      expect(result.truthScore).toBe(0.95);
    });

    it('should handle validation errors', async () => {
      const config = {
        environment: 'invalid-env'
      };

      // Mock the config validator to return validation errors
      mockConfigValidator.createDefaultSchema.mockReturnValue({
        properties: {
          environment: {
            type: 'string',
            constraints: {
              enum: ['development', 'testing', 'staging', 'production']
            }
          }
        },
        required: ['environment']
      });
      mockConfigValidator.validate.mockReturnValue({
        valid: false,
        errors: ["Property 'environment' must be one of: development, testing, staging, production"],
        warnings: []
      });

      const result = await workflowService.validateConfiguration(config);

      expect(result.success).toBe(false);
      expect(result.config).toEqual(config);
      expect(result.validation?.valid).toBe(false);
      expect(result.error).toBe('Configuration validation failed');
      expect(result.truthScore).toBe(0.75);
    });
  });

  describe('listConfigurations', () => {
    it('should list configuration keys successfully', async () => {
      const configKeys = ['dev-config', 'prod-config'];

      // Mock the encrypted config store
      mockEncryptedConfigStore.list.mockResolvedValue(configKeys);

      const result = await workflowService.listConfigurations();

      expect(result).toEqual(configKeys);
      expect(mockEncryptedConfigStore.list).toHaveBeenCalled();
    });

    it('should handle list errors gracefully', async () => {
      // Mock the encrypted config store to throw an error
      mockEncryptedConfigStore.list.mockRejectedValue(new Error('Storage read error'));

      const result = await workflowService.listConfigurations();

      expect(result).toEqual([]);
    });
  });

  describe('deleteConfiguration', () => {
    it('should delete configuration successfully', async () => {
      const configKey = 'dev-config';

      // Mock the encrypted config store
      mockEncryptedConfigStore.delete.mockResolvedValue(undefined);

      const result = await workflowService.deleteConfiguration(configKey);

      expect(result.success).toBe(true);
      expect(result.truthScore).toBe(0.95);
      expect(mockEncryptedConfigStore.delete).toHaveBeenCalledWith(configKey);
    });

    it('should handle delete errors gracefully', async () => {
      const configKey = 'dev-config';

      // Mock the encrypted config store to throw an error
      mockEncryptedConfigStore.delete.mockRejectedValue(new Error('Storage delete error'));

      const result = await workflowService.deleteConfiguration(configKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete configuration: Storage delete error');
      expect(result.truthScore).toBe(0.1);
    });
  });

  describe('validateTokens', () => {
    it('should delegate token validation to environment config service', async () => {
      const tokens = {
        github: { token: 'encrypted-token', type: 'github-pat' }
      };

      const validationResults = {
        github: { valid: true }
      };

      mockEnvironmentConfigService.validateTokens.mockResolvedValue(validationResults);

      const result = await workflowService.validateTokens(tokens);

      expect(result).toEqual(validationResults);
      expect(mockEnvironmentConfigService.validateTokens).toHaveBeenCalledWith(tokens);
    });
  });

  describe('refreshTokens', () => {
    it('should delegate token refresh to environment config service', async () => {
      const tokens = {
        github: { refreshToken: 'encrypted-refresh-token', type: 'github-app' }
      };

      const refreshResults = {
        github: { success: true, token: 'new-encrypted-token' }
      };

      mockEnvironmentConfigService.refreshTokens.mockResolvedValue(refreshResults);

      const result = await workflowService.refreshTokens(tokens);

      expect(result).toEqual(refreshResults);
      expect(mockEnvironmentConfigService.refreshTokens).toHaveBeenCalledWith(tokens);
    });
  });
});
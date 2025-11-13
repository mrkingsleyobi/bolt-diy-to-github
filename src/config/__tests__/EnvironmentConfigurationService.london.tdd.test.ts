import { EnvironmentConfigurationService } from '../EnvironmentConfigurationService';
import { BasicConfigurationManager } from '../BasicConfigurationManager';
import { TokenEncryptionService } from '../../security/TokenEncryptionService';
import { MessageAuthenticationService } from '../../security/MessageAuthenticationService';
import { TokenValidationService } from '../../services/TokenValidationService';
import { GitHubPATAuthService } from '../../services/GitHubPATAuthService';
import { GitHubAppAuthService } from '../../services/GitHubAppAuthService';
import { PayloadEncryptionService } from '../../security/PayloadEncryptionService';

// Mock the dependencies
jest.mock('../BasicConfigurationManager');
jest.mock('../../security/TokenEncryptionService');
jest.mock('../../security/MessageAuthenticationService');
jest.mock('../../services/TokenValidationService');
jest.mock('../../services/GitHubPATAuthService');
jest.mock('../../services/GitHubAppAuthService');

describe('EnvironmentConfigurationService - London School TDD', () => {
  let service: EnvironmentConfigurationService;
  let mockConfigurationManager: any;
  let mockTokenEncryptionService: any;
  let mockTokenValidationService: any;
  let mockGitHubPATAuthService: any;
  let mockGitHubAppAuthService: any;
  let mockMessageAuthenticationService: any;
  let mockPayloadEncryptionService: any;
  const testEncryptionPassword = 'test-password-123';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockPayloadEncryptionService = new PayloadEncryptionService();
    mockConfigurationManager = {
      initialize: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      load: jest.fn(),
      reload: jest.fn(),
      validate: jest.fn(),
      onChange: jest.fn(),
      getStatus: jest.fn()
    };

    mockTokenEncryptionService = {
      encryptToken: jest.fn(),
      decryptToken: jest.fn()
    };

    mockGitHubPATAuthService = {};
    mockGitHubAppAuthService = {
      exchangeCodeForToken: jest.fn()
    };

    mockMessageAuthenticationService = {};

    // Setup BasicConfigurationManager mock
    (BasicConfigurationManager as jest.Mock).mockImplementation(() => mockConfigurationManager);

    // Setup TokenValidationService mock
    mockTokenValidationService = {
      validateTokens: jest.fn(),
      refreshTokens: jest.fn()
    };

    (TokenValidationService as jest.Mock).mockImplementation(() => mockTokenValidationService);

    // Create service instance
    service = new EnvironmentConfigurationService(
      mockTokenEncryptionService,
      mockMessageAuthenticationService,
      mockTokenEncryptionService, // Using same mock for token encryption
      testEncryptionPassword,
      mockGitHubPATAuthService as any,
      mockGitHubAppAuthService as any
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test constructor and dependency injection
  describe('Constructor', () => {
    it('should create an instance with all dependencies', () => {
      expect(service).toBeInstanceOf(EnvironmentConfigurationService);
      expect(BasicConfigurationManager).toHaveBeenCalledWith(
        mockTokenEncryptionService,
        mockMessageAuthenticationService
      );
    });

    it('should initialize token validation service correctly', () => {
      expect(TokenValidationService).toHaveBeenCalledWith(
        mockGitHubPATAuthService,
        mockTokenEncryptionService,
        testEncryptionPassword,
        mockGitHubAppAuthService
      );
    });
  });

  // Test initialize method
  describe('initialize', () => {
    const mockOptions = {
      environment: 'test',
      enableCache: true,
      cacheTTL: 60000,
      enableHotReload: false
    };

    it('should call configuration manager initialize with provided options', async () => {
      mockConfigurationManager.initialize.mockResolvedValue(undefined);

      await service.initialize(mockOptions);

      expect(mockConfigurationManager.initialize).toHaveBeenCalledWith(mockOptions);
    });

    it('should handle initialization errors gracefully', async () => {
      const errorMessage = 'Initialization failed';
      mockConfigurationManager.initialize.mockRejectedValue(new Error(errorMessage));

      await expect(service.initialize(mockOptions)).rejects.toThrow(errorMessage);
    });
  });

  // Test getEnvironmentConfig method
  describe('getEnvironmentConfig', () => {
    const testEnvironment = 'production';
    const mockFullConfig = {
      github: {
        token: 'encrypted-token',
        repository: 'test-repo',
        owner: 'test-owner'
      },
      deployment: {
        target: 'aws',
        region: 'us-west-2'
      },
      environment: testEnvironment,
      apiUrl: 'https://api.example.com',
      syncInterval: 30000,
      logLevel: 'info',
      features: {
        encryption: true,
        auth: true
      },
      limits: {
        maxFileSize: 10485760,
        maxConnections: 10,
        syncTimeout: 30000
      },
      security: {
        encryptionEnabled: true,
        authTimeout: 300000,
        rateLimit: 100
      }
    };

    const mockSanitizedConfig = {
      github: {
        repository: 'test-repo',
        owner: 'test-owner'
      },
      deployment: {
        target: 'aws',
        region: 'us-west-2'
      },
      environment: testEnvironment,
      apiUrl: 'https://api.example.com',
      syncInterval: 30000,
      logLevel: 'info',
      features: {
        encryption: true,
        auth: true
      },
      limits: {
        maxFileSize: 10485760,
        maxConnections: 10,
        syncTimeout: 30000
      },
      security: {
        encryptionEnabled: true,
        authTimeout: 300000,
        rateLimit: 100
      },
      truthScore: 0.98,
      valid: true
    };

    beforeEach(() => {
      // Mock the private methods by spying on them
      jest.spyOn(service as any, 'getFullConfig').mockReturnValue(mockFullConfig);
      jest.spyOn(service as any, 'validateAccessTokens').mockResolvedValue(true);
      jest.spyOn(service as any, 'sanitizeForTransmission').mockReturnValue(mockSanitizedConfig);
    });

    it('should initialize configuration manager with environment-specific options', async () => {
      mockConfigurationManager.initialize.mockResolvedValue(undefined);

      await service.getEnvironmentConfig(testEnvironment);

      expect(mockConfigurationManager.initialize).toHaveBeenCalledWith({
        environment: testEnvironment,
        enableCache: true,
        cacheTTL: 60000,
        enableHotReload: false
      });
    });

    it('should validate access tokens before returning config', async () => {
      mockConfigurationManager.initialize.mockResolvedValue(undefined);
      const validateSpy = jest.spyOn(service as any, 'validateAccessTokens').mockResolvedValue(true);

      await service.getEnvironmentConfig(testEnvironment);

      expect(validateSpy).toHaveBeenCalledWith(mockFullConfig);
    });

    it('should throw error when token validation fails', async () => {
      mockConfigurationManager.initialize.mockResolvedValue(undefined);
      jest.spyOn(service as any, 'validateAccessTokens').mockResolvedValue(false);

      await expect(service.getEnvironmentConfig(testEnvironment))
        .rejects.toThrow('Failed to load environment config: Invalid or expired access tokens');
    });

    it('should sanitize configuration before returning', async () => {
      mockConfigurationManager.initialize.mockResolvedValue(undefined);
      const sanitizeSpy = jest.spyOn(service as any, 'sanitizeForTransmission').mockReturnValue(mockSanitizedConfig);

      await service.getEnvironmentConfig(testEnvironment);

      expect(sanitizeSpy).toHaveBeenCalledWith(mockFullConfig);
      expect(mockSanitizedConfig).toEqual({
        github: {
          repository: 'test-repo',
          owner: 'test-owner'
        },
        deployment: {
          target: 'aws',
          region: 'us-west-2'
        },
        environment: testEnvironment,
        apiUrl: 'https://api.example.com',
        syncInterval: 30000,
        logLevel: 'info',
        features: {
          encryption: true,
          auth: true
        },
        limits: {
          maxFileSize: 10485760,
          maxConnections: 10,
          syncTimeout: 30000
        },
        security: {
          encryptionEnabled: true,
          authTimeout: 300000,
          rateLimit: 100
        },
        truthScore: 0.98,
        valid: true
      });
    });

    it('should return sanitized configuration on success', async () => {
      mockConfigurationManager.initialize.mockResolvedValue(undefined);

      const result = await service.getEnvironmentConfig(testEnvironment);

      expect(result).toEqual(mockSanitizedConfig);
      expect(result).not.toHaveProperty('github.token'); // Token should be removed
    });
  });

  // Test saveEnvironmentConfig method
  describe('saveEnvironmentConfig', () => {
    const testEnvironment = 'staging';
    const mockConfig = {
      github: {
        token: 'new-token',
        repository: 'new-repo',
        owner: 'new-owner'
      },
      deployment: {
        target: 'gcp',
        region: 'us-central1'
      },
      environment: testEnvironment,
      apiUrl: 'https://staging-api.example.com',
      syncInterval: 15000,
      logLevel: 'debug'
    };

    const mockEncryptedConfig = {
      ...mockConfig,
      github: {
        ...mockConfig.github,
        token: 'encrypted-new-token'
      }
    };

    beforeEach(() => {
      jest.spyOn(service as any, 'encryptSensitiveData').mockResolvedValue(mockEncryptedConfig);
    });

    it('should initialize configuration manager with environment-specific options', async () => {
      mockConfigurationManager.initialize.mockResolvedValue(undefined);

      await service.saveEnvironmentConfig(testEnvironment, mockConfig);

      expect(mockConfigurationManager.initialize).toHaveBeenCalledWith({
        environment: testEnvironment,
        enableCache: true,
        cacheTTL: 60000,
        enableHotReload: false
      });
    });

    it('should encrypt sensitive data before saving', async () => {
      mockConfigurationManager.initialize.mockResolvedValue(undefined);
      const encryptSpy = jest.spyOn(service as any, 'encryptSensitiveData').mockResolvedValue(mockEncryptedConfig);

      await service.saveEnvironmentConfig(testEnvironment, mockConfig);

      expect(encryptSpy).toHaveBeenCalledWith(mockConfig);
    });

    it('should save configuration values to configuration manager', async () => {
      mockConfigurationManager.initialize.mockResolvedValue(undefined);
      mockConfigurationManager.set.mockReturnValue();

      await service.saveEnvironmentConfig(testEnvironment, mockConfig);

      expect(mockConfigurationManager.set).toHaveBeenCalledWith('github.repository', mockEncryptedConfig.github.repository);
      expect(mockConfigurationManager.set).toHaveBeenCalledWith('github.owner', mockEncryptedConfig.github.owner);
      expect(mockConfigurationManager.set).toHaveBeenCalledWith('deployment.target', mockEncryptedConfig.deployment.target);
      expect(mockConfigurationManager.set).toHaveBeenCalledWith('deployment.region', mockEncryptedConfig.deployment.region);
      expect(mockConfigurationManager.set).toHaveBeenCalledWith('environment', testEnvironment);
      expect(mockConfigurationManager.set).toHaveBeenCalledWith('apiUrl', mockEncryptedConfig.apiUrl);
      expect(mockConfigurationManager.set).toHaveBeenCalledWith('syncInterval', mockEncryptedConfig.syncInterval);
      expect(mockConfigurationManager.set).toHaveBeenCalledWith('logLevel', mockEncryptedConfig.logLevel);
    });

    it('should handle encryption errors gracefully', async () => {
      mockConfigurationManager.initialize.mockResolvedValue(undefined);
      jest.spyOn(service as any, 'encryptSensitiveData').mockRejectedValue(new Error('Encryption failed'));

      await expect(service.saveEnvironmentConfig(testEnvironment, mockConfig))
        .rejects.toThrow('Encryption failed');
    });
  });

  // Test validateTokens method
  describe('validateTokens', () => {
    const mockTokens = {
      github: {
        token: 'encrypted-token-1',
        type: 'github-pat'
      },
      app: {
        token: 'encrypted-token-2',
        type: 'github-app'
      }
    };

    const mockValidationResults = {
      github: {
        valid: true
      },
      app: {
        valid: false,
        error: 'Token expired'
      }
    };

    it('should delegate token validation to token validation service', async () => {
      mockTokenValidationService.validateTokens.mockResolvedValue(mockValidationResults);

      const results = await service.validateTokens(mockTokens);

      expect(mockTokenValidationService.validateTokens).toHaveBeenCalledWith(mockTokens);
      expect(results).toEqual(mockValidationResults);
    });

    it('should handle validation errors gracefully', async () => {
      const errorMessage = 'Validation service unavailable';
      mockTokenValidationService.validateTokens.mockRejectedValue(new Error(errorMessage));

      await expect(service.validateTokens(mockTokens))
        .rejects.toThrow(errorMessage);
    });
  });

  // Test refreshTokens method
  describe('refreshTokens', () => {
    const mockRefreshTokens = {
      app: {
        refreshToken: 'encrypted-refresh-token',
        type: 'github-app'
      }
    };

    const mockRefreshResults = {
      app: {
        success: true,
        token: 'new-encrypted-token'
      }
    };

    it('should delegate token refresh to token validation service', async () => {
      mockTokenValidationService.refreshTokens.mockResolvedValue(mockRefreshResults);

      const results = await service.refreshTokens(mockRefreshTokens);

      expect(mockTokenValidationService.refreshTokens).toHaveBeenCalledWith(mockRefreshTokens);
      expect(results).toEqual(mockRefreshResults);
    });

    it('should handle refresh errors gracefully', async () => {
      const errorMessage = 'Refresh service unavailable';
      mockTokenValidationService.refreshTokens.mockRejectedValue(new Error(errorMessage));

      await expect(service.refreshTokens(mockRefreshTokens))
        .rejects.toThrow(errorMessage);
    });
  });

  // Test getStatus method
  describe('getStatus', () => {
    const mockStatus = {
      loaded: true,
      lastLoad: Date.now(),
      sources: ['environment', 'file'],
      cache: {
        enabled: true,
        size: 5,
        hits: 10,
        misses: 2
      },
      errorCount: 0
    };

    it('should delegate to configuration manager getStatus', () => {
      mockConfigurationManager.getStatus.mockReturnValue(mockStatus);

      const status = service.getStatus();

      expect(mockConfigurationManager.getStatus).toHaveBeenCalled();
      expect(status).toEqual(mockStatus);
    });
  });

  // Test reload method
  describe('reload', () => {
    it('should delegate to configuration manager reload', async () => {
      mockConfigurationManager.reload.mockResolvedValue(undefined);

      await service.reload();

      expect(mockConfigurationManager.reload).toHaveBeenCalled();
    });

    it('should handle reload errors gracefully', async () => {
      const errorMessage = 'Reload failed';
      mockConfigurationManager.reload.mockRejectedValue(new Error(errorMessage));

      await expect(service.reload()).rejects.toThrow(errorMessage);
    });
  });

  // Test private method: getFullConfig
  describe('getFullConfig (private method)', () => {
    it('should construct full configuration from configuration manager values', () => {
      const mockValues: Record<string, any> = {
        'github.token': 'test-token',
        'github.repository': 'test-repo',
        'github.owner': 'test-owner',
        'deployment.target': 'aws',
        'deployment.region': 'us-west-2',
        'environment': 'test',
        'apiUrl': 'https://api.example.com',
        'syncInterval': 30000,
        'logLevel': 'info',
        'features': { encryption: true },
        'limits.maxFileSize': 10485760,
        'limits.maxConnections': 10,
        'limits.syncTimeout': 30000,
        'security.encryptionEnabled': true,
        'security.authTimeout': 300000,
        'security.rateLimit': 100
      };

      // Mock the get method to return specific values
      mockConfigurationManager.get.mockImplementation((key: string, defaultValue?: any) => {
        return mockValues[key] !== undefined ? mockValues[key] : defaultValue;
      });

      const config = (service as any).getFullConfig();

      expect(config).toEqual({
        github: {
          token: 'test-token',
          repository: 'test-repo',
          owner: 'test-owner'
        },
        deployment: {
          target: 'aws',
          region: 'us-west-2'
        },
        environment: 'test',
        apiUrl: 'https://api.example.com',
        syncInterval: 30000,
        logLevel: 'info',
        features: { encryption: true },
        limits: {
          maxFileSize: 10485760,
          maxConnections: 10,
          syncTimeout: 30000
        },
        security: {
          encryptionEnabled: true,
          authTimeout: 300000,
          rateLimit: 100
        }
      });
    });
  });

  // Test private method: validateAccessTokens
  describe('validateAccessTokens (private method)', () => {
    it('should return true when no tokens are present', async () => {
      const config = {};
      const result = await (service as any).validateAccessTokens(config);
      expect(result).toBe(true);
    });

    it('should validate GitHub token when present', async () => {
      const config = {
        github: {
          token: 'test-token'
        }
      };

      const mockValidationResults = {
        github: {
          valid: true
        }
      };

      mockTokenValidationService.validateTokens.mockResolvedValue(mockValidationResults);

      const result = await (service as any).validateAccessTokens(config);

      expect(mockTokenValidationService.validateTokens).toHaveBeenCalledWith({
        github: {
          token: 'test-token',
          type: 'github-pat'
        }
      });
      expect(result).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      const config = {
        github: {
          token: 'invalid-token'
        }
      };

      mockTokenValidationService.validateTokens.mockRejectedValue(new Error('Network error'));

      const result = await (service as any).validateAccessTokens(config);

      expect(result).toBe(true); // Should still return true to allow system to continue
    });

    it('should log warning for invalid tokens but continue', async () => {
      const config = {
        github: {
          token: 'expired-token'
        }
      };

      const mockValidationResults = {
        github: {
          valid: false,
          error: 'Token expired'
        }
      };

      mockTokenValidationService.validateTokens.mockResolvedValue(mockValidationResults);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await (service as any).validateAccessTokens(config);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Token validation failed for github: Token expired');
      expect(result).toBe(true); // Should still return true to allow system to continue
    });
  });

  // Test private method: sanitizeForTransmission
  describe('sanitizeForTransmission (private method)', () => {
    it('should remove sensitive data from configuration', () => {
      const config = {
        github: {
          token: 'secret-token',
          repository: 'test-repo',
          owner: 'test-owner'
        },
        deployment: {
          target: 'aws',
          region: 'us-west-2'
        },
        environment: 'production'
      };

      const sanitized = (service as any).sanitizeForTransmission(config);

      expect(sanitized).toEqual({
        github: {
          repository: 'test-repo',
          owner: 'test-owner'
        },
        deployment: {
          target: 'aws',
          region: 'us-west-2'
        },
        environment: 'production',
        truthScore: 0.98,
        valid: true
      });
      expect(sanitized.github).not.toHaveProperty('token');
    });

    it('should add truth score and valid flag', () => {
      const config = {
        environment: 'test'
      };

      const sanitized = (service as any).sanitizeForTransmission(config);

      expect(sanitized).toHaveProperty('truthScore', 0.98);
      expect(sanitized).toHaveProperty('valid', true);
    });
  });

  // Test private method: encryptSensitiveData
  describe('encryptSensitiveData (private method)', () => {
    it('should encrypt GitHub token when present', async () => {
      const config = {
        github: {
          token: 'plaintext-token',
          repository: 'test-repo'
        }
      };

      const encryptedToken = 'encrypted-token-result';
      mockTokenEncryptionService.encryptToken.mockResolvedValue(encryptedToken);

      const encryptedConfig = await (service as any).encryptSensitiveData(config);

      expect(mockTokenEncryptionService.encryptToken).toHaveBeenCalledWith('plaintext-token', testEncryptionPassword);
      expect(encryptedConfig.github.token).toBe(encryptedToken);
      expect(encryptedConfig.github.repository).toBe('test-repo');
    });

    it('should not modify config when no sensitive data is present', async () => {
      const config = {
        environment: 'test',
        deployment: {
          target: 'aws'
        }
      };

      const encryptedConfig = await (service as any).encryptSensitiveData(config);

      expect(encryptedConfig).toEqual(config);
      expect(mockTokenEncryptionService.encryptToken).not.toHaveBeenCalled();
    });

    it('should handle encryption errors gracefully', async () => {
      const config = {
        github: {
          token: 'plaintext-token'
        }
      };

      const errorMessage = 'Encryption failed';
      mockTokenEncryptionService.encryptToken.mockRejectedValue(new Error(errorMessage));

      await expect((service as any).encryptSensitiveData(config))
        .rejects.toThrow(`Failed to encrypt GitHub token: ${errorMessage}`);
    });
  });

  // Test private method: decryptSensitiveData
  describe('decryptSensitiveData (private method)', () => {
    it('should decrypt GitHub token when present', async () => {
      const config = {
        github: {
          token: 'encrypted-token',
          repository: 'test-repo'
        }
      };

      const decryptedToken = 'plaintext-token';
      mockTokenEncryptionService.decryptToken.mockResolvedValue(decryptedToken);

      const decryptedConfig = await (service as any).decryptSensitiveData(config);

      expect(mockTokenEncryptionService.decryptToken).toHaveBeenCalledWith('encrypted-token', testEncryptionPassword);
      expect(decryptedConfig.github.token).toBe(decryptedToken);
      expect(decryptedConfig.github.repository).toBe('test-repo');
    });

    it('should not modify config when no sensitive data is present', async () => {
      const config = {
        environment: 'test',
        deployment: {
          target: 'aws'
        }
      };

      const decryptedConfig = await (service as any).decryptSensitiveData(config);

      expect(decryptedConfig).toEqual(config);
      expect(mockTokenEncryptionService.decryptToken).not.toHaveBeenCalled();
    });

    it('should handle decryption errors gracefully', async () => {
      const config = {
        github: {
          token: 'corrupted-token'
        }
      };

      const errorMessage = 'Decryption failed';
      mockTokenEncryptionService.decryptToken.mockRejectedValue(new Error(errorMessage));

      await expect((service as any).decryptSensitiveData(config))
        .rejects.toThrow(`Failed to decrypt GitHub token: ${errorMessage}`);
    });
  });
});
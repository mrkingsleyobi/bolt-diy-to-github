# Phase 4: Bolt.diy Integration - Refinement Phase (London School TDD)

## Test Suite Structure

Following the London School TDD approach, our tests will focus on behavior verification through mocks and stubs rather than state verification. Each test will:

1. Set up the specific scenario being tested
2. Configure mocks to simulate dependencies
3. Execute the system under test
4. Verify interactions with mocks
5. Confirm appropriate responses are returned

## Cross-Origin Communication Tests

### Test 1: Message Handler Initialization
```typescript
describe('CrossOriginMessageBridge', () => {
  let messageBridge: CrossOriginMessageBridge;
  let mockChromeRuntime: any;
  let mockWindow: any;

  beforeEach(() => {
    // Given: A fresh message bridge instance
    mockChromeRuntime = {
      onMessage: {
        addListener: jest.fn()
      }
    };

    mockWindow = {
      addEventListener: jest.fn()
    };

    global.chrome = { runtime: mockChromeRuntime } as any;
    global.window = mockWindow as any;

    // When: The message bridge is initialized
    messageBridge = new CrossOriginMessageBridge();
  });

  it('should initialize message listeners for both extension and window', () => {
    // Then: Both Chrome extension and window message listeners should be registered
    expect(mockChromeRuntime.onMessage.addListener).toHaveBeenCalledWith(
      expect.any(Function)
    );
    expect(mockWindow.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function)
    );

    // And: The message bridge should be properly instantiated
    expect(messageBridge).toBeInstanceOf(CrossOriginMessageBridge);
  });
});

// Test 2: Extension Message Handling with Security Validation
describe('CrossOriginMessageBridge - Extension Message Handling', () => {
  let messageBridge: CrossOriginMessageBridge;
  let mockSecurityValidator: jest.Mocked<SecurityValidator>;
  let mockMessageHandler: jest.Mock;

  beforeEach(() => {
    mockSecurityValidator = {
      validateMessage: jest.fn(),
      validateMessageFormat: jest.fn(),
      validateOrigin: jest.fn()
    } as any;

    messageBridge = new CrossOriginMessageBridge();
    (messageBridge as any).securityValidator = mockSecurityValidator;

    mockMessageHandler = jest.fn();
    messageBridge.registerHandler('TEST_MESSAGE', mockMessageHandler);
  });

  it('should handle valid extension messages and route to appropriate handler', async () => {
    // Given: A valid extension message
    const validMessage = {
      type: 'TEST_MESSAGE',
      id: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: Date.now(),
      payload: { test: 'data' }
    };

    const mockSender = {
      id: chrome.runtime.id
    };

    const mockResponse = { success: true, result: 'test completed' };
    mockMessageHandler.mockResolvedValue(mockResponse);

    // And: Security validation passes
    mockSecurityValidator.validateMessage.mockResolvedValue();

    // When: The message is processed
    const sendResponse = jest.fn();
    await (messageBridge as any).handleExtensionMessage(
      validMessage,
      mockSender,
      sendResponse
    );

    // Then: Security validation should be called
    expect(mockSecurityValidator.validateMessage).toHaveBeenCalledWith(
      validMessage,
      mockSender
    );

    // And: The message handler should be called with the payload
    expect(mockMessageHandler).toHaveBeenCalledWith(validMessage.payload);

    // And: Response should be sent with truth score
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: 'test completed',
        truthScore: expect.any(Number)
      })
    );
  });

  it('should reject messages from unauthorized senders', async () => {
    // Given: A message from an unauthorized sender
    const invalidMessage = {
      type: 'TEST_MESSAGE',
      id: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: Date.now(),
      payload: { test: 'data' }
    };

    const unauthorizedSender = {
      id: 'unauthorized-extension-id'
    };

    // When: The message is processed
    const sendResponse = jest.fn();
    await (messageBridge as any).handleExtensionMessage(
      invalidMessage,
      unauthorizedSender,
      sendResponse
    );

    // Then: An error response should be sent
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Unauthorized message sender'
      })
    );
  });
});

// Test 3: Window Message Handling with Origin Validation
describe('CrossOriginMessageBridge - Window Message Handling', () => {
  let messageBridge: CrossOriginMessageBridge;
  let mockSecurityValidator: jest.Mocked<SecurityValidator>;
  let mockMessageHandler: jest.Mock;

  beforeEach(() => {
    mockSecurityValidator = {
      validateMessage: jest.fn(),
      validateMessageFormat: jest.fn(),
      validateOrigin: jest.fn()
    } as any;

    messageBridge = new CrossOriginMessageBridge();
    (messageBridge as any).securityValidator = mockSecurityValidator;

    mockMessageHandler = jest.fn();
    messageBridge.registerHandler('WINDOW_MESSAGE', mockMessageHandler);
  });

  it('should handle valid window messages from allowed origins', async () => {
    // Given: A valid window message from an allowed origin
    const mockEvent = {
      origin: 'https://bolt.diy',
      data: {
        type: 'WINDOW_MESSAGE',
        id: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: Date.now(),
        payload: { window: 'data' }
      },
      source: {
        postMessage: jest.fn()
      }
    };

    // And: Origin validation passes
    mockSecurityValidator.validateOrigin.mockReturnValue(true);
    mockSecurityValidator.validateMessageFormat.mockReturnValue();

    // And: Message handler returns a response
    const mockResponse = { success: true, windowResult: 'processed' };
    mockMessageHandler.mockResolvedValue(mockResponse);

    // When: The window message is processed
    await (messageBridge as any).handleWindowMessage(mockEvent);

    // Then: Origin should be validated
    expect(mockSecurityValidator.validateOrigin).toHaveBeenCalledWith('https://bolt.diy');

    // And: Message format should be validated
    expect(mockSecurityValidator.validateMessageFormat).toHaveBeenCalledWith(mockEvent.data);

    // And: The message handler should be called
    expect(mockMessageHandler).toHaveBeenCalledWith(mockEvent.data.payload);

    // And: Response should be sent back to the window
    expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        windowResult: 'processed'
      }),
      'https://bolt.diy'
    );
  });

  it('should reject window messages from disallowed origins', async () => {
    // Given: A window message from a disallowed origin
    const mockEvent = {
      origin: 'https://malicious-site.com',
      data: {
        type: 'WINDOW_MESSAGE',
        id: '123e4567-e89b-12d3-a456-426614174000',
      },
      source: {
        postMessage: jest.fn()
      }
    };

    // And: Origin validation fails
    mockSecurityValidator.validateOrigin.mockReturnValue(false);

    // When: The window message is processed
    await (messageBridge as any).handleWindowMessage(mockEvent);

    // Then: No message handler should be called
    expect(mockMessageHandler).not.toHaveBeenCalled();

    // And: No response should be sent
    expect(mockEvent.source.postMessage).not.toHaveBeenCalled();
  });
});
```

## Data Synchronization Tests

### Test 4: Synchronization Service Initialization
```typescript
describe('DataSynchronizationService', () => {
  let syncService: DataSynchronizationService;
  let mockConflictResolver: jest.Mocked<ConflictResolver>;
  let mockDeltaCalculator: jest.Mocked<DeltaCalculator>;

  beforeEach(() => {
    // Given: Mocked dependencies
    mockConflictResolver = {
      resolve: jest.fn()
    } as any;

    mockDeltaCalculator = {
      calculate: jest.fn()
    } as any;

    // When: The synchronization service is initialized
    syncService = new DataSynchronizationService();
    (syncService as any).conflictResolver = mockConflictResolver;
    (syncService as any).deltaCalculator = mockDeltaCalculator;
  });

  it('should initialize with required dependencies', () => {
    // Then: All required services should be instantiated
    expect(syncService).toBeInstanceOf(DataSynchronizationService);
    expect((syncService as any).conflictResolver).toBeDefined();
    expect((syncService as any).deltaCalculator).toBeDefined();
    expect((syncService as any).syncMetadata).toBeDefined();
  });
});

// Test 5: Project Synchronization with Conflict Resolution
describe('DataSynchronizationService - Project Synchronization', () => {
  let syncService: DataSynchronizationService;
  let mockDeltaCalculator: jest.Mocked<DeltaCalculator>;
  let mockConflictResolver: jest.Mocked<ConflictResolver>;
  let mockSyncMetadata: jest.Mocked<SyncMetadataManager>;
  let mockTruthVerifier: jest.Mocked<TruthVerificationService>;

  beforeEach(() => {
    syncService = new DataSynchronizationService();

    mockDeltaCalculator = {
      calculate: jest.fn()
    } as any;

    mockConflictResolver = {
      resolve: jest.fn()
    } as any;

    mockSyncMetadata = {
      update: jest.fn()
    } as any;

    mockTruthVerifier = {
      calculateScore: jest.fn()
    } as any;

    (syncService as any).deltaCalculator = mockDeltaCalculator;
    (syncService as any).conflictResolver = mockConflictResolver;
    (syncService as any).syncMetadata = mockSyncMetadata;
    (syncService as any).verifyTruthScore = mockTruthVerifier.calculateScore;
  });

  it('should synchronize projects with conflict resolution and truth verification', async () => {
    // Given: Project data to synchronize
    const localProjectId = 'local-project-123';
    const remoteProjectId = 'remote-project-456';

    const mockLocalData = {
      files: { 'file1.txt': { content: 'local content' } },
      metadata: { version: '1.0' }
    };

    const mockRemoteData = {
      files: { 'file1.txt': { content: 'remote content' } },
      metadata: { version: '1.1' }
    };

    // And: A synchronization delta with conflicts
    const mockDelta = {
      added: [],
      modified: [],
      deleted: [],
      conflicts: [
        {
          path: 'file1.txt',
          local: mockLocalData.files['file1.txt'],
          remote: mockRemoteData.files['file1.txt']
        }
      ]
    };

    // And: Conflict resolution strategy
    const syncOptions = {
      conflictStrategy: 'timestamp' as ConflictResolutionStrategy
    };

    // And: Mock implementations
    (syncService as any).loadLocalProjectData = jest.fn().mockResolvedValue(mockLocalData);
    (syncService as any).loadRemoteProjectData = jest.fn().mockResolvedValue(mockRemoteData);
    mockDeltaCalculator.calculate.mockReturnValue(mockDelta);

    const mockResolutions = [
      {
        path: 'file1.txt',
        resolution: 'remote' as const,
        timestamp: Date.now()
      }
    ];
    mockConflictResolver.resolve.mockResolvedValue(mockResolutions);

    (syncService as any).applyChanges = jest.fn().mockResolvedValue({
      changes: [{ path: 'file1.txt', type: 'modified' }],
      success: true
    });

    mockSyncMetadata.update.mockResolvedValue();
    mockTruthVerifier.calculateScore.mockResolvedValue(0.97);

    // When: Project synchronization is performed
    const result = await syncService.synchronizeProject(
      localProjectId,
      remoteProjectId,
      syncOptions
    );

    // Then: Local and remote data should be loaded
    expect((syncService as any).loadLocalProjectData).toHaveBeenCalledWith(localProjectId);
    expect((syncService as any).loadRemoteProjectData).toHaveBeenCalledWith(remoteProjectId);

    // And: Delta should be calculated
    expect(mockDeltaCalculator.calculate).toHaveBeenCalledWith(mockLocalData, mockRemoteData);

    // And: Conflicts should be resolved
    expect(mockConflictResolver.resolve).toHaveBeenCalledWith(
      mockDelta.conflicts,
      syncOptions.conflictStrategy
    );

    // And: Changes should be applied
    expect((syncService as any).applyChanges).toHaveBeenCalledWith(
      mockDelta,
      undefined
    );

    // And: Sync metadata should be updated
    expect(mockSyncMetadata.update).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: localProjectId,
        changesApplied: 1
      })
    );

    // And: Truth score should be verified
    expect(mockTruthVerifier.calculateScore).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: 1,
        conflicts: 1
      })
    );

    // And: Successful result should be returned
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        changes: 1,
        conflicts: 1,
        truthScore: 0.97
      })
    );
  });

  it('should trigger auto-rollback when truth score is below threshold', async () => {
    // Given: Project data that results in low truth score
    const localProjectId = 'local-project-123';
    const remoteProjectId = 'remote-project-456';

    const mockLocalData = { files: {}, metadata: {} };
    const mockRemoteData = { files: {}, metadata: {} };
    const mockDelta = { added: [], modified: [], deleted: [], conflicts: [] };

    // And: Low truth score
    (syncService as any).loadLocalProjectData = jest.fn().mockResolvedValue(mockLocalData);
    (syncService as any).loadRemoteProjectData = jest.fn().mockResolvedValue(mockRemoteData);
    mockDeltaCalculator.calculate.mockReturnValue(mockDelta);
    (syncService as any).applyChanges = jest.fn().mockResolvedValue({ changes: [], success: true });
    mockSyncMetadata.update.mockResolvedValue();
    mockTruthVerifier.calculateScore.mockResolvedValue(0.92); // Below threshold

    // And: Auto-rollback handler
    const mockHandleLowTruthScore = jest.fn();
    (syncService as any).handleLowTruthScore = mockHandleLowTruthScore;

    // When: Project synchronization is performed
    await expect(
      syncService.synchronizeProject(localProjectId, remoteProjectId, {})
    ).rejects.toThrow('Sync failed: Truth score 0.92 below threshold');

    // Then: Low truth score handler should be called
    expect(mockHandleLowTruthScore).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: 0,
        conflicts: 0
      })
    );
  });
});
```

## Environment Configuration Tests

### Test 6: Environment Configuration Service Initialization
```typescript
describe('EnvironmentConfigurationService', () => {
  let configService: EnvironmentConfigurationService;
  let mockConfigStore: jest.Mocked<SecureConfigStore>;
  let mockValidator: jest.Mocked<ConfigValidator>;

  beforeEach(() => {
    // Given: Mocked dependencies
    mockConfigStore = {
      load: jest.fn(),
      save: jest.fn()
    } as any;

    mockValidator = {
      validate: jest.fn()
    } as any;

    // When: The configuration service is initialized
    configService = new EnvironmentConfigurationService();
    (configService as any).configStore = mockConfigStore;
    (configService as any).validator = mockValidator;
  });

  it('should initialize with required dependencies', () => {
    // Then: All required services should be instantiated
    expect(configService).toBeInstanceOf(EnvironmentConfigurationService);
    expect((configService as any).configStore).toBeDefined();
    expect((configService as any).validator).toBeDefined();
    expect((configService as any).loader).toBeDefined();
  });
});

// Test 7: Environment Configuration Retrieval with Security Validation
describe('EnvironmentConfigurationService - Configuration Retrieval', () => {
  let configService: EnvironmentConfigurationService;
  let mockConfigStore: jest.Mocked<SecureConfigStore>;
  let mockValidator: jest.Mocked<ConfigValidator>;
  let mockCryptoService: jest.Mocked<CryptoService>;
  let mockTruthVerifier: jest.Mocked<TruthVerificationService>;

  beforeEach(() => {
    configService = new EnvironmentConfigurationService();

    mockConfigStore = {
      load: jest.fn()
    } as any;

    mockValidator = {
      validate: jest.fn()
    } as any;

    mockCryptoService = {
      decrypt: jest.fn(),
      encrypt: jest.fn()
    } as any;

    mockTruthVerifier = {
      calculateScore: jest.fn()
    } as any;

    (configService as any).configStore = mockConfigStore;
    (configService as any).validator = mockValidator;
    (configService as any).decryptConfig = mockCryptoService.decrypt;
    (configService as any).calculateTruthScore = mockTruthVerifier.calculateScore;
    (configService as any).validateAccessTokens = jest.fn().mockResolvedValue(true);
    (configService as any).sanitizeForTransmission = jest.fn().mockImplementation(config => config);
  });

  it('should retrieve and validate environment configuration with truth verification', async () => {
    // Given: An environment to retrieve configuration for
    const environment = 'development';

    // And: Encrypted configuration stored
    const mockEncryptedConfig = {
      data: 'encrypted-config-data',
      iv: 'initialization-vector'
    };

    // And: Decrypted configuration
    const mockConfig = {
      github: {
        token: 'gho_secret-token',
        repository: 'test-repo'
      },
      deployment: {
        target: 'vercel',
        region: 'us-east-1'
      }
    };

    // And: Mock implementations
    mockConfigStore.load.mockResolvedValue(mockEncryptedConfig);
    mockCryptoService.decrypt.mockResolvedValue(mockConfig);
    mockValidator.validate.mockResolvedValue();
    (configService as any).validateAccessTokens.mockResolvedValue(true);
    mockTruthVerifier.calculateScore.mockResolvedValue(0.98);

    // When: Environment configuration is retrieved
    const result = await configService.getEnvironmentConfig(environment);

    // Then: Configuration should be loaded from store
    expect(mockConfigStore.load).toHaveBeenCalledWith(environment);

    // And: Configuration should be decrypted
    expect(mockCryptoService.decrypt).toHaveBeenCalledWith(mockEncryptedConfig);

    // And: Configuration should be validated
    expect(mockValidator.validate).toHaveBeenCalledWith(mockConfig);

    // And: Access tokens should be validated
    expect((configService as any).validateAccessTokens).toHaveBeenCalledWith(mockConfig);

    // And: Configuration should be sanitized for transmission
    expect((configService as any).sanitizeForTransmission).toHaveBeenCalledWith(mockConfig);

    // And: Truth score should be calculated
    expect(mockTruthVerifier.calculateScore).toHaveBeenCalledWith(
      expect.objectContaining({
        config: mockConfig
      })
    );

    // And: Valid configuration should be returned
    expect(result).toEqual(
      expect.objectContaining({
        github: {
          repository: 'test-repo'
        },
        deployment: {
          target: 'vercel',
          region: 'us-east-1'
        },
        truthScore: 0.98,
        valid: true
      })
    );

    // And: Sensitive data should be removed
    expect(result.github).not.toHaveProperty('token');
  });

  it('should reject configuration retrieval when access tokens are invalid', async () => {
    // Given: Configuration with invalid access tokens
    const environment = 'production';
    const mockEncryptedConfig = { data: 'encrypted-data', iv: 'iv' };
    const mockConfig = { github: { token: 'expired-token' } };

    // And: Mock implementations
    mockConfigStore.load.mockResolvedValue(mockEncryptedConfig);
    mockCryptoService.decrypt.mockResolvedValue(mockConfig);
    mockValidator.validate.mockResolvedValue();
    (configService as any).validateAccessTokens.mockResolvedValue(false); // Invalid tokens

    // When: Environment configuration is retrieved
    await expect(
      configService.getEnvironmentConfig(environment)
    ).rejects.toThrow('Failed to load environment config: Invalid or expired access tokens');

    // Then: Configuration should not be returned
    // Expectation is satisfied by the rejection
  });
});
```

## Deployment Orchestration Tests

### Test 8: Deployment Orchestration Service Initialization
```typescript
describe('DeploymentOrchestrationService', () => {
  let deploymentService: DeploymentOrchestrationService;
  let mockDeploymentManager: jest.Mocked<DeploymentManager>;
  let mockMonitor: jest.Mocked<DeploymentMonitor>;

  beforeEach(() => {
    // Given: Mocked dependencies
    mockDeploymentManager = {
      initiateDeployment: jest.fn(),
      rollbackDeployment: jest.fn()
    } as any;

    mockMonitor = {
      startMonitoring: jest.fn()
    } as any;

    // When: The deployment service is initialized
    deploymentService = new DeploymentOrchestrationService();
    (deploymentService as any).deploymentManager = mockDeploymentManager;
    (deploymentService as any).monitor = mockMonitor;
  });

  it('should initialize with required dependencies', () => {
    // Then: All required services should be instantiated
    expect(deploymentService).toBeInstanceOf(DeploymentOrchestrationService);
    expect((deploymentService as any).deploymentManager).toBeDefined();
    expect((deploymentService as any).monitor).toBeDefined();
    expect((deploymentService as any).validator).toBeDefined();
  });
});

// Test 9: Deployment Triggering with Validation and Monitoring
describe('DeploymentOrchestrationService - Deployment Triggering', () => {
  let deploymentService: DeploymentOrchestrationService;
  let mockValidator: jest.Mocked<DeploymentValidator>;
  let mockDeploymentManager: jest.Mocked<DeploymentManager>;
  let mockMonitor: jest.Mocked<DeploymentMonitor>;
  let mockTruthVerifier: jest.Mocked<TruthVerificationService>;

  beforeEach(() => {
    deploymentService = new DeploymentOrchestrationService();

    mockValidator = {
      validateRequest: jest.fn(),
      checkPermissions: jest.fn(),
      validateProjectExists: jest.fn(),
      validateBranchExists: jest.fn(),
      validateEnvironmentAccess: jest.fn(),
      validateDeploymentQuota: jest.fn(),
      validateConfiguration: jest.fn()
    } as any;

    mockDeploymentManager = {
      initiateDeployment: jest.fn(),
      rollbackDeployment: jest.fn()
    } as any;

    mockMonitor = {
      startMonitoring: jest.fn()
    } as any;

    mockTruthVerifier = {
      calculateScore: jest.fn()
    } as any;

    (deploymentService as any).validator = mockValidator;
    (deploymentService as any).deploymentManager = mockDeploymentManager;
    (deploymentService as any).monitor = mockMonitor;
    (deploymentService as any).calculateTruthScore = mockTruthVerifier.calculateScore;
    (deploymentService as any).prepareDeployment = jest.fn();
    (deploymentService as any).handleLowTruthScore = jest.fn();
  });

  it('should trigger deployment with validation, monitoring, and truth verification', async () => {
    // Given: A deployment request
    const deploymentRequest: DeploymentRequest = {
      boltDiyId: 'project-123',
      branch: 'main',
      environment: 'production',
      deploymentConfig: {
        target: 'vercel',
        region: 'us-west-2'
      }
    };

    // And: Valid deployment preparation
    const mockPreparation = {
      valid: true,
      errors: []
    };

    // And: Successful deployment initiation
    const mockDeploymentId = 'deployment-789';

    // And: Monitoring setup
    const mockMonitorId = 'monitor-456';

    // And: High truth score
    const mockTruthScore = 0.96;

    // And: Mock implementations
    mockValidator.validateRequest.mockResolvedValue();
    mockValidator.checkPermissions.mockResolvedValue();
    (deploymentService as any).prepareDeployment.mockResolvedValue(mockPreparation);
    mockDeploymentManager.initiateDeployment.mockResolvedValue(mockDeploymentId);
    mockMonitor.startMonitoring.mockReturnValue(mockMonitorId);
    mockTruthVerifier.calculateScore.mockResolvedValue(mockTruthScore);

    // When: Deployment is triggered
    const result = await deploymentService.triggerDeployment(deploymentRequest);

    // Then: Request should be validated
    expect(mockValidator.validateRequest).toHaveBeenCalledWith(deploymentRequest);

    // And: Permissions should be checked
    expect(mockValidator.checkPermissions).toHaveBeenCalledWith(deploymentRequest);

    // And: Deployment should be prepared
    expect((deploymentService as any).prepareDeployment).toHaveBeenCalledWith(deploymentRequest);

    // And: Deployment should be initiated in bolt.diy
    expect(mockDeploymentManager.initiateDeployment).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: deploymentRequest.boltDiyId,
        branch: deploymentRequest.branch,
        environment: deploymentRequest.environment,
        configuration: deploymentRequest.deploymentConfig
      })
    );

    // And: Monitoring should be started
    expect(mockMonitor.startMonitoring).toHaveBeenCalledWith(mockDeploymentId);

    // And: Truth score should be calculated
    expect(mockTruthVerifier.calculateScore).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'deployment_init',
        deploymentId: mockDeploymentId
      })
    );

    // And: Successful response should be returned
    expect(result).toEqual({
      success: true,
      deploymentId: mockDeploymentId,
      monitorId: mockMonitorId,
      status: 'initiated',
      truthScore: mockTruthScore
    });
  });

  it('should reject deployment when preparation fails', async () => {
    // Given: A deployment request
    const deploymentRequest: DeploymentRequest = {
      boltDiyId: 'project-123',
      branch: 'main',
      environment: 'staging',
      deploymentConfig: {}
    };

    // And: Failed deployment preparation
    const mockPreparation = {
      valid: false,
      errors: ['Invalid configuration', 'Missing credentials']
    };

    // And: Mock implementations
    mockValidator.validateRequest.mockResolvedValue();
    mockValidator.checkPermissions.mockResolvedValue();
    (deploymentService as any).prepareDeployment.mockResolvedValue(mockPreparation);

    // When: Deployment is triggered
    await expect(
      deploymentService.triggerDeployment(deploymentRequest)
    ).rejects.toThrow('Deployment failed: Deployment preparation failed: Invalid configuration, Missing credentials');

    // Then: No deployment should be initiated
    expect(mockDeploymentManager.initiateDeployment).not.toHaveBeenCalled();
  });

  it('should handle low truth score by triggering rollback', async () => {
    // Given: A deployment request that results in low truth score
    const deploymentRequest: DeploymentRequest = {
      boltDiyId: 'project-123',
      branch: 'main',
      environment: 'development',
      deploymentConfig: {}
    };

    // And: Valid preparation
    const mockPreparation = { valid: true, errors: [] };

    // And: Deployment initiation
    const mockDeploymentId = 'deployment-789';

    // And: Low truth score
    const mockTruthScore = 0.92; // Below threshold

    // And: Mock implementations
    mockValidator.validateRequest.mockResolvedValue();
    mockValidator.checkPermissions.mockResolvedValue();
    (deploymentService as any).prepareDeployment.mockResolvedValue(mockPreparation);
    mockDeploymentManager.initiateDeployment.mockResolvedValue(mockDeploymentId);
    mockMonitor.startMonitoring.mockReturnValue('monitor-456');
    mockTruthVerifier.calculateScore.mockResolvedValue(mockTruthScore);
    (deploymentService as any).handleLowTruthScore = jest.fn();

    // When: Deployment is triggered
    await expect(
      deploymentService.triggerDeployment(deploymentRequest)
    ).rejects.toThrow('Deployment failed: Truth score 0.92 below threshold');

    // Then: Low truth score handler should be called
    expect((deploymentService as any).handleLowTruthScore).toHaveBeenCalledWith(mockDeploymentId);
  });
});
```

## Integration Service Tests

### Test 10: Enhanced ZIP Processing with Progress Notification
```typescript
describe('EnhancedZipProcessor - Progress Notification', () => {
  let zipProcessor: EnhancedZipProcessor;
  let mockProgressNotifier: jest.Mocked<ProgressNotifier>;
  let mockIntegrationService: jest.Mocked<IntegrationService>;

  beforeEach(() => {
    // Given: An enhanced ZIP processor
    zipProcessor = new EnhancedZipProcessor({
      maxSize: 50 * 1024 * 1024, // 50MB
      useStreaming: true
    });

    mockProgressNotifier = {
      createCallback: jest.fn(),
      notifyExtension: jest.fn(),
      notifyBoltDiy: jest.fn()
    } as any;

    mockIntegrationService = {
      notifyProgress: jest.fn()
    } as any;

    (zipProcessor as any).progressNotifier = mockProgressNotifier;
    (zipProcessor as any).integrationService = mockIntegrationService;
  });

  it('should create project ZIP with progress notifications to both systems', async () => {
    // Given: Project data to ZIP
    const projectData: ProjectData = {
      files: {
        'src/index.js': {
          content: 'console.log("Hello World");',
          lastModified: Date.now(),
          size: 28
        },
        'package.json': {
          content: '{"name": "test-project"}',
          lastModified: Date.now(),
          size: 25
        }
      },
      metadata: {
        name: 'Test Project',
        version: '1.0.0'
      }
    };

    // And: Mock progress callback
    const mockProgressCallback = jest.fn();
    mockProgressNotifier.createCallback.mockReturnValue(mockProgressCallback);

    // And: Mock addFile and generate methods
    const mockAddFile = jest.fn();
    const mockGenerate = jest.fn().mockResolvedValue(Buffer.from('mock-zip-data'));
    (zipProcessor as any).addFile = mockAddFile;
    (zipProcessor as any).generate = mockGenerate;

    // When: Project ZIP is created
    const result = await zipProcessor.createProjectZip(projectData);

    // Then: Progress callback should be created
    expect(mockProgressNotifier.createCallback).toHaveBeenCalledWith('zip_creation');

    // And: Files should be added to ZIP
    expect(mockAddFile).toHaveBeenCalledTimes(2);
    expect(mockAddFile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'src/index.js',
        data: 'console.log("Hello World");'
      })
    );
    expect(mockAddFile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'package.json',
        data: '{"name": "test-project"}'
      })
    );

    // And: Progress should be reported for each file
    expect(mockProgressCallback).toHaveBeenCalledTimes(2);

    // And: ZIP should be generated
    expect(mockGenerate).toHaveBeenCalled();

    // And: Progress notification should be sent to both systems
    expect(mockIntegrationService.notifyProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'EXPORT_COMPLETE',
        payload: { size: 13 } // Buffer length
      })
    );

    // And: Result should be a buffer
    expect(result).toBeInstanceOf(Buffer);
  });
});

// Test 11: GitHub Coordination with Branch Operations
describe('GitHubCoordinationService - Branch Operations', () => {
  let githubService: GitHubCoordinationService;
  let mockGithubApiService: jest.Mocked<GitHubApiService>;
  let mockEnvironmentService: jest.Mocked<EnvironmentConfigurationService>;
  let mockTruthVerifier: jest.Mocked<TruthVerificationService>;

  beforeEach(() => {
    githubService = new GitHubCoordinationService();

    mockGithubApiService = {
      createBranch: jest.fn(),
      deleteBranch: jest.fn(),
      getInstance: jest.fn().mockReturnValue({
        createBranch: jest.fn(),
        deleteBranch: jest.fn()
      })
    } as any;

    mockEnvironmentService = {
      getEnvironmentConfig: jest.fn()
    } as any;

    mockTruthVerifier = {
      calculateScore: jest.fn()
    } as any;

    (githubService as any).githubService = mockGithubApiService;
    (githubService as any).environmentService = mockEnvironmentService;
    (githubService as any).calculateTruthScore = mockTruthVerifier.calculateScore;
    (githubService as any).syncBranchChanges = jest.fn();
    (githubService as any).handleLowTruthScore = jest.fn();
  });

  it('should coordinate branch creation with environment configuration and truth verification', async () => {
    // Given: Branch creation operation
    const operation: BranchOperation = 'CREATE_BRANCH';
    const params: BranchOperationParams = {
      repoName: 'test-repo',
      branchName: 'feature/new-feature',
      environment: 'development',
      baseBranch: 'main'
    };

    // And: Valid environment configuration
    const mockConfig = {
      github: {
        token: 'gho_valid-token',
        owner: 'test-owner'
      }
    };

    // And: Successful branch creation
    const mockCreationResult = {
      ref: 'refs/heads/feature/new-feature',
      sha: 'abc123def456'
    };

    // And: High truth score
    const mockTruthScore = 0.97;

    // And: Mock implementations
    mockEnvironmentService.getEnvironmentConfig.mockResolvedValue(mockConfig as any);
    mockGithubApiService.createBranch.mockResolvedValue(mockCreationResult);
    mockTruthVerifier.calculateScore.mockResolvedValue(mockTruthScore);

    // When: Branch operation is coordinated
    const result = await githubService.coordinateBranchOperations(operation, params);

    // Then: Environment configuration should be loaded
    expect(mockEnvironmentService.getEnvironmentConfig).toHaveBeenCalledWith('development');

    // And: GitHub branch should be created
    expect(mockGithubApiService.createBranch).toHaveBeenCalledWith({
      repo: 'test-repo',
      branch: 'feature/new-feature',
      base: 'main'
    });

    // And: Truth score should be calculated
    expect(mockTruthVerifier.calculateScore).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'CREATE_BRANCH',
        result: mockCreationResult,
        config: mockConfig
      })
    );

    // And: Successful result should be returned
    expect(result).toEqual({
      success: true,
      operation: 'CREATE_BRANCH',
      result: mockCreationResult,
      truthScore: mockTruthScore
    });
  });

  it('should reject branch operations when GitHub configuration is missing', async () => {
    // Given: Branch operation parameters
    const operation: BranchOperation = 'DELETE_BRANCH';
    const params: BranchOperationParams = {
      repoName: 'test-repo',
      branchName: 'feature/old-feature',
      environment: 'staging'
    };

    // And: Environment configuration without GitHub settings
    const mockConfig = {
      deployment: {
        target: 'vercel'
      }
    };

    // And: Mock implementations
    mockEnvironmentService.getEnvironmentConfig.mockResolvedValue(mockConfig as any);

    // When: Branch operation is coordinated
    await expect(
      githubService.coordinateBranchOperations(operation, params)
    ).rejects.toThrow('Branch operation failed: GitHub configuration not found');

    // Then: No GitHub API calls should be made
    expect(mockGithubApiService.deleteBranch).not.toHaveBeenCalled();
  });

  it('should handle sync branch operations', async () => {
    // Given: Branch sync operation
    const operation: BranchOperation = 'SYNC_BRANCH';
    const params: BranchOperationParams = {
      repoName: 'test-repo',
      branchName: 'develop',
      environment: 'development'
    };

    // And: Valid environment configuration
    const mockConfig = { github: { token: 'gho_valid-token' } };

    // And: Successful sync result
    const mockSyncResult = {
      success: true,
      changes: [{ path: 'file.js', type: 'modified' }],
      conflicts: []
    };

    // And: Mock implementations
    mockEnvironmentService.getEnvironmentConfig.mockResolvedValue(mockConfig as any);
    (githubService as any).syncBranchChanges.mockResolvedValue(mockSyncResult);
    mockTruthVerifier.calculateScore.mockResolvedValue(0.95);

    // When: Branch sync operation is coordinated
    const result = await githubService.coordinateBranchOperations(operation, params);

    // Then: Branch changes should be synced
    expect((githubService as any).syncBranchChanges).toHaveBeenCalledWith('develop');

    // And: Successful result should be returned
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        operation: 'SYNC_BRANCH',
        result: mockSyncResult
      })
    );
  });
});
```
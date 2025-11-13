// AutomatedRollbackService.test.ts - Unit tests for AutomatedRollbackService
// Phase 4: Environment Configuration Management - Task 13: Implement automated rollback for low truth scores in configuration

import { AutomatedRollbackService, RollbackServiceOptions } from '../../src/verification/AutomatedRollbackService';
import { TruthVerificationService } from '../../src/verification/TruthVerificationService';
import { ConfigurationWorkflowService } from '../../src/config/ConfigurationWorkflowService';
import { EncryptedConfigStore } from '../../src/config/EncryptedConfigStore';
import { ConfigurationWorkflowResult } from '../../src/config/ConfigurationWorkflowService';

// Mock the dependencies
jest.mock('../../src/verification/TruthVerificationService');
jest.mock('../../src/config/ConfigurationWorkflowService');
jest.mock('../../src/config/EncryptedConfigStore');

describe('AutomatedRollbackService', () => {
  let automatedRollbackService: AutomatedRollbackService;
  let mockTruthVerificationService: jest.Mocked<TruthVerificationService>;
  let mockConfigurationWorkflowService: jest.Mocked<ConfigurationWorkflowService>;
  let mockEncryptedConfigStore: jest.Mocked<EncryptedConfigStore>;

  const rollbackOptions: RollbackServiceOptions = {
    rollbackConfig: {
      enabled: true,
      threshold: 0.95,
      maxAttempts: 3,
      notifyOnRollback: true,
      backupKeyPrefix: 'test_backup_'
    },
    autoBackup: true
  };

  beforeEach(() => {
    // Create mock instances
    mockTruthVerificationService = new TruthVerificationService() as jest.Mocked<TruthVerificationService>;
    mockConfigurationWorkflowService = new ConfigurationWorkflowService(
      { storagePath: '/test', encryptionPassword: 'test' },
      {} as any,
      {} as any,
      {} as any,
      {} as any
    ) as jest.Mocked<ConfigurationWorkflowService>;
    mockEncryptedConfigStore = new EncryptedConfigStore(
      '/test',
      {} as any,
      {} as any,
      'test'
    ) as jest.Mocked<EncryptedConfigStore>;

    // Mock the constructors to return our mocks
    (TruthVerificationService as jest.Mock).mockImplementation(() => mockTruthVerificationService);
    (ConfigurationWorkflowService as jest.Mock).mockImplementation(() => mockConfigurationWorkflowService);
    (EncryptedConfigStore as jest.Mock).mockImplementation(() => mockEncryptedConfigStore);

    // Create the service instance
    automatedRollbackService = new AutomatedRollbackService(
      mockTruthVerificationService,
      mockConfigurationWorkflowService,
      mockEncryptedConfigStore,
      rollbackOptions
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with default options', () => {
      const service = new AutomatedRollbackService(
        mockTruthVerificationService,
        mockConfigurationWorkflowService,
        mockEncryptedConfigStore
      );

      expect(service).toBeInstanceOf(AutomatedRollbackService);
      expect(service.getRollbackConfig().enabled).toBe(true);
    });

    it('should create an instance with custom options', () => {
      const customOptions: RollbackServiceOptions = {
        rollbackConfig: {
          enabled: false,
          threshold: 0.9,
          maxAttempts: 5,
          notifyOnRollback: false,
          backupKeyPrefix: 'custom_backup_'
        },
        autoBackup: false
      };

      const service = new AutomatedRollbackService(
        mockTruthVerificationService,
        mockConfigurationWorkflowService,
        mockEncryptedConfigStore,
        customOptions
      );

      const config = service.getRollbackConfig();
      expect(config.enabled).toBe(false);
      expect(config.threshold).toBe(0.9);
      expect(config.maxAttempts).toBe(5);
      expect(config.notifyOnRollback).toBe(false);
      expect(config.backupKeyPrefix).toBe('custom_backup_');
    });
  });

  describe('processConfigurationResult', () => {
    it('should not trigger rollback for high truth score', async () => {
      const result: ConfigurationWorkflowResult = {
        success: true,
        config: { environment: 'testing' },
        truthScore: 0.98
      };

      // Mock truth verification service to return high score
      mockTruthVerificationService.verifyConfigurationResult.mockReturnValue({
        score: 0.98,
        meetsThreshold: true,
        factors: {
          validation: 0.9,
          security: 0.9,
          completeness: 0.9,
          consistency: 0.9,
          freshness: 0.9
        },
        recommendations: ['Configuration truth score is excellent - no improvements needed']
      });

      // Mock configuration workflow service to create backup
      mockConfigurationWorkflowService.loadConfiguration.mockResolvedValue({
        success: true,
        config: { environment: 'testing' }
      });

      mockEncryptedConfigStore.save.mockResolvedValue(undefined);
      mockEncryptedConfigStore.list.mockResolvedValue([]);

      const rollbackEvent = await automatedRollbackService.processConfigurationResult(
        result,
        'test-config',
        'testing'
      );

      expect(rollbackEvent).toBeNull(); // No rollback should be triggered
      expect(mockEncryptedConfigStore.save).toHaveBeenCalled(); // But backup should be created
    });

    it('should trigger rollback for low truth score', async () => {
      const result: ConfigurationWorkflowResult = {
        success: false,
        config: { environment: 'invalid' },
        validation: {
          valid: false,
          errors: ['Invalid environment'],
          warnings: []
        },
        error: 'Configuration validation failed',
        truthScore: 0.3
      };

      const configKey = 'test-config';
      const backupKey = 'test_backup_test-config_1234567890';

      // Mock truth verification service to return low score
      mockTruthVerificationService.verifyConfigurationResult.mockReturnValue({
        score: 0.3,
        meetsThreshold: false,
        factors: {
          validation: 0.1,
          security: 0.2,
          completeness: 0.1,
          consistency: 0.1,
          freshness: 0.1
        },
        recommendations: ['Overall truth score 0.30 is below threshold 0.95']
      });

      // Mock backup history
      (automatedRollbackService as any).backupHistory.set(configKey, backupKey);

      // Mock encrypted config store to return backup config
      mockEncryptedConfigStore.load.mockResolvedValue({ environment: 'testing' });

      // Mock configuration workflow service to save restored config
      mockConfigurationWorkflowService.saveConfiguration.mockResolvedValue({
        success: true,
        config: { environment: 'testing' }
      });

      const rollbackEvent = await automatedRollbackService.processConfigurationResult(
        result,
        configKey,
        'testing'
      );

      expect(rollbackEvent).not.toBeNull();
      expect(rollbackEvent?.success).toBe(true);
      expect(rollbackEvent?.configKey).toBe(configKey);
      expect(rollbackEvent?.truthScore).toBe(0.3);
      expect(rollbackEvent?.backupKey).toBe(backupKey);
      expect(mockEncryptedConfigStore.load).toHaveBeenCalledWith(backupKey);
      expect(mockConfigurationWorkflowService.saveConfiguration).toHaveBeenCalledWith(
        'testing',
        configKey,
        { environment: 'testing' }
      );
    });

    it('should handle rollback failure gracefully', async () => {
      const result: ConfigurationWorkflowResult = {
        success: false,
        error: 'Configuration validation failed',
        truthScore: 0.3
      };

      const configKey = 'test-config';

      // Mock truth verification service to return low score
      mockTruthVerificationService.verifyConfigurationResult.mockReturnValue({
        score: 0.3,
        meetsThreshold: false,
        factors: {
          validation: 0.1,
          security: 0.2,
          completeness: 0.1,
          consistency: 0.1,
          freshness: 0.1
        },
        recommendations: ['Overall truth score 0.30 is below threshold 0.95']
      });

      // Mock backup history
      (automatedRollbackService as any).backupHistory.set(configKey, 'non-existent-backup');

      // Mock encrypted config store to throw error
      mockEncryptedConfigStore.load.mockRejectedValue(new Error('Backup not found'));

      const rollbackEvent = await automatedRollbackService.processConfigurationResult(
        result,
        configKey,
        'testing'
      );

      expect(rollbackEvent).not.toBeNull();
      expect(rollbackEvent?.success).toBe(false);
      expect(rollbackEvent?.error).toBe('Backup not found');
    });

    it('should handle rollback when no backup is available', async () => {
      const result: ConfigurationWorkflowResult = {
        success: false,
        error: 'Configuration validation failed',
        truthScore: 0.3
      };

      const configKey = 'test-config';

      // Mock truth verification service to return low score
      mockTruthVerificationService.verifyConfigurationResult.mockReturnValue({
        score: 0.3,
        meetsThreshold: false,
        factors: {
          validation: 0.1,
          security: 0.2,
          completeness: 0.1,
          consistency: 0.1,
          freshness: 0.1
        },
        recommendations: ['Overall truth score 0.30 is below threshold 0.95']
      });

      // No backup in history, so rollback should fail

      const rollbackEvent = await automatedRollbackService.processConfigurationResult(
        result,
        configKey,
        'testing'
      );

      expect(rollbackEvent).not.toBeNull();
      expect(rollbackEvent?.success).toBe(false);
      expect(rollbackEvent?.error).toBe('No previous configuration backup found');
    });
  });

  describe('manualRollback', () => {
    it('should perform manual rollback successfully', async () => {
      const configKey = 'test-config';
      const backupKey = 'test_backup_test-config_1234567890';
      const reason = 'Manual rollback for testing';

      // Mock backup history
      (automatedRollbackService as any).backupHistory.set(configKey, backupKey);

      // Mock encrypted config store to return backup config
      mockEncryptedConfigStore.load.mockResolvedValue({ environment: 'testing' });

      // Mock configuration workflow service to save restored config
      mockConfigurationWorkflowService.saveConfiguration.mockResolvedValue({
        success: true,
        config: { environment: 'testing' }
      });

      const rollbackEvent = await automatedRollbackService.manualRollback(
        configKey,
        'testing',
        reason
      );

      expect(rollbackEvent.success).toBe(true);
      expect(rollbackEvent.configKey).toBe(configKey);
      expect(rollbackEvent.reason).toContain(reason);
      expect(rollbackEvent.backupKey).toBe(backupKey);
      expect(mockEncryptedConfigStore.load).toHaveBeenCalledWith(backupKey);
      expect(mockConfigurationWorkflowService.saveConfiguration).toHaveBeenCalledWith(
        'testing',
        configKey,
        { environment: 'testing' }
      );
    });

    it('should handle manual rollback failure gracefully', async () => {
      const configKey = 'test-config';
      const reason = 'Manual rollback for testing';

      // Mock backup history
      (automatedRollbackService as any).backupHistory.set(configKey, 'non-existent-backup');

      // Mock encrypted config store to throw error
      mockEncryptedConfigStore.load.mockRejectedValue(new Error('Backup not found'));

      const rollbackEvent = await automatedRollbackService.manualRollback(
        configKey,
        'testing',
        reason
      );

      expect(rollbackEvent.success).toBe(false);
      expect(rollbackEvent.error).toBe('Backup not found');
    });
  });

  describe('getters and setters', () => {
    it('should return rollback history', () => {
      const history = automatedRollbackService.getRollbackHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should return backup history', () => {
      const history = automatedRollbackService.getBackupHistory();
      expect(history instanceof Map).toBe(true);
    });

    it('should return rollback configuration', () => {
      const config = automatedRollbackService.getRollbackConfig();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
    });

    it('should update rollback configuration', () => {
      automatedRollbackService.updateRollbackConfig({ threshold: 0.9 });
      const config = automatedRollbackService.getRollbackConfig();
      expect(config.threshold).toBe(0.9);
    });
  });
});
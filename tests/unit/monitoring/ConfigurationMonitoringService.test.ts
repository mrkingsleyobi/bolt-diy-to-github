// ConfigurationMonitoringService.test.ts - Unit tests for ConfigurationMonitoringService
// Phase 4: Environment Configuration Management - Task 14: Create monitoring service for configuration operations

import { ConfigurationMonitoringService, MonitoringServiceOptions } from '../../src/monitoring/ConfigurationMonitoringService';
import { ConfigurationWorkflowResult } from '../../src/config/ConfigurationWorkflowService';
import { RollbackEvent } from '../../src/verification/AutomatedRollbackService';

describe('ConfigurationMonitoringService', () => {
  let monitoringService: ConfigurationMonitoringService;

  beforeEach(() => {
    monitoringService = new ConfigurationMonitoringService();
  });

  describe('constructor', () => {
    it('should create an instance with default options', () => {
      expect(monitoringService).toBeInstanceOf(ConfigurationMonitoringService);

      const config = monitoringService.getMonitoringConfig();
      expect(config.enabled).toBe(true);
      expect(config.logAllOperations).toBe(true);
      expect(config.logOnlyFailures).toBe(false);
      expect(config.maxEvents).toBe(1000);
      expect(config.emitEvents).toBe(false);
    });

    it('should create an instance with custom options', () => {
      const options: MonitoringServiceOptions = {
        monitoringConfig: {
          enabled: false,
          logAllOperations: false,
          logOnlyFailures: true,
          maxEvents: 500,
          emitEvents: true
        }
      };

      const service = new ConfigurationMonitoringService(options);

      const config = service.getMonitoringConfig();
      expect(config.enabled).toBe(false);
      expect(config.logAllOperations).toBe(false);
      expect(config.logOnlyFailures).toBe(true);
      expect(config.maxEvents).toBe(500);
      expect(config.emitEvents).toBe(true);
    });
  });

  describe('recordLoadOperation', () => {
    it('should record a successful load operation', () => {
      const result: ConfigurationWorkflowResult = {
        success: true,
        config: { environment: 'testing' },
        truthScore: 0.95
      };

      monitoringService.recordLoadOperation('test-config', 'testing', result, 100);

      const metrics = monitoringService.getMetrics();
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successfulOperations).toBe(1);
      expect(metrics.failedOperations).toBe(0);
      expect(metrics.averageDuration).toBe(100);
      expect(metrics.currentTruthScore).toBe(0.95);

      const events = monitoringService.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('load');
      expect(events[0].success).toBe(true);
      expect(events[0].configKey).toBe('test-config');
      expect(events[0].environment).toBe('testing');
      expect(events[0].duration).toBe(100);
      expect(events[0].truthScore).toBe(0.95);
    });

    it('should record a failed load operation', () => {
      const result: ConfigurationWorkflowResult = {
        success: false,
        error: 'Configuration not found',
        truthScore: 0.1
      };

      monitoringService.recordLoadOperation('test-config', 'testing', result, 50);

      const metrics = monitoringService.getMetrics();
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successfulOperations).toBe(0);
      expect(metrics.failedOperations).toBe(1);
      expect(metrics.averageDuration).toBe(50);
      expect(metrics.currentTruthScore).toBe(0.1);

      const events = monitoringService.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('load');
      expect(events[0].success).toBe(false);
      expect(events[0].error).toBe('Configuration not found');
    });
  });

  describe('recordSaveOperation', () => {
    it('should record a successful save operation', () => {
      const result: ConfigurationWorkflowResult = {
        success: true,
        config: { environment: 'testing' },
        truthScore: 0.98
      };

      monitoringService.recordSaveOperation('test-config', 'testing', result, 150);

      const metrics = monitoringService.getMetrics();
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successfulOperations).toBe(1);
      expect(metrics.averageDuration).toBe(150);
      expect(metrics.currentTruthScore).toBe(0.98);

      const events = monitoringService.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('save');
      expect(events[0].success).toBe(true);
      expect(events[0].configKey).toBe('test-config');
      expect(events[0].environment).toBe('testing');
      expect(events[0].duration).toBe(150);
      expect(events[0].truthScore).toBe(0.98);
    });
  });

  describe('recordValidationOperation', () => {
    it('should record a successful validation operation', () => {
      const result: ConfigurationWorkflowResult = {
        success: true,
        config: { environment: 'testing' },
        truthScore: 0.92
      };

      monitoringService.recordValidationOperation(result, 75);

      const metrics = monitoringService.getMetrics();
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successfulOperations).toBe(1);
      expect(metrics.averageDuration).toBe(75);
      expect(metrics.currentTruthScore).toBe(0.92);

      const events = monitoringService.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('validate');
      expect(events[0].success).toBe(true);
      expect(events[0].duration).toBe(75);
      expect(events[0].truthScore).toBe(0.92);
    });
  });

  describe('recordDeleteOperation', () => {
    it('should record a successful delete operation', () => {
      const result: ConfigurationWorkflowResult = {
        success: true
      };

      monitoringService.recordDeleteOperation('test-config', result, 25);

      const metrics = monitoringService.getMetrics();
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successfulOperations).toBe(1);
      expect(metrics.averageDuration).toBe(25);

      const events = monitoringService.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('delete');
      expect(events[0].success).toBe(true);
      expect(events[0].configKey).toBe('test-config');
      expect(events[0].duration).toBe(25);
    });
  });

  describe('recordRollbackOperation', () => {
    it('should record a successful rollback operation', () => {
      const rollbackEvent: RollbackEvent = {
        timestamp: Date.now(),
        configKey: 'test-config',
        reason: 'Low truth score: 0.30',
        truthScore: 0.30,
        backupKey: 'backup_test-config_1234567890',
        success: true
      };

      monitoringService.recordRollbackOperation(rollbackEvent);

      const metrics = monitoringService.getMetrics();
      expect(metrics.rollbackCount).toBe(1);

      const events = monitoringService.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('rollback');
      expect(events[0].success).toBe(true);
      expect(events[0].configKey).toBe('test-config');
      expect(events[0].truthScore).toBe(0.30);
      expect(events[0].metadata?.reason).toBe('Low truth score: 0.30');
      expect(events[0].metadata?.backupKey).toBe('backup_test-config_1234567890');
    });
  });

  describe('recordError', () => {
    it('should record an error operation', () => {
      monitoringService.recordError('Database connection failed', { operation: 'save' });

      const metrics = monitoringService.getMetrics();
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.failedOperations).toBe(1);

      const events = monitoringService.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('error');
      expect(events[0].success).toBe(false);
      expect(events[0].error).toBe('Database connection failed');
      expect(events[0].metadata?.operation).toBe('save');
    });
  });

  describe('metrics and statistics', () => {
    it('should calculate success and failure rates correctly', () => {
      // Record some successful operations
      const successResult: ConfigurationWorkflowResult = { success: true, truthScore: 0.95 };
      monitoringService.recordLoadOperation('config1', 'testing', successResult, 100);
      monitoringService.recordLoadOperation('config2', 'testing', successResult, 100);

      // Record some failed operations
      const failureResult: ConfigurationWorkflowResult = { success: false, error: 'Failed' };
      monitoringService.recordLoadOperation('config3', 'testing', failureResult, 100);
      monitoringService.recordLoadOperation('config4', 'testing', failureResult, 100);

      expect(monitoringService.getSuccessRate()).toBe(50);
      expect(monitoringService.getFailureRate()).toBe(50);
    });

    it('should calculate average duration correctly', () => {
      const result: ConfigurationWorkflowResult = { success: true, truthScore: 0.95 };

      monitoringService.recordLoadOperation('config1', 'testing', result, 100);
      monitoringService.recordLoadOperation('config2', 'testing', result, 200);
      monitoringService.recordLoadOperation('config3', 'testing', result, 300);

      const metrics = monitoringService.getMetrics();
      expect(metrics.averageDuration).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should reset metrics correctly', () => {
      const result: ConfigurationWorkflowResult = { success: true, truthScore: 0.95 };
      monitoringService.recordLoadOperation('config1', 'testing', result, 100);

      expect(monitoringService.getMetrics().totalOperations).toBe(1);

      monitoringService.resetMetrics();

      const metrics = monitoringService.getMetrics();
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.successfulOperations).toBe(0);
      expect(metrics.failedOperations).toBe(0);
      expect(metrics.averageDuration).toBe(0);
      expect(metrics.currentTruthScore).toBe(0);
    });
  });

  describe('event filtering', () => {
    beforeEach(() => {
      // Record various types of events
      const successResult: ConfigurationWorkflowResult = { success: true, truthScore: 0.95 };
      const failureResult: ConfigurationWorkflowResult = { success: false, error: 'Failed' };

      monitoringService.recordLoadOperation('config1', 'testing', successResult, 100);
      monitoringService.recordSaveOperation('config2', 'testing', failureResult, 100);
      monitoringService.recordValidationOperation(successResult, 50);
    });

    it('should filter events by type', () => {
      const loadEvents = monitoringService.getEventsByType('load');
      const saveEvents = monitoringService.getEventsByType('save');
      const validateEvents = monitoringService.getEventsByType('validate');

      expect(loadEvents).toHaveLength(1);
      expect(loadEvents[0].type).toBe('load');

      expect(saveEvents).toHaveLength(1);
      expect(saveEvents[0].type).toBe('save');

      expect(validateEvents).toHaveLength(1);
      expect(validateEvents[0].type).toBe('validate');
    });

    it('should filter events by success status', () => {
      const successEvents = monitoringService.getEventsBySuccess(true);
      const failureEvents = monitoringService.getEventsBySuccess(false);

      expect(successEvents).toHaveLength(2); // load and validate
      expect(failureEvents).toHaveLength(1); // save

      expect(successEvents.every(event => event.success)).toBe(true);
      expect(failureEvents.every(event => !event.success)).toBe(true);
    });
  });

  describe('monitoring configuration', () => {
    it('should respect disabled monitoring', () => {
      const options: MonitoringServiceOptions = {
        monitoringConfig: {
          enabled: false,
          logAllOperations: true,
          logOnlyFailures: false,
          maxEvents: 1000,
          emitEvents: false
        }
      };

      const service = new ConfigurationMonitoringService(options);

      const result: ConfigurationWorkflowResult = { success: true, truthScore: 0.95 };
      service.recordLoadOperation('test-config', 'testing', result, 100);

      const metrics = service.getMetrics();
      expect(metrics.totalOperations).toBe(0); // Should not record anything

      const events = service.getRecentEvents();
      expect(events).toHaveLength(0);
    });

    it('should respect log only failures configuration', () => {
      const options: MonitoringServiceOptions = {
        monitoringConfig: {
          enabled: true,
          logAllOperations: false,
          logOnlyFailures: true,
          maxEvents: 1000,
          emitEvents: false
        }
      };

      const service = new ConfigurationMonitoringService(options);

      // Record successful operation (should not be logged)
      const successResult: ConfigurationWorkflowResult = { success: true, truthScore: 0.95 };
      service.recordLoadOperation('success-config', 'testing', successResult, 100);

      // Record failed operation (should be logged)
      const failureResult: ConfigurationWorkflowResult = { success: false, error: 'Failed' };
      service.recordLoadOperation('failure-config', 'testing', failureResult, 100);

      const events = service.getRecentEvents();
      expect(events).toHaveLength(1); // Only the failed operation should be logged
      expect(events[0].configKey).toBe('failure-config');
      expect(events[0].success).toBe(false);
    });

    it('should update monitoring configuration', () => {
      const initialConfig = monitoringService.getMonitoringConfig();
      expect(initialConfig.enabled).toBe(true);

      monitoringService.updateMonitoringConfig({ enabled: false });

      const updatedConfig = monitoringService.getMonitoringConfig();
      expect(updatedConfig.enabled).toBe(false);
    });
  });
});
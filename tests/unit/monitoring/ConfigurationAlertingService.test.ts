// ConfigurationAlertingService.test.ts - Unit tests for ConfigurationAlertingService
// Phase 4: Environment Configuration Management - Task 15: Implement alerting system for configuration security incidents

import { ConfigurationAlertingService, AlertingServiceOptions } from '../../src/monitoring/ConfigurationAlertingService';
import { MonitoringEvent } from '../../src/monitoring/ConfigurationMonitoringService';

describe('ConfigurationAlertingService', () => {
  let alertingService: ConfigurationAlertingService;

  beforeEach(() => {
    alertingService = new ConfigurationAlertingService();
  });

  describe('constructor', () => {
    it('should create an instance with default options', () => {
      expect(alertingService).toBeInstanceOf(ConfigurationAlertingService);

      const config = alertingService.getAlertConfig();
      expect(config.enabled).toBe(true);
      expect(config.truthScoreThreshold).toBe(0.8);
      expect(config.failureRateThreshold).toBe(5);
      expect(config.rollbackCountThreshold).toBe(3);
      expect(config.timeWindow).toBe(300000);
      expect(config.alertCooldown).toBe(300000);
      expect(config.alertOnChanges).toBe(true);
      expect(config.alertOnSecurityViolations).toBe(true);
    });

    it('should create an instance with custom options', () => {
      const options: AlertingServiceOptions = {
        alertConfig: {
          enabled: false,
          truthScoreThreshold: 0.9,
          failureRateThreshold: 10,
          rollbackCountThreshold: 5,
          timeWindow: 600000,
          alertCooldown: 600000,
          alertOnChanges: false,
          alertOnSecurityViolations: false
        }
      };

      const service = new ConfigurationAlertingService(options);

      const config = service.getAlertConfig();
      expect(config.enabled).toBe(false);
      expect(config.truthScoreThreshold).toBe(0.9);
      expect(config.failureRateThreshold).toBe(10);
      expect(config.rollbackCountThreshold).toBe(5);
      expect(config.timeWindow).toBe(600000);
      expect(config.alertCooldown).toBe(600000);
      expect(config.alertOnChanges).toBe(false);
      expect(config.alertOnSecurityViolations).toBe(false);
    });
  });

  describe('processMonitoringEvent', () => {
    beforeEach(() => {
      // Mock console.log to prevent output during tests
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      // Restore console.log
      jest.restoreAllMocks();
    });

    it('should not generate alerts when alerting is disabled', () => {
      const options: AlertingServiceOptions = {
        alertConfig: {
          enabled: false,
          truthScoreThreshold: 0.8,
          failureRateThreshold: 5,
          rollbackCountThreshold: 3,
          timeWindow: 300000,
          alertCooldown: 300000,
          alertOnChanges: true,
          alertOnSecurityViolations: true
        }
      };

      const service = new ConfigurationAlertingService(options);
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'load',
        configKey: 'test-config',
        environment: 'testing',
        truthScore: 0.5, // Below threshold
        success: true
      };

      service.processMonitoringEvent(event);

      const alerts = service.getRecentAlerts();
      expect(alerts).toHaveLength(0);
    });

    it('should generate low truth score alert for load operations', () => {
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'load',
        configKey: 'test-config',
        environment: 'testing',
        truthScore: 0.5, // Below threshold (0.8)
        success: true
      };

      alertingService.processMonitoringEvent(event);

      const alerts = alertingService.getRecentAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('low_truth_score');
      expect(alerts[0].severity).toBe('high');
      expect(alerts[0].configKey).toBe('test-config');
      expect(alerts[0].environment).toBe('testing');
      expect(alerts[0].truthScore).toBe(0.5);
    });

    it('should generate low truth score alert for save operations', () => {
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'save',
        configKey: 'test-config',
        environment: 'testing',
        truthScore: 0.3, // Below threshold (0.8)
        success: false,
        error: 'Validation failed'
      };

      alertingService.processMonitoringEvent(event);

      const alerts = alertingService.getRecentAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('low_truth_score');
      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].configKey).toBe('test-config');
      expect(alerts[0].environment).toBe('testing');
      expect(alerts[0].truthScore).toBe(0.3);
    });

    it('should generate security violation alert when enabled', () => {
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'save',
        configKey: 'test-config',
        environment: 'testing',
        success: true,
        metadata: {
          securityViolations: 'Exposed API token detected'
        }
      };

      alertingService.processMonitoringEvent(event);

      const alerts = alertingService.getRecentAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('security_violation');
      expect(alerts[0].severity).toBe('high');
      expect(alerts[0].configKey).toBe('test-config');
      expect(alerts[0].environment).toBe('testing');
      expect(alerts[0].message).toContain('Security violation detected');
    });

    it('should not generate security violation alert when disabled', () => {
      const options: AlertingServiceOptions = {
        alertConfig: {
          enabled: true,
          truthScoreThreshold: 0.8,
          failureRateThreshold: 5,
          rollbackCountThreshold: 3,
          timeWindow: 300000,
          alertCooldown: 300000,
          alertOnChanges: true,
          alertOnSecurityViolations: false
        }
      };

      const service = new ConfigurationAlertingService(options);
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'save',
        configKey: 'test-config',
        environment: 'testing',
        success: true,
        metadata: {
          securityViolations: 'Exposed API token detected'
        }
      };

      service.processMonitoringEvent(event);

      const alerts = service.getRecentAlerts();
      expect(alerts).toHaveLength(0);
    });

    it('should generate rollback alert when rollback count exceeds threshold', () => {
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'rollback',
        configKey: 'test-config',
        success: true,
        metadata: {
          rollbackCount: 5, // Exceeds threshold (3)
          reason: 'Low truth score',
          backupKey: 'backup_test-config_1234567890'
        }
      };

      alertingService.processMonitoringEvent(event);

      const alerts = alertingService.getRecentAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('excessive_rollbacks');
      expect(alerts[0].severity).toBe('high');
      expect(alerts[0].configKey).toBe('test-config');
      expect(alerts[0].rollbackCount).toBe(5);
      expect(alerts[0].message).toContain('Excessive rollbacks detected');
    });

    it('should generate configuration change alert for save operations when enabled', () => {
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'save',
        configKey: 'test-config',
        environment: 'testing',
        success: true
      };

      alertingService.processMonitoringEvent(event);

      const alerts = alertingService.getRecentAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('configuration_change');
      expect(alerts[0].severity).toBe('low');
      expect(alerts[0].configKey).toBe('test-config');
      expect(alerts[0].environment).toBe('testing');
      expect(alerts[0].message).toContain('was modified');
    });

    it('should generate configuration change alert for delete operations when enabled', () => {
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'delete',
        configKey: 'test-config',
        environment: 'testing',
        success: false,
        error: 'Delete failed'
      };

      alertingService.processMonitoringEvent(event);

      const alerts = alertingService.getRecentAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('configuration_change');
      expect(alerts[0].severity).toBe('medium');
      expect(alerts[0].configKey).toBe('test-config');
      expect(alerts[0].environment).toBe('testing');
      expect(alerts[0].message).toContain('was deleted');
    });

    it('should not generate configuration change alert when disabled', () => {
      const options: AlertingServiceOptions = {
        alertConfig: {
          enabled: true,
          truthScoreThreshold: 0.8,
          failureRateThreshold: 5,
          rollbackCountThreshold: 3,
          timeWindow: 300000,
          alertCooldown: 300000,
          alertOnChanges: false,
          alertOnSecurityViolations: true
        }
      };

      const service = new ConfigurationAlertingService(options);
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'save',
        configKey: 'test-config',
        environment: 'testing',
        success: true
      };

      service.processMonitoringEvent(event);

      const alerts = service.getRecentAlerts();
      expect(alerts).toHaveLength(0);
    });

    it('should respect alert cooldown period', () => {
      // First alert
      const event1: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'load',
        configKey: 'test-config',
        environment: 'testing',
        truthScore: 0.5,
        success: true
      };

      alertingService.processMonitoringEvent(event1);

      // Second alert within cooldown period
      const event2: MonitoringEvent = {
        timestamp: Date.now() + 10000, // 10 seconds later
        type: 'load',
        configKey: 'test-config-2',
        environment: 'testing',
        truthScore: 0.3,
        success: true
      };

      alertingService.processMonitoringEvent(event2);

      const alerts = alertingService.getRecentAlerts();
      expect(alerts).toHaveLength(1); // Should only have first alert
    });
  });

  describe('alert filtering and retrieval', () => {
    beforeEach(() => {
      // Mock console.log to prevent output during tests
      jest.spyOn(console, 'log').mockImplementation(() => {});

      // Generate some alerts
      const lowTruthScoreEvent: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'load',
        configKey: 'test-config-1',
        environment: 'testing',
        truthScore: 0.5,
        success: true
      };

      const securityViolationEvent: MonitoringEvent = {
        timestamp: Date.now() + 1000,
        type: 'save',
        configKey: 'test-config-2',
        environment: 'testing',
        success: true,
        metadata: {
          securityViolations: 'Exposed token'
        }
      };

      const configChangeEvent: MonitoringEvent = {
        timestamp: Date.now() + 2000,
        type: 'save',
        configKey: 'test-config-3',
        environment: 'testing',
        success: true
      };

      alertingService.processMonitoringEvent(lowTruthScoreEvent);
      alertingService.processMonitoringEvent(securityViolationEvent);
      alertingService.processMonitoringEvent(configChangeEvent);
    });

    afterEach(() => {
      // Restore console.log
      jest.restoreAllMocks();
    });

    it('should filter alerts by type', () => {
      const lowTruthScoreAlerts = alertingService.getAlertsByType('low_truth_score');
      const securityViolationAlerts = alertingService.getAlertsByType('security_violation');
      const configChangeAlerts = alertingService.getAlertsByType('configuration_change');

      expect(lowTruthScoreAlerts).toHaveLength(1);
      expect(lowTruthScoreAlerts[0].type).toBe('low_truth_score');

      expect(securityViolationAlerts).toHaveLength(1);
      expect(securityViolationAlerts[0].type).toBe('security_violation');

      expect(configChangeAlerts).toHaveLength(1);
      expect(configChangeAlerts[0].type).toBe('configuration_change');
    });

    it('should filter alerts by severity', () => {
      const highSeverityAlerts = alertingService.getAlertsBySeverity('high');
      const lowSeverityAlerts = alertingService.getAlertsBySeverity('low');

      expect(highSeverityAlerts).toHaveLength(1);
      expect(highSeverityAlerts[0].severity).toBe('high');
      expect(highSeverityAlerts[0].type).toBe('security_violation');

      expect(lowSeverityAlerts).toHaveLength(1);
      expect(lowSeverityAlerts[0].severity).toBe('low');
      expect(lowSeverityAlerts[0].type).toBe('configuration_change');
    });

    it('should limit recent alerts', () => {
      const limitedAlerts = alertingService.getRecentAlerts(2);
      expect(limitedAlerts).toHaveLength(2);
    });
  });

  describe('alert configuration management', () => {
    it('should update alert configuration', () => {
      const initialConfig = alertingService.getAlertConfig();
      expect(initialConfig.truthScoreThreshold).toBe(0.8);

      alertingService.updateAlertConfig({ truthScoreThreshold: 0.9 });

      const updatedConfig = alertingService.getAlertConfig();
      expect(updatedConfig.truthScoreThreshold).toBe(0.9);
    });

    it('should clear alert history', () => {
      // Mock console.log to prevent output during tests
      jest.spyOn(console, 'log').mockImplementation(() => {});

      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'load',
        configKey: 'test-config',
        environment: 'testing',
        truthScore: 0.5,
        success: true
      };

      alertingService.processMonitoringEvent(event);
      expect(alertingService.getRecentAlerts()).toHaveLength(1);

      alertingService.clearAlertHistory();
      expect(alertingService.getRecentAlerts()).toHaveLength(0);

      // Restore console.log
      jest.restoreAllMocks();
    });
  });

  describe('alert statistics', () => {
    beforeEach(() => {
      // Mock console.log to prevent output during tests
      jest.spyOn(console, 'log').mockImplementation(() => {});

      // Generate various alerts
      const lowTruthScoreEvent: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'load',
        configKey: 'test-config-1',
        environment: 'testing',
        truthScore: 0.5,
        success: true
      };

      const securityViolationEvent: MonitoringEvent = {
        timestamp: Date.now() + 1000,
        type: 'save',
        configKey: 'test-config-2',
        environment: 'testing',
        success: true,
        metadata: {
          securityViolations: 'Exposed token'
        }
      };

      const configChangeEvent: MonitoringEvent = {
        timestamp: Date.now() + 2000,
        type: 'save',
        configKey: 'test-config-3',
        environment: 'testing',
        success: true
      };

      const criticalTruthScoreEvent: MonitoringEvent = {
        timestamp: Date.now() + 3000,
        type: 'load',
        configKey: 'test-config-4',
        environment: 'testing',
        truthScore: 0.3,
        success: true
      };

      alertingService.processMonitoringEvent(lowTruthScoreEvent);
      alertingService.processMonitoringEvent(securityViolationEvent);
      alertingService.processMonitoringEvent(configChangeEvent);
      alertingService.processMonitoringEvent(criticalTruthScoreEvent);
    });

    afterEach(() => {
      // Restore console.log
      jest.restoreAllMocks();
    });

    it('should calculate alert statistics correctly', () => {
      const stats = alertingService.getAlertStatistics();

      expect(stats.total).toBe(4);
      expect(stats.low_truth_score).toBe(2);
      expect(stats.security_violation).toBe(1);
      expect(stats.configuration_change).toBe(1);
      expect(stats.critical).toBe(1);
      expect(stats.high).toBe(1);
      expect(stats.low).toBe(2);
    });
  });
});
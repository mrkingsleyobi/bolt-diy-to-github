// MonitoringService.test.ts - Tests for Monitoring Service
// Phase 5: Deployment Orchestration System - Task 28: Write Monitoring Service Tests

import { BasicMonitoringService } from '../../src/deployment/monitoring/BasicMonitoringService';
import { DeploymentStatus, DeploymentMetrics } from '../../src/deployment/DeploymentTypes';

describe('MonitoringService', () => {
  let monitoringService: BasicMonitoringService;
  const testDeploymentId = 'test-deployment-123';

  beforeEach(() => {
    monitoringService = new BasicMonitoringService();
  });

  describe('BasicMonitoringService', () => {
    it('should start deployment monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      monitoringService.startDeploymentMonitoring(testDeploymentId);

      expect(consoleSpy).toHaveBeenCalledWith(`Starting monitoring for deployment ${testDeploymentId}`);

      consoleSpy.mockRestore();
    });

    it('should stop deployment monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      monitoringService.stopDeploymentMonitoring(testDeploymentId);

      expect(consoleSpy).toHaveBeenCalledWith(`Stopping monitoring for deployment ${testDeploymentId}`);

      consoleSpy.mockRestore();
    });

    it('should update deployment status', () => {
      const mockStatus: DeploymentStatus = {
        deploymentId: testDeploymentId,
        status: 'in-progress',
        progress: 50,
        currentStage: 'deploying',
        startedAt: Date.now() - 10000,
        updatedAt: Date.now(),
        estimatedCompletion: Date.now() + 50000,
        errors: []
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      monitoringService.updateDeploymentStatus(testDeploymentId, mockStatus);

      expect(consoleSpy).toHaveBeenCalledWith('[INFO] [monitoring-service] Deployment status updated to in-progress');

      consoleSpy.mockRestore();
    });

    it('should get default deployment metrics', async () => {
      const metrics = await monitoringService.getDeploymentMetrics(testDeploymentId);

      expect(metrics).toEqual({
        preparationTime: 0,
        stagingTime: 0,
        validationTime: 0,
        promotionTime: 0,
        verificationTime: 0,
        totalDeploymentTime: 0,
        filesTransferred: 0,
        dataTransferred: 0,
        resourceUtilization: {
          cpu: 0,
          memory: 0,
          network: 0
        }
      });
    });

    it('should log deployment events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockLogEntry = {
        id: 'log-123',
        deploymentId: testDeploymentId,
        timestamp: Date.now(),
        level: 'info' as const,
        component: 'test-component',
        message: 'Test log message',
        context: {}
      };

      monitoringService.logDeploymentEvent(testDeploymentId, mockLogEntry);

      expect(consoleSpy).toHaveBeenCalledWith('[INFO] [test-component] Test log message');

      consoleSpy.mockRestore();
    });

    it('should alert on deployment issues', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockAlert = {
        id: 'alert-123',
        deploymentId: testDeploymentId,
        severity: 'high' as const,
        message: 'Test alert message',
        timestamp: Date.now(),
        resolved: false
      };

      monitoringService.alertOnDeploymentIssue(testDeploymentId, mockAlert);

      expect(consoleSpy).toHaveBeenCalledWith('[WARN] [monitoring-service] Deployment alert: Test alert message');

      consoleSpy.mockRestore();
    });

    it('should get deployment logs', async () => {
      const mockLogEntry = {
        id: 'log-123',
        deploymentId: testDeploymentId,
        timestamp: Date.now(),
        level: 'info' as const,
        component: 'test-component',
        message: 'Test log message',
        context: {}
      };

      monitoringService.logDeploymentEvent(testDeploymentId, mockLogEntry);

      const logs = await monitoringService.getDeploymentLogs(testDeploymentId);

      expect(logs.length).toBe(1);
      expect(logs[0]).toEqual(mockLogEntry);
    });

    it('should get deployment alerts', async () => {
      const mockAlert = {
        id: 'alert-123',
        deploymentId: testDeploymentId,
        severity: 'high' as const,
        message: 'Test alert message',
        timestamp: Date.now(),
        resolved: false
      };

      monitoringService.alertOnDeploymentIssue(testDeploymentId, mockAlert);

      const alerts = await monitoringService.getDeploymentAlerts(testDeploymentId);

      expect(alerts.length).toBe(1);
      expect(alerts[0]).toEqual(mockAlert);
    });

    it('should resolve deployment alerts', async () => {
      const mockAlert = {
        id: 'alert-123',
        deploymentId: testDeploymentId,
        severity: 'high' as const,
        message: 'Test alert message',
        timestamp: Date.now(),
        resolved: false
      };

      monitoringService.alertOnDeploymentIssue(testDeploymentId, mockAlert);

      await monitoringService.resolveDeploymentAlert('alert-123');

      const alerts = await monitoringService.getDeploymentAlerts(testDeploymentId);
      expect(alerts[0].resolved).toBe(true);
    });

    it('should throw error when resolving non-existent alert', async () => {
      await expect(monitoringService.resolveDeploymentAlert('non-existent-alert'))
        .rejects.toThrow('Alert non-existent-alert not found');
    });

    it('should register and unregister alert callbacks', () => {
      const mockCallback = jest.fn();

      monitoringService.registerAlertCallback(mockCallback);

      const mockAlert = {
        id: 'alert-123',
        deploymentId: testDeploymentId,
        severity: 'high' as const,
        message: 'Test alert message',
        timestamp: Date.now(),
        resolved: false
      };

      monitoringService.alertOnDeploymentIssue(testDeploymentId, mockAlert);

      expect(mockCallback).toHaveBeenCalledWith(mockAlert);

      // Reset mock
      mockCallback.mockReset();

      monitoringService.unregisterAlertCallback(mockCallback);

      monitoringService.alertOnDeploymentIssue(testDeploymentId, mockAlert);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should check for alerts based on deployment status', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockStatus: DeploymentStatus = {
        deploymentId: testDeploymentId,
        status: 'in-progress',
        progress: 10,
        currentStage: 'deploying',
        startedAt: Date.now() - 3600000, // 1 hour ago
        updatedAt: Date.now(),
        estimatedCompletion: Date.now() + 50000,
        errors: []
      };

      monitoringService.updateDeploymentStatus(testDeploymentId, mockStatus);

      expect(consoleSpy).toHaveBeenCalledWith('[WARN] [monitoring-service] Deployment alert: Deployment taking longer than expected (3600s)');

      consoleSpy.mockRestore();
    });

    it('should update deployment metrics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockMetrics: DeploymentMetrics = {
        preparationTime: 1000,
        stagingTime: 2000,
        validationTime: 500,
        promotionTime: 3000,
        verificationTime: 1500,
        totalDeploymentTime: 8000,
        filesTransferred: 10,
        dataTransferred: 1024000,
        resourceUtilization: {
          cpu: 75,
          memory: 60,
          network: 50
        }
      };

      monitoringService.updateDeploymentMetrics(testDeploymentId, mockMetrics);

      expect(consoleSpy).toHaveBeenCalledWith('[INFO] [monitoring-service] Deployment metrics updated');

      consoleSpy.mockRestore();
    });
  });
});
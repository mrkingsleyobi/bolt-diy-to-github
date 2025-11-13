// DeploymentCoordinator.test.ts - Tests for Deployment Coordinator
// Phase 5: Deployment Orchestration System - Task 30: Write Deployment Coordinator Tests

import { BasicDeploymentCoordinator } from '../../src/deployment/coordinator/BasicDeploymentCoordinator';
import { DeploymentRequest, DeploymentOptions, DeploymentFilter } from '../../src/deployment/DeploymentTypes';
import { EnvironmentManager } from '../../src/deployment/EnvironmentManager';
import { SecurityManager } from '../../src/deployment/SecurityManager';
import { MonitoringService } from '../../src/deployment/MonitoringService';
import { RollbackService } from '../../src/deployment/RollbackService';

describe('DeploymentCoordinator', () => {
  let deploymentCoordinator: BasicDeploymentCoordinator;
  let mockEnvironmentManager: jest.Mocked<EnvironmentManager>;
  let mockSecurityManager: jest.Mocked<SecurityManager>;
  let mockMonitoringService: jest.Mocked<MonitoringService>;
  let mockRollbackService: jest.Mocked<RollbackService>;
  let mockDeploymentRequest: DeploymentRequest;
  let mockDeploymentOptions: DeploymentOptions;

  beforeEach(() => {
    // Create mock services
    mockEnvironmentManager = {
      getEnvironment: jest.fn(),
      validateEnvironment: jest.fn(),
      prepareEnvironment: jest.fn(),
      cleanupEnvironment: jest.fn(),
      isEnvironmentAvailable: jest.fn()
    } as any;

    mockSecurityManager = {
      authenticateDeployment: jest.fn(),
      authorizeDeployment: jest.fn(),
      encryptDeploymentPackage: jest.fn(),
      decryptDeploymentPackage: jest.fn(),
      scanForVulnerabilities: jest.fn(),
      validateSecurityPolicies: jest.fn()
    } as any;

    mockMonitoringService = {
      startDeploymentMonitoring: jest.fn(),
      stopDeploymentMonitoring: jest.fn(),
      updateDeploymentStatus: jest.fn(),
      getDeploymentMetrics: jest.fn(),
      logDeploymentEvent: jest.fn(),
      alertOnDeploymentIssue: jest.fn(),
      getDeploymentLogs: jest.fn(),
      getDeploymentAlerts: jest.fn(),
      resolveDeploymentAlert: jest.fn(),
      registerAlertCallback: jest.fn(),
      unregisterAlertCallback: jest.fn(),
      updateDeploymentMetrics: jest.fn()
    } as any;

    mockRollbackService = {
      prepareRollback: jest.fn(),
      executeRollback: jest.fn(),
      validateRollback: jest.fn(),
      getRollbackHistory: jest.fn(),
      canRollback: jest.fn(),
      getPreviousDeploymentState: jest.fn(),
      recordDeployment: jest.fn(),
      updateDeploymentRecord: jest.fn(),
      registerStrategy: jest.fn()
    } as any;

    deploymentCoordinator = new BasicDeploymentCoordinator(
      mockEnvironmentManager,
      mockSecurityManager,
      mockMonitoringService,
      mockRollbackService
    );

    mockDeploymentRequest = {
      id: 'test-deployment-123',
      projectId: 'test-project-456',
      projectName: 'Test Project',
      sourceEnvironment: 'development',
      targetEnvironment: 'staging',
      strategy: 'blue-green',
      files: [
        {
          path: '/src/index.js',
          content: 'console.log("Hello World");',
          hash: 'abc123def456',
          size: 1024
        }
      ],
      configuration: {
        strategy: 'blue-green',
        targetEnvironment: 'staging',
        rollbackEnabled: true,
        validationChecks: ['unit'],
        notificationChannels: ['console'],
        timeout: 30000,
        securityChecks: ['encryption', 'vulnerability-scan']
      },
      metadata: {
        version: '1.0.0',
        commitHash: 'abc123',
        branch: 'main',
        buildId: 'build-789',
        tags: ['test']
      },
      initiatedBy: 'test-user',
      initiatedAt: Date.now()
    };

    mockDeploymentOptions = {
      maxConcurrentDeployments: 5,
      defaultTimeout: 300000,
      enableRollback: true,
      enableMonitoring: true
    };
  });

  describe('BasicDeploymentCoordinator', () => {
    it('should initialize with default options', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await deploymentCoordinator.initialize(mockDeploymentOptions);

      expect(consoleSpy).toHaveBeenCalledWith('Deployment coordinator initialized');

      consoleSpy.mockRestore();
    });

    it('should throw error when starting deployment without initialization', async () => {
      await expect(deploymentCoordinator.startDeployment(mockDeploymentRequest))
        .rejects.toThrow('Deployment coordinator not initialized');
    });

    it('should start deployment successfully', async () => {
      // Initialize first
      await deploymentCoordinator.initialize(mockDeploymentOptions);

      // Mock all service calls
      mockSecurityManager.authenticateDeployment.mockResolvedValue(true);
      mockSecurityManager.authorizeDeployment.mockResolvedValue(true);
      mockSecurityManager.scanForVulnerabilities.mockResolvedValue({
        passed: true,
        vulnerabilities: [],
        recommendations: [],
        scannedAt: Date.now()
      });
      mockSecurityManager.validateSecurityPolicies.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: []
      });

      mockEnvironmentManager.validateEnvironment.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: []
      });

      mockEnvironmentManager.prepareEnvironment.mockResolvedValue();
      mockEnvironmentManager.cleanupEnvironment.mockResolvedValue();

      // Mock strategy execution by calling the actual strategy
      const { BlueGreenDeploymentStrategy } = await import('../../src/deployment/strategies/BlueGreenDeploymentStrategy');
      const strategy = new BlueGreenDeploymentStrategy();
      const strategyExecuteSpy = jest.spyOn(strategy, 'execute').mockResolvedValue({
        deploymentId: 'test-deployment-123',
        status: 'success',
        message: 'Deployment successful',
        deployedAt: Date.now(),
        duration: 5000,
        metrics: {
          preparationTime: 1000,
          stagingTime: 2000,
          validationTime: 500,
          promotionTime: 1000,
          verificationTime: 500,
          totalDeploymentTime: 5000,
          filesTransferred: 1,
          dataTransferred: 1024,
          resourceUtilization: {
            cpu: 50,
            memory: 60,
            network: 40
          }
        },
        artifacts: []
      });

      // Temporarily replace the strategy in the coordinator
      const strategiesMap = new Map();
      strategiesMap.set('blue-green', strategy);
      (deploymentCoordinator as any).strategies = strategiesMap;

      const result = await deploymentCoordinator.startDeployment(mockDeploymentRequest);

      expect(result.deploymentId).toBe('test-deployment-123');
      expect(result.status).toBe('success');
      expect(strategyExecuteSpy).toHaveBeenCalledWith(mockDeploymentRequest);

      // Verify monitoring calls
      expect(mockMonitoringService.startDeploymentMonitoring).toHaveBeenCalledWith('test-deployment-123');
      expect(mockMonitoringService.stopDeploymentMonitoring).toHaveBeenCalledWith('test-deployment-123');
      expect(mockMonitoringService.logDeploymentEvent).toHaveBeenCalledWith('test-deployment-123', expect.objectContaining({
        message: 'Deployment completed successfully'
      }));
    });

    it('should handle deployment failure and attempt rollback', async () => {
      // Initialize first
      await deploymentCoordinator.initialize(mockDeploymentOptions);

      // Mock service calls to cause failure
      mockSecurityManager.authenticateDeployment.mockResolvedValue(true);
      mockSecurityManager.authorizeDeployment.mockResolvedValue(true);
      mockSecurityManager.scanForVulnerabilities.mockResolvedValue({
        passed: false,
        vulnerabilities: [{
          id: 'SEC001',
          severity: 'high',
          description: 'Security vulnerability found',
          file: '/src/index.js',
          line: 1,
          remediation: 'Fix the vulnerability'
        }],
        recommendations: [],
        scannedAt: Date.now()
      });

      mockEnvironmentManager.validateEnvironment.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: []
      });

      mockEnvironmentManager.prepareEnvironment.mockResolvedValue();
      mockEnvironmentManager.cleanupEnvironment.mockResolvedValue();

      mockRollbackService.prepareRollback.mockResolvedValue();
      mockRollbackService.executeRollback.mockResolvedValue(true);

      await expect(deploymentCoordinator.startDeployment(mockDeploymentRequest))
        .rejects.toThrow('Security scan failed with vulnerabilities: SEC001: Security vulnerability found (high)');

      // Verify rollback was attempted
      expect(mockRollbackService.prepareRollback).toHaveBeenCalledWith('test-deployment-123');
      expect(mockRollbackService.executeRollback).toHaveBeenCalledWith('test-deployment-123');

      // Verify monitoring calls for failure
      expect(mockMonitoringService.logDeploymentEvent).toHaveBeenCalledWith('test-deployment-123', expect.objectContaining({
        message: 'Deployment failed'
      }));
      expect(mockMonitoringService.logDeploymentEvent).toHaveBeenCalledWith('test-deployment-123', expect.objectContaining({
        message: 'Attempting rollback'
      }));
      expect(mockMonitoringService.logDeploymentEvent).toHaveBeenCalledWith('test-deployment-123', expect.objectContaining({
        message: 'Rollback completed'
      }));
    });

    it('should get deployment status', async () => {
      // Initialize first
      await deploymentCoordinator.initialize(mockDeploymentOptions);

      // Mock strategy status
      const { BlueGreenDeploymentStrategy } = await import('../../src/deployment/strategies/BlueGreenDeploymentStrategy');
      const strategy = new BlueGreenDeploymentStrategy();
      const strategyGetStatusSpy = jest.spyOn(strategy, 'getDeploymentStatus').mockResolvedValue({
        deploymentId: 'test-deployment-123',
        status: 'in-progress',
        progress: 50,
        currentStage: 'deploying',
        startedAt: Date.now() - 10000,
        updatedAt: Date.now(),
        estimatedCompletion: Date.now() + 50000,
        errors: []
      });

      // Temporarily replace the strategy in the coordinator
      const strategiesMap = new Map();
      strategiesMap.set('blue-green', strategy);
      (deploymentCoordinator as any).strategies = strategiesMap;

      // Mock deployment record
      const mockDeploymentRecord = {
        id: 'test-deployment-123',
        projectId: 'test-project-456',
        projectName: 'Test Project',
        sourceEnvironment: 'development',
        targetEnvironment: 'staging',
        strategy: 'blue-green',
        status: 'initiated',
        initiatedBy: 'test-user',
        initiatedAt: Date.now() - 10000
      };
      (deploymentCoordinator as any).deploymentRecords.set('test-deployment-123', mockDeploymentRecord);

      const status = await deploymentCoordinator.getDeploymentStatus('test-deployment-123');

      expect(status.deploymentId).toBe('test-deployment-123');
      expect(strategyGetStatusSpy).toHaveBeenCalledWith('test-deployment-123');
    });

    it('should cancel deployment', async () => {
      // Initialize first
      await deploymentCoordinator.initialize(mockDeploymentOptions);

      // Mock deployment record
      const mockDeploymentRecord = {
        id: 'test-deployment-123',
        projectId: 'test-project-456',
        projectName: 'Test Project',
        sourceEnvironment: 'development',
        targetEnvironment: 'staging',
        strategy: 'blue-green',
        status: 'initiated',
        initiatedBy: 'test-user',
        initiatedAt: Date.now()
      };
      (deploymentCoordinator as any).deploymentRecords.set('test-deployment-123', mockDeploymentRecord);

      await deploymentCoordinator.cancelDeployment('test-deployment-123');

      const updatedRecord = (deploymentCoordinator as any).deploymentRecords.get('test-deployment-123');
      expect(updatedRecord.status).toBe('cancelled');
      expect(mockMonitoringService.logDeploymentEvent).toHaveBeenCalledWith('test-deployment-123', expect.objectContaining({
        message: 'Deployment cancelled'
      }));
    });

    it('should throw error when cancelling non-existent deployment', async () => {
      // Initialize first
      await deploymentCoordinator.initialize(mockDeploymentOptions);

      await expect(deploymentCoordinator.cancelDeployment('non-existent-deployment'))
        .rejects.toThrow('Deployment non-existent-deployment not found');
    });

    it('should get deployment history with filters', async () => {
      // Initialize first
      await deploymentCoordinator.initialize(mockDeploymentOptions);

      // Add some deployment records
      const mockDeploymentRecord1 = {
        id: 'test-deployment-123',
        projectId: 'test-project-456',
        projectName: 'Test Project',
        sourceEnvironment: 'development',
        targetEnvironment: 'staging',
        strategy: 'blue-green',
        status: 'completed',
        initiatedBy: 'test-user',
        initiatedAt: Date.now() - 10000
      };

      const mockDeploymentRecord2 = {
        id: 'test-deployment-456',
        projectId: 'test-project-789',
        projectName: 'Test Project 2',
        sourceEnvironment: 'staging',
        targetEnvironment: 'production',
        strategy: 'rolling',
        status: 'failed',
        initiatedBy: 'test-user-2',
        initiatedAt: Date.now() - 5000
      };

      (deploymentCoordinator as any).deploymentRecords.set('test-deployment-123', mockDeploymentRecord1);
      (deploymentCoordinator as any).deploymentRecords.set('test-deployment-456', mockDeploymentRecord2);

      // Get all records
      const allRecords = await deploymentCoordinator.getDeploymentHistory();
      expect(allRecords.length).toBe(2);

      // Filter by project ID
      const filteredRecords = await deploymentCoordinator.getDeploymentHistory({
        projectId: 'test-project-456'
      } as DeploymentFilter);
      expect(filteredRecords.length).toBe(1);
      expect(filteredRecords[0].projectId).toBe('test-project-456');
    });

    it('should destroy coordinator', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await deploymentCoordinator.destroy();

      expect(consoleSpy).toHaveBeenCalledWith('Deployment coordinator destroyed');

      consoleSpy.mockRestore();
    });
  });
});
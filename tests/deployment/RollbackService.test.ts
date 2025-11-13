// RollbackService.test.ts - Tests for Rollback Service
// Phase 5: Deployment Orchestration System - Task 29: Write Rollback Service Tests

import { BasicRollbackService } from '../../src/deployment/rollback/BasicRollbackService';
import { DeploymentRequest, DeploymentRecord } from '../../src/deployment/DeploymentTypes';
import { DeploymentStrategy } from '../../src/deployment/DeploymentStrategy';

describe('RollbackService', () => {
  let rollbackService: BasicRollbackService;
  let mockDeploymentRequest: DeploymentRequest;
  let mockDeploymentRecord: DeploymentRecord;

  beforeEach(() => {
    rollbackService = new BasicRollbackService();

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
        securityChecks: []
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

    mockDeploymentRecord = {
      id: 'test-deployment-123',
      projectId: 'test-project-456',
      projectName: 'Test Project',
      sourceEnvironment: 'development',
      targetEnvironment: 'staging',
      strategy: 'blue-green',
      status: 'completed',
      initiatedBy: 'test-user',
      initiatedAt: Date.now(),
      completedAt: Date.now() + 5000,
      duration: 5000,
      result: {
        deploymentId: 'test-deployment-123',
        status: 'success',
        message: 'Deployment successful',
        deployedAt: Date.now() + 5000,
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
      }
    };
  });

  describe('BasicRollbackService', () => {
    it('should register strategy', () => {
      const mockStrategy = {
        getName: jest.fn().mockReturnValue('test-strategy')
      } as unknown as DeploymentStrategy;

      rollbackService.registerStrategy(mockStrategy);

      // We can't directly test the internal strategyMap, but we can test the behavior
      expect(mockStrategy.getName).toHaveBeenCalled();
    });

    it('should prepare rollback', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await rollbackService.prepareRollback('test-deployment-123');

      expect(consoleSpy).toHaveBeenCalledWith('Preparing rollback for deployment test-deployment-123');

      const rollbackHistory = await rollbackService.getRollbackHistory('test-deployment-123');
      expect(rollbackHistory.length).toBe(1);
      expect(rollbackHistory[0].deploymentId).toBe('test-deployment-123');
      expect(rollbackHistory[0].status).toBe('initiated');

      consoleSpy.mockRestore();
    });

    it('should execute rollback successfully', async () => {
      // First prepare the deployment record
      rollbackService.recordDeployment(mockDeploymentRecord);

      // Create a mock strategy
      const mockStrategy = {
        getName: jest.fn().mockReturnValue('blue-green'),
        rollback: jest.fn().mockResolvedValue({
          success: true,
          message: 'Rollback successful',
          artifacts: []
        })
      } as unknown as DeploymentStrategy;

      rollbackService.registerStrategy(mockStrategy);

      // Prepare rollback first
      await rollbackService.prepareRollback('test-deployment-123');

      // Execute rollback
      const result = await rollbackService.executeRollback('test-deployment-123');

      expect(result).toBe(true);
      expect(mockStrategy.rollback).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-deployment-123',
        strategy: 'blue-green'
      }));

      // Check that rollback record was updated
      const rollbackHistory = await rollbackService.getRollbackHistory('test-deployment-123');
      expect(rollbackHistory[0].status).toBe('completed');
    });

    it('should handle rollback execution failure', async () => {
      // First prepare the deployment record
      rollbackService.recordDeployment(mockDeploymentRecord);

      // Create a mock strategy that fails
      const mockStrategy = {
        getName: jest.fn().mockReturnValue('blue-green'),
        rollback: jest.fn().mockResolvedValue({
          success: false,
          message: 'Rollback failed',
          artifacts: []
        })
      } as unknown as DeploymentStrategy;

      rollbackService.registerStrategy(mockStrategy);

      // Prepare rollback first
      await rollbackService.prepareRollback('test-deployment-123');

      // Execute rollback
      const result = await rollbackService.executeRollback('test-deployment-123');

      expect(result).toBe(false);

      // Check that rollback record was updated with failure
      const rollbackHistory = await rollbackService.getRollbackHistory('test-deployment-123');
      expect(rollbackHistory[0].status).toBe('failed');
    });

    it('should validate rollback with errors', async () => {
      const result = await rollbackService.validateRollback('non-existent-deployment');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Deployment non-existent-deployment not found in history');
    });

    it('should validate rollback successfully', async () => {
      rollbackService.recordDeployment(mockDeploymentRecord);
      const result = await rollbackService.validateRollback('test-deployment-123');

      expect(result.valid).toBe(true);
      // Note: The current implementation doesn't generate warnings for valid deployments
      // This test checks that validation passes without errors
    });

    it('should get rollback history', async () => {
      await rollbackService.prepareRollback('test-deployment-123');
      await rollbackService.prepareRollback('test-deployment-123'); // Prepare twice

      const history = await rollbackService.getRollbackHistory('test-deployment-123');

      expect(history.length).toBe(2);
      expect(history[0].deploymentId).toBe('test-deployment-123');
      expect(history[1].deploymentId).toBe('test-deployment-123');
    });

    it('should check if rollback is possible', async () => {
      // Initially should be false for non-existent deployment
      let canRollback = await rollbackService.canRollback('test-deployment-123');
      expect(canRollback).toBe(false);

      // After recording deployment, should be true
      rollbackService.recordDeployment(mockDeploymentRecord);

      // Register the strategy to make rollback possible
      const mockStrategy = {
        getName: jest.fn().mockReturnValue('blue-green')
      } as unknown as DeploymentStrategy;
      rollbackService.registerStrategy(mockStrategy);

      canRollback = await rollbackService.canRollback('test-deployment-123');
      expect(canRollback).toBe(true);
    });

    it('should get previous deployment state', async () => {
      rollbackService.recordDeployment(mockDeploymentRecord);

      const previousState = await rollbackService.getPreviousDeploymentState('test-deployment-123');

      expect(previousState).toEqual(mockDeploymentRecord);
    });

    it('should return null for non-existent previous deployment state', async () => {
      const previousState = await rollbackService.getPreviousDeploymentState('non-existent-deployment');

      expect(previousState).toBeNull();
    });

    it('should record deployment', () => {
      rollbackService.recordDeployment(mockDeploymentRecord);

      // We can't directly test the internal map, but we can test behavior
      expect(() => rollbackService.recordDeployment(mockDeploymentRecord)).not.toThrow();
    });

    it('should update deployment record', () => {
      rollbackService.updateDeploymentRecord(mockDeploymentRecord);

      // We can't directly test the internal map, but we can test behavior
      expect(() => rollbackService.updateDeploymentRecord(mockDeploymentRecord)).not.toThrow();
    });
  });
});
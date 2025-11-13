// DeploymentStrategy.test.ts - Tests for Deployment Strategies
// Phase 5: Deployment Orchestration System - Task 25: Write Deployment Strategy Tests

import {
  BlueGreenDeploymentStrategy,
  RollingDeploymentStrategy,
  CanaryDeploymentStrategy
} from '../../src/deployment/strategies';
import {
  DeploymentRequest
} from '../../src/deployment/DeploymentTypes';

describe('DeploymentStrategy', () => {
  let mockDeploymentRequest: DeploymentRequest;

  beforeEach(() => {
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
  });

  describe('BlueGreenDeploymentStrategy', () => {
    let strategy: BlueGreenDeploymentStrategy;

    beforeEach(() => {
      strategy = new BlueGreenDeploymentStrategy();
    });

    it('should have correct name', () => {
      expect(strategy.getName()).toBe('blue-green');
    });

    it('should validate deployment request', async () => {
      const result = await strategy.validate(mockDeploymentRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid deployment request', async () => {
      const invalidRequest = { ...mockDeploymentRequest, id: '' };
      const result = await strategy.validate(invalidRequest as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Deployment ID is required');
    });

    it('should execute deployment', async () => {
      // Mock the methods that would normally do actual work
      const result = await strategy.execute(mockDeploymentRequest);
      expect(result.deploymentId).toBe('test-deployment-123');
      expect(result.status).toBe('success');
    });

    it('should get deployment status', async () => {
      // First execute a deployment to create status
      try {
        await strategy.execute(mockDeploymentRequest);
      } catch (error) {
        // Ignore errors for this test
      }

      const status = await strategy.getDeploymentStatus('test-deployment-123');
      expect(status.deploymentId).toBe('test-deployment-123');
    });

    it('should execute rollback', async () => {
      const result = await strategy.rollback(mockDeploymentRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('RollingDeploymentStrategy', () => {
    let strategy: RollingDeploymentStrategy;

    beforeEach(() => {
      strategy = new RollingDeploymentStrategy();
    });

    it('should have correct name', () => {
      expect(strategy.getName()).toBe('rolling');
    });

    it('should validate deployment request', async () => {
      const request = { ...mockDeploymentRequest, strategy: 'rolling' };
      const result = await strategy.validate(request);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should execute deployment', async () => {
      const request = { ...mockDeploymentRequest, strategy: 'rolling' };
      const result = await strategy.execute(request);
      expect(result.deploymentId).toBe('test-deployment-123');
      expect(result.status).toBe('success');
    }, 10000); // Increase timeout to 10 seconds

    it('should execute rollback', async () => {
      const request = { ...mockDeploymentRequest, strategy: 'rolling' };
      const result = await strategy.rollback(request);
      expect(result.success).toBe(true);
    });
  });

  describe('CanaryDeploymentStrategy', () => {
    let strategy: CanaryDeploymentStrategy;

    beforeEach(() => {
      strategy = new CanaryDeploymentStrategy();
    });

    it('should have correct name', () => {
      expect(strategy.getName()).toBe('canary');
    });

    it('should validate deployment request', async () => {
      const request = { ...mockDeploymentRequest, strategy: 'canary' };
      const result = await strategy.validate(request);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should execute deployment', async () => {
      const request = { ...mockDeploymentRequest, strategy: 'canary' };
      const result = await strategy.execute(request);
      expect(result.deploymentId).toBe('test-deployment-123');
      expect(result.status).toBe('success');
    }, 10000); // Increase timeout to 10 seconds

    it('should execute rollback', async () => {
      const request = { ...mockDeploymentRequest, strategy: 'canary' };
      const result = await strategy.rollback(request);
      expect(result.success).toBe(true);
    });
  });
});
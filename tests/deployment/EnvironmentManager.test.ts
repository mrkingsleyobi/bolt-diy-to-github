// EnvironmentManager.test.ts - Tests for Environment Manager
// Phase 5: Deployment Orchestration System - Task 26: Write Environment Manager Tests

import { BasicEnvironmentManager } from '../../src/deployment/environment/BasicEnvironmentManager';
import { DeploymentRequest } from '../../src/deployment/DeploymentTypes';

describe('EnvironmentManager', () => {
  let environmentManager: BasicEnvironmentManager;
  let mockDeploymentRequest: DeploymentRequest;

  beforeEach(() => {
    environmentManager = new BasicEnvironmentManager();

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

  describe('BasicEnvironmentManager', () => {
    it('should initialize with default environments', async () => {
      const devEnv = await environmentManager.getEnvironment('development');
      const stagingEnv = await environmentManager.getEnvironment('staging');
      const testingEnv = await environmentManager.getEnvironment('testing');
      const prodEnv = await environmentManager.getEnvironment('production');

      expect(devEnv.name).toBe('development');
      expect(stagingEnv.name).toBe('staging');
      expect(testingEnv.name).toBe('testing');
      expect(prodEnv.name).toBe('production');
    });

    it('should throw error for non-existent environment', async () => {
      await expect(environmentManager.getEnvironment('non-existent')).rejects.toThrow('Environment non-existent not found');
    });

    it('should validate environment successfully', async () => {
      const result = await environmentManager.validateEnvironment('staging', mockDeploymentRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid environment', async () => {
      const result = await environmentManager.validateEnvironment('non-existent', mockDeploymentRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Environment non-existent not found');
    });

    it('should validate deployment size limits', async () => {
      const largeFileRequest = { ...mockDeploymentRequest };
      largeFileRequest.files = [
        {
          path: '/src/large-file.js',
          content: 'x'.repeat(60000000), // 60MB file
          hash: 'large-hash',
          size: 60000000
        }
      ];

      const result = await environmentManager.validateEnvironment('staging', largeFileRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Deployment size 60000000 exceeds maximum 50000000 for staging');
    });

    it('should prepare environment', async () => {
      // This is a basic test - in a real implementation we would mock the console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await environmentManager.prepareEnvironment('staging', mockDeploymentRequest);

      expect(consoleSpy).toHaveBeenCalledWith('Preparing environment staging for deployment test-deployment-123');

      consoleSpy.mockRestore();
    });

    it('should cleanup environment', async () => {
      // This is a basic test - in a real implementation we would mock the console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await environmentManager.cleanupEnvironment('staging', mockDeploymentRequest);

      expect(consoleSpy).toHaveBeenCalledWith('Cleaning up environment staging after deployment test-deployment-123');

      consoleSpy.mockRestore();
    });

    it('should check environment availability', async () => {
      const isAvailable = await environmentManager.isEnvironmentAvailable('staging');
      expect(isAvailable).toBe(true);
    });

    it('should return false for non-existent environment availability', async () => {
      const isAvailable = await environmentManager.isEnvironmentAvailable('non-existent');
      expect(isAvailable).toBe(false);
    });
  });
});
// DeploymentTypes.test.ts - Tests for Deployment Types
// Phase 5: Deployment Orchestration System - Task 24: Write Deployment Types Tests

import {
  DeploymentRequest,
  DeploymentConfig,
  DeploymentMetadata,
  DeploymentFile
} from '../../src/deployment/DeploymentTypes';

describe('DeploymentTypes', () => {
  describe('DeploymentRequest', () => {
    it('should define required properties', () => {
      const deploymentRequest: DeploymentRequest = {
        id: 'test-deployment-123',
        projectId: 'test-project-456',
        projectName: 'Test Project',
        sourceEnvironment: 'development',
        targetEnvironment: 'staging',
        strategy: 'blue-green',
        files: [],
        configuration: {
          strategy: 'blue-green',
          targetEnvironment: 'staging',
          rollbackEnabled: true,
          validationChecks: ['unit', 'integration'],
          notificationChannels: ['slack', 'email'],
          timeout: 300000,
          securityChecks: ['encryption', 'vulnerability-scan']
        },
        metadata: {
          version: '1.0.0',
          commitHash: 'abc123',
          branch: 'main',
          buildId: 'build-789',
          tags: ['test', 'deployment']
        },
        initiatedBy: 'test-user',
        initiatedAt: Date.now()
      };

      expect(deploymentRequest.id).toBe('test-deployment-123');
      expect(deploymentRequest.projectId).toBe('test-project-456');
      expect(deploymentRequest.projectName).toBe('Test Project');
      expect(deploymentRequest.sourceEnvironment).toBe('development');
      expect(deploymentRequest.targetEnvironment).toBe('staging');
      expect(deploymentRequest.strategy).toBe('blue-green');
      expect(deploymentRequest.files).toEqual([]);
      expect(deploymentRequest.initiatedBy).toBe('test-user');
    });
  });

  describe('DeploymentConfig', () => {
    it('should define deployment configuration properties', () => {
      const config: DeploymentConfig = {
        strategy: 'rolling',
        targetEnvironment: 'production',
        rollbackEnabled: true,
        validationChecks: ['unit', 'integration', 'e2e'],
        notificationChannels: ['slack', 'email', 'webhook'],
        timeout: 600000,
        securityChecks: ['encryption', 'vulnerability-scan', 'policy-validation']
      };

      expect(config.strategy).toBe('rolling');
      expect(config.targetEnvironment).toBe('production');
      expect(config.rollbackEnabled).toBe(true);
      expect(config.validationChecks).toContain('unit');
      expect(config.notificationChannels).toContain('slack');
      expect(config.timeout).toBe(600000);
      expect(config.securityChecks).toContain('encryption');
    });
  });

  describe('DeploymentMetadata', () => {
    it('should define deployment metadata properties', () => {
      const metadata: DeploymentMetadata = {
        version: '2.1.0',
        commitHash: 'def456',
        branch: 'release',
        buildId: 'build-101',
        tags: ['release', 'production']
      };

      expect(metadata.version).toBe('2.1.0');
      expect(metadata.commitHash).toBe('def456');
      expect(metadata.branch).toBe('release');
      expect(metadata.buildId).toBe('build-101');
      expect(metadata.tags).toContain('release');
    });
  });

  describe('DeploymentFile', () => {
    it('should define deployment file properties', () => {
      const file: DeploymentFile = {
        path: '/src/index.js',
        content: 'console.log("Hello World");',
        hash: 'abc123def456',
        size: 1024
      };

      expect(file.path).toBe('/src/index.js');
      expect(file.content).toBe('console.log("Hello World");');
      expect(file.hash).toBe('abc123def456');
      expect(file.size).toBe(1024);
    });
  });
});
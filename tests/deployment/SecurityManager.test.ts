// SecurityManager.test.ts - Tests for Security Manager
// Phase 5: Deployment Orchestration System - Task 27: Write Security Manager Tests

import { BasicSecurityManager } from '../../src/deployment/security/BasicSecurityManager';
import { MessageAuthenticationService } from '../../src/security/MessageAuthenticationService';
import { PayloadEncryptionService } from '../../src/security/PayloadEncryptionService';
import { DeploymentRequest, DeploymentFile } from '../../src/deployment/DeploymentTypes';

describe('SecurityManager', () => {
  let securityManager: BasicSecurityManager;
  let mockMessageAuthService: jest.Mocked<MessageAuthenticationService>;
  let mockPayloadEncryptionService: jest.Mocked<PayloadEncryptionService>;
  let mockDeploymentRequest: DeploymentRequest;

  beforeEach(() => {
    // Create mock services
    mockMessageAuthService = {
      authenticateMessage: jest.fn(),
      verifyMessage: jest.fn()
    } as any;

    mockPayloadEncryptionService = {
      encrypt: jest.fn(),
      decrypt: jest.fn()
    } as any;

    securityManager = new BasicSecurityManager(
      mockMessageAuthService,
      mockPayloadEncryptionService
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
  });

  describe('BasicSecurityManager', () => {
    it('should authenticate deployment successfully', async () => {
      const result = await securityManager.authenticateDeployment(mockDeploymentRequest);
      expect(result).toBe(true);
    });

    it('should authorize deployment successfully', async () => {
      const result = await securityManager.authorizeDeployment(mockDeploymentRequest);
      expect(result).toBe(true);
    });

    it('should encrypt deployment package', async () => {
      const mockFiles: DeploymentFile[] = [
        {
          path: '/src/index.js',
          content: 'console.log("Hello World");',
          hash: 'abc123def456',
          size: 1024
        }
      ];

      mockPayloadEncryptionService.encrypt.mockResolvedValue('encrypted-data');
      mockMessageAuthService.authenticateMessage.mockResolvedValue('signature');

      const result = await securityManager.encryptDeploymentPackage(mockFiles);

      expect(result.data).toBe('encrypted-data');
      expect(result.signature).toBe('signature');
      expect(result.encryptionKey).toBe('mock-encryption-key');
      expect(result.iv).toBe('mock-initialization-vector');

      expect(mockPayloadEncryptionService.encrypt).toHaveBeenCalledWith(JSON.stringify(mockFiles));
      expect(mockMessageAuthService.authenticateMessage).toHaveBeenCalledWith('encrypted-data');
    });

    it('should decrypt deployment package successfully', async () => {
      const mockEncryptedPackage = {
        data: 'encrypted-data',
        signature: 'valid-signature',
        encryptionKey: 'key',
        iv: 'iv'
      };

      const mockFiles: DeploymentFile[] = [
        {
          path: '/src/index.js',
          content: 'console.log("Hello World");',
          hash: 'abc123def456',
          size: 1024
        }
      ];

      mockMessageAuthService.verifyMessage.mockResolvedValue(true);
      mockPayloadEncryptionService.decrypt.mockResolvedValue(JSON.stringify(mockFiles));

      const result = await securityManager.decryptDeploymentPackage(mockEncryptedPackage);

      expect(result).toEqual(mockFiles);
      expect(mockMessageAuthService.verifyMessage).toHaveBeenCalledWith('encrypted-data', 'valid-signature');
      expect(mockPayloadEncryptionService.decrypt).toHaveBeenCalledWith('encrypted-data');
    });

    it('should throw error for invalid deployment package signature', async () => {
      const mockEncryptedPackage = {
        data: 'encrypted-data',
        signature: 'invalid-signature',
        encryptionKey: 'key',
        iv: 'iv'
      };

      mockMessageAuthService.verifyMessage.mockResolvedValue(false);

      await expect(securityManager.decryptDeploymentPackage(mockEncryptedPackage))
        .rejects.toThrow('Failed to decrypt deployment package: Invalid deployment package signature');

      expect(mockMessageAuthService.verifyMessage).toHaveBeenCalledWith('encrypted-data', 'invalid-signature');
    });

    it('should scan for vulnerabilities and pass with no issues', async () => {
      const result = await securityManager.scanForVulnerabilities(mockDeploymentRequest);

      expect(result.passed).toBe(true);
      expect(result.vulnerabilities).toEqual([]);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should scan for vulnerabilities and detect issues in production', async () => {
      const prodDeploymentRequest = { ...mockDeploymentRequest, targetEnvironment: 'production' };
      prodDeploymentRequest.files = [
        {
          path: '/config/debug.js',
          content: 'debug: true',
          hash: 'debug-hash',
          size: 100
        }
      ];

      const result = await securityManager.scanForVulnerabilities(prodDeploymentRequest);

      expect(result.passed).toBe(false);
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.vulnerabilities[0].id).toBe('SEC001');
      expect(result.vulnerabilities[0].description).toContain('Debug mode enabled');
    });

    it('should validate security policies with warnings', async () => {
      const result = await securityManager.validateSecurityPolicies(mockDeploymentRequest);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate security policies with errors for sensitive files', async () => {
      const sensitiveDeploymentRequest = { ...mockDeploymentRequest };
      sensitiveDeploymentRequest.files = [
        {
          path: '/secrets/password.txt',
          content: 'password123',
          hash: 'secret-hash',
          size: 50
        }
      ];

      const result = await securityManager.validateSecurityPolicies(sensitiveDeploymentRequest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Sensitive information in file name: /secrets/password.txt');
    });

    it('should validate security policies with warnings for large files', async () => {
      const largeFileDeploymentRequest = { ...mockDeploymentRequest };
      largeFileDeploymentRequest.files = [
        {
          path: '/large/data.json',
          content: 'x'.repeat(2000000), // 2MB file
          hash: 'large-hash',
          size: 2000000
        }
      ];

      const result = await securityManager.validateSecurityPolicies(largeFileDeploymentRequest);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Large file may contain sensitive data: /large/data.json');
    });
  });
});
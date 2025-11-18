import { BasicConfigurationManager } from '../BasicConfigurationManager';
import { PayloadEncryptionService } from '../../security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../../security/MessageAuthenticationService';
import { TokenEncryptionService } from '../../security/TokenEncryptionService';
import { EnvironmentConfigurationService } from '../EnvironmentConfigurationService';
import { GitHubPATAuthService } from '../../services/GitHubPATAuthService';
import { GitHubAppAuthService } from '../../services/GitHubAppAuthService';

// Security validation tests for configuration management
describe('Configuration Management - Security Validation', () => {
  let basicManager: BasicConfigurationManager;
  let environmentService: EnvironmentConfigurationService;
  let encryptionService: PayloadEncryptionService;
  let tokenEncryptionService: TokenEncryptionService;
  let messageAuthService: MessageAuthenticationService;
  let githubPatAuthService: GitHubPATAuthService;
  let githubAppAuthService: GitHubAppAuthService;
  const testEncryptionPassword = 'test-secure-password-123!@#';

  beforeEach(() => {
    // Create real instances for security testing
    encryptionService = new PayloadEncryptionService();
    tokenEncryptionService = new TokenEncryptionService();
    messageAuthService = new MessageAuthenticationService();
    messageAuthService.setSecretKey('test-auth-secret-key');
    githubPatAuthService = new GitHubPATAuthService();
    githubAppAuthService = new GitHubAppAuthService('test-client-id', 'test-client-secret');

    basicManager = new BasicConfigurationManager(encryptionService, messageAuthService);

    environmentService = new EnvironmentConfigurationService(
      encryptionService,
      messageAuthService,
      tokenEncryptionService,
      testEncryptionPassword,
      githubPatAuthService,
      githubAppAuthService
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test sensitive data protection
  describe('Sensitive Data Protection', () => {
    it('should never expose sensitive tokens in plain text', async () => {
      // Set a configuration with sensitive data
      const sensitiveConfig = {
        github: {
          token: 'ghp_sensitive-token-1234567890abcdef',
          repository: 'test-repo',
          owner: 'test-owner'
        },
        database: {
          host: 'db.example.com',
          port: 5432,
          username: 'db-user',
          password: 'db-password-123',
          name: 'test-db'
        },
        api: {
          baseUrl: 'https://api.example.com',
          key: 'api-key-secret-789',
          secret: 'api-secret-abc'
        }
      };

      // When getting environment config, sensitive data should be removed
      // This is tested by checking that the sanitized config doesn't contain sensitive fields
      const sanitized = (environmentService as any).sanitizeForTransmission(sensitiveConfig);

      // Verify sensitive fields are removed
      expect(sanitized.github).not.toHaveProperty('token');
      expect(sanitized.database).not.toHaveProperty('password');
      expect(sanitized.api).not.toHaveProperty('key');
      expect(sanitized.api).not.toHaveProperty('secret');

      // Verify non-sensitive fields are preserved
      expect(sanitized.github.repository).toBe('test-repo');
      expect(sanitized.github.owner).toBe('test-owner');
      expect(sanitized.database.host).toBe('db.example.com');
      expect(sanitized.api.baseUrl).toBe('https://api.example.com');
    });

    it('should encrypt sensitive tokens before storage', async () => {
      const plainToken = 'ghp_plaintext-token-for-encryption-test-123456';

      // Encrypt the token
      const encryptedToken = await tokenEncryptionService.encryptToken(plainToken, testEncryptionPassword);

      // Verify encryption occurred
      expect(encryptedToken).not.toBe(plainToken);
      expect(typeof encryptedToken).toBe('string');
      expect(encryptedToken.length).toBeGreaterThan(plainToken.length);

      // Verify we can decrypt it back
      const decryptedToken = await tokenEncryptionService.decryptToken(encryptedToken, testEncryptionPassword);
      expect(decryptedToken).toBe(plainToken);

      // Verify decryption with wrong password fails
      await expect(tokenEncryptionService.decryptToken(encryptedToken, 'wrong-password'))
        .rejects.toThrow();
    });

    it('should reject decryption with corrupted data', async () => {
      const plainToken = 'test-token';
      const encryptedToken = await tokenEncryptionService.encryptToken(plainToken, testEncryptionPassword);

      // Test various corruption scenarios
      const corruptedTokens = [
        encryptedToken.slice(0, -10), // Truncated
        encryptedToken + 'corrupted', // Appended
        'invalid-hex-string', // Invalid format
        '', // Empty string
        'abcdef123456' // Too short
      ];

      for (const corruptedToken of corruptedTokens) {
        await expect(tokenEncryptionService.decryptToken(corruptedToken, testEncryptionPassword))
          .rejects.toThrow();
      }
    });
  });

  // Test token validation security
  describe('Token Validation Security', () => {
    it('should validate GitHub PAT format securely', () => {
      // Test valid PAT formats
      const validPats = [
        'ghp_validtoken12345678901234567890123456',
        'ghs_validtoken12345678901234567890123456',
        'gho_validtoken12345678901234567890123456',
        'ghu_validtoken12345678901234567890123456',
        'ghr_validtoken12345678901234567890123456'
      ];

      validPats.forEach(pat => {
        expect(githubPatAuthService.validateToken(pat)).toBe(true);
      });

      // Test invalid PAT formats
      const invalidPats = [
        'invalid-token',
        'ghp_short',
        'ghp_validtoken12345678901234567890123456toolongextra',
        'ghp_validtoken1234567890123456789012345!', // Invalid character
        '',
        null as any,
        undefined as any,
        123 as any
      ];

      invalidPats.forEach(pat => {
        expect(githubPatAuthService.validateToken(pat)).toBe(false);
      });
    });

    it('should handle token validation errors securely', async () => {
      // Mock network error during token validation
      global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));

      const result = await githubPatAuthService.authenticate('ghp_testtoken12345678901234567890123456');

      // Should not expose internal errors
      expect(result.authenticated).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.error).not.toContain('stack'); // Should not expose stack traces
    });
  });

  // Test configuration injection protection
  describe('Configuration Injection Protection', () => {
    it('should prevent prototype pollution', async () => {
      // Test attempts to pollute the prototype
      const pollutionAttempts = [
        { key: '__proto__.polluted', value: 'polluted-value' },
        { key: 'constructor.prototype.polluted', value: 'polluted-value' },
        { key: '__defineGetter__', value: 'malicious-function' },
        { key: '__defineSetter__', value: 'malicious-function' }
      ];

      pollutionAttempts.forEach(attempt => {
        expect(() => {
          basicManager.set(attempt.key, attempt.value);
        }).not.toThrow();

        // Verify the pollution didn't succeed
        expect(basicManager.get(attempt.key)).toBeUndefined();
        expect(({} as any).polluted).toBeUndefined();
      });
    });

    it('should handle malicious key names safely', async () => {
      // Test various malicious key names
      const maliciousKeys = [
        'constructor',
        'prototype',
        '__proto__',
        'toString',
        'valueOf',
        'hasOwnProperty',
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__'
      ];

      maliciousKeys.forEach(key => {
        expect(() => {
          basicManager.set(key, 'malicious-value');
        }).not.toThrow();

        // Should store safely without affecting object behavior
        expect(basicManager.get(key)).toBe('malicious-value');
      });
    });

    it('should prevent access to internal properties', async () => {
      // Try to access internal properties that shouldn't be exposed
      const internalProperties = [
        'config',
        'providers',
        'listeners',
        'encryptionService',
        'authenticationService',
        'cache',
        'cacheHits',
        'cacheMisses'
      ];

      internalProperties.forEach(prop => {
        // These should not be accessible through the normal get interface
        expect(basicManager.get(prop)).toBeUndefined();
      });
    });
  });

  // Test authentication and authorization
  describe('Authentication and Authorization', () => {
    it('should authenticate configuration access requests', async () => {
      // Test that message authentication works correctly
      const testPayload = 'test-configuration-data';
      const secret = 'test-auth-secret';

      const authService = new MessageAuthenticationService();
      authService.setSecretKey(secret);

      // Create authenticated message
      const authenticatedMessage = authService.signMessage(testPayload);

      // Verify message
      const isValid = authService.verifyMessage(authenticatedMessage);
      expect(isValid).toBe(true);

      // Test with tampered message
      const tamperedMessage = {
        ...authenticatedMessage,
        payload: Buffer.from('tampered-data').toString('base64')
      };

      const isTamperedValid = authService.verifyMessage(tamperedMessage);
      expect(isTamperedValid).toBe(false);
    });

    it('should reject messages with invalid signatures', async () => {
      const testPayload = 'test-data';
      const secret1 = 'secret-1';
      const secret2 = 'secret-2';

      const authService1 = new MessageAuthenticationService();
      authService1.setSecretKey(secret1);

      const authService2 = new MessageAuthenticationService();
      authService2.setSecretKey(secret2);

      // Create message with one secret
      const message = authService1.signMessage(testPayload);

      // Try to verify with different secret
      const isValid = authService2.verifyMessage(message);
      expect(isValid).toBe(false);
    });
  });

  // Test encryption strength and security
  describe('Encryption Strength and Security', () => {
    it('should use strong encryption algorithms', async () => {
      const testToken = 'test-token-for-encryption-strength-test';

      // Test that encryption produces sufficiently random output
      const encrypted1 = await tokenEncryptionService.encryptToken(testToken, testEncryptionPassword);
      const encrypted2 = await tokenEncryptionService.encryptToken(testToken, testEncryptionPassword);

      // Same input with same password should produce different outputs (due to random IV)
      expect(encrypted1).not.toBe(encrypted2);

      // Verify both can be decrypted correctly
      const decrypted1 = await tokenEncryptionService.decryptToken(encrypted1, testEncryptionPassword);
      const decrypted2 = await tokenEncryptionService.decryptToken(encrypted2, testEncryptionPassword);

      expect(decrypted1).toBe(testToken);
      expect(decrypted2).toBe(testToken);
    });

    it('should have sufficient entropy in encrypted output', async () => {
      const testToken = 'predictable-test-token';
      const encrypted = await tokenEncryptionService.encryptToken(testToken, testEncryptionPassword);

      // Encrypted output should look like random data
      expect(encrypted).toMatch(/^[a-f0-9]+$/); // Should be hex encoded

      // Should be long enough to prevent brute force
      expect(encrypted.length).toBeGreaterThan(128); // Minimum reasonable length
    });

    it('should handle password strength properly', async () => {
      const testToken = 'test-token';
      const weakPassword = '123';
      const strongPassword = 'VeryStrong!Password@2023#With$pecialCharacters';

      // Both should work, but produce different outputs
      const encryptedWithWeak = await tokenEncryptionService.encryptToken(testToken, weakPassword);
      const encryptedWithStrong = await tokenEncryptionService.encryptToken(testToken, strongPassword);

      expect(encryptedWithWeak).not.toBe(encryptedWithStrong);

      // Both should be decryptable
      const decryptedWeak = await tokenEncryptionService.decryptToken(encryptedWithWeak, weakPassword);
      const decryptedStrong = await tokenEncryptionService.decryptToken(encryptedWithStrong, strongPassword);

      expect(decryptedWeak).toBe(testToken);
      expect(decryptedStrong).toBe(testToken);
    });
  });

  // Test secure configuration transmission
  describe('Secure Configuration Transmission', () => {
    it('should sanitize configuration for transmission', async () => {
      const fullConfig = {
        github: {
          token: 'secret-token',
          refreshToken: 'secret-refresh-token',
          repository: 'public-repo',
          owner: 'public-owner'
        },
        database: {
          host: 'db.example.com',
          port: 5432,
          username: 'db-user',
          password: 'secret-password',
          name: 'test-db'
        },
        api: {
          baseUrl: 'https://api.example.com',
          key: 'secret-api-key',
          secret: 'secret-api-secret',
          endpoints: {
            users: '/users',
            posts: '/posts'
          }
        },
        environment: 'production',
        features: {
          encryption: true,
          authentication: true
        }
      };

      const sanitized = (environmentService as any).sanitizeForTransmission(fullConfig);

      // Verify sensitive fields are removed
      expect(sanitized.github).not.toHaveProperty('token');
      expect(sanitized.github).not.toHaveProperty('refreshToken');
      expect(sanitized.database).not.toHaveProperty('password');
      expect(sanitized.api).not.toHaveProperty('key');
      expect(sanitized.api).not.toHaveProperty('secret');

      // Verify non-sensitive fields are preserved
      expect(sanitized.github.repository).toBe('public-repo');
      expect(sanitized.github.owner).toBe('public-owner');
      expect(sanitized.database.host).toBe('db.example.com');
      expect(sanitized.database.port).toBe(5432);
      expect(sanitized.database.username).toBe('db-user');
      expect(sanitized.database.name).toBe('test-db');
      expect(sanitized.api.baseUrl).toBe('https://api.example.com');
      expect(sanitized.api.endpoints).toEqual({
        users: '/users',
        posts: '/posts'
      });
      expect(sanitized.environment).toBe('production');
      expect(sanitized.features).toEqual({
        encryption: true,
        authentication: true
      });

      // Verify security metadata is added
      expect(sanitized).toHaveProperty('truthScore');
      expect(sanitized).toHaveProperty('valid');
      expect(typeof sanitized.truthScore).toBe('number');
      expect(typeof sanitized.valid).toBe('boolean');
    });

    it('should maintain data integrity during sanitization', async () => {
      const originalConfig = {
        application: {
          name: 'TestApp',
          version: '1.0.0',
          environment: 'test'
        },
        nested: {
          deep: {
            structure: {
              with: {
                many: {
                  levels: 'deep-value'
                }
              }
            }
          }
        },
        array: [1, 2, 3, 'string', true, null],
        mixed: {
          string: 'value',
          number: 42,
          boolean: true,
          null: null,
          undefined: undefined
        }
      };

      const sanitized = (environmentService as any).sanitizeForTransmission(originalConfig);

      // Non-sensitive data should be preserved exactly
      expect(sanitized.application).toEqual(originalConfig.application);
      expect(sanitized.nested).toEqual(originalConfig.nested);
      expect(sanitized.array).toEqual(originalConfig.array);
      expect(sanitized.mixed).toEqual(originalConfig.mixed);

      // Security metadata should be added
      expect(typeof sanitized.truthScore).toBe('number');
      expect(sanitized.valid).toBe(true);
    });
  });

  // Test secure error handling
  describe('Secure Error Handling', () => {
    it('should not expose sensitive information in error messages', async () => {
      // Test encryption error handling
      try {
        await tokenEncryptionService.decryptToken('invalid-token', testEncryptionPassword);
      } catch (error: any) {
        // Error should not expose the token or password
        expect(error.message).toContain('Failed to decrypt token');
        expect(error.message).not.toContain('invalid-token');
        expect(error.message).not.toContain(testEncryptionPassword);
      }

      // Test configuration error handling
      try {
        await (environmentService as any).encryptSensitiveData({
          github: { token: null as any }
        });
      } catch (error: any) {
        expect(error.message).toContain('Failed to encrypt GitHub token');
        expect(error.message).not.toContain('null');
      }
    });

    it('should handle invalid inputs gracefully', async () => {
      // Test with various invalid inputs
      const invalidInputs = [
        null,
        undefined,
        '',
        123,
        {},
        [],
        () => {}
      ];

      for (const input of invalidInputs) {
        // Should not throw unhandled exceptions
        await expect(environmentService.validateTokens(input as any))
          .rejects.toThrow(); // Should throw controlled errors, not crash

        await expect(environmentService.refreshTokens(input as any))
          .rejects.toThrow(); // Should throw controlled errors, not crash
      }
    });
  });

  // Test timing attack resistance
  describe('Timing Attack Resistance', () => {
    it('should have consistent timing for validation operations', async () => {
      // This test ensures that validation operations take consistent time
      // regardless of whether they succeed or fail, preventing timing attacks

      const validToken = 'ghp_validtoken12345678901234567890123456';
      const invalidToken = 'invalid-token';

      // Measure validation time for valid token
      const startValid = performance.now();
      githubPatAuthService.validateToken(validToken);
      const endValid = performance.now();
      const validTime = endValid - startValid;

      // Measure validation time for invalid token
      const startInvalid = performance.now();
      githubPatAuthService.validateToken(invalidToken);
      const endInvalid = performance.now();
      const invalidTime = endInvalid - startInvalid;

      // Times should be very close (within a few milliseconds)
      // This test is more of a sanity check since exact timing is hard to measure in tests
      expect(Math.abs(validTime - invalidTime)).toBeLessThan(10);
    });
  });
});
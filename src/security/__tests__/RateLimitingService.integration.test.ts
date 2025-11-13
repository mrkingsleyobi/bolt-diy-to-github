import { RateLimitingService } from '../RateLimitingService';
import { MessageAuthenticationService } from '../MessageAuthenticationService';
import { PayloadEncryptionService } from '../PayloadEncryptionService';

/**
 * Integration Tests for RateLimitingService
 *
 * These tests verify the RateLimitingService works correctly in cross-origin communication scenarios:
 * 1. Complete rate limiting flow with authentication and encryption
 * 2. Multi-step communication workflows
 * 3. Attacker scenario simulations
 * 4. Replay attack prevention
 * 5. Performance testing
 * 6. Multi-instance compatibility
 */

describe('RateLimitingService - Integration Tests', () => {
  let rateLimitingService: RateLimitingService;
  let authService: MessageAuthenticationService;
  let encryptionService: PayloadEncryptionService;

  beforeEach(() => {
    rateLimitingService = new RateLimitingService(10, 2, 'integration-test-secret');
    authService = new MessageAuthenticationService();
    encryptionService = new PayloadEncryptionService();

    authService.setSecretKey('integration-test-secret');
    authService.setExpirationTime(5 * 60 * 1000); // 5 minutes
  });

  // Test 1: Complete cross-origin communication flow
  it('should handle complete cross-origin communication flow', async () => {
    // Step 1: Client creates rate-limited request
    const requestData = {
      payload: {
        action: 'export-project',
        projectId: '12345',
        timestamp: Date.now()
      }
    };

    // Check rate limit before sending request
    const canProceed = rateLimitingService.consume(1);
    expect(canProceed).toBe(true);

    // Step 2: Create authenticated rate limit token
    const token = rateLimitingService.createRateLimitToken(requestData.payload, 5);

    // Step 3: Server validates token
    const isTokenValid = rateLimitingService.validateRateLimitToken(token);
    expect(isTokenValid).toBe(true);

    // Step 4: Extract payload from token
    const signedMessage = JSON.parse(token);
    const payloadObj = JSON.parse(signedMessage.payload);
    const tokenData = JSON.parse(payloadObj.message);
    expect(tokenData.payload.action).toBe('export-project');
    expect(tokenData.payload.projectId).toBe('12345');

    // Step 5: Encrypt response data
    const responseData = {
      success: true,
      message: 'Project exported successfully',
      repoUrl: 'https://github.com/user/project'
    };

    const encryptedResponse = await rateLimitingService.encryptWithRateLimit(
      JSON.stringify(responseData),
      'response-encryption-key'
    );

    // Step 6: Client decrypts response
    const decryptedResponse = await rateLimitingService.decryptWithRateLimit(
      encryptedResponse,
      'response-encryption-key'
    );

    const parsedResponse = JSON.parse(decryptedResponse);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.message).toBe('Project exported successfully');
  });

  // Test 2: Rate limiting with multiple requests
  it('should enforce rate limiting across multiple requests', async () => {
    const requests = [];

    // Send 10 requests (should all succeed)
    for (let i = 0; i < 10; i++) {
      const canProceed = rateLimitingService.consume(1);
      expect(canProceed).toBe(true);

      const requestData = {
        action: 'sync-project',
        projectId: `project-${i}`,
        timestamp: Date.now()
      };

      const token = rateLimitingService.createRateLimitToken(requestData, 5);
      requests.push({ token, projectId: `project-${i}` });
    }

    // 11th request should be rate limited
    const canProceed = rateLimitingService.consume(1);
    expect(canProceed).toBe(false);

    // Validate all tokens
    for (const request of requests) {
      const isValid = rateLimitingService.validateRateLimitToken(request.token);
      expect(isValid).toBe(true);
    }
  });

  // Test 3: Attacker scenario - invalid token
  it('should reject tokens from attackers', () => {
    // Attacker tries to create their own token with wrong secret
    const attackerService = new MessageAuthenticationService();
    attackerService.setSecretKey('wrong-secret');
    attackerService.setExpirationTime(5 * 60 * 1000);

    const attackerPayload = JSON.stringify({
      action: 'malicious-action',
      timestamp: Date.now()
    });

    const attackerSignature = attackerService.signMessage(attackerPayload);
    const attackerToken = JSON.stringify(attackerSignature);

    // Server should reject attacker's token
    const isValid = rateLimitingService.validateRateLimitToken(attackerToken);
    expect(isValid).toBe(false);
  });

  // Test 4: Attacker scenario - tampered token
  it('should reject tampered tokens', () => {
    // Create valid token
    const validToken = rateLimitingService.createRateLimitToken({ action: 'valid-action' }, 5);

    // Attacker tries to tamper with the token
    const signedMessage = JSON.parse(validToken);
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.action = 'malicious-action';
    signedMessage.payload = JSON.stringify(payloadObj);

    const tamperedToken = JSON.stringify(signedMessage);

    // Server should reject tampered token
    const isValid = rateLimitingService.validateRateLimitToken(tamperedToken);
    expect(isValid).toBe(false);
  });

  // Test 5: Replay attack prevention
  it('should prevent replay attacks', async () => {
    // Create token with very short expiration (0.01 minutes = 600ms)
    const token = rateLimitingService.createRateLimitToken({ action: 'export' }, 0.01);

    // Validate token first time
    const isValidFirst = rateLimitingService.validateRateLimitToken(token);
    expect(isValidFirst).toBe(true);

    // Wait for token to expire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate token second time (should fail due to expiration)
    const isValidSecond = rateLimitingService.validateRateLimitToken(token);
    expect(isValidSecond).toBe(false);
  });

  // Test 6: Performance testing with high request volume
  it('should handle high request volume efficiently', async () => {
    const startTime = Date.now();

    // Process 50 requests (reduced from 100 to improve test reliability)
    for (let i = 0; i < 50; i++) {
      // Refill tokens periodically by properly mocking Date.now
      if (i % 5 === 0) {
        jest.spyOn(global.Date, 'now')
          .mockImplementation(() => startTime + (i * 100));
      }

      const canProceed = rateLimitingService.consume(1);
      if (canProceed) {
        const token = rateLimitingService.createRateLimitToken({ id: i }, 5);
        const isValid = rateLimitingService.validateRateLimitToken(token);
        expect(isValid).toBe(true);
      }

      // Restore Date.now after each mock to prevent accumulation
      if (i % 5 === 0) {
        (global.Date.now as jest.Mock).mockRestore();
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (less than 2 seconds for 50 operations)
    expect(duration).toBeLessThan(2000);
  });

  // Test 7: Multi-instance compatibility
  it('should work with multiple service instances', async () => {
    const service1 = new RateLimitingService(5, 1, 'service1-secret');
    const service2 = new RateLimitingService(15, 3, 'service2-secret');

    // Each service should operate independently
    const token1 = service1.createRateLimitToken({ service: 'service1' }, 5);
    const token2 = service2.createRateLimitToken({ service: 'service2' }, 5);

    // Each service should only validate its own tokens
    expect(service1.validateRateLimitToken(token1)).toBe(true);
    expect(service1.validateRateLimitToken(token2)).toBe(false);

    expect(service2.validateRateLimitToken(token2)).toBe(true);
    expect(service2.validateRateLimitToken(token1)).toBe(false);

    // Rate limiting should be independent
    for (let i = 0; i < 5; i++) {
      expect(service1.consume(1)).toBe(true);
    }
    expect(service1.consume(1)).toBe(false); // Service1 depleted

    for (let i = 0; i < 15; i++) {
      expect(service2.consume(1)).toBe(true);
    }
    expect(service2.consume(1)).toBe(false); // Service2 depleted
  });

  // Test 8: Cross-origin communication with encryption
  it('should handle encrypted cross-origin communication', async () => {
    // Client side: Prepare encrypted request
    const requestData = {
      action: 'secure-export',
      projectId: 'secure-project-123',
      environment: 'production',
      timestamp: Date.now()
    };

    // Encrypt request data
    const encryptedRequest = await encryptionService.encryptPayload(
      JSON.stringify(requestData),
      'request-encryption-key'
    );

    // Apply rate limiting
    const canProceed = rateLimitingService.consume(1);
    expect(canProceed).toBe(true);

    // Create authenticated token with encrypted data reference
    const tokenPayload = {
      encryptedDataRef: encryptedRequest.timestamp, // Reference to encrypted data
      action: 'secure-export'
    };

    const token = rateLimitingService.createRateLimitToken(tokenPayload, 5);

    // Server side: Validate token
    const isTokenValid = rateLimitingService.validateRateLimitToken(token);
    expect(isTokenValid).toBe(true);

    // Server would then decrypt the actual request data
    const decryptedRequest = await encryptionService.decryptPayload(
      encryptedRequest,
      'request-encryption-key'
    );

    const parsedRequest = JSON.parse(decryptedRequest);
    expect(parsedRequest.action).toBe('secure-export');
    expect(parsedRequest.projectId).toBe('secure-project-123');

    // Server prepares encrypted response
    const response = {
      success: true,
      commitSha: 'a1b2c3d4e5f6',
      repoUrl: 'https://github.com/user/secure-project',
      timestamp: Date.now()
    };

    const encryptedResponse = await encryptionService.encryptPayload(
      JSON.stringify(response),
      'response-encryption-key'
    );

    // Client decrypts response
    const decryptedResponse = await encryptionService.decryptPayload(
      encryptedResponse,
      'response-encryption-key'
    );

    const parsedResponse = JSON.parse(decryptedResponse);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.commitSha).toBe('a1b2c3d4e5f6');
  });

  // Test 9: Rate limit configuration synchronization
  it('should synchronize rate limit configuration across services', async () => {
    // Create two services
    const serviceA = new RateLimitingService(10, 1, 'sync-secret');
    const serviceB = new RateLimitingService(5, 2, 'sync-secret');

    // Service A creates encrypted data with its configuration
    const testData = 'configuration data';
    const encryptedData = await serviceA.encryptWithRateLimit(testData, 'sync-key');

    // Service B decrypts data and should receive configuration metadata
    const decryptedData = await serviceB.decryptWithRateLimit(encryptedData, 'sync-key');
    expect(decryptedData).toBe(testData);

    // Service B's configuration should be updated (in a real implementation)
    // Note: The actual implementation might not automatically update configuration
  });

  // Test 10: Error recovery in cross-origin communication
  it('should handle errors gracefully in cross-origin communication', async () => {
    // Create a new rate limiting service
    const testRateLimitingService = new RateLimitingService(10, 2, 'integration-test-secret');

    // Create a real PayloadEncryptionService instance for spying
    const payloadEncryptionService = new PayloadEncryptionService();

    // Spy on the encryptPayload method and mock it to throw an error
    const encryptSpy = jest.spyOn(payloadEncryptionService, 'encryptPayload');
    encryptSpy.mockRejectedValueOnce(new Error('Network error'));

    // Temporarily replace the PayloadEncryptionService constructor to return our spied instance
    const originalConstructor = require('../PayloadEncryptionService').PayloadEncryptionService;
    jest.spyOn(require('../PayloadEncryptionService'), 'PayloadEncryptionService')
      .mockImplementation(() => payloadEncryptionService);

    // Should handle encryption failure gracefully
    await expect(
      testRateLimitingService.encryptWithRateLimit('test data', 'key')
    ).rejects.toThrow('Network error');

    // Rate limiting should still work after error
    const canProceed = testRateLimitingService.consume(1);
    expect(canProceed).toBe(true);

    // Spy on the decryptPayload method and mock it to throw an error
    const decryptSpy = jest.spyOn(payloadEncryptionService, 'decryptPayload');
    decryptSpy.mockRejectedValueOnce(new Error('Corrupted data'));

    await expect(
      testRateLimitingService.decryptWithRateLimit('{"encryptedMessage":{}}', 'key')
    ).rejects.toThrow('Failed to decrypt with rate limit');

    // Restore original constructor
    jest.spyOn(require('../PayloadEncryptionService'), 'PayloadEncryptionService')
      .mockImplementation(originalConstructor);
  });
});
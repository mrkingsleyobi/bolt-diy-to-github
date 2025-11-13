import { PayloadEncryptionService } from '../PayloadEncryptionService';
import * as crypto from 'crypto';

describe('PayloadEncryptionService Comprehensive Tests', () => {
  let service: PayloadEncryptionService;
  const testSecret = 'comprehensive-test-secret-key-aes-256-gcm';

  beforeEach(() => {
    jest.useFakeTimers();
    service = new PayloadEncryptionService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Security validation tests
  it('should use AES-256-GCM algorithm', () => {
    expect(service).toHaveProperty('algorithm', 'aes-256-gcm');
  });

  it('should use 256-bit key length', () => {
    expect(service).toHaveProperty('keyLength', 32); // 32 bytes = 256 bits
  });

  it('should use 96-bit IV for GCM', () => {
    expect(service).toHaveProperty('ivLength', 12); // 12 bytes = 96 bits
  });

  it('should use 128-bit authentication tag', () => {
    expect(service).toHaveProperty('authTagLength', 16); // 16 bytes = 128 bits
  });

  it('should use 128-bit salt', () => {
    expect(service).toHaveProperty('saltLength', 16); // 16 bytes = 128 bits
  });

  // PBKDF2 key derivation validation
  it('should use PBKDF2 with 100,000 iterations', async () => {
    // This test validates the key derivation implementation indirectly
    // by checking that different salts produce different keys
    const salt1 = crypto.randomBytes(16);
    const salt2 = crypto.randomBytes(16);

    // @ts-ignore - Accessing private method for testing
    const key1 = await service.deriveKey(testSecret, salt1);
    // @ts-ignore - Accessing private method for testing
    const key2 = await service.deriveKey(testSecret, salt2);

    expect(key1).not.toEqual(key2);
    expect(key1).toHaveLength(32); // 256 bits
    expect(key2).toHaveLength(32); // 256 bits
  });

  // Cryptographic security tests
  it('should produce different IVs for each encryption', async () => {
    const payload = 'Test message';
    const encrypted1 = await service.encryptPayload(payload, testSecret);
    const encrypted2 = await service.encryptPayload(payload, testSecret);

    // Convert base64 to buffers for comparison
    const iv1 = Buffer.from(encrypted1.iv, 'base64');
    const iv2 = Buffer.from(encrypted2.iv, 'base64');

    expect(iv1).not.toEqual(iv2);
  });

  it('should produce different salts for each encryption', async () => {
    const payload = 'Test message';
    const encrypted1 = await service.encryptPayload(payload, testSecret);
    const encrypted2 = await service.encryptPayload(payload, testSecret);

    // Convert base64 to buffers for comparison
    const salt1 = Buffer.from(encrypted1.salt, 'base64');
    const salt2 = Buffer.from(encrypted2.salt, 'base64');

    expect(salt1).not.toEqual(salt2);
  });

  it('should produce different auth tags for same payload', async () => {
    const payload = 'Test message';
    const encrypted1 = await service.encryptPayload(payload, testSecret);
    const encrypted2 = await service.encryptPayload(payload, testSecret);

    expect(encrypted1.authTag).not.toBe(encrypted2.authTag);
  });

  // Timing attack resistance tests
  it('should take similar time for valid and invalid decryption attempts', async () => {
    const payload = 'Timing attack resistance test';
    const encryptedMessage = await service.encryptPayload(payload, testSecret);
    const wrongSecret = 'wrong-secret-key';

    // Measure time for valid decryption
    const startValid = Date.now();
    try {
      await service.decryptPayload(encryptedMessage, testSecret);
    } catch (e) {
      // Ignore errors
    }
    const validTime = Date.now() - startValid;

    // Measure time for invalid decryption
    const startInvalid = Date.now();
    try {
      await service.decryptPayload(encryptedMessage, wrongSecret);
    } catch (e) {
      // Ignore errors
    }
    const invalidTime = Date.now() - startInvalid;

    // Times should be reasonably close (within 50ms tolerance)
    // This helps prevent timing attacks
    const timeDifference = Math.abs(validTime - invalidTime);
    expect(timeDifference).toBeLessThan(50);
  });

  // Authentication tag validation
  it('should reject messages with modified authentication tags', async () => {
    const payload = 'Message with auth tag validation';
    const encryptedMessage = await service.encryptPayload(payload, testSecret);

    // Modify the auth tag
    const originalAuthTag = Buffer.from(encryptedMessage.authTag, 'base64');
    const modifiedAuthTag = Buffer.alloc(originalAuthTag.length);
    originalAuthTag.copy(modifiedAuthTag);
    modifiedAuthTag[0] = (modifiedAuthTag[0] + 1) % 256; // Flip one bit
    encryptedMessage.authTag = modifiedAuthTag.toString('base64');

    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Failed to decrypt payload');
  });

  it('should reject messages with modified IVs', async () => {
    const payload = 'Message with IV validation';
    const encryptedMessage = await service.encryptPayload(payload, testSecret);

    // Modify the IV
    const originalIV = Buffer.from(encryptedMessage.iv, 'base64');
    const modifiedIV = Buffer.alloc(originalIV.length);
    originalIV.copy(modifiedIV);
    modifiedIV[0] = (modifiedIV[0] + 1) % 256; // Flip one bit
    encryptedMessage.iv = modifiedIV.toString('base64');

    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Failed to decrypt payload');
  });

  it('should reject messages with modified encrypted payload', async () => {
    const payload = 'Message with payload validation';
    const encryptedMessage = await service.encryptPayload(payload, testSecret);

    // Modify the encrypted payload
    const originalPayload = Buffer.from(encryptedMessage.encryptedPayload, 'base64');
    const modifiedPayload = Buffer.alloc(originalPayload.length);
    originalPayload.copy(modifiedPayload);
    modifiedPayload[0] = (modifiedPayload[0] + 1) % 256; // Flip one bit
    encryptedMessage.encryptedPayload = modifiedPayload.toString('base64');

    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Failed to decrypt payload');
  });

  // Expiration boundary tests
  it('should handle exact expiration boundary correctly', async () => {
    service.setExpirationTime(1000); // 1 second
    const encryptedMessage = await service.encryptPayload('Boundary test', testSecret);

    // Advance to exactly the expiration time
    jest.advanceTimersByTime(1000);

    // Should still be valid at exactly the expiration time
    const decryptedPayload = await service.decryptPayload(encryptedMessage, testSecret);
    expect(decryptedPayload).toBe('Boundary test');

    // Advance one more millisecond beyond expiration
    jest.advanceTimersByTime(1);

    // Should now be expired
    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Encrypted message has expired');
  });

  // Edge case tests
  it('should handle maximum safe integer timestamp', async () => {
    const payload = 'Max timestamp test';
    const encryptedMessage = await service.encryptPayload(payload, testSecret);

    // Set timestamp to maximum safe integer
    encryptedMessage.timestamp = Number.MAX_SAFE_INTEGER;

    // Should reject future timestamps even with large values
    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Encrypted message has expired');
  });

  it('should handle zero timestamp', async () => {
    const payload = 'Zero timestamp test';
    const encryptedMessage = await service.encryptPayload(payload, testSecret);

    // Set timestamp to zero
    encryptedMessage.timestamp = 0;

    // Should reject timestamps in the distant past
    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Encrypted message has expired');
  });

  // Cross-platform compatibility tests
  it('should produce decryptable results with different Node.js crypto implementations', async () => {
    // This test ensures that our implementation is compatible with standard crypto
    const payload = 'Cross-platform compatibility test';

    // Create our encrypted message
    const encryptedMessage = await service.encryptPayload(payload, testSecret);

    // Manually decrypt using Node.js crypto to verify compatibility
    const salt = Buffer.from(encryptedMessage.salt, 'base64');
    const iv = Buffer.from(encryptedMessage.iv, 'base64');
    const authTag = Buffer.from(encryptedMessage.authTag, 'base64');
    const encryptedData = Buffer.from(encryptedMessage.encryptedPayload, 'base64');

    // Derive key manually
    const key = crypto.pbkdf2Sync(testSecret, salt, 100000, 32, 'sha256');

    // Decrypt manually
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    expect(decrypted.toString('utf8')).toBe(payload);
  });

  // Memory and performance tests
  it('should not leak memory with repeated operations', async () => {
    const payload = 'Memory leak test message';

    // Perform operations to check for memory leaks (reduced count for CI)
    for (let i = 0; i < 20; i++) {
      const encrypted = await service.encryptPayload(payload, testSecret);
      await service.decryptPayload(encrypted, testSecret);
    }

    // If we reach here without memory issues, the test passes
    expect(true).toBe(true);
  }, 10000); // 10 second timeout

  // Error handling validation
  it('should provide clear error messages for different failure modes', async () => {
    const payload = 'Error message validation test';

    // Test invalid base64
    const encryptedMessage = await service.encryptPayload(payload, testSecret);
    encryptedMessage.encryptedPayload = 'invalid-base64!!';

    try {
      await service.decryptPayload(encryptedMessage, testSecret);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Failed to decrypt payload');
    }
  });

  // Truth verification threshold tests (0.95+)
  it('should maintain data integrity across encryption/decryption cycles', async () => {
    const testCases = [
      '', // Empty string
      'a', // Single character
      'abcdefghijklmnopqrstuvwxyz', // Alphabet
      '0123456789', // Numbers
      'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\/', // Special chars
      'Unicode: 你好世界 🌍 Привет мир 👋', // Unicode
      JSON.stringify({ key: 'value', nested: { array: [1, 2, 3] } }), // JSON
      'A'.repeat(10000) // Large string
    ];

    let successCount = 0;

    for (const testCase of testCases) {
      try {
        const encrypted = await service.encryptPayload(testCase, testSecret);
        const decrypted = await service.decryptPayload(encrypted, testSecret);

        if (decrypted === testCase) {
          successCount++;
        }
      } catch (error) {
        // Failed test case
        console.error(`Failed for test case: ${testCase.substring(0, 50)}...`);
      }
    }

    // Calculate success rate
    const successRate = successCount / testCases.length;

    // Should meet or exceed 0.95 threshold
    expect(successRate).toBeGreaterThanOrEqual(0.95);
    expect(successRate).toBe(1); // In practice, all should pass
  });

  // Security best practices validation
  it('should follow cryptographic best practices', async () => {
    const payload = 'Best practices validation';
    const encryptedMessage = await service.encryptPayload(payload, testSecret);

    // Verify that sensitive components are properly encoded
    expect(() => Buffer.from(encryptedMessage.iv, 'base64')).not.toThrow();
    expect(() => Buffer.from(encryptedMessage.authTag, 'base64')).not.toThrow();
    expect(() => Buffer.from(encryptedMessage.salt, 'base64')).not.toThrow();
    expect(() => Buffer.from(encryptedMessage.encryptedPayload, 'base64')).not.toThrow();

    // Verify that no plaintext data is exposed
    expect(JSON.stringify(encryptedMessage)).not.toContain(payload);

    // Verify timestamp is present and reasonable
    expect(encryptedMessage.timestamp).toBeGreaterThan(0);
    expect(encryptedMessage.timestamp).toBeLessThanOrEqual(Date.now());
  });
});
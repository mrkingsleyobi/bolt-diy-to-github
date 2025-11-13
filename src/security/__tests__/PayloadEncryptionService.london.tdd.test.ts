import { PayloadEncryptionService } from '../PayloadEncryptionService';
import { EncryptedMessage } from '../PayloadEncryptionService.types';

describe('PayloadEncryptionService', () => {
  let service: PayloadEncryptionService;
  const testSecret = 'test-secret-key-for-aes-encryption';
  const testPayload = 'This is a sensitive message that needs encryption';

  beforeEach(() => {
    jest.useFakeTimers();
    service = new PayloadEncryptionService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Test basic interface compliance
  it('should have required methods', () => {
    expect(typeof service.encryptPayload).toBe('function');
    expect(typeof service.decryptPayload).toBe('function');
    expect(typeof service.setExpirationTime).toBe('function');
    expect(typeof service.getExpirationTime).toBe('function');
  });

  // Test successful encryption and decryption
  it('should encrypt and decrypt a payload successfully', async () => {
    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);
    const decryptedPayload = await service.decryptPayload(encryptedMessage, testSecret);

    expect(decryptedPayload).toBe(testPayload);
  });

  // Test encrypted message structure
  it('should produce encrypted message with correct structure', async () => {
    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);

    expect(encryptedMessage).toHaveProperty('encryptedPayload');
    expect(encryptedMessage).toHaveProperty('iv');
    expect(encryptedMessage).toHaveProperty('authTag');
    expect(encryptedMessage).toHaveProperty('salt');
    expect(encryptedMessage).toHaveProperty('timestamp');

    expect(typeof encryptedMessage.encryptedPayload).toBe('string');
    expect(typeof encryptedMessage.iv).toBe('string');
    expect(typeof encryptedMessage.authTag).toBe('string');
    expect(typeof encryptedMessage.salt).toBe('string');
    expect(typeof encryptedMessage.timestamp).toBe('number');

    // Verify base64 encoding
    expect(() => Buffer.from(encryptedMessage.encryptedPayload, 'base64')).not.toThrow();
    expect(() => Buffer.from(encryptedMessage.iv, 'base64')).not.toThrow();
    expect(() => Buffer.from(encryptedMessage.authTag, 'base64')).not.toThrow();
    expect(() => Buffer.from(encryptedMessage.salt, 'base64')).not.toThrow();
  });

  // Test that different payloads produce different encrypted results
  it('should produce different encrypted results for different payloads', async () => {
    const payload1 = 'Message 1';
    const payload2 = 'Message 2';

    const encrypted1 = await service.encryptPayload(payload1, testSecret);
    const encrypted2 = await service.encryptPayload(payload2, testSecret);

    expect(encrypted1.encryptedPayload).not.toBe(encrypted2.encryptedPayload);
  });

  // Test that same payload with same secret produces consistent structure (but different IV)
  it('should produce different IVs for same payload', async () => {
    const encrypted1 = await service.encryptPayload(testPayload, testSecret);
    const encrypted2 = await service.encryptPayload(testPayload, testSecret);

    expect(encrypted1.iv).not.toBe(encrypted2.iv);
    expect(encrypted1.encryptedPayload).not.toBe(encrypted2.encryptedPayload);
    expect(encrypted1.authTag).not.toBe(encrypted2.authTag);
    expect(encrypted1.salt).not.toBe(encrypted2.salt);
  });

  // Test decryption with wrong secret
  it('should reject decryption with wrong secret', async () => {
    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);
    const wrongSecret = 'wrong-secret-key';

    await expect(service.decryptPayload(encryptedMessage, wrongSecret))
      .rejects.toThrow('Failed to decrypt payload');
  });

  // Test decryption with corrupted data
  it('should reject decryption with corrupted encrypted payload', async () => {
    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);
    encryptedMessage.encryptedPayload = 'corrupted-data';

    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Failed to decrypt payload');
  });

  // Test decryption with corrupted IV
  it('should reject decryption with corrupted IV', async () => {
    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);
    encryptedMessage.iv = 'invalid-base64';

    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Failed to decrypt payload');
  });

  // Test decryption with corrupted auth tag
  it('should reject decryption with corrupted auth tag', async () => {
    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);
    encryptedMessage.authTag = 'invalid-base64';

    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Failed to decrypt payload');
  });

  // Test decryption with corrupted salt
  it('should reject decryption with corrupted salt', async () => {
    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);
    encryptedMessage.salt = 'invalid-base64';

    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Failed to decrypt payload');
  });

  // Test expiration functionality
  it('should reject expired messages', async () => {
    // Set short expiration for testing
    service.setExpirationTime(100); // 100ms

    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);

    // Advance time beyond expiration
    jest.advanceTimersByTime(200);

    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Encrypted message has expired');
  });

  // Test that messages are valid before expiration
  it('should accept non-expired messages', async () => {
    // Set short expiration for testing
    service.setExpirationTime(1000); // 1s

    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);

    // Advance time but not beyond expiration
    jest.advanceTimersByTime(500);

    const decryptedPayload = await service.decryptPayload(encryptedMessage, testSecret);
    expect(decryptedPayload).toBe(testPayload);
  });

  // Test disabling expiration
  it('should accept expired messages when expiration is disabled', async () => {
    // Disable expiration
    service.setExpirationTime(0);

    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);

    // Advance time significantly
    jest.advanceTimersByTime(1000000); // 1000 seconds

    const decryptedPayload = await service.decryptPayload(encryptedMessage, testSecret);
    expect(decryptedPayload).toBe(testPayload);
  });

  // Test expiration time getter and setter
  it('should correctly set and get expiration time', () => {
    const newExpirationTime = 300000; // 5 minutes
    service.setExpirationTime(newExpirationTime);
    expect(service.getExpirationTime()).toBe(newExpirationTime);
  });

  // Test that expiration time cannot be negative
  it('should reject negative expiration time', () => {
    expect(() => service.setExpirationTime(-1000))
      .toThrow('Expiration time must be non-negative');
  });

  // Test encryption with empty payload
  it('should encrypt and decrypt empty payload', async () => {
    const emptyPayload = '';
    const encryptedMessage = await service.encryptPayload(emptyPayload, testSecret);
    const decryptedPayload = await service.decryptPayload(encryptedMessage, testSecret);

    expect(decryptedPayload).toBe(emptyPayload);
  });

  // Test encryption with special characters
  it('should encrypt and decrypt payload with special characters', async () => {
    const specialPayload = 'Test with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\/';
    const encryptedMessage = await service.encryptPayload(specialPayload, testSecret);
    const decryptedPayload = await service.decryptPayload(encryptedMessage, testSecret);

    expect(decryptedPayload).toBe(specialPayload);
  });

  // Test encryption with unicode characters
  it('should encrypt and decrypt payload with unicode characters', async () => {
    const unicodePayload = 'Test with unicode: 你好世界 🌍 Привет мир 👋';
    const encryptedMessage = await service.encryptPayload(unicodePayload, testSecret);
    const decryptedPayload = await service.decryptPayload(encryptedMessage, testSecret);

    expect(decryptedPayload).toBe(unicodePayload);
  });

  // Test encryption with large payload
  it('should encrypt and decrypt large payload', async () => {
    const largePayload = 'A'.repeat(10000); // 10KB payload
    const encryptedMessage = await service.encryptPayload(largePayload, testSecret);
    const decryptedPayload = await service.decryptPayload(encryptedMessage, testSecret);

    expect(decryptedPayload).toBe(largePayload);
  });

  // Test invalid inputs for encryption
  it('should reject encryption with invalid payload type', async () => {
    // @ts-ignore - Testing invalid input
    await expect(service.encryptPayload(null, testSecret))
      .rejects.toThrow('Payload must be a string');

    // @ts-ignore - Testing invalid input
    await expect(service.encryptPayload(123, testSecret))
      .rejects.toThrow('Payload must be a string');

    // @ts-ignore - Testing invalid input
    await expect(service.encryptPayload({}, testSecret))
      .rejects.toThrow('Payload must be a string');
  });

  // Test invalid inputs for encryption secret
  it('should reject encryption with invalid secret', async () => {
    await expect(service.encryptPayload(testPayload, ''))
      .rejects.toThrow('Secret must be a non-empty string');

    // @ts-ignore - Testing invalid input
    await expect(service.encryptPayload(testPayload, null))
      .rejects.toThrow('Secret must be a non-empty string');

    // @ts-ignore - Testing invalid input
    await expect(service.encryptPayload(testPayload, undefined))
      .rejects.toThrow('Secret must be a non-empty string');
  });

  // Test invalid inputs for decryption
  it('should reject decryption with invalid encrypted message', async () => {
    await expect(service.decryptPayload(null as unknown as EncryptedMessage, testSecret))
      .rejects.toThrow('Encrypted message is required');

    await expect(service.decryptPayload(undefined as unknown as EncryptedMessage, testSecret))
      .rejects.toThrow('Encrypted message is required');
  });

  // Test invalid inputs for decryption secret
  it('should reject decryption with invalid secret', async () => {
    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);

    await expect(service.decryptPayload(encryptedMessage, ''))
      .rejects.toThrow('Secret must be a non-empty string');

    // @ts-ignore - Testing invalid input
    await expect(service.decryptPayload(encryptedMessage, null))
      .rejects.toThrow('Secret must be a non-empty string');

    // @ts-ignore - Testing invalid input
    await expect(service.decryptPayload(encryptedMessage, undefined))
      .rejects.toThrow('Secret must be a non-empty string');
  });

  // Test invalid message structure
  it('should reject decryption with invalid message structure', async () => {
    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);

    // Test missing encryptedPayload
    const missingPayload = { ...encryptedMessage };
    // @ts-ignore - Testing invalid structure
    delete missingPayload.encryptedPayload;
    await expect(service.decryptPayload(missingPayload, testSecret))
      .rejects.toThrow('Invalid encrypted message format');

    // Test missing IV
    const missingIV = { ...encryptedMessage };
    // @ts-ignore - Testing invalid structure
    delete missingIV.iv;
    await expect(service.decryptPayload(missingIV, testSecret))
      .rejects.toThrow('Invalid encrypted message format');

    // Test missing authTag
    const missingAuthTag = { ...encryptedMessage };
    // @ts-ignore - Testing invalid structure
    delete missingAuthTag.authTag;
    await expect(service.decryptPayload(missingAuthTag, testSecret))
      .rejects.toThrow('Invalid encrypted message format');

    // Test missing salt
    const missingSalt = { ...encryptedMessage };
    // @ts-ignore - Testing invalid structure
    delete missingSalt.salt;
    await expect(service.decryptPayload(missingSalt, testSecret))
      .rejects.toThrow('Invalid encrypted message format');
  });

  // Test invalid timestamp
  it('should reject decryption with invalid timestamp', async () => {
    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);

    // Test non-numeric timestamp
    // @ts-ignore - Testing invalid timestamp
    encryptedMessage.timestamp = 'invalid';
    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Invalid timestamp in encrypted message');

    // Test NaN timestamp
    // @ts-ignore - Testing invalid timestamp
    encryptedMessage.timestamp = NaN;
    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Invalid timestamp in encrypted message');
  });

  // Test future timestamp (with tolerance)
  it('should reject decryption with future timestamp beyond tolerance', async () => {
    const encryptedMessage = await service.encryptPayload(testPayload, testSecret);

    // Set timestamp far in the future (beyond 1-minute tolerance)
    encryptedMessage.timestamp = Date.now() + 5 * 60 * 1000; // 5 minutes in future

    await expect(service.decryptPayload(encryptedMessage, testSecret))
      .rejects.toThrow('Encrypted message has expired');
  });
});
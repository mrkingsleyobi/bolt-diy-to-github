import * as crypto from 'crypto';
import { EncryptedMessage, PayloadEncryptionService as IPayloadEncryptionService } from './PayloadEncryptionService.types';

/**
 * Service for payload encryption using AES-256-GCM
 * Provides encryption and decryption capabilities for cross-origin communication
 */
export class PayloadEncryptionService implements IPayloadEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12;  // 96 bits recommended for GCM
  private readonly authTagLength = 16;
  private readonly saltLength = 16;
  private expirationTimeMs: number = 5 * 60 * 1000; // 5 minutes default

  /**
   * Encrypts a message payload using AES-256-GCM
   * @param payload - The payload to encrypt
   * @param secret - The secret key for encryption
   * @returns EncryptedMessage containing encrypted payload and metadata
   */
  async encryptPayload(payload: string, secret: string): Promise<EncryptedMessage> {
    // Validate inputs
    if (typeof payload !== 'string') {
      throw new Error('Payload must be a string');
    }
    if (typeof secret !== 'string' || secret.length === 0) {
      throw new Error('Secret must be a non-empty string');
    }

    // Generate a random salt and IV
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);

    // Derive the encryption key using PBKDF2
    const key = await this.deriveKey(secret, salt);

    // Create the cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    // Encrypt the payload
    let encrypted = cipher.update(payload, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    // Create timestamp
    const timestamp = Date.now();

    return {
      encryptedPayload: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: salt.toString('base64'),
      timestamp
    };
  }

  /**
   * Decrypts an encrypted message using AES-256-GCM
   * @param encryptedMessage - The encrypted message to decrypt
   * @param secret - The secret key for decryption
   * @returns The decrypted payload as a string
   * @throws Error if decryption fails or message is expired
   */
  async decryptPayload(encryptedMessage: EncryptedMessage, secret: string): Promise<string> {
    // Validate inputs
    if (!encryptedMessage) {
      throw new Error('Encrypted message is required');
    }
    if (typeof secret !== 'string' || secret.length === 0) {
      throw new Error('Secret must be a non-empty string');
    }

    try {
      // Validate message structure
      if (typeof encryptedMessage.encryptedPayload !== 'string' ||
          typeof encryptedMessage.iv !== 'string' ||
          typeof encryptedMessage.authTag !== 'string' ||
          typeof encryptedMessage.salt !== 'string') {
        throw new Error('Invalid encrypted message format');
      }

      // Parse timestamp
      const timestamp = encryptedMessage.timestamp;
      if (typeof timestamp !== 'number' || isNaN(timestamp)) {
        throw new Error('Invalid timestamp in encrypted message');
      }

      // Check expiration
      if (!this.isTimestampValid(timestamp)) {
        throw new Error('Encrypted message has expired');
      }

      // Convert base64 strings back to buffers
      const encryptedData = Buffer.from(encryptedMessage.encryptedPayload, 'base64');
      const iv = Buffer.from(encryptedMessage.iv, 'base64');
      const authTag = Buffer.from(encryptedMessage.authTag, 'base64');
      const salt = Buffer.from(encryptedMessage.salt, 'base64');

      // Validate buffer lengths
      if (iv.length !== this.ivLength) {
        throw new Error('Invalid IV length');
      }
      if (authTag.length !== this.authTagLength) {
        throw new Error('Invalid authentication tag length');
      }
      if (salt.length !== this.saltLength) {
        throw new Error('Invalid salt length');
      }

      // Derive the decryption key
      const key = await this.deriveKey(secret, salt);

      // Create the decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the payload
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      // Re-throw with a more user-friendly message
      if (error instanceof Error) {
        throw new Error(`Failed to decrypt payload: ${error.message}`);
      }
      throw new Error('Failed to decrypt payload: Unknown error');
    }
  }

  /**
   * Sets the expiration time for encrypted messages
   * @param milliseconds - Expiration time in milliseconds (0 for no expiration)
   */
  setExpirationTime(milliseconds: number): void {
    if (milliseconds < 0) {
      throw new Error('Expiration time must be non-negative');
    }
    this.expirationTimeMs = milliseconds;
  }

  /**
   * Gets the current expiration time
   * @returns Expiration time in milliseconds
   */
  getExpirationTime(): number {
    return this.expirationTimeMs;
  }

  /**
   * Generates a secure encryption key from a secret using PBKDF2
   * @param secret The secret to derive the key from
   * @param salt The salt to use for key derivation
   * @returns A 32-byte encryption key
   */
  private async deriveKey(secret: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(secret, salt, 100000, this.keyLength, 'sha256', (err, key) => {
        if (err) reject(err);
        else resolve(key);
      });
    });
  }

  /**
   * Validates that a timestamp is within the allowed time window
   * @param timestamp - The timestamp to validate
   * @returns boolean indicating if timestamp is valid
   */
  private isTimestampValid(timestamp: number): boolean {
    // If expiration is disabled (0), always return true
    if (this.expirationTimeMs === 0) {
      return true;
    }

    // Validate timestamp is a number
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
      return false;
    }

    // Check that timestamp is not in the future (with small tolerance)
    const now = Date.now();
    if (timestamp > now + 60 * 1000) { // 1 minute tolerance for clock skew
      return false;
    }

    // Check that timestamp is not too old
    return (now - timestamp) <= this.expirationTimeMs;
  }
}
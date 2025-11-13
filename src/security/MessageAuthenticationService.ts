import { SignedMessage, MessageAuthenticationService as IMessageAuthenticationService } from './MessageAuthenticationService.types';
import * as crypto from 'crypto';

/**
 * Service for message authentication using HMAC-SHA256
 * Provides signing and verification capabilities for cross-origin communication
 */
export class MessageAuthenticationService implements IMessageAuthenticationService {
  private secretKey: string | null = null;
  private expirationTimeMs: number = 5 * 60 * 1000; // 5 minutes default

  /**
   * Signs a message with HMAC-SHA256
   * @param message - The message to sign
   * @returns SignedMessage containing payload, signature, and timestamp
   * @throws Error if secret key is not set
   */
  signMessage(message: string): SignedMessage {
    if (!this.secretKey) {
      throw new Error('Secret key not set');
    }

    // Create timestamped payload
    const timestamp = Date.now();
    const payloadObj = { message, timestamp };
    const payload = JSON.stringify(payloadObj);

    // Generate HMAC-SHA256 signature
    const signature = crypto.createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');

    return { payload, signature, timestamp };
  }

  /**
   * Verifies a signed message
   * @param signedMessage - The signed message to verify
   * @returns boolean indicating if the signature is valid and not expired
   * @throws Error if secret key is not set
   */
  verifyMessage(signedMessage: SignedMessage): boolean {
    if (!this.secretKey) {
      throw new Error('Secret key not set');
    }

    try {
      // Parse the payload
      const payloadObj = JSON.parse(signedMessage.payload);

      // Validate timestamp format
      if (typeof payloadObj.timestamp !== 'number' || isNaN(payloadObj.timestamp)) {
        return false;
      }

      // Check expiration using enhanced validation
      if (!this.isTimestampValid(payloadObj.timestamp)) {
        return false;
      }

      // Generate expected signature
      const expectedSignature = crypto.createHmac('sha256', this.secretKey)
        .update(signedMessage.payload)
        .digest('hex');

      // Use constant-time comparison to prevent timing attacks
      return this.constantTimeCompare(expectedSignature, signedMessage.signature);
    } catch (error) {
      // Any parsing error or other exception means invalid message
      return false;
    }
  }

  /**
   * Sets the secret key used for signing and verification
   * @param key - The secret key
   * @throws Error if key is invalid
   */
  setSecretKey(key: string): void {
    // Validate input
    if (typeof key !== 'string') {
      throw new Error('Secret key must be a string');
    }
    if (key.length === 0) {
      throw new Error('Secret key cannot be empty');
    }

    // Store the key
    this.secretKey = key;
  }

  /**
   * Sets the expiration time for signed messages
   * @param milliseconds - Expiration time in milliseconds
   * @throws Error if milliseconds is not positive
   */
  setExpirationTime(milliseconds: number): void {
    if (milliseconds <= 0) {
      throw new Error('Expiration time must be positive');
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
   * Validates that a timestamp is within the allowed time window
   * @param timestamp - The timestamp to validate
   * @returns boolean indicating if timestamp is valid
   */
  private isTimestampValid(timestamp: number): boolean {
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

  /**
   * Compares two strings in constant time to prevent timing attacks
   * @param a - First string
   * @param b - Second string
   * @returns boolean indicating if strings are equal
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}
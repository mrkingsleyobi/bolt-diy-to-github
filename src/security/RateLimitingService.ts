import { MessageAuthenticationService } from './MessageAuthenticationService';
import { PayloadEncryptionService } from './PayloadEncryptionService';

/**
 * Token Bucket Rate Limiting Service
 * Implements the token bucket algorithm for rate limiting cross-origin communication
 */
export class RateLimitingService {
  private bucketSize: number;
  private refillRate: number; // tokens per second
  private tokens: number;
  private lastRefill: number;
  private secretKey: string;

  /**
   * Creates a new RateLimitingService instance
   * @param bucketSize Maximum number of tokens in the bucket
   * @param refillRate Rate at which tokens are added to the bucket (tokens/second)
   * @param secretKey Secret key for message authentication
   */
  constructor(bucketSize: number = 10, refillRate: number = 1, secretKey: string = '') {
    this.bucketSize = bucketSize;
    this.refillRate = refillRate;
    this.tokens = bucketSize;
    this.lastRefill = Date.now();
    this.secretKey = secretKey;
  }

  /**
   * Attempts to consume tokens from the bucket
   * @param tokens Number of tokens to consume
   * @returns boolean indicating if tokens were successfully consumed
   */
  consume(tokens: number = 1): boolean {
    this.refillTokens();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Refills the token bucket based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;

    if (elapsedSeconds > 0) {
      const newTokens = Math.floor(elapsedSeconds * this.refillRate);
      this.tokens = Math.min(this.bucketSize, this.tokens + newTokens);
      this.lastRefill = now;
    }
  }

  /**
   * Gets the current number of available tokens
   * @returns number of available tokens
   */
  getAvailableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }

  /**
   * Gets the bucket size
   * @returns bucket size
   */
  getBucketSize(): number {
    return this.bucketSize;
  }

  /**
   * Gets the refill rate
   * @returns refill rate in tokens per second
   */
  getRefillRate(): number {
    return this.refillRate;
  }

  /**
   * Updates the bucket configuration
   * @param bucketSize New bucket size
   * @param refillRate New refill rate
   */
  updateConfiguration(bucketSize: number, refillRate: number): void {
    if (bucketSize <= 0 || refillRate <= 0) {
      throw new Error('Bucket size and refill rate must be positive');
    }

    this.bucketSize = bucketSize;
    this.refillRate = refillRate;
    this.tokens = Math.min(this.tokens, bucketSize);
  }

  /**
   * Sets the secret key for message authentication
   * @param secretKey Secret key for HMAC-SHA256 authentication
   */
  setSecretKey(secretKey: string): void {
    if (typeof secretKey !== 'string') {
      throw new Error('Secret key must be a string');
    }
    this.secretKey = secretKey;
  }

  /**
   * Gets the current secret key
   * @returns current secret key
   */
  getSecretKey(): string {
    return this.secretKey;
  }

  /**
   * Creates a rate limit token with expiration
   * @param payload Data to include in the token
   * @param expirationMinutes Expiration time in minutes
   * @returns signed token with expiration
   */
  createRateLimitToken(payload: any, expirationMinutes: number = 5): string {
    if (!this.secretKey) {
      throw new Error('Secret key not set');
    }

    const authService = new MessageAuthenticationService();
    authService.setSecretKey(this.secretKey);
    // Set expiration time to a very long time since we handle expiration ourselves
    authService.setExpirationTime(24 * 60 * 60 * 1000); // 24 hours

    // Create our token data with expiration
    const tokenData = {
      payload,
      timestamp: Date.now(),
      expiration: Date.now() + (expirationMinutes * 60 * 1000)
    };

    // Create a message that includes our token data
    const message = JSON.stringify(tokenData);

    // Sign the message (this will create a payload with the message and its own timestamp)
    const signedMessage = authService.signMessage(message);

    // Return the signed message as JSON string
    return JSON.stringify(signedMessage);
  }

  /**
   * Validates a rate limit token
   * @param token Token to validate
   * @returns boolean indicating if token is valid
   */
  validateRateLimitToken(token: string): boolean {
    if (!this.secretKey) {
      throw new Error('Secret key not set');
    }

    try {
      const signedMessage = JSON.parse(token);
      const authService = new MessageAuthenticationService();
      authService.setSecretKey(this.secretKey);

      // First verify the signature and basic timestamp
      if (!authService.verifyMessage(signedMessage)) {
        return false;
      }

      // Parse the payload to get our original token data
      // The payload contains {message: originalTokenDataString, timestamp: authServiceTimestamp}
      const payloadObj = JSON.parse(signedMessage.payload);
      const tokenData = JSON.parse(payloadObj.message);

      // Then check our custom expiration
      if (tokenData.expiration && typeof tokenData.expiration === 'number') {
        return Date.now() <= tokenData.expiration;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypts data with rate limit metadata
   * @param data Data to encrypt
   * @param secret Encryption secret
   * @returns encrypted data with rate limit metadata
   */
  async encryptWithRateLimit(data: string, secret: string): Promise<string> {
    try {
      const payloadEncryptionService = new PayloadEncryptionService();
      const encryptedMessage = await payloadEncryptionService.encryptPayload(data, secret);

      // Add rate limit metadata
      const rateLimitData = {
        encryptedMessage,
        rateLimitInfo: {
          tokens: this.getAvailableTokens(),
          bucketSize: this.getBucketSize(),
          refillRate: this.getRefillRate(),
          timestamp: Date.now()
        }
      };

      return JSON.stringify(rateLimitData);
    } catch (error: any) {
      // Re-throw the error to ensure proper error propagation
      throw error;
    }
  }

  /**
   * Decrypts data and validates rate limit
   * @param encryptedData Encrypted data with rate limit metadata
   * @param secret Decryption secret
   * @returns decrypted data
   */
  async decryptWithRateLimit(encryptedData: string, secret: string): Promise<string> {
    try {
      const rateLimitData = JSON.parse(encryptedData);
      const payloadEncryptionService = new PayloadEncryptionService();
      const decryptedData = await payloadEncryptionService.decryptPayload(
        rateLimitData.encryptedMessage,
        secret
      );

      // Update local rate limit info if provided
      if (rateLimitData.rateLimitInfo) {
        const { bucketSize, refillRate } = rateLimitData.rateLimitInfo;
        if (bucketSize && refillRate && bucketSize > 0 && refillRate > 0) {
          this.updateConfiguration(bucketSize, refillRate);
        }
      }

      return decryptedData;
    } catch (error: any) {
      throw new Error(`Failed to decrypt with rate limit: ${error.message}`);
    }
  }
}
/**
 * Token Bucket Rate Limiting Service
 * Implements the token bucket algorithm for rate limiting cross-origin communication
 */
export declare class RateLimitingService {
    private bucketSize;
    private refillRate;
    private tokens;
    private lastRefill;
    private secretKey;
    /**
     * Creates a new RateLimitingService instance
     * @param bucketSize Maximum number of tokens in the bucket
     * @param refillRate Rate at which tokens are added to the bucket (tokens/second)
     * @param secretKey Secret key for message authentication
     */
    constructor(bucketSize?: number, refillRate?: number, secretKey?: string);
    /**
     * Attempts to consume tokens from the bucket
     * @param tokens Number of tokens to consume
     * @returns boolean indicating if tokens were successfully consumed
     */
    consume(tokens?: number): boolean;
    /**
     * Refills the token bucket based on elapsed time
     */
    private refillTokens;
    /**
     * Gets the current number of available tokens
     * @returns number of available tokens
     */
    getAvailableTokens(): number;
    /**
     * Gets the bucket size
     * @returns bucket size
     */
    getBucketSize(): number;
    /**
     * Gets the refill rate
     * @returns refill rate in tokens per second
     */
    getRefillRate(): number;
    /**
     * Updates the bucket configuration
     * @param bucketSize New bucket size
     * @param refillRate New refill rate
     */
    updateConfiguration(bucketSize: number, refillRate: number): void;
    /**
     * Sets the secret key for message authentication
     * @param secretKey Secret key for HMAC-SHA256 authentication
     */
    setSecretKey(secretKey: string): void;
    /**
     * Gets the current secret key
     * @returns current secret key
     */
    getSecretKey(): string;
    /**
     * Creates a rate limit token with expiration
     * @param payload Data to include in the token
     * @param expirationMinutes Expiration time in minutes
     * @returns signed token with expiration
     */
    createRateLimitToken(payload: any, expirationMinutes?: number): string;
    /**
     * Validates a rate limit token
     * @param token Token to validate
     * @returns boolean indicating if token is valid
     */
    validateRateLimitToken(token: string): boolean;
    /**
     * Encrypts data with rate limit metadata
     * @param data Data to encrypt
     * @param secret Encryption secret
     * @returns encrypted data with rate limit metadata
     */
    encryptWithRateLimit(data: string, secret: string): Promise<string>;
    /**
     * Decrypts data and validates rate limit
     * @param encryptedData Encrypted data with rate limit metadata
     * @param secret Decryption secret
     * @returns decrypted data
     */
    decryptWithRateLimit(encryptedData: string, secret: string): Promise<string>;
}
//# sourceMappingURL=RateLimitingService.d.ts.map
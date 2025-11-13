/**
 * Represents an encrypted message with all necessary components for decryption
 */
export interface EncryptedMessage {
    /**
     * The encrypted payload as a base64 string
     */
    encryptedPayload: string;
    /**
     * The initialization vector as a base64 string
     */
    iv: string;
    /**
     * The authentication tag as a base64 string
     */
    authTag: string;
    /**
     * The salt used for key derivation as a base64 string
     */
    salt: string;
    /**
     * Unix timestamp when the message was encrypted (milliseconds)
     */
    timestamp: number;
}
/**
 * Service interface for payload encryption using AES-256-GCM
 */
export interface PayloadEncryptionService {
    /**
     * Encrypts a message payload using AES-256-GCM
     * @param payload - The payload to encrypt
     * @param secret - The secret key for encryption
     * @returns EncryptedMessage containing encrypted payload and metadata
     */
    encryptPayload(payload: string, secret: string): Promise<EncryptedMessage>;
    /**
     * Decrypts an encrypted message using AES-256-GCM
     * @param encryptedMessage - The encrypted message to decrypt
     * @param secret - The secret key for decryption
     * @returns The decrypted payload as a string
     * @throws Error if decryption fails or message is expired
     */
    decryptPayload(encryptedMessage: EncryptedMessage, secret: string): Promise<string>;
    /**
     * Sets the expiration time for encrypted messages
     * @param milliseconds - Expiration time in milliseconds (0 for no expiration)
     */
    setExpirationTime(milliseconds: number): void;
    /**
     * Gets the current expiration time
     * @returns Expiration time in milliseconds
     */
    getExpirationTime(): number;
}
//# sourceMappingURL=PayloadEncryptionService.types.d.ts.map
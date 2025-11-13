import { EncryptedMessage, PayloadEncryptionService as IPayloadEncryptionService } from './PayloadEncryptionService.types';
/**
 * Service for payload encryption using AES-256-GCM
 * Provides encryption and decryption capabilities for cross-origin communication
 */
export declare class PayloadEncryptionService implements IPayloadEncryptionService {
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    private readonly authTagLength;
    private readonly saltLength;
    private expirationTimeMs;
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
    /**
     * Generates a secure encryption key from a secret using PBKDF2
     * @param secret The secret to derive the key from
     * @param salt The salt to use for key derivation
     * @returns A 32-byte encryption key
     */
    private deriveKey;
    /**
     * Validates that a timestamp is within the allowed time window
     * @param timestamp - The timestamp to validate
     * @returns boolean indicating if timestamp is valid
     */
    private isTimestampValid;
}
//# sourceMappingURL=PayloadEncryptionService.d.ts.map